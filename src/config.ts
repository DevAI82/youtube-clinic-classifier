import dotenv from 'dotenv';

dotenv.config();

export const config = {
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1',
    model: '~typesafe/jev-latest', // Always uses latest version
  },
  youtube: {
    channelHandle: process.env.YOUTUBE_CHANNEL_HANDLE || '@EscueladeAlopecia',
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    databasePath: process.env.DATABASE_PATH || './data/clinic-classifier.db',
  },
  scraper: {
    maxVideos: parseInt(process.env.MAX_VIDEOS || '20', 10),
    maxCommentsPerVideo: parseInt(
      process.env.MAX_COMMENTS_PER_VIDEO || '100',
      10
    ),
  },
};

// Validate required config
if (!config.openrouter.apiKey) {
  throw new Error('OPENROUTER_API_KEY is not set in environment variables');
}
