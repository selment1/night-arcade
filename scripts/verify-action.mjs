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
 // A queued frame timestamp can precede resume's performance.now() in the same frame.
 const firstFrame=await page.evaluate(()=>{
  reset();resume();cancelAnimationFrame(raf);raf=0;
  frame(last-2);halt();return {score,elapsed};
 });
 assert.equal(firstFrame.score,0,game+' first resume frame must not produce negative score');
 assert.equal(firstFrame.elapsed,0,game+' time cannot run backwards');
 await page.evaluate(()=>resume());
 if(game==='orbit'){
  const before=await page.evaluate(()=>direction);
  await page.locator('#flip').click();
  assert.equal(await page.evaluate(()=>direction),-before);
  // Repeated keydown events represent one held key, not new player decisions.
  await page.evaluate(()=>{halt();document.activeElement.blur()});
  for(const target of ['body','#flip']){
   if(target==='#flip')await page.locator(target).focus();
   for(const key of target==='body'?['Space']:['Space','Enter']){
    const turns=await page.evaluate(()=>swaps);
    for(let i=0;i<8;i++)await page.keyboard.down(key);
    await page.keyboard.up(key);
    assert.equal(await page.evaluate(()=>swaps),turns+1,`${target} held ${key} flips once`);
    await page.keyboard.press(key);
    assert.equal(await page.evaluate(()=>swaps),turns+2,`${target} released ${key} can flip again`);
   }
  }
  for(let i=0;i<8;i++)await page.keyboard.down('Escape');
  assert.equal(await page.evaluate(()=>mode),'paused','held Escape stays paused');
  await page.keyboard.up('Escape');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>mode),'playing','fresh Escape resumes');
  await page.locator('#pause').focus();
  for(let i=0;i<8;i++)await page.keyboard.down('Enter');
  assert.equal(await page.evaluate(()=>mode),'paused','held Enter on pause stays paused');
  await page.keyboard.up('Enter');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>mode),'playing','fresh Enter on pause resumes');
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
 if(game==='garden'){
  // OS interruptions can swallow releases; manual pause can also happen on a second touch.
  for(const input of ['keyboard','pointer'])for(const interruption of ['manual','blur','visibilitychange','pagehide']){
   if(input==='keyboard')await page.keyboard.down('ArrowLeft');
   else{const box=await page.locator('#left').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down()}
   assert.equal(await page.evaluate(()=>keys.ArrowLeft),true,`${input} starts movement`);
   await page.evaluate(kind=>{
    if(kind==='manual')document.querySelector('#pause').click();
    else if(kind==='visibilitychange'){
     Object.defineProperty(document,'hidden',{configurable:true,value:true});
     document.dispatchEvent(new Event(kind));delete document.hidden;
    }else window.dispatchEvent(new Event(kind));
   },interruption);
   assert.equal(await page.evaluate(()=>mode),'paused');
   // Resume before release, proving that it is pausing (not keyup/pointerup) that clears input.
   await page.evaluate(()=>document.querySelector('#start').click());
   const movement=await page.evaluate(()=>{
    cancelAnimationFrame(raf);raf=0;items=[];target=basket=320;update(.04);return target;
   });
   assert.equal(movement,320,`${input} does not stick after ${interruption}`);
   if(input==='keyboard')await page.keyboard.up('ArrowLeft');else await page.mouse.up();
  }
  await page.locator('#pause').click();
  await page.locator('#left').focus();
  for(const key of ['Space','Enter']){
   await page.keyboard.down(key);
   assert(!await page.evaluate(()=>keys.ArrowLeft),`${key} cannot arm movement while paused`);
   await page.keyboard.up(key);
  }
  await page.locator('#start').click();
  console.log('garden: held pointer/keyboard cleared across manual pause, blur, hidden tab, pagehide; paused Space/Enter ignored PASS');
 }
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
