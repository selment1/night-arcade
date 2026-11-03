/** Shop rerenders must not strand keyboard users at document.body. */
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4197/';
const server=process.env.BASE_URL?null:spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4197'},stdio:'pipe'});
let browser;
try {
 if(server)await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Server exited '+code)))});
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const width of [320,390,1280]){
  const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});
  await page.clock.install();
  await page.goto(base);
  await page.locator('#outfits-open').click();
  await page.locator('[data-item="bow"]').focus();
  // The real periodic render previously removed the focused button.
  await page.clock.fastForward(60000);
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.item),'bow','timer retains wardrobe focus');
  // A same-origin cross-tab update takes the same rerender path.
  await page.evaluate(()=>window.dispatchEvent(new StorageEvent('storage',{key:NightPet.key})));
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.item),'bow','storage refresh retains wardrobe focus');
  // Failed purchase leaves the control usable, without changing the wallet.
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.item),'bow');
  assert.equal(await page.locator('#coins').textContent(),'0');
  await page.evaluate(()=>NightPet.reward({game:'quiz',id:'focus-test',coins:40,xp:40}));
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.item),'bow');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#coins').textContent(),'5');
  assert.equal(await page.locator('[data-item="bow"]').isDisabled(),true);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'shop-close','selection moves focus to usable close control');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#shop').isHidden(),true);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'outfits-open','close restores opener');
  await page.locator('#characters-open').click();
  await page.locator('[data-item="kitsune"]').focus();
  await page.clock.fastForward(60000);
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.item),'kitsune','character shop retains focus');
  await page.locator('#characters-open').focus();
  await page.clock.fastForward(60000);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'characters-open','refresh does not steal outside focus');
  await page.close();
 }
 console.log('PASS: shop focus survives timer/storage/reward rerenders; failed purchase retains button; purchase focuses close; close restores opener; outside focus untouched at 320/390/1280.');
}finally{await browser?.close();server?.kill()}
