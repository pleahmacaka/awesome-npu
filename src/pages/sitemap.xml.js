import { buildSitemap } from '../../scripts/render.mjs';

export const prerender = true;
export function GET() {
  const today = new Date().toISOString().slice(0, 10);
  return new Response(buildSitemap(today), { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
