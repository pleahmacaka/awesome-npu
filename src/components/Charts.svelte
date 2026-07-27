<script>
  import { onMount } from 'svelte';
  import { BarChart, Bars, Labels } from 'layerchart';

  let { agg, i18n } = $props();

  const DIMS = [
    { id: 'year', k: 'ch_year' },
    { id: 'country', k: 'ch_country' },
    { id: 'vendor', k: 'ch_vendor' },
    { id: 'mount', k: 'ch_class' },
  ];
  let dim = $state('year');
  let lang = $state('en');

  onMount(() => {
    const read = () => { lang = document.documentElement.lang || 'en'; };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return () => mo.disconnect();
  });

  const L = $derived(i18n[lang] || i18n.en);
  function region(code) { try { return new Intl.DisplayNames([lang], { type: 'region' }).of(code) || code; } catch (e) { return code; } }
  const mountLabel = (key) => L['mount_' + String(key).toLowerCase().replace(/[^a-z0-9]/g, '')] || key;

  const data = $derived.by(() => {
    if (dim === 'year') return agg.byYear.map(d => ({ label: d.label, count: d.count }));
    if (dim === 'country') return agg.byCountry.slice(0, 12).map(d => ({ label: region(d.code), count: d.count }));
    if (dim === 'vendor') return agg.byVendor.slice(0, 15).map(d => ({ label: d.label, count: d.count }));
    return agg.byMount.map(d => ({ label: mountLabel(d.key), count: d.count }));
  });
  const horizontal = $derived(dim === 'country' || dim === 'vendor' || dim === 'mount');
  const padding = $derived(horizontal
    ? { top: 2, right: 44, bottom: 22, left: 104 }
    : { top: 22, right: 10, bottom: 24, left: 34 });

  // localized KPI cards tailored per dimension
  const stats = $derived.by(() => {
    const pct = (n) => agg.total ? Math.round((n / agg.total) * 100) : 0;
    if (dim === 'year') {
      const total = agg.byYear.reduce((s, d) => s + d.count, 0);
      const peak = agg.byYear.reduce((a, b) => (b.count > a.count ? b : a), agg.byYear[0] || { label: '-', count: 0 });
      const ys = agg.byYear.map(d => d.label);
      const span = ys.length ? (ys[0] === ys[ys.length - 1] ? ys[0] : ys[0] + '–' + ys[ys.length - 1]) : '-';
      return [{ v: total, k: 'tr_releases' }, { v: peak.label, k: 'tr_peak_year' }, { v: span, k: 'tr_span' }];
    }
    if (dim === 'country') {
      const top = agg.byCountry[0] || { code: '-', count: 0 };
      return [{ v: agg.countryTotal, k: 'tr_countries' }, { v: region(top.code), k: 'tr_top' }, { v: pct(top.count) + '%', k: 'tr_share' }];
    }
    if (dim === 'vendor') {
      const top = agg.byVendor[0] || { label: '-', count: 0 };
      return [{ v: agg.vendorTotal, k: 'tr_vendors' }, { v: top.label, k: 'tr_top' }, { v: top.count, k: 'tr_products' }];
    }
    const top = agg.byMount[0] || { key: '-', count: 0 };
    return [{ v: agg.mountTotal, k: 'tr_mount_types' }, { v: mountLabel(top.key), k: 'tr_top' }, { v: pct(top.count) + '%', k: 'tr_share' }];
  });

  const note = $derived(L['ch_note_' + dim] || '');
</script>

<div class="ch-tabs" role="tablist">
  {#each DIMS as d}
    <button class="ch-tab" class:on={dim === d.id} role="tab" aria-selected={dim === d.id} onclick={() => (dim = d.id)}>{L[d.k] || d.id}</button>
  {/each}
</div>

<div class="ch-kpis">
  {#each stats as s}
    <div class="ch-kpi"><b class="ch-kv">{s.v}</b><span class="ch-kl">{L[s.k] || s.k}</span></div>
  {/each}
</div>

<div class="ch-box" style:height={(horizontal ? Math.max(280, data.length * 30 + 48) : 340) + 'px'}>
  {#key dim + lang}
    <BarChart
      {data}
      {padding}
      x={horizontal ? 'count' : 'label'}
      y={horizontal ? 'label' : 'count'}
      orientation={horizontal ? 'horizontal' : 'vertical'}
    >
      {#snippet marks()}
        <Bars radius={3} strokeWidth={0} />
        <Labels placement="outside" offset={5} />
      {/snippet}
    </BarChart>
  {/key}
</div>

{#if note}<p class="ch-note">{note}</p>{/if}

<style>
  .ch-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 18px; }
  .ch-tab { font-size: 12.5px; color: var(--ink-2); background: none; border: 1px solid var(--rule-2); padding: 6px 14px; cursor: pointer; font-family: inherit; transition: .12s; }
  .ch-tab:hover { color: var(--ink); border-color: var(--rule-3); }
  .ch-tab.on { background: var(--spot); color: #fff; border-color: var(--spot); }
  .ch-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--rule); border: 1px solid var(--rule); margin: 0 0 18px; }
  .ch-kpi { background: var(--bg); padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .ch-kv { font-size: clamp(1.15rem, 3vw, 1.55rem); font-weight: 800; letter-spacing: -.02em; line-height: 1.1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ch-kl { font-size: 10.5px; letter-spacing: .05em; text-transform: uppercase; color: var(--ink-3); }
  .ch-box { width: 100%; border: 1px solid var(--rule); padding: 16px 14px 8px; --color-primary: var(--spot); }
  .ch-box :global(text) { fill: var(--ink-3); font-size: 11px; }
  .ch-box :global(.lc-labels text), .ch-box :global(.lc-labels-text) { fill: var(--ink-2); font-weight: 600; }
  .ch-box :global(.tick line), .ch-box :global(.rule line) { stroke: var(--rule); }
  .ch-box :global(.bar), .ch-box :global(rect.bar) { fill: var(--spot); }
  .ch-note { margin: 14px 0 0; font-size: 12.5px; color: var(--ink-3); line-height: 1.6; }
  @media (max-width: 560px) {
    .ch-kpis { grid-template-columns: 1fr; }
    .ch-kv { font-size: 1.15rem; }
  }
</style>
