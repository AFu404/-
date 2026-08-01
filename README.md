# 篮球投票评选网站

按 `开发交接稿.md` 落地的全栈项目骨架：

- `web/`：React + Vite，家长 H5 + 教练 PC 后台同一套代码入口
- `server/`：Node.js + Express + MySQL + Redis
- `server/migrations/001_init.sql`：按交接稿数据模型建表

## 快速开始

```bash
npm install
cp server/.env.example server/.env
# 可选：启动本地 MySQL/Redis
docker compose up -d
npm run migrate
npm run seed
npm run dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:3000/health

> 合规提醒：送礼/付费能力先做模块隔离。未确认合规口径前，不要把付费送礼和排行榜排名强绑定。
