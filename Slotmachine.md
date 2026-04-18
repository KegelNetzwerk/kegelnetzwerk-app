# Slotmachine — Implementierungsplan

## Übersicht

Eine Book-of-Ra-inspirierte Slot Machine für die KegelNetzwerk App. Gespielt wird mit KNC Coins, die server-seitig verwaltet werden. Der Einstieg erfolgt über den Donation-Screen.

---

## Techstack-Erweiterungen

| Paket | Zweck | Status |
|---|---|---|
| `expo-av` | Sound-Effekte (Spin, Win, Feature) | neu installieren |
| `react-native-reanimated` | Walzen-Animation | bereits installiert, noch ungenutzt |

---

## KNC Coins

- Server-seitig gespeichert (`kncBalance` in `FinanceSummary` via `/api/app/finance`)
- Aufladung über Donation-Flow (Euro → KNC via `POST /api/app/finance/donate`)
- Abbuchung: **sofort per API-Call** bei jedem Spin
- **Kein Offline-Spin** — Spielen ohne Internetverbindung ist nicht möglich

---

## Neuer API-Endpoint (Webservice)

```
POST /api/app/slot/spin
Body:  { lines: number, bet: number }
Response: { reels: string[][], win: number, kncBalance: number, featureTriggered?: boolean, expandingSymbol?: string }
```

- `reels`: 5×3 Matrix mit Symbol-Keys
- `win`: gewonnene KNC Coins (0 = kein Gewinn)
- `kncBalance`: aktualisiertes Guthaben nach dem Spin
- `featureTriggered`: true wenn Freispiele ausgelöst wurden
- `expandingSymbol`: Symbol-Key des Expanding Symbols in der Feature-Runde

---

## Spielregeln

### Aufbau
- 5 Walzen × 3 sichtbare Reihen = 15 Felder
- 10 Gewinnlinien (links → rechts)

### Einsatz
- Aktive Linien: 1–10 (Standard: 10)
- Münzen pro Linie: 1, 2, 5, 10 (Standard: 1)
- Gesamteinsatz pro Spin = Linien × Münzen pro Linie

### Symbole (Emojis)

| Key | Emoji | Kategorie |
|---|---|---|
| `book` | 📖 | Wild + Scatter (höchster Wert) |
| `pin` | 🎳 | Sehr hoch (thematisch) |
| `trophy` | 🏆 | Hoch |
| `target` | 🎯 | Mittel-hoch |
| `joker` | 🃏 | Mittel |
| `clover` | 🍀 | Mittel-niedrig |
| `star` | ⭐ | Niedrig |
| `bell` | 🔔 | Niedrig |
| `slot` | 🎰 | Niedrig |

### Gewinntabelle (Multiplikatoren × Einsatz pro Linie)

| Symbol | 3× | 4× | 5× |
|---|---|---|---|
| 📖 | 10× | 25× | 200× |
| 🎳 | 8× | 20× | 150× |
| 🏆 | 5× | 15× | 100× |
| 🎯 | 4× | 10× | 50× |
| 🃏 | 3× | 7× | 30× |
| 🍀 | 2× | 5× | 20× |
| ⭐ | 1× | 3× | 10× |
| 🔔 | 1× | 3× | 10× |
| 🎰 | 1× | 3× | 10× |

### Wild (📖)
Ersetzt jedes andere Symbol auf einer Gewinnlinie.

### Scatter / Feature-Runde (📖)
- 3× 📖 irgendwo auf den Walzen → **10 Freispiele**
- Ein zufälliges Symbol wird als **Expanding Symbol** gewählt
- Während der Freispiele: Das gewählte Symbol expandiert auf die gesamte Walze wenn es erscheint
- Freispiele können erneut getriggert werden (weitere 10 Freispiele)
- Während der Feature-Runde: kein Einsatz (Freispiele kosten nichts)

---

## Animationskonzept

1. **Walzen-Spin**: Symbole scrollen schnell nach unten, Walzen 1–5 stoppen mit leichtem zeitlichem Versatz (Reanimated `withTiming` + `withDelay`)
2. **Win-Flash**: Gewinnende Felder pulsen auf (Reanimated `withRepeat` + `withSequence`)
3. **Expanding Symbol**: Walze füllt sich mit Scale-Animation von oben nach unten
4. **Coin-Zähler**: KNC-Guthaben zählt animiert hoch bei Gewinn
5. **Feature-Trigger**: Vollbild-Flash + spezielle Animation beim Freispiel-Auslöser

---

## Sound-Effekte

Alle MP3-Dateien unter `assets/sounds/slot/`:

| Dateiname | Verwendung | Quelle |
|---|---|---|
| `spin_start.mp3` | Spin-Button gedrückt | mixkit.co / freesound.org |
| `reel_stop_1.mp3` | Walze 1 stoppt | mixkit.co / freesound.org |
| `reel_stop_2.mp3` | Walze 2 stoppt | mixkit.co / freesound.org |
| `reel_stop_3.mp3` | Walze 3 stoppt | mixkit.co / freesound.org |
| `reel_stop_4.mp3` | Walze 4 stoppt | mixkit.co / freesound.org |
| `reel_stop_5.mp3` | Walze 5 stoppt | mixkit.co / freesound.org |
| `win_small.mp3` | Kleiner Gewinn | mixkit.co / freesound.org |
| `win_big.mp3` | Großer Gewinn | mixkit.co / freesound.org |
| `win_jackpot.mp3` | Jackpot (5× 📖) | mixkit.co / freesound.org |
| `feature_trigger.mp3` | Freispiele ausgelöst | mixkit.co / freesound.org |
| `feature_win.mp3` | Gewinn während Feature | mixkit.co / freesound.org |

**Empfohlene Quelle:** [mixkit.co/free-sound-effects/game/](https://mixkit.co/free-sound-effects/game/) — kostenlos, kein Account nötig

---

## Dateistruktur (neu)

```
app/(app)/slotmachine.tsx          — Hauptscreen
src/components/slot/
  Reel.tsx                         — einzelne Walze (5 Stück)
  PaylineOverlay.tsx               — Gewinnlinien-Overlay
  WinDisplay.tsx                   — Gewinn-Anzeige + Coin-Zähler
  BetControls.tsx                  — Linien- & Einsatz-Steuerung
  FeatureBanner.tsx                — Freispiel-Ankündigung
src/utils/slotLogic.ts             — Gewinnberechnung, Payline-Definitionen (testbar!)
src/api/slot.ts                    — API-Wrapper für POST /api/app/slot/spin
src/hooks/useSlot.ts               — Spielzustand, Spin-Logik, Feature-Runde
assets/sounds/slot/                — MP3-Dateien (siehe oben)
```

---

## Integration

- Einstieg: Button im bestehenden **Donation-Screen** (`app/(app)/donations.tsx`)
- Route: `/(app)/slotmachine`
- Voraussetzung: Internetverbindung (kein Offline-Spin)
- KNC-Guthaben wird nach jedem Spin aus der API-Antwort aktualisiert (kein separater Reload nötig)

---

## Unit Tests

`src/utils/slotLogic.ts` enthält die reine Spiellogik (Gewinnberechnung, Payline-Prüfung) und wird vollständig mit Jest getestet (`src/__tests__/slotLogic.test.ts`).
