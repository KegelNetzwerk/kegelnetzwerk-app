import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import { PAYLINES } from '../../utils/slotLogic';

const CELL = 11;  // px per mini-cell
const GAP = 2;    // px gap between cells

const LINE_LABELS = [
  'Mitte', 'Oben', 'Unten', 'V-Form ↓', 'V-Form ↑',
  'Delle oben', 'Delle unten', 'Diagonal ↘', 'Diagonal ↗', 'Diagonal ↗ Mitte',
];

function MiniGrid({ lineIndex, color, dimColor }: { lineIndex: number; color: string; dimColor: string }) {
  const payline = PAYLINES[lineIndex];
  return (
    <View style={{ flexDirection: 'row', gap: GAP }}>
      {payline.map((activeRow, reel) => (
        <View key={reel} style={{ gap: GAP }}>
          {[0, 1, 2].map((row) => (
            <View
              key={row}
              style={{
                width: CELL,
                height: CELL,
                borderRadius: 2,
                backgroundColor: row === activeRow ? color : dimColor,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

interface PayLinesProps {
  collapsible?: boolean;
}

export default function PayLines({ collapsible = true }: PayLinesProps) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const height = useSharedValue(0);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      height.value = withTiming(next ? 1 : 0, { duration: 220 });
      return next;
    });
  }

  const animStyle = useAnimatedStyle(() => ({
    opacity: height.value,
    maxHeight: height.value * 500,
    overflow: 'hidden',
  }));

  const activeColor = c.primaryFg;
  const dimColor = c.surface;

  const contentPadding = collapsible
    ? { paddingHorizontal: 14, paddingBottom: 14, gap: 8 }
    : { paddingBottom: 8, gap: 8 };
  const content = (
    <View style={contentPadding}>
      {Array.from({ length: 5 }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row', gap: 12 }}>
          {[row * 2, row * 2 + 1].map((idx) => (
            <View
              key={idx}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: c.surface, borderRadius: 8, padding: 8,
              }}
            >
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: activeColor, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 10, color: '#fff' }}>{idx + 1}</Text>
              </View>
              <View style={{ gap: 2 }}>
                <MiniGrid lineIndex={idx} color={activeColor} dimColor={dimColor} />
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 9, color: c.textMuted }}>{LINE_LABELS[idx]}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );

  if (!collapsible) {
    return (
      <View>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: c.text, marginBottom: 12 }}>
          Gewinnlinien
        </Text>
        {content}
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.divider, overflow: 'hidden' }}>
      <TouchableOpacity
        onPress={toggle}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}
        activeOpacity={0.7}
      >
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: c.text }}>Gewinnlinien</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 18, color: c.textMuted }}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      <Animated.View style={animStyle}>{content}</Animated.View>
    </View>
  );
}
