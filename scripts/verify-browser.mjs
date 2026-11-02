import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
const external=process.env.BASE_URL;
const server=external?null:spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4186'},stdio:'pipe'});
const base=external||'http://127.0.0.1:4186/night-arcade/';
let browser;
try{
 if(server)await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Server exited '+code)))});
 browser=await chromium.launch({channel:'chrome',headless:true});
 const errors=[];
 await mkdir('artifacts',{recursive:true});
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:844},hasTouch:width<500,isMobile:width<500});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('.card').count(),5);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'home fits '+width);
  const box=await page.locator('.primary').boundingBox();assert(box.y+box.height<=844,'CTA above fold');
  if(width===390||width===1280)await page.screenshot({path:`artifacts/home-${width}.png`,fullPage:true});
  for(const game of ['echo','prism','memory','orbit','garden']){
   await page.goto(new URL('games/'+game+'.html',base).href);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),game+' fits '+width);
   assert.equal(await page.locator('h1').count(),1);
   if(width===390)await page.screenshot({path:`artifacts/${game}.png`,fullPage:true});
   const home=page.locator('a[href="../index.html"]');assert.equal(await home.count(),1);await home.click();assert.equal(await page.locator('.card').count(),5);
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: home + all 5 games at 320/390/1280px, home links, primary above fold, no JS errors');
}finally{await browser?.close();server?.kill()}
