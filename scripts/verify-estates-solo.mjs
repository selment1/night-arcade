import assert from 'node:assert/strict';
import {createGame,act} from '../public/estates/engine.js';
import {cpuAction} from '../public/estates/solo.js';
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
for(let seed=1;seed<=15;seed++){
 let n=seed,rng=()=>((n=(n*1664525+1013904223)>>>0)/4294967296),s=createGame([{id:'a',name:'A'},{id:'b',name:'B'}]);
 for(let i=0;i<2000&&s.phase!=='over';i++){
  const id=s.phase==='auction'?s.auction.active.find(id=>id!==s.auction.highestBidder):s.players[s.turn].id;
  const a=cpuAction(s,id);assert(a,'CPU must progress '+s.phase);const r=act(s,id,a,rng);assert(r.ok,JSON.stringify(a)+': '+r.error);s=r.state;
 }
}
const base=process.env.BASE_URL||'http://127.0.0.1:4197/night-arcade/';let browser;const server=process.env.BASE_URL?null:spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4197'},stdio:'pipe'});
try{
 if(server)await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no)});
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:844}}),errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(base))external.push(r.url())});
  await page.goto(new URL('estates/',base).href);assert.equal(await page.locator('#solo').textContent(),'CPUと遊ぶ（1人プレイ）');const buttonBox=await page.locator('#solo').boundingBox();assert(buttonBox.y+buttonBox.height<=844,'CPU button above fold');await page.screenshot({path:`artifacts/estates-entry-${width}.png`,fullPage:true});await page.locator('#solo').click();assert.equal(await page.locator('.player').count(),2);assert.equal(await page.evaluate(()=>estateNetwork.solo),true);
  await page.evaluate(()=>{let i=0;Math.random=()=>++i%2?0.01:0.2});await page.getByRole('button',{name:'サイコロを振る',exact:true}).click();await page.getByRole('button',{name:/^購入 /}).click();await page.getByRole('button',{name:'ターンを終了',exact:true}).click();
  await page.waitForFunction(()=>estateNetwork.state.turn===0&&estateNetwork.state.revision>=5);assert(await page.evaluate(()=>estateNetwork.state.players[1].position>0));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  // Human declines: CPU bids, waits for human, then settles after pass.
  await page.getByRole('button',{name:'サイコロを振る',exact:true}).click();await page.getByRole('button',{name:'見送る → 競売',exact:true}).click();await page.waitForFunction(()=>estateNetwork.state.auction?.highestBidder==='cpu');await page.getByRole('button',{name:'入札をやめる',exact:true}).click();assert.equal(await page.evaluate(()=>estateNetwork.state.phase),'end');
  assert.deepEqual(external,[],'solo makes no external signaling requests');assert.deepEqual(errors,[]);await page.screenshot({path:`artifacts/estates-solo-${width}.png`,fullPage:true});await page.close();
 }
 console.log('PASS CPU: 15 seeded simulations, legal debt/liquidation/build/auction decisions; real UI human→CPU→human, auction/pass, no signaling,320/390px.');
}finally{await browser?.close();server?.kill()}
