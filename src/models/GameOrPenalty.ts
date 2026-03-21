export interface Part {
  id: number;
  name: string;
  value: number;
  unit: 'POINTS' | 'EURO';
  variable: boolean;    // true = user enters a custom number at result-entry time
  once: boolean;        // true = member can only score this part once per session
  position: number;
}

export interface GameOrPenalty {
  id: number;
  name: string;
  isPenalty: boolean;
  parts: Part[];
}
