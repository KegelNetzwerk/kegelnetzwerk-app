import {
  evaluatePayline,
  calculateExpandingSymbolScatterWin,
  calculateWins,
  countScatters,
  isFeatureTriggered,
  getWinningCells,
  type SymbolKey,
} from '../utils/slotLogic';

// Helpers to build a 5×3 reels grid filled with a default symbol
function makeReels(fill: SymbolKey = 'star'): SymbolKey[][] {
  return Array.from({ length: 5 }, () => [fill, fill, fill]);
}

function setCell(reels: SymbolKey[][], reel: number, row: number, sym: SymbolKey): SymbolKey[][] {
  const copy = reels.map((r) => [...r]);
  copy[reel][row] = sym;
  return copy;
}

// ── evaluatePayline ──────────────────────────────────────────────────────────

describe('evaluatePayline', () => {
  it('returns null when fewer than 3 consecutive matches', () => {
    const reels = makeReels('star');
    // Break the run at reel 2 on line 0 (middle row)
    const modified = setCell(reels, 2, 1, 'bell');
    expect(evaluatePayline(modified, 0, 1)).toBeNull();
  });

  it('returns a win for exactly 3 matching symbols on the middle line', () => {
    const reels: SymbolKey[][] = [
      ['pin', 'pin', 'pin'],   // reel 0
      ['pin', 'pin', 'pin'],   // reel 1
      ['pin', 'pin', 'pin'],   // reel 2
      ['star', 'star', 'star'], // reel 3 — break
      ['star', 'star', 'star'], // reel 4
    ];
    const result = evaluatePayline(reels, 0, 1); // line 0 = middle row
    expect(result).not.toBeNull();
    expect(result?.count).toBe(3);
    expect(result?.symbolKey).toBe('pin');
    expect(result?.multiplier).toBe(80); // pin 3× = 80
    expect(result?.payout).toBe(80);
  });

  it('returns a win for 5 matching symbols', () => {
    const reels = makeReels('trophy');
    const result = evaluatePayline(reels, 0, 2); // betPerLine = 2
    expect(result?.count).toBe(5);
    expect(result?.multiplier).toBe(1600); // trophy 5× = 1600
    expect(result?.payout).toBe(3200);
  });

  it('treats book as wild and counts it toward the anchor symbol', () => {
    const reels: SymbolKey[][] = [
      ['star', 'book', 'star'], // reel 0 — middle row = book
      ['star', 'pin', 'star'],  // reel 1 — middle row = pin (anchor)
      ['star', 'pin', 'star'],  // reel 2
      ['star', 'pin', 'star'],  // reel 3
      ['star', 'bell', 'star'], // reel 4 — breaks
    ];
    // Line 0 = middle row: [book, pin, pin, pin, bell]
    const result = evaluatePayline(reels, 0, 1);
    expect(result).not.toBeNull();
    expect(result?.symbolKey).toBe('pin');
    expect(result?.count).toBe(4); // book+pin+pin+pin
    expect(result?.multiplier).toBe(800); // pin 4× = 800
  });

  it('wins when all 5 symbols are books', () => {
    const reels = makeReels('book');
    const result = evaluatePayline(reels, 0, 1);
    expect(result?.symbolKey).toBe('book');
    expect(result?.count).toBe(5);
    expect(result?.multiplier).toBe(1440);
  });

  it('returns null when books appear but no 3-match after counting wilds', () => {
    const reels: SymbolKey[][] = [
      ['star', 'book', 'star'], // reel 0 middle = book
      ['star', 'bell', 'star'], // reel 1 middle = bell (anchor)
      ['star', 'pin', 'star'],  // reel 2 — breaks
      ['star', 'star', 'star'],
      ['star', 'star', 'star'],
    ];
    // Line 0 = middle: [book, bell, pin, star, star] → book+bell → 2 consecutive → null
    expect(evaluatePayline(reels, 0, 1)).toBeNull();
  });

  it('scales payout with betPerLine', () => {
    const reels = makeReels('clover');
    const result = evaluatePayline(reels, 0, 5);
    expect(result?.multiplier).toBe(120); // clover 5× = 120
    expect(result?.payout).toBe(600);
  });

  it('returns null when anchor equals skipSymbol', () => {
    const reels = makeReels('pin');
    expect(evaluatePayline(reels, 0, 1, 'pin')).toBeNull();
  });

  it('does not skip when skipSymbol differs from anchor', () => {
    const reels = makeReels('pin');
    const result = evaluatePayline(reels, 0, 1, 'star');
    expect(result).not.toBeNull();
    expect(result?.symbolKey).toBe('pin');
  });
});

// ── calculateWins ────────────────────────────────────────────────────────────

