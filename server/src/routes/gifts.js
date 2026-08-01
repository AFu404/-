import { Router } from 'express';
import { query } from '../db.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const gifts = await query('SELECT * FROM gifts ORDER BY price ASC, id ASC');
  res.json({ gifts });
}));

export default router;
