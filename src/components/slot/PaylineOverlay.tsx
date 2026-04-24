import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Polyline, G, Circle, Text as SvgText } from 'react-native-svg';
import { PAYLINES } from '../../utils/slotLogic';

// One distinct color per payline (indices 0–9)
const LINE_COLORS = [
  '#facc15', // 1 — middle row      (gold)
  '#f87171', // 2 — top row         (red)
  '#60a5fa', // 3 — bottom row      (blue)
  '#4ade80', // 4 — V down          (green)
  '#c084fc', // 5 — V up            (purple)
  '#fb923c', // 6 — top dip         (orange)
  '#2dd4bf', // 7 — bottom dip      (teal)
  '#f472b6', // 8 — diagonal down   (pink)
  '#a3e635', // 9 — diagonal up     (lime)
  '#38bdf8', // 10 — mixed diagonal (sky)
];

// Extra y offset (px) applied only to the label circles, per line index.
// Lines that share the same natural y at both ends are spread apart by ±12 px:
//   same-y pairs: (1,4), (2,5), (6,7), (9,10)
const CIRCLE_Y_OFFSETS = [
   0,  // line 1
  -12, // line 2  } same y as line 4
   -12, // line 3  } same y as line 5
  12,  // line 4
  12,  // line 5
  -12, // line 6  } same y as line 7
  12,  // line 7
   0,  // line 8
  -12, // line 9  } same y as line 10
  12,  // line 10
];

type OverlayLine = { lineIndex: number; count: number };

// Must match the reel container's padding and gap values in slotmachine.tsx
const REEL_PADDING = 6;
const REEL_GAP = 4;
const NUM_REELS = 5;
const RADIUS = 11;

interface Props {
  winningLines: OverlayLine[];
  cellHeight: number;
  visible: boolean;
  showCircles?: boolean;
}

export default function PaylineOverlay({ winningLines, cellHeight, visible, showCircles = false }: Props) {
  const [containerWidth, setContainerWidth] = useState(0);

  const paylineWins = winningLines.filter((w) => w.lineIndex >= 0);

  const reelWidth = containerWidth > 0
    ? (containerWidth - REEL_PADDING * 2 - REEL_GAP * (NUM_REELS - 1)) / NUM_REELS
    : 0;
  const svgHeight = cellHeight * 3 + REEL_PADDING * 2;

  const xCenter = (reelIndex: number) =>
    REEL_PADDING + reelIndex * (reelWidth + REEL_GAP) + reelWidth / 2;
  const yCenter = (row: number, lineIndex: number) => {
    const offset = lineIndex >= 7 ? 12 : lineIndex >= 5 ? 6 : 0;
    return REEL_PADDING + row * cellHeight + cellHeight / 2 + offset;
  };

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {visible && containerWidth > 0 && paylineWins.length > 0 && (
        <Svg width={containerWidth} height={svgHeight} pointerEvents="none">
          {paylineWins.map((win, idx) => {
            const payline = PAYLINES[win.lineIndex];
            const points = Array.from({ length: win.count }, (_, i) =>
              `${xCenter(i)},${yCenter(payline[i], win.lineIndex)}`
            ).join(' ');
            const color = LINE_COLORS[win.lineIndex] ?? '#ffffff';

            const circleYOff = CIRCLE_Y_OFFSETS[win.lineIndex] ?? 0;
            const label = String(win.lineIndex + 1);
            const fontSize = label.length > 1 ? 8 : 10;
            const startX = xCenter(0);
            const startY = yCenter(payline[0], win.lineIndex) + circleYOff;
            const endX   = xCenter(win.count - 1);
            const endY   = yCenter(payline[win.count - 1], win.lineIndex) + circleYOff;
            const samePos = startX === endX && startY === endY;

            return (
              <G key={`${win.lineIndex}-${idx}`}>
                {/* Outer glow */}
                <Polyline points={points} fill="none" stroke={color}
                  strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" opacity={0.12} />
                {/* Mid glow */}
                <Polyline points={points} fill="none" stroke={color}
                  strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" opacity={0.3} />
                {/* Core line */}
                <Polyline points={points} fill="none" stroke={color}
                  strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />

                {showCircles && (
                  <>
                    {/* Start circle */}
                    <Circle cx={startX} cy={startY} r={RADIUS} fill={color} opacity={0.95} />
                    <SvgText x={startX} y={startY} fontSize={fontSize} fontWeight="bold"
                      fill="#000" textAnchor="middle" dy={fontSize * 0.36}>{label}</SvgText>

                    {/* End circle — skip when coincident with start */}
                    {!samePos && (
                      <>
                        <Circle cx={endX} cy={endY} r={RADIUS} fill={color} opacity={0.95} />
                        <SvgText x={endX} y={endY} fontSize={fontSize} fontWeight="bold"
                          fill="#000" textAnchor="middle" dy={fontSize * 0.36}>{label}</SvgText>
                      </>
                    )}
                  </>
                )}
              </G>
            );
          })}
        </Svg>
      )}
    </View>
  );
}
