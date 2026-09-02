/**
 * Pure date-from-filename parsing, safe for server bundles (no EXIF deps).
 */

/**
 * Extract a plausible YYYY-MM-DD date from a filename.
 * Matches e.g. 20230507, 2023-05-07, IMG_20230507_123456, 20230507_1230.
 * Requires a valid month (01-12) and day (01-31) to reduce false positives.
 */
export function parseDateFromFilename(name: string): string | null {
  const match = name.match(
    /(?<!\d)(19|20)(\d{2})[-_.]?(0?[1-9]|1[0-2])[-_.]?(0?[1-9]|[12]\d|3[01])(?!\d)/
  );
  if (!match) return null;
  const y = match[1] + match[2];
  const mo = match[3].padStart(2, '0');
  const d = match[4].padStart(2, '0');
  return `${y}-${mo}-${d}`;
}
