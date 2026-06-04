import { useSyncExternalStore } from "react";

const emptySubscribe = (): (() => void) => () => {};

/**
 * 커스텀 훅 예시. 클라이언트 마운트(하이드레이션) 여부를 반환한다.
 * 서버에서는 false, 클라이언트에서는 true 를 반환하여 hydration 불일치를 피한다.
 * useSyncExternalStore 를 사용해 effect 내 setState 없이 구현한다.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
