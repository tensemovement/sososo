/** Quiet footer with the project's intent and an attribution note. */
export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-muted-foreground">
        <p className="font-heading text-base font-bold text-foreground">
          소소.소, 소소한 소식
        </p>
        <p className="mt-2 max-w-xl leading-relaxed">
          매일 아침, 마음이 따뜻해지는 소식을 골라 여러분께 전합니다. 모든 소식은
          원문 출처를 함께 밝힙니다.
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
