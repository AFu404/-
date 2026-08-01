import { query } from '../db.js';
import { withRedis } from '../redis.js';

const KEY = 'leaderboard:popularity';

export async function recordPopularity(playerId, delta) {
  await query('UPDATE players SET popularity = popularity + ?, votes = votes + ? WHERE id = ?', [
    delta,
    delta,
    playerId,
  ]);
  await withRedis((redis) => redis.zIncrBy(KEY, delta, String(playerId)));
  const row = await query('SELECT popularity FROM players WHERE id = ?', [playerId]);
  return row[0]?.popularity ?? 0;
}

export async function getLeaderboard({ limit = 20, offset = 0 } = {}) {
  limit = Math.min(Number(limit) || 20, 100);
  offset = Number(offset) || 0;

  const fromRedis = await withRedis(async (redis) => {
    const items = await redis.zRangeWithScores(KEY, '+inf', '-inf', {
      BY: 'SCORE',
      REV: true,
      LIMIT: { offset, count: limit },
    });
    if (!items.length) return null;
    const ids = items.map((item) => Number(item.value));
    const players = await query(
      `SELECT id, name, position, number, avatar_url, intro, popularity, votes, checkin_days
       FROM players WHERE id IN (${ids.map(() => '?').join(',')})`,
      ids,
    );
    const byId = new Map(players.map((player) => [player.id, player]));
    return items.map((item, index) => ({
      rank: offset + index + 1,
      ...byId.get(Number(item.value)),
      popularity: Number(item.score),
    }));
  });

  if (fromRedis) return fromRedis;

  const rows = await query(
    `SELECT id, name, position, number, avatar_url, intro, popularity, votes, checkin_days
     FROM players
     WHERE status = 'active'
     ORDER BY popularity DESC, id ASC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  return rows.map((row, index) => ({ rank: offset + index + 1, ...row }));
}
