/**
 * Awesome NPU — page renderer (pure functions).
 * Reused by scripts/generate.mjs (writes files) and by the Astro site
 * (emits the same strings), so both produce byte-identical pages.
 */
import { products, mainProducts, dcProducts, I18N, EI18N, ENRICH, LANGS, PAGES_URL, REPO_URL, escHtml, vendorSlug, introHTML, docsHTML, DATA, template, usedKeys } from './catalog.mjs';

const vendorsN = new Set(products.map(p=>p.vendor)).size;
const countriesN = new Set(products.map(p=>p.country)).size;
const OGLOCALE = { en:'en_US', ko:'ko_KR', ja:'ja_JP', zh:'zh_CN', es:'es_ES', he:'he_IL' };
const HREFLANG_CODE = { en:'en', ko:'ko', ja:'ja', zh:'zh-Hans', es:'es', he:'he' };
const langPath = lang => lang==='en' ? PAGES_URL : `${PAGES_URL}${lang}/`;
const SEO_TITLE = {
  en:'Awesome NPU | NPU and AI accelerator list and comparison',
  ko:'NPU 목록, AI 가속기 비교 | Awesome NPU',
  ja:'NPU 一覧、AIアクセラレータ比較 | Awesome NPU',
  zh:'NPU 列表与 AI 加速器对比 | Awesome NPU',
  es:'Lista de NPU y comparación de aceleradores de IA | Awesome NPU',
  he:'רשימת NPU והשוואת מאיצי AI | Awesome NPU',
};
const seoDesc = lang => { const n=products.length; return ({
  en:`An interactive databook of ${n} NPUs and AI inference accelerators from ${vendorsN} vendors, spanning MCU-class chips to datacenter cards. Filter, sort and compare by TOPS, memory, power, price and release date.`,
  ko:`MCU급 칩부터 데이터센터 카드까지, NPU와 AI 추론 가속기 ${n}종을 성능(TOPS), 메모리, 전력, 가격으로 필터·정렬·비교할 수 있는 인터랙티브 데이터북입니다.`,
  ja:`MCUクラスのチップからデータセンターカードまで、NPUとAI推論アクセラレータ${n}種を性能(TOPS)、メモリ、消費電力、価格で絞り込み・並べ替え・比較できるインタラクティブなデータブック。`,
  zh:`从 MCU 级芯片到数据中心卡，收录 ${n} 款 NPU 与 AI 推理加速器，可按性能(TOPS)、内存、功耗、价格进行筛选、排序与对比的交互式数据手册。`,
  es:`Un databook interactivo de ${n} NPU y aceleradores de inferencia de IA, desde chips de clase MCU hasta tarjetas de datacenter. Filtra, ordena y compara por TOPS, memoria, consumo, precio y fecha.`,
  he:`ספר נתונים אינטראקטיבי של ${n} מעבדי NPU ומאיצי הסקת AI, משבבי MCU ועד כרטיסי מרכזי נתונים. סינון, מיון והשוואה לפי TOPS, זיכרון, צריכה ומחיר.`,
})[lang]; };
const seoKw = lang => {
  const base='NPU, AI accelerator, AI inference accelerator, edge AI, on-device AI, TinyML, TOPS, datacenter inference, LPU, Rebellions, FuriosaAI, DEEPX, Mobilint, Hailo, Coral, Ascend, TPU, Gaudi';
  const loc={ ko:'NPU 목록, NPU 비교, AI 가속기, NPU 종류, ', ja:'NPU 一覧, NPU 比較, AIアクセラレータ, ', zh:'NPU 列表, NPU 对比, AI 加速器, ', es:'lista de NPU, comparación de NPU, acelerador de IA, ', he:'רשימת NPU, השוואת NPU, מאיץ AI, ' }[lang]||'';
  return loc+base;
};
const HREFLANG = [`<link rel="alternate" hreflang="x-default" href="${PAGES_URL}">`]
  .concat(LANGS.map(l=>`<link rel="alternate" hreflang="${HREFLANG_CODE[l]}" href="${langPath(l)}">`)).join('\n');

