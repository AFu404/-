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

## Cloudflare 部署

根目录已补 `wrangler.jsonc`，用于 Cloudflare Workers 部署：

- 静态资源：`web/dist`
- SPA 回退：`single-page-application`
- `/api/*`：由 `worker/index.js` 提供 Cloudflare 演示 API（内存数据，方便先上线玩）

Cloudflare 构建配置建议：

- Build command：`npm run build`
- Deploy command：`npx wrangler deploy`
- Node：`24`

注意：`server/` 里的 Express + MySQL 完整后端不能直接跑在 Cloudflare Workers 上；要正式持久化，下一步应改 Cloudflare D1/KV，或把后端部署到支持 Node/MySQL 的服务器。
