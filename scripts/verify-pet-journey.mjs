/** Real-user journey: three complete quiz runs fund evolution and an outfit.
 * BASE_URL=https://example.org/night-arcade/ node scripts/verify-pet-journey.mjs
 * No direct economy writes, seeded balances, or reward calls.
 */
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const project=new URL('../',import.meta.url),sandbox={};
vm.runInNewContext(await readFile(new URL('public/games/quiz-data.js',project),'utf8'),sandbox);
const answers=new Map(sandbox.QUIZ_DATA.map(q=>[q.question,q.answer]));
let server,browser;const base=(process.env.BASE_URL||'http://127.0.0.1:4190/').replace(/\/?$/,'/');
try{
 if(!process.env.BASE_URL){
  server=spawn(process.execPath,['server.mjs'],{cwd:project,env:{...process.env,PORT:'4190',HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
  await Promise.race([once(server.stdout,'data'),once(server,'exit').then(([code])=>{throw new Error('Server exited before startup: '+code)}),once(server,'error').then(([error])=>{throw error})]);
 }
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)errors.push(`${response.status()} ${response.url()}`)});
 await page.goto(base,{waitUntil:'networkidle'});
 assert.equal(await page.locator('#coins').textContent(),'0');
 assert.equal(await page.locator('#stage').textContent(),'たまご');
 await page.locator('a[href="games/quiz.html"]').click();
 await page.locator('#start').click();
 async function perfectRun(){
  const seen=new Set();
  for(let i=0;i<10;i++){
   const question=await page.locator('#question').textContent();assert.ok(!seen.has(question),'question repeats within run');seen.add(question);
   const answer=answers.get(question);assert.ok(answer,'question has verified answer');
   await page.locator('.choice').filter({has:page.locator('span',{hasText:answer})}).filter({hasText:answer}).first().click();
   assert.equal(await page.locator('#verdict').textContent(),'✓ 正解！');
   await page.locator('#next').click();
  }
  assert.equal(await page.locator('#finalScore').textContent(),'10');
  assert.match(await page.locator('#reward').textContent(),/40 コイン.*40 成長P/);
 }
 await perfectRun();await page.locator('#retry').click();await perfectRun();
 await page.locator('a[href="../index.html"]').click();
 assert.equal(await page.locator('#coins').textContent(),'80');assert.equal(await page.locator('#xp').textContent(),'80');
 await page.locator('#evolve').click();
 assert.equal(await page.locator('#coins').textContent(),'30');assert.equal(await page.locator('#xp').textContent(),'80');assert.equal(await page.locator('#stage').textContent(),'こども');
 assert.match(await page.locator('#notice').textContent(),/生まれました/);
 await page.locator('a[href="games/quiz.html"]').click();await page.locator('#start').click();await perfectRun();
 await page.locator('a[href="../index.html"]').click();assert.equal(await page.locator('#coins').textContent(),'70');assert.equal(await page.locator('#xp').textContent(),'120');
 await page.locator('#outfits-open').click();await page.locator('button[data-item="bow"]').click();
 assert.equal(await page.locator('#coins').textContent(),'35');assert.equal(await page.locator('button[data-item="bow"]').textContent(),'選択中');
 assert.match(await page.locator('#pet-art').getAttribute('aria-label'),/こども.*赤いリボン/);
 await page.reload({waitUntil:'networkidle'});
 assert.equal(await page.locator('#coins').textContent(),'35');assert.equal(await page.locator('#xp').textContent(),'120');assert.equal(await page.locator('#stage').textContent(),'こども');assert.match(await page.locator('#pet-art').getAttribute('aria-label'),/赤いリボン/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);
 await page.screenshot({path:new URL('artifacts/pet-journey-mobile.png',project).pathname,fullPage:true});
 console.log(`PASS actual pet journey at ${base}: 3 perfect quiz runs (30 UI answers) → 120 earned coins /120 XP; evolution spends50; bow spends35; balance35; child+bow persists reload; 390px no overflow; no JS/network errors.`);
}finally{await browser?.close();if(server&&!server.killed)server.kill('SIGTERM')}
