import { describe, it, expect } from "vitest";
import { canonicalizeUrl } from "@/lib/news/merge";

describe("canonicalizeUrl", () => {
  it("strips tracking params (utm_*, fbclid, gclid)", () => {
    const a = canonicalizeUrl(
      "https://www.joongang.co.kr/article/1?utm_source=x&utm_medium=y&id=9",
    );
    const b = canonicalizeUrl("https://www.joongang.co.kr/article/1?id=9");
    expect(a).toBe(b);
  });

  it("ignores fragment and query order", () => {
    const a = canonicalizeUrl("https://yna.co.kr/v?b=2&a=1#section");
    const b = canonicalizeUrl("https://yna.co.kr/v?a=1&b=2");
    expect(a).toBe(b);
  });

  it("drops trailing slash except root, lowercases host", () => {
    expect(canonicalizeUrl("https://YNA.co.kr/path/")).toBe(
      "https://yna.co.kr/path",
    );
  });

  it("treats genuinely different URLs as different", () => {
    expect(canonicalizeUrl("https://yna.co.kr/a")).not.toBe(
      canonicalizeUrl("https://yna.co.kr/b"),
    );
  });
});
