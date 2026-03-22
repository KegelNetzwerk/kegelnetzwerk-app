import ClubBackground from '../../src/components/ClubBackground';
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  Easing,
  TouchableOpacity,
  PanResponder,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Settings } from 'lucide-react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useUIColors } from '../../src/hooks/useUIColors';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useLocalData } from '../../src/hooks/useLocalData';
import { useSyncQueue } from '../../src/hooks/useSyncQueue';
import { useNetworkSync } from '../../src/hooks/useNetworkSync';
import { addResult, getResults } from '../../src/storage/resultPackage';
import { getOrCreateSession, touchSession } from '../../src/storage/session';
import { getWorkingSettings, type PinnedPart } from '../../src/storage/workingSettings';
import { getDisplaySettings, getMemberDisplayName, type MemberDisplayMode } from '../../src/storage/displaySettings';
import { useAuth } from '../../src/hooks/useAuth';
import MemberButton from '../../src/components/MemberButton';
import ValueDialog from '../../src/components/ValueDialog';
import ShortcutMenu from '../../src/components/ShortcutMenu';
import MemberSettingsModal from '../../src/components/MemberSettingsModal';
import ToastStack, { type ToastItem } from '../../src/components/Toast';
import type { GameOrPenalty, Part } from '../../src/models/GameOrPenalty';
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
    navigation.setOptions({
      title: params.partName ?? 'Wer?',
      headerShown: true,
      headerRight: () => (
        <TouchableOpacity onPress={() => setMemberSettingsVisible(true)} style={{ marginRight: 12 }}>
          <Settings size={20} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, params.partName]);

  const theme = useTheme();
  const ui = useUIColors();
  const { members, games } = useLocalData();
  const { addToQueue, flush } = useSyncQueue();
  useNetworkSync(flush);

  const [pinnedParts, setPinnedParts] = useState<PinnedPart[]>([]);
  const [hiddenMemberIds, setHiddenMemberIds] = useState<number[]>([]);
  const [memberSettingsVisible, setMemberSettingsVisible] = useState(false);
  const [memberDisplayMode, setMemberDisplayMode] = useState<MemberDisplayMode>('nickname');

  useEffect(() => {
    getWorkingSettings().then((s) => {
      setPinnedParts(s.pinnedParts);
      setHiddenMemberIds(s.hiddenMemberIds);
    });
    getDisplaySettings().then((s) => setMemberDisplayMode(s.memberDisplayMode));
  }, []);

  const TABS = ['members', 'guests'] as const;
  const [tab, setTab] = useState<'members' | 'guests'>('members');
  // pagerOffset: 0 = members visible, -width = guests visible
  const pagerOffset = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();

  const tabRef = useRef(tab);
  tabRef.current = tab;

  function switchTab(newTab: 'members' | 'guests') {
    if (newTab === tabRef.current) return;
    tabRef.current = newTab;
    setTab(newTab);
    Animated.timing(pagerOffset, {
      toValue: newTab === 'guests' ? -width : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  const switchTabRef = useRef(switchTab);
  switchTabRef.current = switchTab;

  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 15,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50 && tabRef.current === 'members') switchTabRef.current('guests');
        else if (g.dx > 50 && tabRef.current === 'guests') switchTabRef.current('members');
      },
    })
  ).current;

  const [guests, setGuests] = useState<Guest[]>([]);
  const [onceDone, setOnceDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!partOnce) return;
    (async () => {
      const [results, sessionGroup] = await Promise.all([
        getResults(),
        getOrCreateSession(),
      ]);
      const done = new Set<string>();
      for (const r of results) {
        if (r.partId === partId && r.sessionGroup === sessionGroup) {
          if (r.memberId !== null) done.add(`m-${r.memberId}`);
        }
      }
      setOnceDone(done);
    })();
  }, [partId, partOnce]);

  // Dialog for variable-value entry (regular or shortcut)
  const [dialogTarget, setDialogTarget] = useState<{ id: string; name: string } | null>(null);
  const [shortcutDialog, setShortcutDialog] = useState<{
    memberKey: string;
    memberName: string;
    game: GameOrPenalty;
    part: Part;
  } | null>(null);

  // Shortcut menu
  const [shortcutMenuTarget, setShortcutMenuTarget] = useState<{
    memberKey: string;
    memberName: string;
  } | null>(null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);


  function showToast(message: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }

  const cellSize = Math.floor((width - 32 - COLUMNS * BUTTON_MARGIN) / COLUMNS);

  async function recordResult(
    memberId: number | null,
    guestName: string | null,
    value: number,
    displayName: string,
    overrideGameId?: number,
    overridePartId?: number,
  ) {
    const sessionGroup = await getOrCreateSession();
    const entry = {
      id: uuidv4(),
      memberId,
      guestName,
      gameId: overrideGameId ?? gameId,
      partId: overridePartId ?? partId,
      value,
      timestamp: new Date().toISOString(),
      synced: false,
      sessionGroup,
    };
    await addResult(entry);
    await touchSession();
    await addToQueue(entry);
    await flush();
    if (!stay && overrideGameId === undefined) {
      router.back();
    } else {
      showToast(`✓ ${displayName} — ${overridePartId !== undefined
        ? (games.find(g => g.id === (overrideGameId ?? gameId))?.parts.find(p => p.id === overridePartId)?.name ?? '')
        : params.partName} — ${value}`);
    }
  }

  function handleMemberPress(memberId: number, nickname: string) {
    const key = `m-${memberId}`;
    if (onceDone.has(key)) return;
    if (partVariable) {
      setDialogTarget({ id: key, name: nickname });
    } else {
      recordResult(memberId, null, partValue, nickname);
      if (partOnce) setOnceDone((prev) => new Set([...prev, key]));
    }
  }

  function handleMemberLongPress(memberId: number, nickname: string) {
    setShortcutMenuTarget({ memberKey: `m-${memberId}`, memberName: nickname });
  }

  function handleGuestPress(guest: Guest) {
    const key = `g-${guest.id}`;
    if (onceDone.has(key)) return;
    if (partVariable) {
      setDialogTarget({ id: key, name: guest.name });
    } else {
      recordResult(null, guest.name, partValue, guest.name);
      if (partOnce) setOnceDone((prev) => new Set([...prev, key]));
    }
  }

  function handleGuestLongPress(guest: Guest) {
    setShortcutMenuTarget({ memberKey: `g-${guest.id}`, memberName: guest.name });
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
    if (partOnce) setOnceDone((prev) => new Set([...prev, key]));
    setDialogTarget(null);
  }

  function handleShortcutSelect(game: GameOrPenalty, part: Part) {
    if (!shortcutMenuTarget) return;
    setShortcutMenuTarget(null);
    const { memberKey, memberName } = shortcutMenuTarget;
    if (part.variable) {
      setShortcutDialog({ memberKey, memberName, game, part });
    } else {
      const memberId = memberKey.startsWith('m-') ? parseInt(memberKey.slice(2), 10) : null;
      const guestName = memberKey.startsWith('g-')
        ? guests.find((g) => g.id === memberKey.slice(2))?.name ?? memberName
        : null;
      recordResult(memberId, guestName, part.value, memberName, game.id, part.id);
    }
  }

  function handleShortcutDialogConfirm(value: number) {
    if (!shortcutDialog) return;
    const { memberKey, memberName, game, part } = shortcutDialog;
    const memberId = memberKey.startsWith('m-') ? parseInt(memberKey.slice(2), 10) : null;
    const guestName = memberKey.startsWith('g-')
      ? guests.find((g) => g.id === memberKey.slice(2))?.name ?? memberName
      : null;
    recordResult(memberId, guestName, value, memberName, game.id, part.id);
    setShortcutDialog(null);
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
      <View style={{ flexDirection: 'row', backgroundColor: theme.primary, paddingHorizontal: 16, paddingTop: 8 }}>
        {TABS.map((tabKey) => (
          <TouchableOpacity
            key={tabKey}
            onPress={() => switchTab(tabKey)}
            style={[
              { marginRight: 16, paddingBottom: 8, borderBottomWidth: 2 },
              tab === tabKey ? { borderBottomColor: '#fff' } : { borderBottomColor: 'transparent' },
            ]}
          >
            <Text
              style={{
                fontFamily: tab === tabKey ? 'DMSans_600SemiBold' : 'DMSans_400Regular',
                color: tab === tabKey ? '#fff' : 'rgba(255,255,255,0.55)',
              }}
            >
              {tabKey === 'members' ? t('selectwho.members') : t('selectwho.guests')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content — two pages side by side, container slides */}
      <View style={{ flex: 1, overflow: 'hidden' }} {...swipe.panHandlers}>
        <Animated.View style={{ flex: 1, flexDirection: 'row', width: width * 2, transform: [{ translateX: pagerOffset }] }}>

          {/* Members page */}
          <ScrollView style={{ width }} contentContainerStyle={{ padding: 16 }} nestedScrollEnabled>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {members.filter((m) => !hiddenMemberIds.includes(m.id)).sort((a, b) => getMemberDisplayName(a, memberDisplayMode).localeCompare(getMemberDisplayName(b, memberDisplayMode))).map((m) => {
                const displayName = getMemberDisplayName(m, memberDisplayMode);
                return (
                <MemberButton
                  key={m.id}
                  nickname={displayName}
                  pic={m.pic}
                  size={cellSize}
                  disabled={partOnce && onceDone.has(`m-${m.id}`)}
                  onPress={() => handleMemberPress(m.id, displayName)}
                  onLongPress={() => handleMemberLongPress(m.id, displayName)}
                />
                );
              })}
            </View>
          </ScrollView>

          {/* Guests page */}
          <ScrollView style={{ width }} contentContainerStyle={{ padding: 16 }} nestedScrollEnabled>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {guests.map((g) => (
                <MemberButton
                  key={g.id}
                  nickname={g.name}
                  pic={null}
                  size={cellSize}
                  disabled={partOnce && onceDone.has(`g-${g.id}`)}
                  onPress={() => handleGuestPress(g)}
                  onLongPress={() => handleGuestLongPress(g)}
                />
              ))}
              <TouchableOpacity
                style={{
                  width: Math.min(cellSize, 160),
                  height: Math.min(cellSize, 160),
                  margin: 4,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: ui.textFaint,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={addGuest}
              >
                <Text className="text-3xl text-gray-400 dark:text-gray-500">+</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t('selectwho.addGuest')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

        </Animated.View>
      </View>

      {/* Back button */}
      <View style={{ backgroundColor: theme.primary, padding: 12 }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingVertical: 10 }}
          onPress={() => router.back()}
        >
          <ArrowLeft size={16} color="#fff" />
          <Text style={{ fontFamily: 'DMSans_500Medium', color: '#fff' }}>
            {t('selectwho.back')} {params.gameName}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success toasts */}
      <ToastStack toasts={toasts} />

      {/* Regular value input dialog */}
      <ValueDialog
        visible={!!dialogTarget}
        partName={params.partName ?? ''}
        memberName={dialogTarget?.name ?? ''}
        onConfirm={handleDialogConfirm}
        onCancel={() => setDialogTarget(null)}
      />

      {/* Shortcut value input dialog */}
      <ValueDialog
        visible={!!shortcutDialog}
        partName={shortcutDialog?.part.name ?? ''}
        memberName={shortcutDialog?.memberName ?? ''}
        onConfirm={handleShortcutDialogConfirm}
        onCancel={() => setShortcutDialog(null)}
      />

      {/* Member visibility settings */}
      <MemberSettingsModal
        visible={memberSettingsVisible}
        members={members}
        onClose={() => {
          setMemberSettingsVisible(false);
          getWorkingSettings().then((s) => setHiddenMemberIds(s.hiddenMemberIds));
        }}
      />

      {/* Shortcut menu */}
      <ShortcutMenu
        visible={!!shortcutMenuTarget}
        memberName={shortcutMenuTarget?.memberName ?? ''}
        games={games}
        pinnedParts={pinnedParts}
        onSelect={handleShortcutSelect}
        onCancel={() => setShortcutMenuTarget(null)}
      />
    </View>
  );
}
