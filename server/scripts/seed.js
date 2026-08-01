import { query } from '../src/db.js';

await query(
  'INSERT INTO coaches (name, phone, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
  ['教练', '13800000000', 'admin'],
);

await query(
  'INSERT INTO parents (name, phone, points) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE points = VALUES(points)',
  ['演示家长', '13900000000', 1000],
);

await query(
  `INSERT INTO activities (title, start_at, end_at, status)
   SELECT '篮球人气评选', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), '进行中'
   WHERE NOT EXISTS (SELECT 1 FROM activities)`,
);

const players = [
  ['陈思远', '前锋', 8, '突破犀利，投篮稳定。'],
  ['林梓涵', '后卫', 6, '速度快，串联全队。'],
  ['王浩然', '中锋', 12, '篮板保障，内线支柱。'],
  ['赵一鸣', '后卫', 3, '防守积极，三分敢投。'],
];
for (const [name, position, number, intro] of players) {
  await query(
    'INSERT INTO players (name, position, number, intro) SELECT ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = ?)',
    [name, position, number, intro, name],
  );
}

const gifts = [
  ['鲜花', '🌹', 5, 5, 0.5],
  ['篮球', '🏀', 20, 20, 2],
  ['奖杯', '🏆', 50, 50, 5],
  ['王冠', '👑', 100, 100, 10],
];
for (const gift of gifts) {
  await query(
    'INSERT INTO gifts (name, icon, popularity_delta, price, money) SELECT ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM gifts WHERE name = ?)',
    [...gift, gift[0]],
  );
}

const rewards = [
  [1, 1, '冠军', '人气王奖杯 + 定制篮球', '一等奖'],
  [2, 2, '亚军', '亚军奖牌 + 训练礼包', '二等奖'],
  [3, 3, '季军', '季军奖牌 + 运动水壶', '三等奖'],
  [4, 10, '优秀球员', '荣誉证书', '参与奖'],
];
for (const reward of rewards) {
  await query(
    'INSERT INTO rewards (rank_from, rank_to, title, description, value) SELECT ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE title = ?)',
    [...reward, reward[2]],
  );
}

await query(
  `INSERT INTO revenues (activity_id, total, withdrawn, balance)
   SELECT id, 0, 0, 0 FROM activities
   WHERE NOT EXISTS (SELECT 1 FROM revenues)`,
);

console.log('[seed] done');
process.exit(0);
