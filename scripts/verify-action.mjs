import {chromium} from '@playwright/test';
import {strict as assert} from 'node:assert';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.ARCADE_URL||'http://127.0.0.1:4185';
for(const game of ['orbit','garden']){
 await page.goto(`${base}/games/${game}.html`);
 assert.equal(await page.locator('#start').textContent(),'プレイする');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('#start').click();
 await page.waitForTimeout(150);
 assert.equal(await page.evaluate(()=>mode),'playing');
 if(game==='orbit'){
  const before=await page.evaluate(()=>direction);
  await page.locator('#flip').click();
  assert.equal(await page.evaluate(()=>direction),-before);
  await page.evaluate(()=>{elapsed=5;update(.01)});
  assert.equal(await page.locator('#score').textContent(),'50');
 }else{
  await page.evaluate(()=>{items=[{x:basket,y:529,speed:0,hazard:false}];update(.01)});
  assert.equal(await page.locator('#score').textContent(),'10');
  await page.evaluate(()=>{keys.ArrowLeft=true;update(.04);keys.ArrowLeft=false});
  assert((await page.evaluate(()=>target))<320);
 }
 await page.locator('#pause').click();
 assert.equal(await page.evaluate(()=>mode),'paused');
 const frozen=await page.evaluate(()=>elapsed);
 await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>elapsed),frozen);
 await page.locator('#start').click();
 assert.equal(await page.evaluate(()=>mode),'playing');
 // A visible tab can lose focus to another application without visibilitychange.
 const beforeBlur=await page.evaluate(()=>{window.dispatchEvent(new Event('blur'));return {elapsed,score}});
 assert.equal(await page.evaluate(()=>mode),'paused',game+' pauses on window blur');
 await page.waitForTimeout(100);
 assert.deepEqual(await page.evaluate(()=>({elapsed,score})),beforeBlur,game+' freezes while unfocused');
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 assert.equal(await page.evaluate(()=>mode),'paused',game+' requires explicit resume');
 await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(()=>mode),'playing');
 if(game==='orbit')await page.evaluate(()=>{meteors=[{a:angle,r:182,speed:0,size:22}];update(0)});
 else await page.evaluate(()=>{lives=1;items=[{x:basket,y:529,speed:0,hazard:true}];update(.001)});
 assert.equal(await page.evaluate(()=>mode),'over');
 assert.equal(await page.locator('#start').textContent(),'もう一度プレイ');
 const saved=await page.locator('#best').textContent();assert(Number(saved)>0);
 await page.locator('#start').click();assert.equal(await page.locator('#score').textContent(),'0');
 await page.reload();assert.equal(await page.locator('#best').textContent(),saved);
 console.log(`${game}: mobile layout, start, input, scoring, pause/resume, window blur freeze and explicit keyboard resume, collision gameover, restart, best persistence PASS`);
}
assert.deepEqual(errors,[]);await browser.close();
