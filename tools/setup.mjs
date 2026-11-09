import { db, now, audit } from '../server/db.mjs';
import { hashPassword } from '../server/security.mjs';
import crypto from 'node:crypto';
import readline from 'node:readline/promises';
import process from 'node:process';
if (db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get()) {console.log('Администратор уже создан. Пропускаем настройку.');process.exit(0);}
const rl=readline.createInterface({input:process.stdin,output:process.stdout});
let username, password, displayName;
try{
  console.log('\nEMS COMMAND — первичная настройка\n');
  username=(process.env.EMS_SETUP_USER||await rl.question('Логин администратора (латиница и цифры): ')).trim();
  displayName=(process.env.EMS_SETUP_NAME||await rl.question('Отображаемое имя: ')).trim()||'Администратор';
  password=process.env.EMS_SETUP_PASSWORD||await rl.question('Пароль (минимум 12 символов): ');
  if(!/^[a-z0-9_.-]{3,32}$/i.test(username)) throw Error('Логин: 3–32 символа a-z, 0-9, _ . -');
  if(password.length<12) throw Error('Слишком короткий пароль');
  const hash=await hashPassword(password);
  const id=crypto.randomUUID();
  db.prepare(`INSERT INTO users(id,username,display_name,password_hash,role,created_at,updated_at) VALUES(?,?,?,?,?,?,?)`)
    .run(id,username,displayName.slice(0,60),hash,'admin',now(),now());
  audit(id,'system.admin_created',id);
  console.log('Администратор создан. Теперь запускайте START_WINDOWS.bat или npm start.\n');
} catch(e){console.error('Ошибка настройки:',e.message);process.exitCode=1;}
finally{rl.close();}
