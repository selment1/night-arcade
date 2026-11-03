import assert from 'node:assert/strict';import{initial,moves,flips,play,directions}from'../public/games/reversi-engine.js';
assert.deepEqual(moves(initial(),1),[19,26,37,44]);
const all=Array(64).fill(0);for(const[dr,dc]of directions){all[(3+dr)*8+3+dc]=2;all[(3+2*dr)*8+3+2*dc]=1}assert.equal(flips(all,27,1).length,8);assert.equal(play(all,27,1).board.filter(v=>v===1).length,17);assert.equal(play(initial(),0,1),null);
const end=Array(64).fill(1);end[0]=0;end[1]=2;assert.equal(play(end,0,1).ended,true);
const pass=[1,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,1,1,2,2,1,1,2,0,1,1,1,2,2,1,2,1,1,1,1,2,2,1,2,0,1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,2,1,1,2,2,1,1,0];const p=play(pass,24,2);assert.equal(p.pass,true);assert.equal(p.turn,2);assert.equal(p.ended,false);
console.log('Reversi fixtures passed: initial, eight directions, illegal, pass, end');

// Exercise real saved games and the shared reward ledger, not a reward stub.
const {chromium}=await import('@playwright/test');
const {createServer}=await import('node:http');
const {readFile}=await import('node:fs/promises');
let server,browser;
try{
 let base=process.env.BASE_URL;
 if(!base){server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;const file=await readFile(new URL('../public'+path,import.meta.url));res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':'text/html');res.end(file)}catch{res.writeHead(404);res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}/`;}
 const url=new URL('games/reversi.html',base.endsWith('/')?base:base+'/').href;
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const blocked of [false,true]){
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
  await page.evaluate(()=>{const b=Array(64).fill(1);b[0]=0;b[1]=2;localStorage.setItem('night-reversi-v1',JSON.stringify({b,turn:1,last:2,ended:false,history:[]}));});
  if(blocked)await page.addInitScript(()=>{const original=Storage.prototype.setItem;window.blockReversiSave=true;Storage.prototype.setItem=function(k,v){if(k==='night-reversi-v1'&&window.blockReversiSave)throw Error('reversi save unavailable');return original.call(this,k,v);};});
  let matchId;
  for(let attempt=0;attempt<2;attempt++){
   await page.reload();await page.locator('#board button[data-index="0"]').click();assert.match(await page.locator('#status').innerText(),/終局/);
   const pet=await page.evaluate(()=>NightPet.snapshot());assert.equal(pet.coins,blocked?0:30,`legacy completion, blocked=${blocked}, attempt=${attempt}`);assert.equal(pet.gamesPlayed,blocked?0:1);
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('night-reversi-v1')));
   if(blocked){assert.equal(saved.matchId,undefined);assert.equal(saved.b[0],0);assert.equal(await page.locator('#storage').isVisible(),true);}
   else{assert.equal(saved.b[0],1);assert.equal(saved.history.length,1);assert.equal(typeof saved.matchId,'string');assert(saved.matchId.length>=4);if(matchId)assert.equal(saved.matchId,matchId);matchId=saved.matchId;await page.locator('#undo').click();}
  }
  if(blocked){await page.locator('#undo').click();assert.match(await page.locator('#status').innerText(),/終局/);await page.evaluate(()=>{window.blockReversiSave=false;});await page.locator('#undo').click();assert.equal(await page.evaluate(()=>NightPet.snapshot().coins),30);await page.locator('#board button[data-index="0"]').click();assert.equal(await page.evaluate(()=>NightPet.snapshot().coins),30);await page.reload();await page.locator('#undo').click();await page.locator('#board button[data-index="0"]').click();assert.equal(await page.evaluate(()=>NightPet.snapshot().gamesPlayed),1);}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);await ctx.close();
 }
 // Terminal legacy recovery must settle before undo or a confirmed restart destroys it.
 for(const action of ['undo','restart']){
  const ctx=await browser.newContext();const page=await ctx.newPage();await page.goto(url);
  await page.evaluate(()=>{const before=Array(64).fill(1);before[0]=0;before[1]=2;localStorage.setItem('night-reversi-v1',JSON.stringify({b:Array(64).fill(1),turn:1,last:0,ended:true,history:[{b:before,turn:1,last:2,ended:false}]}));});
  await page.addInitScript(()=>{window.blockReversiSave=true;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='night-reversi-v1'&&window.blockReversiSave)throw Error('blocked');return original.call(this,k,v)};});await page.reload();
  const original=await page.evaluate(()=>localStorage.getItem('night-reversi-v1'));
  if(action==='restart'){page.once('dialog',d=>d.dismiss());await page.locator('#restart').click();assert.equal(await page.evaluate(()=>localStorage.getItem('night-reversi-v1')),original);}
  if(action==='restart')page.once('dialog',d=>d.accept());await page.locator('#'+action).click();
  assert.match(await page.locator('#status').innerText(),/終局/);assert.equal(await page.evaluate(()=>localStorage.getItem('night-reversi-v1')),original);assert.equal(await page.evaluate(()=>NightPet.snapshot().coins),0);
  await page.evaluate(()=>{window.blockReversiSave=false;});if(action==='restart')page.once('dialog',d=>d.accept());await page.locator('#'+action).click();
  const recovered=await page.evaluate(()=>({pet:NightPet.snapshot(),game:JSON.parse(localStorage.getItem('night-reversi-v1'))}));assert.equal(recovered.pet.coins,30);assert.equal(recovered.pet.xp,20);assert.equal(recovered.pet.gamesPlayed,1);assert.equal(recovered.game.ended,false);assert.equal(recovered.game.history.length,0);assert.equal(await page.locator('#storage').isVisible(),false);
  await page.reload();assert.equal(await page.evaluate(()=>NightPet.snapshot().coins),30);
  if(action==='undo'){await page.evaluate(()=>{window.blockReversiSave=false;});await page.locator('[data-index="0"]').click();assert.equal(await page.evaluate(()=>NightPet.snapshot().gamesPlayed),1);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('night-reversi-v1')).matchId),recovered.game.matchId);}
  await ctx.close();
 }
 console.log('PASS: terminal legacy undo/restart preserve blocked state, cancel is inert, recovery settles exactly once.');
 console.log('PASS: Reversi legacy identity, reload/undo reward deduplication, blocked-save deferral and recovery, mobile layout.');
}finally{await browser?.close();if(server)await new Promise(r=>server.close(r));}
