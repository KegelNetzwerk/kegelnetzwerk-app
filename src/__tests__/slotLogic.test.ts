import {
  evaluatePayline,
  calculateWins,
  countScatters,
  isFeatureTriggered,
  getWinningCells,
  PAYLINES,
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
});
