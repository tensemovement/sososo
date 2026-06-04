import type { Metadata } from "next";
import { loadNews } from "@/services/news.service";
import { pickFeatured } from "@/lib/validations/news";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NewsHero } from "@/components/news-hero";
import { NewsFeed } from "@/components/news-feed";
import { TagBar } from "@/components/tag-bar";
import { EmptyState } from "@/components/empty-state";

// Statically rendered; refreshed on demand by /api/upload via revalidatePath.
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  const data = await loadNews();
  const featured = data.items[0];
  return {
    description: featured?.dek,
  };
}

export default async function HomePage() {
  const data = await loadNews();
  const items = data.items;
  const available = new Set(items.flatMap((item) => item.tags));

  return (
    <>
      <SiteHeader generatedAt={data.generatedAt} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-8">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <NewsHero item={pickFeatured(items)} />
            <TagBar available={available} />
            <NewsFeed items={items.slice(1)} />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
