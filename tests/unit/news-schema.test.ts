import { describe, it, expect } from "vitest";
import {
  IncomingNewsItemSchema,
  NewsItemSchema,
  LoadedNewsSchema,
} from "@/lib/validations/news";
import { makeIncomingItem, VALID_BODY } from "../fixtures/news";

describe("IncomingNewsItemSchema", () => {
  it("accepts a valid item without tracking fields", () => {
    expect(IncomingNewsItemSchema.safeParse(makeIncomingItem()).success).toBe(true);
  });

  it("rejects non-https url", () => {
    const r = IncomingNewsItemSchema.safeParse(
      makeIncomingItem({ url: "http://www.joongang.co.kr/a" }),
    );
    expect(r.success).toBe(false);
  });

  it("rejects a non-whitelisted source domain", () => {
    const r = IncomingNewsItemSchema.safeParse(
      makeIncomingItem({ sourceDomain: "example.com" }),
    );
    expect(r.success).toBe(false);
  });

  it("rejects tags outside the controlled vocabulary", () => {
    const r = IncomingNewsItemSchema.safeParse(
      // @ts-expect-error — intentionally invalid tag
      makeIncomingItem({ tags: ["정치"] }),
    );
    expect(r.success).toBe(false);
  });

  it("rejects a body shorter than 200 chars", () => {
    const r = IncomingNewsItemSchema.safeParse(makeIncomingItem({ body: "너무 짧음" }));
    expect(r.success).toBe(false);
  });

  it("rejects a body longer than 1500 chars", () => {
    const r = IncomingNewsItemSchema.safeParse(
      makeIncomingItem({ body: "가".repeat(1501) }),
    );
    expect(r.success).toBe(false);
  });

  it("rejects more than 4 tags", () => {
    const r = IncomingNewsItemSchema.safeParse(
      makeIncomingItem({ tags: ["나눔", "선행", "이웃", "공동체", "환경"] }),
    );
    expect(r.success).toBe(false);
  });
});

describe("NewsItemSchema (stored)", () => {
  it("requires tracking fields", () => {
    const r = NewsItemSchema.safeParse(makeIncomingItem());
    expect(r.success).toBe(false);
  });
});

describe("LoadedNewsSchema", () => {
  it("fills missing tracking fields from publishedAt", () => {
    const parsed = LoadedNewsSchema.parse({
      generatedAt: "2026-06-04T00:00:00.000Z",
      timezone: "Asia/Seoul",
      items: [
        {
          id: "abcd1234",
          title: "제목",
          dek: "요약",
          body: VALID_BODY,
          tags: ["나눔"],
          url: "https://www.joongang.co.kr/a",
          source: "중앙일보",
          sourceDomain: "joongang.co.kr",
          publishedAt: "2026-06-02T00:00:00.000Z",
        },
      ],
    });
    const item = parsed.items[0];
    expect(item.firstSeenAt).toBe("2026-06-02T00:00:00.000Z");
    expect(item.lastSeenAt).toBe("2026-06-02T00:00:00.000Z");
    expect(item.seenCount).toBe(1);
  });
});
