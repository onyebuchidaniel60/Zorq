import { chromium } from "@playwright/test";

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:1280px;height:720px;overflow:hidden;background:#eeeeef;color:#111;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
  .wrap{padding:54px 64px;height:100%;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between}
  .top{display:flex;align-items:center;justify-content:space-between}
  .brand{display:flex;align-items:center;gap:14px;font-size:24px;font-weight:700;letter-spacing:-.03em}
  .mark{width:46px;height:46px;border-radius:50%;background:#111;color:#fff;display:grid;place-items:center;font-size:20px}
  .chip{background:#dff3e6;color:#2d6a4a;border-radius:999px;padding:9px 16px;font-size:14px;font-weight:600}
  h1{font-size:46px;line-height:1.03;letter-spacing:-.05em;margin:24px 0 10px;max-width:960px}
  .sub{color:#6f6f74;font-size:17px;line-height:1.5}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:26px}
  .card{background:#fff;border-radius:24px;padding:18px 20px}
  .label{font-size:10px;text-transform:uppercase;letter-spacing:.18em;color:#8a8a8f;font-weight:600}
  .value{margin-top:7px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.45;word-break:break-all}
  .footer{display:flex;justify-content:space-between;color:#6f6f74;font-size:13px;border-top:1px solid #e3e3e5;padding-top:16px}
  .mint{color:#2d6a4a}
</style></head><body><div class="wrap">
  <div>
    <div class="top"><div class="brand"><span class="mark">Z</span>Zorq</div><span class="chip">Portaldot V3 testnet · chain 420420777</span></div>
    <h1>Execution-scoped authorization, proven at a round boundary.</h1>
    <p class="sub">Synthetic-data prototype · non-transferable DataLicense · one confirmed snapshot per FL round.</p>
    <div class="grid">
      <div class="card"><div class="label">Contract</div><div class="value">0xa9ab18d404e2cd19c23f30e7d78a740b562685ff</div></div>
      <div class="card"><div class="label">Deployment transaction</div><div class="value">0xb39268c84b4b62465531cd00659d20364c1ea8ed91cf4995d0fe03e5a02a1834 · block 337014</div></div>
      <div class="card"><div class="label">Demo run</div><div class="value">e18c1749-21f4-4cf4-b74a-2ed107f5d6cf · 3/3 rounds · final hash 0x1368046d…2caf</div></div>
      <div class="card"><div class="label">Revocation evidence</div><div class="value mint">token 3 revoked block 341655 → denied at snapshot block 341656</div></div>
    </div>
  </div>
  <div class="footer"><span>github.com/onyebuchidaniel60/Zorq</span><span>/docs · synthetic data only · no native FL/ZKP/HE claim</span></div>
</div></body></html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.setContent(html, { waitUntil: "load" });
await page.screenshot({ path: "docs/demo/raw/endcard.png" });
await browser.close();
console.log("endcard saved");
