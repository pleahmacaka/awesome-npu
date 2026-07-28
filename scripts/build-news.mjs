// Build-time Google News snapshot.
//
// The browser needs a CORS proxy to read Google News RSS, and public proxies
// are unreliable (they die, get rate-limited or paywalled). A build step has
// no CORS restriction, so here we fetch the feeds directly from Node and write
// a same-origin JSON snapshot per (language x keyword). The site loads that
// snapshot as its reliable floor and still tries live proxy refresh on top.
//
// Resilient by design: if a feed fetch fails, any previously committed
// snapshot for that combo is kept as the fallback rather than overwritten.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dir, '..', 'public', 'news');

const LOCALE = {
  ko: { hl: 'ko', gl: 'KR', ceid: 'KR:ko' },
  en: { hl: 'en-US', gl: 'US', ceid: 'US:en' },
  ja: { hl: 'ja', gl: 'JP', ceid: 'JP:ja' },
  zh: { hl: 'zh-CN', gl: 'CN', ceid: 'CN:zh-Hans' },
  es: { hl: 'es', gl: 'ES', ceid: 'ES:es' },
  he: { hl: 'he', gl: 'IL', ceid: 'IL:he' },
};
// Keep in sync with NEWS_KWS in public/app.js
const KWS = [
  { id: 'all', q: 'NPU OR "AI accelerator" OR "neural processing unit" OR TPU' },
  { id: 'npu', q: 'NPU "neural processing unit"' },
  { id: 'accel', q: '"AI accelerator" OR "inference accelerator"' },
  { id: 'edge', q: '"edge AI" OR "on-device AI"' },
  { id: 'tpu', q: 'TPU OR "tensor processing unit"' },
  { id: 'datacenter', q: '"AI chip" datacenter inference accelerator' },
];

function rssUrl(kw, lang) {
  const loc = LOCALE[lang] || LOCALE.en;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(kw.q)}&hl=${loc.hl}&gl=${loc.gl}&ceid=${encodeURIComponent(loc.ceid)}`;
}

function decode(s) {
  return String(s == null ? '' : s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#([0-9]+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, '&')
    .trim();
}

function parse(xml) {
  const items = [];
  for (const m of String(xml).matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/g)) {
    const b = m[1];
    const pick = (t) => {
      const r = b.match(new RegExp(`<${t}\\b[^>]*>([\\s\\S]*?)</${t}>`, 'i'));
      return r ? decode(r[1]) : '';
    };
    const title = pick('title');
    if (!title) continue;
    items.push({ title, link: pick('link'), pub: pick('pubDate'), src: pick('source') });
  }
  return items.slice(0, 24);
}

async function fetchFeed(kw, lang) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(rssUrl(kw, lang), {
      signal: ctrl.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; awesome-npu-newsbot/1.0)' },
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const items = parse(await r.text());
    if (!items.length) throw new Error('no items');
    return items;
  } finally {
    clearTimeout(to);
  }
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const jobs = [];
  for (const lang of Object.keys(LOCALE)) {
    for (const kw of KWS) jobs.push({ lang, kw });
  }
  let ok = 0, kept = 0, empty = 0;
  const CONCURRENCY = 6;
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    await Promise.all(jobs.slice(i, i + CONCURRENCY).map(async ({ lang, kw }) => {
      const file = path.join(OUT, `${lang}-${kw.id}.json`);
      try {
        const items = await fetchFeed(kw, lang);
        fs.writeFileSync(file, JSON.stringify({ t: Date.now(), items }));
        ok++;
      } catch (e) {
        if (fs.existsSync(file)) {
          kept++; // keep the previously committed snapshot as fallback
        } else {
          fs.writeFileSync(file, JSON.stringify({ t: Date.now(), items: [] }));
          empty++;
        }
        console.warn(`[news] ${lang}-${kw.id} failed (${e.message}); ${fs.existsSync(file) ? 'kept fallback' : 'wrote empty'}`);
      }
    }));
  }
  console.log(`[news] baked ${ok} fresh, kept ${kept} fallback, ${empty} empty -> ${path.relative(process.cwd(), OUT)}`);
}

run().catch((e) => { console.error('[news] build-news failed:', e); /* never fail the site build */ });
