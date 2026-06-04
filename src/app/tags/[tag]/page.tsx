import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { loadNews } from "@/services/news.service";
import { filterByTag } from "@/lib/validations/news";
import { WARM_TAGS, isWarmTag } from "@/lib/news/tags";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NewsFeed } from "@/components/news-feed";
import { TagBar } from "@/components/tag-bar";
import { EmptyState } from "@/components/empty-state";

export const revalidate = false;

export function generateStaticParams(): { tag: string }[] {
  return WARM_TAGS.map((tag) => ({ tag }));
}

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata(
  props: TagPageProps,
): Promise<Metadata> {
  const { tag } = await props.params;
  const decoded = decodeURIComponent(tag);
  return { title: `${decoded} 소식` };
}

export default async function TagPage(props: TagPageProps) {
  const { tag } = await props.params;
  const decoded = decodeURIComponent(tag);
  if (!isWarmTag(decoded)) notFound();

  const data = await loadNews();
  const items = filterByTag(data.items, decoded);
  const available = new Set(data.items.flatMap((item) => item.tags));

  return (
    <>
      <SiteHeader generatedAt={data.generatedAt} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-8">
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          모든 소식
        </Link>

        <h1 className="mt-5 font-heading text-3xl font-extrabold text-foreground">
          <span className="text-primary">#{decoded}</span> 소식
        </h1>

        <TagBar available={available} active={decoded} />

        {items.length === 0 ? (
          <EmptyState
            title={`아직 '${decoded}' 소식이 없어요`}
            message="다른 태그의 따뜻한 소식을 둘러보세요."
          />
        ) : (
          <NewsFeed items={items} heading={`'${decoded}' 소식 ${items.length}건`} />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
