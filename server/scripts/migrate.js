import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '../src/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, '..', 'migrations', '001_init.sql');
const sql = await fs.readFile(sqlPath, 'utf8');

const conn = await mysql.createConnection({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  multipleStatements: true,
});

await conn.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await conn.changeUser({ database: config.db.database });
await conn.query(sql);
await conn.end();

console.log('[migrate] done');
