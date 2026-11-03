import {startFreshSolo} from './estate-test-solo.mjs';
import {acknowledgeReceipts} from './estate-test-confirmations.mjs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
const base=process.env.BASE_URL||'http://127.0.0.1:4194/night-arcade/';const server=process.env.BASE_URL?null:spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4194'},stdio:'pipe'});let browser;
try{
 if(server)await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no)});
 browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await acknowledgeReceipts(page);await page.goto(new URL('estates/',base).href);await page.locator('#cpu-count').selectOption('3');await startFreshSolo(page);assert.equal(await page.locator('.player').count(),4);
 for(const width of [320,390,768]){
 await page.setViewportSize({width,height:844});
 const g=await page.evaluate(()=>{const viewport=document.querySelector('#board-viewport'),v=viewport.getBoundingClientRect(),b=document.querySelector('.board-wrap').getBoundingClientRect(),board=document.querySelector('#board').getBoundingClientRect(),t=document.querySelector('[data-tile-id="1"]').getBoundingClientRect();return{ratio:b.width/v.width,square:Math.abs(b.width-b.height),depth:t.height/((board.width-4)/11),scroll:viewport.scrollWidth>viewport.clientWidth||viewport.scrollHeight>viewport.clientHeight,overflow:document.documentElement.scrollWidth>innerWidth,allVisible:[...document.querySelectorAll('[data-tile-id]')].every(el=>{const r=el.getBoundingClientRect();return r.left>=v.left&&r.right<=v.right&&r.top>=v.top&&r.bottom<=v.bottom})}});
 assert(Math.abs(g.ratio-1)<.01);assert(g.square<1);assert(Math.abs(g.depth-1.5)<.02);assert(!g.scroll);assert(!g.overflow);assert(g.allVisible);assert.equal(await page.locator('#board-view').count(),0);
 await page.locator('.board-wrap').screenshot({path:`artifacts/estates-fit-board-${width}.png`});
 }
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{let i=0;Math.random=()=>++i%2?0.01:0.2});await page.getByRole('button',{name:'サイコロを振る',exact:true}).click();await page.getByRole('button',{name:/^購入 /}).click();await page.getByRole('button',{name:'ターンを終了',exact:true}).click();await page.waitForFunction(()=>estateNetwork.state.turn===0&&estateNetwork.state.players.slice(1).every(p=>p.position===3),{},{timeout:30000});
 await page.getByRole('button',{name:'サイコロを振る',exact:true}).click();await page.getByRole('button',{name:'見送る → 競売',exact:true}).click();await page.waitForFunction(()=>{const a=estateNetwork.state.auction;return a&&a.highestBidder&&a.active.filter(id=>id!=='human').length===1},{},{timeout:40000});await page.getByRole('button',{name:'入札をやめる',exact:true}).click();assert.equal(await page.evaluate(()=>estateNetwork.state.phase),'end');assert.match(await page.evaluate(()=>estateNetwork.state.properties[6].owner),/^cpu/);
 await page.locator('#tile-select').selectOption('37');assert((await page.locator('.heritage-description').textContent()).length>35);await page.screenshot({path:'artifacts/estates-four-player.png',fullPage:true});assert.deepEqual(errors,[]);
 await acknowledgeReceipts(page);await page.goto(new URL('estates/',base).href);await page.locator('#cpu-count').selectOption('2');await startFreshSolo(page);assert.equal(await page.locator('.player').count(),3);console.log('PASS CPU2/3 selection, full 4-player turn cycle and 4-player auction,screen-fit square board, 1.5× inward depth at320/390/768px, description,390px no page overflow.');
}finally{await browser?.close();server?.kill()}