describe('calculateWins', () => {
  it('returns empty array when no lines match', () => {
    // reel 0 and reel 1 use completely different symbols, so no payline can
    // match in the first two reels and therefore no 3-symbol run is possible.
    const reels: SymbolKey[][] = [
      ['star',   'bell',  'slot'  ], // reel 0
      ['trophy', 'joker', 'clover'], // reel 1 — all differ from reel 0 on every row
      ['pin',    'pin',   'pin'   ], // reels 2-4 irrelevant (run already broken)
      ['pin',    'pin',   'pin'   ],
      ['pin',    'pin',   'pin'   ],
    ];
    expect(calculateWins(reels, 10, 1)).toHaveLength(0);
  });

  it('respects activeLines — only checks the first N lines', () => {
    // Line 0 (middle row) wins, line 1 (top row) also wins
    const reels = makeReels('joker');
    const winsAll = calculateWins(reels, 10, 1);
    const winsOne = calculateWins(reels, 1, 1);
    expect(winsAll.length).toBeGreaterThan(winsOne.length);
    expect(winsOne.length).toBe(1);
    expect(winsOne[0].lineIndex).toBe(0);
  });

  it('returns multiple wins when multiple lines match', () => {
    const reels = makeReels('trophy');
    const wins = calculateWins(reels, 10, 1);
    expect(wins.length).toBeGreaterThan(1);
  });
});

// ── countScatters ────────────────────────────────────────────────────────────

describe('countScatters', () => {
  it('returns 0 when no books are present', () => {
    expect(countScatters(makeReels('pin'))).toBe(0);
  });

  it('counts every book symbol across all reels and rows', () => {
    const reels = makeReels('star');
    reels[0][0] = 'book';
    reels[2][1] = 'book';
    reels[4][2] = 'book';
    expect(countScatters(reels)).toBe(3);
  });

  it('counts all books in a fully-book grid', () => {
    expect(countScatters(makeReels('book'))).toBe(15); // 5 reels × 3 rows
  });
});

// ── isFeatureTriggered ───────────────────────────────────────────────────────

describe('isFeatureTriggered', () => {
  it('returns false with fewer than 3 books', () => {
    const reels = makeReels('star');
    reels[0][0] = 'book';
    reels[1][0] = 'book';
    expect(isFeatureTriggered(reels)).toBe(false);
  });

  it('returns true with exactly 3 books', () => {
    const reels = makeReels('star');
    reels[0][0] = 'book';
    reels[2][1] = 'book';
    reels[4][2] = 'book';
    expect(isFeatureTriggered(reels)).toBe(true);
  });

  it('returns true with more than 3 books', () => {
    expect(isFeatureTriggered(makeReels('book'))).toBe(true);
  });
});

// ── getWinningCells ──────────────────────────────────────────────────────────

describe('getWinningCells', () => {
  it('returns an empty set when there are no wins', () => {
    expect(getWinningCells([])).toEqual(new Set());
  });

  it('includes all cells up to the match count for each win', () => {
    const wins = [
      {
        lineIndex: 0, // middle row [1,1,1,1,1]
        symbolKey: 'pin' as SymbolKey,
        count: 3,
        multiplier: 100,
        payout: 100,
      },
    ];
    const cells = getWinningCells(wins);
    // Reels 0,1,2 on payline 0 all point to row 1
    expect(cells.has('0-1')).toBe(true);
    expect(cells.has('1-1')).toBe(true);
    expect(cells.has('2-1')).toBe(true);
    expect(cells.has('3-1')).toBe(false); // count = 3, reel 3 not included
  });

  it('merges cells from multiple winning lines without duplicates', () => {
    const wins = [
      { lineIndex: 0, symbolKey: 'pin' as SymbolKey, count: 5, multiplier: 5000, payout: 5000 },
      { lineIndex: 1, symbolKey: 'pin' as SymbolKey, count: 5, multiplier: 5000, payout: 5000 },
    ];
    const cells = getWinningCells(wins);
    // Line 0 = middle (row 1), line 1 = top (row 0)
    expect(cells.has('0-1')).toBe(true); // line 0 reel 0
    expect(cells.has('0-0')).toBe(true); // line 1 reel 0
    // Should not have duplicates — Set handles that
    expect(cells.size).toBe(10); // 5 reels × 2 rows
  });

  it('covers all rows for each reel in a scatter win (lineIndex === -1)', () => {
    const wins = [
      {
        lineIndex: -1,
        symbolKey: 'pin' as SymbolKey,
        count: 3,
        multiplier: 26,
        payout: 260,
        scatterReels: [0, 2, 4],
      },
    ];
    const cells = getWinningCells(wins);
    // All 3 rows of reels 0, 2, 4 should be included
    for (const reel of [0, 2, 4]) {
      for (let row = 0; row < 3; row++) {
        expect(cells.has(`${reel}-${row}`)).toBe(true);
      }
    }
    expect(cells.has('1-0')).toBe(false);
    expect(cells.has('3-0')).toBe(false);
    expect(cells.size).toBe(9); // 3 reels × 3 rows
  });
});

// ── calculateExpandingSymbolScatterWin ───────────────────────────────────────

