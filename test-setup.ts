import { config } from './src/config.js';
import { initializeDatabase, getStatistics } from './src/database.js';

async function test() {
  console.log('🧪 Testing configuration...\n');

  console.log('✅ API Key configured:', config.openrouter.apiKey?.substring(0, 15) + '...');
  console.log('✅ Model:', config.openrouter.model);
  console.log('✅ YouTube Channel:', config.youtube.channelHandle);
  console.log('✅ Max Videos:', config.scraper.maxVideos);
  console.log('✅ Max Comments:', config.scraper.maxCommentsPerVideo);
  console.log('✅ Port:', config.app.port);

  console.log('\n✅ Database test...');
  await initializeDatabase();
  console.log('✅ Database initialized');

  const stats = getStatistics();
  console.log('✅ Database stats:', stats);

  console.log('\n✅ All tests passed! Ready to run: npm run scrape');
}

test().catch(console.error);
