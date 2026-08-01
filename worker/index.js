const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function state() {
  if (!globalThis.__BASKETBALL_VOTE__) {
    const now = Date.now();
    globalThis.__BASKETBALL_VOTE__ = {
      activity: {
        id: 1,
        title: '篮球人气评选',
        start_at: new Date(now).toISOString(),
        end_at: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: '进行中',
      },
      parentPoints: 100,
      players: [
        { id: 1, name: '陈思远', position: '前锋', number: 8, intro: '突破犀利，投篮稳定。', popularity: 2486, votes: 2486, checkin_days: 7, status: 'active' },
        { id: 2, name: '林梓涵', position: '后卫', number: 6, intro: '速度快，串联全队。', popularity: 2310, votes: 2310, checkin_days: 6, status: 'active' },
        { id: 3, name: '王浩然', position: '中锋', number: 12, intro: '篮板保障，内线支柱。', popularity: 1988, votes: 1988, checkin_days: 5, status: 'active' },
        { id: 4, name: '赵一鸣', position: '后卫', number: 3, intro: '防守积极，三分敢投。', popularity: 1648, votes: 1648, checkin_days: 4, status: 'active' },
      ],
      gifts: [
        { id: 1, name: '鲜花', icon: '🌹', popularity_delta: 5, price: 5, money: 0.5 },
        { id: 2, name: '篮球', icon: '🏀', popularity_delta: 20, price: 20, money: 2 },
        { id: 3, name: '奖杯', icon: '🏆', popularity_delta: 50, price: 50, money: 5 },
        { id: 4, name: '王冠', icon: '👑', popularity_delta: 100, price: 100, money: 10 },
      ],
      rewards: [
        { id: 1, rank_from: 1, rank_to: 1, title: '冠军', description: '人气王奖杯 + 定制篮球', value: '一等奖' },
        { id: 2, rank_from: 2, rank_to: 2, title: '亚军', description: '亚军奖牌 + 训练礼包', value: '二等奖' },
        { id: 3, rank_from: 3, rank_to: 3, title: '季军', description: '季军奖牌 + 运动水壶', value: '三等奖' },
        { id: 4, rank_from: 4, rank_to: 10, title: '优秀球员', description: '荣誉证书', value: '参与奖' },
      ],
      giftLogs: [],
      withdrawn: 0,
    };
  }
  return globalThis.__BASKETBALL_VOTE__;
}

function role(request) {
  const auth = request.headers.get('Authorization') || '';
  if (auth.includes('mock-token-coach')) return 'admin';
  if (auth.includes('mock-token-parent')) return 'parent';
  return null;
}

function sortedPlayers(db) {
  return db.players
    .filter((player) => player.status === 'active')
    .sort((a, b) => b.popularity - a.popularity || a.id - b.id);
}

function playerStats(db, player) {
  const logs = db.giftLogs.filter((log) => log.player_id === player.id);
  return {
    checkin_days: player.checkin_days,
    gift_count: logs.reduce((sum, log) => sum + log.quantity, 0),
    gift_popularity: logs.reduce((sum, log) => sum + log.popularity_delta, 0),
    votes: player.votes,
  };
}

