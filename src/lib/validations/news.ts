import { z } from "zod";
import { KOREAN_NEWS_WHITELIST } from "@/lib/news/whitelist";
import { WARM_TAGS } from "@/lib/news/tags";

const ALLOWED_DOMAINS = new Set(
  KOREAN_NEWS_WHITELIST.map((entry) => entry.domain),
);

/** Max items kept in the accumulated feed on S3 (oldest dropped past this). */
export const FEED_CAP = 300;

/** Max items the daily routine may submit in one batch. */
export const INCOMING_CAP = 12;

const httpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"), {
    message: "url must use https",
  });

const baseFields = {
  /** sha1(url) first 8 chars. */
  id: z.string().min(1),
  /** Warm, rewritten headline (never the source's verbatim title). */
  title: z.string().min(1).max(120),
  /** Short card summary / lead-in. */
  dek: z.string().min(1).max(180),
  /** Full warm editorial rewrite — this is our content, not the source's. */
  body: z.string().min(200).max(1500),
  /** 1–4 tags drawn from the controlled WARM_TAGS vocabulary. */
  tags: z.array(z.enum(WARM_TAGS)).min(1).max(4),
  /** Source article URL (attribution / click-through). */
  url: httpsUrl,
  /** Display name of the source outlet, e.g. "중앙일보". */
  source: z.string().min(1).max(40),
  /** Whitelisted source domain. */
  sourceDomain: z
    .string()
    .min(1)
    .refine((d) => ALLOWED_DOMAINS.has(d), {
      message: "sourceDomain must be a whitelisted Korean news outlet",
    }),
  publishedAt: z.string().datetime(),
  imageUrl: z
    .string()
    .url()
    .refine((u) => u.startsWith("https://"), {
      message: "imageUrl must use https",
    })
    .optional(),
};

const trackingFieldsRequired = {
  firstSeenAt: z.string().datetime(),
  lastSeenAt: z.string().datetime(),
  seenCount: z.number().int().min(1),
};

const trackingFieldsOptional = {
  firstSeenAt: z.string().datetime().optional(),
  lastSeenAt: z.string().datetime().optional(),
  seenCount: z.number().int().min(1).optional(),
};

/**
 * Incoming form — what the daily routine POSTs to /api/upload.
 * Tracking fields are optional; the server fills them on merge.
 */
export const IncomingNewsItemSchema = z.object({
  ...baseFields,
  ...trackingFieldsOptional,
});

export const IncomingNewsSchema = z.object({
  generatedAt: z.string().datetime(),
  timezone: z.literal("Asia/Seoul"),
  items: z.array(IncomingNewsItemSchema).min(1).max(INCOMING_CAP),
});

/**
 * Stored form — the canonical accumulated feed on S3, and what the app reads.
 * Tracking fields are required.
 */
export const NewsItemSchema = z.object({
  ...baseFields,
  ...trackingFieldsRequired,
});

export const StoredNewsSchema = z.object({
  generatedAt: z.string().datetime(),
  timezone: z.literal("Asia/Seoul"),
  items: z.array(NewsItemSchema).min(1).max(FEED_CAP),
});

/**
 * Loaded form — used when reading the S3 object. Tracking fields may be missing
 * for legacy payloads written before accumulation existed; the schema fills
 * them via .transform() so consumers always receive the canonical form.
 */
const LoadedNewsItemSchema = z
  .object({ ...baseFields, ...trackingFieldsOptional })
  .transform((item) => {
    const firstSeenAt = item.firstSeenAt ?? item.publishedAt;
    const lastSeenAt = item.lastSeenAt ?? firstSeenAt;
    const seenCount = item.seenCount ?? 1;
    return { ...item, firstSeenAt, lastSeenAt, seenCount };
  });

export const LoadedNewsSchema = z.object({
  generatedAt: z.string().datetime(),
  timezone: z.literal("Asia/Seoul"),
  items: z.array(LoadedNewsItemSchema).min(1).max(FEED_CAP),
});

export type NewsItem = z.infer<typeof NewsItemSchema>;
export type StoredNews = z.infer<typeof StoredNewsSchema>;
export type IncomingNewsItem = z.infer<typeof IncomingNewsItemSchema>;
export type IncomingNews = z.infer<typeof IncomingNewsSchema>;

/**
 * Returns the featured (lead) item. After accumulation, items are sorted by
 * firstSeenAt desc, so the first item is the freshest editorial top.
 */
export function pickFeatured(items: readonly NewsItem[]): NewsItem {
  const first = items[0];
  if (!first) {
    throw new Error("pickFeatured: empty feed");
  }
  return first;
}

/** Items carrying the given tag, preserving feed order. */
export function filterByTag(
  items: readonly NewsItem[],
  tag: string,
): NewsItem[] {
  return items.filter((item) => (item.tags as readonly string[]).includes(tag));
}
