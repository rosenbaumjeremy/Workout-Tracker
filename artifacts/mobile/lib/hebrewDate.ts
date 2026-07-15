import { HDate } from '@hebcal/core';

/**
 * Renders the Hebrew calendar date in traditional Hebrew letters (gematriya),
 * e.g. "כ״ט תמוז תשפ״ו".
 */
export function formatHebrewDate(date: Date = new Date()): string {
  return new HDate(date).renderGematriya();
}
