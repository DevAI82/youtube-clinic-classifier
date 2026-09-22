import axios from 'axios';
import { config } from './config.js';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  channelTitle: string;
  viewCount: number;
  likeCount?: number;
  commentCount: number;
}

export interface YouTubeComment {
  id: string;
  videoId: string;
  author: string;
  text: string;
  likes: number;
  publishedAt: string;
}

/**
 * NOTE: This is a demonstration of the intended scraper structure.
 * In production, you would need:
 * 1. A YouTube Data API key (google-youtube-api)
 * 2. OR use yt-dlp for scraping (requires Python)
 * 
 * For this demo, we'll simulate the data or use alternative methods
 */

const YOUTUBE_API_ENDPOINTS = {
  // These would be used with a YouTube API key if available
  searchChannel: 'https://www.googleapis.com/youtube/v3/search',
  getComments: 'https://www.googleapis.com/youtube/v3/commentThreads',
};

/**
 * Get latest videos from a YouTube channel
 * Uses YouTube Data API v3
 */
export async function getChannelVideos(
  channelHandle: string,
  maxResults: number = 20
): Promise<YouTubeVideo[]> {
  console.log(`\n📹 Fetching latest ${maxResults} videos from ${channelHandle}...`);

  // Check if API key is configured
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
    console.log('⚠️  YOUTUBE_API_KEY no está configurada');
    console.log('📖 Lee: OBTENER_YOUTUBE_API_KEY.md para más información\n');
    return getSimulatedVideos(maxResults);
  }

  try {
    // Step 1: Get channel ID from handle
    const channelSearch = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part: 'snippet',
          q: channelHandle,
          type: 'channel',
          key: YOUTUBE_API_KEY,
          maxResults: 1,
        },
      }
    );

    if (!channelSearch.data.items || channelSearch.data.items.length === 0) {
      console.error(`❌ Channel "${channelHandle}" not found`);
      return getSimulatedVideos(maxResults);
    }

    const channelId = channelSearch.data.items[0].snippet.channelId;
    console.log(`✅ Found channel: ${channelId}\n`);

    // Step 2: Get latest videos from channel
    const videosResponse = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part: 'snippet',
          channelId,
          type: 'video',
          order: 'date',
          key: YOUTUBE_API_KEY,
          maxResults: Math.min(maxResults, 50),
        },
      }
    );

    if (!videosResponse.data.items || videosResponse.data.items.length === 0) {
      console.log('No videos found');
      return getSimulatedVideos(maxResults);
    }

    const videoIds = videosResponse.data.items
      .map((item: any) => item.id.videoId)
      .slice(0, maxResults);

    // Step 3: Get video statistics
    const statsResponse = await axios.get(
      'https://www.googleapis.com/youtube/v3/videos',
      {
        params: {
          part: 'statistics,snippet',
          id: videoIds.join(','),
          key: YOUTUBE_API_KEY,
        },
      }
    );

    const videos: YouTubeVideo[] = statsResponse.data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
      viewCount: parseInt(item.statistics.viewCount || '0'),
      likeCount: parseInt(item.statistics.likeCount || '0'),
      commentCount: parseInt(item.statistics.commentCount || '0'),
    }));

    console.log(`✅ Found ${videos.length} videos\n`);
    return videos;
  } catch (error: any) {
    console.error(`❌ Error fetching videos:`, error.response?.data?.error?.message || error.message);
    console.log('📖 Volviendo a datos simulados...\n');
    return getSimulatedVideos(maxResults);
  }
}

/**
 * Fallback: Return simulated videos
 */
function getSimulatedVideos(maxResults: number): YouTubeVideo[] {
  const mockVideos: YouTubeVideo[] = [
    {
      id: 'video1',
      title: 'Tratamiento de alopecia androgenética - Caso 1',
      description:
        'En este video mostramos un caso real de tratamiento de alopecia androgenética',
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      channelTitle: 'Escuela de Alopecia',
      viewCount: 5000,
      commentCount: 45,
    },
  ];

  for (let i = 2; i <= Math.min(maxResults, 20); i++) {
    mockVideos.push({
      id: `video${i}`,
      title: `Video sobre alopecia - Episodio ${i}`,
      description: `Contenido educativo sobre tratamientos capilares ${i}`,
      publishedAt: new Date(
        Date.now() - (i * 2) * 24 * 60 * 60 * 1000
      ).toISOString(),
      channelTitle: 'Escuela de Alopecia',
      viewCount: Math.floor(Math.random() * 10000),
      commentCount: Math.floor(Math.random() * 100),
    });
  }

  return mockVideos.slice(0, maxResults);
}

