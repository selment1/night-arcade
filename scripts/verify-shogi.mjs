import assert from 'node:assert/strict';
import {initial,legalMoves,apply,inCheck,result,key,restore,validState} from '../public/games/shogi-engine.js';
const blank=()=>({board:Array(81).fill(null),hands:{b:{},w:{}},turn:'b'});
const fixture=(pieces,hands={b:{},w:{}},turn='b')=>{const s=blank();for(const [i,p] of Object.entries(pieces))s.board[i]=p;s.hands=hands;s.turn=turn;return s};
const has=(s,m)=>legalMoves(s).some(v=>Object.entries(m).every(([k,vv])=>v[k]===vv));
const move=(s,m)=>{assert(has(s,m),`illegal fixture move ${JSON.stringify(m)}`);return apply(s,m)};
assert.equal(legalMoves(initial()).length,30);assert(validState(initial()));
let s=initial();s=move(s,{from:56,to:47});assert.equal(s.turn,'w');assert.equal(s.board[47],'P');assert.equal(s.board[56],null);
s=fixture({4:'k',76:'K',27:'P'});assert(has(s,{from:27,to:18,promote:true}));assert(has(s,{from:27,to:18}));s=fixture({4:'k',76:'K',9:'P'});assert.deepEqual(legalMoves(s).filter(m=>m.from===9),[{from:9,to:0,promote:true}]);
s=fixture({4:'k',76:'K',18:'N'});assert(legalMoves(s).filter(m=>m.from===18).every(m=>m.promote));
s=fixture({4:'k',76:'K',40:'R',31:'+p'});s=move(s,{from:40,to:31});assert.equal(s.hands.b.P,1);assert.equal(s.board[31],'R');
s=fixture({4:'k',76:'K',54:'P'},{b:{P:1,N:1,L:1},w:{}});assert(!has(s,{drop:'P',to:36}));assert(!has(s,{drop:'P',to:1}));assert(!has(s,{drop:'L',to:1}));assert(!has(s,{drop:'N',to:10}));assert(has(s,{drop:'P',to:37}));s.board[54]='+P';assert(has(s,{drop:'P',to:36}));
s=fixture({0:'k',4:'r',76:'K',67:'G'});assert(!has(s,{from:67,to:66}));assert(has(s,{from:67,to:58}));
s=fixture({0:'k',4:'r',76:'K'},{b:{G:1},w:{}});assert(inCheck(s));assert(has(s,{drop:'G',to:40}));assert.equal(result([s]),null,'drop can save check; not checkmate');
s=fixture({4:'k',3:'l',5:'l',12:'p',14:'p',22:'G',76:'K'},{b:{P:1},w:{}});assert(!has(s,{drop:'P',to:13}),'pawn drop mate forbidden');s.board[22]=null;assert(has(s,{drop:'P',to:13}),'nonmating pawn check allowed');
s=fixture({4:'k',3:'l',5:'l',12:'p',14:'p',22:'G',13:'R',76:'K'},{b:{},w:{}},'w');assert.deepEqual(result([s]),{winner:'b',reason:'詰み'});
s=fixture({4:'k',13:'R',80:'K'});assert(!has(s,{from:13,to:4}),'king capture forbidden');
let h=[fixture({4:'k',76:'K'})];for(let n=0;n<3;n++)for(const m of [{from:76,to:75},{from:4,to:3},{from:75,to:76},{from:3,to:4}])h.push(move(h.at(-1),m));assert.deepEqual(result(h),{winner:null,reason:'千日手（同一局面4回）'});
h=[fixture({4:'k',13:'R',80:'K'},{b:{},w:{}},'w')];for(let n=0;n<3;n++)for(const m of [{from:4,to:3},{from:13,to:12},{from:3,to:4},{from:12,to:13}])h.push(move(h.at(-1),m));assert.deepEqual(result(h),{winner:'w',reason:'連続王手の千日手'});
const replay=[{from:56,to:47},{from:24,to:33}];assert.equal(restore(JSON.stringify({version:1,moves:replay})).history.length,3);assert.throws(()=>restore('{'));assert.throws(()=>restore(JSON.stringify({version:1,moves:[{from:56,to:0}]})));
// Random reachable play preserves material, king safety and immutable input.
s=initial();for(let n=0;n<120;n++){const moves=legalMoves(s);if(!moves.length)break;const before=key(s),m=moves[(n*73+19)%moves.length],next=apply(s,m);assert.equal(key(s),before);assert(!inCheck(next,s.turn));assert(validState(next));s=next;}
console.log('PASS: shogi engine fixtures, 120-ply legal-play invariants, restore validation.');
if(process.argv.includes('--ui')){
 const {chromium}=await import('@playwright/test');const {createServer}=await import('node:http');const {readFile,mkdir}=await import('node:fs/promises');
 const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;const file=await readFile(new URL('../public'+path,import.meta.url));res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':'text/html');res.end(file)}catch{res.writeHead(404);res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.BASE_URL?`${process.env.BASE_URL.replace(/\/$/,'')}/games/shogi.html`:`http://127.0.0.1:${server.address().port}/games/shogi.html`;let browser;
 try{browser=await chromium.launch({channel:'chrome',headless:true});const errors=[];await mkdir('artifacts',{recursive:true});
 for(const width of [320,390,1280]){const ctx=await browser.newContext({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500});const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForSelector('.square');assert.equal(await page.locator('.square').count(),81);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const square=i=>page.locator(`[data-square="${i}"]`);await square(56).click();assert(await square(47).evaluate(e=>e.classList.contains('legal')));await square(47).click();assert.match(await page.locator('#status').textContent(),/後手/);await square(24).click();await square(33).click();await square(64).click();await square(16).click();await page.getByRole('button',{name:'成る',exact:true}).click();assert.equal(await square(16).innerText(),'馬');await square(10).click();await square(16).click();await page.locator('#bottom-hand [data-drop="B"]').click();await square(40).click();assert.equal(await square(40).innerText(),'角');
 await page.reload();assert.equal(await square(40).innerText(),'角');await page.locator('#undo').click();assert.equal(await square(40).innerText(),'');assert.equal(await page.locator('#bottom-hand [data-drop="B"]').count(),1);await page.locator('#rotate').click();assert.equal(await page.locator('.square').first().getAttribute('data-square'),'80');
 await page.locator('#resign').click();await page.locator('#modal').getByRole('button',{name:'続ける'}).click();assert.match(await page.locator('#status').textContent(),/先手/);await page.locator('#restart').click();await page.locator('#modal').getByRole('button',{name:'新しい対局'}).click();assert.match(await page.locator('#step').innerText(),/第 1 手/);await page.screenshot({path:`artifacts/shogi-${width}.png`,fullPage:true});await ctx.close();}
 // Malformed saves must be backed up byte-for-byte before any replacement.
 for(const malformed of ['{broken save',JSON.stringify({version:1,moves:[{from:56,to:47},{from:24,to:99}],matchId:'recover-original'})]){
  const ctx=await browser.newContext();const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
  await page.evaluate(raw=>localStorage.setItem('night-arcade-shogi-v1',raw),malformed);
  await page.addInitScript(()=>{window.blockRecovery=true;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.blockRecovery&&k==='night-arcade-shogi-v1-recovery')throw Error('recovery unavailable');return original.call(this,k,v);};});
  await page.reload();assert.equal(await page.locator('.square').count(),81);
  await page.locator('#rotate').click();assert.equal(await page.evaluate(()=>localStorage.getItem('night-arcade-shogi-v1')),malformed);assert.match(await page.locator('#save-note').textContent(),/元の保存データを保護/);
  await page.locator('[data-square="56"]').click();await page.locator('[data-square="47"]').click();assert.match(await page.locator('#status').textContent(),/後手/);assert.equal(await page.evaluate(()=>localStorage.getItem('night-arcade-shogi-v1')),malformed);
  await page.locator('#restart').click();await page.locator('#modal').getByRole('button',{name:'戻る'}).click();assert.equal(await page.evaluate(()=>localStorage.getItem('night-arcade-shogi-v1')),malformed);
  await page.reload();assert.equal(await page.evaluate(()=>localStorage.getItem('night-arcade-shogi-v1')),malformed);
  await page.evaluate(()=>{window.blockRecovery=false;});await page.locator('#rotate').click();assert.equal(await page.evaluate(()=>localStorage.getItem('night-arcade-shogi-v1-recovery')),malformed);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('night-arcade-shogi-v1')).moves.length),0);
  await page.locator('[data-square="56"]').click();await page.locator('[data-square="47"]').click();await page.reload();assert.equal(await page.locator('[data-square="47"]').innerText(),'歩');assert.equal(await page.evaluate(()=>localStorage.getItem('night-arcade-shogi-v1-recovery')),malformed);await ctx.close();
 }
 console.log('PASS: corrupt shogi saves preserved before replacement; failed recovery backup keeps raw data and permits session play, then retries safely.');
 // A legacy completed save has no reward identity: persist its migration before awarding.
 const legacy=await browser.newContext();const page=await legacy.newPage();await page.goto(base);
 await page.evaluate(()=>{const cycle=[{from:76,to:67},{from:4,to:13},{from:67,to:76},{from:13,to:4}];localStorage.setItem('night-arcade-shogi-v1',JSON.stringify({version:1,moves:[...cycle,...cycle,...cycle],rotated:true,ended:null}));});
 await page.reload();assert.equal(await page.evaluate(()=>NightPet.snapshot().coins),30);const migrated=await page.evaluate(()=>JSON.parse(localStorage.getItem('night-arcade-shogi-v1')));assert.equal(migrated.moves.length,12);assert.equal(migrated.rotated,true);assert.equal(typeof migrated.matchId,'string');assert(migrated.matchId.length>=4);
 await page.reload();assert.equal(await page.evaluate(()=>NightPet.snapshot().coins),30);assert.equal(await page.evaluate(()=>NightPet.snapshot().xp),20);assert.equal(await page.evaluate(()=>NightPet.snapshot().gamesPlayed),1);
 await page.locator('#undo').click();await page.locator('[data-square="13"]').click();await page.locator('[data-square="4"]').click();await page.reload();assert.equal(await page.evaluate(()=>NightPet.snapshot().coins),30);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('night-arcade-shogi-v1')).matchId),migrated.matchId);await legacy.close();
 const blocked=await browser.newContext();const blockedPage=await blocked.newPage();await blockedPage.goto(base);await blockedPage.evaluate(()=>{const cycle=[{from:76,to:67},{from:4,to:13},{from:67,to:76},{from:13,to:4}];localStorage.setItem('night-arcade-shogi-v1',JSON.stringify({version:1,moves:[...cycle,...cycle,...cycle],rotated:false,ended:null}));});
 await blockedPage.addInitScript(()=>{window.blockShogiSave=true;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.blockShogiSave&&k==='night-arcade-shogi-v1')throw Error('shogi save unavailable');return original.call(this,k,v);};});
 for(let i=0;i<2;i++){await blockedPage.reload();assert.equal(await blockedPage.evaluate(()=>NightPet.snapshot().coins),0);assert.equal(await blockedPage.evaluate(()=>JSON.parse(localStorage.getItem('night-arcade-shogi-v1')).moves.length),12);assert.equal(await blockedPage.evaluate(()=>JSON.parse(localStorage.getItem('night-arcade-shogi-v1')).matchId),undefined);assert.match(await blockedPage.locator('#status').textContent(),/引き分け/);}
 // Recover in the same tab: the first successful migration must settle the terminal reward.
 await blockedPage.evaluate(()=>{window.blockShogiSave=false;});await blockedPage.locator('#rotate').click();
 const recovered=await blockedPage.evaluate(()=>({pet:NightPet.snapshot(),game:JSON.parse(localStorage.getItem('night-arcade-shogi-v1'))}));
 assert.equal(recovered.pet.coins,30);assert.equal(recovered.pet.xp,20);assert.equal(recovered.pet.gamesPlayed,1);assert.equal(recovered.game.moves.length,12);assert.equal(recovered.game.rotated,true);assert.equal(typeof recovered.game.matchId,'string');assert(recovered.game.matchId.length>=4);assert.match(await blockedPage.locator('#save-note').textContent(),/自動保存/);
 // Starting a fresh match immediately after recovery must neither lose nor repeat that payout.
 await blockedPage.locator('#restart').click();await blockedPage.locator('#modal').getByRole('button',{name:'新しい対局'}).click();await blockedPage.reload();
 assert.equal(await blockedPage.evaluate(()=>NightPet.snapshot().coins),30);assert.equal(await blockedPage.evaluate(()=>NightPet.snapshot().xp),20);assert.equal(await blockedPage.evaluate(()=>NightPet.snapshot().gamesPlayed),1);assert.equal(await blockedPage.evaluate(()=>JSON.parse(localStorage.getItem('night-arcade-shogi-v1')).moves.length),0);
 await blocked.close();
 // Direct restart must settle the blocked legacy reward before replacing the old match.
 const direct=await browser.newContext();const directPage=await direct.newPage();await directPage.goto(base);
 await directPage.evaluate(()=>{const cycle=[{from:76,to:67},{from:4,to:13},{from:67,to:76},{from:13,to:4}];localStorage.setItem('night-arcade-shogi-v1',JSON.stringify({version:1,moves:[...cycle,...cycle,...cycle],rotated:false,ended:null}));});
 await directPage.addInitScript(()=>{window.blockShogiSave=true;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.blockShogiSave&&k==='night-arcade-shogi-v1')throw Error('shogi save unavailable');return original.call(this,k,v);};});await directPage.reload();
 const originalLegacy=await directPage.evaluate(()=>localStorage.getItem('night-arcade-shogi-v1'));
 await directPage.locator('#restart').click();await directPage.locator('#modal').getByRole('button',{name:'新しい対局'}).click();
 assert.equal(await directPage.evaluate(()=>localStorage.getItem('night-arcade-shogi-v1')),originalLegacy);assert.match(await directPage.locator('#status').textContent(),/引き分け/);assert.match(await directPage.locator('#save-note').textContent(),/新しい対局はまだ始めていません/);assert.equal(await directPage.evaluate(()=>NightPet.snapshot().coins),0);
 await directPage.evaluate(()=>{window.blockShogiSave=false;});
 // Cancelling even after recovery must not migrate or reset anything.
 await directPage.locator('#restart').click();await directPage.locator('#modal').getByRole('button',{name:'戻る'}).click();assert.equal(await directPage.evaluate(()=>localStorage.getItem('night-arcade-shogi-v1')),originalLegacy);assert.equal(await directPage.evaluate(()=>NightPet.snapshot().coins),0);
 await directPage.locator('#restart').click();await directPage.locator('#modal').getByRole('button',{name:'新しい対局'}).click();
 for(let i=0;i<2;i++){const state=await directPage.evaluate(()=>({pet:NightPet.snapshot(),game:JSON.parse(localStorage.getItem('night-arcade-shogi-v1'))}));assert.equal(state.pet.coins,30);assert.equal(state.pet.xp,20);assert.equal(state.pet.gamesPlayed,1);assert.equal(state.game.moves.length,0);assert.equal(state.game.ended,null);if(i===0)await directPage.reload();}
 await direct.close();console.log('PASS: direct restart preserves blocked legacy match, cancel is inert, and recovery pays once before replacement/reload.');
 // Undo must settle a blocked terminal migration before discarding its final move.
 const undoLegacy=await browser.newContext();const undoPage=await undoLegacy.newPage();await undoPage.goto(base);
 await undoPage.evaluate(()=>{const cycle=[{from:76,to:67},{from:4,to:13},{from:67,to:76},{from:13,to:4}];localStorage.setItem('night-arcade-shogi-v1',JSON.stringify({version:1,moves:[...cycle,...cycle,...cycle],rotated:false,ended:null}));});
 await undoPage.addInitScript(()=>{window.blockShogiSave=true;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.blockShogiSave&&k==='night-arcade-shogi-v1')throw Error('shogi save unavailable');return original.call(this,k,v);};});await undoPage.reload();
 const undoOriginal=await undoPage.evaluate(()=>localStorage.getItem('night-arcade-shogi-v1'));
 await undoPage.locator('#undo').click();
 assert.equal(await undoPage.evaluate(()=>localStorage.getItem('night-arcade-shogi-v1')),undoOriginal);assert.match(await undoPage.locator('#status').textContent(),/引き分け/);assert.match(await undoPage.locator('#save-note').textContent(),/一手戻す操作はまだ行っていません/);assert.equal(await undoPage.evaluate(()=>NightPet.snapshot().coins),0);
 await undoPage.evaluate(()=>{window.blockShogiSave=false;});await undoPage.locator('#undo').click();
 const undoRecovered=await undoPage.evaluate(()=>({pet:NightPet.snapshot(),game:JSON.parse(localStorage.getItem('night-arcade-shogi-v1'))}));
 assert.equal(undoRecovered.pet.coins,30);assert.equal(undoRecovered.pet.xp,20);assert.equal(undoRecovered.pet.gamesPlayed,1);assert.equal(undoRecovered.game.moves.length,11);assert.equal(undoRecovered.game.ended,null);assert.equal(typeof undoRecovered.game.matchId,'string');assert.match(await undoPage.locator('#status').textContent(),/後手の番/);
 await undoPage.reload();assert.equal(await undoPage.evaluate(()=>NightPet.snapshot().coins),30);await undoPage.evaluate(()=>{window.blockShogiSave=false;});
 await undoPage.locator('[data-square="13"]').click();await undoPage.locator('[data-square="4"]').click();await undoPage.reload();
 const undoReplay=await undoPage.evaluate(()=>({pet:NightPet.snapshot(),game:JSON.parse(localStorage.getItem('night-arcade-shogi-v1'))}));assert.equal(undoReplay.pet.coins,30);assert.equal(undoReplay.pet.xp,20);assert.equal(undoReplay.pet.gamesPlayed,1);assert.equal(undoReplay.game.matchId,undoRecovered.game.matchId);assert.equal(undoReplay.game.moves.length,12);
 await undoLegacy.close();console.log('PASS: blocked legacy undo preserves the terminal match, then recovery settles once before undo/reload/replay.');
 console.log('PASS: blocked legacy terminal save recovers its reward once before restart/reload and clears the stale storage notice.');
 console.log('PASS: legacy completed shogi migration preserves moves/rotation, rewards once across reload and undo/replay.');
 // Selective pet-write failures must be visible even when the match itself saves.
 for(const blockGame of [false,true]){
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
  await page.evaluate(()=>{const cycle=[{from:76,to:67},{from:4,to:13},{from:67,to:76},{from:13,to:4}];localStorage.setItem('night-arcade-shogi-v1',JSON.stringify({version:1,moves:[...cycle,...cycle,...cycle].slice(0,11),rotated:false,ended:null,matchId:'pet-save-interrupted'}));});await page.reload();
  const original=await page.evaluate(()=>localStorage.getItem('night-arcade-shogi-v1'));
  await page.evaluate(blockGame=>{window.blockWrites=true;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.blockWrites&&(k==='night-pet-v1'||blockGame&&k==='night-arcade-shogi-v1'))throw Error('save interrupted');return original.call(this,k,v)};},blockGame);
  await page.locator('[data-square="13"]').click();await page.locator('[data-square="4"]').click();
  assert.match(await page.locator('#status').innerText(),/引き分け/);assert.match(await page.locator('#reward-note').innerText(),/報酬を保存できませんでした。この画面の間だけ保持/);
  const pet=await page.evaluate(()=>NightPet.snapshot());assert.equal(pet.coins,30);assert.equal(pet.xp,20);assert.equal(pet.gamesPlayed,1);assert.equal(await page.evaluate(()=>localStorage.getItem('night-pet-v1')),null);
  if(blockGame){assert.equal(await page.evaluate(()=>localStorage.getItem('night-arcade-shogi-v1')),original);assert.match(await page.locator('#save-note').innerText(),/保存は利用できません/);}
  else assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('night-arcade-shogi-v1')).moves.length),12);
  await page.locator('#rotate').click();assert.match(await page.locator('#reward-note').innerText(),/この画面の間だけ保持/);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(!blockGame){const saved=await page.evaluate(()=>localStorage.getItem('night-arcade-shogi-v1'));for(let attempt=0;attempt<2;attempt++){await page.reload();assert.doesNotMatch(await page.locator('#reward-note').innerText(),/報酬を保存できませんでした/);const recovered=await page.evaluate(()=>NightPet.snapshot());assert.equal(recovered.coins,30);assert.equal(recovered.xp,20);assert.equal(recovered.gamesPlayed,1);assert.equal(recovered.rewards['shogi:pet-save-interrupted'],true);assert.equal(await page.evaluate(()=>localStorage.getItem('night-arcade-shogi-v1')),saved);}}
  await page.locator('#undo').click();
  if(blockGame){assert.match(await page.locator('#reward-note').innerText(),/この画面の間だけ保持/);await page.locator('#restart').click();await page.locator('#modal').getByRole('button',{name:'新しい対局'}).click();assert.match(await page.locator('#reward-note').innerText(),/この画面の間だけ保持/);assert.equal(await page.evaluate(()=>NightPet.snapshot().gamesPlayed),1);await page.evaluate(()=>{window.blockWrites=false;NightPet.care('play');});assert.equal(await page.locator('#reward-note').isVisible(),false);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('night-pet-v1')).coins),30);}
  await ctx.close();
 }
 console.log('PASS: selective pet-save and dual-save failures show a persistent session-only reward warning; saved terminal reload recovers exactly once.');
 assert.deepEqual(errors,[]);console.log('PASS: Chrome 320/390/1280 UI, real moves, capture, optional promotion, drop, reload, undo, rotation, dialogs; no JS errors.');
 }finally{await browser?.close();await new Promise(r=>server.close(r))}
}
