import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
const base=process.env.BASE_URL||'http://127.0.0.1:4256/night-arcade/';
const server=process.env.BASE_URL?null:spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4256'},stdio:'pipe'});let browser;
try{
 if(server)await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(new URL('estates/',base).href);await page.locator('#cpu-count').selectOption('3');await page.locator('#solo').click();
  // Isolate an expensive auction while retaining the real 1500ms CPU scheduler.
  await page.evaluate(()=>{const n=estateNetwork;n.state.phase='buy';n.state.pending={property:39};n.state.players[0].position=39;n.emit();});
  await page.getByRole('button',{name:'見送る → 競売',exact:true}).click();
  await page.waitForFunction(()=>estateNetwork.state.auction.highestBid===10);
  assert.equal(await page.locator('.bid-input').inputValue(),'20','pristine suggestion follows acknowledged bid');
  await page.locator('.bid-input').fill('300');await page.locator('.bid-input').focus();
  await page.evaluate(()=>{window.originalBid=document.querySelector('.bid-input');window.bidBlur=0;originalBid.addEventListener('blur',()=>bidBlur++);});
  await page.waitForFunction(()=>estateNetwork.state.auction.highestBid>=30);
  assert.deepEqual(await page.evaluate(()=>({same:originalBid===document.querySelector('.bid-input'),focused:document.activeElement===originalBid,blur:bidBlur,value:originalBid.value})),{same:true,focused:true,blur:0,value:'300'});
  assert.equal(await page.locator('.bid-input').getAttribute('min'),'31');
  assert.match(await page.locator('.journey-event').textContent(),/入札/,'ongoing auction remains visibly reported');
  // Pause scheduling for deterministic invalid-bid and same-property next-auction checks.
  await page.evaluate(()=>{clearTimeout(estateNetwork.timer);});
  await page.locator('.bid-input').fill('1');await page.getByRole('button',{name:'€ 入札',exact:true}).click();
  assert.equal(await page.locator('.bid-input').inputValue(),'1','failed bid retains the draft');
  assert.equal(await page.evaluate(()=>originalBid===document.querySelector('.bid-input')),true);
  await page.evaluate(()=>{const n=estateNetwork;n.state.phase='buy';n.state.auction=null;n.state.pending={property:39};n.emit();});
  assert.equal(await page.locator('.bid-input').count(),0);
  await page.getByRole('button',{name:'見送る → 競売',exact:true}).click();
  assert.equal(await page.locator('.bid-input').inputValue(),'10','new auction resets draft even on the same property');
  assert.equal(await page.evaluate(()=>originalBid===document.querySelector('.bid-input')),false);
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS auction UI: 320/390px, actual CPU updates preserve input node/focus/draft, pristine defaults and minimum update, failed bid retains draft, new auction resets.');
}finally{await browser?.close();server?.kill();}
