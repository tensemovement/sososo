import Link from "next/link";
import { tagStyle, type WarmTag } from "@/lib/news/tags";

interface Props {
  tag: WarmTag;
  /** Render as a non-link span (e.g. when already on that tag's page). */
  asText?: boolean;
  size?: "sm" | "md";
}

/**
 * A soft pastel tag chip. Colors come from the controlled TAG_STYLES map and
 * are applied as inline styles (Tailwind v4 purges dynamic class names).
 */
export function TagPill({ tag, asText = false, size = "sm" }: Props) {
  const style = tagStyle(tag);
  const sizing = size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs";
  const className = `inline-flex items-center rounded-full font-medium ${sizing}`;
  const inline = { backgroundColor: style.bg, color: style.fg };

  if (asText) {
    return (
      <span className={className} style={inline}>
        {tag}
      </span>
    );
  }
  return (
    <Link
      href={`/tags/${encodeURIComponent(tag)}`}
      className={`${className} transition-opacity hover:opacity-80`}
      style={inline}
    >
      {tag}
    </Link>
  );
}
