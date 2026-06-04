import {
  FEED_CAP,
  type IncomingNews,
  type IncomingNewsItem,
  type NewsItem,
  type StoredNews,
} from "@/lib/validations/news";

/**
 * Tracking-param keys (case-insensitive) stripped during URL canonicalization.
 * These don't change the destination resource, so they must not affect dedup.
 */
const STRIP_PARAM_PATTERNS: RegExp[] = [
  /^utm_/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^ref$/i,
  /^ref_src$/i,
  /^igshid$/i,
];

/**
 * Returns a canonical form of a URL used **only** for deduplication comparisons.
 * The original URL is preserved on the NewsItem (display, click-through).
 *
 * Rules: lowercase host, strip tracking params, drop fragment, drop trailing
 * slash (except root), sort remaining query params.
 */
export function canonicalizeUrl(input: string): string {
  const u = new URL(input);
  u.host = u.host.toLowerCase();
  for (const key of Array.from(u.searchParams.keys())) {
    if (STRIP_PARAM_PATTERNS.some((re) => re.test(key))) {
      u.searchParams.delete(key);
    }
  }
  u.searchParams.sort();
  u.hash = "";
  if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
    u.pathname = u.pathname.replace(/\/+$/, "");
  }
  return u.toString();
}

/**
 * Promote an incoming item into the stored form by filling in tracking fields.
 * `now` is the merge timestamp used as the default firstSeenAt/lastSeenAt.
 */
function promoteIncoming(item: IncomingNewsItem, now: string): NewsItem {
  const firstSeenAt = item.firstSeenAt ?? now;
  const lastSeenAt = item.lastSeenAt ?? firstSeenAt;
  const seenCount = item.seenCount ?? 1;
  return { ...item, firstSeenAt, lastSeenAt, seenCount };
}

/**
 * Merge today's incoming batch into a previously accumulated feed.
 *
 * Dedup key: canonicalized URL.
 * - If an incoming URL already exists in `prev`: keep the stored entry's
 *   firstSeenAt, refresh display fields (title/dek/body/tags/imageUrl/
 *   publishedAt/source) from the freshest source, and bump lastSeenAt +
 *   seenCount.
 * - Otherwise: append the incoming item as a new entry.
 *
 * Output order: firstSeenAt desc (newest batch first). Within the same
 * firstSeenAt the Map insertion order is preserved via stable sort — for a
 * fresh batch that mirrors the editorial order of the incoming array.
 * Capped at FEED_CAP — oldest items past the cap are dropped.
 */
export function mergeAccumulated(
  prev: StoredNews | null,
  incoming: IncomingNews,
  now: string,
): StoredNews {
  const byKey = new Map<string, NewsItem>();
  for (const item of prev?.items ?? []) {
    byKey.set(canonicalizeUrl(item.url), item);
  }
  for (const raw of incoming.items) {
    const key = canonicalizeUrl(raw.url);
    const existing = byKey.get(key);
    if (existing) {
      byKey.set(key, {
        ...existing,
        // refresh display fields from the freshest source
        title: raw.title,
        dek: raw.dek,
        body: raw.body,
        tags: raw.tags,
        publishedAt: raw.publishedAt,
        source: raw.source,
        sourceDomain: raw.sourceDomain,
        imageUrl: raw.imageUrl ?? existing.imageUrl,
        // bump tracking
        lastSeenAt: now,
        seenCount: existing.seenCount + 1,
      });
    } else {
      byKey.set(key, promoteIncoming(raw, now));
    }
  }
  const items = Array.from(byKey.values())
    .sort((a, b) => b.firstSeenAt.localeCompare(a.firstSeenAt))
    .slice(0, FEED_CAP);
  return {
    generatedAt: incoming.generatedAt,
    timezone: incoming.timezone,
    items,
  };
}
