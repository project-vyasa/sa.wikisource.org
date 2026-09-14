export const DEV_TO_ARABIC: Record<string, string> = {
  "०": "0",
  "१": "1",
  "२": "2",
  "३": "3",
  "४": "4",
  "५": "5",
  "६": "6",
  "७": "7",
  "८": "8",
  "९": "9",
};

export const ARABIC_TO_DEV: Record<string, string> = {
  "0": "०",
  "1": "१",
  "2": "२",
  "3": "३",
  "4": "४",
  "5": "५",
  "6": "६",
  "7": "७",
  "8": "८",
  "9": "९",
};

export function devanagariToArabic(str: string): string {
  return str.replace(/[०-९]/g, (ch) => DEV_TO_ARABIC[ch] ?? ch);
}

export function arabicToDevanagari(str: string): string {
  return str.replace(/[0-9]/g, (d) => ARABIC_TO_DEV[d] ?? d);
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function pad3(n: number): string {
  return String(n).padStart(3, "0");
}
