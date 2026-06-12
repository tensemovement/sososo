import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { loadNews } from "@/services/news.service";
import type { NewsItem } from "@/lib/validations/news";
import { absoluteDate } from "@/lib/format";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TagPill } from "@/components/tag-pill";
import { SourceAttribution } from "@/components/source-attribution";
import { ArticlePager } from "@/components/article-pager";

export const revalidate = false;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const data = await loadNews();
  return data.items.map((item) => ({ id: item.id }));
}

async function findItem(id: string): Promise<NewsItem | null> {
  const data = await loadNews();
  return data.items.find((item) => item.id === id) ?? null;
}

interface NewsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  props: NewsPageProps,
): Promise<Metadata> {
  const { id } = await props.params;
  const item = await findItem(id);
  if (!item) return { title: "소식을 찾을 수 없어요" };
  return {
    title: item.title,
    description: item.dek,
    openGraph: {
      title: item.title,
      description: item.dek,
      type: "article",
      images: item.imageUrl ? [{ url: item.imageUrl }] : undefined,
    },
  };
}

export default async function NewsDetailPage(props: NewsPageProps) {
  const { id } = await props.params;
  const data = await loadNews();
  // Feed is sorted firstSeenAt desc, so index+1 is the older neighbor and
  // index-1 the newer one.
  const index = data.items.findIndex((it) => it.id === id);
  if (index === -1) notFound();
  const item = data.items[index];
  const older = data.items[index + 1] ?? null;
  const newer = index > 0 ? data.items[index - 1] : null;

  // Body has no hard line breaks (routine rule); split on blank lines for
  // robustness, falling back to a single paragraph.
  const paragraphs = item.body.split(/\n{2,}/).filter(Boolean);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-8">
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          모든 소식
        </Link>

        <article className="mt-6">
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <TagPill key={tag} tag={tag} size="md" />
            ))}
          </div>

          <h1 className="mt-4 font-heading text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
            {item.title}
          </h1>

          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground/80">{item.source}</span>
            <span aria-hidden>·</span>
            <time dateTime={item.publishedAt}>{absoluteDate(item.publishedAt)}</time>
          </div>

          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary outlet image hosts.
            <img
              src={item.imageUrl}
              alt=""
              className="mt-7 w-full rounded-3xl object-cover"
              loading="eager"
            />
          ) : null}

          <p className="mt-7 text-lg font-medium leading-relaxed text-foreground/90">
            {item.dek}
          </p>

          <div className="mt-5 space-y-5 text-base leading-loose text-foreground/85">
            {paragraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <SourceAttribution source={item.source} url={item.url} />
        </article>

        <ArticlePager prev={older} next={newer} />
      </main>
      <SiteFooter />
    </>
  );
}