describe('calculateExpandingSymbolScatterWin', () => {
  // Helpers: build reels with the expanding symbol on specific reel indices
  function reelsWithSymbolOn(sym: SymbolKey, reelIndices: number[]): SymbolKey[][] {
    return Array.from({ length: 5 }, (_, i) =>
      reelIndices.includes(i) ? [sym, sym, sym] : ['star', 'star', 'star'],
    );
  }

  it('returns null when a high-value symbol appears on fewer than 2 reels', () => {
    const reels = reelsWithSymbolOn('pin', [0]);
    expect(calculateExpandingSymbolScatterWin(reels, 'pin', 1, 5)).toBeNull();
  });

  it('pays for a high-value symbol on exactly 2 reels (payoutIdx 0)', () => {
    const reels = reelsWithSymbolOn('pin', [0, 2]);
    const result = calculateExpandingSymbolScatterWin(reels, 'pin', 1, 5);
    expect(result).not.toBeNull();
    expect(result?.symbolKey).toBe('pin');
    expect(result?.count).toBe(2);
    expect(result?.multiplier).toBe(8);   // SCATTER_PAYOUTS.pin[0]
    expect(result?.payout).toBe(8 * 1 * 5);
    expect(result?.lineIndex).toBe(-1);
    expect(result?.scatterReels).toEqual([0, 2]);
  });

  it('pays for a high-value symbol on 3 reels (payoutIdx 1)', () => {
    const reels = reelsWithSymbolOn('pin', [0, 1, 3]);
    const result = calculateExpandingSymbolScatterWin(reels, 'pin', 2, 10);
    expect(result?.multiplier).toBe(26);  // SCATTER_PAYOUTS.pin[1]
    expect(result?.payout).toBe(26 * 2 * 10);
  });

  it('clamps payoutIdx to 2 for 5 reels', () => {
    const reels = reelsWithSymbolOn('pin', [0, 1, 2, 3, 4]);
    const result = calculateExpandingSymbolScatterWin(reels, 'pin', 1, 5);
    expect(result?.multiplier).toBe(52);  // SCATTER_PAYOUTS.pin[2]
    expect(result?.count).toBe(5);
  });

  it('returns null when a low-value symbol appears on fewer than 3 reels', () => {
    const reels = reelsWithSymbolOn('bell', [0, 1]);
    expect(calculateExpandingSymbolScatterWin(reels, 'bell', 1, 5)).toBeNull();
  });

  it('pays for a low-value symbol on exactly 3 reels (payoutIdx 0)', () => {
    const reels = reelsWithSymbolOn('bell', [0, 2, 4]);
    const result = calculateExpandingSymbolScatterWin(reels, 'bell', 1, 5);
    expect(result).not.toBeNull();
    expect(result?.multiplier).toBe(3);   // SCATTER_PAYOUTS.bell[0]
    expect(result?.payout).toBe(3 * 1 * 5);
  });

  it('pays for a low-value symbol on 4 reels (payoutIdx 1)', () => {
    const reels = reelsWithSymbolOn('bell', [0, 1, 2, 3]);
    const result = calculateExpandingSymbolScatterWin(reels, 'bell', 1, 5);
    expect(result?.multiplier).toBe(5);   // SCATTER_PAYOUTS.bell[1]
  });
});

// ── calculateWins (expandingSymbol branch) ───────────────────────────────────

describe('calculateWins with expandingSymbol', () => {
  it('includes a scatter win when the expanding symbol fires', () => {
    // pin on 3 reels → high-value, fires at 2+
    const reels: SymbolKey[][] = [
      ['pin', 'pin', 'pin'],
      ['pin', 'pin', 'pin'],
      ['pin', 'pin', 'pin'],
      ['star', 'star', 'star'],
      ['star', 'star', 'star'],
    ];
    const wins = calculateWins(reels, 5, 1, 'pin');
    const scatter = wins.find((w) => w.lineIndex === -1);
    expect(scatter).toBeDefined();
    expect(scatter?.symbolKey).toBe('pin');
    expect(scatter?.count).toBe(3);
  });

  it('skips expanding symbol from paylines when scatter fires', () => {
    // All reels filled with pin — scatter fires, paylines should skip pin
    const reels = Array.from({ length: 5 }, (): SymbolKey[] => ['pin', 'pin', 'pin']);
    const wins = calculateWins(reels, 5, 1, 'pin');
    const lineWins = wins.filter((w) => w.lineIndex >= 0);
    // All line wins should NOT have pin as symbolKey (skipped)
    for (const w of lineWins) {
      expect(w.symbolKey).not.toBe('pin');
    }
  });

  it('allows payline wins for expanding symbol when scatter does not fire', () => {
    // pin on only 1 reel — high-value needs 2 → scatter null → paylines may use pin
    const reels: SymbolKey[][] = [
      ['pin', 'pin', 'pin'],
      ['star', 'star', 'star'],
      ['star', 'star', 'star'],
      ['star', 'star', 'star'],
      ['star', 'star', 'star'],
    ];
    const wins = calculateWins(reels, 5, 1, 'pin');
    const scatter = wins.find((w) => w.lineIndex === -1);
    expect(scatter).toBeUndefined(); // scatter didn't fire
    // No line wins either since pin only spans 1 reel (min 3 for line win)
    expect(wins).toHaveLength(0);
  });
});
