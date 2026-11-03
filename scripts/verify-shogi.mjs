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
 const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;const file=await readFile(new URL('../public'+path,import.meta.url));res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':'text/html');res.end(file)}catch{res.writeHead(404);res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/games/shogi.html`;let browser;
 try{browser=await chromium.launch({channel:'chrome',headless:true});const errors=[];await mkdir('artifacts',{recursive:true});
 for(const width of [320,390,1280]){const ctx=await browser.newContext({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500});const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForSelector('.square');assert.equal(await page.locator('.square').count(),81);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const square=i=>page.locator(`[data-square="${i}"]`);await square(56).click();assert(await square(47).evaluate(e=>e.classList.contains('legal')));await square(47).click();assert.match(await page.locator('#status').textContent(),/後手/);await square(24).click();await square(33).click();await square(64).click();await square(16).click();await page.getByRole('button',{name:'成る',exact:true}).click();assert.equal(await square(16).innerText(),'馬');await square(10).click();await square(16).click();await page.locator('#bottom-hand [data-drop="B"]').click();await square(40).click();assert.equal(await square(40).innerText(),'角');
 await page.reload();assert.equal(await square(40).innerText(),'角');await page.locator('#undo').click();assert.equal(await square(40).innerText(),'');assert.equal(await page.locator('#bottom-hand [data-drop="B"]').count(),1);await page.locator('#rotate').click();assert.equal(await page.locator('.square').first().getAttribute('data-square'),'80');
 await page.locator('#resign').click();await page.locator('#modal').getByRole('button',{name:'続ける'}).click();assert.match(await page.locator('#status').textContent(),/先手/);await page.locator('#restart').click();await page.locator('#modal').getByRole('button',{name:'新しい対局'}).click();assert.match(await page.locator('#step').innerText(),/第 1 手/);await page.screenshot({path:`artifacts/shogi-${width}.png`,fullPage:true});await ctx.close();}
 assert.deepEqual(errors,[]);console.log('PASS: Chrome 320/390/1280 UI, real moves, capture, optional promotion, drop, reload, undo, rotation, dialogs; no JS errors.');
 }finally{await browser?.close();await new Promise(r=>server.close(r))}
}