/**
 * Get comments for a YouTube video
 * Uses YouTube Data API v3
 */
export async function getVideoComments(
  videoId: string,
  maxResults: number = 100
): Promise<YouTubeComment[]> {
  console.log(`📝 Fetching comments for video ${videoId}...`);

  // Check if API key is configured
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
    return getSimulatedComments(videoId, maxResults);
  }

  try {
    const commentsResponse = await axios.get(
      'https://www.googleapis.com/youtube/v3/commentThreads',
      {
        params: {
          part: 'snippet',
          videoId,
          textFormat: 'plainText',
          key: YOUTUBE_API_KEY,
          maxResults: Math.min(maxResults, 100),
          order: 'relevance',
        },
      }
    );

    if (!commentsResponse.data.items || commentsResponse.data.items.length === 0) {
      console.log(`ℹ️  No comments found for video ${videoId}`);
      return getSimulatedComments(videoId, maxResults);
    }

    const comments: YouTubeComment[] = commentsResponse.data.items
      .map((thread: any) => {
        const snippet = thread.snippet.topLevelComment.snippet;
        return {
          id: thread.id,
          videoId,
          author: snippet.authorDisplayName,
          text: snippet.textDisplay,
          likes: snippet.likeCount,
          publishedAt: snippet.publishedAt,
        };
      })
      .slice(0, maxResults);

    console.log(`✅ Found ${comments.length} comments`);
    return comments;
  } catch (error: any) {
    console.error(`❌ Error fetching comments:`, error.response?.data?.error?.message || error.message);
    return getSimulatedComments(videoId, maxResults);
  }
}

/**
 * Fallback: Return simulated comments
 */
function getSimulatedComments(videoId: string, maxResults: number): YouTubeComment[] {
  const mockComments: YouTubeComment[] = [
    {
      id: `comment_${videoId}_1`,
      videoId,
      author: 'Juan García',
      text: 'Excelente video, me gustaría agendar una consulta. ¿Cuál es el precio?',
      likes: 12,
      publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `comment_${videoId}_2`,
      videoId,
      author: 'María López',
      text: 'Muy interesante la explicación, gracias por compartir',
      likes: 5,
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `comment_${videoId}_3`,
      videoId,
      author: 'Carlos Rodríguez',
      text: '¿Es posible hacer una consulta por telemedicina? Soy de provincia',
      likes: 8,
      publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `comment_${videoId}_4`,
      videoId,
      author: 'Ana Martínez',
      text: 'Hace 6 meses que me cayó el pelo, necesito ayuda urgente',
      likes: 15,
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `comment_${videoId}_5`,
      videoId,
      author: 'Pedro Sánchez',
      text: 'Muy buen contenido, sigan así!',
      likes: 3,
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const adjectives = ['perfecto', 'excelente', 'genial', 'increíble', 'bueno', 'útil', 'interesante'];
  const clinicQueries = [
    'Me gustaría una consulta',
    '¿Cuál es el costo del tratamiento?',
    '¿Cómo agendar una cita?',
    'Necesito asesoramiento',
    '¿Tienen disponibilidad?',
    'Quiero hacer una consulta',
  ];

  for (let i = 6; i <= Math.min(maxResults, 20); i++) {
    const isClinicQuery = Math.random() > 0.5;
    mockComments.push({
      id: `comment_${videoId}_${i}`,
      videoId,
      author: `Usuario ${i}`,
      text: isClinicQuery
        ? clinicQueries[Math.floor(Math.random() * clinicQueries.length)]
        : `${adjectives[Math.floor(Math.random() * adjectives.length)]} video!`,
      likes: Math.floor(Math.random() * 20),
      publishedAt: new Date(Date.now() - (i * 30) * 60 * 1000).toISOString(),
    });
  }

  return mockComments.slice(0, maxResults);
}

/**
 * Get real YouTube API client (requires API key setup)
 * This is a placeholder for future implementation
 */
export function setupYouTubeAPI() {
  // In production, setup would look like:
  // const youtube = google.youtube({
  //   version: 'v3',
  //   auth: YOUTUBE_API_KEY,
  // });

  console.log('YouTube API setup would be configured here in production');
}
