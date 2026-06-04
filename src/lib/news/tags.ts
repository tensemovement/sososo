/**
 * Controlled tag vocabulary for warm news. The collection routine may only emit
 * tags from this list (enforced by the Zod schema), which keeps the tag set
 * stable, makes `/tags/[tag]` statically generable, and guarantees an
 * exhaustive tag → color mapping below.
 */
export const WARM_TAGS = [
  "나눔",
  "선행",
  "이웃",
  "공동체",
  "자원봉사",
  "환경",
  "동물",
  "회복",
  "극복",
  "청년",
  "교육",
  "의료",
  "가족",
  "반려",
  "지역",
  "문화",
] as const;

export type WarmTag = (typeof WARM_TAGS)[number];

const TAG_SET: ReadonlySet<string> = new Set(WARM_TAGS);

export function isWarmTag(value: string): value is WarmTag {
  return TAG_SET.has(value);
}

export interface TagStyle {
  /** Soft pastel background. */
  readonly bg: string;
  /** Readable foreground on the pastel background. */
  readonly fg: string;
}

/**
 * Pastel color per tag, applied as inline styles (Tailwind v4 purges
 * dynamically-built class names, so static style objects are used instead).
 * Hues echo the "warm + tidy" reference: peach, butter, mint, sky, lavender.
 */
export const TAG_STYLES: Record<WarmTag, TagStyle> = {
  나눔: { bg: "#FCE7D8", fg: "#9A4A1E" },
  선행: { bg: "#FBE3C7", fg: "#94511A" },
  이웃: { bg: "#FDE6E1", fg: "#9E3F3A" },
  공동체: { bg: "#F3E8FB", fg: "#6B3F9E" },
  자원봉사: { bg: "#E7F0FB", fg: "#2F5B95" },
  환경: { bg: "#DFF1E4", fg: "#2C6B43" },
  동물: { bg: "#FBEFD2", fg: "#8A6310" },
  회복: { bg: "#E6F3F1", fg: "#2A6E68" },
  극복: { bg: "#FBE0E8", fg: "#9C3A5C" },
  청년: { bg: "#E8F1DA", fg: "#4F6B27" },
  교육: { bg: "#E4EEFB", fg: "#33548C" },
  의료: { bg: "#E7F4F0", fg: "#2B6B5C" },
  가족: { bg: "#FCEAD9", fg: "#955019" },
  반려: { bg: "#F6EAD6", fg: "#7E5A1B" },
  지역: { bg: "#EAF0E3", fg: "#4C6238" },
  문화: { bg: "#F1E8F8", fg: "#6A4292" },
};

export function tagStyle(tag: WarmTag): TagStyle {
  return TAG_STYLES[tag];
}
