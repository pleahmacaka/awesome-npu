(function(){
  const DATA = window.DATA || { products:[], repo:"" };
  const I18N = window.I18N || { en:{} };
  const products = DATA.products;
  const $ = id => document.getElementById(id);
  const esc = s => String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const SUPPORTED = ["ko","en","ja","zh","es","he"];
  const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches);

  let curLang = "en", L = I18N.en, regionDN = null;
  function setRegionDN(lang){ try{ regionDN = new Intl.DisplayNames([lang],{type:"region"}); }catch(e){ regionDN = null; } }
  const regionOf = code => { try{ return (regionDN && regionDN.of(code)) || code; }catch(e){ return code; } };
  const mountLabel = m => (L && L["mount_"+String(m).toLowerCase().replace(/[^a-z0-9]/g,"")]) || m;

  const SUN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const MOON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';

  const cc = p => `<span class="cc" title="${esc(regionOf(p.country))}">${esc(p.country)}</span>`;
  const metricParts = p => {
    const d=p.computeDisplay||"-"; if(d==="-") return {num:"-",unit:"",dim:true};
    const i=d.indexOf(" "); return {num:i<0?d:d.slice(0,i),unit:i<0?"":d.slice(i+1),dim:false};
  };
  let animate = true;
  const specsOf = p => (p.specsI18n && (p.specsI18n[curLang] || p.specsI18n.en)) || [];
  const noteOf = p => (p.noteI18n && (p.noteI18n[curLang] || p.noteI18n.en)) || "";
  const powerOf = p => p.power || "-";
  const priceOf = p => p.priceDisplay==null ? L.undisclosed : p.priceDisplay;
  const relOf = p => p.releaseDisplay || L.unknown;
  const warnBtn = p => p.standalone ? "" : `<span class="intg" data-tip="${esc(L.warn_integrated)}" role="img" aria-label="${esc(L.warn_integrated)}" tabindex="0">⚠</span>`;

  const FORM_ORDER = ["Embedded","PCIe","M.2","mPCIe","USB","SoM","HAT","Board","MXM","Server","IP"];
  const FORMS = [...new Set(products.map(p=>p.formGroup))].sort((a,b)=>{const i=FORM_ORDER.indexOf(a),j=FORM_ORDER.indexOf(b);return (i<0?99:i)-(j<0?99:j);});
  const VENDORS = [...new Set(products.map(p=>p.vendor))].sort();
  const QUICK_MOUNTS = ["Embedded","PCIe","M.2","USB","SoM","Server"].filter(m=>FORMS.includes(m));

  const ARCHS = [...new Set(products.flatMap(p=>p.arch||[]))].sort((a,b)=>["CNN","RNN","Transformer","ViT","LLM","VLM","Diffusion","SNN"].indexOf(a)-["CNN","RNN","Transformer","ViT","LLM","VLM","Diffusion","SNN"].indexOf(b));
  const state = { search:"", view:"table", sort:"default",
    country:new Set(), form:new Set(), vendor:new Set(), arch:new Set(),
    includeIntegrated:false, dateFrom:null, dateTo:null, includeNoDate:true, compare:new Set() };

  function chipBtn(label, pressed, onclick){
    const b=document.createElement("button"); b.className="tog"; b.type="button"; b.textContent=label;
    b.setAttribute("aria-pressed", pressed?"true":"false"); b.onclick=onclick; return b;
  }
  function multi(hostId, opts, set){
    const host=$(hostId); host.innerHTML="";
    opts.forEach(o=>host.appendChild(chipBtn(o.label, set.has(o.key), function(){
      set.has(o.key) ? (set.delete(o.key), this.setAttribute("aria-pressed","false")) : (set.add(o.key), this.setAttribute("aria-pressed","true"));
      render(); fcount();
    })));
  }
  function buildFilters(){
    const seg=$("q-segment"); seg.innerHTML="";
    QUICK_MOUNTS.forEach(k=>seg.appendChild(chipBtn(mountLabel(k), state.form.has(k), function(){
      state.form.has(k) ? state.form.delete(k) : state.form.add(k);
      buildFilters(); render(); fcount();
    })));
    multi("f-country", [...new Set(products.map(p=>p.country))].sort().map(c=>({key:c,label:regionOf(c)})), state.country);
    multi("f-form", FORMS.map(f=>({key:f,label:mountLabel(f)})), state.form);
    multi("f-arch", ARCHS.map(a=>({key:a,label:a})), state.arch);
    $("f-arch").parentElement.hidden = ARCHS.length===0;
    multi("f-vendor", VENDORS.map(v=>({key:v,label:v})), state.vendor);
    filterVendorChips($("f-vendor-search") ? $("f-vendor-search").value : "");
  }
  // 벤더가 많아 검색으로 필터 (D)
  function filterVendorChips(q){
    q=(q||"").toLowerCase().trim();
    Array.prototype.forEach.call($("f-vendor").children, function(b){
      b.style.display = (!q || b.textContent.toLowerCase().indexOf(q)>=0) ? "" : "none";
    });
  }
  function fcount(){ const n=state.country.size+state.form.size+state.vendor.size+state.arch.size+(state.includeIntegrated?1:0)+((state.dateFrom||state.dateTo)?1:0)+(state.includeNoDate?0:1);
    const e=$("fcount"); if(n){e.hidden=false;e.textContent=n;}else e.hidden=true; }

  function matches(p){
    if(!state.includeIntegrated && !p.standalone)return false;
    if(state.country.size&&!state.country.has(p.country))return false;
    if(state.form.size&&!state.form.has(p.formGroup))return false;
    if(state.vendor.size&&!state.vendor.has(p.vendor))return false;
    if(state.arch.size&&!(p.arch||[]).some(a=>state.arch.has(a)))return false;
    if(state.dateFrom||state.dateTo){ if(!p.releaseDate){if(!state.includeNoDate)return false;}
      else{const rf=state.dateFrom?state.dateFrom+"-01":null,rt=state.dateTo?state.dateTo+"-31":null;
        if(rf&&p.releaseDate<rf)return false;if(rt&&p.releaseDate>rt)return false;} }
    else if(!p.releaseDate&&!state.includeNoDate)return false;
    if(state.search){ const hay=[p.vendor,p.product,p.chip,regionOf(p.country),p.country,p.form,p.memory,p.useCase,powerOf(p),...(p.arch||[]),...(p.tags||[]),...specsOf(p).map(x=>x[1]),noteOf(p)].join(" ").toLowerCase();
      if(!hay.includes(state.search))return false; }
    return true;
  }
  function sortList(list){ const s=state.sort,a=[...list];
    if(s==="default")return a;
    if(s==="tops-desc")a.sort((x,y)=>(y.tops??-1)-(x.tops??-1));
    else if(s==="tops-asc")a.sort((x,y)=>(x.tops??Infinity)-(y.tops??Infinity));
    else if(s==="price-asc")a.sort((x,y)=>(x.priceUSD??Infinity)-(y.priceUSD??Infinity));
    else if(s==="price-desc")a.sort((x,y)=>(y.priceUSD??-1)-(x.priceUSD??-1));
    else if(s==="date-desc")a.sort((x,y)=>(y.releaseDate||"").localeCompare(x.releaseDate||""));
    else if(s==="date-asc")a.sort((x,y)=>{if(!x.releaseDate)return 1;if(!y.releaseDate)return -1;return x.releaseDate.localeCompare(y.releaseDate);});
    else if(s==="vendor"||s==="vendor-asc")a.sort((x,y)=>x.vendor.localeCompare(y.vendor)||x.product.localeCompare(y.product));
    else if(s==="vendor-desc")a.sort((x,y)=>y.vendor.localeCompare(x.vendor)||x.product.localeCompare(y.product));
    else if(s==="name-asc")a.sort((x,y)=>x.product.localeCompare(y.product));
    else if(s==="name-desc")a.sort((x,y)=>y.product.localeCompare(x.product));
    return a;
  }

  function row(p,i){
    const perf = p.computeDisplay || "-";
    const picked = state.compare.has(p.id);
    const w = warnBtn(p);
    const cls = [picked?"picked":"", animate?"ri":""].filter(Boolean).join(" ");
    const st = animate?` style="--i:${Math.min(i,14)}"`:"";
    return `<tr data-id="${esc(p.id)}"${cls?` class="${cls}"`:""}${st}>
      <td class="sel"><input type="checkbox" class="rowchk" data-id="${esc(p.id)}" aria-label="${esc(p.product)}"${picked?" checked":""}></td>
      <td class="idx">${String(i+1).padStart(2,"0")}</td>
      <td class="prod"><a class="pn" href="${esc(p.page)}">${esc(p.product)}</a>${p.chip?`<div class="pchip">${esc(p.chip)}</div>`:""}</td>
      <td class="muted"><a class="vn" href="${esc(p.vpage)}">${esc(p.vendor)}</a></td>
      <td>${cc(p)}</td>
      <td class="arch">${p.arch&&p.arch.length?esc(p.arch.join(" · ")):'<span class="muted">-</span>'}</td>
      <td><span class="seg">${esc(mountLabel(p.formGroup))}</span>${w?" "+w:""}</td>
      <td class="r"><span class="num">${esc(perf)}</span></td>
      <td class="muted">${esc(p.memory||"-")}</td>
      <td><span class="num">${esc(powerOf(p))}</span></td>
      <td class="r"><span class="num ${p.priceUSD!=null?'':'muted'}">${esc(priceOf(p))}</span></td>
      <td class="r"><span class="num ${p.releaseDate?'':'muted'}">${esc(relOf(p))}</span></td>
    </tr>`;
  }
  function buildThead(){
    const hc=(col,k,o)=>{ o=o||{}; const inter=o.sort||o.filter;
      const fset={vendor:state.vendor,country:state.country,arch:state.arch,form:state.form}[col];
      const sk={product:'name',vendor:'vendor',perf:'tops',price:'price',release:'date'}[col];
      const active=(o.filter&&fset&&fset.size>0)||(o.sort&&sk&&(state.sort===sk+'-asc'||state.sort===sk+'-desc'||(sk==='vendor'&&state.sort==='vendor')));
      const cls=[o.r?'r':'',inter?'thx':'',active?'active':''].filter(Boolean).join(' ');
      const caret=inter?'<svg class="thc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m6 9 6 6 6-6"/></svg>':'';
      return `<th scope="col" data-col="${col}"${cls?` class="${cls}"`:''}><span class="thl">${esc(L[k])}</span>${caret}</th>`; };
    return `<thead><tr><th class="sel"><input type="checkbox" class="selall" aria-label="${esc(L.a_selectall)}"></th><th scope="col"><span class="sr">#</span></th>`+
      hc('product','col_product',{sort:1})+hc('vendor','col_vendor',{sort:1,filter:1})+hc('country','col_country',{filter:1})+
      hc('arch','arch',{filter:1})+hc('form','col_form',{filter:1})+
      hc('perf','col_perf',{r:1,sort:1})+hc('memory','col_memory',{})+hc('power','col_power',{})+
      hc('price','col_price',{r:1,sort:1})+hc('release','col_release',{r:1,sort:1})+`</tr></thead>`; }
  function table(list){ return `<table class="db">${buildThead()}<tbody>${list.map(row).join("")}</tbody></table>`; }

  function entry(p,i){
    const m=metricParts(p);
    const specs=specsOf(p).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");
    const nt=noteOf(p);
    const note=nt?`<p class="e-note">${esc(nt)}</p>`:"";
    const arch=(p.arch&&p.arch.length)?`<div class="e-arch"><i>${esc(L.arch)}</i>${p.arch.map(a=>`<span class="at">${esc(a)}</span>`).join("")}</div>`:"";
    const w=warnBtn(p);
    const picked=state.compare.has(p.id);
    const cls=["entry", animate?"ri":""].filter(Boolean).join(" ");
    const st=animate?` style="--i:${Math.min(i,14)}"`:"";
    const sub=[p.chip, mountLabel(p.formGroup), (p.standalone?null:L.integrated), relOf(p)].filter(Boolean).map(esc).join(" / ");
    return `<article class="${cls}"${st}>
      <div class="e-top"><a class="e-vendor" href="${esc(p.vpage)}">${esc(p.vendor)}</a><span class="e-topr">${cc(p)}<label class="e-chk"><input type="checkbox" class="rowchk" data-id="${esc(p.id)}" aria-label="${esc(p.product)}"${picked?" checked":""}></label></span></div>
      <a class="e-name" href="${esc(p.page)}">${esc(p.product)}</a>
      <div class="e-sub">${sub}${w?" "+w:""}</div>
      <div class="e-figs">
        <div><i>${esc(L.col_perf)}</i><b class="perf ${m.dim?'dim':''}">${esc(m.num)}${m.unit?`<span class="u">${esc(m.unit)}</span>`:""}</b></div>
        <div><i>${esc(L.col_memory)}</i><b title="${esc(p.memory)}">${esc(p.memory||"-")}</b></div>
        <div><i>${esc(L.col_power)}</i><b class="${p.power?'':'dim'}">${esc(powerOf(p))}</b></div>
        <div><i>${esc(L.col_price)}</i><b class="${p.priceUSD!=null?'':'dim'}">${esc(priceOf(p))}</b></div>
      </div>
      ${specs?`<dl class="e-specs">${specs}</dl>`:""}
      ${note}${arch}
    </article>`;
  }

  function chipView(list){
    const map=new Map();
    list.forEach(p=>{ const k=p.chipKey||p.product; if(!map.has(k)) map.set(k,[]); map.get(k).push(p); });
    const groups=[...map.entries()].sort((a,b)=> b[1].length-a[1].length || a[0].localeCompare(b[0]));
    return groups.map(([chip,items],gi)=>{
      const vendors=[...new Set(items.map(p=>p.vendor))];
      const vlabel = vendors.length===1 ? esc(vendors[0]) : `${vendors.length} ${esc(L.w_vendors)}`;
      const badge = items.length>1 ? `<span class="chip-badge">${items.length} ${esc(L.w_products)}</span>` : "";
      const rows=items.map(p=>{
        const perf=p.computeDisplay||"-";
        const w=warnBtn(p);
        const spec=[p.country,p.form,perf,priceOf(p)].filter(Boolean).map(esc).join(" / ");
        return `<a class="chip-item" href="${esc(p.page)}"><span class="ci-name"><b>${esc(p.product)}</b>${w?" "+w:""}<span class="ci-vd">${esc(p.vendor)}</span></span><span class="ci-spec">${spec}</span></a>`;
      }).join("");
      const cls=["chipgrp", animate?"ri":""].filter(Boolean).join(" ");
      const st=animate?` style="--i:${Math.min(gi,14)}"`:"";
      return `<div class="${cls}"${st}><div class="chip-h"><span class="chip-name">${esc(chip)}</span>${badge}<span class="chip-meta">${vlabel}</span></div><div class="chip-items">${rows}</div></div>`;
    }).join("");
  }
  let lastList=products.slice();
  function render(anim){
    animate = anim!==false && !reduceMotion;
    const list=sortList(products.filter(matches));
    lastList=list;
    const tw=$("tablewrap"),grid=$("grid"),chipw=$("chipwrap"),empty=$("empty");
    tw.hidden=true;grid.hidden=true;chipw.hidden=true;empty.hidden=true;
    if(!list.length){empty.hidden=false;}
    else if(state.view==="card"){grid.hidden=false;grid.innerHTML=list.map(entry).join("");}
    else if(state.view==="chip"){chipw.hidden=false;chipw.innerHTML=chipView(list);}
    else{tw.hidden=false;tw.innerHTML=table(list);}
    $("count").innerHTML=`<b>${list.length}</b> ${esc(L.w_products)}`;
    syncSelAll();
  }
  function syncSelAll(){ const el=document.querySelector(".selall"); if(!el)return;
    const picked=lastList.filter(p=>state.compare.has(p.id)).length;
    el.checked = lastList.length>0 && picked===lastList.length;
    el.indeterminate = picked>0 && picked<lastList.length; }
  function setView(v){ state.view=v;
    $("viewTable").setAttribute("aria-pressed",v==="table");
    $("viewCard").setAttribute("aria-pressed",v==="card");
    $("viewChip").setAttribute("aria-pressed",v==="chip");
    render(); }

  function buildMeta(){
    const vN=new Set(products.map(p=>p.vendor)).size, cN=new Set(products.map(p=>p.country)).size;
    $("meta").innerHTML=`<span><b>${products.length}</b> ${esc(L.w_products)}</span><span><b>${vN}</b> ${esc(L.w_vendors)}</span><span><b>${cN}</b> ${esc(L.w_countries)}</span>`;
  }

  // ---- tooltip (hover + focus + click) ----
  const tipEl=document.createElement("div"); tipEl.className="tip"; document.body.appendChild(tipEl);
  let tipFor=null;
  function showTip(el){ const t=el.getAttribute("data-tip"); if(!t)return; tipEl.textContent=t; tipEl.classList.add("show");
    const r=el.getBoundingClientRect(), tr=tipEl.getBoundingClientRect(), pad=8;
    let left=r.left+r.width/2-tr.width/2; left=Math.max(pad,Math.min(left,innerWidth-tr.width-pad));
    let top=r.top-tr.height-8; if(top<pad) top=r.bottom+8;
    tipEl.style.left=left+"px"; tipEl.style.top=top+"px"; tipFor=el; }
  function hideTip(){ tipEl.classList.remove("show"); tipFor=null; }
  document.addEventListener("mouseover",e=>{ const el=e.target.closest&&e.target.closest("[data-tip]"); if(el&&el!==tipFor) showTip(el); });
  document.addEventListener("mouseout",e=>{ const el=e.target.closest&&e.target.closest("[data-tip]"); if(el&&el===tipFor) hideTip(); });
  document.addEventListener("focusin",e=>{ const el=e.target.closest&&e.target.closest("[data-tip]"); if(el) showTip(el); });
  document.addEventListener("focusout",()=>{ if(tipFor) hideTip(); });
  document.addEventListener("click",e=>{ const el=e.target.closest&&e.target.closest(".intg");
    if(el){ e.preventDefault(); e.stopPropagation(); showTip(el); }
    else if(tipFor && !(e.target.closest&&e.target.closest("[data-tip]"))) hideTip(); });
  addEventListener("scroll",()=>{ if(tipFor) hideTip(); }, true);

  // ---- column header menu (click header -> sort / filter) ----
  const SORTKEY={product:'name',vendor:'vendor',perf:'tops',price:'price',release:'date'};
  const FILTERSET={vendor:()=>state.vendor,country:()=>state.country,arch:()=>state.arch,form:()=>state.form};
  const FILTEROPTS={
    vendor:()=>VENDORS.map(v=>({k:v,label:v})),
    country:()=>[...new Set(products.map(p=>p.country))].sort().map(c=>({k:c,label:regionOf(c)})),
    arch:()=>ARCHS.map(a=>({k:a,label:a})),
    form:()=>FORMS.map(f=>({k:f,label:mountLabel(f)})),
  };
  const CARETUP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m6 15 6-6 6 6"/></svg>';
  const CARETDN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m6 9 6 6 6-6"/></svg>';
  const colMenu=document.createElement("div"); colMenu.className="colmenu"; colMenu.hidden=true; document.body.appendChild(colMenu);
  let menuCol=null;
  function closeColMenu(){ colMenu.hidden=true; menuCol=null; }
  function openColMenu(col, th){
    menuCol=col; let html=""; const sk=SORTKEY[col];
    if(sk){ const asc=sk+"-asc", desc=sk+"-desc";
      html+=`<div class="cm-sec"><button class="cm-b${(state.sort===asc||(sk==='vendor'&&state.sort==='vendor'))?' on':''}" data-sort="${asc}">${CARETUP}<span>${esc(L.sort_asc)}</span></button>`+
        `<button class="cm-b${state.sort===desc?' on':''}" data-sort="${desc}">${CARETDN}<span>${esc(L.sort_desc)}</span></button></div>`; }
    if(FILTERSET[col]){ const set=FILTERSET[col](); const opts=FILTEROPTS[col]();
      html+=`<div class="cm-sec cm-filter">`+opts.map(o=>`<label class="cm-chk"><input type="checkbox" data-fval="${esc(String(o.k))}"${set.has(o.k)?" checked":""}><span>${esc(o.label)}</span></label>`).join("")+`</div>`+
        `<div class="cm-foot"><button class="cm-clear" data-clearcol>${esc(L.reset)}</button></div>`; }
    colMenu.innerHTML=html; colMenu.hidden=false;
    const r=th.getBoundingClientRect(); colMenu.style.left="0px"; colMenu.style.top="0px";
    const mw=colMenu.offsetWidth, pad=8; let left=(L._dir==="rtl")?(r.right-mw):r.left;
    left=Math.max(pad,Math.min(left,innerWidth-mw-pad)); colMenu.style.left=left+"px"; colMenu.style.top=(r.bottom+4)+"px";
  }
  colMenu.addEventListener("click", e=>{ e.stopPropagation();
    const sb=e.target.closest("[data-sort]");
    if(sb){ state.sort=sb.getAttribute("data-sort"); const sel=$("sortSel"); if([...sel.options].some(o=>o.value===state.sort)) sel.value=state.sort; closeColMenu(); render(); return; }
    if(e.target.closest("[data-clearcol]")){ const s=FILTERSET[menuCol]&&FILTERSET[menuCol](); if(s){ s.clear(); buildFilters(); fcount(); render(); } closeColMenu(); } });
  colMenu.addEventListener("change", e=>{ const cb=e.target.closest("[data-fval]"); if(!cb)return;
    const s=FILTERSET[menuCol]&&FILTERSET[menuCol](); if(!s)return; const v=cb.getAttribute("data-fval");
    cb.checked?s.add(v):s.delete(v); buildFilters(); fcount(); render(); });
  document.addEventListener("click", e=>{ const th=e.target.closest&&e.target.closest("th.thx");
    if(th){ e.stopPropagation(); const c=th.getAttribute("data-col"); (menuCol===c&&!colMenu.hidden)?closeColMenu():openColMenu(c,th); }
    else if(!(e.target.closest&&e.target.closest(".colmenu"))) closeColMenu(); });
  addEventListener("scroll",()=>{ if(!colMenu.hidden) closeColMenu(); }, true);

  // ---- compare / selection ----
  function updateCmp(){
    const n=state.compare.size;
    $("cmpCount").textContent=n;
    $("cmpbar").classList.toggle("show", n>0);
    $("cmpbar").setAttribute("aria-hidden", n>0?"false":"true");
    $("cmpbar").inert = n===0;
    document.body.classList.toggle("cmp-pad", n>0);
    syncSelAll();
    if($("cmpmodal").classList.contains("open")){ n<1 ? closeCompare() : buildCmpTable(); }
  }
  function cmpItems(){ return products.filter(p=>state.compare.has(p.id)); }
  function buildCmpTable(){
    const items=cmpItems(); if(!items.length){ $("cmpBody").innerHTML=""; return; }
    const rowsDef=[
      ["col_vendor", p=>esc(p.vendor)],
      ["col_country", p=>esc(regionOf(p.country))],
      ["arch", p=>(p.arch&&p.arch.length)?p.arch.map(esc).join(", "):'<span class="dim">-</span>'],
      ["col_form", p=>{ const w=warnBtn(p); return esc(mountLabel(p.formGroup))+(w?" "+w:""); }],
      ["col_perf", p=>esc(p.computeDisplay||"-")],
      ["col_memory", p=>esc(p.memory||"-")],
      ["col_power", p=>esc(powerOf(p))],
      ["col_price", p=>`<span class="${p.priceUSD!=null?'':'dim'}">${esc(priceOf(p))}</span>`],
      ["col_release", p=>`<span class="${p.releaseDate?'':'dim'}">${esc(relOf(p))}</span>`],
    ];
    const labels=[], seen=new Set();
    items.forEach(p=>specsOf(p).forEach(([k])=>{ if(!seen.has(k)){seen.add(k);labels.push(k);} }));
    const head=`<thead><tr><th class="rl"></th>${items.map(p=>`<th><a class="pname" href="${esc(p.page)}">${esc(p.product)}</a><div class="pv"><a class="vn" href="${esc(p.vpage)}">${esc(p.vendor)}</a></div></th>`).join("")}</tr></thead>`;
    let body="";
    rowsDef.forEach(([k,fn])=>{ body+=`<tr><td class="rl">${esc(L[k])}</td>${items.map(p=>`<td>${fn(p)}</td>`).join("")}</tr>`; });
    labels.forEach(lab=>{ body+=`<tr><td class="rl">${esc(lab)}</td>${items.map(p=>{ const m=specsOf(p).find(x=>x[0]===lab); return `<td>${m?esc(m[1]):'<span class="dim">-</span>'}</td>`; }).join("")}</tr>`; });
    if(items.some(p=>noteOf(p))) body+=`<tr><td class="rl">${esc(L.col_note)}</td>${items.map(p=>{ const n=noteOf(p); return `<td>${n?esc(n):'<span class="dim">-</span>'}</td>`; }).join("")}</tr>`;
    $("cmpBody").innerHTML=`<table class="cmp">${head}<tbody>${body}</tbody></table>`;
  }
  function openCompare(){ if(!state.compare.size)return; buildCmpTable(); $("cmpmodal").classList.add("open"); document.body.style.overflow="hidden"; }
  function closeCompare(){ $("cmpmodal").classList.remove("open"); document.body.style.overflow=""; }
  function clearCompare(){ state.compare.clear(); closeCompare(); render(false); updateCmp(); }
  document.addEventListener("change",e=>{
    const t=e.target;
    if(t.classList&&t.classList.contains("rowchk")){ const id=t.getAttribute("data-id");
      t.checked ? state.compare.add(id) : state.compare.delete(id);
      const host=t.closest("tr,.entry"); if(host) host.classList.toggle("picked", t.checked);
      updateCmp();
    } else if(t.classList&&t.classList.contains("selall")){
      const on=t.checked; lastList.forEach(p=>{ on?state.compare.add(p.id):state.compare.delete(p.id); });
      render(false); updateCmp();
    }
  });

  // ---- reveal on scroll (right -> left) ----
  function revealInit(){ if(reduceMotion)return; let io;
    try{ io=new IntersectionObserver(es=>{ es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } }); },{threshold:.05,rootMargin:"0px 0px -60px 0px"}); }catch(e){ return; }
    document.querySelectorAll(".section").forEach(el=>{ el.classList.add("reveal"); io.observe(el); });
  }

  // ---- i18n ----
  function detectLang(){
    try{ const q=new URLSearchParams(location.search).get("lang"); if(q&&SUPPORTED.includes(q)) return q; }catch(e){}
    if(window.__LANGLOCK && SUPPORTED.includes(window.__SSRLANG)) return window.__SSRLANG;
    try{ const s=localStorage.getItem("npu-lang"); if(s&&SUPPORTED.includes(s)) return s; }catch(e){}
    const cands=(navigator.languages&&navigator.languages.length)?navigator.languages:[navigator.language||"en"];
    for(const c of cands){ let b=String(c).toLowerCase().split("-")[0]; if(b==="iw")b="he"; if(b==="zh")return "zh"; if(SUPPORTED.includes(b))return b; }
    return "en";
  }
  function buildLangSel(){
    const sel=$("langSel"); sel.innerHTML="";
    SUPPORTED.forEach(lg=>{ const o=document.createElement("option"); o.value=lg; o.textContent=(I18N[lg]&&I18N[lg]._name)||lg; sel.appendChild(o); });
    sel.onchange=e=>applyLang(e.target.value,false);
  }
  function applyLang(lang, initial){
    curLang = SUPPORTED.includes(lang)?lang:"en";
    L = I18N[curLang]||I18N.en; setRegionDN(curLang);
    document.documentElement.lang = curLang;
    document.documentElement.dir = (L._dir||"ltr");
    document.querySelectorAll("[data-i18n]").forEach(el=>{const k=el.getAttribute("data-i18n"); if(L[k]!=null) el.textContent=L[k];});
    document.querySelectorAll("[data-i18n-ph]").forEach(el=>{const k=el.getAttribute("data-i18n-ph"); if(L[k]!=null) el.placeholder=L[k];});
    document.querySelectorAll("[data-i18n-aria]").forEach(el=>{const k=el.getAttribute("data-i18n-aria"); if(L[k]!=null) el.setAttribute("aria-label",L[k]);});
    if($("langSel")) $("langSel").value=curLang;
    buildFilters(); buildMeta();
    // The server already rendered the default view in this language, so on first
    // load we keep that DOM (big TBT/LCP win) and only sync the working list.
    if(initial && curLang===window.__SSRLANG){ lastList=sortList(products.filter(matches)); syncSelAll(); }
    else render();
    updateCmp();
    if(newsActive){ newsBuildKws(); newsLoad(); }
    try{ localStorage.setItem("npu-lang",curLang); }catch(e){}
    setTimeout(setSticky,0);
  }

  // ---- theme ----
  function setTheme(t){ document.documentElement.setAttribute("data-theme",t); $("themeBtn").innerHTML=t==="dark"?MOON:SUN; try{localStorage.setItem("npu-theme",t);}catch(e){} }
  $("themeBtn").onclick=()=>setTheme(document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark");
  (function(){let q=null;try{q=new URLSearchParams(location.search).get("theme");}catch(e){}
    let s=null;try{s=localStorage.getItem("npu-theme");}catch(e){}
    setTheme((q==="light"||q==="dark")?q:(s||(window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark")));})();

  function setSticky(){ document.documentElement.style.setProperty("--stick-top",$("topbar").offsetHeight+"px"); }

  // ---- events ----
  $("search").oninput=e=>{state.search=e.target.value.toLowerCase().trim();render(false);};
  $("sortSel").onchange=e=>{state.sort=e.target.value;render();};
  $("dateFrom").onchange=e=>{state.dateFrom=e.target.value||null;render();fcount();};
  $("dateTo").onchange=e=>{state.dateTo=e.target.value||null;render();fcount();};
  $("includeNoDate").onchange=e=>{state.includeNoDate=e.target.checked;render();fcount();};
  $("includeIntegrated").onchange=e=>{state.includeIntegrated=e.target.checked;render();fcount();};
  $("f-vendor-search").oninput=e=>filterVendorChips(e.target.value);
  $("viewTable").onclick=()=>setView("table"); $("viewCard").onclick=()=>setView("card"); $("viewChip").onclick=()=>setView("chip");
  $("filterToggle").onclick=()=>{const d=$("drawer");const o=d.classList.toggle("open");$("filterToggle").setAttribute("aria-expanded",String(o));setTimeout(setSticky,280);};
  $("resetBtn").onclick=()=>{Object.assign(state,{search:"",sort:"default",dateFrom:null,dateTo:null,includeNoDate:true});
    state.country.clear();state.form.clear();state.vendor.clear();state.arch.clear();state.includeIntegrated=false;
    $("search").value="";$("dateFrom").value="";$("dateTo").value="";$("includeNoDate").checked=true;$("includeIntegrated").checked=false;$("sortSel").value="default";
    if($("f-vendor-search"))$("f-vendor-search").value="";
    buildFilters();fcount();render();};
  let rt;addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(setSticky,150);});

  // ---- compare controls ----
  $("cmpClear").onclick=clearCompare;
  $("cmpOpen").onclick=openCompare;
  $("cmpClose").onclick=closeCompare;
  $("cmpOv").onclick=closeCompare;
  addEventListener("keydown",e=>{ if(e.key==="Escape"){ if($("cmpmodal").classList.contains("open"))closeCompare(); else if(!colMenu.hidden)closeColMenu(); else if(tipFor)hideTip(); } });

  // ---- News tab (same-origin baked Google News snapshot + best-effort live proxy refresh) ----
  var newsActive=false, newsKw="all";
  var NEWS_LOCALE={ko:{hl:"ko",gl:"KR",ceid:"KR:ko"},en:{hl:"en-US",gl:"US",ceid:"US:en"},ja:{hl:"ja",gl:"JP",ceid:"JP:ja"},zh:{hl:"zh-CN",gl:"CN",ceid:"CN:zh-Hans"},es:{hl:"es",gl:"ES",ceid:"ES:es"},he:{hl:"he",gl:"IL",ceid:"IL:he"}};
  var NEWS_KWS=[{id:"all",q:'NPU OR "AI accelerator" OR "neural processing unit" OR TPU'},{id:"npu",q:'NPU "neural processing unit"'},{id:"accel",q:'"AI accelerator" OR "inference accelerator"'},{id:"edge",q:'"edge AI" OR "on-device AI"'},{id:"tpu",q:'TPU OR "tensor processing unit"'},{id:"datacenter",q:'"AI chip" datacenter inference accelerator'}];
  // Same-origin baked snapshot (built by scripts/build-news.mjs) is the reliable floor.
  var NEWS_BASE=(function(){try{var a=document.getElementById("navCharts");if(a&&a.href)return new URL(a.href).pathname.replace(/trends\/?(?:[?#].*)?$/,"")+"news/";}catch(e){}return "/awesome-npu/news/";})();
  // Live-refresh proxies are best-effort only (public proxies are flaky); the floor covers failures.
  var NEWS_PROXIES=[function(u){return "https://api.codetabs.com/v1/proxy/?quest="+encodeURIComponent(u);},function(u){return "https://api.allorigins.win/raw?url="+encodeURIComponent(u);},function(u){return "https://api.allorigins.win/get?url="+encodeURIComponent(u);},function(u){return "https://proxy.cors.sh/"+u;}];
  function newsBaked(kw,lang){var ctrl=new AbortController();var to=setTimeout(function(){ctrl.abort();},7000);return fetch(NEWS_BASE+lang+"-"+kw+".json",{signal:ctrl.signal}).then(function(r){clearTimeout(to);if(!r.ok)throw 0;return r.json();}).then(function(o){return {t:(o&&o.t)||0,items:(o&&o.items)||[]};});}
  function newsRssUrl(kw,lang){var loc=NEWS_LOCALE[lang]||NEWS_LOCALE.en;var e=NEWS_KWS.filter(function(k){return k.id===kw;})[0]||NEWS_KWS[0];return "https://news.google.com/rss/search?q="+encodeURIComponent(e.q)+"&hl="+loc.hl+"&gl="+loc.gl+"&ceid="+encodeURIComponent(loc.ceid);}
  function newsCacheKey(kw,lang){return "npu-news:"+lang+":"+kw;}
  function newsRead(kw,lang){try{var r=localStorage.getItem(newsCacheKey(kw,lang));if(!r)return null;var o=JSON.parse(r);o.stale=(Date.now()-o.t>1200000);return o;}catch(e){return null;}}
  function newsSave(kw,lang,items){try{localStorage.setItem(newsCacheKey(kw,lang),JSON.stringify({t:Date.now(),items:items}));}catch(e){}}
  function newsParseItems(text){var items=[];var t=String(text||"").trim();if(t.charAt(0)==="{"){try{var j=JSON.parse(t);if(typeof j.contents==="string")return newsParseItems(j.contents);if(j.items&&j.items.length){j.items.forEach(function(it){items.push({title:it.title,link:it.link,pub:it.pubDate,src:(it.source&&it.source.title)||""});});return items;}}catch(e){}}try{var doc=new DOMParser().parseFromString(text,"text/xml");Array.prototype.forEach.call(doc.querySelectorAll("item"),function(n){var g=function(t){var el=n.getElementsByTagName(t)[0];return el?el.textContent:"";};var title=g("title");if(title)items.push({title:title,link:g("link"),pub:g("pubDate"),src:g("source")});});}catch(e){}return items;}
  function newsTry(url){var ctrl=new AbortController();var to=setTimeout(function(){ctrl.abort();},8000);return fetch(url,{signal:ctrl.signal}).then(function(r){clearTimeout(to);if(!r.ok)throw 0;return r.text();}).then(function(txt){var it=newsParseItems(txt);if(!it.length)throw 0;return it;});}
  function newsFetch(kw,lang){var rss=newsRssUrl(kw,lang);return Promise.any(NEWS_PROXIES.map(function(pf){return newsTry(pf(rss));}));}
  function newsRender(items){$("newsGrid").innerHTML=items.slice(0,24).map(function(it){var d="";try{if(it.pub)d=new Date(it.pub).toLocaleDateString(curLang,{year:"numeric",month:"short",day:"numeric"});}catch(e){}return '<a class="ncard" href="'+esc(it.link)+'" target="_blank" rel="noopener"><div class="ntitle">'+esc(it.title)+'</div><div class="nmeta">'+(it.src?'<span class="nsrc">'+esc(it.src)+'</span>':"")+(d?'<span class="ndate">'+esc(d)+'</span>':"")+'</div></a>';}).join("");}
  function newsMark(t){try{$("newsUpd").textContent=new Date(t||Date.now()).toLocaleString(curLang);}catch(e){}}
  function newsLoad(force){var lang=curLang,kw=newsKw;var status=$("newsStatus"),foot=$("newsFoot");var cached=force?null:newsRead(kw,lang);var shown=false;var cur=function(){return kw===newsKw&&lang===curLang;};var apply=function(items,t){if(!cur()||!items||!items.length)return false;shown=true;newsSave(kw,lang,items);newsRender(items);status.hidden=true;foot.hidden=false;newsMark(t);return true;};var fail=function(){if(cur()&&!shown){status.hidden=false;status.className="news-status err";status.innerHTML=esc((L&&L.news_error)||"Couldn't load news right now.")+' <button class="news-retry" id="newsRetry"></button>';var rb=$("newsRetry");if(rb){rb.textContent=(L&&L.news_retry)||"Retry";rb.onclick=function(){newsLoad(true);};}}};if(cached&&cached.items&&cached.items.length){newsRender(cached.items);shown=true;foot.hidden=false;newsMark(cached.t);if(!cached.stale){status.hidden=true;return;}}if(!shown){status.hidden=false;status.className="news-status";status.textContent=(L&&L.news_loading)||"Loading news…";}var live=function(){return newsFetch(kw,lang).then(function(it){apply(it);}).catch(function(){});};newsBaked(kw,lang).then(function(o){apply(o.items,o.t);if(o.items.length&&(Date.now()-o.t<2700000))return;return live();},function(){return live();}).then(fail);}
  function newsBuildKws(){var box=$("newsKws");if(!box)return;box.innerHTML=NEWS_KWS.map(function(k){return '<button class="nkw'+(k.id===newsKw?" on":"")+'" data-kw="'+k.id+'" data-i18n="news_kw_'+k.id+'"></button>';}).join("");Array.prototype.forEach.call(box.querySelectorAll(".nkw"),function(b){var k=b.getAttribute("data-i18n");b.textContent=(L&&L[k])||b.getAttribute("data-kw");b.onclick=function(){newsKw=b.getAttribute("data-kw");Array.prototype.forEach.call(box.querySelectorAll(".nkw"),function(x){x.classList.toggle("on",x===b);});newsLoad();};});}
  function showNews(on){newsActive=on;$("catalogView").hidden=on;$("newsView").hidden=!on;$("navNews").classList.toggle("active",on);if(on){if(!$("newsKws").children.length)newsBuildKws();newsLoad();window.scrollTo(0,0);}setTimeout(setSticky,0);}
  $("navNews").addEventListener("click",function(e){e.preventDefault();try{history.replaceState(null,"","#news");}catch(_){}showNews(true);});
  Array.prototype.forEach.call(document.querySelectorAll(".tnav a, .wm"),function(a){a.addEventListener("click",function(){if(newsActive){try{history.replaceState(null,"",location.pathname+location.search);}catch(_){}showNews(false);}});});

  // ---- init ----
  if(DATA.repo){$("repoLink").href=DATA.repo;$("repoLink2").href=DATA.repo;}
  $("viewTable").setAttribute("aria-pressed","true");$("viewCard").setAttribute("aria-pressed","false");$("viewChip").setAttribute("aria-pressed","false");
  buildLangSel();
  applyLang(detectLang(), true);
  try{ const vq=new URLSearchParams(location.search).get("view"); if(["table","card","chip"].includes(vq)) setView(vq); }catch(e){}
  if(location.hash==="#news") showNews(true);
  updateCmp(); revealInit();
  setSticky(); setTimeout(setSticky,200);
})();
