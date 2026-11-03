import {acknowledgeReceipts} from './estate-test-confirmations.mjs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
const base=process.env.BASE_URL||'http://127.0.0.1:4196/night-arcade/';const server=process.env.BASE_URL?null:spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4196'},stdio:'pipe'});let browser;
try{
 if(server)await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no)});
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const width of [320,390]){
 const page=await browser.newPage({viewport:{width,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const Original=window.AudioContext;window.audioContexts=[];window.AudioContext=class extends Original{constructor(...args){super(...args);window.audioContexts.push(this)}};});
 await acknowledgeReceipts(page);await page.goto(new URL('estates/',base).href);assert.equal(await page.evaluate(()=>audioContexts.length),0,'no autoplay/context before gesture');
 await page.locator('#sound-toggle').click();assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'),'true');assert.equal(await page.evaluate(()=>audioContexts[0].state),'running');
 await page.locator('#solo').click();await page.evaluate(()=>{let i=0;Math.random=()=>++i%2?.01:.2});await page.getByRole('button',{name:'サイコロを振る',exact:true}).click();
 await page.locator('.dice-stage').waitFor();assert.equal(await page.locator('.cube-face').count(),12);await page.screenshot({path:`artifacts/estates-immersive-${width}.png`});
 await page.waitForFunction(()=>document.querySelector('.dice-stage')?.classList.contains('settled'));assert.match(await page.locator('.dice-result').textContent(),/1 \+ 2 = 3/);assert(await page.getByRole('button',{name:/^購入 /}).isDisabled());
 await page.locator('.dice-stage').waitFor({state:'detached'});assert.match(await page.locator('.decision-preview').textContent(),/€1,440/);
 await page.waitForFunction(()=>{const b=[...document.querySelectorAll('#actions button')].find(b=>b.textContent.startsWith('購入 '));return b&&!b.disabled&&document.querySelector('.journey-event')});
 const arrivalLayout=await page.evaluate(()=>{const rect=s=>document.querySelector(s).getBoundingClientRect(),notice=rect('.journey-event');return ['.decision-preview','#actions'].map(s=>{const r=rect(s);return notice.bottom<=r.top||notice.top>=r.bottom||notice.right<=r.left||notice.left>=r.right})});assert(arrivalLayout.every(Boolean),'live arrival notice must not obscure purchase consequences or actions');
 await page.screenshot({path:`artifacts/estates-arrival-clearance-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:/^購入 /}).click();await page.locator('.collection-stamp').waitFor();assert.match(await page.locator('.collection-stamp').textContent(),/旅の拠点/);assert.match(await page.locator('#collection-progress').textContent(),/1 \/ 2/);
 await page.getByRole('button',{name:'ターンを終了',exact:true}).click();await page.waitForFunction(()=>estateNetwork.state.turn===0&&estateNetwork.state.revision>3,{},{timeout:20000});
 await page.locator('.sound-settings summary').click();await page.locator('#quick-effects').check();await page.locator('#music-volume').fill('0');await page.locator('#effects-volume').fill('0');
 await page.locator('#sound-toggle').click();assert.equal(await page.evaluate(()=>audioContexts[0].state),'suspended');
 await page.reload();assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'),'false');await page.locator('.sound-settings summary').click();assert(await page.locator('#quick-effects').isChecked());assert.equal(await page.locator('#music-volume').inputValue(),'0');
 await page.locator('#solo').click();await page.getByRole('button',{name:'サイコロを振る',exact:true}).click();assert.equal(await page.locator('.dice-stage').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
 await page.close();
 }
 const page=await browser.newPage({reducedMotion:'reduce'});await acknowledgeReceipts(page);await page.goto(new URL('estates/',base).href);await page.locator('#solo').click();await page.getByRole('button',{name:'サイコロを振る',exact:true}).click();assert.equal(await page.locator('.dice-stage').count(),0);
 // Render the actual synthesized score/foley to PCM, not merely a mocked play() call.
 const samples=await page.evaluate(async()=>{const {JourneyAudio}=await import('./audio.js?v=immersive-1');const a=new JourneyAudio();a.ctx=new OfflineAudioContext(1,48000*5,48000);a.musicBus=a.ctx.createGain();a.fxBus=a.ctx.createGain();a.musicBus.connect(a.ctx.destination);a.fxBus.connect(a.ctx.destination);a.enabled=true;a.play('roll');a.play('purchase');a.musicBar();const out=await a.ctx.startRendering();let peak=0,energy=0;for(const x of out.getChannelData(0)){peak=Math.max(peak,Math.abs(x));energy+=x*x;}return{peak,energy}});assert(samples.peak>0&&samples.peak<1);assert(samples.energy>1);
 console.log('PASS immersion: 320/390px, gesture-only AudioContext, mute/resume and persisted volumes/quick mode; 12 cube faces, authoritative dice, locked actions then CPU handoff, purchase/set progress, reduced motion; actual procedural music/foley PCM nonzero and unclipped.');
}finally{await browser?.close();server?.kill()}
