import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:320,height:780}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
const url=n=>pathToFileURL(path.resolve('public/games/'+n+'.html')).href;
await page.goto(url('prism'));
assert.equal(await page.locator('.tile').count(),9);
await page.locator('.tile').first().focus();await page.keyboard.press('Enter');
assert.equal(await page.locator('#moves').textContent(),'1');
await page.locator('#restart').click();assert.equal(await page.locator('#moves').textContent(),'0');
for(let stage=1;stage<=6;stage++){
 for(let j=0;j<30 && !await page.locator('#result').isVisible();j++)await page.locator('#hint').click();
 assert(await page.locator('#result').isVisible(),`stage ${stage} solvable`);
 assert.equal(await page.locator('#best').textContent(),`${stage} / 6`);
 await page.locator('#next').click();
}
assert.equal(await page.locator('#level').textContent(),'1 / 6');
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.reload();assert.equal(await page.locator('#best').textContent(),'6 / 6');
// Holding Enter keeps targeting the now-hidden Next button: only a won stage may advance.
const repeatPage=await browser.newPage();
await repeatPage.goto(url('prism'));
await repeatPage.evaluate(()=>{
 window.progressWrites=[];
 const setItem=Storage.prototype.setItem;
 Storage.prototype.setItem=function(key,value){
  if(key==='night-prism-best')window.progressWrites.push(value);
  return setItem.call(this,key,value);
 };
});
await repeatPage.locator('#hint').focus();
for(let i=0;i<30;i++)await repeatPage.keyboard.down('Enter');
await repeatPage.keyboard.up('Enter');
assert.equal(await repeatPage.locator('#best').textContent(),'1 / 6');
assert.equal(await repeatPage.evaluate(()=>window.progressWrites.length),1,'held completion input saves once');
await repeatPage.locator('#next').focus();
for(let i=0;i<30;i++)await repeatPage.keyboard.down('Enter');
await repeatPage.keyboard.up('Enter');
assert.equal(await repeatPage.locator('#level').textContent(),'2 / 6','held Enter on Next advances only the completed stage');
assert.equal(await repeatPage.locator('#moves').textContent(),'0');
await repeatPage.locator('#restart').focus();
for(let i=0;i<30;i++)await repeatPage.keyboard.down('Enter');
await repeatPage.keyboard.up('Enter');
assert.equal(await repeatPage.locator('#level').textContent(),'2 / 6');
assert.equal(await repeatPage.locator('#moves').textContent(),'0');
assert.equal(await repeatPage.locator('#best').textContent(),'1 / 6','repeated restart preserves best');
await repeatPage.reload();
assert.equal(await repeatPage.locator('#best').textContent(),'1 / 6','keyboard progression preserves saved best');
await repeatPage.close();
// A rapid second tap on Next must not rotate a tile exposed by the layout shift.
const touchPage=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await touchPage.goto(url('prism'));
for(let j=0;j<30 && !await touchPage.locator('#result').isVisible();j++)await touchPage.locator('#hint').click();
await touchPage.locator('#next').scrollIntoViewIfNeeded();
const nextBox=await touchPage.locator('#next').boundingBox();
const tapX=nextBox.x+nextBox.width/2,tapY=nextBox.y+nextBox.height/2;
await touchPage.touchscreen.tap(tapX,tapY);
await touchPage.waitForTimeout(60);
await touchPage.touchscreen.tap(tapX,tapY);
assert.equal(await touchPage.locator('#level').textContent(),'2 / 6');
assert.equal(await touchPage.locator('#moves').textContent(),'0','rapid Next double tap does not rotate the new board');
assert.equal(await touchPage.locator('#best').textContent(),'1 / 6');
await touchPage.waitForTimeout(320);
await touchPage.locator('.tile').first().tap();
assert.equal(await touchPage.locator('#moves').textContent(),'1','new board accepts input after transition');
await touchPage.reload();
assert.equal(await touchPage.locator('#best').textContent(),'1 / 6','transition preserves saved progress');
await touchPage.close();
await page.addInitScript(()=>Math.random=()=>0);
await page.goto(url('memory'));
for(const count of [6,8]){
 await page.selectOption('#difficulty',String(count));
 const deck=[...Array(count).keys(),...Array(count).keys()];for(let i=deck.length-1;i>0;i--)[deck[i],deck[0]]=[deck[0],deck[i]];
 for(let v=0;v<count;v++)for(let i=0;i<deck.length;i++)if(deck[i]===v)await page.locator('.card').nth(i).click();
 assert(await page.locator('#result').isVisible());
 assert.equal(await page.locator('#turns').textContent(),String(count));
 assert.equal(await page.locator('.matched').count(),count*2);
}
await page.locator('#restart').click();
await page.locator('.card').nth(0).click();await page.locator('.card').nth(1).click();
assert.equal(await page.locator('.open').count(),2);
await page.locator('#restart').click();await page.waitForTimeout(1200);
assert.equal(await page.locator('.open').count(),0);assert.equal(await page.locator('#turns').textContent(),'0');
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
// Readable storage can retain an older record while writes fail (for example quota).
// Give this case an isolated origin so no existing records or other tests are touched.
const memoryHtml=await readFile('public/games/memory.html');
const memoryServer=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(memoryHtml)});
await new Promise(resolve=>memoryServer.listen(0,'127.0.0.1',resolve));
const memoryContext=await browser.newContext();
try{
 await memoryContext.addInitScript(()=>{
  Math.random=()=>0;
  localStorage.setItem('night-memory-best-6','12');
  localStorage.setItem('night-memory-best-8','16');
  Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError')};
 });
 const memoryPage=await memoryContext.newPage();
 memoryPage.on('pageerror',e=>errors.push(String(e)));
 await memoryPage.goto(`http://127.0.0.1:${memoryServer.address().port}`);
 assert.equal(await memoryPage.locator('#best').textContent(),'12 組','existing easy record loads');
 for(const count of [6,8]){
  await memoryPage.selectOption('#difficulty',String(count));
  assert.equal(await memoryPage.locator('#best').textContent(),`${count*2} 組`,'existing difficulty record loads');
  const deck=[...Array(count).keys(),...Array(count).keys()];
  for(let i=deck.length-1;i>0;i--)[deck[i],deck[0]]=[deck[0],deck[i]];
  for(let v=0;v<count;v++)for(let i=0;i<deck.length;i++)if(deck[i]===v)await memoryPage.locator('.card').nth(i).click();
  assert(await memoryPage.locator('#result').isVisible());
  assert.equal(await memoryPage.locator('#best').textContent(),`${count} 組`);
  assert(await memoryPage.locator('#storage-note').isVisible(),'failed save is disclosed');
  await memoryPage.locator('#restart').click();
  assert.equal(await memoryPage.locator('#best').textContent(),`${count} 組`,'restart preserves improved in-session record after failed write');
 }
 for(const count of [6,8,6]){
  await memoryPage.selectOption('#difficulty',String(count));
  assert.equal(await memoryPage.locator('#best').textContent(),`${count} 組`,'difficulty switch preserves each improved in-session record');
 }
 assert.deepEqual(await memoryPage.evaluate(()=>[localStorage.getItem('night-memory-best-6'),localStorage.getItem('night-memory-best-8')]),['12','16'],'stored records remain untouched');
}finally{
 await memoryContext.close();
 await new Promise(resolve=>memoryServer.close(resolve));
}
assert.deepEqual(errors,[]);
await browser.close();console.log('PASS: prism all 6 levels solvable, keyboard rotation, restart, saved progress; memory both difficulties perfect wins, reset during mismatch, failed-write session records, 320px layout, no page errors');
