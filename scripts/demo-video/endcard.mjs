import { chromium } from "@playwright/test";

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:1280px;height:720px;overflow:hidden;background:#efffd2;color:#f3f5ed;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
  .stage{box-sizing:border-box;width:1280px;height:720px;padding:18px;background:#efffd2}
  .frame{position:relative;box-sizing:border-box;height:100%;padding:42px 48px;border:1px solid rgba(10,11,9,.22);border-radius:28px;background:radial-gradient(circle at 80% 0%,rgba(217,255,99,.11),transparent 24rem),radial-gradient(rgba(255,255,255,.10) 1px,transparent 1px),#0a0b09;background-size:auto,18px 18px,auto;display:flex;flex-direction:column;justify-content:space-between}
  .top{display:flex;align-items:center;justify-content:space-between}
  .brand{display:flex;align-items:center;gap:14px;font-size:23px;font-weight:700;letter-spacing:-.04em}
  .mark{width:42px;height:42px;border-radius:11px;background:#d9ff63;color:#11140a;display:grid;place-items:center;font-size:18px;font-weight:800}
  .chip{border-radius:9px;background:#d9ff63;color:#11140a;padding:8px 14px;font-size:12px;font-weight:700}
  .eyebrow{color:#d9ff63;font-size:10px;font-weight:750;letter-spacing:.18em;text-transform:uppercase}
  h1{font-size:48px;line-height:1.02;letter-spacing:-.06em;margin:16px 0 0;max-width:980px;font-weight:600}
  h1 em{color:#d9ff63;font-style:normal}
  .sub{color:#9aa08f;font-size:15px;line-height:1.55;margin-top:12px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:26px}
  .card{border:1px solid rgba(255,255,255,.09);border-radius:16px;background:#11130f;padding:14px 16px}
  .card.lime{background:#d9ff63;border-color:rgba(17,20,10,.1);color:#11140a}
  .label{font-size:9px;font-weight:750;letter-spacing:.16em;text-transform:uppercase;color:#727969}
  .lime .label{color:rgba(17,20,10,.55)}
  .value{margin-top:7px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;line-height:1.45;word-break:break-all;color:#c9cec0}
  .lime .value{color:#11140a}
  .footer{display:flex;justify-content:space-between;gap:20px;border-top:1px solid rgba(255,255,255,.1);padding-top:15px;color:#727969;font-size:11px}
  .footer a{color:#d9ff63;text-decoration:none}
</style></head><body><div class="stage"><div class="frame">
  <div>
    <div class="top"><div class="brand"><span class="mark">Z</span>Zorq</div><span class="chip">Portaldot V3 testnet · chain 420420777</span></div>
    <p class="eyebrow" style="margin-top:28px">Execution evidence</p>
    <h1>Execution-scoped authorization, proven at a <em>round boundary</em>.</h1>
    <p class="sub">Synthetic-data prototype · non-transferable DataLicense · one confirmed snapshot per federated round.</p>
    <div class="grid">
      <div class="card"><div class="label">Contract</div><div class="value">0xa9ab18d404e2cd19c23f30e7d78a740b562685ff</div></div>
      <div class="card"><div class="label">Deployment transaction</div><div class="value">0xb39268c84b4b62465531cd00659d20364c1ea8ed91cf4995d0fe03e5a02a1834 · block 337014</div></div>
      <div class="card"><div class="label">Demo run</div><div class="value">e18c1749-21f4-4cf4-b74a-2ed107f5d6cf · 3/3 rounds · final hash 0x1368046d…2caf</div></div>
      <div class="card lime"><div class="label">Revocation evidence</div><div class="value">token 3 revoked block 341655 → denied at snapshot block 341656</div></div>
    </div>
  </div>
  <div class="footer"><span>github.com/onyebuchidaniel60/Zorq</span><span>/docs · synthetic data only · no native FL/ZKP/HE claim</span></div>
</div></div></body></html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.setContent(html, { waitUntil: "load" });
await page.screenshot({ path: "docs/demo/raw/endcard.png" });
await browser.close();
console.log("endcard saved");
