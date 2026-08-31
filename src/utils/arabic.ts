/**
 * Converts standard integer digits to Arabic-Indic digits (e.g. 1 -> ١, 2 -> ٢)
 */
export function arabicNumToEastern(num: number): string {
  const easternDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map((d) => easternDigits[parseInt(d, 10)] || d)
    .join('');
}
