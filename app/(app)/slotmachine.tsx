import ClubBackground from '../../src/components/ClubBackground';
import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions, Modal } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/hooks/useColors';
import { Settings, Volume2, VolumeX, X } from 'lucide-react-native';
import { fetchFinanceSummary } from '../../src/api/finance';
import { useSlot } from '../../src/hooks/useSlot';
import { postDonSettle } from '../../src/api/slot';
import { useSlotSounds } from '../../src/hooks/useSlotSounds';
import Reel, { STOP_DELAY } from '../../src/components/slot/Reel';
import PaylineOverlay from '../../src/components/slot/PaylineOverlay';
import { FeatureTriggerModal, FeatureSummaryModal } from '../../src/components/slot/FeatureBanner';
import SlotGuideModal from '../../src/components/slot/SlotGuideModal';
import DoubleOrNothingModal from '../../src/components/slot/DoubleOrNothingModal';
import ToastStack from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';
import { LINE_OPTIONS, BET_OPTIONS, SYMBOLS } from '../../src/utils/slotLogic';
import { secureRandom } from '../../src/utils/random';

const NUM_REELS = 5;

const K_COLOR = '#facc15'; // yellow — KNC unit symbol only

// ── Loader shell ─────────────────────────────────────────────────────────────
// Fetches the KNC balance before mounting SlotGame so that useSlot is always
// initialized with the correct value (useState ignores later prop changes).

export default function SlotMachineScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const c = useColors();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('slotMachine.title'), headerShown: true });
  }, [navigation, t]);

  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetchFinanceSummary()
      .then((d) => setBalance(d.kncBalance))
      .catch(() => setBalance(0));
  }, []);

  if (balance === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ClubBackground />
        <ActivityIndicator color={c.primaryFg} size="large" />
      </View>
    );
  }

  return <SlotGame initialBalance={balance} />;
}

// ── Game component ────────────────────────────────────────────────────────────

function renderSpinContent(
  isSpinning: boolean,
  isFeature: boolean,
  spinDisabled: boolean,
  t: (key: string) => string,
  textMuted: string,
) {
  const textColor = spinDisabled ? textMuted : '#fff';
  if (isSpinning) return <ActivityIndicator color={textColor} />;
  if (isFeature) {
    return (
      <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: textColor, letterSpacing: 2 }}>
        {t('slotMachine.spin')} 🎰
      </Text>
    );
  }
  return (
    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: textColor, letterSpacing: 1 }}>
      {t('slotMachine.spin')}
    </Text>
  );
}

function HeaderSettingsButton({ onPress }: Readonly<{ onPress: () => void }>) {
  return (
    <TouchableOpacity onPress={onPress} style={{ marginRight: 16, padding: 4 }}>
      <Settings size={20} color="#fff" />
    </TouchableOpacity>
  );
}

function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const c = useColors();
  const THUMB = 22;
  const [trackW, setTrackW] = useState(0);

  const apply = (x: number) => {
    if (!trackW) return;
    onChange(Number.parseFloat(Math.max(0, Math.min(1, x / trackW)).toFixed(2)));
  };

  return (
    <View
      style={{ height: 40, justifyContent: 'center' }}
      onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => apply(e.nativeEvent.locationX)}
      onResponderMove={(e) => apply(e.nativeEvent.locationX)}
    >
      <View style={{ height: 4, backgroundColor: c.divider, borderRadius: 2 }} />
      <View style={{
        position: 'absolute', left: 0, height: 4,
        width: trackW > 0 ? value * trackW : 0,
        backgroundColor: c.primaryFg, borderRadius: 2,
      }} />
      {trackW > 0 && (
        <View style={{
          position: 'absolute',
          left: Math.max(0, Math.min(trackW - THUMB, value * trackW - THUMB / 2)),
          width: THUMB, height: THUMB, borderRadius: THUMB / 2,
          backgroundColor: c.primaryFg,
          elevation: 4, shadowColor: '#000', shadowOpacity: 0.2,
          shadowRadius: 3, shadowOffset: { width: 0, height: 2 },
        }} />
      )}
    </View>
  );
}

