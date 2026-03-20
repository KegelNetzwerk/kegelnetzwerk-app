export interface Part {
  id: number;
  name: string;
  value: number | null; // null = variable (user enters a number)
  once: boolean;        // true = member can only score this part once per session
  position: number;
}

export interface GameOrPenalty {
  id: number;
  name: string;
  isPenalty: boolean;
  parts: Part[];
}
