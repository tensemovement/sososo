import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { absoluteDate } from "@/lib/format";

/** Newsletter subscription page (Maily). */
const NEWSLETTER_URL = "https://maily.so/tt.sososo";

interface Props {
  /** ISO timestamp of the latest feed generation, shown as "오늘의 소식" date. */
  generatedAt?: string;
}

/**
 * Site masthead: the signature warm gradient rule on top, the 소소.소 wordmark,
 * and a gentle tagline. Kept calm and tidy per the design references.
 */
export function SiteHeader({ generatedAt }: Props) {
  return (
    <header className="border-b border-border bg-paper">
      <div className="h-1.5 w-full bg-gradient-warm" />
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="소소.소 로고"
              width={40}
              height={40}
              priority
              className="h-10 w-10"
            />
            <span className="inline-flex items-baseline gap-0.5">
              <span className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
                소소
              </span>
              <span className="font-heading text-3xl font-extrabold tracking-tight text-primary">
                .소
              </span>
            </span>
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            소소한 소식, 마음이 따뜻해지는 뉴스
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <a
            href={NEWSLETTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 self-start rounded-full bg-gradient-warm px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:self-auto"
          >
            <Mail className="h-4 w-4" />
            뉴스레터 구독하기
          </a>
          {generatedAt && (
            <p className="text-sm text-muted-foreground sm:text-right">
              {absoluteDate(generatedAt)} 기준
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
