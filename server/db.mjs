import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.mjs';
fs.mkdirSync(config.dataDir, {recursive:true, mode:0o700});
fs.mkdirSync(path.join(config.dataDir,'uploads'), {recursive:true,mode:0o700});
try { fs.chmodSync(config.dataDir,0o700); fs.chmodSync(path.join(config.dataDir,'uploads'),0o700); } catch {}
export const db = new DatabaseSync(path.join(config.dataDir,'ems.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, username TEXT NOT NULL COLLATE NOCASE UNIQUE, display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','reviewer','admin')),
  server_name TEXT NOT NULL DEFAULT 'Кутузовский', static_id TEXT, static_verified INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 1, rank_updated_at TEXT, department TEXT NOT NULL DEFAULT 'Не указано',
  password_reset_required INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS unique_verified_static ON users(server_name,static_id) WHERE static_verified=1 AND static_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf TEXT NOT NULL, created_at INTEGER NOT NULL, touched_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS invites (
  code_hash TEXT PRIMARY KEY, issued_by TEXT REFERENCES users(id), created_at TEXT NOT NULL,
  expires_at INTEGER NOT NULL, used_by TEXT REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL, stored_name TEXT NOT NULL, mime TEXT NOT NULL, file_size INTEGER NOT NULL,
  width INTEGER NOT NULL, height INTEGER NOT NULL, sha256 TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'unknown', status TEXT NOT NULL DEFAULT 'processing',
  status_detail TEXT NOT NULL DEFAULT 'Ожидает проверки', patient_id TEXT,
  bodycam_state TEXT NOT NULL DEFAULT 'unknown', ocr_text TEXT NOT NULL DEFAULT '',
  ocr_engine TEXT NOT NULL DEFAULT 'pending', signals TEXT NOT NULL DEFAULT '{}',
  score INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS evidence_owner_idx ON evidence(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS evidence_hash_idx ON evidence(user_id,sha256);
CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), start_at TEXT NOT NULL,
  end_at TEXT, notes TEXT NOT NULL DEFAULT '', checklist TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS shifts_owner_idx ON shifts(user_id,start_at DESC);
CREATE TABLE IF NOT EXISTS notices (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL,
  title TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL, read_at TEXT
);
CREATE INDEX IF NOT EXISTS notices_owner_idx ON notices(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id TEXT, action TEXT NOT NULL, target TEXT NOT NULL,
  extra TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY, label TEXT NOT NULL, category TEXT NOT NULL,
  needed INTEGER NOT NULL, description TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS academy_state (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  progress TEXT NOT NULL DEFAULT '{}',
  course TEXT NOT NULL DEFAULT '01',
  step INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
`);
// Non-destructive migration for existing installations.
if (!db.prepare('PRAGMA table_info(users)').all().some(c=>c.name==='rank_updated_at')) db.exec('ALTER TABLE users ADD COLUMN rank_updated_at TEXT');
if (!db.prepare('SELECT id FROM goals LIMIT 1').get()) {
  const put=db.prepare('INSERT INTO goals(id,label,category,needed,description) VALUES(?,?,?,?,?)');
  put.run('pmp-40','ПМП — 40 подтверждений','pmp',40,'Проверяйте актуальные требования повышения у руководства. Учитываются только доказательства после последнего повышения.');
  put.run('treat-30','Лечение — Склифосовского','treatment',30,'Ориентир для этапа 2→3. Подтвердите норму и место по актуальному регламенту.');
  put.run('treat-20','Лечение — Ворохобова','treatment',20,'Ориентир для этапа 2→3. Подтвердите норму и место по актуальному регламенту.');
}
export const now = () => new Date().toISOString();
export function audit(actor,action,target,extra={}) {
  db.prepare('INSERT INTO audit(actor_id,action,target,extra,created_at) VALUES(?,?,?,?,?)').run(actor||null,action,target,JSON.stringify(extra),now());
}
export function notice(userId,kind,title,message) {
  db.prepare('INSERT INTO notices(id,user_id,kind,title,message,created_at) VALUES(?,?,?,?,?,?)').run(crypto.randomUUID(),userId,kind,title,message,now());
}
