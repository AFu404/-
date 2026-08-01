import { Router } from 'express';
import { one, query } from '../db.js';
import { asyncHandler } from '../middleware/error.js';
import { getLeaderboard } from '../services/leaderboard.js';

const router = Router();

router.get('/current', asyncHandler(async (req, res) => {
  const activity = await one('SELECT * FROM activities ORDER BY id DESC LIMIT 1');
  res.json({ activity });
}));

router.get('/:id/result', asyncHandler(async (req, res) => {
  const activity = await one('SELECT * FROM activities WHERE id = ?', [req.params.id]);
  if (!activity) return res.status(404).json({ message: '活动不存在' });

  let winners = await query(
    `SELECT rr.rank, p.id, p.name, p.position, p.popularity, r.title AS reward_title, r.description AS reward_description
     FROM reward_results rr
     JOIN players p ON p.id = rr.player_id
     JOIN rewards r ON r.id = rr.reward_id
     WHERE rr.activity_id = ?
     ORDER BY rr.rank ASC`,
    [req.params.id],
  );

  if (!winners.length) {
    const rewards = await query('SELECT * FROM rewards ORDER BY rank_from ASC');
    const leaderboard = await getLeaderboard({ limit: 10, offset: 0 });
    winners = leaderboard.map((player) => {
      const reward = rewards.find((item) => player.rank >= item.rank_from && player.rank <= item.rank_to);
      return {
        rank: player.rank,
        id: player.id,
        name: player.name,
        position: player.position,
        popularity: player.popularity,
        reward_title: reward?.title || '参与奖',
        reward_description: reward?.description || '',
      };
    });
  }

  res.json({ activity, winners });
}));

export default router;
