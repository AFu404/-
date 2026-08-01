import { Router } from 'express';
import { one, query, tx } from '../db.js';
import { asyncHandler } from '../middleware/error.js';
import { authRequired, requireCoach } from '../middleware/auth.js';
import { recordPopularity } from '../services/leaderboard.js';

const router = Router();

function day(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value || '').slice(0, 10);
}

router.get('/', asyncHandler(async (req, res) => {
  const { position = '', keyword = '' } = req.query;
  const where = ['status = ?'];
  const params = ['active'];
  if (position && position !== '全部') {
    where.push('position = ?');
    params.push(position);
  }
  if (keyword) {
    where.push('name LIKE ?');
    params.push(`%${keyword}%`);
  }
  const players = await query(
    `SELECT id, name, position, number, avatar_url, intro, popularity, votes, checkin_days
     FROM players WHERE ${where.join(' AND ')}
     ORDER BY popularity DESC, id ASC`,
    params,
  );
  res.json({ players });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const player = await one('SELECT * FROM players WHERE id = ?', [req.params.id]);
  if (!player) return res.status(404).json({ message: '选手不存在' });
  const [giftStats] = await query(
    'SELECT COALESCE(SUM(quantity), 0) AS gift_count, COALESCE(SUM(popularity_delta), 0) AS gift_popularity FROM gift_logs WHERE player_id = ?',
    [req.params.id],
  );
  res.json({
    player: {
      ...player,
      stats: {
        checkin_days: player.checkin_days,
        gift_count: Number(giftStats?.gift_count || 0),
        gift_popularity: Number(giftStats?.gift_popularity || 0),
        votes: player.votes,
      },
    },
  });
}));

router.post('/', authRequired, requireCoach, asyncHandler(async (req, res) => {
  const { name, position, number = null, avatar_url = null, intro = null } = req.body || {};
  if (!name || !position) return res.status(400).json({ message: '姓名和位置必填' });
  const result = await query(
    'INSERT INTO players (name, position, number, avatar_url, intro) VALUES (?, ?, ?, ?, ?)',
    [name, position, number, avatar_url, intro],
  );
  res.status(201).json({ id: result.insertId });
}));

router.put('/:id', authRequired, requireCoach, asyncHandler(async (req, res) => {
  const fields = ['name', 'position', 'number', 'avatar_url', 'intro', 'status'];
  const sets = [];
  const params = [];
  for (const field of fields) {
    if (req.body?.[field] !== undefined) {
      sets.push(`${field} = ?`);
      params.push(req.body[field]);
    }
  }
  if (!sets.length) return res.status(400).json({ message: '没有要更新的字段' });
  params.push(req.params.id);
  await query(`UPDATE players SET ${sets.join(', ')} WHERE id = ?`, params);
  res.json({ ok: true });
}));

router.delete('/:id', authRequired, requireCoach, asyncHandler(async (req, res) => {
  await query("UPDATE players SET status = 'deleted' WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
}));

router.post('/:id/checkin', authRequired, asyncHandler(async (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ message: '仅家长可签到' });
  const player = await one('SELECT id, name FROM players WHERE id = ? AND status = ?', [req.params.id, 'active']);
  if (!player) return res.status(404).json({ message: '选手不存在' });

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  try {
    const result = await tx(async (conn) => {
      const [lastRows] = await conn.query(
        'SELECT date, streak_days FROM checkins WHERE parent_id = ? AND player_id = ? ORDER BY date DESC LIMIT 1',
        [req.user.id, req.params.id],
      );
      const last = lastRows[0];
      const streak = day(last?.date) === yesterday ? Number(last.streak_days) + 1 : 1;
      await conn.query(
        'INSERT INTO checkins (parent_id, player_id, date, streak_days, delta) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, req.params.id, today, streak, 10],
      );
      await conn.query('UPDATE players SET checkin_days = GREATEST(checkin_days, ?) WHERE id = ?', [
        streak,
        req.params.id,
      ]);
      return { streak };
    });
    const newPopularity = await recordPopularity(req.params.id, 10);
    res.json({ success: true, delta: 10, streak_days: result.streak, new_popularity: newPopularity });
  } catch (err) {
    if (String(err.code) === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '今天已经给这位选手签到过了' });
    }
    throw err;
  }
}));

router.post('/:id/gift', authRequired, asyncHandler(async (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ message: '仅家长可送礼' });
  const { gift_id, quantity = 1 } = req.body || {};
  const qty = Math.max(1, Math.min(Number(quantity) || 1, 99));
  const gift = await one('SELECT * FROM gifts WHERE id = ?', [gift_id]);
  const player = await one('SELECT * FROM players WHERE id = ? AND status = ?', [req.params.id, 'active']);
  if (!gift || !player) return res.status(404).json({ message: '礼物或选手不存在' });

  const cost = gift.price * qty;
  const delta = gift.popularity_delta * qty;
  const money = Number(gift.money) * qty;

  const result = await tx(async (conn) => {
    const [parentRows] = await conn.query('SELECT points FROM parents WHERE id = ? FOR UPDATE', [req.user.id]);
    const parent = parentRows[0];
    if (!parent || parent.points < cost) {
      const err = new Error('积分余额不足');
      err.statusCode = 400;
      throw err;
    }
    await conn.query('UPDATE parents SET points = points - ? WHERE id = ?', [cost, req.user.id]);
    await conn.query(
      'INSERT INTO gift_logs (parent_id, player_id, gift_id, quantity, money, popularity_delta) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.params.id, gift.id, qty, money, delta],
    );
    const [activityRows] = await conn.query('SELECT id FROM activities ORDER BY id DESC LIMIT 1');
    if (activityRows[0]?.id && money > 0) {
      await conn.query(
        'INSERT INTO revenues (activity_id, total, balance) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE total = total + VALUES(total), balance = balance + VALUES(balance)',
        [activityRows[0].id, money, money],
      );
    }
    const [balanceRows] = await conn.query('SELECT points FROM parents WHERE id = ?', [req.user.id]);
    return { balance: balanceRows[0]?.points ?? 0 };
  });

  const newPopularity = await recordPopularity(req.params.id, delta);
  res.json({ ok: true, new_popularity: newPopularity, points_balance: result.balance });
}));

export default router;
