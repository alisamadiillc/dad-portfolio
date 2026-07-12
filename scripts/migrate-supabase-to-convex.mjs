// One-time migration: Supabase rows + media -> Convex JSONL + R2.
// Usage: node scripts/migrate-supabase-to-convex.mjs
// Reads .env.local (VITE_SUPABASE_*, VITE_AGENCY_API_KEY); writes
// migration-out/<table>.jsonl ready for `npx convex import`.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { AgencyClient } from "@alisamadiillc/agency-api";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const SUPA = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY;
const agency = new AgencyClient(env.VITE_AGENCY_API_KEY);

const fetchTable = async (table) => {
  const r = await fetch(`${SUPA}/rest/v1/${table}?select=*`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  });
  if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
  return r.json();
};

// Re-upload a Supabase-hosted file to R2; returns the new public URL.
// Non-Supabase URLs (external CDNs) pass through untouched.
const rehost = async (url, path) => {
  if (!url || !url.includes(".supabase.co/storage/")) return url;
  const resp = await fetch(url);
  if (!resp.ok) {
    console.warn(`  ! fetch ${resp.status} for ${url} — keeping old URL`);
    return url;
  }
  const blob = await resp.blob();
  const name = decodeURIComponent(url.split("/").pop().split("?")[0]);
  const file = new File([blob], name, {
    type: blob.type || "application/octet-stream",
  });
  const { data, error } = await agency.uploads.upload(file, {
    path,
    naming: "uuid",
  });
  if (error) {
    console.warn(`  ! upload failed for ${url}:`, error.code ?? error);
    return url;
  }
  console.log(`  rehosted ${name} -> ${data.publicUrl}`);
  return data.publicUrl;
};

// Strip SQL identity columns, convert timestamps, drop nulls (Convex optional
// fields must be absent, not null).
const clean = (row, { keepCreatedAt = false } = {}) => {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || k === "id") continue;
    if (k === "created_at") {
      if (keepCreatedAt) out.created_at = Date.parse(v);
      continue;
    }
    if (k === "updated_at") {
      out.updated_at = Date.parse(v);
      continue;
    }
    out[k] = v;
  }
  out.updated_at ??= Date.now();
  return out;
};

mkdirSync("migration-out", { recursive: true });
const writeJsonl = (table, rows) => {
  writeFileSync(
    `migration-out/${table}.jsonl`,
    rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : "")
  );
  console.log(`${table}: ${rows.length} rows`);
};

const posts = await fetchTable("posts");
for (const p of posts) p.cover_image_url = await rehost(p.cover_image_url, "blog");
writeJsonl(
  "posts",
  posts.map((p) => clean(p, { keepCreatedAt: true }))
);

const projects = await fetchTable("projects");
for (const p of projects)
  p.cover_image_url = await rehost(p.cover_image_url, "projects");
writeJsonl("projects", projects.map((r) => clean(r)));

const experience = await fetchTable("experience");
writeJsonl("experience", experience.map((r) => clean(r)));

const skills = await fetchTable("skills");
writeJsonl("skills", skills.map((r) => clean(r)));

const settings = await fetchTable("site_settings");
for (const s of settings) s.avatar_url = await rehost(s.avatar_url, "avatar");
writeJsonl("site_settings", settings.map((r) => clean(r)));

console.log("\nDone. Import with:");
console.log(
  "  for t in posts projects experience skills site_settings; do npx convex import --table $t migration-out/$t.jsonl -y; done"
);
