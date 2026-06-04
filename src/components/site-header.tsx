import Link from "next/link";
import { absoluteDate } from "@/lib/format";

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
          <Link href="/" className="inline-flex items-baseline gap-0.5">
            <span className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
              소소
            </span>
            <span className="font-heading text-3xl font-extrabold tracking-tight text-primary">
              .소
            </span>
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            소소한 소식, 매일 아침 전하는 따뜻한 뉴스
          </p>
        </div>
        {generatedAt && (
          <p className="text-sm text-muted-foreground sm:text-right">
            {absoluteDate(generatedAt)} 기준
          </p>
        )}
      </div>
    </header>
  );
}
