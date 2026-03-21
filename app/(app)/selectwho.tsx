import ClubBackground from '../../src/components/ClubBackground';
import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../src/hooks/useTheme';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useLocalData } from '../../src/hooks/useLocalData';
import { useSyncQueue } from '../../src/hooks/useSyncQueue';
import { useNetworkSync } from '../../src/hooks/useNetworkSync';
import { addResult } from '../../src/storage/resultPackage';
import { getOrCreateSession, touchSession } from '../../src/storage/session';
import { useAuth } from '../../src/hooks/useAuth';
import MemberButton from '../../src/components/MemberButton';
import ValueDialog from '../../src/components/ValueDialog';
import Toast from '../../src/components/Toast';
import type { Guest } from '../../src/models/Guest';

const COLUMNS = 3;
const BUTTON_MARGIN = 8;

export default function SelectWhoScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    gameId: string;
    gameName: string;
    partId: string;
    partName: string;
    partValue: string;
    partVariable: string;
    partOnce: string;
    stay: string;
  }>();

  const gameId = parseInt(params.gameId ?? '0', 10);
  const partId = parseInt(params.partId ?? '0', 10);
  const partValue = parseFloat(params.partValue ?? '0');
  const partVariable = params.partVariable === '1';
  const partOnce = params.partOnce === '1';
  const stay = params.stay === '1';

  useLayoutEffect(() => {
    navigation.setOptions({ title: params.partName ?? 'Wer?', headerShown: true });
  }, [navigation, params.partName]);

  const theme = useTheme();
  const { members } = useLocalData();
  const { addToQueue, flush } = useSyncQueue();
  useNetworkSync(flush);

  const TABS = ['members', 'guests'] as const;
  const [tab, setTab] = useState<'members' | 'guests'>('members');
  const pagerRef = useRef<FlatList<string>>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [onceDone, setOnceDone] = useState<Set<string>>(new Set());
  const [dialogTarget, setDialogTarget] = useState<{ id: string; name: string } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(message);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2000);
  }

  const { width } = useWindowDimensions();
  const cellSize = Math.floor((width - 32 - COLUMNS * BUTTON_MARGIN) / COLUMNS);

  async function recordResult(memberId: number | null, guestName: string | null, value: number, displayName: string) {
    const sessionGroup = await getOrCreateSession();
    const entry = {
      id: uuidv4(),
      memberId,
      guestName,
      gameId,
      partId,
      value,
      timestamp: new Date().toISOString(),
      synced: false,
      sessionGroup,
    };
    await addResult(entry);
    await touchSession();
    await addToQueue(entry);
    await flush();
    if (!stay) {
      router.back();
    } else {
      showToast(`✓ ${displayName} — ${params.partName} — ${value}`);
    }
  }

  function handleMemberPress(memberId: number, nickname: string) {
    const key = `m-${memberId}`;
    if (onceDone.has(key)) return;

    if (partVariable) {
      setDialogTarget({ id: key, name: nickname });
    } else {
      recordResult(memberId, null, partValue, nickname);
      if (partOnce) {
        setOnceDone((prev) => new Set([...prev, key]));
      }
    }
  }

  function handleGuestPress(guest: Guest) {
    const key = `g-${guest.id}`;
    if (onceDone.has(key)) return;

    if (partVariable) {
      setDialogTarget({ id: key, name: guest.name });
    } else {
      recordResult(null, guest.name, partValue, guest.name);
      if (partOnce) {
        setOnceDone((prev) => new Set([...prev, key]));
      }
    }
  }

  function handleDialogConfirm(value: number) {
    if (!dialogTarget) return;
    const key = dialogTarget.id;
    if (key.startsWith('m-')) {
      const memberId = parseInt(key.slice(2), 10);
      recordResult(memberId, null, value, dialogTarget.name);
    } else {
      const guestId = key.slice(2);
      const guest = guests.find((g) => g.id === guestId);
      if (guest) recordResult(null, guest.name, value, guest.name);
    }
    if (partOnce) {
      setOnceDone((prev) => new Set([...prev, key]));
    }
    setDialogTarget(null);
  }

  function addGuest() {
    Alert.prompt(
      t('selectwho.guestNameTitle'),
      t('selectwho.guestName'),
      (name) => {
        if (!name?.trim()) return;
        setGuests((prev) => [...prev, { id: uuidv4(), name: name.trim() }]);
      },
      'plain-text'
    );
  }

  return (
    <View className="flex-1">
      <ClubBackground />
      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200 px-4 pt-2">
        {TABS.map((tabKey) => (
          <TouchableOpacity
            key={tabKey}
            onPress={() => {
              setTab(tabKey);
              pagerRef.current?.scrollToIndex({ index: TABS.indexOf(tabKey), animated: true });
            }}
            style={[
              { marginRight: 16, paddingBottom: 8, borderBottomWidth: 2 },
              tab === tabKey ? { borderBottomColor: theme.primary } : { borderBottomColor: 'transparent' },
            ]}
          >
            <Text
              style={{
                fontFamily: tab === tabKey ? 'DMSans_600SemiBold' : 'DMSans_400Regular',
                color: tab === tabKey ? theme.primary : '#6b7280',
              }}
            >
              {tabKey === 'members' ? t('selectwho.members') : t('selectwho.guests')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Swipeable tab pages */}
      <FlatList
        ref={pagerRef}
        data={TABS}
        keyExtractor={(k) => k}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onViewableItemsChanged={useCallback(
          ({ viewableItems }: { viewableItems: Array<{ item: string; index: number | null }> }) => {
            if (viewableItems.length > 0) setTab(viewableItems[0].item as 'members' | 'guests');
          },
          []
        )}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item: tabKey }) => (
          <ScrollView style={{ width }} contentContainerStyle={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {tabKey === 'members'
                ? members.map((m) => (
                    <MemberButton
                      key={m.id}
                      nickname={m.nickname}
                      pic={m.pic}
                      size={cellSize}
                      disabled={partOnce && onceDone.has(`m-${m.id}`)}
                      onPress={() => handleMemberPress(m.id, m.nickname)}
                    />
                  ))
                : guests.map((g) => (
                    <MemberButton
                      key={g.id}
                      nickname={g.name}
                      pic={null}
                      size={cellSize}
                      disabled={partOnce && onceDone.has(`g-${g.id}`)}
                      onPress={() => handleGuestPress(g)}
                    />
                  ))}

              {/* Add guest button (guests tab only) */}
              {tabKey === 'guests' && (
                <TouchableOpacity
                  style={{
                    width: Math.min(cellSize, 160),
                    height: Math.min(cellSize, 160),
                    margin: 4,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: '#9ca3af',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={addGuest}
                >
                  <Text className="text-3xl text-gray-400">+</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-gray-400 mt-1">
                    {t('selectwho.addGuest')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
      />

      {/* Back button */}
      <View className="p-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          className="bg-gray-100 rounded-lg py-3 flex-row items-center justify-center gap-2"
          onPress={() => router.back()}
        >
          <ArrowLeft size={16} color="#4b5563" />
          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-gray-600">
            {t('selectwho.back')} {params.gameName}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success toast */}
      <Toast visible={toastVisible} message={toastMessage} />

      {/* Value input dialog */}
      <ValueDialog
        visible={!!dialogTarget}
        partName={params.partName ?? ''}
        memberName={dialogTarget?.name ?? ''}
        onConfirm={handleDialogConfirm}
        onCancel={() => setDialogTarget(null)}
      />
    </View>
  );
}
