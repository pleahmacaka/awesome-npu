import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// Awesome NPU — GitHub Pages project site at https://pleahmacaka.github.io/awesome-npu/
export default defineConfig({
  site: 'https://pleahmacaka.github.io',
  base: '/awesome-npu',
  trailingSlash: 'always',
  output: 'static',
  integrations: [svelte()],
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
