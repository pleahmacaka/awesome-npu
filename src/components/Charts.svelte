<script>
  import { onMount } from 'svelte';
  import { BarChart } from 'layerchart';

  let { agg, i18n } = $props();

  const DIMS = [
    { id: 'year', k: 'ch_year' },
    { id: 'country', k: 'ch_country' },
    { id: 'vendor', k: 'ch_vendor' },
    { id: 'class', k: 'ch_class' },
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

  const data = $derived.by(() => {
    if (dim === 'year') return agg.byYear.map(d => ({ label: d.label, count: d.count }));
    if (dim === 'country') return agg.byCountry.map(d => ({ label: region(d.code), count: d.count }));
    if (dim === 'vendor') return agg.byVendor.map(d => ({ label: d.label, count: d.count }));
    return agg.byClass.map(d => ({ label: L['seg_' + d.key] || d.key, count: d.count }));
  });
  const horizontal = $derived(dim === 'country' || dim === 'vendor');
</script>

<div class="ch-tabs" role="tablist">
  {#each DIMS as d}
    <button class="ch-tab" class:on={dim === d.id} role="tab" aria-selected={dim === d.id} onclick={() => (dim = d.id)}>{L[d.k] || d.id}</button>
  {/each}
</div>

<div class="ch-box" style:height={(horizontal ? Math.max(300, data.length * 30 + 50) : 360) + 'px'}>
  {#key dim + lang}
    <BarChart
      {data}
      x={horizontal ? 'count' : 'label'}
      y={horizontal ? 'label' : 'count'}
      orientation={horizontal ? 'horizontal' : 'vertical'}
    />
  {/key}
</div>

<style>
  .ch-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 20px; }
  .ch-tab { font-size: 12.5px; color: var(--ink-2); background: none; border: 1px solid var(--rule-2); padding: 6px 14px; cursor: pointer; font-family: inherit; transition: .12s; }
  .ch-tab:hover { color: var(--ink); border-color: var(--rule-3); }
  .ch-tab.on { background: var(--spot); color: #fff; border-color: var(--spot); }
  .ch-box { width: 100%; border: 1px solid var(--rule); padding: 16px 14px 8px; --color-primary: var(--spot); }
  .ch-box :global(text) { fill: var(--ink-3); font-size: 11px; }
  .ch-box :global(.tick line), .ch-box :global(.rule line) { stroke: var(--rule); }
  .ch-box :global(.bar), .ch-box :global(rect.bar) { fill: var(--spot); }
</style>
