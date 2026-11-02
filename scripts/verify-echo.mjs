import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('@playwright/test');
const html=await readFile(new URL('../public/games/echo.html',import.meta.url),'utf8');
const levels=vm.runInNewContext(html.match(/const LEVELS = (\[[\s\S]*?\n\]);/)[1]);
const ds=[[0,-1],[1,0],[0,1],[-1,0],[0,0]];
function step(p,a,m){let x=p%4+ds[a][0],y=Math.floor(p/4)+ds[a][1];return x<0||x>3||y<0||y>3||m[y][x]==='#'?p:y*4+x}
const solutions=levels.map(l=>{const s=[...l.start,4],q=[[s,[]]],seen=new Set([s.join()]);for(let i=0;i<q.length;i++){const [s,p]=q[i];if(s[0]===l.goal[0]&&s[1]===l.goal[1]){assert.equal(p.length,l.par);return p;}for(let a=0;a<5;a++){const t=[step(s[0],a,l.p),step(s[1],s[2],l.e),a];if(!seen.has(t.join())){seen.add(t.join());q.push([t,[...p,a]])}}}throw Error('Unsolvable level')});
console.log('BFS: all 6 levels solvable, shortest paths:',solutions.map(p=>p.length).join(', '));
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{browser=await chromium.launch({headless:true,channel:process.env.ECHO_BROWSER_CHANNEL || 'chrome'});const page=await browser.newPage({viewport:{width:320,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/games/echo.html`);
assert.equal(await page.locator('#level option:disabled').count(),5);
await page.locator('[data-action="1"]').click();await page.locator('#undo').click();assert.match(await page.locator('#moves').innerText(),/^0 手/);assert.equal(await page.locator('#queue').innerText(),'・ 待つ');
await page.locator('#hint').click();assert.match(await page.locator('#status').innerText(),/あと4手/);
for(let i=0;i<6;i++){for(const a of solutions[i])await page.locator(`[data-action="${a}"]`).click();assert.equal(await page.locator('#win').isVisible(),true);assert.equal(await page.locator('#moves').innerText(),`${solutions[i].length} 手 / 最短 ${levels[i].par} 手`);if(i<5)await page.locator('#next').click()}
await page.reload();assert.equal(await page.locator('#level option:disabled').count(),0);
await page.locator('#level').selectOption('2');await page.keyboard.press('ArrowRight');assert.match(await page.locator('#moves').innerText(),/^1 手/);await page.keyboard.press('z');assert.match(await page.locator('#moves').innerText(),/^0 手/);
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
// Forced colors removes the background differences that normally define the grid.
// Keep all 16 path cells visible while preserving the dashed mailbox marker.
await page.emulateMedia({forcedColors:'active'});
assert.equal(await page.evaluate(()=>matchMedia('(forced-colors: active)').matches),true);
for(const board of ['#playerBoard','#echoBoard']){
  const cells=await page.locator(`${board} .cell`).evaluateAll(els=>els.map(el=>{
    const s=getComputedStyle(el);return {border:s.borderTopStyle,width:parseFloat(s.borderTopWidth),color:s.borderTopColor,background:s.backgroundColor};
  }));
  assert.equal(cells.length,16);
  for(const cell of cells){assert.equal(cell.border,'solid');assert.ok(cell.width>=1);assert.notEqual(cell.color,cell.background);}
  const goal=await page.locator(`${board} .goal`).evaluate(el=>({outline:getComputedStyle(el).outlineStyle,marker:getComputedStyle(el,'::before').content}));
  assert.equal(goal.outline,'dashed');assert.ok(goal.marker.includes('✉'));
  assert.equal(await page.locator(`${board} .pawn`).innerText(),board==='#playerBoard'?'●':'◆');
  for(const wall of await page.locator(`${board} .wall`).allTextContents())assert.equal(wall,'▧');
}
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
await page.emulateMedia({forcedColors:'none'});
assert.deepEqual(errors,[]);
const blocked=await browser.newContext();await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('Storage blocked')}})});const p2=await blocked.newPage();await p2.goto(`http://127.0.0.1:${server.address().port}`);await p2.locator('[data-action="1"]').click();assert.match(await p2.locator('#moves').innerText(),/^1 手/);
console.log('Browser: 6 wins, unlock persistence, undo, hint, keyboard, 320px layout, forced-colors grid/mailboxes and blocked localStorage passed.');
}finally{await browser?.close();await new Promise(r=>server.close(r))}
