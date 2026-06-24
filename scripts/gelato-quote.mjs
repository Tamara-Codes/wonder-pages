#!/usr/bin/env node
// Gelato API probe: discover the booklet product, then quote print+shipping to a destination.
// Usage:
//   node scripts/gelato-quote.mjs catalogs            # list all catalogs
//   node scripts/gelato-quote.mjs catalog <uid>       # show one catalog's attributes
//   node scripts/gelato-quote.mjs search <uid>        # search products in a catalog
//   node scripts/gelato-quote.mjs prices <productUid> [pages] [country] [currency]
//   node scripts/gelato-quote.mjs quote <productUid> [pages] [country]
//
// Reads GELATO_API_KEY from .env.local (or the environment).

import { readFileSync } from 'node:fs';

function loadKey() {
  if (process.env.GELATO_API_KEY) return process.env.GELATO_API_KEY;
  try {
    const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    const m = env.match(/^\s*GELATO_API_KEY\s*=\s*(.+?)\s*$/m);
    if (m) return m[1].replace(/^["']|["']$/g, '');
  } catch {}
  console.error('Missing GELATO_API_KEY (set it in .env.local or the environment).');
  process.exit(1);
}

const KEY = loadKey();
const PRODUCT = 'https://product.gelatoapis.com';
const ORDER = 'https://order.gelatoapis.com';

async function api(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { 'X-API-KEY': KEY, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) {
    console.error(`HTTP ${res.status} ${url}`);
    console.error(typeof body === 'string' ? body : JSON.stringify(body, null, 2));
    process.exit(1);
  }
  return body;
}

const [cmd, ...args] = process.argv.slice(2);

if (cmd === 'catalogs' || !cmd) {
  const data = await api(`${PRODUCT}/v3/catalogs`);
  const list = data.data || data;
  for (const c of list) console.log(`${c.catalogUid.padEnd(28)}  ${c.title}`);
  console.log(`\n(${list.length} catalogs) — next: node scripts/gelato-quote.mjs catalog <catalogUid>`);
}

else if (cmd === 'catalog') {
  const data = await api(`${PRODUCT}/v3/catalogs/${args[0]}`);
  console.log(JSON.stringify(data, null, 2));
}

else if (cmd === 'search') {
  // args: <catalogUid> <format> <binding>
  const [catalog, format = 'A5', binding = 'stitched-left'] = args;
  const data = await api(`${PRODUCT}/v3/catalogs/${catalog}/products:search`, {
    method: 'POST',
    body: JSON.stringify({
      attributeFilters: { PaperFormat: [format], BindingType: [binding] },
      limit: 20,
    }),
  });
  const hits = data.products || data.data || [];
  for (const p of hits) console.log(p.productUid);
  console.log(`\n(${hits.length} products shown of ${data.hits?.total ?? '?'})`);
}

else if (cmd === 'prices') {
  const [productUid, pages = '20', country = 'HR', currency = 'EUR'] = args;
  const url = `${PRODUCT}/v3/products/${productUid}/prices?country=${country}&currency=${currency}&pageCount=${pages}`;
  console.log(JSON.stringify(await api(url), null, 2));
}

else if (cmd === 'quote') {
  const [productUid, pages = '20', country = 'HR'] = args;
  const addr = {
    HR: { country: 'HR', city: 'Rijeka', postCode: '51000', addressLine1: 'Korzo 1', stateCode: '' },
    US: { country: 'US', city: 'New York', postCode: '10001', addressLine1: '350 5th Ave', stateCode: 'NY' },
    GB: { country: 'GB', city: 'London', postCode: 'EC1A 1BB', addressLine1: '1 Newgate St', stateCode: '' },
    DE: { country: 'DE', city: 'Berlin', postCode: '10115', addressLine1: 'Torstrasse 1', stateCode: '' },
  }[country] || { country, city: 'City', postCode: '10000', addressLine1: '1 Main St', stateCode: '' };
  const body = {
    orderReferenceId: 'probe-1',
    customerReferenceId: 'probe',
    currency: 'EUR',
    allowMultipleQuotes: true,
    recipient: { firstName: 'Test', lastName: 'Recipient', email: 'test@example.com', ...addr },
    products: [{
      itemReferenceId: 'item-1',
      productUid,
      pageCount: Number(pages),
      files: [{ type: 'default', url: 'https://example.com/placeholder.pdf' }],
      quantity: 1,
    }],
  };
  const data = await api(`${ORDER}/v4/orders:quote`, { method: 'POST', body: JSON.stringify(body) });
  console.log(JSON.stringify(data, null, 2));
}

else {
  console.error('Unknown command. See header of this file for usage.');
  process.exit(1);
}
