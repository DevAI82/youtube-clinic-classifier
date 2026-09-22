import { initializeDatabase, saveVideo, saveComment, getStatistics, getVideos, flushDatabase } from './src/database.js';
import { startServer } from './src/server.js';

async function runDemo() {
  console.log('\n🎬 YOUTUBE CLINIC CLASSIFIER - DEMO\n');
  console.log('=' . repeat(60));

  // Initialize database
  console.log('📦 Initializing database...');
  await initializeDatabase();

  // Simulate 20 videos with comments
  console.log('🎥 Simulating 20 videos from @EscueladeAlopecia...\n');

  const videoTitles = [
    'Tratamiento de alopecia androgenética - Caso 1',
    'Preguntas frecuentes sobre trasplante capilar',
    'Microinjertos de cabello: Técnica paso a paso',
    'Resultados después de 6 meses de tratamiento',
    'Diagnóstico temprano de caída de cabello',
  ];

  const commentExamples = [
    { text: 'Excelente video, me gustaría agendar una consulta', isClinic: true, type: 'pedir_cita_agendar' },
    { text: 'Muy buena explicación, gracias por compartir', isClinic: false, type: 'no_aplica' },
    { text: '¿Cuál es el costo del tratamiento?', isClinic: true, type: 'medicacion_tratamiento' },
    { text: 'Necesito que me den una cita', isClinic: true, type: 'pedir_cita_agendar' },
    { text: 'Video muy interesante', isClinic: false, type: 'no_aplica' },
    { text: '¿Cuánto cuesta el injerto de cabello?', isClinic: true, type: 'injertos_trasplante' },
    { text: 'Tengo dudas sobre el procedimiento', isClinic: true, type: 'dudas_preguntas' },
    { text: 'Quiero reservar una cita', isClinic: true, type: 'pedir_cita_agendar' },
    { text: '¿Dónde marcar una consulta?', isClinic: true, type: 'pedir_cita_agendar' },
  ];

  let totalClinic = 0;
  let totalComments = 0;
  let totalConfidence = 0;

  for (let v = 1; v <= 20; v++) {
    const videoId = `video${v}`;
    const title = videoTitles[Math.floor(Math.random() * videoTitles.length)];

    let videoClinic = 0;
    let videoConfidence = 0;

    // Add 10 comments per video
    for (let c = 1; c <= 10; c++) {
      const example = commentExamples[Math.floor(Math.random() * commentExamples.length)];
      const confidence = Math.random() * 0.3 + 0.65; // 0.65 - 0.95

      saveComment({
        id: `comment_${videoId}_${c}`,
        videoId,
        author: `Usuario ${Math.floor(Math.random() * 1000)}`,
        text: example.text,
        likes: Math.floor(Math.random() * 20),
        isClinicInquiry: example.isClinic,
        inquiryType: example.type,
        confidence,
        createdAt: new Date().toISOString(),
      });

      if (example.isClinic) {
        videoClinic++;
        totalClinic++;
      }
      totalComments++;
      videoConfidence += confidence;
      totalConfidence += confidence;
    }

    // Save video with real stats now that comments exist
    saveVideo({
      id: videoId,
      title: `${title} #${v}`,
      description: 'Contenido educativo sobre tratamientos capilares',
      publishedAt: new Date(Date.now() - v * 24 * 60 * 60 * 1000).toISOString(),
      videoUrl: `https://youtube.com/watch?v=${videoId}`,
      viewCount: Math.floor(Math.random() * 20000) + 500,
      totalComments: 10,
      clinicInquiries: videoClinic,
      otherComments: 10 - videoClinic,
      averageConfidence: videoConfidence / 10,
    });

    console.log(`✅ Video ${v}/20: "${title}" - ${videoClinic} consultas clínicas`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESULTADOS DEL ANÁLISIS:\n');

  const stats = getStatistics();
  console.log(`📺 Videos analizados: ${stats.totalVideos}`);
  console.log(`💬 Total de comentarios: ${stats.totalComments}`);
  console.log(`🏥 Consultas clínicas: ${stats.clinicInquiries}`);
  console.log(`💭 Otros comentarios: ${stats.otherComments}`);
  console.log(`📈 Porcentaje clínicas: ${stats.clinicPercentage.toFixed(1)}%`);
  console.log(`🎯 Confianza promedio: ${(stats.averageConfidence * 100).toFixed(1)}%`);

  console.log('\n' + '='.repeat(60));
  console.log('\n🎥 VIDEOS ANALIZADOS:\n');

  const videos = getVideos();
  videos.slice(0, 5).forEach((video) => {
    console.log(`• ${video.title}`);
    console.log(`  Comentarios: ${video.totalComments} | Clínicas: ${video.clinicInquiries} | Confianza: ${(video.averageConfidence * 100).toFixed(1)}%\n`);
  });

  console.log('='.repeat(60));
  console.log('\n✅ Demo completado!\n');
  console.log('🚀 Para usar datos reales, ejecuta: npm run scrape\n');

  // Flush immediately so data survives even if the server fails to start
  flushDatabase();
  console.log('💾 Datos guardados en disco (data/store.json)\n');

  await startServer(3000);
  console.log('📊 Dashboard listo en: http://localhost:3000');
  console.log('Presiona Ctrl+C para salir\n');

  // Keep process alive so the dashboard stays reachable
  await new Promise(() => {});
}

runDemo().catch(console.error);
