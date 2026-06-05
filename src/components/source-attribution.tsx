import { ArrowUpRight } from "lucide-react";

interface Props {
  source: string;
  url: string;
}

/**
 * Source credit + click-through to the original article. The body on our site
 * is a warm rewrite, so attribution is mandatory: we always link back to the
 * outlet's reporting (rel="nofollow" since it's an external credit link).
 */
export function SourceAttribution({ source, url }: Props) {
  return (
    <div className="mt-10 rounded-2xl border border-border bg-secondary/50 p-5">
      <p className="text-sm text-muted-foreground">
        이 소식은 <span className="font-medium text-foreground">{source}</span>{" "}
        보도를 소소.소가 요약 정리했습니다. 자세한 내용은 원문에서 확인하세요.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener nofollow"
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        {source} 원문 보기
        <ArrowUpRight className="size-4" aria-hidden />
      </a>
    </div>
  );
}
