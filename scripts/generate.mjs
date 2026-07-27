#!/usr/bin/env node
/**
 * Awesome NPU — GitHub Pages writer.
 * Data lives in ./catalog.mjs, rendering in ./render.mjs. This script just
 * writes the rendered pages + sitemap to disk (the legacy static-deploy path).
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './catalog.mjs';
import { renderCatalog, renderProduct, renderVendor, buildSitemap,
  products, mainProducts, dcProducts, vendorSlug, LANGS, ENRICH, usedKeys } from './render.mjs';

let pageCount = 0;
for (const lang of LANGS){
  const outPath = lang === 'en' ? path.join(ROOT,'index.html') : path.join(ROOT, lang, 'index.html');
  fs.mkdirSync(path.dirname(outPath), { recursive:true });
  fs.writeFileSync(outPath, renderCatalog(lang));
  pageCount++;
}
for (const p of products){
  const dir = path.join(ROOT,'p',p.slug); fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'), renderProduct(p));
}
for (const vendor of Object.keys(vendorSlug)){
  const dir = path.join(ROOT,'v',vendorSlug[vendor]); fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'), renderVendor(vendor));
}
fs.writeFileSync(path.join(ROOT,'sitemap.xml'), buildSitemap(new Date().toISOString().slice(0,10)));

// 요약
const kr = products.filter(p=>p.origin==='kr').length;
const seg = k => products.filter(p=>p.segment===k).length;
console.log(`✓ 생성 완료: ${pageCount}개 언어 페이지 (index.html + ${LANGS.filter(l=>l!=='en').join('/')}/) + sitemap.xml`);
console.log(`  상세 페이지 ${products.length}개 제품 (/p/) + ${Object.keys(vendorSlug).length}개 벤더 (/v/)`);
console.log(`  제품 ${products.length}종 (Products ${mainProducts.length} + Datacenter ${dcProducts.length})`);
console.log(`  국내 ${kr} · 해외 ${products.length-kr}`);
console.log(`  데이터센터 ${seg('datacenter')} · 엣지 ${seg('edge')} · MCU ${seg('mcu')}`);
console.log(`  보강 병합 ${usedKeys.size}/${Object.keys(ENRICH).length}`);
