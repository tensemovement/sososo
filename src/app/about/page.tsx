import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, PenLine, Link2, Mail, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const NEWSLETTER_URL = "https://maily.so/tt.sososo";

export const metadata: Metadata = {
  title: "소개",
  description:
    "소소.소는 좋은 소식을 골라 전문적이되 따뜻한 톤으로 다시 정리하는 뉴스 아카이브입니다. 모든 소식은 원문 출처를 함께 밝힙니다.",
  openGraph: {
    title: "소소.소 소개",
    description:
      "좋은 소식을 골라 다시 정리하는 따뜻한 뉴스 아카이브, 소소.소를 소개합니다.",
    type: "website",
  },
};

/** What 소소.소 does, in three steps. */
const WORK = [
  {
    icon: Newspaper,
    title: "골라 담습니다",
    body: "쏟아지는 뉴스 속에서, 읽고 나면 마음이 조금 따뜻해지는 소식을 골라냅니다.",
  },
  {
    icon: PenLine,
    title: "다시 정리합니다",
    body: "전문적인 시선은 지키되, 어렵고 차가운 문장을 누구나 편히 읽을 수 있게 다시 씁니다.",
  },
  {
    icon: Link2,
    title: "출처를 밝힙니다",
    body: "모든 소식은 원문 보도를 요약 정리한 것입니다. 출처와 원문 링크를 늘 함께 답니다.",
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-8">
        {/* Lead */}
        <section className="mt-10 text-center">
          <span className="inline-flex items-baseline gap-0.5">
            <span className="font-heading text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
              소소
            </span>
            <span className="font-heading text-4xl font-extrabold tracking-tight text-primary md:text-5xl">
              .소
            </span>
          </span>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            소소한 소식, 마음이 따뜻해지는 뉴스
          </p>
          <p className="mx-auto mt-6 max-w-xl text-base leading-loose text-foreground/85 md:text-lg">
            좋은 소식을 만날 때마다, 마음이 따뜻해지는 이야기를 골라 다시
            정리합니다. 크고 시끄러운 뉴스가 아니라, 곁에서 일어나는 작고 단단한
            이야기를 담는 곳입니다.
          </p>
        </section>

        {/* What we do */}
        <section className="mt-14">
          <h2 className="font-heading text-2xl font-extrabold text-foreground md:text-3xl">
            우리가 하는 일
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {WORK.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-3xl border border-border bg-card p-6"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-secondary/60 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* What "warm" means */}
        <section className="mt-14 overflow-hidden rounded-3xl border border-border bg-card">
          <div className="h-1.5 w-full bg-gradient-warm" />
          <div className="p-7 md:p-9">
            <h2 className="font-heading text-2xl font-extrabold text-foreground md:text-3xl">
              ‘따뜻함’이란
            </h2>
            <p className="mt-4 text-base leading-loose text-foreground/85">
              따뜻함은 단지 훈훈한 미담만을 뜻하지 않습니다. 누군가의 손을 잡아주는
              연대, 작은 부정의를 바로잡는 정의, 묵묵히 제 몫을 다하는 성실함까지.
              읽고 난 뒤 세상을 조금 더 믿고 싶어지는 이야기라면, 우리에게는 모두
              따뜻한 소식입니다.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-14 rounded-3xl border border-border bg-secondary/40 p-7 text-center md:p-9">
          <h2 className="font-heading text-2xl font-extrabold text-foreground">
            따뜻한 소식, 함께 받아보세요
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            새 소식이 쌓이면 뉴스레터로 가장 먼저 전해드립니다.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={NEWSLETTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-warm px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <Mail className="size-4" aria-hidden />
              뉴스레터 구독하기
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              모든 소식 보기
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
