/**
 * Scatter payout multipliers for the expanding-symbol bonus round.
 *
 * Formula per spin:  value × bet_per_line × active_lines
 *
 * Columns = [min reels, min+1 reels, min+2+ reels]
 *   High-value symbols (pin, trophy, target, joker) — min = 2 reels
 *   Low-value  symbols (all others)                 — min = 3 reels
 *
 * Edit this file to adjust both the in-game payouts and the
 * Spielanleitung table simultaneously.
 * Run `node simulate-slot.js` afterwards to verify the RTP stays in range.
 */
export const SCATTER_PAYOUTS: Record<string, [number, number, number]> = {
  //              min   min+1  min+2+
  pin:    [  8,   26,    52 ],  // 🍺  high-value, min 2 reels
  trophy: [  5,   13,    26 ],  // 🧈  high-value, min 2 reels
  target: [  3,    8,    13 ],  // 🍟  high-value, min 2 reels
  joker:  [  3,    8,    13 ],  // 🍕  high-value, min 2 reels
  clover: [  3,    8,    13 ],  // 🥨  low-value,  min 3 reels
  star:   [  3,    8,    13 ],  // 🥐  low-value,  min 3 reels
  bell:   [  3,    5,    10 ],  // 🍇  low-value,  min 3 reels
  slot:   [  3,    5,    10 ],  // 🍐  low-value,  min 3 reels
  dice:   [  3,    5,    10 ],  // 🍓  low-value,  min 3 reels
};
