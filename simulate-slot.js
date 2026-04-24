// Slot Machine Monte-Carlo Simulation
// Mirrors kegelnetzwerk-web/src/lib/slotEngine.ts exactly.

'use strict';

// ─── Engine ──────────────────────────────────────────────────────────────────

const SYMBOL_KEYS = ['pin','trophy','book','target','joker','clover','star','bell','slot','dice'];

const WEIGHTS = { pin:3, trophy:5, book:3, target:6, joker:6, clover:8, star:8, bell:13, slot:13, dice:12 };

const PAYOUTS = {
  pin:    [ 80,  800, 4000],
  trophy: [ 32,  320, 1600],
  book:   [ 14,  144, 1440],
  target: [ 24,   80,  600],
  joker:  [ 24,   80,  600],
  clover: [  4,   32,  120],
  star:   [  4,   32,  120],
  bell:   [  4,   20,   80],
  slot:   [  4,   20,   80],
  dice:   [  4,   20,   80],
};

// Separate, smaller payouts for expanding-symbol scatter wins during free spins.
// Still multiplied by bet × lines in evalScatter — table values must be ~1/48× PAYOUTS.
const SCATTER_PAYOUTS = {
  pin:    [  8,  26,   52],
  trophy: [  5,  13,   26],
  target: [  3,   8,   13],
  joker:  [  3,   8,   13],
  clover: [  3,   8,   13],
  star:   [  3,   8,   13],
  bell:   [  3,   5,   10],
  slot:   [  3,   5,   10],
  dice:   [  3,   5,   10],
};

const PAYLINES = [
  [1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],
  [1,0,0,0,1],[1,2,2,2,1],[0,0,1,2,2],[2,2,1,0,0],[2,1,1,1,0],
];

const HIGH_VALUE = new Set(['pin','trophy','target','joker']);
const NON_BOOK   = SYMBOL_KEYS.filter(s => s !== 'book');
const TOTAL_W    = Object.values(WEIGHTS).reduce((a,b) => a+b, 0);

function rndSym() {
  let r = Math.random() * TOTAL_W;
  for (const s of SYMBOL_KEYS) { r -= WEIGHTS[s]; if (r <= 0) return s; }
  return SYMBOL_KEYS.at(-1);
}

function genReels() {
  return Array.from({length:5}, () => Array.from({length:3}, rndSym));
}

function evalLine(reels, li, bet, skip) {
  const pl   = PAYLINES[li];
  const syms = pl.map((row, reel) => reels[reel][row]);
  const anch = syms.find(s => s !== 'book') ?? 'book';
  if (skip && anch === skip) return 0;
  let cnt = 0;
  for (const s of syms) { if (s === anch || s === 'book') cnt++; else break; }
  return cnt >= 3 ? PAYOUTS[anch][cnt - 3] * bet : 0;
}

function evalScatter(reels, sym, bet, lines) {
  const cnt = reels.filter(r => r.some(s => s === sym)).length;
  const min = HIGH_VALUE.has(sym) ? 2 : 3;
  if (cnt < min) return 0;
  return (SCATTER_PAYOUTS[sym] ?? PAYOUTS[sym])[Math.min(cnt - min, 2)] * bet * lines;
}

function expand(reels, sym) {
  return reels.map(r => r.some(s => s === sym) ? [sym,sym,sym] : r);
}

function countBook(reels) { return reels.flat().filter(s => s === 'book').length; }

function spinOnce(lines, bet, expSym) {
  const orig = genReels();
  let reels  = orig;

  if (expSym) {
    const cnt = orig.filter(r => r.some(s => s === expSym)).length;
    if (cnt >= (HIGH_VALUE.has(expSym) ? 2 : 3)) reels = expand(orig, expSym);
  }

  let lineWin = 0;
  let scatterWin = 0;
  if (expSym) {
    const sw  = evalScatter(reels, expSym, bet, lines);
    scatterWin += sw;
    const sk  = sw > 0 ? expSym : undefined;
    for (let i = 0; i < lines; i++) lineWin += evalLine(reels, i, bet, sk);
  } else {
    for (let i = 0; i < lines; i++) lineWin += evalLine(reels, i, bet);
  }

  const triggered = countBook(orig) >= 3;
  return {
    win: lineWin + scatterWin,
    lineWin,
    scatterWin,
    triggered,
    newSym: triggered ? NON_BOOK[Math.floor(Math.random() * NON_BOOK.length)] : null,
  };
}

