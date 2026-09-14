/** U+0964 DEVANAGARI DANDA */
export const DANDA = "\u0964";
/** U+0965 DEVANAGARI DOUBLE DANDA */
export const DOUBLE_DANDA = "\u0965";

/**
 * Wikisource often types two (or more) single dandas `।।` instead of
 * the double-danda character `॥`. `break_after = "।॥"` then inserts a
 * segment break after *each* character, so the second danda lands on
 * its own line in both grid and reading views.
 */
export function collapseFalseDoubleDanda(text: string): string {
  return text.replace(/\u0964{2,}/gu, DOUBLE_DANDA);
}
