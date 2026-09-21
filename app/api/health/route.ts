import { CONTENT_STATS, checkContentIntegrity } from '@/lib/content';

/* ------------------------------------------------------------------
   Content integrity endpoint (QA_ACCEPTANCE §13). Reports duplicate ids,
   broken relationships and missing translations so the dataset can be
   checked without reading the source files.
------------------------------------------------------------------ */

export function GET() {
  const issues = checkContentIntegrity();
  const errors = issues.filter((issue) => issue.level === 'error');
  const warnings = issues.filter((issue) => issue.level === 'warning');
  return Response.json(
    {
      ok: errors.length === 0,
      stats: CONTENT_STATS,
      counts: { errors: errors.length, warnings: warnings.length },
      issues,
    },
    { status: errors.length === 0 ? 200 : 500 },
  );
}
