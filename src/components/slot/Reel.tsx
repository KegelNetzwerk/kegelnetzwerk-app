import { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  ReduceMotion,
  cancelAnimation,
} from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import { SYMBOLS, SYMBOL_KEYS, type SymbolKey } from '../../utils/slotLogic';

export const CELL_HEIGHT = 72;

// Staggered stop delay per reel index (ms after isSpinning → false)
export const STOP_DELAY = [500, 800, 1100, 1400, 1700];
// Each scroll step: animate for SCROLL_DURATION, then wait SCROLL_PAUSE before next
const SCROLL_DURATION = 100;
const SCROLL_PAUSE = 20;

function randomSymbol(): SymbolKey {
  return SYMBOL_KEYS[Math.floor(Math.random() * SYMBOL_KEYS.length)];
}

interface ReelProps {
  symbols: SymbolKey[];         // 3 final symbols [top, mid, bottom]
  isSpinning: boolean;
  reelIndex: number;            // 0–4
  winningRows: Set<number>;     // row indices that are part of a winning payline
  expandingSymbol?: SymbolKey | null; // highlight full reel during feature
  cellHeight?: number;          // dynamic cell height (defaults to CELL_HEIGHT)
  expandTrigger?: number;       // increment to fire bounce + flip animation
  expandToSymbol?: SymbolKey | null;
  bookHighlight?: boolean;      // pulse cells containing 'book' (pre-feature reveal)
  stopDelay?: number;           // override default STOP_DELAY[reelIndex]
  onStopped?: () => void;
}

