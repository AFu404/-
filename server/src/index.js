import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import activityRoutes from './routes/activity.js';
import playerRoutes from './routes/players.js';
import giftRoutes from './routes/gifts.js';
import leaderboardRoutes from './routes/leaderboard.js';
import rewardRoutes from './routes/rewards.js';
import adminRoutes from './routes/admin.js';
import { errorHandler, notFound } from './middleware/error.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 300 }));

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[server] http://localhost:${config.port}`);
});
