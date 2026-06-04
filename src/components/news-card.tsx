import Link from "next/link";
import type { NewsItem } from "@/lib/validations/news";
import { relativeTime } from "@/lib/format";
import { TagPill } from "@/components/tag-pill";

interface Props {
  item: NewsItem;
}

/**
 * Feed card: optional thumbnail, warm title, dek, tags, and source · date.
 * Items without an imageUrl render as a clean text-only card (no placeholder).
 */
export function NewsCard({ item }: Props) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-[0_8px_30px_rgb(0_0_0/0.06)]">
      <Link href={`/news/${item.id}`} className="flex h-full flex-col">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- news og:images come from many outlet domains; avoid per-host remotePatterns config.
          <img
            src={item.imageUrl}
            alt=""
            className="aspect-[16/10] w-full object-cover"
            loading="lazy"
          />
        ) : null}
        <div className="flex flex-1 flex-col gap-3 p-5">
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <TagPill key={tag} tag={tag} asText />
              ))}
            </div>
          )}
          <h3 className="font-heading text-lg font-bold leading-snug text-foreground group-hover:text-primary">
            {item.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {item.dek}
          </p>
          <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">{item.source}</span>
            <span aria-hidden>·</span>
            <time dateTime={item.publishedAt}>{relativeTime(item.publishedAt)}</time>
          </div>
        </div>
      </Link>
    </article>
  );
}