function SlotGame({ initialBalance }: { initialBalance: number }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const c = useColors();

  // Reels fill up to 60% of the visible viewport height (minus header ~56px + safe insets).
  const REEL_PADDING = 12; // 6px on each side
  const availableHeight = windowHeight - insets.top - insets.bottom - 56;
  const cellHeight = Math.max(48, Math.floor((availableHeight * 0.5 - REEL_PADDING) / 3));
  const { toasts, showToast } = useToast();
  const sounds = useSlotSounds();
  const slot = useSlot(initialBalance);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);

  // Double-or-nothing state
  const [donVisible, setDonVisible] = useState(false);
  const [donWin, setDonWin] = useState(0);
  const [donFlips, setDonFlips] = useState(0);
  const [donResult, setDonResult] = useState<'win' | 'lose' | null>(null);
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [donFlipDuration, setDonFlipDuration] = useState(4000);
  const [donFlashToggle, setDonFlashToggle] = useState(false);
  const donOriginalWinRef = useRef(0);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <HeaderSettingsButton onPress={() => setSettingsVisible(true)} />,
    });
  }, [navigation, c.primaryFg]);

  // Show errors as toasts
  useEffect(() => {
    if (!slot.error) return;
    if (slot.error === 'offline') showToast(t('slotMachine.error.offline'));
    else if (slot.error === 'insufficient_balance') showToast(t('slotMachine.error.insufficientBalance'));
    else showToast(t('slotMachine.error.api'));
    slot.clearError();
  }, [slot.error]);

  const handleSpin = useCallback(async () => {
    cyclingGenRef.current++;
    setCyclingIndex(-1);
    setShowPaylinePreview(false);
    sounds.play('spin_start');
    sounds.startSpinning();
    setDisplayedBalance(kncBalanceRef.current - totalBetRef.current);
    await slot.spin();
  }, [slot.spin]);

  const openDon = useCallback(() => {
    // Only initialize win on first open; preserve state when toggling popup
    if (donFlipsRef.current === 0 && donResultRef.current === null) {
      donOriginalWinRef.current = slot.lastWin;
      setDonWin(slot.lastWin);
    }
    setDonVisible(true);
  }, [slot.lastWin]);

  const closeDon = useCallback(() => {
    setDonVisible(false);
    // Settle only when the round is decided (win or lose), not when just peeking
    if (donResultRef.current !== null) {
      postDonSettle(donOriginalWinRef.current, donWinRef.current)
        .then((r) => { slot.updateBalance(r.kncBalance); setDisplayedBalance(r.kncBalance); })
        .catch(() => {});
    }
  }, [slot.updateBalance]);

  const donWinRef = useRef(donWin);
  donWinRef.current = donWin;
  const donFlipsRef = useRef(donFlips);
  donFlipsRef.current = donFlips;
  const donResultRef = useRef(donResult);
  donResultRef.current = donResult;

  const handleCoinFlip = useCallback(() => {
    if (coinFlipping || donResult === 'lose' || donFlips >= 5) return;
    const startWin = donWinRef.current;
    const duration = 3000 + secureRandom() * 2000; // 3–5 seconds
    setDonFlipDuration(duration);
    setCoinFlipping(true);
    // Play coin_flip sound on every full rotation (240 ms cycle)
    const flipInterval = setInterval(() => sounds.play('coin_flip'), 240);
    setTimeout(() => {
      clearInterval(flipInterval);
      const won = secureRandom() < 0.5;
      setCoinFlipping(false);
      setDonFlips((f) => f + 1);
      if (won) {
        const newWin = startWin * 2;
        setDonWin(newWin);
        setDonResult('win');
        setDisplayedBalance(kncBalanceRef.current - donOriginalWinRef.current + newWin);
        sounds.play(newWin >= 500 ? 'win_big' : 'win_small');
      } else {
        setDonWin(0);
        setDonResult('lose');
        setDisplayedBalance(kncBalanceRef.current - donOriginalWinRef.current);
        sounds.play('coin_lost');
      }
    }, duration);
  }, [coinFlipping, donResult, donFlips, sounds]);

  const isFeature = slot.featureSpinsLeft > 0;
  const insufficientBalance = !isFeature && (Number.isNaN(slot.kncBalance) || slot.kncBalance < slot.totalBet);
  const spinDisabled = !slot.canSpin || insufficientBalance;

  const [highlightEnabled, setHighlightEnabled] = useState(false);
  const [showPaylinePreview, setShowPaylinePreview] = useState(false);
  const [winVisible, setWinVisible] = useState(false);
  const [expandTriggers, setExpandTriggers] = useState([0, 0, 0, 0, 0]);
  const [useExpandedWins, setUseExpandedWins] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [featureModalVisible, setFeatureModalVisible] = useState(false);
  const [bookHighlightEnabled, setBookHighlightEnabled] = useState(false);
  const [winDisplayed, setWinDisplayed] = useState(0);
  const [cyclingIndex, setCyclingIndex] = useState(-1);
  const cyclingGenRef = useRef(0);

  const [displayedBalance, setDisplayedBalance] = useState(slot.kncBalance);
  const kncBalanceRef = useRef(slot.kncBalance);
  kncBalanceRef.current = slot.kncBalance;
  const totalBetRef = useRef(slot.totalBet);
  totalBetRef.current = slot.totalBet;

  // Event 2: win revealed after animations
  useEffect(() => {
    if (winVisible) setDisplayedBalance(kncBalanceRef.current);
  }, [winVisible]);

  // Event 2b: no-win spin — update after readySpin (canSpin becomes true)
  useEffect(() => {
    if (slot.canSpin && hasSpunRef.current) setDisplayedBalance(kncBalanceRef.current);
  }, [slot.canSpin]);

  // Flash the 2× button while the action is available but not yet opened
  useEffect(() => {
    const shouldFlash = donResult !== 'lose' && winVisible && slot.lastWin > 0 && !donVisible && donFlips === 0;
    if (!shouldFlash) { setDonFlashToggle(false); return; }
    const id = setInterval(() => setDonFlashToggle((v) => !v), 500);
    return () => clearInterval(id);
  }, [donResult, winVisible, slot.lastWin, donVisible, donFlips]);
  const winScale = useSharedValue(1);
  const winAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: winScale.value }] }));
  const featureSummaryRef = useRef(slot.featureSummary);
  featureSummaryRef.current = slot.featureSummary;
  const hasSpunRef = useRef(false);

  useEffect(() => {
    if (slot.isSpinning) {
      hasSpunRef.current = true;
      setHighlightEnabled(false);
      setWinVisible(false);
      setExpandTriggers([0, 0, 0, 0, 0]);
      setUseExpandedWins(false);
      setFeatureModalVisible(false);
      setBookHighlightEnabled(false);
      setShowPaylinePreview(false);
      cyclingGenRef.current++;
      setCyclingIndex(-1);
      setDonVisible(false);
      setDonWin(0);
      setDonFlips(0);
      setDonResult(null);
      setCoinFlipping(false);
      return;
    }

    if (!hasSpunRef.current) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const hasWin = slot.lastWin > 0;
    const hasFeature = slot.featureJustTriggered;
    const hasExpansion = slot.lastSpinHadExpansion && !!slot.expandingSymbol;

    // When 2+ kegel appear on the first 3 reels, reels 4 & 5 spin 2s/4s longer.
    // Shift all post-stop timers by the same amount so they fire after the last reel lands.
    const bookCountFirst3 = slot.originalReels
      .slice(0, 3)
      .reduce((n, reel) => n + reel.filter((s) => s === 'book').length, 0);
    const extraWait = bookCountFirst3 >= 2 ? 4000 : 0;
    // When free spins just ended, delay the summary popup so win animations finish first.
    const summaryDelay = featureSummaryRef.current ? 3000 : 0;

    timers.push(setTimeout(() => {
      setHighlightEnabled(true);
      if (hasFeature) {
        sounds.play('feature_trigger');
        setBookHighlightEnabled(true);
      } else if (slot.lastWin >= 100) {
        sounds.play('win_jackpot');
      } else if (slot.lastWin >= 30) {
        sounds.play('win_big');
      } else if (slot.lastWin > 0) {
        sounds.play('win_small');
      }
      // No win, no feature, no expansion — nothing left to animate, re-enable immediately
      if (!hasWin && !hasFeature && !hasExpansion) {
        slot.readySpin();
        if (featureSummaryRef.current) setSummaryVisible(true);
      }
    }, 2500 + extraWait));

    if (hasFeature) {
      timers.push(setTimeout(() => {
        setBookHighlightEnabled(false);
        setFeatureModalVisible(true);
      }, 3800 + extraWait));
    }

    if (hasExpansion) {
      const sym = slot.expandingSymbol!;
      const EXPANSION_START = 3700 + extraWait;
      const STAGGER = 300;
      for (let i = 0; i < NUM_REELS; i++) {
        if (!slot.originalReels[i].includes(sym)) continue;
        timers.push(setTimeout(() => {
          setExpandTriggers((prev) => { const n = [...prev]; n[i]++; return n; });
        }, EXPANSION_START + i * STAGGER));
      }
      const switchAt = EXPANSION_START + (NUM_REELS - 1) * STAGGER + 500;
      timers.push(
        setTimeout(() => { setHighlightEnabled(false); setUseExpandedWins(true); }, switchAt),
        setTimeout(() => setHighlightEnabled(true), switchAt + 50),
        setTimeout(() => setWinVisible(true), switchAt + 300),
        setTimeout(() => {
          slot.readySpin();
          if (featureSummaryRef.current) {
            cyclingGenRef.current++;
            setCyclingIndex(-1);
            setSummaryVisible(true);
          }
        }, switchAt + 500 + summaryDelay),
      );
    } else if (hasWin || hasFeature) {
      // Win or feature modal pending — show win display then re-enable
      timers.push(
        setTimeout(() => setWinVisible(true), 3700 + extraWait),
        setTimeout(() => {
          slot.readySpin();
          if (featureSummaryRef.current) {
            cyclingGenRef.current++;
            setCyclingIndex(-1);
            setSummaryVisible(true);
          }
        }, 4000 + extraWait + summaryDelay),
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [slot.isSpinning, slot.readySpin]);

  const displayWin = donFlips > 0 ? donWin : slot.lastWin;

  useEffect(() => {
    if (!winVisible || displayWin <= 0) { setWinDisplayed(0); return; }
    const steps = 28;
    const ms = 700 / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setWinDisplayed(step >= steps ? displayWin : Math.round((displayWin / steps) * step));
      if (step >= steps) {
        clearInterval(timer);
        winScale.value = withSequence(withTiming(1.15, { duration: 100 }), withTiming(1, { duration: 150 }));
      }
    }, ms);
    return () => clearInterval(timer);
  }, [winVisible, displayWin]);

  const currentWinCells = useExpandedWins ? slot.winningCells : slot.originalWinningCells;
  const currentWinLines = useExpandedWins ? slot.winningLines : slot.originalWinningLines;

  // Cycle winning line overlays one-by-one during free spin expansion wins.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!winVisible) return;
    if (!slot.lastSpinHadExpansion || !slot.expandingSymbol) return;

    // Cycle through all active paylines — the expanding symbol fills entire reels so
    // every payline passes through the expanded area; no payline wins needed.
    const lineCount = slot.activeLines;
    if (lineCount === 0) return;

    const gen = ++cyclingGenRef.current;
    let idx = 0;
    let cyclesDone = 0;
    const MAX_CYCLES = 5;

    function tick() {
      if (cyclingGenRef.current !== gen) return;
      if (idx === 0 && cyclesDone >= MAX_CYCLES) return;
      setCyclingIndex(idx);
      sounds.play('win_small');
      setTimeout(() => {
        if (cyclingGenRef.current !== gen) return;
        setCyclingIndex(-1);
        setTimeout(() => {
          if (cyclingGenRef.current !== gen) return;
          const next = (idx + 1) % lineCount;
          if (next === 0) cyclesDone++;
          idx = next;
          tick();
        }, 80);
      }, 250);
    }

    tick();

    return () => {
      cyclingGenRef.current++;
      setCyclingIndex(-1);
    };
  }, [winVisible]);
  const winningRowsPerReel: Set<number>[] = Array.from({ length: NUM_REELS }, (_, reel) => {
    if (!highlightEnabled) return new Set<number>();
    const rows = new Set<number>();
    for (const key of currentWinCells) {
      const [r, row] = key.split('-').map(Number);
      if (r === reel) rows.add(row);
    }
    return rows;
  });

  return (
    <View style={{ flex: 1 }}>
      <ClubBackground />

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 14,
          paddingBottom: 24 + insets.bottom,
        }}
        scrollEnabled
      >
        {/* Info row: balance | win | lines·bet | free spins */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Balance */}
          <View style={{ flex: 1, backgroundColor: c.card, borderRadius: 10, borderWidth: 1, borderColor: c.divider, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: c.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>
              {t('slotMachine.balance')}
            </Text>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: c.text }}>
              {displayedBalance}{' '}<Text style={{ color: K_COLOR }}>K</Text>
            </Text>
          </View>

          {/* Win */}
          {(() => {
            const breakdownLines = winVisible && donFlips === 0
              ? currentWinLines.filter((w) => w.payout > 0)
              : [];
            const showBreakdown = breakdownLines.length >= 2 && breakdownLines.length <= 4;
            return (
              <View style={{ flex: 1, backgroundColor: c.card, borderRadius: 10, borderWidth: 1, borderColor: c.divider, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: c.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>
                  Gewinn
                </Text>
                {winVisible && displayWin > 0 ? (
                  <Animated.View style={[winAnimStyle, { alignItems: 'center' }]}>
                    {showBreakdown && (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 9, color: c.textMuted, marginBottom: 1 }}>
                        {breakdownLines.map((w) => `+${w.payout}K`).join(' ')} =
                      </Text>
                    )}
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: c.text }}>
                      +{winDisplayed}{' '}<Text style={{ color: K_COLOR }}>K</Text>
                    </Text>
                  </Animated.View>
                ) : (
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 16, color: c.textFaint }}>—</Text>
                )}
                {isFeature && slot.featureWinTotal > 0 && (
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: c.textMuted }}>
                    ({slot.featureWinTotal} K)
                  </Text>
                )}
              </View>
            );
          })()}

          {/* Bet per spin */}
          <View style={{ flex: 1, backgroundColor: c.card, borderRadius: 10, borderWidth: 1, borderColor: c.divider, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: c.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>
              {t('slotMachine.betPerSpin')}
            </Text>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: c.text }}>
              {slot.activeLines * slot.betPerLine}{' '}<Text style={{ color: K_COLOR }}>K</Text>
            </Text>
          </View>

          {/* Free spins */}
          <View style={{ flex: 1, backgroundColor: c.card, borderRadius: 10, borderWidth: 1, borderColor: c.divider, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: c.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>
              Freispiele
            </Text>
            {isFeature && slot.expandingSymbol ? (
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: c.text }}>
                {SYMBOLS[slot.expandingSymbol].emoji} {slot.featureSpinsLeft}
              </Text>
            ) : (
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 16, color: c.textFaint }}>—</Text>
            )}
          </View>
        </View>

        {/* Reels */}
        <View
          style={{
            backgroundColor: c.surface,
            borderRadius: 12,
            padding: 6,
            borderWidth: 1,
            borderColor: c.divider,
            flexDirection: 'row',
            gap: 4,
            height: cellHeight * 3 + REEL_PADDING,
          }}
        >
          {(() => {
          const bookCountFirst3 = slot.originalReels
            .slice(0, 3)
            .reduce((n, reel) => n + reel.filter((s) => s === 'book').length, 0);
          return Array.from({ length: NUM_REELS }, (_, i) => (
            <Reel
              key={i}
              reelIndex={i}
              symbols={slot.originalReels[i]}
              isSpinning={slot.isSpinning}
              winningRows={winningRowsPerReel[i]}
              expandingSymbol={slot.expandingSymbol}
              cellHeight={cellHeight}
              expandTrigger={expandTriggers[i]}
              expandToSymbol={slot.expandingSymbol}
              bookHighlight={bookHighlightEnabled && slot.originalReels[i].includes('book')}
              stopDelay={bookCountFirst3 >= 2 && (i === 3 || i === 4)
                ? STOP_DELAY[i] + (i === 3 ? 2000 : 4000)
                : undefined}
              onStopped={() => {
                const reelNum = i + 1;
                setTimeout(() => sounds.play(`reel_stop_${reelNum}` as Parameters<typeof sounds.play>[0]), 135);
                if (i === NUM_REELS - 1) sounds.stopSpinning();
              }}
            />
          ));
          })()}
          <PaylineOverlay
            winningLines={showPaylinePreview
              ? Array.from({ length: slot.activeLines }, (_, i) => ({ lineIndex: i, count: 5 }))
              : cyclingIndex >= 0
                ? slot.lastSpinHadExpansion
                  ? [{ lineIndex: cyclingIndex, symbolKey: slot.expandingSymbol!, count: 5, multiplier: 0, payout: 0 }]
                  : [currentWinLines.filter((w) => w.lineIndex >= 0)[cyclingIndex]].filter(Boolean)
                : currentWinLines}
            cellHeight={cellHeight}
            visible={showPaylinePreview || highlightEnabled}
            showCircles={showPaylinePreview}
          />
          <DoubleOrNothingModal
            visible={donVisible}
            flipsUsed={donFlips}
            currentWin={donWin}
            result={donResult}
            flipping={coinFlipping}
            flipDuration={donFlipDuration}
            onClose={closeDon}
          />
        </View>

        {/* Control row: lines cycle | bet cycle | spin */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Lines cycle — disabled only while reels are physically spinning */}
          <TouchableOpacity
            disabled={spinDisabled || isFeature}
            onPress={() => {
              const idx = LINE_OPTIONS.indexOf(slot.activeLines);
              slot.setActiveLines(LINE_OPTIONS[(idx + 1) % LINE_OPTIONS.length]);
              cyclingGenRef.current++;
              setCyclingIndex(-1);
              setShowPaylinePreview(true);
            }}
            style={{
              flex: 1, backgroundColor: c.card, borderRadius: 14, height: 62,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: c.divider,
              opacity: spinDisabled || isFeature ? 0.4 : 1,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: c.textMuted, textTransform: 'uppercase' }}>Linien</Text>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: c.text }}>{slot.activeLines}</Text>
          </TouchableOpacity>

          {/* Bet cycle */}
          <TouchableOpacity
            disabled={spinDisabled || isFeature}
            onPress={() => {
              const idx = BET_OPTIONS.indexOf(slot.betPerLine);
              slot.setBetPerLine(BET_OPTIONS[(idx + 1) % BET_OPTIONS.length]);
              cyclingGenRef.current++;
              setCyclingIndex(-1);
              setShowPaylinePreview(false);
            }}
            style={{
              flex: 1, backgroundColor: c.card, borderRadius: 14, height: 62,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: c.divider,
              opacity: spinDisabled || isFeature ? 0.4 : 1,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: c.textMuted, textTransform: 'uppercase' }}>Einsatz</Text>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: c.text }}>{slot.betPerLine}<Text style={{ color: K_COLOR }}>K</Text></Text>
          </TouchableOpacity>

          {/* Double-or-nothing */}
          {(() => {
            const donActive = donResult !== 'lose' && ((winVisible && slot.lastWin > 0) || donVisible || donFlips > 0);
            const flashing = donActive && !donVisible && donFlips === 0;
            const btnColor = !donActive ? c.card
              : flashing
                ? (donFlashToggle ? c.theme.secondary : c.primaryFg)
                : c.theme.secondary;
            return (
              <TouchableOpacity
                disabled={!donActive || spinDisabled}
                onPress={() => donVisible ? closeDon() : openDon()}
                style={{
                  flex: 1, borderRadius: 14, height: 62,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: btnColor,
                  borderWidth: 1, borderColor: donActive ? btnColor : c.divider,
                  opacity: donActive && !spinDisabled ? 1 : 0.4,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: donActive ? '#fff' : c.textMuted }}>
                  {t('slotMachine.double.button')}
                </Text>
              </TouchableOpacity>
            );
          })()}

          {/* Spin */}
          <TouchableOpacity
            onPress={() => {
              if (donVisible && donResult === 'lose') { closeDon(); handleSpin(); }
              else if (donVisible) handleCoinFlip();
              else handleSpin();
            }}
            disabled={spinDisabled}
            style={{
              flex: 2, backgroundColor: spinDisabled ? c.surface : c.primaryFg,
              borderRadius: 14, height: 62,
              alignItems: 'center', justifyContent: 'center',
              opacity: spinDisabled ? 0.7 : 1,
            }}
            activeOpacity={0.8}
          >
            {renderSpinContent(slot.isSpinning, isFeature, spinDisabled, t, c.textMuted)}
          </TouchableOpacity>
        </View>
        {/* DEV: trigger free spins without spinning */}
        {__DEV__ && slot.debugTriggerFeature && (
          <TouchableOpacity
            onPress={slot.debugTriggerFeature}
            style={{ backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#fff' }}>
              [DEV] Freispiele auslösen
            </Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      <FeatureTriggerModal
        visible={featureModalVisible}
        expandingSymbol={slot.expandingSymbol}
        onDismiss={() => { setFeatureModalVisible(false); slot.clearFeatureTriggered(); }}
      />
      <FeatureSummaryModal
        visible={summaryVisible}
        totalWon={slot.featureSummary?.totalWon ?? 0}
        onDismiss={() => { setSummaryVisible(false); slot.clearFeatureSummary(); }}
      />

      <ToastStack toasts={toasts} />

      {/* Settings bottom sheet */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setSettingsVisible(false)} />
          <View style={{
            backgroundColor: c.card,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: 24, paddingTop: 20, paddingBottom: Math.max(insets.bottom, 16) + 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: c.text }}>
                {t('slotMachine.settings.title')}
              </Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)} hitSlop={8}>
                <X size={22} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Volume row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <TouchableOpacity onPress={() => sounds.setVolume(sounds.volume > 0 ? 0 : 1)} hitSlop={8}>
                {sounds.volume === 0
                  ? <VolumeX size={22} color={c.textMuted} />
                  : <Volume2 size={22} color={c.primaryFg} />
                }
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: c.textMuted, marginBottom: 10 }}>
                  {t('slotMachine.settings.volume')}
                </Text>
                <VolumeSlider value={sounds.volume} onChange={sounds.setVolume} />
              </View>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: c.text, width: 40, textAlign: 'right' }}>
                {Math.round(sounds.volume * 100)}%
              </Text>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: c.divider, marginBottom: 16 }} />

            {/* Game guide button */}
            <TouchableOpacity
              onPress={() => { setSettingsVisible(false); setGuideVisible(true); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 }}
            >
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, color: c.primaryFg }}>
                📖  {t('slotMachine.settings.openGuide')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SlotGuideModal visible={guideVisible} onClose={() => setGuideVisible(false)} />
    </View>
  );
}
