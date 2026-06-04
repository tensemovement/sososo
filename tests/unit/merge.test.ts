import { describe, it, expect } from "vitest";
import { mergeAccumulated } from "@/lib/news/merge";
import { FEED_CAP, type IncomingNews, type StoredNews } from "@/lib/validations/news";
import { makeIncomingItem, makeStoredItem } from "../fixtures/news";

function incoming(items: IncomingNews["items"]): IncomingNews {
  return { generatedAt: "2026-06-04T00:00:00.000Z", timezone: "Asia/Seoul", items };
}

function stored(items: StoredNews["items"]): StoredNews {
  return { generatedAt: "2026-06-03T00:00:00.000Z", timezone: "Asia/Seoul", items };
}

describe("mergeAccumulated", () => {
  const NOW = "2026-06-04T09:00:00.000Z";

  it("appends a brand-new item with tracking filled by the server", () => {
    const result = mergeAccumulated(null, incoming([makeIncomingItem()]), NOW);
    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    expect(item.firstSeenAt).toBe(NOW);
    expect(item.lastSeenAt).toBe(NOW);
    expect(item.seenCount).toBe(1);
  });

  it("dedupes by canonical URL: bumps seenCount, preserves firstSeenAt, refreshes display", () => {
    const prev = stored([
      makeStoredItem({
        url: "https://www.joongang.co.kr/article/1?utm_source=old",
        title: "옛 제목",
        firstSeenAt: "2026-06-01T00:00:00.000Z",
        lastSeenAt: "2026-06-01T00:00:00.000Z",
        seenCount: 2,
      }),
    ]);
    const result = mergeAccumulated(
      prev,
      incoming([
        makeIncomingItem({
          url: "https://www.joongang.co.kr/article/1?utm_source=new",
          title: "새 제목",
        }),
      ]),
      NOW,
    );
    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    expect(item.title).toBe("새 제목"); // display refreshed
    expect(item.firstSeenAt).toBe("2026-06-01T00:00:00.000Z"); // preserved
    expect(item.lastSeenAt).toBe(NOW); // bumped
    expect(item.seenCount).toBe(3); // 2 -> 3
  });

  it("sorts by firstSeenAt descending (newest batch first)", () => {
    const prev = stored([
      makeStoredItem({
        id: "old00001",
        url: "https://yna.co.kr/old",
        firstSeenAt: "2026-06-01T00:00:00.000Z",
      }),
    ]);
    const result = mergeAccumulated(
      prev,
      incoming([makeIncomingItem({ id: "new00001", url: "https://yna.co.kr/new" })]),
      NOW,
    );
    expect(result.items.map((i) => i.id)).toEqual(["new00001", "old00001"]);
  });

  it("caps the feed at FEED_CAP, dropping the oldest", () => {
    const prevItems = Array.from({ length: FEED_CAP }, (_, i) =>
      makeStoredItem({
        id: `prev${i}`,
        url: `https://yna.co.kr/p/${i}`,
        firstSeenAt: `2026-05-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
      }),
    );
    const result = mergeAccumulated(
      stored(prevItems),
      incoming([makeIncomingItem({ id: "fresh001", url: "https://yna.co.kr/fresh" })]),
      NOW,
    );
    expect(result.items).toHaveLength(FEED_CAP);
    expect(result.items[0].id).toBe("fresh001"); // newest kept
  });
});