// ─── Simulation parameters ───────────────────────────────────────────────────

const NUM_USERS      = 100;
const MAX_PAID_SPINS = 100;
const START_BALANCE  = 100;
const LINES          = 5;
const BET            = 1;
const COST           = LINES * BET; // 5 KNC per paid spin

// ─── Run simulation ───────────────────────────────────────────────────────────

const users = [];

for (let u = 0; u < NUM_USERS; u++) {
  let bal          = START_BALANCE;
  let freeLeft     = 0;
  let expSym       = null;

  let paidSpins      = 0;
  let freeSpins      = 0;
  let totalBet       = 0;
  let totalWon       = 0;
  let triggers       = 0;
  let retriggers     = 0;
  let peakBal        = START_BALANCE;
  let bigWin         = 0;
  let freeWinTotal   = 0;
  let paidLineWin    = 0;
  let paidScatWin    = 0; // (scatter only possible during free spins, but track for safety)
  let freeLineWin    = 0;
  let freeScatWin    = 0;

  while (paidSpins < MAX_PAID_SPINS) {
    const inFree = freeLeft > 0;
    if (!inFree && bal < COST) break; // bust

    if (!inFree) { bal -= COST; totalBet += COST; paidSpins++; }
    else           freeSpins++;

    const { win, lineWin, scatterWin, triggered, newSym } = spinOnce(LINES, BET, inFree ? expSym : null);

    bal       += win;
    totalWon  += win;
    if (inFree) {
      freeWinTotal += win;
      freeLineWin  += lineWin;
      freeScatWin  += scatterWin;
    } else {
      paidLineWin  += lineWin;
      paidScatWin  += scatterWin;
    }
    if (win  > bigWin)  bigWin  = win;
    if (bal  > peakBal) peakBal = bal;

    if (triggered) {
      if (inFree) {
        freeLeft = Math.max(0, freeLeft - 1) + 10;
        retriggers++;
      } else {
        freeLeft  = 10;
        expSym    = newSym;
        freeWinTotal = 0;
        triggers++;
      }
    } else if (inFree) {
      freeLeft--;
      if (freeLeft === 0) expSym = null;
    }
  }

  users.push({
    id: u + 1,
    finalBal: bal,
    paidSpins,
    freeSpins,
    totalBet,
    totalWon,
    netGain: bal - START_BALANCE,
    triggers,
    retriggers,
    peakBal,
    bigWin,
    freeWinTotal,
    paidLineWin,
    paidScatWin,
    freeLineWin,
    freeScatWin,
    bust: bal < COST && freeLeft === 0 && paidSpins < MAX_PAID_SPINS,
  });
}

// ─── Aggregate stats ─────────────────────────────────────────────────────────

const S = users;
const sum   = (fn) => S.reduce((a, u) => a + fn(u), 0);
const avg   = (fn) => (sum(fn) / NUM_USERS).toFixed(1);
const count = (fn) => S.filter(fn).length;

const totBet       = sum(u => u.totalBet);
const totWon       = sum(u => u.totalWon);
const rtp          = (totWon / totBet * 100).toFixed(2);
const edge         = (100 - parseFloat(rtp)).toFixed(2);
const busted       = count(u => u.bust);
const triggered    = count(u => u.triggers > 0);
const totPaidLine  = sum(u => u.paidLineWin);
const totFreeLine  = sum(u => u.freeLineWin);
const totFreeScat  = sum(u => u.freeScatWin);

