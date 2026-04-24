import { View, Text, TouchableOpacity, Animated, Easing, type LayoutChangeEvent } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../hooks/useColors';

const MAX_FLIPS = 5;
const GOLD = '#f59e0b';
const SILVER = '#94a3b8';
const K_COLOR = '#facc15';

// Flip half-cycle: starts fast, slows to this max as progress → 1
const HALF_CYCLE_MIN_MS = 60;
const HALF_CYCLE_MAX_MS = 280;

interface Props {
  visible: boolean;
  flipsUsed: number;
  currentWin: number;
  result: 'win' | 'lose' | null;
  flipping: boolean;
  flipDuration: number;
  onClose: () => void;
}

export default function DoubleOrNothingOverlay({
  visible, flipsUsed, currentWin, result, flipping, flipDuration, onClose,
}: Props) {
  const { t } = useTranslation();
  const c = useColors();

  const [cardHeight, setCardHeight] = useState(0);
  // Reference height the original fixed sizes were designed for
  const REF_H = 500;
  const scale = cardHeight > 0 ? cardHeight / REF_H : 1;

  const coinSize   = Math.round(154 * scale);
  const coinFont   = Math.round(46  * scale);
  const winFont    = Math.round(49  * scale);
  const dotSize    = Math.round(23  * scale);
  const itemGap    = Math.round(28  * scale);

  const coinScale = useRef(new Animated.Value(1)).current;
  const coinBounce = useRef(new Animated.Value(0)).current;
  const animRunning = useRef(false);
  const currentFlipRef = useRef<Animated.CompositeAnimation | null>(null);
  const bounceLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const [coinFace, setCoinFace] = useState<'win' | 'lose' | 'neutral'>('neutral');

  function stopAnim() {
    animRunning.current = false;
    currentFlipRef.current?.stop();
    currentFlipRef.current = null;
    bounceLoopRef.current?.stop();
    bounceLoopRef.current = null;
  }

  function startFlipAnimation(totalMs: number) {
    animRunning.current = true;
    const startTime = Date.now();
    setCoinFace('win');

    // Bounce loop — independent of flip cycle
    bounceLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(coinBounce, { toValue: -16, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(coinBounce, { toValue: 0,   duration: 220, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
      ]),
    );
    bounceLoopRef.current.start();

    function doFlipCycle() {
      if (!animRunning.current) return;
      const progress = Math.min((Date.now() - startTime) / totalMs, 1);
      const halfMs = HALF_CYCLE_MIN_MS + (HALF_CYCLE_MAX_MS - HALF_CYCLE_MIN_MS) * progress;

      const anim = Animated.sequence([
        Animated.timing(coinScale, { toValue: 0, duration: halfMs, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(coinScale, { toValue: 1, duration: halfMs, easing: Easing.linear, useNativeDriver: true }),
      ]);
      currentFlipRef.current = anim;
      anim.start(({ finished }) => {
        if (finished && animRunning.current) {
          setCoinFace((f) => (f === 'win' ? 'lose' : 'win'));
          doFlipCycle();
        }
      });
    }

    doFlipCycle();
  }

  useEffect(() => {
    if (!visible) {
      stopAnim();
      coinScale.setValue(1);
      coinBounce.setValue(0);
      setCoinFace('neutral');
      return;
    }

    if (flipping) {
      stopAnim();
      startFlipAnimation(flipDuration > 0 ? flipDuration : 4000);
    } else {
      stopAnim();
      coinBounce.setValue(0);
      Animated.timing(coinScale, { toValue: 1, duration: 120, useNativeDriver: true }).start();
      if (result === 'win') setCoinFace('win');
      else if (result === 'lose') setCoinFace('lose');
      else setCoinFace('neutral');
    }

    return stopAnim;
  }, [flipping, visible]);

  useEffect(() => {
    if (flipping) return;
    if (result === 'win') setCoinFace('win');
    else if (result === 'lose') setCoinFace('lose');
    else setCoinFace('neutral');
  }, [result]);

  const coinColor = coinFace === 'win' ? GOLD : coinFace === 'lose' ? SILVER : '#aab4c0';
  const coinLabel = coinFace === 'win' ? '2×' : coinFace === 'lose' ? '0' : '?';

  if (!visible) return null;

  return (
    <TouchableOpacity
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.72)',
        borderRadius: 12,
      }}
      activeOpacity={1}
      onPress={result === 'lose' ? onClose : undefined}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={result === 'lose' ? onClose : undefined}
        style={{ position: 'absolute', top: '5%', left: '5%', right: '5%', bottom: '5%' }}
      >
        <View
          onLayout={(e: LayoutChangeEvent) => setCardHeight(e.nativeEvent.layout.height)}
          style={{
            flex: 1,
            backgroundColor: c.card,
            borderRadius: 32,
            paddingVertical: 38,
            paddingHorizontal: 49,
            alignItems: 'center',
            justifyContent: 'center',
            gap: itemGap,
            shadowColor: '#000',
            shadowOpacity: 0.4,
            shadowRadius: 28,
            shadowOffset: { width: 0, height: 10 },
            elevation: 18,
          }}>
          {/* Title */}
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: c.text }}>
            {t('slotMachine.double.title')}
          </Text>

          {/* Current win amount */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: c.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>
              Gewinn
            </Text>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: winFont, color: currentWin > 0 ? c.text : c.textMuted }}>
              {currentWin}{' '}<Text style={{ color: K_COLOR }}>K</Text>
            </Text>
          </View>

          {/* Coin */}
          <Animated.View style={{
            width: coinSize, height: coinSize, borderRadius: coinSize / 2,
            backgroundColor: coinColor,
            justifyContent: 'center', alignItems: 'center',
            shadowColor: '#000', shadowOpacity: 0.2,
            shadowRadius: 14, shadowOffset: { width: 0, height: 7 },
            elevation: 10,
            transform: [{ scaleX: coinScale }, { translateY: coinBounce }],
          }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: coinFont, color: '#fff' }}>
              {coinLabel}
            </Text>
          </Animated.View>

          {/* Flip counter: 5 dots */}
          <View style={{ flexDirection: 'row', gap: Math.round(18 * scale) }}>
            {Array.from({ length: MAX_FLIPS }, (_, i) => (
              <View
                key={i}
                style={{
                  width: dotSize, height: dotSize, borderRadius: dotSize / 2,
                  backgroundColor: i < flipsUsed ? c.primaryFg : 'transparent',
                  borderWidth: Math.round(4 * scale), borderColor: c.primaryFg,
                }}
              />
            ))}
          </View>

          {/* Status */}
          {result === 'lose' ? (
            <View style={{ alignItems: 'center', gap: 7 }}>
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: '#ef4444' }}>
                {t('slotMachine.double.lost')}
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: c.textMuted }}>
                {t('slotMachine.double.tapToClose')}
              </Text>
            </View>
          ) : result === 'win' && flipsUsed >= MAX_FLIPS ? (
            <View style={{ alignItems: 'center', gap: 7 }}>
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: '#22c55e' }}>
                {t('slotMachine.double.won', { win: currentWin })}
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: c.textMuted }}>
                {t('slotMachine.double.maxFlipsReached')}
              </Text>
            </View>
          ) : result === 'win' ? (
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: '#22c55e' }}>
              {t('slotMachine.double.won', { win: currentWin })}
            </Text>
          ) : (
            <View style={{ alignItems: 'center', gap: 7 }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: c.textMuted }}>
                {t('slotMachine.double.pressToFlip')}
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: c.textMuted }}>
                {t('slotMachine.double.closeHint')}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
