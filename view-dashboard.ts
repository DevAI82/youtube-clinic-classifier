import { initializeDatabase, getStatistics, closeDatabase } from './src/database.js';
import { startServer } from './src/server.js';
import { config } from './src/config.js';

/**
 * Opens the dashboard using whatever data is already persisted on disk
 * (data/store.json). Does NOT call YouTube or Jev — instant startup.
 * Use this whenever you just want to look at results you already scraped.
 */
async function main() {
  console.log('\n📂 Cargando datos guardados...\n');
  await initializeDatabase();

  const stats = getStatistics();
  if (stats.totalComments === 0) {
    console.log('⚠️  No hay datos guardados todavía.');
    console.log('    Ejecuta "npm run scrape" (datos reales) o "npx tsx demo.ts" (datos de ejemplo) primero.\n');
  } else {
    console.log(`✅ ${stats.totalVideos} videos, ${stats.totalComments} comentarios cargados desde disco`);
    console.log(`🔥 ${stats.hotLeads} leads calientes (piden cita)\n`);
  }

  await startServer(config.app.port);
  console.log(`📊 Dashboard listo en: http://localhost:${config.app.port}`);
  console.log('Presiona Ctrl+C para salir\n');

  await new Promise(() => {});
}

process.on('SIGINT', () => {
  console.log('\n👋 Cerrando...');
  closeDatabase();
  process.exit(0);
});

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
