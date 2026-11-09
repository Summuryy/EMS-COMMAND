import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db, now, audit, notice } from './db.mjs';
import { config } from './config.mjs';
import {hashPassword,verifyPassword,sha256,randomToken,createSession,clearSession,readSession,rateLimit,checkOrigin,verifyCSRF,safeUser} from './security.mjs';
import {imageInfo} from './vision.mjs';
import {enqueue,statusJob} from './jobs.mjs';

const send=(res,data,status=200)=>{
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(data));
};
const fail=(status,message)=>Object.assign(new Error(message),{status});
function requireAuth(session){if(!session)throw fail(401,'Необходимо войти в аккаунт');}
function requireRole(session,roles){requireAuth(session);if(!roles.includes(session.user.role))throw fail(403,'Недостаточно прав');}
function string(value,max=100){if(typeof value!=='string'||value.length>max)throw fail(400,'Некорректный текст');return value.trim();}
async function readBody(req,max=8192){
  if(Number(req.headers['content-length']||0)>max)throw fail(413,'Слишком большой запрос');
  let chunks=[],size=0;
  for await(const part of req){size+=part.length;if(size>max)throw fail(413,'Слишком большой запрос');chunks.push(part);}
  return Buffer.concat(chunks);
}
async function jsonBody(req,max=8192){
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw fail(415,'Ожидается JSON');
  try{return JSON.parse((await readBody(req,max)).toString('utf8'));}catch(e){if(e.status)throw e;throw fail(400,'Некорректный JSON');}
}
function publicEvidence(row){return {id:row.id,name:row.original_name,category:row.category,status:row.status,
  reason:row.status_detail,patientId:row.patient_id,bodycam:row.bodycam_state,
  size:row.file_size,width:row.width,height:row.height,score:row.score,
  ocrEngine:row.ocr_engine,ocrText:row.ocr_text,signals:JSON.parse(row.signals||'{}'),
  createdAt:row.created_at,userId:row.user_id, imageUrl:`/api/evidence/${row.id}/image`};}
