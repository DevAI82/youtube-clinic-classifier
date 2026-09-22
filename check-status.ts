import { getStatistics, getVideos, getCommentsByVideoId } from './src/database.js';
import { initializeDatabase } from './src/database.js';

async function checkStatus() {
  await initializeDatabase();

  const stats = getStatistics();
  const videos = getVideos();

  console.log('\n📊 ESTADO ACTUAL DEL ANÁLISIS\n');
  console.log('='.repeat(60));

  console.log(`\n📺 Videos procesados: ${stats.totalVideos}`);
  console.log(`💬 Comentarios analizados: ${stats.totalComments}`);
  console.log(`🏥 Consultas clínicas detectadas: ${stats.clinicInquiries}`);
  console.log(`💭 Otros comentarios: ${stats.otherComments}`);
  
  if (stats.totalComments > 0) {
    console.log(`\n📈 MÉTRICAS:`);
    console.log(`   Porcentaje clínicas: ${stats.clinicPercentage.toFixed(1)}%`);
    console.log(`   Confianza promedio: ${(stats.averageConfidence * 100).toFixed(1)}%`);
  }

  if (videos.length > 0) {
    console.log(`\n🎥 ÚLTIMOS VIDEOS ANALIZADOS:\n`);
    videos.slice(0, 3).forEach((video, idx) => {
      const comments = getCommentsByVideoId(video.id);
      const clinicCount = comments.filter(c => c.isClinicInquiry).length;
      console.log(`${idx + 1}. "${video.title}"`);
      console.log(`   💬 ${comments.length} comentarios | 🏥 ${clinicCount} clínicas`);
      console.log(`   🎯 Confianza: ${(video.averageConfidence * 100).toFixed(1)}%\n`);
    });
  }

  console.log('='.repeat(60));

  if (stats.totalComments === 0) {
    console.log('\n⏳ El análisis aún está en progreso...');
    console.log('   Abre http://localhost:3000 para ver el dashboard\n');
  } else {
    console.log('\n✅ Análisis en progreso - visitando dashboard para ver resultados\n');
    console.log('📊 Dashboard: http://localhost:3000');
    console.log('🚀 El programa seguirá ejecutándose mostrando resultados en vivo\n');
  }
}

checkStatus().catch(console.error);
