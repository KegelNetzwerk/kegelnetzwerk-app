import { useRef } from 'react';
import { PanResponder } from 'react-native';
import type { RefObject } from 'react';

export function useTabSwipe<T extends string>(
  tabs: readonly [T, T],
  tabRef: RefObject<T>,
  switchTab: (newTab: T) => void
) {
  const switchTabRef = useRef(switchTab);
  switchTabRef.current = switchTab;

  return useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 15,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50 && tabRef.current === tabs[0]) switchTabRef.current(tabs[1]);
        else if (g.dx > 50 && tabRef.current === tabs[1]) switchTabRef.current(tabs[0]);
      },
    })
  ).current;
}
