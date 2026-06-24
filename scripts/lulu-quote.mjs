#!/usr/bin/env node
// Lulu Print API probe: OAuth token, then print+shipping cost for a booklet to a destination.
// Usage:
//   node scripts/lulu-quote.mjs token                                  # sanity-check auth
//   node scripts/lulu-quote.mjs ship <podPackageId> <pages> <country>  # list shipping levels+costs
//   node scripts/lulu-quote.mjs cost <podPackageId> <pages> <country> [level]   # full quote
//   node scripts/lulu-quote.mjs landed <podPackageId> <pages>          # cheapest landed to US/GB/DE/HR
//
// Reads LULU_CLIENT_KEY / LULU_CLIENT_SECRET from .env.local (or environment).
// pod_package_id format: [Trim].[Ink].[Quality].[Bind].[Paper].[Finish]
//   default guess: A5 full-color saddle-stitch 60# uncoated white, gloss cover

import { readFileSync } from 'node:fs';

function loadEnv() {
  const out = { ...process.env };
  try {
    const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    for (const line of env.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (m) out[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
  return out;
}
const ENV = loadEnv();
const KEY = ENV.LULU_CLIENT_KEY, SECRET = ENV.LULU_CLIENT_SECRET;
if (!KEY || !SECRET) { console.error('Missing LULU_CLIENT_KEY / LULU_CLIENT_SECRET (set in .env.local).'); process.exit(1); }

const BASE = 'https://api.lulu.com';
const DEFAULT_POD = '0583X0827.FC.STD.SS.060UW444.GXX'; // A5 full-color saddle-stitch uncoated

async function token() {
  const basic = Buffer.from(`${KEY}:${SECRET}`).toString('base64');
  const res = await fetch(`${BASE}/auth/realms/glasstree/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${basic}` },
    body: 'grant_type=client_credentials',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) { console.error('TOKEN ERROR', res.status, JSON.stringify(body)); process.exit(1); }
  return body.access_token;
}

async function api(path, opts = {}, tok) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { ok: res.ok, status: res.status, body };
}

const ADDR = {
  US: { name: 'Test', street1: '350 5th Ave', city: 'New York', state_code: 'NY', postcode: '10118', country_code: 'US', phone_number: '2125551234' },
  GB: { name: 'Test', street1: '1 Newgate St', city: 'London', postcode: 'EC1A 1BB', country_code: 'GB', phone_number: '2079460000' },
  DE: { name: 'Test', street1: 'Torstrasse 1', city: 'Berlin', postcode: '10115', country_code: 'DE', phone_number: '+4930221520' },
  HR: { name: 'Test', street1: 'Korzo 1', city: 'Rijeka', postcode: '51000', country_code: 'HR', phone_number: '51200000' },
};

function costBody(pod, pages, country, level) {
  return {
    line_items: [{ page_count: Number(pages), pod_package_id: pod, quantity: 1 }],
    shipping_address: ADDR[country] || ADDR.US,
    shipping_level: level,
  };
}

const [cmd, ...a] = process.argv.slice(2);
const tok = await token();

if (cmd === 'token') {
  console.log('OK — token acquired (', tok.slice(0, 24), '...)');
}

else if (cmd === 'ship') {
  const [pod = DEFAULT_POD, pages = '20', country = 'US'] = a;
  const r = await api(`/print-shipping-options/?country_code=${country}&currency=USD&page_count=${pages}&pod_package_id=${pod}&quantity=1`, {}, tok);
  console.log(r.status, JSON.stringify(r.body, null, 2));
}

else if (cmd === 'cost') {
  const [pod = DEFAULT_POD, pages = '20', country = 'US', level = 'MAIL'] = a;
  const r = await api('/print-job-cost-calculations/', { method: 'POST', body: JSON.stringify(costBody(pod, pages, country, level)) }, tok);
  console.log(r.status, JSON.stringify(r.body, null, 2));
}

else if (cmd === 'landed') {
  const [pod = DEFAULT_POD, pages = '20'] = a;
  console.log(`pod_package_id: ${pod}  pages: ${pages}\n`);
  for (const country of ['US', 'GB', 'DE', 'HR']) {
    let printed = false;
    for (const level of ['MAIL', 'PRIORITY_MAIL', 'GROUND']) {
      const r = await api('/print-job-cost-calculations/', { method: 'POST', body: JSON.stringify(costBody(pod, pages, country, level)) }, tok);
      if (r.ok) {
        const b = r.body;
        const print = b.line_item_costs?.[0]?.total_cost_incl_tax ?? b.line_item_costs?.[0]?.total_cost_excl_tax;
        const ship = b.shipping_cost?.total_cost_incl_tax ?? b.shipping_cost?.total_cost_excl_tax;
        console.log(`${country}: print ${print} + ship ${ship} (${level}) = LANDED ${b.total_cost_incl_tax} ${b.currency}`);
        printed = true;
        break;
      } else if (level === 'GROUND') {
        console.log(`${country}: ERROR ${r.status} ${JSON.stringify(r.body).slice(0, 300)}`);
      }
    }
  }
}

else {
  console.error('Unknown command. See header for usage.');
  process.exit(1);
}
