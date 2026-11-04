import {startFreshSolo} from './estate-test-solo.mjs';
import {acknowledgeReceipts} from './estate-test-confirmations.mjs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
const base=process.env.BASE_URL||'http://127.0.0.1:4197/night-arcade/';const server=process.env.BASE_URL?null:spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4197'},stdio:'pipe'});let browser;
try{
 if(server)await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no)});
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const width of [320,390]){
 const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await acknowledgeReceipts(page);await page.goto(new URL('estates/',base).href);await startFreshSolo(page);
 await page.locator('#my-deeds > summary').click();assert.match(await page.locator('.deeds-body').textContent(),/まだ所有地はありません/);
 await page.locator('[data-tile-id="37"]').click();await page.locator('#space-sheet').waitFor();assert.match(await page.locator('#space-sheet').textContent(),/タージ・マハル/);assert.match(await page.locator('#space-sheet').textContent(),/€350/);await page.locator('#space-sheet .deed-prices summary').click();assert.match(await page.locator('#space-sheet .rent-table').textContent(),/€1,500/);await page.locator('#space-sheet').screenshot({path:`artifacts/estates-deed-${width}.png`});await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement.dataset.tileId==='37');
 await page.locator('#space-directory summary').click();assert.equal(await page.locator('[data-space-id]').count(),40);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.getByRole('searchbox',{name:'マスの名前を検索'}).fill('アユタヤ');assert.equal(await page.locator('[data-space-id]:visible').count(),1);await page.locator('[data-space-id="1"]').click();assert.match(await page.locator('#space-sheet').textContent(),/€60/);await page.locator('#space-sheet .sheet-close').click();
 // Actual roll, purchase and inventory update; viewing a deed never buys it.
 assert.equal(await page.evaluate(()=>estateNetwork.state.players[0].money),1500);await page.evaluate(()=>{let i=0;Math.random=()=>++i%2?.01:.2});await page.getByRole('button',{name:'サイコロを振る',exact:true}).click();await page.getByRole('button',{name:/^購入 /}).click();await page.locator('[data-owned-id="3"]').waitFor();assert.match(await page.locator('#my-deeds > summary').textContent(),/所有地 1/);await page.locator('[data-owned-id="3"]').click();assert.match(await page.locator('#space-sheet').textContent(),/アヌラーダプラ/);await page.locator('#space-sheet .sheet-close').click();
 // Management is reachable from a deed, never a persistent action-bar control.
 assert.equal(await page.locator('.action-card #property-actions').count(),0);
 await page.locator('[data-owned-id="3"]').click();
 const money=await page.evaluate(()=>estateNetwork.state.players[0].money);
 await page.getByRole('button',{name:'抵当に入れる',exact:true}).click();
 await page.waitForFunction(()=>estateNetwork.state.properties[3].mortgaged);
 await page.getByRole('button',{name:'ターンを終了',exact:true}).waitFor({state:'visible'});
 await page.locator('[data-owned-id="3"]').click();
 await page.waitForFunction(()=>!document.querySelector('#property-actions button[aria-label="抵当を解除"]').disabled);
 assert.equal(await page.evaluate(()=>estateNetwork.state.players[0].money),money+30);
 await page.getByRole('button',{name:'抵当を解除',exact:true}).click();
 await page.waitForFunction(()=>!estateNetwork.state.properties[3].mortgaged);
 await page.locator('[data-owned-id="3"]').click();
 await page.waitForFunction(()=>!document.querySelector('#property-actions button[aria-label="この物件をトレード"]').disabled);
 await page.locator('#space-sheet').screenshot({path:`artifacts/estates-card-actions-${width}.png`});
 await page.getByRole('button',{name:'この物件をトレード',exact:true}).click();
 await page.locator('#trade-panel [name=give][value="3"]').waitFor({state:'visible'});
 assert(await page.locator('#trade-panel [name=give][value="3"]').isChecked());
 assert.equal(await page.evaluate(()=>estateNetwork.state.players[0].money),money-3);
 await page.locator('#trade-panel > summary').click();
 // Valid isolated fixtures exercise current tariffs and cross-property cache invalidation.
 await page.evaluate(()=>{const n=estateNetwork;n.state.properties[1].owner='human';n.state.revision++;n.emit();});await page.locator('#tile-select').selectOption('3');assert.match(await page.locator('#destination-photo .deed-prices dl').textContent(),/現在の利用料€8/);
 await page.evaluate(()=>{const n=estateNetwork;n.state.properties[3].houses=2;n.state.revision++;n.emit();});assert.match(await page.locator('#destination-photo .deed-prices dl').textContent(),/現在の利用料€60/);await page.locator('[data-tile-id="3"]').click();await page.locator('#space-sheet .deed-prices summary').click();
 await page.evaluate(()=>{const n=estateNetwork;n.state.properties[3].houses=0;n.state.properties[3].mortgaged=true;n.state.properties[5].owner='human';n.state.properties[15].owner='human';n.state.properties[12].owner='human';n.state.properties[28].owner='human';n.state.revision++;n.emit();});assert.match(await page.locator('#destination-photo .deed-prices dl').textContent(),/€0（抵当中）/);assert.match(await page.locator('#space-sheet .deed-prices dl').textContent(),/€0（抵当中）/);assert(await page.locator('#space-sheet .deed-prices details').evaluate(el=>el.open));await page.locator('#space-sheet .sheet-close').click();await page.locator('#tile-select').selectOption('5');assert.match(await page.locator('#destination-photo .deed-prices dl').textContent(),/現在の利用料€50/);await page.locator('#tile-select').selectOption('12');assert.match(await page.locator('#destination-photo .deed-prices dl').textContent(),/サイコロの合計 × 10/);await page.locator('#tile-select').selectOption('4');assert.match(await page.locator('#destination-photo').textContent(),/支払い€200/);assert.match(await page.locator('#destination-photo').textContent(),/購入できない/);
 // Full selected name must survive a CPU turn while the user inspects it.
 await page.locator('#tile-select').selectOption('37');await page.evaluate(()=>{const n=estateNetwork;n.state.turn=1;n.state.revision++;n.update();});assert.match(await page.locator('#selected-space-name').textContent(),/タージ/);await page.getByRole('button',{name:'現在地へ',exact:true}).click();assert.match(await page.locator('#selected-space-name').textContent(),/旅の出発点/);
 await page.reload();await startFreshSolo(page);await page.locator('#my-deeds > summary').click();
 // Actual chance escape draw using rules RNG, followed by use through visible UI.
 await page.evaluate(()=>{const v=[.01,.84,.34];Math.random=()=>v.shift()??.1});await page.getByRole('button',{name:'サイコロを振る',exact:true}).click();await page.locator('.journey-card').click();await page.locator('.journey-card').click();await page.locator('[data-held-type="chance"]').waitFor();assert.match(await page.locator('[data-held-type="chance"]').textContent(),/案内人の助け/);assert.equal(await page.evaluate(()=>estateNetwork.state.players[0].cards),1);assert.match(await page.locator('.held-use-hint').textContent(),/拘留中/);
 await page.evaluate(()=>{const n=estateNetwork;n.state.cardEvents=[];n.state.phase='roll';n.state.players[0].jail=3;n.state.players[0].position=10;n.state.revision++;n.emit();});await page.getByRole('button',{name:'釈放カードを使う',exact:true}).click();assert.equal(await page.locator('[data-held-type]').count(),0);assert.equal(await page.evaluate(()=>estateNetwork.state.players[0].cards),0);assert.equal(await page.evaluate(()=>estateNetwork.state.players[0].money),1500);
 await page.evaluate(()=>{const n=estateNetwork;n.state.players[0].heldCards=[{type:'chance',id:'escape'},{type:'chest',id:'escape'}];n.state.players[0].cards=2;for(const type of ['chance','chest'])n.state.decks[type].remaining=n.state.decks[type].remaining.filter(id=>id!=='escape');n.state.revision++;n.emit();});assert.equal(await page.locator('[data-held-type]').count(),2);assert.match(await page.locator('[data-held-type="chest"]').textContent(),/仲間からの紹介状/);for(let i=0;i<2&&(await page.locator('.journey-card').count());i++)await page.locator('.journey-card').click();await page.locator('#my-deeds').screenshot({path:`artifacts/estates-hand-${width}.png`});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS deeds320/390: tap full-name/prices/rent table modal+Escape focus; search40 names; actual purchase inventory; set/build/mortgage/station/utility/tax tariffs; pinned inspection; actual chance hold/use and distinct letter card.');
}finally{await browser?.close();server?.kill()}
