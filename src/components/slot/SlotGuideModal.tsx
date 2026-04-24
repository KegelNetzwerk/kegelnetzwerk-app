import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { useColors } from '../../hooks/useColors';
import { SYMBOLS, type SymbolKey } from '../../utils/slotLogic';
import { SCATTER_PAYOUTS } from '../../config/scatterPayouts';
import PayTable from './PayTable';
import PayLines from './PayLines';

// Groups by identical scatter payout values — mirrors PayTable's GROUPS pattern
const SCATTER_GROUPS: SymbolKey[][] = [
  ['pin'],
  ['trophy'],
  ['target', 'joker'],
  ['clover', 'star'],
  ['bell', 'slot', 'dice'],
];

// Minimum reels needed to pay scatter per symbol
const SCATTER_MIN: Partial<Record<SymbolKey, number>> = {
  pin: 2, trophy: 2, target: 2, joker: 2,
};

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

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SlotGuideModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const section = (title: string, body: string) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: c.text, marginBottom: 6 }}>
        {title}
      </Text>
      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: c.textMuted, lineHeight: 22 }}>
        {body}
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.surface }}>
        {/* Header */}
        <View style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 14,
          backgroundColor: c.card,
          borderBottomWidth: 1,
          borderBottomColor: c.divider,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: c.text }}>
            {t('slotMachine.guide.title')}
          </Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <X size={22} color={c.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {section(t('slotMachine.guide.basicsTitle'),    t('slotMachine.guide.basicsBody'))}

          {/* Payout table */}
          <View style={{ marginBottom: 24 }}>
            <PayTable collapsible={false} />
          </View>

          {/* Paylines */}
          <View style={{ marginBottom: 24 }}>
            <PayLines collapsible={false} />
          </View>

          {section(t('slotMachine.guide.wildTitle'),      t('slotMachine.guide.wildBody'))}
          {section(t('slotMachine.guide.scatterTitle'),   t('slotMachine.guide.scatterBody'))}
          {section(t('slotMachine.guide.expandingTitle'), t('slotMachine.guide.expandingBody'))}

          {/* Scatter payout table */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: c.text, marginBottom: 12 }}>
              {t('slotMachine.guide.scatterPayTableTitle')}
            </Text>
            {/* Column headers */}
            <View style={{ flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: c.divider, marginBottom: 6 }}>
              <Text style={{ flex: 2, fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: c.textMuted }}>Symbol</Text>
              {([2, 3, 4, 5] as const).map((n) => (
                <Text key={n} style={{ flex: 1, fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: c.textMuted, textAlign: 'center' }}>
                  {`${n} ${t('slotMachine.guide.reels')}`}
                </Text>
              ))}
            </View>
            <View style={{ gap: 8 }}>
              {SCATTER_GROUPS.map((group, groupIdx) => (
                <View
                  key={groupIdx}
                  style={{ backgroundColor: c.surface, borderRadius: 8, borderWidth: 1, borderColor: c.divider, overflow: 'hidden' }}
                >
                  {group.map((key, rowIdx) => {
                    const sp = SCATTER_PAYOUTS[key];
                    const min = SCATTER_MIN[key] ?? 3;
                    const cell = (reels: 2 | 3 | 4 | 5): string => {
                      if (reels < min) return '—';
                      const idx = Math.min(reels - min, 2);
                      return sp ? `${sp[idx]}×` : '—';
                    };
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
                          <Text style={{ fontSize: 20 }}>{SYMBOLS[key].emoji}</Text>
                          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: c.textMuted }}>
                            {SYMBOL_NAMES[key]}
                          </Text>
                        </View>
                        {([2, 3, 4, 5] as const).map((n) => (
                          <Text key={n} style={{ flex: 1, fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: cell(n) === '—' ? c.textMuted : c.text, textAlign: 'center' }}>
                            {cell(n)}
                          </Text>
                        ))}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: c.textMuted, marginTop: 8, textAlign: 'center' }}>
              {t('slotMachine.guide.scatterPayTableNote')}
            </Text>
          </View>

          {section(t('slotMachine.guide.retriggerTitle'), t('slotMachine.guide.retriggerBody'))}
        </ScrollView>
      </View>
    </Modal>
  );
}
