import { Router } from 'express';
import { one, query } from '../db.js';
import { config } from '../config.js';
import { asyncHandler } from '../middleware/error.js';
import { authRequired, signUser } from '../middleware/auth.js';

const router = Router();
const smsCodes = new Map();

function validPhone(phone) {
  return /^1\d{10}$/.test(String(phone || ''));
}

router.post('/sms/send', asyncHandler(async (req, res) => {
  const { phone } = req.body || {};
  if (!validPhone(phone)) return res.status(400).json({ message: '手机号格式不对' });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  smsCodes.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  console.log(`[sms] ${phone} -> ${code}`);

  res.json({
    ok: true,
    message: '验证码已发送',
    dev_code: config.env === 'production' ? undefined : code,
  });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { phone, code } = req.body || {};
  if (!validPhone(phone)) return res.status(400).json({ message: '手机号格式不对' });
  const cached = smsCodes.get(phone);
  if (!cached || cached.expiresAt < Date.now() || cached.code !== String(code || '')) {
    return res.status(400).json({ message: '验证码错误或已过期' });
  }
  smsCodes.delete(phone);

  if (phone === config.coachPhone) {
    let coach = await one('SELECT * FROM coaches WHERE phone = ?', [phone]);
    if (!coach) {
      const result = await query('INSERT INTO coaches (name, phone, role) VALUES (?, ?, ?)', [
        '教练',
        phone,
        'admin',
      ]);
      coach = { id: result.insertId, name: '教练', phone, role: 'admin' };
    }
    return res.json({ token: signUser(coach), user: { ...coach, role: 'admin' } });
  }

  let parent = await one('SELECT * FROM parents WHERE phone = ?', [phone]);
  if (!parent) {
    const result = await query('INSERT INTO parents (name, phone, points) VALUES (?, ?, ?)', [
      `家长${phone.slice(-4)}`,
      phone,
      100,
    ]);
    parent = { id: result.insertId, name: `家长${phone.slice(-4)}`, phone, points: 100 };
  }
  res.json({ token: signUser({ ...parent, role: 'parent' }), user: { ...parent, role: 'parent' } });
}));

router.get('/profile', authRequired, asyncHandler(async (req, res) => {
  const table = req.user.role === 'admin' ? 'coaches' : 'parents';
  const user = await one(`SELECT * FROM ${table} WHERE id = ?`, [req.user.id]);
  res.json({ user: user ? { ...user, role: req.user.role } : null });
}));

export default router;
