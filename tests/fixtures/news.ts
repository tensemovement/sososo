import type { IncomingNewsItem, NewsItem } from "@/lib/validations/news";

/** A body guaranteed to satisfy the 200..1500 char schema bound. */
export const VALID_BODY =
  "한 시민이 어려운 이웃을 위해 묵묵히 선행을 이어온 사연이 전해졌다. ".repeat(8);

export function makeIncomingItem(
  overrides: Partial<IncomingNewsItem> = {},
): IncomingNewsItem {
  return {
    id: "abcd1234",
    title: "따뜻한 소식의 제목",
    dek: "마음이 따뜻해지는 짧은 요약입니다.",
    body: VALID_BODY,
    tags: ["나눔"],
    url: "https://www.joongang.co.kr/article/12345",
    source: "중앙일보",
    sourceDomain: "joongang.co.kr",
    publishedAt: "2026-06-03T08:00:00.000Z",
    ...overrides,
  };
}

export function makeStoredItem(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    ...makeIncomingItem(),
    firstSeenAt: "2026-06-03T09:00:00.000Z",
    lastSeenAt: "2026-06-03T09:00:00.000Z",
    seenCount: 1,
    ...overrides,
  };
}