// data-i18n 텍스트/속성을 대상 언어로 치환 → 정적 HTML 자체가 해당 언어가 됨(검색엔진/무JS 노출)
function localizeBody(html, L){
  html = html.replace(/(<[^>]*\sdata-i18n="([a-z_]+)"[^>]*>)([^<]*)(<\/)/g, (m,open,key,txt,close)=> L[key]!=null ? open+escHtml(L[key])+close : m);
  html = html.replace(/(\sdata-i18n-ph="([a-z_]+)"[^>]*\splaceholder=")([^"]*)(")/g, (m,pre,key,val,q)=> L[key]!=null ? pre+escHtml(L[key])+q : m);
  html = html.replace(/(\sdata-i18n-aria="([a-z_]+)"\s+aria-label=")([^"]*)(")/g, (m,pre,key,val,q)=> L[key]!=null ? pre+escHtml(L[key])+q : m);
  return html;
}
function ssrFor(lang){
  const T=I18N[lang];
  let regionDN; try{ regionDN=new Intl.DisplayNames([lang],{type:'region'}); }catch(e){ regionDN=null; }
  const cname=code=>{ try{ return (regionDN&&regionDN.of(code))||code; }catch(e){ return code; } };
  const mountL=m=>T['mount_'+String(m).toLowerCase().replace(/[^a-z0-9]/g,'')]||m;
  const ccS=p=>`<span class="cc" title="${escHtml(cname(p.country))}">${escHtml(p.country)}</span>`;
  const rowS=(p,i)=>{
    const perf=p.computeDisplay||'-'; const power=p.power||'-';
    const intg=p.standalone?'':` <span class="intg" data-tip="${escHtml(T.warn_integrated)}" role="img" aria-label="${escHtml(T.warn_integrated)}" tabindex="0">⚠</span>`;
    const price=p.priceDisplay==null?T.undisclosed:p.priceDisplay;
    const rel=p.releaseDisplay||T.unknown;
    const archTxt=p.arch&&p.arch.length?escHtml(p.arch.join(' · ')):'<span class="muted">-</span>';
    return `<tr data-id="${escHtml(p.id)}"><td class="sel"><input type="checkbox" class="rowchk" data-id="${escHtml(p.id)}" aria-label="${escHtml(p.product)}"></td>`+
      `<td class="idx">${String(i+1).padStart(2,'0')}</td>`+
      `<td class="prod"><a class="pn" href="${escHtml(p.page)}">${escHtml(p.product)}</a>${p.chip?`<div class="pchip">${escHtml(p.chip)}</div>`:''}</td>`+
      `<td class="muted"><a class="vn" href="${escHtml(p.vpage)}">${escHtml(p.vendor)}</a></td><td>${ccS(p)}</td>`+
      `<td class="arch">${archTxt}</td>`+
      `<td><span class="seg">${escHtml(mountL(p.formGroup))}</span>${intg}</td>`+
      `<td class="r"><span class="num">${escHtml(perf)}</span></td>`+
      `<td class="muted">${escHtml(p.memory||'-')}</td>`+
      `<td><span class="num">${escHtml(power)}</span></td>`+
      `<td class="r"><span class="num ${p.priceUSD!=null?'':'muted'}">${escHtml(price)}</span></td>`+
      `<td class="r"><span class="num ${p.releaseDate?'':'muted'}">${escHtml(rel)}</span></td></tr>`;
  };
  const headCell=(col,k,o)=>{ o=o||{}; const inter=o.sort||o.filter; const cls=[o.r?'r':'',inter?'thx':''].filter(Boolean).join(' ');
    const caret=inter?'<svg class="thc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m6 9 6 6 6-6"/></svg>':'';
    return `<th scope="col" data-col="${col}"${cls?` class="${cls}"`:''}><span class="thl">${escHtml(T[k])}</span>${caret}</th>`; };
  const THEAD=`<thead><tr><th class="sel"><input type="checkbox" class="selall" aria-label="${escHtml(T.a_selectall)}"></th><th scope="col"><span class="sr">#</span></th>`+
    headCell('product','col_product',{sort:1})+headCell('vendor','col_vendor',{sort:1,filter:1})+headCell('country','col_country',{filter:1})+
    headCell('arch','arch',{filter:1})+headCell('form','col_form',{filter:1})+
    headCell('perf','col_perf',{r:1,sort:1})+headCell('memory','col_memory',{})+headCell('power','col_power',{})+
    headCell('price','col_price',{r:1,sort:1})+headCell('release','col_release',{r:1,sort:1})+`</tr></thead>`;
  return {
    table:`<table class="db">${THEAD}<tbody>${products.map(rowS).join('')}</tbody></table>`,
    count:`<b>${products.length}</b> ${escHtml(T.w_products)}`,
    meta:`<span><b>${products.length}</b> ${escHtml(T.w_products)}</span><span><b>${vendorsN}</b> ${escHtml(T.w_vendors)}</span><span><b>${countriesN}</b> ${escHtml(T.w_countries)}</span>`,
  };
}
function jsonldFor(lang){
  const url=langPath(lang);
  return { '@context':'https://schema.org', '@graph':[
    { '@type':'WebSite', '@id':PAGES_URL+'#website', name:'Awesome NPU', url:PAGES_URL, inLanguage:lang, description:seoDesc(lang) },
    { '@type':'BreadcrumbList', '@id':url+'#breadcrumb', itemListElement:[{ '@type':'ListItem', position:1, name:'Awesome NPU', item:PAGES_URL }] },
    { '@type':['CollectionPage','ItemList'], '@id':url+'#catalog', name:SEO_TITLE[lang], url, inLanguage:lang, isPartOf:{ '@id':PAGES_URL+'#website' }, numberOfItems:products.length,
      itemListElement: products.map((p,i)=>({ '@type':'ListItem', position:i+1, item:{ '@type':'Product', '@id':p.page+'#product', name:p.product, url:p.page, sameAs:p.url, brand:{ '@type':'Brand', name:p.vendor }, category:({mcu:'MCU-class NPU',edge:'Edge NPU',datacenter:'Datacenter AI accelerator'}[p.segment]||'NPU') } })) }
  ] };
}

for (const ph of ['<!--__DATA__-->','<!--__META__-->','<!--__COUNT__-->','<!--__TABLE__-->','<!--__ABOUT__-->','<!--__DOCS__-->','<!--__HREFLANG__-->','__LANG__','__DIR__','__TITLE__','__DESC__','__CANONICAL__','__OGTITLE__','__OGLOCALE__','__KEYWORDS__'])
  if (!template.includes(ph)) { console.error(`template.html 자리표시자 누락: ${ph}`); process.exit(1); }
const DATA_JSON = JSON.stringify(DATA).replace(/</g,'\\u003c');
const I18N_JSON = JSON.stringify(I18N).replace(/</g,'\\u003c');

// 언어별 카탈로그 페이지(SPA) 전체 문서 문자열
export function renderCatalog(lang){
  const L = I18N[lang];
  const ssr = ssrFor(lang);
  const locked = lang !== 'en';
  const dataScript = `<script>window.DATA=${DATA_JSON};window.I18N=${I18N_JSON};window.__SSRLANG=${JSON.stringify(lang)};window.__LANGLOCK=${locked};</script>`;
  const ldScript = `<script type="application/ld+json">${JSON.stringify(jsonldFor(lang)).replace(/</g,'\\u003c')}</script>`;
  return localizeBody(template, L)
    .replace(/__LANG__/g, lang)
    .replace(/__DIR__/g, L._dir || 'ltr')
    .replace(/__TITLE__/g, escHtml(SEO_TITLE[lang]))
    .replace(/__OGTITLE__/g, escHtml(SEO_TITLE[lang]))
    .replace('__OGLOCALE__', OGLOCALE[lang])
    .replace(/__DESC__/g, escHtml(seoDesc(lang)))
    .replace('__KEYWORDS__', escHtml(seoKw(lang)))
    .replace(/__CANONICAL__/g, langPath(lang))
    .replace('<!--__HREFLANG__-->', HREFLANG)
    .replace('<!--__META__-->', ssr.meta)
    .replace('<!--__COUNT__-->', ssr.count)
    .replace('<!--__TABLE__-->', ssr.table)
    .replace('<!--__ABOUT__-->', introHTML)
    .replace('<!--__DOCS__-->', docsHTML)
    .replace('<!--__DATA__-->', dataScript + '\n' + ldScript);
}

// ---- 제품/벤더 상세 페이지 (내부 링크 + 원본 자료는 한 단계 더) ----
const TEN = I18N.en;
const regionEN2 = new Intl.DisplayNames(['en'],{type:'region'});
const cnEN = c => { try { return regionEN2.of(c)||c; } catch(e){ return c; } };
const EXTA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg>';
const detailCss = `:root{--sans:'Pretendard','Pretendard Variable',sans-serif}
:root[data-theme=dark]{--paper:#0c0b0a;--paper-2:#151311;--field:#1a1815;--ink:#ece7dd;--ink-2:rgba(236,231,221,.66);--ink-3:rgba(236,231,221,.58);--rule:rgba(236,231,221,.14);--rule-2:rgba(236,231,221,.30);--rule-3:rgba(236,231,221,.55);--spot:#ff5a3c;--wash:rgba(236,231,221,.04)}
:root[data-theme=light]{--paper:#f4f1ea;--paper-2:#eeeae1;--field:#ebe7dd;--ink:#17140f;--ink-2:rgba(23,20,15,.68);--ink-3:rgba(23,20,15,.64);--rule:rgba(23,20,15,.16);--rule-2:rgba(23,20,15,.32);--rule-3:rgba(23,20,15,.6);--spot:#d23a1f;--wash:rgba(23,20,15,.035)}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased;word-break:keep-all;overflow-wrap:break-word}
body::before{content:"";position:fixed;top:0;inset-inline:0;height:3px;background:var(--spot);z-index:100}
a{color:inherit;text-decoration:none}::selection{background:var(--spot);color:#fff}
.wrap{width:100%;max-width:920px;margin-inline:auto;padding-inline:clamp(16px,4vw,44px)}
.topbar{position:sticky;top:3px;z-index:60;background:var(--paper);border-bottom:1px solid var(--rule)}
.topbar-in{display:flex;align-items:center;height:52px;gap:14px}.wm{font-weight:800;font-size:15px;letter-spacing:-.01em}
.tb-r{margin-inline-start:auto;display:flex;align-items:center;gap:6px}
.dlang{appearance:none;background:none;border:1px solid var(--rule-2);color:var(--ink-2);font-size:12.5px;padding:6px 10px;cursor:pointer;font-family:inherit}
.ibtn{width:34px;height:34px;display:grid;place-items:center;color:var(--ink-2);background:none;border:none;cursor:pointer;font-size:16px}.ibtn:hover{color:var(--ink)}
.ibtn svg{width:17px;height:17px}
main{padding-block:clamp(28px,5vw,52px) 80px}
.bc{font-size:12.5px;color:var(--ink-3);margin-bottom:22px;display:flex;flex-wrap:wrap;gap:7px;align-items:center}
.bc a{color:var(--ink-2);border-bottom:1px solid var(--rule-2)}.bc a:hover{color:var(--spot)}.bc .sep{color:var(--rule-3)}
h1.dt{font-size:clamp(1.9rem,5vw,3rem);line-height:1.05;letter-spacing:-.03em;font-weight:800;margin:0;text-wrap:balance}
.dsub{margin:14px 0 0;font-size:13.5px;color:var(--ink-3)}
.darch{display:flex;flex-wrap:wrap;gap:7px;margin:22px 0 0;align-items:center}
.darch i{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);font-style:normal;margin-inline-end:3px}
.darch .at{font-size:12px;color:var(--ink-2);border:1px solid var(--rule-2);padding:3px 10px}
dl.dg{display:grid;grid-template-columns:minmax(120px,190px) 1fr;margin:30px 0 0;border-top:1px solid var(--rule-2)}
dl.dg dt{color:var(--ink-3);font-size:11.5px;letter-spacing:.04em;text-transform:uppercase;padding:13px 0;border-bottom:1px solid var(--rule)}
dl.dg dd{margin:0;color:var(--ink);padding:13px 0 13px 20px;border-bottom:1px solid var(--rule)}
dl.dg dd a{border-bottom:1px solid var(--spot)}dl.dg dd a:hover{color:var(--spot)}
.dnote{margin:26px 0 0;font-size:14px;color:var(--ink-2);line-height:1.72;max-width:72ch}
.dwarn{margin:16px 0 0;font-size:12.5px;color:var(--spot)}
.dcta{display:inline-flex;align-items:center;gap:9px;margin:34px 0 0;background:var(--spot);color:#fff;font-weight:650;font-size:14.5px;padding:14px 22px}
.dcta svg{width:15px;height:15px}.dcta:hover{filter:brightness(1.08)}
.rel{margin:56px 0 0;border-top:1px solid var(--rule-2);padding-top:26px}
.rel h2{font-size:11.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-3);margin:0 0 16px}
.relg{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,238px),1fr));border-top:1px solid var(--rule);border-inline-start:1px solid var(--rule)}
.relc{border-inline-end:1px solid var(--rule);border-block-end:1px solid var(--rule);padding:16px 18px}
.relc b{font-weight:650;font-size:14px;letter-spacing:-.01em}.relc:hover b{color:var(--spot)}.relc .rs{font-size:12px;color:var(--ink-3);margin-top:5px}
.back{display:inline-block;margin:44px 0 0;font-size:13px;color:var(--ink-2);border-bottom:1px solid var(--spot);padding-bottom:2px}.back:hover{color:var(--spot)}
footer{border-top:1px solid var(--rule-2)}.foot-in{padding-block:30px;font-size:12.5px;color:var(--ink-3)}.foot-in a{color:var(--ink-2);border-bottom:1px solid var(--rule-2)}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}`;

const FAVICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23d23a1f'/%3E%3Ctext x='16' y='23' font-family='Arial,Helvetica,sans-serif' font-size='21' font-weight='700' text-anchor='middle' fill='%23fff'%3EN%3C/text%3E%3C/svg%3E`;
const themeInit = `<script>(function(){try{var q=new URLSearchParams(location.search).get('theme');var s=localStorage.getItem('npu-theme');var t=(q==='light'||q==='dark')?q:(s||(matchMedia&&matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'));document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>`;
const detailScript = `<script>(function(){var I=window.I18N||{en:{}},P=window.__P||{},SUP=['ko','en','ja','zh','es','he'];function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}function det(){try{var q=new URLSearchParams(location.search).get('lang');if(q&&SUP.indexOf(q)>=0)return q;}catch(e){}try{var s=localStorage.getItem('npu-lang');if(s&&SUP.indexOf(s)>=0)return s;}catch(e){}var c=(navigator.languages&&navigator.languages.length)?navigator.languages:[navigator.language||'en'];for(var i=0;i<c.length;i++){var b=String(c[i]).toLowerCase().split('-')[0];if(b==='iw')b='he';if(b==='zh')return'zh';if(SUP.indexOf(b)>=0)return b;}return'en';}function ap(lang){var L=I[lang]||I.en;document.documentElement.lang=lang;document.documentElement.dir=(L._dir||'ltr');document.querySelectorAll('[data-i18n]').forEach(function(el){var k=el.getAttribute('data-i18n');if(L[k]!=null)el.textContent=L[k];});var nE=document.getElementById('d-note');if(nE&&P.noteI18n){var n=P.noteI18n[lang]||P.noteI18n.en||'';nE.textContent=n;nE.style.display=n?'':'none';}var sE=document.getElementById('d-specs');if(sE&&P.specsI18n){var rows=P.specsI18n[lang]||P.specsI18n.en||[];sE.innerHTML=rows.map(function(kv){return '<dt>'+esc(kv[0])+'</dt><dd>'+esc(kv[1])+'</dd>';}).join('');sE.parentNode&&(sE.style.display=rows.length?'':'none');}var cE=document.getElementById('d-country');if(cE&&P.country){try{cE.textContent=new Intl.DisplayNames([lang],{type:'region'}).of(P.country)||P.country;}catch(e){}}var sel=document.getElementById('dlang');if(sel)sel.value=lang;try{localStorage.setItem('npu-lang',lang);}catch(e){}}var sel=document.getElementById('dlang');if(sel){SUP.forEach(function(lg){var o=document.createElement('option');o.value=lg;o.textContent=(I[lg]&&I[lg]._name)||lg;sel.appendChild(o);});sel.onchange=function(e){ap(e.target.value);};}var tb=document.getElementById('dtheme');function st(t){document.documentElement.setAttribute('data-theme',t);if(tb)tb.innerHTML=t==='dark'?'&#9789;':'&#9728;';try{localStorage.setItem('npu-theme',t);}catch(e){}}if(tb){st(document.documentElement.getAttribute('data-theme')||'dark');tb.onclick=function(){st(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark');};}ap(det());})();</script>`;

function pageHead(title, desc, canonical, jsonld){
  return `<!DOCTYPE html><html lang="en" dir="ltr" data-theme="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"><meta name="color-scheme" content="dark light">`+
    `<link rel="icon" href="${FAVICON}"><title>${escHtml(title)}</title><meta name="description" content="${escHtml(desc)}"><meta name="robots" content="index, follow"><link rel="canonical" href="${canonical}">`+
    `<meta property="og:type" content="website"><meta property="og:site_name" content="Awesome NPU"><meta property="og:title" content="${escHtml(title)}"><meta property="og:description" content="${escHtml(desc)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${PAGES_URL}og.png">`+
    `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"><style>${detailCss}</style>${themeInit}`+
    `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g,'\\u003c')}</script></head><body>`;
}
function topbar(){
  return `<header class="topbar"><div class="wrap topbar-in"><a class="wm" href="${PAGES_URL}">Awesome NPU</a><div class="tb-r"><select id="dlang" class="dlang" aria-label="Language"></select><a class="ibtn" href="${REPO_URL}" target="_blank" rel="noopener" aria-label="GitHub"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.34 9.34 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"/></svg></a><button id="dtheme" class="ibtn" aria-label="Toggle theme"></button></div></div></header>`;
}
function footerH(){ return `<footer><div class="wrap foot-in"><a href="${PAGES_URL}" data-i18n="nav_products">Products</a> · <a href="${REPO_URL}" target="_blank" rel="noopener">GitHub ↗</a></div></footer>`; }

export const bySlugVendor = {}; products.forEach(p=>{ (bySlugVendor[p.vendor]=bySlugVendor[p.vendor]||[]).push(p); });

// 제품 상세 페이지 전체 문서
export function renderProduct(p){
  const seg = ({mcu:'MCU-class NPU',edge:'Edge NPU',datacenter:'Datacenter AI accelerator'}[p.segment]||'NPU');
  const title = `${p.product} (${p.vendor}) NPU specs | Awesome NPU`;
  const archTxt = (p.arch&&p.arch.length)?p.arch.join(', '):'';
  const desc = `${p.product} by ${p.vendor}: ${archTxt?archTxt+' ':''}NPU. ${p.computeDisplay&&p.computeDisplay!=='-'?p.computeDisplay+', ':''}${p.memory?p.memory+', ':''}${p.form}. Specs, supported architectures and the official source in the Awesome NPU databook.`.slice(0,300);
  const price = p.priceDisplay==null ? `<span data-i18n="undisclosed">${escHtml(TEN.undisclosed)}</span>` : escHtml(p.priceDisplay);
  const rel = p.releaseDisplay ? escHtml(p.releaseDisplay) : `<span data-i18n="unknown">${escHtml(TEN.unknown)}</span>`;
  const dgRow = (k,v) => `<dt data-i18n="${k}">${escHtml(TEN[k])}</dt><dd>${v}</dd>`;
  const mslug = String(p.formGroup||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const mountTxt = TEN['mount_'+mslug] || p.formGroup;
  const specsSSR = p.specsI18n.en.map(([k,v])=>`<dt>${escHtml(k)}</dt><dd>${escHtml(v)}</dd>`).join('');
  const warn = p.standalone ? '' : `<p class="dwarn" data-i18n="warn_integrated">${escHtml(TEN.warn_integrated)}</p>`;
  const archBlock = (p.arch&&p.arch.length)?`<div class="darch"><i data-i18n="arch">${escHtml(TEN.arch)}</i>${p.arch.map(a=>`<span class="at">${escHtml(a)}</span>`).join('')}</div>`:'';
  const related = (bySlugVendor[p.vendor]||[]).filter(q=>q.id!==p.id).slice(0,6);
  const relBlock = related.length?`<div class="rel"><h2 data-i18n="used_in">More from ${escHtml(p.vendor)}</h2><div class="relg">${related.map(q=>`<a class="relc" href="${q.page}"><b>${escHtml(q.product)}</b><div class="rs">${escHtml([q.form,q.computeDisplay!=='-'?q.computeDisplay:''].filter(Boolean).join(' / '))}</div></a>`).join('')}</div></div>`:'';
  const jsonld = { '@context':'https://schema.org','@graph':[
    { '@type':'Product', '@id':p.page+'#product', name:p.product, url:p.page, category:seg, brand:{'@type':'Brand',name:p.vendor}, sameAs:p.url, description:(p.noteI18n.en||desc) },
    { '@type':'BreadcrumbList', itemListElement:[
      {'@type':'ListItem',position:1,name:'Awesome NPU',item:PAGES_URL},
      {'@type':'ListItem',position:2,name:p.vendor,item:p.vpage},
      {'@type':'ListItem',position:3,name:p.product,item:p.page} ] } ] };
  const dataInj = `<script>window.I18N=${JSON.stringify(I18N).replace(/</g,'\\u003c')};window.__P=${JSON.stringify({country:p.country,noteI18n:p.noteI18n,specsI18n:p.specsI18n}).replace(/</g,'\\u003c')};</script>`;
  return pageHead(title, desc, p.page, jsonld)+topbar()+
    `<main class="wrap"><nav class="bc"><a href="${PAGES_URL}" data-i18n="nav_products">Products</a><span class="sep">/</span><a href="${p.vpage}">${escHtml(p.vendor)}</a><span class="sep">/</span><span>${escHtml(p.product)}</span></nav>`+
    `<h1 class="dt">${escHtml(p.product)}</h1><div class="dsub">${escHtml([p.vendor, cnEN(p.country), p.chip].filter(Boolean).join(' · '))}</div>${archBlock}`+
    `<dl class="dg">`+
      dgRow('col_vendor',`<a href="${p.vpage}">${escHtml(p.vendor)}</a>`)+
      `<dt data-i18n="col_country">${escHtml(TEN.col_country)}</dt><dd id="d-country">${escHtml(cnEN(p.country))}</dd>`+
      dgRow('col_form', `<span data-i18n="mount_${mslug}">${escHtml(mountTxt)}</span>`+(p.form&&p.form.toLowerCase().replace(/[^a-z0-9]/g,'')!==mslug?` <span style="color:var(--ink-3)">(${escHtml(p.form)})</span>`:'')+(p.standalone?'':' <span class="dwarn" style="margin:0" data-i18n="integrated">'+escHtml(TEN.integrated)+'</span>'))+
      dgRow('col_perf', escHtml(p.computeDisplay||'-'))+
      dgRow('col_memory', escHtml(p.memory||'-'))+
      dgRow('col_power', escHtml(p.power||'-'))+
      dgRow('col_price', price)+
      dgRow('col_release', rel)+
    `</dl>`+
    `<dl class="dg" id="d-specs"${p.specsI18n.en.length?'':' style="display:none"'}>${specsSSR}</dl>`+
    `<p class="dnote" id="d-note"${p.noteI18n.en?'':' style="display:none"'}>${escHtml(p.noteI18n.en)}</p>${warn}`+
    `<a class="dcta" href="${escHtml(p.url)}" target="_blank" rel="noopener"><span data-i18n="official_page">${escHtml(TEN.official_page||'Visit the official page')}</span>${EXTA}</a>`+
    relBlock+
    `<div><a class="back" href="${PAGES_URL}" data-i18n="back_catalog">${escHtml(TEN.back_catalog||'Back to the catalog')}</a></div>`+
    `</main>`+footerH()+dataInj+detailScript+`</body></html>`;
}

// 벤더 상세 페이지 전체 문서
export function renderVendor(vendor){
  const vslug = vendorSlug[vendor];
  const list = bySlugVendor[vendor]||[];
  const countries = [...new Set(list.map(p=>p.country))];
  const vpage = `${PAGES_URL}v/${vslug}/`;
  const title = `${vendor} NPUs and AI accelerators (${list.length}) | Awesome NPU`;
  const desc = `${vendor} NPU and AI inference accelerator products: ${list.slice(0,8).map(p=>p.product).join(', ')}. Specs, supported architectures and official sources in the Awesome NPU databook.`.slice(0,300);
  const jsonld = { '@context':'https://schema.org','@graph':[
    { '@type':'Brand', '@id':vpage+'#brand', name:vendor, url:vpage },
    { '@type':'BreadcrumbList', itemListElement:[
      {'@type':'ListItem',position:1,name:'Awesome NPU',item:PAGES_URL},
      {'@type':'ListItem',position:2,name:vendor,item:vpage} ] },
    { '@type':'ItemList', numberOfItems:list.length, itemListElement:list.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.product,url:p.page})) } ] };
  const dataInj = `<script>window.I18N=${JSON.stringify(I18N).replace(/</g,'\\u003c')};</script>`;
  const cards = list.map(p=>`<a class="relc" href="${p.page}"><b>${escHtml(p.product)}</b><div class="rs">${escHtml([p.form,p.computeDisplay!=='-'?p.computeDisplay:'',(p.arch&&p.arch.join(' · '))].filter(Boolean).join(' / '))}</div></a>`).join('');
  return pageHead(title, desc, vpage, jsonld)+topbar()+
    `<main class="wrap"><nav class="bc"><a href="${PAGES_URL}" data-i18n="nav_products">Products</a><span class="sep">/</span><span>${escHtml(vendor)}</span></nav>`+
    `<h1 class="dt">${escHtml(vendor)}</h1><div class="dsub">${escHtml(countries.map(cnEN).join(', '))} · <b>${list.length}</b> <span data-i18n="w_products">${escHtml(TEN.w_products)}</span></div>`+
    `<div class="rel" style="border:none;margin-top:34px;padding:0"><div class="relg">${cards}</div></div>`+
    `<div><a class="back" href="${PAGES_URL}" data-i18n="back_catalog">${escHtml(TEN.back_catalog||'Back to the catalog')}</a></div>`+
    `</main>`+footerH()+dataInj+detailScript+`</body></html>`;
}

