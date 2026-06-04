import { WARM_TAGS, type WarmTag } from "@/lib/news/tags";
import { TagPill } from "@/components/tag-pill";

interface Props {
  /** Only show tags that actually appear in the feed (keeps the bar honest). */
  available?: ReadonlySet<string>;
  /** Tag currently being viewed (rendered as inert text, not a link). */
  active?: WarmTag;
}

/** Horizontal tag filter. Tags route to /tags/[tag]. */
export function TagBar({ available, active }: Props) {
  const tags = available
    ? WARM_TAGS.filter((t) => available.has(t))
    : WARM_TAGS;
  if (tags.length === 0) return null;
  return (
    <nav aria-label="태그" className="mt-6 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <TagPill key={tag} tag={tag} asText={tag === active} size="md" />
      ))}
    </nav>
  );
}
