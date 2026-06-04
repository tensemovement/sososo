import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

/** "3시간 전", "2일 전" — relative time in Korean. */
export function relativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ko });
}

/** "2026년 6월 3일" — absolute date in Korean. */
export function absoluteDate(iso: string): string {
  return format(new Date(iso), "yyyy년 M월 d일", { locale: ko });
}
