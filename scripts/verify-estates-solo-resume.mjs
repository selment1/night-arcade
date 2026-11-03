import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
const base=process.env.BASE_URL||'http://127.0.0.1:4197/night-arcade/';
const server=process.env.BASE_URL?null:spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4197'},stdio:'pipe'});let browser;
const key='night-arcade.estates.solo.v1';
try{
 if(server)await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no)});
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const viewport of [{width:320,height:568},{width:390,height:844}]){
  const isolated=await browser.newContext({viewport,reducedMotion:'reduce'});
  const owner=await isolated.newPage();await owner.goto(new URL('estates/',base).href);await owner.locator('#solo').click();await owner.waitForFunction(()=>estateNetwork.solo);
  const raw=await owner.evaluate(k=>localStorage.getItem(k),key);
  for(const failure of ['locked','unsupported','read']){
   const nav=await isolated.newPage();await nav.goto(new URL('estates/',base).href);
   if(failure==='unsupported')await nav.evaluate(()=>Object.defineProperty(navigator,'locks',{configurable:true,value:undefined}));
   if(failure==='read'){
    await owner.close();
    await nav.evaluate(()=>{window.savedStorage=localStorage;Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('denied','SecurityError')}})});
   }
   await nav.locator('#solo').scrollIntoViewIfNeeded();
   await nav.locator('#solo').click();
   const phrase={locked:'別のタブ',unsupported:'このブラウザでは',read:'保存データを読み込めませんでした'}[failure];
   await nav.waitForFunction(text=>document.getElementById('status').textContent.includes(text),phrase);
   const status=await nav.locator('#status').evaluate(e=>{const r=e.getBoundingClientRect();return {focused:e===document.activeElement,role:e.getAttribute('role'),visible:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth}});
   assert.deepEqual(status,{focused:true,role:'status',visible:true},`${viewport.width}px ${failure}: error must be visible and focused`);
   assert.equal(await nav.locator('#solo-resume').count(),0);assert.equal(await nav.evaluate(()=>!!estateNetwork.solo),false);
   assert.equal(await nav.evaluate(k=>(window.savedStorage||localStorage).getItem(k),key),raw,`${failure}: preserve existing save`);
   await nav.close();
  }
  await isolated.close();
 }
 for(const width of [320,390]){
  const isolated=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});const nav=await isolated.newPage();
  await nav.goto(new URL('estates/',base).href);await nav.locator('#solo').click();await nav.waitForFunction(()=>document.activeElement.matches('#actions .roll-action'));
  for(const choice of ['solo-continue','solo-new']){
   await nav.reload();await nav.locator('#solo').click();await nav.getByRole('dialog',{name:'保存した旅があります',exact:true}).waitFor();
   const before=await nav.evaluate(k=>localStorage.getItem(k),key);await nav.keyboard.press('Escape');assert.equal(await nav.evaluate(()=>document.activeElement.id),'solo');assert.equal(await nav.evaluate(k=>localStorage.getItem(k),key),before);
   await nav.locator('#solo').click();await nav.locator('#solo-resume').getByRole('button',{name:'戻る',exact:true}).click();assert.equal(await nav.evaluate(()=>document.activeElement.id),'solo');assert.equal(await nav.evaluate(k=>localStorage.getItem(k),key),before);
   await nav.locator('#solo').click();await nav.locator('#'+choice).focus();await nav.keyboard.press('Enter');await nav.waitForFunction(()=>document.activeElement.matches('#actions .roll-action'));
   assert.equal(await nav.locator('#solo-resume').count(),0);assert(await nav.locator('#entry').evaluate(e=>e.hidden));
  }
  await isolated.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(new URL('estates/',base).href);await page.locator('#solo').click();await page.waitForFunction(()=>window.estateNetwork.solo);
 await page.evaluate(()=>{let i=0;const values=[.2,.7,0];Math.random=()=>values[i++%values.length]});
 await page.getByRole('button',{name:'サイコロを振る',exact:true}).click();await page.locator('.journey-card').waitFor();
 const pending=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(pending.state.revision,pending.presentationState.revision+1);
 await page.reload();await page.locator('#solo').click();await page.locator('#solo-continue').click();await page.locator('.journey-card').waitFor();assert.equal(await page.locator('.journey-card.revealed').count(),0);assert(await page.locator('.journey-card').evaluate(e=>e===document.activeElement));
 await page.waitForTimeout(1700);assert.equal(await page.evaluate(()=>estateNetwork.state.revision),pending.state.revision);
 await page.locator('.journey-card').click();await page.locator('.journey-card').click();await page.locator('.payment-sheet').waitFor();
 await page.reload();await page.locator('#solo').click();await page.locator('#solo-continue').click();await page.locator('.journey-card').click();await page.locator('.journey-card').click();await page.locator('.payment-sheet').waitFor();await page.waitForTimeout(1700);assert.equal(await page.evaluate(()=>estateNetwork.state.revision),pending.state.revision);
 await page.locator('.payment-confirm').click();const ack=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.deepEqual(ack.state,ack.presentationState);assert.equal(ack.state.players[0].money,1600);
 const other=await context.newPage();await other.goto(new URL('estates/',base).href);const raw=await other.evaluate(k=>localStorage.getItem(k),key);await other.locator('#solo').click();await other.waitForFunction(()=>document.getElementById('status').textContent.includes('別のタブ'));assert.equal(await other.locator('#solo-new').count(),0);assert.equal(await other.locator('#solo-discard').count(),0);assert.equal(await other.evaluate(k=>localStorage.getItem(k),key),raw);assert.equal(await other.evaluate(()=>!!estateNetwork.solo),false);
 await page.close();await other.locator('#solo').click();await other.locator('#solo-new').waitFor();
 await other.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError')}});await other.locator('#solo-new').click();assert.equal(await other.evaluate(k=>localStorage.getItem(k),key),raw);assert.equal(await other.evaluate(()=>!!estateNetwork.solo),false);await other.evaluate(()=>{Storage.prototype.setItem=window.originalSet});await other.locator('#solo-new').click();await other.waitForFunction(()=>estateNetwork.solo);assert.notEqual(await other.evaluate(k=>JSON.parse(localStorage.getItem(k)).gameId,key),ack.gameId);
 await other.reload();await other.evaluate(k=>localStorage.setItem(k,'{broken'),key);await other.locator('#solo').click();await other.locator('#solo-discard').waitFor();assert.equal(await other.evaluate(()=>document.activeElement.textContent),'戻る');await other.keyboard.press('Enter');assert.equal(await other.locator('#solo-resume').count(),0);assert.equal(await other.evaluate(k=>localStorage.getItem(k),key),'{broken');await other.locator('#solo').click();await other.keyboard.press('Escape');assert.equal(await other.locator('#solo-resume').count(),0);assert.equal(await other.evaluate(()=>document.activeElement.id),'solo');assert.equal(await other.evaluate(k=>localStorage.getItem(k),key),'{broken');await other.locator('#solo').click();await other.locator('#solo-discard').waitFor();assert.equal(await other.locator('#solo-resume').count(),1);assert.equal(await other.locator('#solo-new').count(),0);assert.equal(await other.evaluate(k=>localStorage.getItem(k),key),'{broken');await other.locator('#solo-resume').getByRole('button',{name:'戻る',exact:true}).click();assert.equal(await other.evaluate(k=>localStorage.getItem(k),key),'{broken');await other.locator('#solo').click();await other.locator('#solo-discard').click();assert.equal(await other.evaluate(k=>localStorage.getItem(k),key),null);await other.locator('#solo').click();await other.waitForFunction(()=>estateNetwork.solo);assert(await other.evaluate(k=>!!JSON.parse(localStorage.getItem(k)),key));await other.setViewportSize({width:320,height:844});
 const cpuRevision=await other.evaluate(async k=>{const {createGame,act}=await import('./engine.js?v=trade-1');const {createSoloSave}=await import('./solo-save.js?v=resume-1');const before=createGame([{id:'human',name:'あなた'},{id:'cpu',name:'CPU'}]);before.turn=1;before.properties[3].owner='human';let i=0;const result=act(before,'cpu',{type:'roll'},()=>[0,.2][i++]);if(!result.ok)throw Error(result.error);localStorage.setItem(k,JSON.stringify(createSoloSave({gameId:'cpu-receipt',saveRevision:1,state:result.state,presentationState:before})));return result.state.revision;},key);
 await other.reload();await other.locator('#solo').click();await other.locator('#solo-continue').waitFor();assert.equal(await other.evaluate(()=>document.activeElement.id),'solo-continue');assert(await other.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await other.locator('#solo-continue').click();await other.locator('.payment-sheet').waitFor();assert(await other.locator('.payment-confirm').evaluate(e=>e===document.activeElement));await other.waitForTimeout(1800);assert.equal(await other.evaluate(()=>estateNetwork.state.revision),cpuRevision,'CPU end action must wait for human receipt');await other.locator('.payment-confirm').click();await other.waitForFunction(r=>estateNetwork.state.revision>r,cpuRevision);assert.deepEqual(errors,[]);
 console.log('PASS solo resume: visible mobile entry errors at 320×568/390×844, unread card + receipt replay, acknowledged snapshot, CPU paused, exclusive two-tab lock, corrupt bytes protected until explicit discard.');
}finally{await browser?.close();server?.kill()}
