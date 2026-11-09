import {db, now, audit} from '../server/db.mjs';
import {hashPassword} from '../server/security.mjs';
import crypto from 'node:crypto';
const chunks=[];
for await(const c of process.stdin)chunks.push(c);
try {
 const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
 const username=String(body.username||'').trim().toLowerCase();
 const displayName=String(body.displayName||'').trim();
 const password=body.password;
 if(!/^[a-z0-9_.-]{3,32}$/.test(username))throw Error('Логин: 3–32 символа латиницы или цифр');
 if(displayName.length<2||displayName.length>60)throw Error('Имя: от 2 до 60 символов');
 if(db.prepare('SELECT 1 FROM users WHERE role=?').get('admin'))throw Error('Администратор уже существует');
 const hash=await hashPassword(password);
 const id=crypto.randomUUID(),t=now();
 db.prepare('INSERT INTO users(id,username,display_name,password_hash,role,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run(id,username,displayName,hash,'admin',t,t);
 audit(id,'system.admin_created',id);
 process.stdout.write('OK');
} catch(e){process.stderr.write(e.message);process.exitCode=1;}
finally{db.close();}
