import {startFreshSolo} from './estate-test-solo.mjs';
import {acknowledgeReceipts} from './estate-test-confirmations.mjs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
const base=process.env.BASE_URL||'http://127.0.0.1:4191/night-arcade/';const server=process.env.BASE_URL?null:spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4191'},stdio:'pipe'});let browser;
try{
 if(server)await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no)});browser=await chromium.launch({channel:'chrome',headless:true});
 for(const type of ['chance','chest']){
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await acknowledgeReceipts(page);await page.goto(new URL('estates/',base).href);await startFreshSolo(page);await page.evaluate(t=>{let i=0;const values=t==='chance'?[.2,.7,0]:[0,0,0];Math.random=()=>values[i++%values.length]},type);
 await page.getByRole('button',{name:'サイコロを振る',exact:true}).click();await page.locator(`[data-card-type="${type}"]`).waitFor();assert.equal(await page.evaluate(()=>estateNetwork.state.lastCard.type),type);assert.equal(await page.evaluate(()=>estateNetwork.state.players[0].money),1600);await page.locator('.journey-card').click();assert.match(await page.locator('.journey-card strong').textContent(),/€100/);assert.equal(await page.evaluate(t=>estateNetwork.state.decks[t].remaining.length,type),11);await page.locator('.journey-card').click();await page.locator('#last-card-result summary').click();assert.match(await page.locator('#last-card-result p').textContent(),type==='chance'?/チャンス：/:/手紙：/);assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS delivered UI: actual rolls land on chance/letter, distinct reveal cards, €100 applied once, finite deck11, persistent result details.');
}finally{await browser?.close();server?.kill()}
