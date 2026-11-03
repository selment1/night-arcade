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
 await page.locator('.journey-card').waitFor();assert.equal(await page.locator('.money-flight').count(),0,'no money before card reveal');
 await page.locator('.journey-card').click();assert.match(await page.locator('.journey-card strong').textContent(),/旅の写真/);await page.locator('.journey-card').click();
 await page.locator('.money-flight').waitFor();assert.equal(await page.locator('.money-flight').count(),1,'same revision must not replay money');assert.equal(await page.locator('.money-flight').textContent(),'+€100');await page.locator('.payment-confirm').click();
 await page.waitForFunction(()=>document.querySelector('#dice').getAttribute('aria-label').includes('合計 7'));
 assert.equal(await page.locator('.die').count(),2);
 assert.equal(await page.locator('.die-pip').count(),18);
 await page.evaluate(()=>{state={...state,revision:2,players:[{id:'one',name:'旅人',money:1550,position:0}],log:[...state.log,'旅人: 旅の費用 €50']};fx.observe(state);});
 await page.locator('.money-flight.negative').waitFor();assert.equal(await page.locator('.money-flight.negative').textContent(),'−€50');
 await page.locator('.payment-confirm').click();assert.equal(await page.locator('.journey-card').count(),0);
 await page.evaluate(()=>{state={...state,revision:3,cardEvents:[{type:'chest',title:'修繕通知',text:'家1軒につき €40 を支払う。',sequence:1}],log:[...state.log,'手紙を受領']};fx.observe(state);});await page.locator('.letter-card').waitFor();assert.match(await page.locator('.letter-card small').textContent(),/手紙/);await page.locator('.letter-card').click();assert.match(await page.locator('.letter-card strong').textContent(),/修繕通知.*€40/);await page.locator('.letter-card').click();await page.evaluate(()=>{state={...state,revision:4,cardEvents:[]};fx.observe(state);});assert.equal(await page.locator('.journey-card').count(),0);await page.evaluate(()=>fx.reset());assert.equal(await page.locator('.journey-event').count(),0);assert.equal(await page.locator('.money-flight').count(),0);
 await page.evaluate(()=>{fx.board=[{id:1,name:'アユタヤ',group:'earth'},{id:3,name:'アヌラーダプラ',group:'earth'}];state={revision:0,players:[{id:'one',name:'旅人',money:1500,position:0}],properties:{1:{owner:null,houses:0},3:{owner:null,houses:0}},phase:'roll',turn:0,dice:[0,0],log:[]};fx.observe(state);state=structuredClone(state);state.revision=1;state.properties[1].owner='one';fx.observe(state);});
 await page.waitForFunction(()=>document.querySelector('.collection-stamp')?.textContent.includes('旅の拠点'));
 await page.evaluate(()=>{state=structuredClone(state);state.revision=2;state.properties[3].owner='one';fx.observe(state);fx.observe(state);});await page.waitForFunction(()=>document.querySelector('.collection-stamp')?.textContent.includes('COLOR SET COMPLETE'));assert.equal(await page.locator('.collection-stamp').count(),1);
 await page.evaluate(()=>{state=structuredClone(state);state.revision=3;state.properties[3].houses=1;fx.observe(state);});await page.waitForFunction(()=>document.querySelector('.collection-stamp')?.textContent.includes('街が育ちました'));
 await page.evaluate(()=>{state=structuredClone(state);state.revision=4;state.phase='over';state.winner='one';fx.observe(state);});await page.waitForFunction(()=>document.querySelector('.collection-stamp')?.textContent.includes('旅のチャンピオン'));await page.evaluate(()=>fx.reset());assert.equal(await page.locator('.collection-stamp').count(),0);
 await page.close();
 }
 // Checkpoint prerequisite: only fully acknowledged presentations are exposed.
 for(const mode of ['normal','quick','reduced']){
 const page=await browser.newPage({reducedMotion:mode==='reduced'?'reduce':'no-preference'});
 await page.setContent('<section id="game"><p id="dice"></p></section>');
 const source=(await readFile(new URL('../public/estates/effects.js',import.meta.url),'utf8')).replace('export class JourneyEffects','window.JourneyEffects = class JourneyEffects');
 await page.addScriptTag({content:source});
 await page.evaluate(mode=>{
 window.acknowledgments=[];
 window.fx=new JourneyEffects({sound:{settings:{quick:mode==='quick'},play(){}},onAcknowledged:s=>{
 acknowledgments.push({revision:s.revision,previous:fx.previous.revision,queued:fx.queue.map(x=>x.revision),money:s.players[0].money});
 s.players[0].money=-999; // callback cannot mutate the retained snapshot
 }});
 window.state={revision:0,players:[{id:'one',name:'旅人',money:1500,position:0}],dice:[0,0],log:[]};
 fx.observe(state);state.players[0].money=-1;
 if(fx.acknowledgedState.players[0].money!==1500)throw Error('initial state was not detached');
 const snapshot=fx.acknowledgedState;snapshot.players[0].money=-2;
 if(fx.acknowledgedState.players[0].money!==1500)throw Error('accessor leaked mutable snapshot');
 state={...fx.acknowledgedState,revision:1,cardEvents:[{type:'chance',text:'€100 を受け取る'}],players:[{id:'one',name:'旅人',money:1600,position:0}]};
 fx.observe(state);
 fx.observe({...state,revision:2,cardEvents:[],players:[{id:'one',name:'旅人',money:1550,position:0}]});
 },mode);
 await page.locator('.journey-card').waitFor();
 assert.equal(await page.evaluate(()=>fx.acknowledgedState.revision),0,mode+': unopened card is not acknowledged');
 await page.locator('.journey-card').click();
 assert.equal(await page.evaluate(()=>fx.acknowledgedState.revision),0,mode+': reveal alone is not acknowledgment');
 await page.locator('.journey-card').click();await page.locator('.payment-sheet').waitFor();
 assert.equal(await page.evaluate(()=>fx.acknowledgedState.revision),0,mode+': pending payment is not acknowledged');
 await page.locator('.payment-confirm').click();
 assert.deepEqual(await page.evaluate(()=>acknowledgments[1]),{revision:1,previous:1,queued:[2],money:1600},mode+': acknowledge before advancing queue');
 await page.locator('.payment-sheet').waitFor();
 assert.equal(await page.evaluate(()=>fx.acknowledgedState.revision),1);
 await page.locator('.payment-confirm').click();
 assert.deepEqual(await page.evaluate(()=>acknowledgments.map(x=>x.revision)),[0,1,2]);
 await page.evaluate(()=>{
 fx.reset();if(fx.acknowledgedState!==null)throw Error('reset retained checkpoint');acknowledgments=[];
 state={revision:0,players:[{id:'one',name:'旅人',money:1500,position:0}],dice:[0,0],log:[]};fx.observe(state);
 // Plain zero-delay outcomes must serialize before the pending card.
 fx.observe({...state,revision:1});fx.observe({...state,revision:2});
 fx.observe({...state,revision:3,cardEvents:[{text:'まだ未確認'}]});
 if(!fx.busy||fx.previous.revision!==1||fx.queue.map(s=>s.revision).join(',')!=='2,3')throw Error('zero-delay presentation did not gate later revisions');
 });
 await page.locator('.journey-card').waitFor();
 assert.deepEqual(await page.evaluate(()=>acknowledgments.map(x=>x.revision)),[0,1,2],mode+': finish acknowledges captured state, not future previous');
 assert.equal(await page.evaluate(()=>fx.acknowledgedState.revision),2);
 assert.equal(await page.evaluate(()=>fx.busy),true,mode+': earlier zero-delay finish must not unlock unopened card');
 await page.evaluate(()=>fx.observe({...state,revision:4}));
 assert.deepEqual(await page.evaluate(()=>fx.queue.map(s=>s.revision)),[4],mode+': later revision waits for card acknowledgment');
 await page.locator('.journey-card').click();await page.locator('.journey-card').click();
 await page.waitForFunction(()=>fx.acknowledgedState.revision===4);
 assert.deepEqual(await page.evaluate(()=>acknowledgments.map(x=>x.revision)),[0,1,2,3,4]);
 assert.equal(await page.evaluate(()=>fx.busy),false,mode+': final presentation releases gate');
 await page.evaluate(()=>fx.reset());await page.close();
 }
 console.log('PASS visual feedback: actual dice result, duplicate revision/action guard, card tap reveal/dismiss, income/payment, reduced motion; detached acknowledged snapshots, initial/reset, queued pre-advance callback, unopened card/payment and zero-delay overlap across normal/quick/reduced modes.');
}finally{await browser.close()}
