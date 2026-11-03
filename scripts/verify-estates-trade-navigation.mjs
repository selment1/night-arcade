import {startFreshSolo} from './estate-test-solo.mjs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
const base=process.env.BASE_URL||'http://127.0.0.1:4203/night-arcade/';
const server=process.env.BASE_URL?null:spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4203'},stdio:'pipe'});let browser;
try{
 if(server)await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no)});
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});
  await page.goto(new URL('estates/',base).href);await startFreshSolo(page);
  await page.locator('#tile-select').selectOption('37');
  await page.evaluate(async()=>{
   const n=estateNetwork;clearTimeout(n.timer);n.schedule=()=>{};
   const {act}=await import('./engine.js?v=trade-1');
   n.state.turn=1;n.state.properties[1].owner=n.state.players[1].id;n.state.properties[3].owner=n.id;
   const result=act(n.state,n.state.players[1].id,{type:'offerTrade',to:n.id,give:[1],take:[3],giveCash:0,takeCash:0});
   if(!result.ok)throw Error(result.error);n.state=result.state;n.emit();
  });
  const jump=page.getByRole('button',{name:'届いた交換の提案を見る',exact:true});
  await jump.waitFor();const before=await page.evaluate(()=>JSON.stringify(estateNetwork.state));
  await page.locator('#trade-panel summary').click(); // Navigation reopens a deliberately collapsed proposal.
  await jump.click();
  assert(await page.locator('#trade-panel').evaluate(el=>el.open));
  assert(await page.locator('#trade-panel summary').evaluate(el=>document.activeElement===el));
  assert(await page.locator('#trade-panel summary').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}));
  assert.equal(await page.evaluate(()=>JSON.stringify(estateNetwork.state)),before);
  assert.equal(await page.locator('#tile-select').inputValue(),'37');
  await page.getByRole('button',{name:'条件を変えて再提案',exact:true}).focus();
  await page.keyboard.press('Enter');
  assert(await page.locator('[name=trade-target]').evaluate(el=>document.activeElement===el),'Counter editor must receive keyboard focus');
  assert(await page.locator('[name=trade-target]').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}));
  await page.keyboard.press('Tab');
  assert(await page.locator('[name=give]').first().evaluate(el=>document.activeElement===el),'Tab must continue through the counter terms');
  await page.locator('[name=trade-cash]').fill('17');
  await page.evaluate(()=>estateNetwork.emit());await jump.click();
  assert.equal(await page.locator('[name=trade-cash]').inputValue(),'17');
  assert.equal(await page.evaluate(()=>JSON.stringify(estateNetwork.state)),before);
  await page.getByRole('button',{name:'条件変更をやめる',exact:true}).focus();
  await page.keyboard.press('Enter');
  assert(await page.getByRole('button',{name:'条件を変えて再提案',exact:true}).evaluate(el=>document.activeElement===el),'Cancelling edit must restore focus to counter button');
  assert.equal(await page.evaluate(()=>JSON.stringify(estateNetwork.state)),before);
  assert(await page.getByRole('button',{name:'条件を変えて再提案',exact:true}).evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}));
  await page.getByRole('button',{name:'見送る',exact:true}).click();assert.equal(await jump.count(),0);
  // A personal mortgage receipt must preserve an otherwise valid unsent proposal.
  await page.reload();await startFreshSolo(page);
  await page.evaluate(()=>{const n=estateNetwork;clearTimeout(n.timer);n.schedule=()=>{};for(const i of [1,5])n.state.properties[i].owner=n.id;n.state.properties[3].owner=n.state.players[1].id;n.emit();});
  await page.locator('#trade-panel summary').click();
  await page.locator('[name=give][value="1"]').check();await page.locator('[name=take][value="3"]').check();
  await page.locator('[name=cash-direction]').selectOption('receive');await page.locator('[name=trade-cash]').fill('17');
  const target=await page.locator('[name=trade-target]').inputValue();
  await page.locator('#tile-select').selectOption('5');await page.getByRole('button',{name:'抵当に入れる',exact:true}).click();
  await page.locator('.payment-sheet').waitFor();assert.match(await page.locator('.payment-sheet').textContent(),/\+€100/);await page.locator('.payment-confirm').click();
  assert.equal(await page.locator('[name=trade-target]').inputValue(),target);
  assert.equal(await page.locator('[name=trade-cash]').inputValue(),'17');assert.equal(await page.locator('[name=cash-direction]').inputValue(),'receive');
  assert(await page.locator('[name=give][value="1"]').isChecked());assert(await page.locator('[name=take][value="3"]').isChecked());
  // If a selected deed itself becomes ineligible, prune it without losing the other terms.
  await page.locator('#tile-select').selectOption('1');await page.getByRole('button',{name:'抵当に入れる',exact:true}).click();await page.locator('.payment-confirm').click();
  assert.equal(await page.locator('[name=give][value="1"]').count(),0);assert(await page.locator('[name=take][value="3"]').isChecked());assert.equal(await page.locator('[name=trade-cash]').inputValue(),'17');
  await page.getByRole('button',{name:'この条件を提案',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>({give:estateNetwork.state.trade.give,take:estateNetwork.state.trade.take,takeCash:estateNetwork.state.trade.takeCash})),{give:[],take:[3],takeCash:17});
  await page.getByRole('button',{name:'提案を取り下げる',exact:true}).click();assert.equal(await page.locator('[name=trade-cash]').inputValue(),'0');assert(!(await page.locator('[name=take][value="3"]').isChecked()));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.close();
 }
 console.log('PASS trade navigation320/390: explicit open/scroll/focus, unchanged state/inspection/counter draft, keyboard counter entry/Tab/cancel focus restoration, removed after rejection; personal receipt retains valid draft, prunes ineligible deeds, clears sent/cancelled proposal.');
}finally{await browser?.close();server?.kill()}
