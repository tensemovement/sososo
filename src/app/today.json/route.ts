import { NextResponse } from "next/server";
import { loadNews } from "@/services/news.service";

export const runtime = "nodejs";

/**
 * Public read-only proxy for the accumulated feed. Mirrors what the homepage
 * renders, as machine-readable JSON. Revalidated on demand by /api/upload.
 */
export async function GET(): Promise<NextResponse> {
  const data = await loadNews();
  return NextResponse.json(data, {
    headers: {
      "cache-control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
