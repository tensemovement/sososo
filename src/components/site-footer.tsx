import Image from "next/image";
import Link from "next/link";

/** Quiet footer with the project's intent and an attribution note. */
export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt=""
            width={24}
            height={24}
            className="h-6 w-6"
          />
          <p className="font-heading text-base font-bold text-foreground">
            소소.소, 소소한 소식
          </p>
        </div>
        <p className="mt-2 max-w-xl leading-relaxed">
          좋은 소식을 만날 때마다, 마음이 따뜻해지는 이야기를 골라 다시 정리합니다.
          <br />
          모든 소식은 원문 출처를 함께 밝힙니다.
        </p>
        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="/about"
            className="font-medium text-foreground transition-opacity hover:opacity-80"
          >
            소개
          </Link>
          <a
            href="https://maily.so/tt.sososo"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary transition-opacity hover:opacity-80"
          >
            뉴스레터 구독하기 →
          </a>
        </p>
        <p className="mt-4 text-xs text-muted-foreground/80">
          ©{" "}
          <a
            href="https://tensemovement.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-primary"
          >
            TENSE MOVEMENT
          </a>{" "}
          2024. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