// 사이트맵 (모든 언어 URL + hreflang 대체 + 제품/벤더 상세)
export function buildSitemap(today){
  const detailEntries = [
    {loc:`${PAGES_URL}trends/`, pr:'0.7'},
    ...Object.values(vendorSlug).map(s=>({loc:`${PAGES_URL}v/${s}/`, pr:'0.7'})),
    ...products.map(p=>({loc:p.page, pr:'0.6'})),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`+
    LANGS.map(lang=>{
      const alts = [`    <xhtml:link rel="alternate" hreflang="x-default" href="${PAGES_URL}"/>`]
        .concat(LANGS.map(l=>`    <xhtml:link rel="alternate" hreflang="${HREFLANG_CODE[l]}" href="${langPath(l)}"/>`)).join('\n');
      return `  <url>\n    <loc>${langPath(lang)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${lang==='en'?'1.0':'0.8'}</priority>\n${alts}\n  </url>`;
    }).join('\n')+'\n'+
    detailEntries.map(e=>`  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${e.pr}</priority>\n  </url>`).join('\n')+
    `\n</urlset>\n`;
}

export { products, mainProducts, dcProducts, vendorSlug, LANGS, ENRICH, usedKeys, langPath, PAGES_URL, REPO_URL, I18N,
  detailCss, detailScript, themeInit, FAVICON, topbar, footerH };
