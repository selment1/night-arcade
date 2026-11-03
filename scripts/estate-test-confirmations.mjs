// Legacy scenarios explicitly opt into a test-only user who acknowledges receipts.
// Confirmation timing/order/persistence is tested without this helper in estates-confirmation.
export async function acknowledgeReceipts(page){await page.addInitScript(()=>setInterval(()=>document.querySelector('.payment-confirm')?.click(),100));}
