import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
const external=process.env.BASE_URL;
const server=external?null:spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4186'},stdio:'pipe'});
const base=external||'http://127.0.0.1:4186/night-arcade/';let browser;
try{
 if(server)await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Server exited '+code)))});
 browser=await chromium.launch({channel:'chrome',headless:true});const errors=[];await mkdir('artifacts',{recursive:true});
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:844},hasTouch:width<500,isMobile:width<500});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?mode=arcade');await page.waitForLoadState('networkidle');assert.equal(await page.locator('.card').count(),5);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'home fits '+width);
  await page.evaluate(()=>NightPet.reward({game:'quiz',id:'care-funds',coins:3,xp:0}));const box=await page.locator('[data-care="feed"]').boundingBox();assert(box.y+box.height<=844,'care above fold');
  await page.locator('[data-care="feed"]').click();assert.match(await page.locator('#notice').textContent(),/もぐもぐ/);await page.locator('[data-care="feed"]').click();assert.match(await page.locator('#notice').textContent(),/あと/);
  await page.locator('#characters-open').click();await page.locator('[data-item="kitsune"]').click();assert.match(await page.locator('#notice').textContent(),/あと120/);
  await page.evaluate(()=>NightPet.reward({game:'quiz',id:'ui-test-'+innerWidth,coins:60,xp:60}));await page.locator('#shop-close').click();await page.locator('#evolve').click();assert.equal(await page.locator('#stage').textContent(),'こども');assert.equal(await page.locator('#coins').textContent(),'10');
  await page.reload();assert.equal(await page.locator('#stage').textContent(),'こども');assert.equal(await page.locator('#coins').textContent(),'10');
  await page.evaluate(()=>NightPet.reward({game:'quiz',id:'ui-outfit-'+innerWidth,coins:60,xp:60}));await page.locator('#outfits-open').click();await page.locator('[data-item="bow"]').click();assert.equal(await page.locator('#coins').textContent(),'35');assert.match(await page.locator('#pet-art').getAttribute('aria-label'),/赤いリボン/);await page.reload();assert.match(await page.locator('#pet-art').getAttribute('aria-label'),/赤いリボン/);
  if(width===390||width===1280)await page.screenshot({path:`artifacts/pet-home-${width}.png`,fullPage:true});
  for(const game of ['shogi','reversi','stack','recall','quiz']){
   await page.goto(new URL('games/'+game+'.html',base).href);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),game+' fits '+width);assert.equal(await page.locator('h1').count(),1);
   if(width===390)await page.screenshot({path:`artifacts/new-${game}.png`,fullPage:true});const home=page.locator('a[href="../index.html"]');assert.equal(await home.count(),1);await home.click();assert.equal(await page.locator('.card').count(),5);assert.equal(await page.locator('#coins').textContent(),'35');
  }await context.close();
 }
 const blocked=await browser.newContext({viewport:{width:320,height:844}});await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('blocked')}})});const p=await blocked.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'?mode=arcade');assert(await p.locator('#storage').isVisible());await p.locator('[data-care="play"]').click();assert.match(await p.locator('#notice').textContent(),/なでなで/);await blocked.close();
 assert.deepEqual(errors,[]);console.log('PASS: pet care/cooldown/coins/evolution/outfit/save/storage-denied + all five games/home links at 320/390/1280; no JS errors');
}finally{await browser?.close();server?.kill()}
