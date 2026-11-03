import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const port='4198',base=process.env.BASE_URL||`http://127.0.0.1:${port}`;
const server=process.env.BASE_URL?null:spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:port},stdio:'pipe'});let browser;
try{
 if(server)await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Server exited '+code)))});
 browser=await chromium.launch({channel:'chrome',headless:true});
 mkdirSync('artifacts',{recursive:true});
 for(const width of [320,390]){
 const page=await browser.newPage({viewport:{width,height:844},timezoneId:'Asia/Tokyo',reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-11-03T08:00:00+09:00')});await page.goto(base);await page.evaluate(()=>NightPet.reward({game:'quiz',id:'care-ui-funds',coins:60,xp:0}));
 assert.equal(await page.locator('#care-id').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('#stage').textContent(),'たまご');
 await page.clock.fastForward(60000);assert.equal(await page.locator('#stage').textContent(),'ベビー期');
 await page.clock.fastForward(15*60000);await page.locator('[data-care=feed]').click();assert.match(await page.locator('#notice').textContent(),/ごちそう/);assert.equal(await page.locator('#coins').textContent(),'57');
 await page.locator('[data-id-action=snack]').click();assert.match(await page.locator('#notice').textContent(),/おやつ/);assert.equal(await page.locator('#coins').textContent(),'55');
 await page.locator('#id-panel summary').click();await page.locator('[data-value=cloud]').click();assert.equal(await page.locator('.pet-room').getAttribute('data-room'),'cloud');
 await page.locator('[data-care=rest]').click();assert.ok(await page.locator('.pet-room').evaluate(e=>e.classList.contains('lights-out')));
 assert.equal(await page.locator('#coins').textContent(),'53');await page.clock.fastForward(2*60*60000);assert.ok(!(await page.locator('#life-waste').isHidden()));
 await page.locator('[data-id-action=toilet]').click();assert.ok(await page.locator('#life-waste').isHidden());
 await page.locator('#care-arcade').click();assert.ok(await page.locator('#id-panel').isHidden());assert.ok(await page.locator('#life-waste').isHidden());assert.ok(!(await page.locator('.pet-room').evaluate(e=>e.classList.contains('lights-out'))));assert.ok(!(await page.locator('#pet-art').evaluate(e=>e.classList.contains('sleeping'))));
 await page.locator('#care-id').click();assert.ok(!(await page.locator('#id-panel').isHidden()));assert.ok(await page.locator('.pet-room').evaluate(e=>e.classList.contains('lights-out')));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`no horizontal overflow at ${width}`);
 await page.locator('[data-care=rest]').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`artifacts/id-care-${width}.png`,fullPage:true});
 await page.clock.fastForward(10*60*60000);assert.ok(await page.locator('#pet-art').evaluate(e=>e.classList.contains('sleeping')));await page.locator('#care-arcade').click();assert.ok(!(await page.locator('#pet-art').evaluate(e=>e.classList.contains('sleeping'))));
 await page.locator('[data-care=rest]').click();await page.locator('#care-id').click();assert.ok(await page.locator('#pet-art').evaluate(e=>e.classList.contains('sleeping')));await page.clock.fastForward(8000);assert.ok(await page.locator('#pet-art').evaluate(e=>e.classList.contains('sleeping')),'arcade rest timer must not clear nighttime iD sleep');
 assert.deepEqual(errors,[]);await page.close();
 }
 // A successful sidecar save must not conceal a failed coin-ledger write.
 const failurePage=await browser.newPage({viewport:{width:320,height:844},timezoneId:'Asia/Tokyo'});
 await failurePage.clock.install({time:new Date('2026-11-03T08:00:00+09:00')});await failurePage.goto(base);
 await failurePage.evaluate(()=>{NightPet.reward({game:'quiz',id:'failure-ui-funds',coins:3});const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='night-pet-v1')throw new DOMException('quota','QuotaExceededError');return original.call(this,key,value)}});
 await failurePage.clock.fastForward(16*60000);await failurePage.locator('[data-care=feed]').click();
 assert.equal(await failurePage.locator('#coins').textContent(),'0');assert.match(await failurePage.locator('#notice').textContent(),/ごちそう/);
 assert.equal(await failurePage.locator('#storage').isVisible(),true);assert.match(await failurePage.locator('#storage').textContent(),/この画面を閉じると/);
 await failurePage.locator('[data-care=feed]').click();assert.match(await failurePage.locator('#notice').textContent(),/少し待って/);
 await failurePage.locator('[data-id-action=snack]').click();assert.match(await failurePage.locator('#notice').textContent(),/あと2コイン必要/);
 assert.equal(await failurePage.locator('#coins').textContent(),'0');assert.equal(await failurePage.evaluate(()=>IDCare.snapshot().hunger),4);
 assert.equal(await failurePage.locator('#storage').isVisible(),true);assert.match(await failurePage.locator('#storage').textContent(),/この画面を閉じると/);await failurePage.close();
 // Read-denied sidecar storage must not be overwritten even when writes succeed.
 for(const width of [320,390]){
 const context=await browser.newContext({viewport:{width,height:844},timezoneId:'Asia/Tokyo'});
 const page=await context.newPage();
 await page.clock.install({time:new Date('2026-11-03T08:00:00+09:00')});
 await page.goto(base);
 const saved=await page.evaluate(()=>{
   IDCare.act('room','cloud');
   const value=JSON.parse(localStorage.getItem(IDCare.key));
   Object.assign(value.pets.mori,{phase:'friend',bornAt:Date.now()-49*3600000,friendSince:Date.now(),friendship:[true,true,true,true],variant:'dreamy'});
   const raw=JSON.stringify(value);localStorage.setItem(IDCare.key,raw);return raw;
 });
 await page.addInitScript(()=>{
   const get=Storage.prototype.getItem;
   window.restoreCareRead=()=>{Storage.prototype.getItem=get};
   Storage.prototype.getItem=function(key){if(key==='night-pet-id-v1')throw new DOMException('read denied','SecurityError');return get.call(this,key)};
 });
 await page.reload();
 assert.equal(await page.locator('#storage').isVisible(),true);
 assert.equal(await page.evaluate(()=>IDCare.snapshot().storageOK),false);
 await page.locator('#id-panel summary').click();await page.locator('[data-value=sunset]').click();
 assert.equal(await page.locator('.pet-room').getAttribute('data-room'),'sunset');
 await page.evaluate(()=>window.restoreCareRead());
 assert.equal(await page.evaluate(()=>localStorage.getItem(IDCare.key)),saved);
 assert.equal(await page.evaluate(()=>IDCare.act('room','meadow').persistent),false);
 assert.equal(await page.evaluate(()=>localStorage.getItem(IDCare.key)),saved);
 assert.equal(await page.locator('#storage').isVisible(),true);
 // A fresh page has no injected failure and recovers the original mature pet.
 const recovered=await page.context().newPage();
 await recovered.clock.install({time:new Date('2026-11-03T08:00:00+09:00')});await recovered.goto(base);
 const pet=await recovered.evaluate(()=>IDCare.snapshot());
 assert.equal(pet.storageOK,true);assert.equal(pet.phase,'friend');assert.equal(pet.room,'cloud');
 assert.equal(pet.variant,'dreamy');assert.deepEqual(pet.friendship,[true,true,true,true]);
 await context.close();
 }
 console.log('PASS: sidecar read denial preserves saved growth/friendship at 320/390px, including restored reads and fresh-page recovery.');
 console.log('PASS: default iD egg/hatch, feeding/snacks, room/lights, toilet, care-mode cleanup, sleep and 320/390px fit. Screenshots artifacts/id-care-{320,390}.png');
}finally{await browser?.close();server?.kill()}
