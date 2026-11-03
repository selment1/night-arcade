import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const reducedMotion of ['no-preference','reduce']){
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion});
 await page.setContent('<section id="game"><p id="dice"></p><div class="player" data-player-id="one">旅人</div></section>');
 const source=(await readFile(new URL('../public/estates/effects.js',import.meta.url),'utf8')).replace('export class JourneyEffects','window.JourneyEffects = class JourneyEffects');
 await page.addScriptTag({content:source});
 await page.evaluate(()=>{window.fx=new JourneyEffects();window.state={revision:0,players:[{id:'one',name:'旅人',money:1500,position:0}],dice:[0,0],log:['開始']};fx.observe(state);if(!fx.startRoll()||fx.startRoll())throw Error('duplicate roll guard failed');state={...state,revision:1,dice:[2,5],players:[{id:'one',name:'旅人',money:1600,position:0}],log:['開始','旅人 のサイコロ: 2・5','旅の写真が入賞。€100 を受け取る。']};fx.observe(state);fx.observe(state);});
 await page.locator('.money-flight').waitFor();assert.equal(await page.locator('.money-flight').count(),1,'same revision must not replay money');
 await page.locator('.journey-card').waitFor();assert.equal(await page.locator('.journey-card').count(),1);
 assert.equal(await page.locator('.money-flight').textContent(),'+€100');
 await page.locator('.journey-card').click();assert.match(await page.locator('.journey-card strong').textContent(),/旅の写真/);
 await page.waitForFunction(()=>document.querySelector('#dice').getAttribute('aria-label').includes('合計 7'));
 assert.equal(await page.locator('.die').count(),2);
 assert.equal(await page.locator('.die-pip').count(),18);
 await page.evaluate(()=>{state={...state,revision:2,players:[{id:'one',name:'旅人',money:1550,position:0}],log:[...state.log,'旅人: 旅の費用 €50']};fx.observe(state);});
 await page.locator('.money-flight.negative').waitFor();assert.equal(await page.locator('.money-flight.negative').textContent(),'−€50');
 await page.locator('.journey-card').click();assert.equal(await page.locator('.journey-card').count(),0);
 await page.evaluate(()=>fx.reset());assert.equal(await page.locator('.journey-event').count(),0);assert.equal(await page.locator('.money-flight').count(),0);
 await page.close();
 }
 console.log('PASS visual feedback: actual dice result, duplicate revision/action guard, card tap reveal/dismiss, income/payment, reduced motion.');
}finally{await browser.close()}
