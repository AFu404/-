import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function signUser(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name || '' },
    config.jwtSecret,
    { expiresIn: '14d' },
  );
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ message: '未登录' });
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ message: '登录已过期' });
  }
}

export function requireCoach(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: '仅教练可操作' });
  return next();
}
