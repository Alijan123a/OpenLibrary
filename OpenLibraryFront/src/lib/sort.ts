/**
 * Compares two values for table sorting. Uses Persian locale (fa) for strings
 * so that letters like پ (after ب) and ک (after ق) sort correctly.
 */
export function compareSortValues(
  va: string | number,
  vb: string | number
): number {
  const aNum = typeof va === "number";
  const bNum = typeof vb === "number";
  if (aNum && bNum) return va < vb ? -1 : va > vb ? 1 : 0;
  if (aNum && !bNum) return -1;
  if (!aNum && bNum) return 1;
  return String(va).localeCompare(String(vb), "fa");
}
