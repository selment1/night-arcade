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
 await page.clock.install({time:new Date('2026-11-03T08:00:00+09:00')});await page.goto(base);
 assert.equal(await page.locator('#care-id').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('#stage').textContent(),'たまご');
 await page.clock.fastForward(60000);assert.equal(await page.locator('#stage').textContent(),'ベビー期');
 await page.clock.fastForward(15*60000);await page.locator('[data-care=feed]').click();assert.match(await page.locator('#notice').textContent(),/ごちそう/);
 await page.locator('[data-id-action=snack]').click();assert.match(await page.locator('#notice').textContent(),/おやつ/);
 await page.locator('#id-panel summary').click();await page.locator('[data-value=cloud]').click();assert.equal(await page.locator('.pet-room').getAttribute('data-room'),'cloud');
 await page.locator('[data-care=rest]').click();assert.ok(await page.locator('.pet-room').evaluate(e=>e.classList.contains('lights-out')));
 await page.clock.fastForward(2*60*60000);assert.ok(!(await page.locator('#life-waste').isHidden()));
 await page.locator('[data-id-action=toilet]').click();assert.ok(await page.locator('#life-waste').isHidden());
 await page.locator('#care-arcade').click();assert.ok(await page.locator('#id-panel').isHidden());assert.ok(await page.locator('#life-waste').isHidden());assert.ok(!(await page.locator('.pet-room').evaluate(e=>e.classList.contains('lights-out'))));assert.ok(!(await page.locator('#pet-art').evaluate(e=>e.classList.contains('sleeping'))));
 await page.locator('#care-id').click();assert.ok(!(await page.locator('#id-panel').isHidden()));assert.ok(await page.locator('.pet-room').evaluate(e=>e.classList.contains('lights-out')));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`no horizontal overflow at ${width}`);
 await page.locator('[data-care=rest]').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`artifacts/id-care-${width}.png`,fullPage:true});
 await page.clock.fastForward(10*60*60000);assert.ok(await page.locator('#pet-art').evaluate(e=>e.classList.contains('sleeping')));await page.locator('#care-arcade').click();assert.ok(!(await page.locator('#pet-art').evaluate(e=>e.classList.contains('sleeping'))));
 await page.locator('[data-care=rest]').click();await page.locator('#care-id').click();assert.ok(await page.locator('#pet-art').evaluate(e=>e.classList.contains('sleeping')));await page.clock.fastForward(8000);assert.ok(await page.locator('#pet-art').evaluate(e=>e.classList.contains('sleeping')),'arcade rest timer must not clear nighttime iD sleep');
 assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS: default iD egg/hatch, feeding/snacks, room/lights, toilet, care-mode cleanup, sleep and 320/390px fit. Screenshots artifacts/id-care-{320,390}.png');
}finally{await browser?.close();server?.kill()}
