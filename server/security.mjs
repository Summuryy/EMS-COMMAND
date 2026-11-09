import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { db } from './db.mjs';
import { config } from './config.mjs';
const scrypt=promisify(crypto.scrypt);
const PARAMS={N:1<<16,r:8,p:1,maxmem:128*1024*1024};
export const sha256=(s)=>crypto.createHash('sha256').update(s).digest('hex');
export const randomToken=(size=32)=>crypto.randomBytes(size).toString('base64url');
export async function hashPassword(password) {
  if(typeof password!=='string'||password.length<12||Buffer.byteLength(password)>256) throw new Error('Пароль: от 12 до 256 байт');
  const salt=crypto.randomBytes(16).toString('hex');
  const hash=await scrypt(password,Buffer.from(salt,'hex'),64,PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt}$${hash.toString('hex')}`;
}
export async function verifyPassword(password,stored){
  if(typeof password!=='string'||password.length>256) return false;
  const parts=stored.split('$');
  if(parts.length!==6||parts[0]!=='scrypt') return false;
  const [N,r,p]=parts.slice(1,4).map(Number);
  if(![1<<15,1<<16,1<<17].includes(N)||r!==8||p!==1) return false;
  const expected=Buffer.from(parts[5],'hex');
  if(expected.length!==64) return false;
  const got=await scrypt(password,Buffer.from(parts[4],'hex'),64,{N,r,p,maxmem:256*1024*1024});
  return crypto.timingSafeEqual(expected,got);
}
export function createSession(res,userId) {
  const token=randomToken(); const csrf=randomToken(24);
  const t=Date.now();
  db.prepare('INSERT INTO sessions(token_hash,user_id,csrf,created_at,touched_at,expires_at) VALUES(?,?,?,?,?,?)')
    .run(sha256(token),userId,csrf,t,t,t+7*24*3600_000);
  const cookieName=config.secureCookies?'__Host-ems_session':'ems_session';
  res.setHeader('Set-Cookie',`${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${config.secureCookies?'; Secure':''}`);
  return csrf;
}
export function clearSession(res,token) {
  if(token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sha256(token));
  const cookieName=config.secureCookies?'__Host-ems_session':'ems_session';
  res.setHeader('Set-Cookie',`${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${config.secureCookies?'; Secure':''}`);
}
export function readSession(req){
  const name=config.secureCookies?'__Host-ems_session':'ems_session';
  const raw=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='));
  const token=raw?raw.slice(name.length+1):null;
  if(!token||!/^[\w-]{40,80}$/.test(token)) return null;
  const row=db.prepare(`SELECT s.*,u.id AS uid,u.username,u.display_name,u.role,u.server_name,u.static_id,u.static_verified,
  u.rank,u.rank_updated_at,u.department,u.password_reset_required FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?`).get(sha256(token));
  const t=Date.now();
  if(!row) return null;
  if(row.expires_at<t||row.touched_at<t-12*3600_000){ db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sha256(token));return null; }
  if(t-row.touched_at>60_000) db.prepare('UPDATE sessions SET touched_at=? WHERE token_hash=?').run(t,sha256(token));
  return {token,csrf:row.csrf,user:{id:row.uid,username:row.username,displayName:row.display_name,role:row.role,
    serverName:row.server_name,staticId:row.static_id,staticVerified:!!row.static_verified,rank:row.rank,rankUpdatedAt:row.rank_updated_at,
    department:row.department,mustChangePassword:!!row.password_reset_required}};
}
const windows=new Map();
export function rateLimit(key,max=12,period=60_000){
  const t=Date.now();let o=windows.get(key);
  if(!o||o.reset<t){o={count:0,reset:t+period}; windows.set(key,o);}
  o.count++; if(windows.size>10000){for(const [k,v] of windows)if(v.reset<t) windows.delete(k);}
  return o.count<=max;
}
export function checkOrigin(req){
  const origin=req.headers.origin;
  return typeof origin==='string'&&origin===config.origin;
}
export function verifyCSRF(req,session){
  const got=req.headers['x-csrf-token'];
  return typeof got==='string'&&got.length===session.csrf.length&&crypto.timingSafeEqual(Buffer.from(got),Buffer.from(session.csrf));
}
export function safeUser(row){
  return {id:row.id,username:row.username,displayName:row.display_name,role:row.role,
    serverName:row.server_name,staticId:row.static_id,staticVerified:!!row.static_verified,rank:row.rank,rankUpdatedAt:row.rank_updated_at,
    department:row.department,mustChangePassword:!!row.password_reset_required};
}
