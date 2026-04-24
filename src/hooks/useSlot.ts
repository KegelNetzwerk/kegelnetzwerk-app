import { useState, useRef, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { postSpin } from '../api/slot';
import {
  calculateWins,
  getWinningCells,
  INITIAL_REELS,
  SYMBOL_KEYS,
  type SymbolKey,
  type WinningLine,
  type BetOption,
} from '../utils/slotLogic';

const MIN_SPIN_MS = 1500;
const ACTIVE_LINES_KEY = 'slot_active_lines';
const BET_PER_LINE_KEY = 'slot_bet_per_line';

export type SlotError = 'offline' | 'insufficient_balance' | 'api_error';

export interface SlotState {
  reels: SymbolKey[][];
  originalReels: SymbolKey[][];
  isSpinning: boolean;
  canSpin: boolean;
  activeLines: number;
  betPerLine: BetOption;
  kncBalance: number;
  winningLines: WinningLine[];
  winningCells: Set<string>;
  originalWinningLines: WinningLine[];
  originalWinningCells: Set<string>;
  lastWin: number;
  lastSpinHadExpansion: boolean;
  featureSpinsLeft: number;
  expandingSymbol: SymbolKey | null;
  featureJustTriggered: boolean;
  featureWinTotal: number;
  featureSummary: { totalWon: number } | null;
  error: SlotError | null;
  totalBet: number;
  setActiveLines: (lines: number) => void;
  setBetPerLine: (bet: BetOption) => void;
  clearError: () => void;
  clearFeatureTriggered: () => void;
  clearFeatureSummary: () => void;
  spin: () => Promise<void>;
  readySpin: () => void;
  updateBalance: (balance: number) => void;
  debugTriggerFeature?: () => void;
}

export function useSlot(initialKncBalance: number): SlotState {
  const [reels, setReels] = useState<SymbolKey[][]>(INITIAL_REELS);
  const [originalReels, setOriginalReels] = useState<SymbolKey[][]>(INITIAL_REELS);
  const [isSpinning, setIsSpinning] = useState(false);
  const [canSpin, setCanSpin] = useState(true);
  const [activeLines, setActiveLines] = useState(5);
  const [betPerLine, setBetPerLine] = useState<BetOption>(1);

  // Restore persisted bet settings on mount
  useEffect(() => {
    AsyncStorage.multiGet([ACTIVE_LINES_KEY, BET_PER_LINE_KEY]).then(([[, linesVal], [, betVal]]) => {
      if (linesVal !== null) {
        const n = parseInt(linesVal, 10);
        if ([1, 3, 5, 7, 10].includes(n)) setActiveLines(n);
      }
      if (betVal !== null) {
        const n = parseInt(betVal, 10);
        if ([1, 2, 5, 10].includes(n)) setBetPerLine(n as BetOption);
      }
    });
  }, []);
  const [kncBalance, setKncBalance] = useState(initialKncBalance);
  const [winningLines, setWinningLines] = useState<WinningLine[]>([]);
  const [winningCells, setWinningCells] = useState<Set<string>>(new Set());
  const [originalWinningLines, setOriginalWinningLines] = useState<WinningLine[]>([]);
  const [originalWinningCells, setOriginalWinningCells] = useState<Set<string>>(new Set());
  const [lastWin, setLastWin] = useState(0);
  const [lastSpinHadExpansion, setLastSpinHadExpansion] = useState(false);
  const [featureSpinsLeft, setFeatureSpinsLeft] = useState(0);
  const [expandingSymbol, setExpandingSymbol] = useState<SymbolKey | null>(null);
  const [featureJustTriggered, setFeatureJustTriggered] = useState(false);
  const [featureWinTotal, setFeatureWinTotal] = useState(0);
  const [featureSummary, setFeatureSummary] = useState<{ totalWon: number } | null>(null);
  const [error, setError] = useState<SlotError | null>(null);

  const featureWinRef = useRef(0);
  const hydratedRef = useRef(false);

  const FEATURE_KEY = 'slot_feature_state';

  // Restore persisted feature state on mount
  useEffect(() => {
    AsyncStorage.getItem(FEATURE_KEY).then((raw) => {
      if (!raw) { hydratedRef.current = true; return; }
      try {
        const saved = JSON.parse(raw) as {
          featureSpinsLeft: number;
          expandingSymbol: SymbolKey | null;
          featureWinTotal: number;
        };
        if (saved.featureSpinsLeft > 0) {
          setFeatureSpinsLeft(saved.featureSpinsLeft);
          setExpandingSymbol(saved.expandingSymbol);
          featureWinRef.current = saved.featureWinTotal;
          setFeatureWinTotal(saved.featureWinTotal);
        }
      } catch { /* ignore malformed */ }
      hydratedRef.current = true;
    });
  }, []);

  // Persist feature state whenever it changes (only after hydration)
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (featureSpinsLeft > 0) {
      AsyncStorage.setItem(FEATURE_KEY, JSON.stringify({
        featureSpinsLeft,
        expandingSymbol,
        featureWinTotal,
      }));
    } else {
      AsyncStorage.removeItem(FEATURE_KEY);
    }
  }, [featureSpinsLeft, expandingSymbol, featureWinTotal]);

  const isInFeature = featureSpinsLeft > 0;
  const totalBet = isInFeature ? 0 : activeLines * betPerLine;

  async function spin() {
    if (!canSpin) return;

    const netState = await NetInfo.fetch();
    const isOnline = !!(netState.isConnected && netState.isInternetReachable !== false);
    if (!isOnline) { setError('offline'); return; }

    if (!isInFeature && kncBalance < totalBet) { setError('insufficient_balance'); return; }

    setCanSpin(false);
    setIsSpinning(true);
    setWinningLines([]);
    setWinningCells(new Set());
    setOriginalWinningLines([]);
    setOriginalWinningCells(new Set());
    setLastWin(0);
    setLastSpinHadExpansion(false);
    setError(null);

    const spinStart = Date.now();

    try {
      const response = await postSpin({
        lines: activeLines,
        bet: betPerLine,
        freeSpins: isInFeature,
        expandingSymbol: isInFeature ? (expandingSymbol ?? undefined) : undefined,
      });

      const typedReels = response.reels;
      const origReels = response.originalReels ?? typedReels;

      const wins = calculateWins(typedReels, activeLines, betPerLine, isInFeature ? (expandingSymbol ?? undefined) : undefined);
      const cells = getWinningCells(wins);
      const origWins = calculateWins(origReels, activeLines, betPerLine);
      const origCells = getWinningCells(origWins);

      const elapsed = Date.now() - spinStart;
      const wait = Math.max(0, MIN_SPIN_MS - elapsed);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));

      setReels(typedReels);
      setOriginalReels(origReels);
      setKncBalance(response.kncBalance);
      setLastWin(response.win);
      setWinningLines(wins);
      setWinningCells(cells);
      setOriginalWinningLines(origWins);
      setOriginalWinningCells(origCells);
      setLastSpinHadExpansion(response.expansionApplied ?? false);

      // Accumulate feature win total during free spins
      if (isInFeature) {
        featureWinRef.current += response.win;
        setFeatureWinTotal(featureWinRef.current);
      }

      if (response.featureTriggered) {
        // Retrigger: consume current free spin then add 10; fresh trigger: just add 10
        setFeatureSpinsLeft((prev) => Math.max(0, prev - (isInFeature ? 1 : 0)) + 10);
        if (response.expandingSymbol) {
          // Fresh trigger: new symbol, show modal, reset running total
          setExpandingSymbol(response.expandingSymbol);
          setFeatureJustTriggered(true);
          if (!isInFeature) {
            featureWinRef.current = 0;
            setFeatureWinTotal(0);
          }
        }
        // Retrigger (isFreeSpins + featureTriggered): server sends no new symbol,
        // just add 10 spins — expandingSymbol and running total unchanged.
      } else if (isInFeature) {
        const newLeft = Math.max(0, featureSpinsLeft - 1);
        setFeatureSpinsLeft(newLeft);
        if (newLeft === 0) {
          setFeatureSummary({ totalWon: featureWinRef.current });
          setExpandingSymbol(null);
          // featureWinRef reset happens in clearFeatureSummary
        }
      }
    } catch {
      setError('api_error');
      setCanSpin(true); // re-enable immediately on error; success path is handled by screen after animations
    } finally {
      setIsSpinning(false);
    }
  }

  const nonBookKeys = SYMBOL_KEYS.filter((s) => s !== 'book');

  return {
    reels,
    originalReels,
    isSpinning,
    canSpin,
    activeLines,
    betPerLine,
    kncBalance,
    winningLines,
    winningCells,
    originalWinningLines,
    originalWinningCells,
    lastWin,
    lastSpinHadExpansion,
    featureSpinsLeft,
    expandingSymbol,
    featureJustTriggered,
    featureWinTotal,
    featureSummary,
    error,
    totalBet,
    setActiveLines: (n: number) => {
      setActiveLines(n);
      AsyncStorage.setItem(ACTIVE_LINES_KEY, String(n)).catch(() => {});
    },
    setBetPerLine: (b: BetOption) => {
      setBetPerLine(b);
      AsyncStorage.setItem(BET_PER_LINE_KEY, String(b)).catch(() => {});
    },
    clearError: () => setError(null),
    clearFeatureTriggered: () => setFeatureJustTriggered(false),
    clearFeatureSummary: () => {
      setFeatureSummary(null);
      featureWinRef.current = 0;
      setFeatureWinTotal(0);
    },
    spin,
    updateBalance: (balance: number) => setKncBalance(balance),
    readySpin: useCallback(() => setCanSpin(true), []),
    debugTriggerFeature: __DEV__ ? () => {
      const sym = nonBookKeys[Math.floor(Math.random() * nonBookKeys.length)];
      setFeatureSpinsLeft(10);
      setExpandingSymbol(sym);
      setFeatureJustTriggered(true);
      featureWinRef.current = 0;
      setFeatureWinTotal(0);
    } : undefined,
  };
}
