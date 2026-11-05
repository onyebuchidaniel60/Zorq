import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const requiredRouteFiles = [
  "src/app/page.tsx",
  "src/app/docs/page.tsx",
  "src/app/privacy/page.tsx",
  "src/app/terms/page.tsx",
  "src/app/support/page.tsx",
  "src/app/app/page.tsx",
  "src/app/app/assets/page.tsx",
  "src/app/app/assets/new/page.tsx",
  "src/app/app/assets/[assetId]/page.tsx",
  "src/app/app/jobs/page.tsx",
  "src/app/app/jobs/new/page.tsx",
  "src/app/app/jobs/[jobId]/page.tsx",
  "src/app/app/licenses/page.tsx",
  "src/app/app/licenses/[licenseId]/page.tsx",
  "src/app/app/runs/[runId]/page.tsx",
  "src/app/api/health/route.ts",
  "src/app/api/ready/route.ts",
  "src/app/api/auth/nonce/route.ts",
  "src/app/api/auth/verify/route.ts",
  "src/app/api/auth/me/route.ts",
  "src/app/api/auth/logout/route.ts",
  "src/app/not-found.tsx",
  "src/app/error.tsx",
  "src/app/icon.svg",
];

test("all agreed routes and shell files exist", () => {
  for (const file of requiredRouteFiles) {
    assert.ok(existsSync(path.join(root, file)), `missing ${file}`);
  }
});

test("root metadata keeps preview deployments out of search indexes", () => {
  const layout = readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");
  assert.match(layout, /index:\s*false/);
  assert.match(layout, /follow:\s*false/);
});

test("unfinished forms are disabled rather than inert", () => {
  for (const file of ["src/app/app/assets/new/page.tsx", "src/app/app/jobs/new/page.tsx"]) {
    const content = readFileSync(path.join(root, file), "utf8");
    assert.match(content, /<fieldset disabled/);
    assert.match(content, /Phase 3/);
  }
});

test("health endpoint does not import database or secret modules", () => {
  const health = readFileSync(path.join(root, "src/app/api/health/route.ts"), "utf8");
  assert.doesNotMatch(health, /DATABASE_URL|process\.env/);
});
