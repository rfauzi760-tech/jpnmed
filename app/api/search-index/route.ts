import { buildSearchIndex } from '@/lib/search';

/* ------------------------------------------------------------------
   The full search index, built once per server process and cached by the
   browser. It is only fetched the first time the command palette opens,
   so no page pays for it.
------------------------------------------------------------------ */

let cached: ReturnType<typeof buildSearchIndex> | null = null;

export function GET() {
  if (!cached) cached = buildSearchIndex();
  return Response.json({ docs: cached, builtAt: new Date().toISOString() });
}
