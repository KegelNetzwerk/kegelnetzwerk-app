import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import { SYMBOLS, SYMBOL_KEYS, type SymbolKey } from '../../utils/slotLogic';

interface FeatureTriggerModalProps {
  visible: boolean;
  expandingSymbol: SymbolKey | null;
  onDismiss: () => void;
}

const CYCLE_DURATION = 3000;
const CYCLE_INTERVAL = 120;

export function FeatureTriggerModal({ visible, expandingSymbol, onDismiss }: FeatureTriggerModalProps) {
  const c = useColors();
  const glow = useSharedValue(1);
  const [displayedSymbol, setDisplayedSymbol] = useState<SymbolKey | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!visible) {
      setDisplayedSymbol(null);
      setRevealed(false);
      glow.value = 1;
      return;
    }

    glow.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 500 }),
        withTiming(0.96, { duration: 500 }),
      ),
      -1,
      true,
    );

    const intervalId = setInterval(() => {
      setDisplayedSymbol(SYMBOL_KEYS[Math.floor(Math.random() * SYMBOL_KEYS.length)]);
    }, CYCLE_INTERVAL);

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      setDisplayedSymbol(expandingSymbol);
      setRevealed(true);
    }, CYCLE_DURATION);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glow.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={revealed ? onDismiss : undefined}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={revealed ? onDismiss : undefined}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.75)',
        }}
      >
        <Animated.View
          style={[
            {
              backgroundColor: c.card,
              borderRadius: 20,
              padding: 32,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: c.primaryFg,
              gap: 12,
              minWidth: 280,
            },
            animStyle,
          ]}
        >
          <Text style={{ fontSize: 48 }}>🎉</Text>
          <Text
            style={{
              fontFamily: 'DMSans_700Bold',
              fontSize: 24,
              color: c.primaryFg,
              textAlign: 'center',
            }}
          >
            FREISPIELE!
          </Text>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: 15,
              color: c.textSecondary,
              textAlign: 'center',
            }}
          >
            {'10 Freispiele — Sondersymbol wird ausgewählt …'}
          </Text>
          <Text style={{ fontSize: 52 }}>
            {displayedSymbol ? SYMBOLS[displayedSymbol].emoji : '✨'}
          </Text>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: 13,
              color: c.textMuted,
              marginTop: 8,
              opacity: revealed ? 1 : 0,
            }}
          >
            Tippen zum Starten
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

interface FeatureSummaryModalProps {
  visible: boolean;
  totalWon: number;
  onDismiss: () => void;
}

export function FeatureSummaryModal({ visible, totalWon, onDismiss }: FeatureSummaryModalProps) {
  const c = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onDismiss}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)' }}
      >
        <View
          style={{
            backgroundColor: c.card,
            borderRadius: 20,
            padding: 32,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: c.primaryFg,
            gap: 12,
            minWidth: 260,
          }}
        >
          <Text style={{ fontSize: 48 }}>🏆</Text>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: c.primaryFg, textAlign: 'center' }}>
            Freispiele beendet
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: c.textSecondary, textAlign: 'center' }}>
            Gesamtgewinn:
          </Text>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 32, color: c.text }}>
            +{totalWon}{' '}<Text style={{ color: '#facc15' }}>K</Text>
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: c.textMuted, marginTop: 8 }}>
            Tippen zum Schließen
          </Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

interface FeatureStatusBarProps {
  spinsLeft: number;
  expandingSymbol: SymbolKey | null;
}

export function FeatureStatusBar({ spinsLeft, expandingSymbol }: FeatureStatusBarProps) {
  const c = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.primaryFg + '26',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: c.primaryFg + '66',
      }}
    >
      <Text style={{ fontSize: 20 }}>
        {expandingSymbol ? SYMBOLS[expandingSymbol].emoji : '✨'}
      </Text>
      <Text
        style={{
          fontFamily: 'DMSans_600SemiBold',
          fontSize: 14,
          color: c.primaryFg,
        }}
      >
        Freispiele: {spinsLeft}
      </Text>
    </View>
  );
}
