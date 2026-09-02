import exifr from 'exifr';
import { parseDateFromFilename } from './date';

function toDateString(tag: string | number | Date | undefined): string | null {
  if (typeof tag === 'string' && /^\d{4}:\d{2}:\d{2}/.test(tag)) {
    return tag.replace(/^(\d{4}):(\d{2}):(\d{2}).*/, '$1-$2-$3');
  }
  if (tag instanceof Date && !Number.isNaN(tag.getTime())) {
    return tag.toISOString().slice(0, 10);
  }
  return null;
}

/**
 * Try to determine a photo's capture date: filename first (fast, reliable),
 * then EXIF metadata (DateTimeOriginal / CreateDate / DateTimeDigitized).
 * Call on the ORIGINAL file, before compression strips EXIF. Client-side only.
 */
export async function extractDateFromImage(file: File): Promise<string | null> {
  const fromName = parseDateFromFilename(file.name);
  if (fromName) return fromName;

  try {
    const tags = await exifr.parse(file, [
      'DateTimeOriginal',
      'CreateDate',
      'DateTimeDigitized',
    ]);
    for (const key of ['DateTimeOriginal', 'CreateDate', 'DateTimeDigitized'] as const) {
      const date = toDateString(tags?.[key]);
      if (date) return date;
    }
  } catch {
    // unreadable/unsupported file — fall through
  }
  return null;
}
