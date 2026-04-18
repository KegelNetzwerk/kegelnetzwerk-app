import ClubBackground from '../../src/components/ClubBackground';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  Easing,
  TouchableOpacity,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Settings, Pencil } from 'lucide-react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useUIColors } from '../../src/hooks/useUIColors';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useLocalData } from '../../src/hooks/useLocalData';
import { useSyncQueue } from '../../src/hooks/useSyncQueue';
import { addResult, getResults } from '../../src/storage/resultPackage';
import { getOrCreateSession, touchSession } from '../../src/storage/session';
import { getWorkingSettings, type PinnedPart } from '../../src/storage/workingSettings';
import { getGuests, saveGuests } from '../../src/storage/guests';
import { pullGuests } from '../../src/api/guests';
import { getDisplaySettings, getMemberDisplayName, type MemberDisplayMode } from '../../src/storage/displaySettings';
import { useAuth } from '../../src/hooks/useAuth';
import MemberButton from '../../src/components/MemberButton';
import ValueDialog from '../../src/components/ValueDialog';
import ShortcutMenu from '../../src/components/ShortcutMenu';
import MemberSettingsModal from '../../src/components/MemberSettingsModal';
import ToastStack, { type ToastItem } from '../../src/components/Toast';
import { setPendingToast } from '../../src/storage/pendingToast';
import GuestDialog from '../../src/components/GuestDialog';
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
    partFactor: string;
    partBonus: string;
    partVariable: string;
    partOnce: string;
    stay: string;
  }>();

  const gameId = Number.parseInt(params.gameId ?? '0', 10);
  const partId = Number.parseInt(params.partId ?? '0', 10);
  const partValue = Number.parseFloat(params.partValue ?? '0');
  const partFactor = Number.parseFloat(params.partFactor ?? '1');
  const partBonus = Number.parseFloat(params.partBonus ?? '0');
  const partVariable = params.partVariable === '1';
  const partOnce = params.partOnce === '1';
  const stay = params.stay === '1';

  function applyFormula(rawValue: number, factor: number, bonus: number): number {
    return rawValue * factor + bonus;
  }

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/working');
    }
  }

  const [lastResult, setLastResult] = useState<{ memberLabel: string; value: number } | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontFamily: 'DMSans_700Bold', fontSize: 16 }}>
            {params.partName ?? 'Wer?'}
          </Text>
          {lastResult && (
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'DMSans_400Regular', fontSize: 11 }}>
              ✓ {lastResult.memberLabel} · {lastResult.value}
            </Text>
          )}
        </View>
      ),
      headerShown: true,
      headerLeft: () => (
        <TouchableOpacity onPress={goBack} style={{ marginLeft: 12 }}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={() => setMemberSettingsVisible(true)} style={{ marginRight: 12 }}>
          <Settings size={20} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, params.partName, lastResult]);

  const theme = useTheme();
  const ui = useUIColors();
  const insets = useSafeAreaInsets();
  const { members, games } = useLocalData();
  const { addToQueue, flush } = useSyncQueue();

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
    getGuests().then(setGuests);
  }, []);

  const [guestDialog, setGuestDialog] = useState<{ visible: boolean; guest?: Guest }>({ visible: false });

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
    if (newTab === 'guests') {
      pullGuests().then(setGuests).catch(() => {});
    }
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

  useEffect(() => {
    saveGuests(guests);
  }, [guests]);

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
  const toastIdRef = useRef(0);

  function showToast(message: string) {
    const id = String(++toastIdRef.current);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }

  const cellSize = Math.floor((width - 32 - COLUMNS * BUTTON_MARGIN) / COLUMNS);

  async function recordResult(
    memberId: number | null,
    guestLocalId: string | null,
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
      guestLocalId,
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
    setLastResult({ memberLabel: displayName, value });
    const message = `✓ ${displayName} — ${overridePartId !== undefined
      ? (games.find(g => g.id === (overrideGameId ?? gameId))?.parts.find(p => p.id === overridePartId)?.name ?? '')
      : params.partName} — ${value}`;
    setPendingToast(message);
    if (!stay && overrideGameId === undefined) {
      router.back();
    } else {
      showToast(message);
    }
  }

  function handleMemberPress(memberId: number, nickname: string) {
    const key = `m-${memberId}`;
    if (onceDone.has(key)) return;
    if (partVariable) {
      setDialogTarget({ id: key, name: nickname });
    } else {
      recordResult(memberId, null, null, applyFormula(partValue, partFactor, partBonus), nickname);
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
      setDialogTarget({ id: key, name: guest.nickname });
    } else {
      recordResult(null, guest.id, guest.nickname, applyFormula(partValue, partFactor, partBonus), guest.nickname);
      if (partOnce) setOnceDone((prev) => new Set([...prev, key]));
    }
  }

  function handleGuestLongPress(guest: Guest) {
    setShortcutMenuTarget({ memberKey: `g-${guest.id}`, memberName: guest.nickname });
  }

  function handleDialogConfirm(value: number) {
    if (!dialogTarget) return;
    const key = dialogTarget.id;
    const final = applyFormula(value, partFactor, partBonus);
    if (key.startsWith('m-')) {
      const memberId = Number.parseInt(key.slice(2), 10);
      recordResult(memberId, null, null, final, dialogTarget.name);
    } else {
      const guestLocalId = key.slice(2);
      const guest = guests.find((g) => g.id === guestLocalId);
      if (guest) recordResult(null, guest.id, guest.nickname, final, guest.nickname);
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
      const memberId = memberKey.startsWith('m-') ? Number.parseInt(memberKey.slice(2), 10) : null;
      const guestLocalId = memberKey.startsWith('g-') ? memberKey.slice(2) : null;
      const guestName = guestLocalId
        ? guests.find((g) => g.id === guestLocalId)?.nickname ?? memberName
        : null;
      recordResult(memberId, guestLocalId, guestName, applyFormula(part.value, part.factor, part.bonus), memberName, game.id, part.id);
    }
  }

  function handleShortcutDialogConfirm(value: number) {
    if (!shortcutDialog) return;
    const { memberKey, memberName, game, part } = shortcutDialog;
    const memberId = memberKey.startsWith('m-') ? Number.parseInt(memberKey.slice(2), 10) : null;
    const guestLocalId = memberKey.startsWith('g-') ? memberKey.slice(2) : null;
    const guestName = guestLocalId
      ? guests.find((g) => g.id === guestLocalId)?.nickname ?? memberName
      : null;
    recordResult(memberId, guestLocalId, guestName, applyFormula(value, part.factor, part.bonus), memberName, game.id, part.id);
    setShortcutDialog(null);
  }

  function handleGuestSave(saved: Guest) {
    const isNew = !saved.id;
    const id = saved.id || uuidv4();
    const guest: Guest = { ...saved, id };
    if (isNew) {
      setGuests((prev) => [...prev, guest]);
    } else {
      setGuests((prev) => prev.map((g) => g.id === id ? guest : g));
    }
    setGuestDialog({ visible: false });
  }

  function handleGuestDelete(guestId: string) {
    setGuests((prev) => prev.filter((g) => g.id !== guestId));
    setGuestDialog({ visible: false });
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
                <View key={g.id} style={{ position: 'relative' }}>
                  <MemberButton
                    nickname={g.nickname}
                    pic={null}
                    picUri={g.picUri}
                    size={cellSize}
                    disabled={partOnce && onceDone.has(`g-${g.id}`)}
                    onPress={() => handleGuestPress(g)}
                    onLongPress={() => handleGuestLongPress(g)}
                  />
                  <TouchableOpacity
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 10,
                      padding: 4,
                    }}
                    onPress={() => setGuestDialog({ visible: true, guest: g })}
                  >
                    <Pencil size={11} color="#fff" />
                  </TouchableOpacity>
                </View>
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
                onPress={() => setGuestDialog({ visible: true })}
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
      <View style={{ backgroundColor: theme.primary, padding: 12, paddingBottom: 12 + insets.bottom }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingVertical: 10 }}
          onPress={goBack}
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

      {/* Guest add/edit dialog */}
      <GuestDialog
        visible={guestDialog.visible}
        guest={guestDialog.guest}
        onSave={handleGuestSave}
        onDelete={handleGuestDelete}
        onCancel={() => setGuestDialog({ visible: false })}
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