function ownerOrStaff(session,row){if(row.user_id!==session.user.id&&!['admin','reviewer'].includes(session.user.role))throw fail(403,'Нет доступа к этому файлу');}
function createUser(reqBody,role='user'){
  const username=string(reqBody.username,32).toLowerCase();
  if(!/^[a-z0-9_.-]{3,32}$/.test(username))throw fail(400,'Логин: латиница, 3–32 символа');
  const displayName=string(reqBody.displayName,60);
  if(displayName.length<2)throw fail(400,'Укажите имя профиля');
  return {username,displayName,role};
}
const rawStats=(owner)=>{
  const summary=db.prepare(`SELECT COUNT(*) total, SUM(CASE WHEN status='accepted' THEN 1 ELSE 0 END) accepted,
    SUM(CASE WHEN status='review' THEN 1 ELSE 0 END) review,
    SUM(CASE WHEN status='rejected' OR status='duplicate' THEN 1 ELSE 0 END) rejected,
    SUM(CASE WHEN status='processing' THEN 1 ELSE 0 END) processing FROM evidence WHERE user_id=?`).get(owner);
  const categories=db.prepare("SELECT category,COUNT(*) count FROM evidence WHERE user_id=? AND status='accepted' GROUP BY category").all(owner);
  return {total:summary.total||0,accepted:summary.accepted||0,review:summary.review||0,
    rejected:summary.rejected||0,processing:summary.processing||0,categories};
};
export async function api(req,res,url){
  const method=req.method,pathName=url.pathname;
  if(!pathName.startsWith('/api/'))return false;
  try{
    if(!['GET','POST','PATCH','DELETE'].includes(method))throw fail(405,'Метод запрещён');
    if(method!=='GET'&&!checkOrigin(req))throw fail(403,'Проверка источника запроса не пройдена');
    let session=readSession(req);
    const loginRoute=pathName==='/api/auth/login',signupRoute=pathName==='/api/auth/register';
    if(method!=='GET'&&!loginRoute&&!signupRoute){requireAuth(session);if(!verifyCSRF(req,session))throw fail(403,'Неверный защитный токен');
      if(session.user.mustChangePassword&&pathName!=='/api/auth/change-password'&&pathName!=='/api/auth/logout')throw fail(403,'Сначала смените пароль');
    }
    if(method==='GET'&&pathName==='/api/health')return send(res,{ok:true,version:'3.0.0',ocr:config.ocrEnabled?'configured':'disabled'}),true;
    if(method==='GET'&&pathName==='/api/auth/me')return send(res,{user:session?.user||null,csrf:session?.csrf||null}),true;
    if(method==='POST'&&loginRoute){
      if(!rateLimit('login:'+req.socket.remoteAddress,10,60_000))throw fail(429,'Слишком много попыток. Попробуйте позже');
      const b=await jsonBody(req),username=string(b.username,32).toLowerCase();
      const user=db.prepare('SELECT * FROM users WHERE username=?').get(username);
      const ok=user?await verifyPassword(b.password,user.password_hash):false;
      if(!ok){ audit(null,'auth.login_failed',username);throw fail(401,'Неверный логин или пароль'); }
      const csrf=createSession(res,user.id);audit(user.id,'auth.login',user.id);
      return send(res,{user:safeUser(user),csrf}),true;
    }
    if(method==='POST'&&signupRoute){
      if(!rateLimit('register:'+req.socket.remoteAddress,6,3600_000))throw fail(429,'Слишком много попыток регистрации');
      const b=await jsonBody(req),u=createUser(b);
      const invite=string(b.invite,150);
      const inviteRow=db.prepare('SELECT * FROM invites WHERE code_hash=? AND used_by IS NULL AND expires_at>?').get(sha256(invite),Date.now());
      if(!inviteRow)throw fail(403,'Приглашение недействительно или использовано');
      const hash=await hashPassword(b.password);
      const id=crypto.randomUUID();const t=now();
      db.exec('BEGIN IMMEDIATE');
      try{
        if(db.prepare('SELECT id FROM users WHERE username=?').get(u.username))throw fail(409,'Логин уже занят');
        db.prepare(`INSERT INTO users(id,username,display_name,password_hash,role,created_at,updated_at) VALUES(?,?,?,?,?,?,?)`).run(id,u.username,u.displayName,hash,'user',t,t);
        const consumed=db.prepare('UPDATE invites SET used_by=? WHERE code_hash=? AND used_by IS NULL AND expires_at>?').run(id,sha256(invite),Date.now());
        if(consumed.changes!==1)throw fail(409,'Приглашение уже использовано');
        db.exec('COMMIT');
      }catch(e){db.exec('ROLLBACK');throw e;}
      audit(id,'auth.register',id);
      const csrf=createSession(res,id);
      return send(res,{user:safeUser(db.prepare('SELECT * FROM users WHERE id=?').get(id)),csrf},201),true;
    }
    requireAuth(session);
    if(session.user.mustChangePassword&&pathName!=='/api/auth/change-password'&&pathName!=='/api/auth/logout')throw fail(403,'Сначала смените пароль');
    if(method==='POST'&&pathName==='/api/auth/logout'){
      clearSession(res,session.token);audit(session.user.id,'auth.logout',session.user.id);return send(res,{ok:true}),true;
    }
    if(method==='POST'&&pathName==='/api/auth/change-password'){
      const b=await jsonBody(req);
      const user=db.prepare('SELECT * FROM users WHERE id=?').get(session.user.id);
      if(!await verifyPassword(b.currentPassword,user.password_hash))throw fail(403,'Текущий пароль неверен');
      const hash=await hashPassword(b.newPassword);
      db.prepare('UPDATE users SET password_hash=?,password_reset_required=0,updated_at=? WHERE id=?').run(hash,now(),user.id);
      db.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash!=?').run(user.id,sha256(session.token));
      audit(user.id,'auth.password_changed',user.id);return send(res,{ok:true}),true;
    }
    if(method==='PATCH'&&pathName==='/api/profile'){
      const b=await jsonBody(req),name=string(b.displayName,60),department=string(b.department,80),staticId=b.staticId==null||b.staticId===''?null:string(String(b.staticId),12);
      if(name.length<2||!department)throw fail(400,'Заполните имя и отделение');
      if(staticId!==null&&!/^\d{1,10}$/.test(staticId))throw fail(400,'Static ID должен состоять из цифр');
      const serverName=string(b.serverName,60);
      if(!serverName)throw fail(400,'Укажите сервер');
      const old=db.prepare('SELECT * FROM users WHERE id=?').get(session.user.id);
      const verified=(old.static_id===staticId&&old.server_name===serverName)?old.static_verified:0;
      db.prepare('UPDATE users SET display_name=?,department=?,static_id=?,server_name=?,static_verified=?,updated_at=? WHERE id=?')
        .run(name,department,staticId,serverName,verified,now(),old.id);
      if(old.static_id!==staticId||old.server_name!==serverName)notice(old.id,'info','Static ID ожидает проверки','Руководство должно подтвердить привязку к игровому аккаунту');
      audit(old.id,'profile.updated',old.id,{staticChanged:old.static_id!==staticId});
      return send(res,{user:safeUser(db.prepare('SELECT * FROM users WHERE id=?').get(old.id))}),true;
    }
    if(method==='GET'&&pathName==='/api/dashboard'){
      const shift=db.prepare('SELECT * FROM shifts WHERE user_id=? ORDER BY start_at DESC LIMIT 1').get(session.user.id)||null;
      const recent=db.prepare('SELECT * FROM evidence WHERE user_id=? ORDER BY created_at DESC LIMIT 5').all(session.user.id).map(publicEvidence);
      const notices=db.prepare('SELECT * FROM notices WHERE user_id=? ORDER BY created_at DESC LIMIT 5').all(session.user.id);
      return send(res,{stats:rawStats(session.user.id),shift,recent,notices}),true;
    }
    if(method==='GET'&&pathName==='/api/evidence'){
      const rows=db.prepare('SELECT * FROM evidence WHERE user_id=? ORDER BY created_at DESC LIMIT 250').all(session.user.id);
      return send(res,{items:rows.map(publicEvidence),stats:rawStats(session.user.id)}),true;
    }
    if(method==='POST'&&pathName==='/api/evidence'){
      if(!rateLimit('upload:'+session.user.id,150,3600_000))throw fail(429,'Слишком много загрузок за час');
      const name=string(url.searchParams.get('name')||'screenshot',180).replace(/[\\/\x00-\x1f]/g,'_')||'screenshot';
      if(!['image/png','image/jpeg','application/octet-stream'].includes((req.headers['content-type']||'').split(';')[0]))throw fail(415,'Допускаются PNG и JPEG');
      const quota=db.prepare('SELECT COUNT(*) n,COALESCE(SUM(file_size),0) bytes FROM evidence WHERE user_id=?').get(session.user.id);
      if(quota.n>=2000||quota.bytes>=2*1024*1024*1024)throw fail(413,'Лимит архива: 2000 файлов или 2 ГБ');
      const bytes=await readBody(req,config.maxUpload);
      if(quota.bytes+bytes.length>2*1024*1024*1024)throw fail(413,'Превышен лимит архива');
      if(bytes.length<300)throw fail(400,'Файл пустой или повреждён');
      const info=imageInfo(bytes);
      if(info.width<480||info.height<270||info.width*info.height>config.maxPixels)throw fail(400,'Размер изображения не поддерживается');
      const sha=sha256(bytes),id=crypto.randomUUID(),stored=id+(info.mime==='image/png'?'.png':'.jpg');
      fs.writeFileSync(path.join(config.dataDir,'uploads',stored),bytes,{flag:'wx',mode:0o600});
      db.prepare(`INSERT INTO evidence(id,user_id,original_name,stored_name,mime,file_size,width,height,sha256,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`)
        .run(id,session.user.id,name,stored,info.mime,bytes.length,info.width,info.height,sha,now(),now());
      enqueue(id,session.user.id);
      audit(session.user.id,'evidence.upload',id,{size:bytes.length});
      return send(res,{id,jobId:id,status:'processing'},202),true;
    }
    const mEvidence=pathName.match(/^\/api\/evidence\/([a-f0-9-]{36})(\/image)?$/);
    if(mEvidence){
      const row=db.prepare('SELECT * FROM evidence WHERE id=?').get(mEvidence[1]);
      if(!row)throw fail(404,'Файл не найден');ownerOrStaff(session,row);
      if(method==='GET'&&mEvidence[2]){
        res.writeHead(200,{'Content-Type':row.mime,'Content-Length':row.file_size,'Cache-Control':'private,no-store','Content-Disposition':'inline; filename="evidence"','X-Content-Type-Options':'nosniff'});
        fs.createReadStream(path.join(config.dataDir,'uploads',row.stored_name)).pipe(res);return true;
      }
      if(method==='GET')return send(res,{item:publicEvidence(row)}),true;
      if(method==='DELETE'&&!mEvidence[2]){
        if(row.user_id!==session.user.id&&session.user.role!=='admin')throw fail(403,'Недостаточно прав');
        db.prepare('DELETE FROM evidence WHERE id=?').run(row.id);
        try{fs.unlinkSync(path.join(config.dataDir,'uploads',row.stored_name));}catch{}
        audit(session.user.id,'evidence.delete',row.id);return send(res,{ok:true}),true;
      }
    }
    const mJob=pathName.match(/^\/api\/jobs\/([a-f0-9-]{36})$/);
    if(mJob&&method==='GET'){
      const job=statusJob(mJob[1],session.user.id);
      const row=db.prepare('SELECT id,status,status_detail FROM evidence WHERE id=? AND user_id=?').get(mJob[1],session.user.id);
      if(!row)throw fail(404,'Задача не найдена');
      return send(res,{stage:job?.stage||'done',label:job?.label||'Готово',percent:job?.percent||100,
        finished:row.status!=='processing',status:row.status,reason:row.status_detail}),true;
    }
    if(method==='GET'&&pathName==='/api/shifts'){
      const shifts=db.prepare('SELECT * FROM shifts WHERE user_id=? ORDER BY start_at DESC LIMIT 60').all(session.user.id);
      return send(res,{shifts:shifts.map(s=>({...s,checklist:JSON.parse(s.checklist||'{}')}))}),true;
    }
    if(method==='POST'&&pathName==='/api/shifts/start'){
      const active=db.prepare('SELECT id FROM shifts WHERE user_id=? AND end_at IS NULL LIMIT 1').get(session.user.id);
      if(active)throw fail(409,'Смена уже запущена');
      const id=crypto.randomUUID();db.prepare('INSERT INTO shifts(id,user_id,start_at) VALUES(?,?,?)').run(id,session.user.id,now());
      audit(session.user.id,'shift.start',id);return send(res,{id},201),true;
    }
    const mShift=pathName.match(/^\/api\/shifts\/([a-f0-9-]{36})\/(end|checklist)$/);
    if(mShift&&method==='POST'){
      const row=db.prepare('SELECT * FROM shifts WHERE id=? AND user_id=?').get(mShift[1],session.user.id);
      if(!row)throw fail(404,'Смена не найдена');
      if(mShift[2]==='end'){
        if(row.end_at)throw fail(409,'Смена уже завершена');
        db.prepare('UPDATE shifts SET end_at=? WHERE id=?').run(now(),row.id);audit(session.user.id,'shift.end',row.id);return send(res,{ok:true}),true;
      }
      if(row.end_at)throw fail(409,'Нельзя менять завершённую смену');
      const b=await jsonBody(req);
      if(!['camera','uniform','radio','briefing','report','equipment'].includes(b.key)||typeof b.value!=='boolean')throw fail(400,'Некорректный пункт');
      const checklist={...JSON.parse(row.checklist||'{}'),[b.key]:b.value};
      db.prepare('UPDATE shifts SET checklist=? WHERE id=?').run(JSON.stringify(checklist),row.id);
      return send(res,{checklist}),true;
    }
    if(method==='GET'&&pathName==='/api/career'){
      const goals=db.prepare('SELECT * FROM goals WHERE active=1 ORDER BY id').all();
      const stats=rawStats(session.user.id);
      const since=session.user.rankUpdatedAt||'';
      stats.categories=db.prepare("SELECT category,COUNT(*) count FROM evidence WHERE user_id=? AND status='accepted' AND created_at>=? GROUP BY category").all(session.user.id,since);
      return send(res,{rank:session.user.rank,goals,stats,verifiedStatic:session.user.staticVerified,rankUpdatedAt:since||null}),true;
    }
    if(method==='GET'&&pathName==='/api/notices'){
      return send(res,{items:db.prepare('SELECT * FROM notices WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(session.user.id)}),true;
    }
    if(method==='POST'&&pathName==='/api/notices/read'){
      db.prepare('UPDATE notices SET read_at=? WHERE user_id=? AND read_at IS NULL').run(now(),session.user.id);
      return send(res,{ok:true}),true;
    }
    // All admin routes enforce role on the backend, regardless of hidden UI navigation.
    if(pathName.startsWith('/api/admin/')){
      requireRole(session,['admin','reviewer']);
      if(method==='GET'&&pathName==='/api/admin/reviews'){
        return send(res,{items:db.prepare("SELECT e.*,u.username FROM evidence e JOIN users u ON u.id=e.user_id WHERE e.status IN ('review','rejected','accepted') ORDER BY e.created_at DESC LIMIT 150").all().map(r=>({...publicEvidence(r),username:r.username}))}),true;
      }
      const review=pathName.match(/^\/api\/admin\/evidence\/([a-f0-9-]{36})\/decision$/);
      if(method==='POST'&&review){
        const b=await jsonBody(req),decision=string(b.decision,20),reason=string(b.reason,250);
        const category=string(b.category,30);
        if(!['treatment','pmp','vaccination','duty','promotion','unknown'].includes(category))throw fail(400,'Недопустимая категория');
        if(!['accepted','rejected','review'].includes(decision)||reason.length<8)throw fail(400,'Укажите решение и причину (минимум 8 символов)');
        const item=db.prepare('SELECT * FROM evidence WHERE id=?').get(review[1]);if(!item)throw fail(404,'Запись не найдена');
        db.prepare('UPDATE evidence SET status=?,category=?,status_detail=?,updated_at=? WHERE id=?').run(decision,category,'Решение сотрудника: '+reason,now(),item.id);
        audit(session.user.id,'evidence.moderate',item.id,{from:item.status,to:decision,fromCategory:item.category,toCategory:category,reason});
        notice(item.user_id,decision==='accepted'?'success':'warning','Решение по доказательству',reason);
        return send(res,{ok:true}),true;
      }
      requireRole(session,['admin']);
      if(method==='GET'&&pathName==='/api/admin/users'){
        return send(res,{items:db.prepare('SELECT id,username,display_name,role,server_name,static_id,static_verified,rank,department,created_at FROM users ORDER BY created_at DESC').all()}),true;
      }
      if(method==='POST'&&pathName==='/api/admin/invites'){
        const code=randomToken(24),expires=Date.now()+48*3600_000;
        db.prepare('INSERT INTO invites(code_hash,issued_by,created_at,expires_at) VALUES(?,?,?,?)').run(sha256(code),session.user.id,now(),expires);
        audit(session.user.id,'admin.invite_created','invite');return send(res,{code,expiresAt:new Date(expires).toISOString()},201),true;
      }
      const staticRoute=pathName.match(/^\/api\/admin\/users\/([a-f0-9-]{36})\/static$/);
      if(method==='POST'&&staticRoute){
        const b=await jsonBody(req),verified=!!b.verified;
        const user=db.prepare('SELECT * FROM users WHERE id=?').get(staticRoute[1]);if(!user)throw fail(404,'Пользователь не найден');
        if(!user.static_id)throw fail(400,'Пользователь не указал Static ID');
        try{db.prepare('UPDATE users SET static_verified=?,updated_at=? WHERE id=?').run(verified?1:0,now(),user.id);}catch{throw fail(409,'Этот Static ID уже привязан к другому подтверждённому аккаунту');}
        audit(session.user.id,'admin.static_'+(verified?'approved':'revoked'),user.id,{server:user.server_name,static:user.static_id});
        notice(user.id,verified?'success':'warning','Static ID '+(verified?'подтверждён':'не подтверждён'),'Решение принято администратором после внешней проверки');
        return send(res,{ok:true}),true;
      }
      const rankRoute=pathName.match(/^\/api\/admin\/users\/([a-f0-9-]{36})\/rank$/);
      if(method==='POST'&&rankRoute){
        const b=await jsonBody(req),rank=Number(b.rank);
        if(!Number.isInteger(rank)||rank<1||rank>20)throw fail(400,'Ранг от 1 до 20');
        const user=db.prepare('SELECT * FROM users WHERE id=?').get(rankRoute[1]);if(!user)throw fail(404,'Пользователь не найден');
        db.prepare('UPDATE users SET rank=?,rank_updated_at=?,updated_at=? WHERE id=?').run(rank,now(),now(),user.id);
        audit(session.user.id,'admin.rank_changed',user.id,{old:user.rank,new:rank});
        notice(user.id,'info','Ранг обновлён','Установлен '+rank+' ранг');return send(res,{ok:true}),true;
      }
      const roleRoute=pathName.match(/^\/api\/admin\/users\/([a-f0-9-]{36})\/role$/);
      if(method==='POST'&&roleRoute){
        const b=await jsonBody(req),role=string(b.role,20);
        if(!['user','reviewer'].includes(role))throw fail(400,'Для выдачи роли доступны только сотрудник и проверяющий');
        const member=db.prepare('SELECT * FROM users WHERE id=?').get(roleRoute[1]);if(!member)throw fail(404,'Пользователь не найден');
        if(member.id===session.user.id||member.role==='admin')throw fail(403,'Нельзя менять роль администратора через интерфейс');
        db.prepare('UPDATE users SET role=?,updated_at=? WHERE id=?').run(role,now(),member.id);
        db.prepare('DELETE FROM sessions WHERE user_id=?').run(member.id);
        audit(session.user.id,'admin.role_changed',member.id,{old:member.role,new:role});
        notice(member.id,'info','Роль обновлена',role==='reviewer'?'Вам открыт доступ к проверке доказательств':'Права проверки отозваны');
        return send(res,{ok:true}),true;
      }
      if(method==='GET'&&pathName==='/api/admin/audit'){
        return send(res,{items:db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 100').all()}),true;
      }
    }
    throw fail(404,'Адрес не найден');
  }catch(e){
    if(e?.code==='SQLITE_CONSTRAINT_UNIQUE')return send(res,{error:'Такая запись уже существует'},409),true;
    const status=e.status||500;
    if(status>=500)console.error('[api]',e);
    send(res,{error:status>=500?'Внутренняя ошибка сервера':e.message},status);
    return true;
  }
}
