export interface WhitelistEntry {
  readonly domain: string;
  readonly displayName: string;
}

/**
 * Trusted Korean news outlets. The collection routine only keeps articles whose
 * host matches one of these domains; `sourceDomain` on every stored item must be
 * one of these values (enforced by the Zod schema in `@/lib/validations/news`).
 */
export const KOREAN_NEWS_WHITELIST: readonly WhitelistEntry[] = [
  { domain: "yna.co.kr", displayName: "연합뉴스" },
  { domain: "kbs.co.kr", displayName: "KBS" },
  { domain: "sbs.co.kr", displayName: "SBS" },
  { domain: "imbc.com", displayName: "MBC" },
  { domain: "chosun.com", displayName: "조선일보" },
  { domain: "joongang.co.kr", displayName: "중앙일보" },
  { domain: "donga.com", displayName: "동아일보" },
  { domain: "hani.co.kr", displayName: "한겨레" },
  { domain: "khan.co.kr", displayName: "경향신문" },
  { domain: "hankyung.com", displayName: "한국경제" },
  { domain: "mk.co.kr", displayName: "매일경제" },
  { domain: "sedaily.com", displayName: "서울경제" },
  { domain: "edaily.co.kr", displayName: "이데일리" },
  { domain: "mt.co.kr", displayName: "머니투데이" },
  { domain: "ohmynews.com", displayName: "오마이뉴스" },
  { domain: "pressian.com", displayName: "프레시안" },
  { domain: "ytn.co.kr", displayName: "YTN" },
  { domain: "news1.kr", displayName: "뉴스1" },
  { domain: "newsis.com", displayName: "뉴시스" },
  { domain: "hankookilbo.com", displayName: "한국일보" },
] as const;

/**
 * Returns the whitelist entry whose domain matches the given host, allowing
 * subdomains (e.g. `news.kbs.co.kr` matches `kbs.co.kr`). Returns null if none.
 */
export function findWhitelistMatch(host: string): WhitelistEntry | null {
  const h = host.toLowerCase();
  for (const entry of KOREAN_NEWS_WHITELIST) {
    if (h === entry.domain || h.endsWith("." + entry.domain)) {
      return entry;
    }
  }
  return null;
}
