import { config } from './config.js';
import {
  initializeDatabase,
  saveVideo,
  saveComment,
  closeDatabase,
  hasVideoBeenProcessed,
  getStatistics,
  flushDatabase,
} from './database.js';
import { classifyCommentsBatch } from './jev-classifier.js';
import { getChannelVideos, getVideoComments } from './youtube-scraper.js';
import { startServer } from './server.js';

// Pass --force (or FORCE_RESCRAPE=1) to re-classify videos that were already processed
const FORCE_RESCRAPE = process.argv.includes('--force') || process.env.FORCE_RESCRAPE === '1';

async function main() {
  console.log('🚀 YouTube Clinic Classifier - Starting...\n');

  // Initialize database (loads any previously saved data from disk)
  console.log('📦 Cargando base de datos...');
  await initializeDatabase();
  const existingStats = getStatistics();
  if (existingStats.totalComments > 0) {
    console.log(
      `✅ Ya hay ${existingStats.totalVideos} videos / ${existingStats.totalComments} comentarios guardados de una sesión anterior.`
    );
    console.log(
      FORCE_RESCRAPE
        ? '🔁 --force activado: se reprocesarán todos los videos de nuevo.\n'
        : '⏭️  Los videos ya procesados se omitirán (usa --force para reprocesarlos).\n'
    );
  }

  // Start API server
  console.log('🌐 Starting dashboard server...');
  await startServer(config.app.port);

  try {
    // Fetch latest videos
    console.log(`📹 Fetching latest ${config.scraper.maxVideos} videos...`);
    const videos = await getChannelVideos(
      config.youtube.channelHandle,
      config.scraper.maxVideos
    );
    console.log(`✅ Found ${videos.length} videos\n`);

    // Process each video
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[${i + 1}/${videos.length}] Processing: ${video.title}`);
      console.log(`${'='.repeat(60)}`);

      if (!FORCE_RESCRAPE && hasVideoBeenProcessed(video.id)) {
        console.log('⏭️  Ya procesado anteriormente, se omite (usa --force para reprocesar)\n');
        continue;
      }

      try {
        // Get comments for this video
        console.log(`\n📝 Fetching comments...`);
        const comments = await getVideoComments(
          video.id,
          config.scraper.maxCommentsPerVideo
        );
        console.log(`✅ Found ${comments.length} comments\n`);

        if (comments.length === 0) {
          console.log('⏭️  No comments to classify, skipping...\n');
          continue;
        }

        // Extract comment texts for classification
        const commentTexts = comments.map((c) => c.text);

        // Classify all comments with Jev
        console.log(`🤖 Classifying comments with Jev model...\n`);
        const classifications = await classifyCommentsBatch(commentTexts, 1000);

        // Prepare video stats
        let clinicInquiries = 0;
        let totalConfidence = 0;

        // Save each comment with its classification
        for (let j = 0; j < comments.length; j++) {
          const comment = comments[j];
          const classification = classifications[j];

          saveComment({
            id: comment.id,
            videoId: video.id,
            author: comment.author,
            text: comment.text,
            likes: comment.likes,
            isClinicInquiry: classification.is_clinic_inquiry,
            inquiryType: classification.inquiry_type,
            confidence: classification.confidence,
            createdAt: comment.publishedAt,
          });

          if (classification.is_clinic_inquiry) {
            clinicInquiries++;
          }
          totalConfidence += classification.confidence;

          // Display result
          const emoji = classification.is_clinic_inquiry ? '🏥' : '💬';
          const confidence = (classification.confidence * 100).toFixed(1);
          const typeLabel = classification.inquiry_type && classification.inquiry_type !== 'no_aplica'
            ? ` [${classification.inquiry_type}]`
            : '';
          console.log(
            `${emoji} [${confidence}%]${typeLabel} ${comment.author}: ${comment.text.substring(0, 50)}...`
          );
        }

        // Save video with stats
        const avgConfidence = totalConfidence / comments.length;
        saveVideo({
          id: video.id,
          title: video.title,
          description: video.description,
          publishedAt: video.publishedAt,
          videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
          viewCount: video.viewCount,
          totalComments: comments.length,
          clinicInquiries,
          otherComments: comments.length - clinicInquiries,
          averageConfidence: avgConfidence,
        });

        // Persist immediately: if the process is interrupted on the next
        // video, this video's data (and everything before it) is safe.
        flushDatabase();

        // Summary for this video
        console.log(`\n📊 Video Summary:`);
        console.log(`   Total comments: ${comments.length}`);
        console.log(`   Clinic inquiries: ${clinicInquiries} (${((clinicInquiries / comments.length) * 100).toFixed(1)}%)`);
        console.log(`   Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
        console.log(`   💾 Guardado en disco\n`);
      } catch (error) {
        console.error(`❌ Error processing video: ${error}`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ All videos processed successfully!');
    console.log(`${'='.repeat(60)}\n`);
    console.log(`📊 View results at: http://localhost:${config.app.port}`);
    console.log('Press Ctrl+C to exit\n');

    // Keep server running
    await new Promise(() => {});
  } catch (error) {
    console.error('❌ Fatal error:', error);
    closeDatabase();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  closeDatabase();
  process.exit(0);
});

// Run main
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  closeDatabase();
  process.exit(1);
});
