import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import { SYMBOLS, type SymbolKey } from '../../utils/slotLogic';

interface PayTableProps {
  collapsible?: boolean;
}

// Wild + Scatter first (special, visually separated), then regular symbols by payout tier
const GROUPS: SymbolKey[][] = [
  ['book'],
  ['pin'],
  ['trophy'],
  ['target', 'joker'],
  ['clover', 'star'],
  ['bell', 'slot', 'dice'],
];

const SYMBOL_NAMES: Record<SymbolKey, string> = {
  book:   'Kegel (Wild + Scatter)',
  pin:    'Bier',
  trophy: 'Butter',
  target: 'Pommes',
  joker:  'Pizza',
  clover: 'Brezel',
  star:   'Croissant',
  bell:   'Trauben',
  slot:   'Birne',
  dice:   'Erdbeere',
};

export default function PayTable({ collapsible = true }: Readonly<PayTableProps>) {
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
    maxHeight: height.value * 700,
    overflow: 'hidden',
  }));

  const contentPadding = collapsible ? { paddingHorizontal: 14, paddingBottom: 14 } : { paddingBottom: 8 };
  const content = (
    <View style={contentPadding}>
          {/* Column headers */}
          <View style={{ flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: c.divider, marginBottom: 6 }}>
            <Text style={{ flex: 2, fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: c.textMuted }}>
              Symbol
            </Text>
            <Text style={{ flex: 1, fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: c.textMuted, textAlign: 'center' }}>3×</Text>
            <Text style={{ flex: 1, fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: c.textMuted, textAlign: 'center' }}>4×</Text>
            <Text style={{ flex: 1, fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: c.textMuted, textAlign: 'center' }}>5×</Text>
          </View>

          <View style={{ gap: 8 }}>
            {GROUPS.map((group) => {
              const isWildGroup = group.includes('book');
              return (
                <View
                  key={group[0]}
                  style={{
                    backgroundColor: isWildGroup ? c.primaryFg + '12' : c.surface,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: isWildGroup ? c.primaryFg + '55' : c.divider,
                    overflow: 'hidden',
                  }}
                >
                  {group.map((key, rowIdx) => {
                    const sym = SYMBOLS[key];
                    const isWildScatter = key === 'book';
                    return (
                      <View
                        key={key}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 7,
                          paddingHorizontal: 10,
                          borderBottomWidth: rowIdx < group.length - 1 ? 1 : 0,
                          borderBottomColor: c.divider,
                        }}
                      >
                        <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 22 }}>{sym.emoji}</Text>
                          <Text style={{ fontFamily: isWildScatter ? 'DMSans_600SemiBold' : 'DMSans_400Regular', fontSize: 12, color: isWildScatter ? c.primaryFg : c.textSecondary }}>
                            {SYMBOL_NAMES[key]}
                          </Text>
                        </View>
                        {sym.payouts.map((p, i) => (
                          <Text
                            key={`payout-${i}`}
                            style={{
                              flex: 1,
                              fontFamily: 'DMSans_600SemiBold',
                              fontSize: 13,
                              color: isWildScatter ? c.primaryFg : c.text,
                              textAlign: 'center',
                            }}
                          >
                            {isWildScatter ? '—' : `${p}×`}
                          </Text>
                        ))}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>

          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: c.textMuted, marginTop: 10 }}>
            Multiplier × Einsatz pro Linie. 3× 🎳 irgendwo = 10 Freispiele.
          </Text>
        </View>
  );

  if (!collapsible) {
    return (
      <View>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: c.text, marginBottom: 12 }}>
          Gewinntabelle
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
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: c.text }}>Gewinntabelle</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 18, color: c.textMuted }}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      <Animated.View style={animStyle}>{content}</Animated.View>
    </View>
  );
}
