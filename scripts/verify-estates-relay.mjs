import assert from 'node:assert/strict';
import {chromium,webkit} from '@playwright/test';
import {spawn} from 'node:child_process';
import {RELAY_URL} from '../public/estates/relay-config.js';
import {acknowledgeReceipts} from './estate-test-confirmations.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:4185/night-arcade/';
const server=process.env.BASE_URL?null:spawn(process.execPath,['server.mjs'],{stdio:'pipe'});
let chrome,safari;const sessions=[];
const api=async(data,token)=>{const r=await fetch(RELAY_URL+'/api',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});return {status:r.status,data:await r.json()};};
try{
 if(server)await new Promise(r=>server.stdout.once('data',r));
 chrome=await chromium.launch({channel:'chrome'});safari=await webkit.launch();
 const host=await chrome.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const guest=await safari.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];for(const p of [host,guest]){p.on('pageerror',e=>errors.push(e.message));await acknowledgeReceipts(p);}
 await host.goto(new URL('estates/',base).href);await host.locator('#nickname').fill('Host');await host.locator('#create').click();await host.waitForFunction(()=>estateNetwork.members.length===1);
 const room=await host.locator('#room').textContent();assert.match(room,/^\d{4}$/);
 const h=await host.evaluate(()=>({token:estateNetwork.token,id:estateNetwork.id}));sessions.push({room,...h});
 assert.equal((await api({op:'create',room,name:'duplicate'})).status,400);
 const invite=await host.locator('#share-url').inputValue();await guest.goto(invite);assert.equal(await guest.locator('#code').isVisible(),false);await guest.locator('#nickname').fill('Safari');await guest.locator('#join').click();await guest.waitForFunction(()=>estateNetwork.members.length===2);await host.waitForFunction(()=>estateNetwork.members.length===2);
 const g=await guest.evaluate(()=>({token:estateNetwork.token,id:estateNetwork.id}));sessions.push({room,...g});
 assert.equal((await api({op:'poll',room},'wrong')).status,403);
 assert.equal((await api({op:'start',room},g.token)).status,400);
 assert(!JSON.stringify((await api({op:'poll',room},h.token)).data).includes(g.token),'tokens never shared');
 const others=[];for(let i=0;i<2;i++){const r=await api({op:'join',room,name:'manual'+i});assert.equal(r.status,200);others.push(r.data);sessions.push({room,...r.data});}
 assert.equal((await api({op:'join',room,name:'fifth'})).status,400);
 for(const p of others)assert.equal((await api({op:'leave',room},p.token)).status,200);
 await host.waitForFunction(()=>estateNetwork.members.length===2);await host.locator('#start').click();await guest.waitForFunction(()=>!!estateNetwork.state);
 assert.equal((await api({op:'join',room,name:'late'})).status,400);
 assert.equal((await api({op:'action',room,revision:0,playerId:h.id,action:{type:'roll'}},g.token)).status,400);
 assert.equal((await api({op:'action',room,revision:999,action:{type:'roll'}},h.token)).status,409);
 await host.getByRole('button',{name:'サイコロを振る',exact:true}).click();await guest.waitForFunction(()=>estateNetwork.state.revision>0);
 // Advance actual authoritative random game, retaining the same rules and turn ownership.
 for(let i=0;i<25;i++){
  const s=(await api({op:'poll',room},h.token)).data.state;
  if(s.turn===1)break;
  const p=s.players[s.turn];const token=p.id===h.id?h.token:g.token;
  const type=s.phase==='buy'?'buy':s.phase==='roll'?'roll':s.phase==='end'?'end':s.phase==='debt'?'bankrupt':null;
  assert(type,'unexpected phase '+s.phase);const r=await api({op:'action',room,revision:s.revision,action:{type}},token);assert.equal(r.status,200,JSON.stringify(r.data));
 }
 await guest.waitForFunction(()=>estateNetwork.state.turn===1);
 const revision=await guest.evaluate(()=>estateNetwork.state.revision);
 await guest.waitForFunction(()=>!document.querySelector('.payment-sheet'));
 // Safari sends action over HTTPS (not WebRTC), both render the new state.
 await guest.evaluate(()=>estateNetwork.action({type:'roll'}));await host.waitForFunction(r=>estateNetwork.state.revision>r,revision);
 const final=(await api({op:'poll',room},h.token)).data.state;
 for(const p of [host,guest]){await p.waitForFunction(r=>estateNetwork.state.revision===r,final.revision);assert.deepEqual(await p.evaluate(()=>estateNetwork.state),final);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 // Temporary network loss retries without losing player identity.
 await guest.context().setOffline(true);await guest.waitForFunction(()=>estateNetwork.status.includes('自動で再接続'));
 await guest.context().setOffline(false);await guest.waitForFunction(()=>estateNetwork.status==='対戦中');assert.equal(await guest.evaluate(()=>estateNetwork.id),g.id);
 await guest.screenshot({path:'artifacts/estates-relay-webkit.png'});
 await api({op:'leave',room},g.token);await host.waitForFunction(()=>estateNetwork.halted);assert.deepEqual(errors,[]);
 const forbidden=await fetch(RELAY_URL+'/api',{method:'OPTIONS',headers:{Origin:'https://example.com'}});assert.equal(forbidden.status,403);
 console.log('PASS public HTTPS relay: Chrome + mobile WebKit join/invite, four-member limit, collision, token isolation, authority/revision rejection, roll/turn/full state sync, offline retry, leave, CORS. Not physical iPhone/cellular proof.');
}finally{for(const s of sessions)await api({op:'leave',room:s.room},s.token).catch(()=>{});await chrome?.close();await safari?.close();server?.kill();}
