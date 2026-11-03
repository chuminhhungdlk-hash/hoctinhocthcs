import {put,list} from '@vercel/blob';
import {generateText} from 'ai';
import {createHmac,createHash} from 'node:crypto';
const SEC=process.env.AUTH_SECRET||'',TH=process.env.TEACHER_HASH||'';
const MODELS=[process.env.AI_MODEL,'anthropic/claude-sonnet-5.5','anthropic/claude-sonnet-4.6','anthropic/claude-sonnet-4.5'].filter(Boolean);
const QUICK=[process.env.AI_MODEL_QUICK,'anthropic/claude-haiku-4.5',...MODELS].filter(Boolean);
const hm=s=>createHmac('sha256',SEC).update(s).digest('hex'),NS='d/'+hm('ns').slice(0,20)+'/';
const sign=o=>{const p=Buffer.from(JSON.stringify(o)).toString('base64url');return p+'.'+hm(p)};
const ver=h=>{const[p,s]=String(h||'').replace(/^Bearer /,'').split('.');if(!p||s!==hm(p))return null;try{const o=JSON.parse(Buffer.from(p,'base64url'));return o.e>Date.now()?o:null}catch{return null}};
const rd=async n=>{const{blobs}=await list({prefix:NS+n,limit:1});return blobs[0]?fetch(blobs[0].url+'?t='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null):null};
const wr=(n,v)=>put(NS+n,JSON.stringify(v),{access:'public',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',cacheControlMaxAge:60});
const GK=process.env.GEMINI_API_KEY||'',OK=process.env.OPENAI_API_KEY||'';
const pj=async(u,h,b)=>{const r=await fetch(u,{method:'POST',headers:{'content-type':'application/json',...h},body:JSON.stringify(b)});if(!r.ok)throw new Error(r.status+' '+(await r.text()).slice(0,120));return r.json()};
const gem=async(p,n,m)=>{const b={contents:[{parts:[{text:p}]}],generationConfig:{maxOutputTokens:n,thinkingConfig:{thinkingBudget:0}}},U=[[`https://aiplatform.googleapis.com/v1/publishers/google/models/${m}:generateContent?key=${GK}`,{}],[`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,{'x-goog-api-key':GK}]];if(!GK.startsWith('AQ.'))U.reverse();let e;for(const[u,h]of U)try{const r=await pj(u,h,b),t=(r.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('');if(t)return t}catch(x){e=x}throw e||new Error('empty')};
const oai=async(p,n,m)=>(await pj('https://api.openai.com/v1/chat/completions',{authorization:'Bearer '+OK},{model:m,messages:[{role:'user',content:p}],max_completion_tokens:n})).choices[0].message.content;
const fn=c=>'r/'+String(c).replace(/[^\w-]/g,'_')+'.json';
export default async function handler(req,res){
const no=(c,e)=>res.status(c).json({e});
try{
if(req.method!=='POST')return no(405,'method');
if(!SEC)return no(500,'config:AUTH_SECRET');
const b=typeof req.body=='string'?JSON.parse(req.body||'{}'):req.body||{},op=b.op,u=ver(req.headers.authorization);
if(op=='classes'){const r=(await rd('roster.json'))||[];return res.json({list:[...new Set(r.map(s=>{const a=s.split('|');return'||'+a[2]+'|'+a[3]}))]})}
if(op=='login'){const r=(await rd('roster.json'))||[],c=String(b.c||'').trim().toUpperCase(),x=r.map(s=>s.split('|')).find(a=>a[0].toUpperCase()==c&&a[2]==b.k&&a[3]==b.l);if(!x)return no(401,'no');return res.json({token:sign({r:'s',c:x[0],e:Date.now()+432e5}),c:x[0],n:x[1]})}
if(op=='tlogin'){const h=createHash('sha256').update('tin6789|'+b.u+':'+b.p).digest('hex');if(!TH||h!==TH)return no(401,'no');return res.json({token:sign({r:'t',e:Date.now()+288e5})})}
if(!u)return no(401,'auth');
if(op=='names'){const r=((await rd('roster.json'))||[]).map(x=>x.split('|'));if(u.r!='t')return no(403,'role');return res.json({list:r.filter(x=>x[2]==b.k&&x[3]==b.l).map(x=>[x[1],x[4]||''])})}
if(op=='ai'){const q=b.tier=='quick',pr=String(b.prompt||'').slice(0,12000),n=q?2000:6000,T=[];
if(GK)for(const m of[process.env.GEMINI_MODEL,'gemini-2.5-flash'].filter(Boolean))T.push(()=>gem(pr,n,m));
if(OK)for(const m of[process.env.OPENAI_MODEL,'gpt-4o-mini'].filter(Boolean))T.push(()=>oai(pr,n,m));
for(const m of q?QUICK:MODELS)T.push(async()=>(await generateText({model:m,prompt:pr,maxOutputTokens:n})).text);
let err;for(const f of T){try{const t=await f();if(t)return res.json({text:t})}catch(e){err=e}}return no(502,'ai:'+String(err?.message||err).slice(0,160))}
if(u.r=='s'){
if(op=='mine')return res.json({a:(await rd(fn(u.c)))||[]});
if(op=='save'){const a=(Array.isArray(b.list)?b.list:[]).filter(r=>r&&r.c===u.c&&typeof r.id=='string'&&r.s>=0&&r.s<=100).slice(-150);await wr(fn(u.c),a);return res.json({ok:a.length})}}
if(u.r=='t'){
if(op=='roster')return res.json({list:(await rd('roster.json'))||[]});
if(op=='setRoster'){const l=(Array.isArray(b.list)?b.list:[]).filter(s=>typeof s=='string'&&[4,5].includes(s.split('|').length)).slice(0,3000);await wr('roster.json',l);return res.json({ok:l.length})}
if(op=='results'){const all=[];let cur;do{const q=await list({prefix:NS+'r/',limit:1000,cursor:cur});cur=q.hasMore?q.cursor:null;for(let i=0;i<q.blobs.length;i+=25)(await Promise.all(q.blobs.slice(i,i+25).map(x=>fetch(x.url+'?t='+Date.now(),{cache:'no-store'}).then(r=>r.json()).catch(()=>[])))).forEach(a=>all.push(...a))}while(cur);return res.json({a:all})}}
return no(400,'op')
}catch(e){return no(500,'srv:'+String(e?.message||e).slice(0,160))}}
