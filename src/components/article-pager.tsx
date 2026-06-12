import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NewsItem } from "@/lib/validations/news";

interface Props {
  /** Older article (published before the current one). */
  prev: NewsItem | null;
  /** Newer article (published after the current one). */
  next: NewsItem | null;
}

/**
 * Prev/next navigation at the bottom of an article detail page.
 * The feed is sorted newest-first, so "이전 소식" is the older neighbor and
 * "다음 소식" the newer one.
 */
export function ArticlePager({ prev, next }: Props) {
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="이전·다음 소식"
      className="mt-10 grid gap-3 border-t border-border pt-8 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          href={`/news/${prev.id}`}
          className="group flex flex-col gap-1.5 rounded-2xl border border-border p-5 transition-colors hover:bg-secondary/50"
        >
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ChevronLeft className="size-3.5" aria-hidden />
            이전 소식
          </span>
          <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div aria-hidden className="hidden sm:block" />
      )}
      {next ? (
        <Link
          href={`/news/${next.id}`}
          className="group flex flex-col gap-1.5 rounded-2xl border border-border p-5 text-right transition-colors hover:bg-secondary/50"
        >
          <span className="inline-flex items-center justify-end gap-1 text-xs text-muted-foreground">
            다음 소식
            <ChevronRight className="size-3.5" aria-hidden />
          </span>
          <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
            {next.title}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