// Balance buckets (final balance)
const BUCKETS = [
  { label: 'Bust (0–4 KNC)',           lo: -Infinity, hi: 4       },
  { label: '5–24 KNC    (–76 to –76)', lo: 5,         hi: 24      },
  { label: '25–49 KNC   (–75 to –51)', lo: 25,        hi: 49      },
  { label: '50–74 KNC   (–50 to –26)', lo: 50,        hi: 74      },
  { label: '75–99 KNC   (–25 to  –1)', lo: 75,        hi: 99      },
  { label: '100 KNC      (break even)', lo: 100,       hi: 100     },
  { label: '101–149 KNC (+1 to  +49)', lo: 101,       hi: 149     },
  { label: '150–299 KNC (+50 to+199)', lo: 150,       hi: 299     },
  { label: '300–599 KNC (+200–+499)',  lo: 300,       hi: 599     },
  { label: '600–999 KNC (+500–+899)',  lo: 600,       hi: 999     },
  { label: '1000+ KNC   (jackpot)',    lo: 1000,      hi: Infinity },
];

const buckets = BUCKETS.map(b => ({
  ...b,
  n: count(u => u.finalBal >= b.lo && u.finalBal <= b.hi),
}));

const maxN = Math.max(...buckets.map(b => b.n), 1);

// Sorted views
const byFinal   = [...S].sort((a, b) => b.finalBal   - a.finalBal);
const byBigWin  = [...S].sort((a, b) => b.bigWin     - a.bigWin);

// ─── Formatting helpers ───────────────────────────────────────────────────────

const W = 68; // inner width
const hr  = (ch = '─') => ch.repeat(W);
const pad = (s, n)  => String(s).padEnd(n);
const lpa = (s, n)  => String(s).padStart(n);
const pct = (n, d)  => ((n / d) * 100).toFixed(1) + '%';
const bar = (n, mx, w = 24) => {
  const f = Math.round((n / mx) * w);
  return '█'.repeat(f) + '░'.repeat(w - f);
};
const row = (label, value) =>
  `│  ${pad(label, 32)}${pad(value, W - 35)}│`;

const sep  = `├${hr()}┤`;
const top  = `┌${hr()}┐`;
const bot  = `└${hr()}┘`;
const head = (t) => `│  ${pad(t, W - 3)}│`;

function section(title) {
  return `\n${top}\n${head(title)}\n${sep}`;
}

// ─── Output ───────────────────────────────────────────────────────────────────

console.log(`
╔${'═'.repeat(W)}╗
║${pad('  KEGELNETZWERK SLOT — MONTE-CARLO SIMULATION REPORT', W)}║
║${pad(`  ${NUM_USERS} users  ·  ${MAX_PAID_SPINS} paid spins each  ·  ${LINES} lines  ·  ${BET} KNC/line  (${COST} KNC/spin)`, W)}║
╚${'═'.repeat(W)}╝`);

// Economics
console.log(section('ECONOMICS'));
console.log(row('Starting balance / user', `${START_BALANCE} KNC`));
console.log(row('Total KNC wagered', `${totBet.toLocaleString('de-DE')} KNC`));
console.log(row('Total KNC paid out', `${totWon.toLocaleString('de-DE')} KNC`));
console.log(row('Net KNC kept by house', `${(totBet - totWon).toLocaleString('de-DE')} KNC`));
console.log(row('Return-to-Player (RTP)', `${rtp}%`));
console.log(row('House edge', `${edge}%`));
console.log(row('Avg final balance', `${avg(u => u.finalBal)} KNC`));
console.log(row('Avg net gain/loss per user', `${(parseFloat(avg(u => u.netGain)) >= 0 ? '+' : '')}${avg(u => u.netGain)} KNC`));
console.log(bot);

// Win source breakdown
console.log(section('WIN SOURCE BREAKDOWN'));
const pctOfWon = (n) => `${n.toLocaleString('de-DE')} KNC  (${(n/totWon*100).toFixed(1)}% of paid out)`;
const rtpOf    = (n) => `RTP contrib: ${(n/totBet*100).toFixed(2)}%`;
console.log(row('Paid spins — payline wins', pctOfWon(totPaidLine)));
console.log(row('  →', rtpOf(totPaidLine)));
console.log(row('Free spins — payline wins', pctOfWon(totFreeLine)));
console.log(row('  →', rtpOf(totFreeLine)));
console.log(row('Free spins — scatter wins', pctOfWon(totFreeScat)));
console.log(row('  →', rtpOf(totFreeScat)));
console.log(bot);

