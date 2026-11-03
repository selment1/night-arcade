// Legacy scenarios explicitly request a fresh game, including after reload.
// Persistence assertions live in verify-estates-solo-resume.mjs.
export async function startFreshSolo(page){
 await page.locator('#solo').click();
 await page.waitForFunction(()=>window.estateNetwork?.solo||document.getElementById('solo-resume')?.open);
 if(await page.locator('#solo-new').count())await page.locator('#solo-new').click();
 await page.waitForFunction(()=>window.estateNetwork?.solo);
}
