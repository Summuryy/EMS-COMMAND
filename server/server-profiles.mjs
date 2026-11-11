// EMS COMMAND server profiles — draft contract for cross-platform EMS workflows.
// Pure domain module: it never contacts game servers, changes user accounts or
// authorizes promotions. Only versioned, externally verified rules may be active.
export const PROFILE_SCHEMA_VERSION=1;
export const PLATFORM_IDS=Object.freeze(['russia-online','gta5rp','majestic','custom']);
export const RULE_STATUSES=Object.freeze(['draft','verified']);
const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const limited=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.trim().length<=max;
const slug=value=>typeof value==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)&&value.length<=64;
const ruleKey=value=>typeof value==='string'&&/^[a-z][a-z0-9_-]{0,63}$/.test(value);

export function validateServerProfile(input){
 const errors=[];
 if(!isRecord(input))return {ok:false,errors:['profile must be an object']};
 if(!PLATFORM_IDS.includes(input.platformId))errors.push('invalid platformId');
 if(!slug(input.serverId))errors.push('invalid serverId');
 if(!limited(input.serverName,80))errors.push('invalid serverName');
 if(!RULE_STATUSES.includes(input.rulesStatus))errors.push('invalid rulesStatus');
 if(input.schemaVersion!==PROFILE_SCHEMA_VERSION)errors.push('unsupported schemaVersion');
 if(!Array.isArray(input.promotionRules)||input.promotionRules.length>200)errors.push('invalid promotionRules');
 if(!Array.isArray(input.evidenceRules)||input.evidenceRules.length>100)errors.push('invalid evidenceRules');
 if(Array.isArray(input.promotionRules)){
  const keys=new Set();
  for(const item of input.promotionRules){
   if(!isRecord(item)||!ruleKey(item.id)||!limited(item.title,120)||
      !Number.isInteger(item.targetRank)||item.targetRank<1||item.targetRank>100){
    errors.push('invalid promotion rule');continue;
   }
   if(keys.has(item.id))errors.push('duplicate promotion rule');keys.add(item.id);
  }
 }
 if(Array.isArray(input.evidenceRules)){
  const keys=new Set();
  for(const item of input.evidenceRules){
   if(!isRecord(item)||!ruleKey(item.id)||!limited(item.title,120)){
    errors.push('invalid evidence rule');continue;
   }
   if(keys.has(item.id))errors.push('duplicate evidence rule');keys.add(item.id);
  }
 }
 if(input.rulesStatus==='verified'){
  if(!limited(input.rulesVersion,40))errors.push('verified profile requires rulesVersion');
  if(!Number.isFinite(Date.parse(input.verifiedAt||'')))errors.push('verified profile requires verifiedAt');
  try{
   const url=new URL(input.sourceUrl);
   if(url.protocol!=='https:'||!url.hostname)errors.push('verified profile needs https source');
  }catch{errors.push('verified profile needs https source');}
 }
 return {ok:errors.length===0,errors};
}

export function createServerProfile(input){
 const check=validateServerProfile(input);
 if(!check.ok)throw new TypeError(check.errors.join('; '));
 // Only allowlisted fields are returned, so unknown metadata cannot masquerade
 // as rules or executable configuration.
 const profile={
  schemaVersion:PROFILE_SCHEMA_VERSION,
  platformId:input.platformId,
  serverId:input.serverId,
  serverName:input.serverName.trim(),
  rulesStatus:input.rulesStatus,
  rulesVersion:input.rulesStatus==='verified'?input.rulesVersion.trim():null,
  verifiedAt:input.rulesStatus==='verified'?new Date(input.verifiedAt).toISOString():null,
  sourceUrl:input.rulesStatus==='verified'?input.sourceUrl:null,
  promotionRules:Object.freeze(input.promotionRules.map(x=>Object.freeze({
   id:x.id,title:x.title.trim(),targetRank:x.targetRank
  }))),
  evidenceRules:Object.freeze(input.evidenceRules.map(x=>Object.freeze({
   id:x.id,title:x.title.trim()
  })))
 };
 return Object.freeze(profile);
}

export function profileKey(profile){
 if(!profile||!PLATFORM_IDS.includes(profile.platformId)||!slug(profile.serverId)){
  throw new TypeError('Invalid server identity');
 }
 return `${profile.platformId}:${profile.serverId}`;
}

// In a draft profile, clients may show guide text, but never report that
// promotion thresholds have been certified for that game server.
export function mayUsePromotionRules(profile){
 return profile?.rulesStatus==='verified'&&profile.promotionRules.length>0&&
   validateServerProfile(profile).ok;
}

// The first target is Russia Online / Kutuzovsky. Counts, rank requirements,
// evidence acceptance rules and handbook versions are deliberately unknown.
export const RUSSIA_ONLINE_KUTUZOVSKY=createServerProfile({
 schemaVersion:PROFILE_SCHEMA_VERSION,platformId:'russia-online',
 serverId:'kutuzovsky',serverName:'Кутузовский',rulesStatus:'draft',
 promotionRules:[],evidenceRules:[]
});
