// Client-side image compression before upload (keeps payload under serverless limits).

// Aggressive compression: timeline shows 160-256px thumbs and a ~800px lightbox,
// so 1280px @ 0.72 keeps several photos under the 1MB server-action limit.
const MAX_DIMENSION = 1280;
const QUALITY = 0.72;

/** Downscale + re-encode an image file to JPEG/WebP blob. Throws if unreadable. */
export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('只能上传图片文件');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法处理图片');

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY)
  );
  if (!blob) throw new Error('图片压缩失败');

  return blob;
}
