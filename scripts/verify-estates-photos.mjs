import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {HERITAGE_MEDIA} from '../public/estates/heritage-media.js';
const base=process.env.BASE_URL||'http://127.0.0.1:4195/night-arcade/';const server=process.env.BASE_URL?null:spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4195'},stdio:'pipe'});let browser;
try{
 if(server)await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no)});
 browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))errors.push(r.url())});
 await page.goto(new URL('estates/',base).href);await page.waitForFunction(()=>document.querySelector('#entry-photo').naturalWidth>0);await page.locator('#solo').click();
 assert.equal(Object.keys(HERITAGE_MEDIA).length,22);
 for(const [id,photo]of Object.entries(HERITAGE_MEDIA)){
  await page.locator('#tile-select').selectOption(id);await page.locator('#destination-photo').scrollIntoViewIfNeeded();await page.waitForFunction(()=>{const i=document.querySelector('.destination-image');return i?.complete&&i.naturalWidth>0});assert.equal(await page.locator('.destination-image').getAttribute('alt'),photo.alt);assert.equal(await page.locator('.photo-credit a').first().getAttribute('href'),photo.source);if(photo.licenseUrl)assert.equal(await page.locator('.photo-credit a').last().getAttribute('href'),photo.licenseUrl);
 }
 await page.locator('#tile-select').selectOption('37');await page.locator('#destination-photo').screenshot({path:'artifacts/estates-destination.png'});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log('PASS all22 locally hosted heritage photos decode, selection updates, source/license links,390px fit.');
}finally{await browser?.close();server?.kill()}