export default function Reel({
  symbols,
  isSpinning,
  reelIndex,
  winningRows,
  expandingSymbol,
  cellHeight = CELL_HEIGHT,
  expandTrigger,
  expandToSymbol,
  bookHighlight,
  stopDelay,
  onStopped,
}: ReelProps) {
  const c = useColors();

  // 4-cell vertical strip: indices [0,1,2] are visible, [3] is hidden below the clip.
  // translateY=0 shows cells 0–2; animating to -CELL_HEIGHT scrolls cell 3 into view.
  // After each step: strip shifts up (cell 0 exits), new symbol added at bottom.
  const [strip, setStrip] = useState<SymbolKey[]>([
    symbols[0], symbols[1], symbols[2], randomSymbol(),
  ]);
  const stripRef = useRef<SymbolKey[]>(strip);
  const symbolsRef = useRef(symbols);
  const wasSpinning = useRef(false);

  // Loop control: each spin gets a unique generation; stale callbacks self-abort.
  const generationRef = useRef(0);
  // Queue of specific symbols to use as the next "new cell added at bottom".
  // Populated when STOP_DELAY fires so the reel lands on the correct final symbols.
  const pendingRef = useRef<SymbolKey[]>([]);
  // Counts remaining steps after the final symbols have been queued.
  // When it reaches 0, the loop stops and the bounce plays.
  const stepsToFinishRef = useRef(0);

  const stopDelayRef = useRef(stopDelay ?? STOP_DELAY[reelIndex]);
  stopDelayRef.current = stopDelay ?? STOP_DELAY[reelIndex];

  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const stopTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const highlightOpacity = useSharedValue(0);
  const bookHighlightOpacity = useSharedValue(0);

  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);

  useEffect(() => {
    if (isSpinning) {
      wasSpinning.current = true;

      // Cancel any in-progress landing from a previous spin
      generationRef.current++;
      pendingRef.current = [];
      stepsToFinishRef.current = 0;
      clearTimeout(scrollTimerRef.current);
      clearTimeout(stopTimerRef.current);

      const gen = generationRef.current;

      const runStep = () => {
        if (generationRef.current !== gen) return;

        translateY.value = withTiming(-cellHeight, {
          duration: SCROLL_DURATION,
          reduceMotion: ReduceMotion.Never,
        });

        scrollTimerRef.current = setTimeout(() => {
          if (generationRef.current !== gen) return;

          // Use queued final symbol if available, otherwise random
          const newSym = pendingRef.current.length > 0
            ? pendingRef.current.shift()!
            : randomSymbol();

          const next = [...stripRef.current.slice(1), newSym] as SymbolKey[];
          stripRef.current = next;
          setStrip([...next]);
          translateY.value = 0; // snap — invisible because content shifted

          // Count down to stop once final symbols have been queued
          if (stepsToFinishRef.current > 0) {
            stepsToFinishRef.current--;
            if (stepsToFinishRef.current === 0) {
              generationRef.current++; // invalidate this gen so no further steps run
              scale.value = withSequence(
                withTiming(1.07, { duration: 70, reduceMotion: ReduceMotion.Never }),
                withTiming(0.96, { duration: 80, reduceMotion: ReduceMotion.Never }),
                withTiming(1.02, { duration: 60, reduceMotion: ReduceMotion.Never }),
                withTiming(1,    { duration: 60, reduceMotion: ReduceMotion.Never }),
              );
              onStopped?.();
              return; // do not schedule next step
            }
          }

          scrollTimerRef.current = setTimeout(runStep, SCROLL_PAUSE);
        }, SCROLL_DURATION);
      };

      runStep();
    } else if (wasSpinning.current) {
      wasSpinning.current = false;

      // Queue the 3 final symbols so the reel scrolls smoothly into them.
      // After 4 steps (3 to add finals + 1 to bring them fully into view), the loop stops.
      stopTimerRef.current = setTimeout(() => {
        pendingRef.current = [...symbolsRef.current];
        stepsToFinishRef.current = 4;
      }, stopDelayRef.current);
    }

    return () => {
      clearTimeout(stopTimerRef.current);
    };
  }, [isSpinning]);

  // Blink winning cells when winningRows goes from empty → non-empty, then stay lit.
  // winningRows is populated only after the highlight delay fires in slotmachine.tsx.
  useEffect(() => {
    if (winningRows.size > 0) {
      cancelAnimation(highlightOpacity);
      highlightOpacity.value = 0;
      // 3 on/off blinks (~167ms each half = 1s total), then stay on
      highlightOpacity.value = withSequence(
        withTiming(1, { duration: 167, reduceMotion: ReduceMotion.Never }),
        withTiming(0, { duration: 167, reduceMotion: ReduceMotion.Never }),
        withTiming(1, { duration: 167, reduceMotion: ReduceMotion.Never }),
        withTiming(0, { duration: 167, reduceMotion: ReduceMotion.Never }),
        withTiming(1, { duration: 167, reduceMotion: ReduceMotion.Never }),
        withTiming(0, { duration: 167, reduceMotion: ReduceMotion.Never }),
        withTiming(1, { duration: 100, reduceMotion: ReduceMotion.Never }),
      );
    } else {
      cancelAnimation(highlightOpacity);
      highlightOpacity.value = 0;
    }
  }, [winningRows.size]);

  // Expansion animation: bounce then flip all cells to the expanding symbol
  useEffect(() => {
    if (!expandTrigger || !expandToSymbol) return;
    const flipTimer = setTimeout(() => {
      const expanded: SymbolKey[] = [expandToSymbol, expandToSymbol, expandToSymbol, expandToSymbol];
      stripRef.current = expanded;
      setStrip(expanded);
    }, 150);
    scale.value = withSequence(
      withTiming(1.12, { duration: 140, reduceMotion: ReduceMotion.Never }),
      withTiming(0.92, { duration: 120, reduceMotion: ReduceMotion.Never }),
      withTiming(1.04, { duration: 90,  reduceMotion: ReduceMotion.Never }),
      withTiming(1,    { duration: 60,  reduceMotion: ReduceMotion.Never }),
    );
    return () => clearTimeout(flipTimer);
  }, [expandTrigger]);

  useEffect(() => {
    if (bookHighlight) {
      bookHighlightOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300, reduceMotion: ReduceMotion.Never }),
          withTiming(0.35, { duration: 300, reduceMotion: ReduceMotion.Never }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(bookHighlightOpacity);
      bookHighlightOpacity.value = withTiming(0, { duration: 200, reduceMotion: ReduceMotion.Never });
    }
  }, [bookHighlight]);

  // Kill the loop and all timers on unmount
  useEffect(() => {
    return () => {
      generationRef.current++;
      clearTimeout(scrollTimerRef.current);
      clearTimeout(stopTimerRef.current);
    };
  }, []);

  const scrollStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: highlightOpacity.value,
  }));

  const bookHighlightStyle = useAnimatedStyle(() => ({
    opacity: bookHighlightOpacity.value,
  }));

  const visibleStrip = strip.slice(0, 3);
  const isExpanding = !!expandingSymbol && visibleStrip.every((s) => s === expandingSymbol);

  const emojiFontSize = Math.round(cellHeight * 0.53);

  return (
    <Animated.View style={[{ flex: 1 }, bounceStyle]}>
      <View
        style={{
          height: cellHeight * 3,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: c.subSurface,
          borderWidth: 1,
          borderColor: c.divider,
        }}
      >
        <Animated.View style={[{ height: cellHeight * 4 }, scrollStyle]}>
          {strip.map((sym, row) => {
            const isWin = row < 3 && winningRows.has(row) && !isSpinning;
            const isExp = row < 3 && isExpanding && !isSpinning;
            const isBook = row < 3 && sym === 'book' && !!bookHighlight && !isSpinning;
            return (
              <View
                key={row}
                style={{
                  height: cellHeight,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {/* Expanding symbol highlight — static */}
                {isExp && (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.primaryFg + '59' }} />
                )}
                {/* Win highlight — animated (blinks then stays on) */}
                {isWin && (
                  <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.primaryFg + '40' }, highlightStyle]} />
                )}
                {/* Book/Kegel pre-feature highlight — pulsing gold */}
                {isBook && (
                  <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#facc1566' }, bookHighlightStyle]} />
                )}
                <Text style={{ fontSize: emojiFontSize, lineHeight: Math.round(emojiFontSize * 1.2) }}>{SYMBOLS[sym].emoji}</Text>
              </View>
            );
          })}
        </Animated.View>

        {/* Mirrored vertical shadow — dark at top & bottom, transparent in center */}
        <LinearGradient
          colors={c.isDark
            ? ['rgba(0,0,0,0.82)', 'transparent', 'transparent', 'rgba(0,0,0,0.82)']
            : ['rgba(0,0,0,0.28)', 'transparent', 'transparent', 'rgba(0,0,0,0.28)']}
          locations={[0, 0.15, 0.85, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          pointerEvents="none"
        />
      </View>
    </Animated.View>
  );
}
