import http from 'node:http';
import {randomBytes,randomInt} from 'node:crypto';
import {createGame,act} from '../public/estates/engine.js';
const rooms=new Map(), limits=new Map();
const allowed=new Set(['https://selment1.github.io','http://127.0.0.1:4185','http://localhost:4185']);
const error=(message,status=400)=>Object.assign(new Error(message),{status});
const now=()=>Date.now();
const snapshot=r=>({members:r.members.map(({token,lastSeen,...m})=>({...m,connected:now()-lastSeen<45000})),state:r.state,room:r.code,halted:!!r.halted,status:r.halted?'参加者が退出したため対戦を終了しました。':r.state?'対戦中':'友だちの参加を待っています'});
const server=http.createServer(async(req,res)=>{
 const origin=req.headers.origin;
 if(origin&&!allowed.has(origin)){res.writeHead(403);res.end();return;}
 if(origin)res.setHeader('Access-Control-Allow-Origin',origin);
 res.setHeader('Vary','Origin');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','POST, GET, OPTIONS');
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
 const send=(code,data)=>{res.writeHead(code);res.end(JSON.stringify(data));};
 if(req.url==='/health'&&req.method==='GET'){send(200,{ok:true,transport:'https-relay',version:1});return;}
 try{
  if(req.method!=='POST'||req.url!=='/api')throw error('Not found',404);
  const ip=req.headers['cf-connecting-ip']||req.socket.remoteAddress;
  let rate=limits.get(ip);if(!rate||now()-rate.at>60000){rate={at:now(),count:0};limits.set(ip,rate);}if(++rate.count>600)throw error('操作が多すぎます。少し待ってください。',429);
  let body='';for await(const chunk of req){body+=chunk;if(body.length>8192)throw error('リクエストが大きすぎます',413);}
  const d=JSON.parse(body);if(!d||typeof d!=='object')throw error('不正な操作です');
  if(d.op==='create'||d.op==='join'){
   if(typeof d.name!=='string')throw error('名前を入力してください');
   let code=String(d.room||'').normalize('NFKC').trim();
   if(code&&!/^\d{4}$/.test(code))throw error('ルーム番号は4桁の数字です');
   let r;
   if(d.op==='create'){
    if(rooms.size>=500)throw error('満室です。少し後でお試しください。',503);
    if(code&&rooms.has(code))throw error('このルーム番号は使用中です。別の4桁を指定してください。');
    if(!code){do{code=String(randomInt(10000)).padStart(4,'0');}while(rooms.has(code));}
    r={code,members:[],state:null,touched:now()};rooms.set(code,r);
   }else {r=rooms.get(code);if(!r)throw error('ルームが見つかりません。ホストが先に作成し、同じ番号を入力してください。',404);if(r.state||r.halted||r.members.length>=4)throw error('開始済み、または満員です。');}
   const m={id:randomBytes(12).toString('hex'),token:randomBytes(32).toString('hex'),name:d.name.trim().slice(0,20)||'旅人',lastSeen:now()};r.members.push(m);r.touched=now();
   send(200,{...snapshot(r),id:m.id,token:m.token,host:r.members[0]===m});return;
  }
  const r=rooms.get(d.room);if(!r)throw error('ルームが終了しました。新しい部屋を作ってください。',404);
  const token=(req.headers.authorization||'').replace(/^Bearer /,'');
  const m=r.members.find(m=>m.token===token);if(!m)throw error('参加情報が確認できません。',403);
  m.lastSeen=now();r.touched=now();
  if(d.op==='start'){if(r.members[0]!==m||r.state||r.members.length<2||r.halted)throw error('全員が参加してからホストが開始してください。');r.state=createGame(r.members.map(({id,name})=>({id,name})));}
  else if(d.op==='action'){
   if(!r.state||r.halted)throw error('この対戦は操作できません。');
   if(d.revision!==r.state.revision)throw error('盤面が更新されました。もう一度操作してください。',409);
   const result=act(r.state,m.id,d.action);if(!result.ok)throw error(result.error||'今は操作できません');r.state=result.state;
  }else if(d.op==='leave'){if(r.state||r.members[0]===m)r.halted=true;else r.members=r.members.filter(p=>p!==m);}
  else if(d.op!=='poll')throw error('不正な操作です');
  send(200,snapshot(r));
 }catch(e){send(e.status||400,{error:e.status?e.message:'リクエストを処理できませんでした。'});}
});
setInterval(()=>{for(const [code,r] of rooms)if(now()-r.touched>2*60*60*1000)rooms.delete(code);for(const [ip,r] of limits)if(now()-r.at>60000)limits.delete(ip);},60000).unref();
server.listen(Number(process.env.PORT||4190),'127.0.0.1',()=>console.log('TheRich relay listening on loopback port '+(process.env.PORT||4190)));