// Spin stats
const totTriggers   = sum(u => u.triggers);
const totPaidSpins  = sum(u => u.paidSpins);
const avgSpinsPerTrigger = totTriggers > 0 ? (totPaidSpins / totTriggers).toFixed(1) : 'N/A';
console.log(section('SPIN STATISTICS'));
console.log(row('Avg paid spins taken',          avg(u => u.paidSpins)));
console.log(row('Avg free spins taken',          avg(u => u.freeSpins)));
console.log(row('Users with free spins',         `${triggered} / ${NUM_USERS} (${pct(triggered, NUM_USERS)})`));
console.log(row('Avg triggers / user',           avg(u => u.triggers)));
console.log(row('Avg retriggers / user',         avg(u => u.retriggers)));
console.log(row('Avg paid spins per trigger',    `${avgSpinsPerTrigger} spins`));
console.log(row('Total trigger events',          sum(u => u.triggers)));
console.log(row('Total retrigger events',        sum(u => u.retriggers)));
console.log(row('Avg free-spin win / user',      `${avg(u => u.freeWinTotal)} KNC`));
console.log(bot);

// Bust
console.log(section('BUST ANALYSIS'));
console.log(row('Went bust (< 5 KNC left)', `${busted} / ${NUM_USERS} (${pct(busted, NUM_USERS)})`));
if (busted > 0) {
  const bustedUsers = S.filter(u => u.bust);
  const avgSpinsBust = (bustedUsers.reduce((a, u) => a + u.paidSpins, 0) / bustedUsers.length).toFixed(1);
  console.log(row('Avg paid spins before bust', avgSpinsBust));
}
console.log(row('Finished all 100 paid spins', `${count(u => u.paidSpins === MAX_PAID_SPINS)} / ${NUM_USERS}`));
console.log(bot);

// Balance distribution
console.log(section('FINAL BALANCE DISTRIBUTION'));
for (const b of buckets) {
  const label = pad(b.label, 30);
  const n     = lpa(b.n, 3);
  const p     = lpa(pct(b.n, NUM_USERS), 6);
  const br    = bar(b.n, maxN);
  console.log(`│  ${label} ${n} ${p}  ${br} │`);
}
console.log(bot);

// Top winners
console.log(section('TOP 10 WINNERS (by final balance)'));
byFinal.slice(0, 10).forEach((u, i) => {
  const line = `#${String(i+1).padStart(2)}  User ${lpa(u.id,3)}  Final: ${lpa(u.finalBal,5)} KNC  Peak: ${lpa(u.peakBal,5)} KNC  Biggest win: ${lpa(u.bigWin,5)} KNC  Triggers: ${u.triggers}`;
  console.log(`│  ${pad(line, W - 3)}│`);
});
console.log(bot);

// Biggest single wins
console.log(section('TOP 10 BIGGEST SINGLE-SPIN WINS'));
byBigWin.slice(0, 10).forEach((u, i) => {
  const line = `#${String(i+1).padStart(2)}  User ${lpa(u.id,3)}  Won: ${lpa(u.bigWin,5)} KNC  Final: ${lpa(u.finalBal,5)} KNC  Triggers: ${u.triggers}`;
  console.log(`│  ${pad(line, W - 3)}│`);
});
console.log(bot);

// Bottom losers
console.log(section('BOTTOM 10 LOSERS (by final balance)'));
byFinal.slice(-10).reverse().forEach((u, i) => {
  const line = `#${String(i+1).padStart(2)}  User ${lpa(u.id,3)}  Final: ${lpa(u.finalBal,4)} KNC  Paid spins: ${lpa(u.paidSpins,3)}  Free spins: ${lpa(u.freeSpins,3)}  Triggers: ${u.triggers}`;
  console.log(`│  ${pad(line, W - 3)}│`);
});
console.log(bot);

console.log(`\n  Simulation complete. Seed: random (re-run for different results)\n`);
