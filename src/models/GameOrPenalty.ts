export interface Part {
  id: number;
  name: string;
  value: number;
  factor: number;       // multiplier applied to the entered value
  bonus: number;        // flat amount added after multiplication
  unit: 'POINTS' | 'EURO';
  variable: boolean;    // true = user enters a custom number at result-entry time
  once: boolean;        // true = member can only score this part once per session
  position: number;
  pic?: string;         // "none" | "emoji:X" | "/uploads/parts/uuid.png"
}

export interface GameOrPenalty {
  id: number;
  name: string;
  isPenalty: boolean;
  parts: Part[];
}
