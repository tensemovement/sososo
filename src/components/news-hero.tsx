import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { NewsItem } from "@/lib/validations/news";
import { relativeTime } from "@/lib/format";
import { TagPill } from "@/components/tag-pill";

interface Props {
  item: NewsItem;
}

/**
 * The day's lead warm story — large image, oversized serif headline, dek.
 * Mirrors the editorial "hero" of the reference blog layout.
 */
export function NewsHero({ item }: Props) {
  return (
    <section aria-label="오늘의 따뜻한 소식" className="mt-8">
      <Link
        href={`/news/${item.id}`}
        className="group grid grid-cols-1 gap-6 overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-2 md:gap-0"
      >
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary outlet image hosts; see news-card.
          <img
            src={item.imageUrl}
            alt=""
            className="aspect-[16/11] w-full object-cover md:aspect-auto md:h-full"
            loading="eager"
          />
        ) : (
          <div className="hidden bg-gradient-warm opacity-90 md:block" />
        )}
        <div className="flex flex-col justify-center gap-4 p-7 md:p-10">
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <TagPill key={tag} tag={tag} asText size="md" />
              ))}
            </div>
          )}
          <h2 className="font-heading text-3xl font-extrabold leading-tight text-foreground group-hover:text-primary md:text-4xl">
            {item.title}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            {item.dek}
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground/80">{item.source}</span>
            <span aria-hidden>·</span>
            <time dateTime={item.publishedAt}>{relativeTime(item.publishedAt)}</time>
            <ArrowUpRight
              className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </div>
        </div>
      </Link>
    </section>
  );
}
