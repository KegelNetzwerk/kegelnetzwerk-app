import { View, Text, TouchableOpacity } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { BET_OPTIONS, type BetOption } from '../../utils/slotLogic';

interface BetControlsProps {
  activeLines: number;
  betPerLine: BetOption;
  totalBet: number;
  disabled: boolean;
  isFeature: boolean;
  onLinesChange: (lines: number) => void;
  onBetChange: (bet: BetOption) => void;
}

const LINE_OPTIONS = [1, 3, 5, 7, 10];

export default function BetControls({
  activeLines,
  betPerLine,
  totalBet,
  disabled,
  isFeature,
  onLinesChange,
  onBetChange,
}: BetControlsProps) {
  const c = useColors();

  return (
    <View style={{ gap: 10 }}>
      {/* Lines row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: c.textMuted, width: 48 }}>
          Linien
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
          {LINE_OPTIONS.map((n) => (
            <TouchableOpacity
              key={n}
              disabled={disabled || isFeature}
              onPress={() => onLinesChange(n)}
              style={{
                flex: 1,
                height: 34,
                borderRadius: 6,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: activeLines === n ? c.primaryFg : c.surface,
                opacity: disabled || isFeature ? 0.5 : 1,
              }}
            >
              <Text style={{
                fontFamily: 'DMSans_600SemiBold',
                fontSize: 13,
                color: activeLines === n ? '#fff' : c.textSecondary,
              }}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bet per line row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: c.textMuted, width: 48 }}>
          Einsatz
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
          {BET_OPTIONS.map((b) => (
            <TouchableOpacity
              key={b}
              disabled={disabled || isFeature}
              onPress={() => onBetChange(b)}
              style={{
                flex: 1,
                height: 34,
                borderRadius: 6,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: betPerLine === b ? c.primaryFg : c.surface,
                opacity: disabled || isFeature ? 0.5 : 1,
              }}
            >
              <Text style={{
                fontFamily: 'DMSans_600SemiBold',
                fontSize: 13,
                color: betPerLine === b ? '#fff' : c.textSecondary,
              }}>
                {b}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Total bet */}
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: c.textMuted }}>
          {isFeature ? 'Freispiel — kein Einsatz' : `Gesamteinsatz: ${totalBet} KNC`}
        </Text>
      </View>
    </View>
  );
}
