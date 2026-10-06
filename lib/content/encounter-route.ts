/** Build an entry URL for the structured encounter flow at its HPI stage. */
export function encounterSubjectHref(subjectId?: string | null): string {
  if (!subjectId) return '/medical/encounter';
  return `/medical/encounter?subject=${encodeURIComponent(subjectId)}&step=hpi`;
}
