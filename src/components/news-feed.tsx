import type { NewsItem } from "@/lib/validations/news";
import { NewsCard } from "@/components/news-card";

interface Props {
  items: readonly NewsItem[];
  heading?: string;
}

/** Responsive grid of news cards. */
export function NewsFeed({ items, heading = "최근 소식" }: Props) {
  if (items.length === 0) return null;
  return (
    <section aria-label={heading} className="mt-14">
      <h2 className="font-heading text-xl font-bold text-foreground">{heading}</h2>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
