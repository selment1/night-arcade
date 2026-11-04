import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../build/original-art/Web');
const manifest=JSON.parse(await fs.readFile(path.join(root,'ART-PROVENANCE.json'),'utf8'));
const server=http.createServer(async(req,res)=>{
 try {const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}const bytes=await fs.readFile(file);res.setHeader('content-type',file.endsWith('.js')?'text/javascript':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.css')?'text/css':'text/html');res.end(bytes);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 for(const width of [320,390]){
  const context=await browser.newContext({viewport:{width,height:844}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/estates/');await page.waitForFunction(()=>typeof document.querySelector('#solo').onclick==='function');
  await page.getByRole('button',{name:'CPUと遊ぶ（1人プレイ）',exact:true}).click();
  await page.waitForSelector('#board button');
  for(const {id} of manifest.assets){
   await page.locator(`#board [data-tile-id="${id}"]`).click();
   // Tile taps open the detail dialog; the destination below is independently rendered.
   const dialog=page.locator('dialog[open]');if(await dialog.count())await page.keyboard.press('Escape');
   await page.waitForFunction(id=>{const r=document.querySelector('#destination-photo'),img=r.querySelector('img');return r.dataset.destinationId===id&&img?.complete&&img.naturalWidth>0;},id);
   assert.match(await page.locator('#destination-photo img').getAttribute('src'),/\/art\/\d+\.svg$/);
   assert.match(await page.locator('#destination-photo .destination-caption').innerText(),/現地写真ではありません/);
   assert.ok((await page.locator('#destination-photo .heritage-description').innerText()).length>12);
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('#destination-photo .destination-image').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.resolve(root,'../original-art-'+width+'.png'),fullPage:false});
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS: 22/22 original-art cards at 320/390, captions, descriptions, CPU start, no runtime errors/overflow.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
