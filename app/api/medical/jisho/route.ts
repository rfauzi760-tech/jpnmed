import { NextResponse } from 'next/server';

/** Optional vocabulary helper. Jisho results are drafts, never verified content. */
export async function GET(request: Request) {
  const keyword = new URL(request.url).searchParams.get('keyword')?.trim() ?? '';
  if (!keyword || keyword.length > 80) return NextResponse.json({ entries: [], error: 'Enter a shorter search term.' }, { status: 400 });
  try {
    const response = await fetch(`https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`, { next: { revalidate: 86400 } });
    if (!response.ok) return NextResponse.json({ entries: [], error: 'Jisho is unavailable.' }, { status: 502 });
    const payload = (await response.json()) as { data?: { japanese?: { word?: string; reading?: string }[]; senses?: { english_definitions?: string[] }[] }[] };
    const entries = (payload.data ?? []).slice(0, 8).map((entry) => ({
      japanese: entry.japanese?.[0]?.word ?? entry.japanese?.[0]?.reading ?? keyword,
      kana: entry.japanese?.[0]?.reading ?? '',
      english: entry.senses?.[0]?.english_definitions?.join('; ') ?? '',
      verificationStatus: 'draft' as const,
      source: 'Jisho',
    }));
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ entries: [], error: 'Jisho is unavailable.' }, { status: 502 });
  }
}
