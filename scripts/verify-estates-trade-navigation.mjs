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
  await page.goto(new URL('estates/',base).href);await page.locator('#solo').click();
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
  await page.getByRole('button',{name:'条件を変えて再提案',exact:true}).click();
  await page.locator('[name=trade-cash]').fill('17');
  await page.evaluate(()=>estateNetwork.emit());await jump.click();
  assert.equal(await page.locator('[name=trade-cash]').inputValue(),'17');
  assert.equal(await page.evaluate(()=>JSON.stringify(estateNetwork.state)),before);
  await page.getByRole('button',{name:'条件変更をやめる',exact:true}).click();
  await page.getByRole('button',{name:'見送る',exact:true}).click();assert.equal(await jump.count(),0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.close();
 }
 console.log('PASS trade navigation320/390: explicit open/scroll/focus, unchanged state/inspection/counter draft, removed after rejection.');
}finally{await browser?.close();server?.kill()}
