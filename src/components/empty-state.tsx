interface Props {
  title?: string;
  message?: string;
}

/** Gentle empty state for when no stories match. */
export function EmptyState({
  title = "아직 전할 소식이 없어요",
  message = "곧 따뜻한 소식을 모아 전해드릴게요.",
}: Props) {
  return (
    <div className="mt-16 flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
      <p className="font-heading text-xl font-bold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
