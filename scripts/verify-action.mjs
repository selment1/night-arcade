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
 {
  for(const viewport of [{width:844,height:390},{width:568,height:320}]){
   await page.setViewportSize(viewport);
   assert(await page.locator('#start').evaluate(el=>{const b=el.getBoundingClientRect(),v=document.querySelector('#veil').getBoundingClientRect();return b.top>=v.top&&b.bottom<=v.bottom}), 'ready button fits landscape overlay');
   assert(await page.locator('#description').evaluate(el=>{const b=el.getBoundingClientRect(),v=document.querySelector('#veil').getBoundingClientRect();return b.top>=v.top&&b.bottom<=v.bottom}), 'ready instructions fit landscape overlay');
  }
  await page.locator('#start').tap();
  await page.setViewportSize({width:375,height:812});
 }
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
  // Rotation must retain the round while fitting the whole orbit and controls.
  await page.evaluate(()=>{halt();elapsed=5;score=50;scoreEl.textContent=score;spawn=100;meteors=[]});
  for(const viewport of [{width:844,height:390},{width:568,height:320},{width:320,height:568}]){
   const state=await page.evaluate(()=>({score,elapsed,angle,direction,swaps}));
   await page.setViewportSize(viewport);
   assert.deepEqual(await page.evaluate(()=>({score,elapsed,angle,direction,swaps})),state,'resize retains active round');
   assert.equal(await page.evaluate(()=>mode),'playing');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'resized orbit has no horizontal overflow');
   await page.locator('.board').evaluate(el=>el.scrollIntoView({block:'start'}));
   const board=await page.locator('.board').boundingBox();
   const controls=await page.locator('.controls').boundingBox();
   assert(board.y>=-1&&controls.y+controls.height<=viewport.height,'whole board and controls fit after scrolling');
   await page.locator('#pause').click();
   const paused=await page.evaluate(()=>({score,elapsed,angle,direction,swaps}));
   await page.setViewportSize({width:viewport.height,height:viewport.width});
   assert.equal(await page.evaluate(()=>mode),'paused');
   assert.deepEqual(await page.evaluate(()=>({score,elapsed,angle,direction,swaps})),paused,'rotation retains paused round');
   const resume=page.locator('#start');
   await resume.scrollIntoViewIfNeeded();
   const fits=await resume.evaluate(el=>{const b=el.getBoundingClientRect(),v=document.querySelector('#veil').getBoundingClientRect();return b.top>=v.top&&b.bottom<=v.bottom&&b.left>=v.left&&b.right<=v.right});
   assert(fits,'resume button is not clipped after rotation');
   await resume.click();await page.evaluate(()=>halt());
   assert.equal(await page.evaluate(()=>mode),'playing');
  }
  await page.setViewportSize({width:375,height:812});
  console.log('orbit: active/paused rotation preserves round; full board and controls fit mobile portrait/landscape; resume reachable PASS');
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
  await page.evaluate(()=>{elapsed=5;update(.01)});
  assert.equal(await page.locator('#score').textContent(),'50');
 }else{
  // Keep the entire catching field and movement/pause buttons visible on rotation.
  await page.evaluate(()=>{halt();elapsed=5;spawn=100;items=[{x:150,y:200,speed:140,hazard:false}]});
  const gardenState=()=>page.evaluate(()=>({score,elapsed,basket,target,lives,spawn,items}));
  for(const viewport of [{width:844,height:390},{width:568,height:320},{width:320,height:568}]){
   const active=await gardenState();
   await page.setViewportSize(viewport);
   assert.equal(await page.evaluate(()=>mode),'playing');
   assert.deepEqual(await gardenState(),active,'garden rotation retains active round and falling items');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'garden rotation has no horizontal overflow');
   await page.locator('.board').evaluate(el=>el.scrollIntoView({block:'start'}));
   const board=await page.locator('.board').boundingBox(),controls=await page.locator('.controls').boundingBox();
   assert(board.y>=-1&&controls.y+controls.height<=viewport.height,'garden entire board and controls fit viewport');
   const canvasBox=await page.locator('#canvas').boundingBox();
   await page.touchscreen.tap(canvasBox.x+canvasBox.width*.25,canvasBox.y+canvasBox.height*.5);
   assert(Math.abs(await page.evaluate(()=>target)-160)<4,'garden scaled canvas maps touch to logical basket position');
   await page.locator('#pause').tap();
   const paused=await gardenState();
   await page.setViewportSize({width:viewport.height,height:viewport.width});
   assert.equal(await page.evaluate(()=>mode),'paused');
   assert.deepEqual(await gardenState(),paused,'garden rotation retains paused round');
   assert(await page.locator('#start').evaluate(el=>{const b=el.getBoundingClientRect(),v=document.querySelector('#veil').getBoundingClientRect();return b.top>=v.top&&b.bottom<=v.bottom&&b.left>=v.left&&b.right<=v.right}),'garden resume is not clipped after rotation');
   await page.locator('#start').tap();await page.evaluate(()=>halt());
   assert.equal(await page.evaluate(()=>mode),'playing');
  }
  await page.setViewportSize({width:375,height:812});
  await page.evaluate(()=>{reset();resume();halt()});
  console.log('garden: active/paused portrait-landscape rotation retains state and items; full board, controls and resume reachable PASS');
  await page.evaluate(()=>{items=[{x:basket,y:529,speed:0,hazard:false}];update(.01)});
  assert.equal(await page.locator('#score').textContent(),'10');
  // Each held input owns its direction until that particular input releases.
  await page.evaluate(()=>{halt();document.activeElement.blur()});
  const left=page.locator('#left');
  const box=await left.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  const movesLeft=async label=>assert(await page.evaluate(()=>{
   target=basket=320;items=[];update(.04);return target<320;
  }),label);
  for(const release of ['keyboard','pointer']){
   await page.keyboard.down('ArrowLeft');await page.mouse.down();
   if(release==='keyboard')await page.keyboard.up('ArrowLeft');else await page.mouse.up();
   await movesLeft(`releasing ${release} preserves the other held input`);
   if(release==='keyboard')await page.mouse.up();else await page.keyboard.up('ArrowLeft');
   assert(!await page.evaluate(()=>keys.ArrowLeft),'last release stops movement');
  }
  await left.focus();
  await page.keyboard.down('Space');await page.keyboard.press('x');
  await movesLeft('unrelated key release preserves held button activation');
  await page.keyboard.down('Enter');await page.keyboard.up('Space');
  await movesLeft('Space release preserves held Enter');
  await page.keyboard.up('Enter');
  assert(!await page.evaluate(()=>keys.ArrowLeft),'last activation release stops movement');
  await page.evaluate(()=>document.activeElement.blur());
  console.log('garden: independent keyboard, pointer, and button activation ownership PASS');
  // CDP supplies real trusted touch/pointer events, including per-contact capture.
  const touch=await page.context().newCDPSession(page);
  for(const [id,key,sign] of [['left','ArrowLeft',-1],['right','ArrowRight',1]]){
   await page.locator('#'+id).scrollIntoViewIfNeeded();
   const bounds=await page.locator('#'+id).boundingBox();
   const contacts=[.3,.7].map((fraction,index)=>({
    x:bounds.x+bounds.width*fraction,y:bounds.y+bounds.height/2,id:index+1,
   }));
   for(const first of [0,1]){
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:contacts});
    assert.equal(await page.evaluate(key=>directionInputs.get(key).size,key),2,`${id}: two distinct held contacts`);
    // touchEnd's listed contacts are the contacts being released, not survivors.
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[contacts[first]]});
    assert.equal(await page.evaluate(key=>directionInputs.get(key).size,key),1,`${id}: one contact remains`);
    const delta=await page.evaluate(()=>{target=basket=320;items=[];update(.04);return target-320});
    assert(delta*sign>0,`${id}: releasing contact ${first} preserves the other contact's movement`);
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert(!await page.evaluate(key=>keys[key],key),`${id}: final touch release stops movement`);
   }
   await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:contacts});
   // CDP cancellation is all-contact only; it cannot model selective touch cancellation.
   await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
   assert(!await page.evaluate(key=>keys[key],key),`${id}: browser touch cancellation clears movement`);
  }
  await touch.detach();
  console.log('garden: real two-touch holds survive either release order; final release/cancel clears movement PASS');

  await page.evaluate(()=>{target=basket=320;keys.ArrowLeft=true;update(.04);keys.ArrowLeft=false});
  assert((await page.evaluate(()=>target))<320);
 }
 // Pause decisions fire once per press, including browser-native Enter button clicks.
 for(const focus of ['body','#pause'])for(const key of focus==='body'?['Escape']:['Escape','Enter']){
  await page.evaluate(()=>{halt();document.activeElement.blur()});
  if(focus==='#pause')await page.locator(focus).focus();
  for(const expected of ['paused','playing']){
   await page.keyboard.down(key);
   assert.equal(await page.evaluate(()=>mode),expected,`${game} fresh ${key} on ${focus}`);
   for(let i=0;i<7;i++){
    await page.keyboard.down(key);
    assert.equal(await page.evaluate(()=>mode),expected,`${game} held ${key} on ${focus} stays ${expected}`);
   }
   await page.keyboard.up(key);
  }
 }
 console.log(`${game}: held Escape (body/button) and Enter (pause button) toggle once, release/repress works PASS`);
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
  for(const input of ['keyboard','pointer','combined'])for(const interruption of ['manual','blur','visibilitychange','pagehide']){
   if(input!=='pointer')await page.keyboard.down('ArrowLeft');
   if(input!=='keyboard'){const box=await page.locator('#left').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down()}
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
   if(input!=='pointer')await page.keyboard.up('ArrowLeft');
   if(input!=='keyboard')await page.mouse.up();
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
 {
  await page.setViewportSize({width:568,height:320});
  assert(await page.locator('#start').evaluate(el=>{const b=el.getBoundingClientRect(),v=document.querySelector('#veil').getBoundingClientRect();return b.top>=v.top&&b.bottom<=v.bottom}), 'restart button fits landscape overlay');
 }
 const saved=await page.locator('#best').textContent();assert(Number(saved)>0);
 await page.locator('#start').click();assert.equal(await page.locator('#score').textContent(),'0');
 await page.setViewportSize({width:375,height:812});
 await page.reload();assert.equal(await page.locator('#best').textContent(),saved);
 console.log(`${game}: mobile layout, start, input, scoring, pause/resume, window blur freeze and explicit keyboard resume, collision gameover, restart, best persistence PASS`);
}
// Model 200% text enlargement, including explicitly sized text, on narrow portrait.
const largeGarden=await browser.newPage({viewport:{width:320,height:780},isMobile:true,hasTouch:true});
largeGarden.on('pageerror',e=>errors.push(e.message));
try{
 await largeGarden.goto(`${base}/games/garden.html`);
 await largeGarden.evaluate(()=>{
  const sizes=[...document.querySelectorAll('body,body *')].map(el=>[el,getComputedStyle(el).fontSize]);
  for(const [el,size] of sizes)el.style.fontSize=`${parseFloat(size)*2}px`;
 });
 const reachable=async selector=>{
  const element=largeGarden.locator(selector);
  await element.scrollIntoViewIfNeeded();
  assert(await element.evaluate(el=>{
   const b=el.getBoundingClientRect(),v=document.querySelector('#veil').getBoundingClientRect();
   return b.top>=v.top&&b.bottom<=v.bottom&&b.left>=v.left&&b.right<=v.right;
  }),`${selector} can be scrolled fully into enlarged-text overlay`);
 };
 // Check both ends of instructions: a paragraph may itself exceed the board height.
 assert(await largeGarden.locator('#veil').evaluate(el=>{
  el.scrollTop=0;
  return document.querySelector('#badge').getBoundingClientRect().top>=el.getBoundingClientRect().top;
 }),'enlarged-text overlay beginning is not clipped above scroll origin');
 await reachable('#heading');
 assert(await largeGarden.locator('#description').evaluate(el=>{
  const v=document.querySelector('#veil');
  el.scrollIntoView({block:'start'});
  const first=el.getBoundingClientRect().top>=v.getBoundingClientRect().top-1;
  el.scrollIntoView({block:'end'});
  return first&&el.getBoundingClientRect().bottom<=v.getBoundingClientRect().bottom+1;
 }),'all enlarged instructions can be reached by scrolling');
 await reachable('#start');await largeGarden.locator('#start').tap();
 assert.equal(await largeGarden.evaluate(()=>mode),'playing');
 await largeGarden.evaluate(()=>halt());
 for(const [selector,sign] of [['#left',-1],['#right',1]]){
  await largeGarden.locator(selector).focus();
  await largeGarden.keyboard.down('Space');
  const delta=await largeGarden.evaluate(()=>{target=basket=320;items=[];update(.04);return target-320});
  await largeGarden.keyboard.up('Space');
  assert(delta*sign>0,'enlarged movement control works');
 }
 await largeGarden.locator('#pause').tap();
 assert.equal(await largeGarden.evaluate(()=>mode),'paused');
 await reachable('#start');await largeGarden.locator('#start').tap();
 assert.equal(await largeGarden.evaluate(()=>mode),'playing');
 await largeGarden.evaluate(()=>{halt();finish()});
 await reachable('#start');await largeGarden.locator('#start').tap();
 assert.equal(await largeGarden.evaluate(()=>mode),'playing');
 assert(await largeGarden.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Garden 200% text has no horizontal overflow at 320px');
 console.log('garden: 320px / 200% text instructions, start, movement, pause/resume and restart reachable without horizontal overflow PASS');
}finally{await largeGarden.close()}
assert.deepEqual(errors,[]);await browser.close();
