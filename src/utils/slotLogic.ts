export type SymbolKey = 'book' | 'pin' | 'trophy' | 'target' | 'joker' | 'clover' | 'star' | 'bell' | 'slot' | 'dice';

export const SYMBOLS: Record<SymbolKey, { emoji: string; payouts: [number, number, number] }> = {
  pin:    { emoji: '🍺', payouts: [ 80,  800, 4000] }, // Explorer — top symbol
  trophy: { emoji: '🧈', payouts: [ 32,  320, 1600] }, // Pharaoh
  book:   { emoji: '🎳', payouts: [ 14,  144, 1440] }, // Wild + Scatter
  target: { emoji: '🍟', payouts: [ 24,   80,  600] }, // God Horus
  joker:  { emoji: '🍕', payouts: [ 24,   80,  600] }, // Scarab
  clover: { emoji: '🥨', payouts: [  4,   32,  120] }, // Ace / King
  star:   { emoji: '🥐', payouts: [  4,   32,  120] }, // Ace / King
  bell:   { emoji: '🍇', payouts: [  4,   20,   80] }, // 10
  slot:   { emoji: '🍐', payouts: [  4,   20,   80] }, // Jack
  dice:   { emoji: '🍓', payouts: [  4,   20,   80] }, // Queen
};

export const SYMBOL_KEYS = Object.keys(SYMBOLS) as SymbolKey[];

// 10 paylines for a 5×3 grid — each entry is the row index (0=top, 1=mid, 2=bottom) per reel
export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1], // 1 — middle row
  [0, 0, 0, 0, 0], // 2 — top row
  [2, 2, 2, 2, 2], // 3 — bottom row
  [0, 1, 2, 1, 0], // 4 — V-shape down
  [2, 1, 0, 1, 2], // 5 — V-shape up
  [1, 0, 0, 0, 1], // 6 — top dip
  [1, 2, 2, 2, 1], // 7 — bottom dip
  [0, 0, 1, 2, 2], // 8 — diagonal down
  [2, 2, 1, 0, 0], // 9 — diagonal up
  [2, 1, 1, 1, 0], // 10 — diagonal bottom-left to top-right through middle
];

export interface WinningLine {
  lineIndex: number;  // -1 for scatter wins
  symbolKey: SymbolKey;
  count: number;  // 3, 4 or 5
  multiplier: number;
  payout: number; // multiplier × betPerLine
  scatterReels?: number[];  // reel indices for scatter wins (lineIndex === -1)
}

const HIGH_VALUE_SYMBOLS = new Set<SymbolKey>(['pin', 'trophy', 'target', 'joker']);

import { SCATTER_PAYOUTS } from '../config/scatterPayouts';
export { SCATTER_PAYOUTS };

export function evaluatePayline(
  reels: SymbolKey[][],
  lineIndex: number,
  betPerLine: number,
  skipSymbol?: SymbolKey,
): WinningLine | null {
  const payline = PAYLINES[lineIndex];
  const lineSymbols = payline.map((row, reel) => reels[reel][row]);

  // Book is wild — determine anchor from first non-book symbol
  const anchor = lineSymbols.find((s) => s !== 'book') ?? 'book';

  if (skipSymbol && anchor === skipSymbol) return null;

  let count = 0;
  for (const sym of lineSymbols) {
    if (sym === anchor || sym === 'book') {
      count++;
    } else {
      break;
    }
  }

  if (count < 3) return null;

  const multiplier = SYMBOLS[anchor].payouts[count - 3];
  return { lineIndex, symbolKey: anchor, count, multiplier, payout: multiplier * betPerLine };
}

export function calculateExpandingSymbolScatterWin(
  reels: SymbolKey[][],
  expandingSymbol: SymbolKey,
  betPerLine: number,
  activeLines: number,
): WinningLine | null {
  const scatterReels = reels
    .map((reel, i) => (reel.some((s) => s === expandingSymbol) ? i : -1))
    .filter((i) => i !== -1);
  const count = scatterReels.length;
  const minCount = HIGH_VALUE_SYMBOLS.has(expandingSymbol) ? 2 : 3;
  if (count < minCount) return null;
  const payoutIdx = Math.min(count - minCount, 2);
  const scatterTable = SCATTER_PAYOUTS[expandingSymbol] ?? SYMBOLS[expandingSymbol].payouts;
  const multiplier = scatterTable[payoutIdx];
  return { lineIndex: -1, symbolKey: expandingSymbol, count, multiplier, payout: multiplier * betPerLine * activeLines, scatterReels };
}

export function calculateWins(
  reels: SymbolKey[][],
  activeLines: number,
  betPerLine: number,
  expandingSymbol?: SymbolKey,
): WinningLine[] {
  const wins: WinningLine[] = [];
  if (expandingSymbol) {
    const scatter = calculateExpandingSymbolScatterWin(reels, expandingSymbol, betPerLine, activeLines);
    if (scatter) wins.push(scatter);
    // Skip expanding symbol in line wins only when scatter already covers it.
    // When scatter is null (high-value 2-reel expansion), allow paylines to evaluate normally.
    const skipSym = scatter ? expandingSymbol : undefined;
    for (let i = 0; i < activeLines; i++) {
      const win = evaluatePayline(reels, i, betPerLine, skipSym);
      if (win) wins.push(win);
    }
  } else {
    for (let i = 0; i < activeLines; i++) {
      const win = evaluatePayline(reels, i, betPerLine);
      if (win) wins.push(win);
    }
  }
  return wins;
}

export function countScatters(reels: SymbolKey[][]): number {
  let count = 0;
  for (const reel of reels) {
    for (const sym of reel) {
      if (sym === 'book') count++;
    }
  }
  return count;
}

export function isFeatureTriggered(reels: SymbolKey[][]): boolean {
  return countScatters(reels) >= 3;
}

export function getWinningCells(wins: WinningLine[]): Set<string> {
  const cells = new Set<string>();
  for (const win of wins) {
    if (win.lineIndex === -1 && win.scatterReels) {
      for (const reelIdx of win.scatterReels) {
        for (let row = 0; row < 3; row++) {
          cells.add(`${reelIdx}-${row}`);
        }
      }
    } else {
      const payline = PAYLINES[win.lineIndex];
      for (let reel = 0; reel < win.count; reel++) {
        cells.add(`${reel}-${payline[reel]}`);
      }
    }
  }
  return cells;
}

export const INITIAL_REELS: SymbolKey[][] = [
  ['clover', 'bell',  'star'  ],
  ['target', 'joker', 'clover'],
  ['pin',    'star',  'bell'  ],
  ['trophy', 'dice',  'target'],
  ['star',   'pin',   'joker' ],
];

export const LINE_OPTIONS = [1, 3, 5, 7, 10] as const;
export const BET_OPTIONS = [1, 2, 5, 10] as const;
export type BetOption = typeof BET_OPTIONS[number];
