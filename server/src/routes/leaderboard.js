import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { getLeaderboard } from '../services/leaderboard.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const list = await getLeaderboard({ limit: req.query.limit, offset: req.query.offset });
  res.json({ list });
}));

export default router;
