import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  coachPhone: process.env.COACH_PHONE || '13800000000',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'vote',
    password: process.env.DB_PASSWORD || 'votepassword',
    database: process.env.DB_NAME || 'basketball_vote',
  },
  redisUrl: process.env.REDIS_URL || '',
};
