// Emit the large product dataset as a standalone, cacheable script.
//
// Inlining ~420KB of JSON into every catalog page made the HTML documents huge
// and slowed first paint. Writing it once to public/app-data.js keeps the
// documents small and lets the browser cache the dataset across all six
// language pages.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATA_JSON, I18N_JSON } from './render.mjs';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dir, '..', 'public', 'app-data.js');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `window.DATA=${DATA_JSON};window.I18N=${I18N_JSON};`);
console.log(`[assets] wrote ${path.relative(process.cwd(), OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
