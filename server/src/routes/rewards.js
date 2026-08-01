import { Router } from 'express';
import { query, tx } from '../db.js';
import { asyncHandler } from '../middleware/error.js';
import { authRequired, requireCoach } from '../middleware/auth.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const rewards = await query('SELECT * FROM rewards ORDER BY rank_from ASC, rank_to ASC');
  res.json({ rewards });
}));

router.put('/', authRequired, requireCoach, asyncHandler(async (req, res) => {
  const rewards = Array.isArray(req.body?.rewards) ? req.body.rewards : [];
  await tx(async (conn) => {
    await conn.query('DELETE FROM rewards');
    for (const reward of rewards) {
      await conn.query(
        'INSERT INTO rewards (rank_from, rank_to, title, description, value) VALUES (?, ?, ?, ?, ?)',
        [
          Number(reward.rank_from),
          Number(reward.rank_to),
          reward.title || '',
          reward.description || null,
          reward.value || null,
        ],
      );
    }
  });
  res.json({ ok: true });
}));

export default router;