async function handleApi(request, url) {
  const db = state();
  const path = url.pathname;
  const method = request.method;
  const userRole = role(request);

  if (method === 'GET' && path === '/api/activity/current') return json({ activity: db.activity });
  if (method === 'GET' && path === '/api/gifts') return json({ gifts: db.gifts });
  if (method === 'GET' && path === '/api/rewards') return json({ rewards: db.rewards });

  if (method === 'GET' && path === '/api/players') {
    const position = url.searchParams.get('position') || '';
    const keyword = url.searchParams.get('keyword') || '';
    let players = sortedPlayers(db);
    if (position && position !== '全部') players = players.filter((player) => player.position === position);
    if (keyword) players = players.filter((player) => player.name.includes(keyword));
    return json({ players });
  }

  if (method === 'GET' && path === '/api/leaderboard') {
    const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 100);
    const offset = Number(url.searchParams.get('offset')) || 0;
    const list = sortedPlayers(db).slice(offset, offset + limit).map((player, index) => ({ rank: offset + index + 1, ...player }));
    return json({ list });
  }

  const playerMatch = path.match(/^\/api\/players\/(\d+)$/);
  if (playerMatch && method === 'GET') {
    const player = db.players.find((item) => item.id === Number(playerMatch[1]));
    if (!player) return json({ message: '选手不存在' }, 404);
    return json({ player: { ...player, stats: playerStats(db, player) } });
  }

  if (method === 'POST' && path === '/api/auth/sms/send') {
    return json({ ok: true, message: '验证码已发送', dev_code: '123456' });
  }

  if (method === 'POST' && path === '/api/auth/login') {
    const body = await request.json().catch(() => ({}));
    const phone = String(body.phone || '');
    if (!/^1\d{10}$/.test(phone)) return json({ message: '手机号格式不对' }, 400);
    if (phone === '13800000000') {
      return json({ token: 'mock-token-coach', user: { id: 1, name: '教练', phone, role: 'admin' } });
    }
    return json({ token: 'mock-token-parent', user: { id: 2, name: `家长${phone.slice(-4)}`, phone, points: db.parentPoints, role: 'parent' } });
  }

  if (method === 'GET' && path === '/api/auth/profile') {
    if (userRole === 'admin') return json({ user: { id: 1, name: '教练', role: 'admin' } });
    if (userRole === 'parent') return json({ user: { id: 2, name: '演示家长', points: db.parentPoints, role: 'parent' } });
    return json({ message: '未登录' }, 401);
  }

  const checkinMatch = path.match(/^\/api\/players\/(\d+)\/checkin$/);
  if (checkinMatch && method === 'POST') {
    if (userRole !== 'parent') return json({ message: '仅家长可签到' }, 403);
    const player = db.players.find((item) => item.id === Number(checkinMatch[1]));
    if (!player) return json({ message: '选手不存在' }, 404);
    player.popularity += 10;
    player.votes += 10;
    player.checkin_days += 1;
    return json({ success: true, delta: 10, streak_days: player.checkin_days, new_popularity: player.popularity });
  }

  const giftMatch = path.match(/^\/api\/players\/(\d+)\/gift$/);
  if (giftMatch && method === 'POST') {
    if (userRole !== 'parent') return json({ message: '仅家长可送礼' }, 403);
    const body = await request.json().catch(() => ({}));
    const player = db.players.find((item) => item.id === Number(giftMatch[1]));
    const gift = db.gifts.find((item) => item.id === Number(body.gift_id));
    const quantity = Math.max(1, Math.min(Number(body.quantity) || 1, 99));
    if (!player || !gift) return json({ message: '礼物或选手不存在' }, 404);
    const cost = gift.price * quantity;
    if (db.parentPoints < cost) return json({ message: '积分余额不足' }, 400);
    const delta = gift.popularity_delta * quantity;
    db.parentPoints -= cost;
    player.popularity += delta;
    player.votes += delta;
    db.giftLogs.unshift({
      id: db.giftLogs.length + 1,
      parent_name: '演示家长',
      player_name: player.name,
      gift_name: gift.name,
      quantity,
      money: gift.money * quantity,
      popularity_delta: delta,
      created_at: new Date().toISOString(),
    });
    return json({ ok: true, new_popularity: player.popularity, points_balance: db.parentPoints });
  }

  if (method === 'PUT' && path === '/api/rewards') {
    if (userRole !== 'admin') return json({ message: '仅教练可操作' }, 403);
    const body = await request.json().catch(() => ({}));
    db.rewards = Array.isArray(body.rewards) ? body.rewards.map((reward, index) => ({ id: index + 1, ...reward })) : db.rewards;
    return json({ ok: true });
  }

  const resultMatch = path.match(/^\/api\/activity\/(\d+)\/result$/);
  if (resultMatch && method === 'GET') {
    const winners = sortedPlayers(db).slice(0, 10).map((player, index) => {
      const rank = index + 1;
      const reward = db.rewards.find((item) => rank >= item.rank_from && rank <= item.rank_to);
      return { rank, id: player.id, name: player.name, position: player.position, popularity: player.popularity, reward_title: reward?.title || '参与奖', reward_description: reward?.description || '' };
    });
    return json({ activity: db.activity, winners });
  }

  if (path.startsWith('/api/admin')) {
    if (userRole !== 'admin') return json({ message: '仅教练可操作' }, 403);

    if (method === 'GET' && path === '/api/admin/dashboard') {
      const revenue = db.giftLogs.reduce((sum, log) => sum + Number(log.money || 0), 0);
      return json({
        cards: {
          players: sortedPlayers(db).length,
          votes: db.players.reduce((sum, player) => sum + player.votes, 0),
          revenue,
          revenue_balance: revenue - db.withdrawn,
          activity_status: db.activity.status,
        },
        top5: sortedPlayers(db).slice(0, 5).map((player, index) => ({ rank: index + 1, ...player })),
        recentGifts: db.giftLogs.slice(0, 10),
      });
    }

    if (method === 'GET' && path === '/api/admin/players') {
      return json({ list: db.players.filter((player) => player.status !== 'deleted'), page: 1, size: 50, total: db.players.length });
    }

    if (method === 'GET' && path === '/api/admin/revenue/overview') {
      const total = db.giftLogs.reduce((sum, log) => sum + Number(log.money || 0), 0);
      const byGift = db.gifts.map((gift) => {
        const logs = db.giftLogs.filter((log) => log.gift_name === gift.name);
        return { name: gift.name, quantity: logs.reduce((sum, log) => sum + log.quantity, 0), money: logs.reduce((sum, log) => sum + Number(log.money || 0), 0) };
      });
      return json({ total: { total, withdrawn: db.withdrawn, balance: total - db.withdrawn }, byGift });
    }

    if (method === 'GET' && path === '/api/admin/revenue/gifts') return json({ list: db.giftLogs });

    if (method === 'POST' && path === '/api/admin/revenue/withdraw') {
      const body = await request.json().catch(() => ({}));
      const amount = Number(body.amount);
      const total = db.giftLogs.reduce((sum, log) => sum + Number(log.money || 0), 0);
      if (!amount || amount <= 0 || !body.bank_account) return json({ message: '金额和账户必填' }, 400);
      if (total - db.withdrawn < amount) return json({ message: '可提现余额不足' }, 400);
      db.withdrawn += amount;
      return json({ id: Date.now() }, 201);
    }
  }

  if (method === 'POST' && path === '/api/players') {
    if (userRole !== 'admin') return json({ message: '仅教练可操作' }, 403);
    const body = await request.json().catch(() => ({}));
    const id = Math.max(...db.players.map((player) => player.id), 0) + 1;
    db.players.push({ id, name: body.name, position: body.position, number: body.number || null, intro: body.intro || '', popularity: 0, votes: 0, checkin_days: 0, status: 'active' });
    return json({ id }, 201);
  }

  if (playerMatch && method === 'PUT') {
    if (userRole !== 'admin') return json({ message: '仅教练可操作' }, 403);
    const body = await request.json().catch(() => ({}));
    const player = db.players.find((item) => item.id === Number(playerMatch[1]));
    if (!player) return json({ message: '选手不存在' }, 404);
    Object.assign(player, body);
    return json({ ok: true });
  }

  if (playerMatch && method === 'DELETE') {
    if (userRole !== 'admin') return json({ message: '仅教练可操作' }, 403);
    const player = db.players.find((item) => item.id === Number(playerMatch[1]));
    if (player) player.status = 'deleted';
    return json({ ok: true });
  }

  return json({ message: '接口不存在' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: JSON_HEADERS });
    if (url.pathname.startsWith('/api/')) return handleApi(request, url);
    return env.ASSETS.fetch(request);
  },
};
