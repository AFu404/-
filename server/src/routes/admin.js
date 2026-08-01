import { Router } from 'express';
import { one, query } from '../db.js';
import { asyncHandler } from '../middleware/error.js';
import { authRequired, requireCoach } from '../middleware/auth.js';
import { getLeaderboard } from '../services/leaderboard.js';

const router = Router();
router.use(authRequired, requireCoach);

router.get('/dashboard', asyncHandler(async (req, res) => {
  const [playerCount] = await query("SELECT COUNT(*) AS count FROM players WHERE status = 'active'");
  const [voteSum] = await query('SELECT COALESCE(SUM(votes), 0) AS total FROM players');
  const [revenue] = await query('SELECT COALESCE(SUM(total), 0) AS total, COALESCE(SUM(balance), 0) AS balance FROM revenues');
  const activity = await one('SELECT * FROM activities ORDER BY id DESC LIMIT 1');
  const top5 = await getLeaderboard({ limit: 5, offset: 0 });
  const recentGifts = await query(
    `SELECT gl.id, p.name AS parent_name, pl.name AS player_name, g.name AS gift_name, gl.quantity, gl.money, gl.created_at
     FROM gift_logs gl
     JOIN parents p ON p.id = gl.parent_id
     JOIN players pl ON pl.id = gl.player_id
     JOIN gifts g ON g.id = gl.gift_id
     ORDER BY gl.id DESC LIMIT 10`,
  );
  res.json({
    cards: {
      players: Number(playerCount?.count || 0),
      votes: Number(voteSum?.total || 0),
      revenue: Number(revenue?.total || 0),
      revenue_balance: Number(revenue?.balance || 0),
      activity_status: activity?.status || '未创建',
    },
    top5,
    recentGifts,
  });
}));

router.get('/players', asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const size = Math.min(Math.max(Number(req.query.size) || 10, 1), 50);
  const keyword = String(req.query.keyword || '');
  const params = [];
  let where = "status != 'deleted'";
  if (keyword) {
    where += ' AND name LIKE ?';
    params.push(`%${keyword}%`);
  }
  const [total] = await query(`SELECT COUNT(*) AS count FROM players WHERE ${where}`, params);
  const list = await query(
    `SELECT * FROM players WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, size, (page - 1) * size],
  );
  res.json({ list, page, size, total: Number(total?.count || 0) });
}));

router.get('/revenue/overview', asyncHandler(async (req, res) => {
  const byGift = await query(
    `SELECT g.name, COALESCE(SUM(gl.quantity), 0) AS quantity, COALESCE(SUM(gl.money), 0) AS money
     FROM gifts g LEFT JOIN gift_logs gl ON gl.gift_id = g.id
     GROUP BY g.id ORDER BY money DESC`,
  );
  const [total] = await query('SELECT COALESCE(SUM(total), 0) AS total, COALESCE(SUM(withdrawn), 0) AS withdrawn, COALESCE(SUM(balance), 0) AS balance FROM revenues');
  res.json({ total, byGift });
}));

router.get('/revenue/gifts', asyncHandler(async (req, res) => {
  const list = await query(
    `SELECT gl.*, p.name AS parent_name, pl.name AS player_name, g.name AS gift_name
     FROM gift_logs gl
     JOIN parents p ON p.id = gl.parent_id
     JOIN players pl ON pl.id = gl.player_id
     JOIN gifts g ON g.id = gl.gift_id
     ORDER BY gl.id DESC LIMIT 100`,
  );
  res.json({ list });
}));

router.post('/revenue/withdraw', asyncHandler(async (req, res) => {
  const { amount, bank_account } = req.body || {};
  const value = Number(amount);
  if (!value || value <= 0 || !bank_account) return res.status(400).json({ message: '金额和账户必填' });
  const [balance] = await query('SELECT COALESCE(SUM(balance), 0) AS balance FROM revenues');
  if (Number(balance?.balance || 0) < value) return res.status(400).json({ message: '可提现余额不足' });
  const result = await query('INSERT INTO withdrawals (amount, bank_account, status) VALUES (?, ?, ?)', [
    value,
    bank_account,
    'pending',
  ]);
  await query('UPDATE revenues SET withdrawn = withdrawn + ?, balance = balance - ?', [value, value]);
  res.status(201).json({ id: result.insertId });
}));

export default router;
