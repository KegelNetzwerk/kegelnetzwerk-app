import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import type { WinningLine } from '../../utils/slotLogic';

const K_COLOR = '#facc15';

interface WinDisplayProps {
  win: number;
  isSpinning: boolean;
  winningLines: WinningLine[];
  showWin: boolean;
  isFeature?: boolean;
  featureWinTotal?: number;
}

export default function WinDisplay({ win, isSpinning, winningLines, showWin, isFeature, featureWinTotal }: WinDisplayProps) {
  const c = useColors();
  const [displayed, setDisplayed] = useState(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!showWin || win <= 0) {
      setDisplayed(0);
      return;
    }
    const steps = 28;
    const intervalMs = 700 / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplayed(step >= steps ? win : Math.round((win / steps) * step));
      if (step >= steps) {
        clearInterval(timer);
        scale.value = withSequence(
          withTiming(1.15, { duration: 100 }),
          withTiming(1,    { duration: 150 }),
        );
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [showWin, win]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const showBreakdown = displayed === win && win > 0 && winningLines.length > 1;
  const showFeatureTotal = isFeature && !isSpinning && (featureWinTotal ?? 0) > 0;

  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: c.divider,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        height: 68,
      }}
    >
      {win > 0 && !isSpinning && showWin ? (
        <Animated.View style={[{ alignItems: 'center', gap: 2 }, animatedStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: c.text, letterSpacing: 1 }}>
              +{displayed}{' '}<Text style={{ color: K_COLOR }}>K</Text>
            </Text>
            {showBreakdown && (
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: c.textMuted }}>
                ({winningLines.map((l) => `+${l.payout}`).join(', ')})
              </Text>
            )}
          </View>
          {showFeatureTotal && (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: c.textMuted }}>
              Gesamt: +{featureWinTotal}{' '}<Text style={{ fontFamily: 'DMSans_700Bold', color: K_COLOR }}>K</Text>
            </Text>
          )}
        </Animated.View>
      ) : (
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: c.textFaint }}>
            {isSpinning ? '·  ·  ·' : '–'}
          </Text>
          {showFeatureTotal && (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: c.textMuted }}>
              Gesamt: +{featureWinTotal} KNC
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
