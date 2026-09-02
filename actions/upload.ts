'use server';

import { createHash, timingSafeEqual, randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase';
import { parseDateFromFilename } from '@/lib/date';
import type { UploadState } from '@/lib/types';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // Vercel serverless body limit safety margin

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

function safeEqualPassword(input: string, expected: string): boolean {
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Verify the shared upload password from a form, with a terse error state. */
function checkPassword(formData: FormData): { ok: true } | { ok: false; message: string } {
  const expected = process.env.UPLOAD_PASSWORD;
  if (!expected) {
    return { ok: false, message: '上传功能未配置(UPLOAD_PASSWORD 未设置)' };
  }
  const input = String(formData.get('password') ?? '');
  if (!safeEqualPassword(input, expected)) {
    return { ok: false, message: '上传密码不正确' };
  }
  return { ok: true };
}

/** All image files attached under the `images` field. */
function getImageFiles(formData: FormData): File[] {
  return formData
    .getAll('images')
    .filter((f): f is File => f instanceof File && f.size > 0);
}

/** URLs marked for removal on edit (sent as repeated `remove_image` fields). */
function getRemovals(formData: FormData): string[] {
  return formData
    .getAll('remove_image')
    .map((v) => String(v))
    .filter(Boolean);
}

/**
 * Resolve the event date: manual input wins; otherwise derive from the first
 * image filename that carries one (EXIF is gone by the time it reaches the
 * server). A photo set with no derivable date forces a manual entry.
 */
function resolveEventDate(formData: FormData): string | null | { error: string } {
  const eventDate = String(formData.get('event_date') ?? '').trim() || null;
  if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return { error: '日期格式不正确' };
  }
  if (eventDate) return eventDate;

  const files = getImageFiles(formData);
  if (files.length > 0) {
    for (const file of files) {
      const fromName = parseDateFromFilename(file.name);
      if (fromName) return fromName;
    }
    return { error: '无法从照片识别日期,请手动填写发生日期' };
  }
  return null; // text-only story → date optional
}

/** Extract the storage path from a public object URL, if it belongs to our bucket. */
function storagePathFromUrl(url: string): string | null {
  const marker = '/object/public/birthday-images/';
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length) : null;
}

async function removeImageIfExists(
  sb: NonNullable<ReturnType<typeof createSupabaseAdmin>>,
  url: string | null | undefined
): Promise<void> {
  const path = url ? storagePathFromUrl(url) : null;
  if (path) {
    await sb.storage.from('birthday-images').remove([path]);
  }
}

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdmin>>;

/** Upload one image file to storage, returning its public URL or an error. */
async function uploadOneImage(
  sb: AdminClient,
  file: File
): Promise<{ url: string } | { error: string }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > MAX_IMAGE_BYTES) {
    return { error: '图片过大,请压缩后重试(每张需小于 4MB)' };
  }
  const ext = EXT_BY_MIME[file.type] ?? 'jpg';
  const path = `memories/${Date.now()}-${randomUUID()}.${ext}`;
  const { error: upErr } = await sb.storage
    .from('birthday-images')
    .upload(path, bytes, { contentType: file.type });
  if (upErr) {
    console.error('[upload] storage error:', upErr.message);
    return { error: '图片上传失败,请稍后再试' };
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return { url: `${url}/storage/v1/object/public/birthday-images/${path}` };
}

export async function uploadStory(
  _prev: UploadState,
  formData: FormData
): Promise<UploadState> {
  const pw = checkPassword(formData);
  if (!pw.ok) return { status: 'error', message: pw.message };

  const title = String(formData.get('title') ?? '').trim();
  if (!title) {
    return { status: 'error', message: '请填写标题' };
  }
  const content = String(formData.get('content') ?? '').trim();
  const resolvedDate = resolveEventDate(formData);
  if (resolvedDate && typeof resolvedDate !== 'string') {
    return { status: 'error', message: resolvedDate.error };
  }
  const eventDate = resolvedDate;

  const sb = createSupabaseAdmin();
  if (!sb) {
    return { status: 'error', message: 'Supabase 未配置,无法保存记录' };
  }

  const files = getImageFiles(formData);
  const imageUrls: string[] = [];
  for (const file of files) {
    const result = await uploadOneImage(sb, file);
    if ('error' in result) return { status: 'error', message: result.error };
    imageUrls.push(result.url);
  }

  const { error: insertError } = await sb.from('stories').insert({
    title,
    content: content || null,
    image_urls: imageUrls.length > 0 ? imageUrls : null,
    event_date: eventDate,
  });

  if (insertError) {
    console.error('[upload] insert error:', insertError.message);
    return { status: 'error', message: '保存失败,请稍后再试' };
  }

  revalidatePath('/');
  return { status: 'success' };
}

export async function updateStory(
  storyId: string,
  _prev: UploadState,
  formData: FormData
): Promise<UploadState> {
  const pw = checkPassword(formData);
  if (!pw.ok) return { status: 'error', message: pw.message };

  const title = String(formData.get('title') ?? '').trim();
  if (!title) return { status: 'error', message: '请填写标题' };
  const content = String(formData.get('content') ?? '').trim();
  const resolvedDate = resolveEventDate(formData);
  if (resolvedDate && typeof resolvedDate !== 'string') {
    return { status: 'error', message: resolvedDate.error };
  }
  const eventDate = resolvedDate;

  const sb = createSupabaseAdmin();
  if (!sb) return { status: 'error', message: 'Supabase 未配置,无法保存记录' };

  const { data: existing } = await sb
    .from('stories')
    .select('image_url, image_urls')
    .eq('id', storyId)
    .single();

  // Merge legacy image_url into the list, drop removals, upload new files.
  let kept: string[] = [
    ...(existing?.image_urls ?? []),
    ...(existing?.image_url ? [existing.image_url] : []),
  ];
  const removals = getRemovals(formData);
  for (const removal of removals) {
    kept = kept.filter((url) => url !== removal);
    await removeImageIfExists(sb, removal);
  }

  for (const file of getImageFiles(formData)) {
    const result = await uploadOneImage(sb, file);
    if ('error' in result) return { status: 'error', message: result.error };
    kept.push(result.url);
  }

  const { error } = await sb
    .from('stories')
    .update({
      title,
      content: content || null,
      image_urls: kept.length > 0 ? kept : null,
      image_url: null,
      event_date: eventDate,
    })
    .eq('id', storyId);

  if (error) {
    console.error('[update] error:', error.message);
    return { status: 'error', message: '保存失败,请稍后再试' };
  }

  revalidatePath('/');
  return { status: 'success' };
}

export async function deleteStory(
  storyId: string,
  _prev: UploadState,
  formData: FormData
): Promise<UploadState> {
  const pw = checkPassword(formData);
  if (!pw.ok) return { status: 'error', message: pw.message };

  const sb = createSupabaseAdmin();
  if (!sb) return { status: 'error', message: 'Supabase 未配置,无法删除' };

  const { data: existing } = await sb
    .from('stories')
    .select('image_url, image_urls')
    .eq('id', storyId)
    .single();

  const { error } = await sb.from('stories').delete().eq('id', storyId);
  if (error) {
    console.error('[delete] error:', error.message);
    return { status: 'error', message: '删除失败,请稍后再试' };
  }

  for (const url of existing?.image_urls ?? []) {
    await removeImageIfExists(sb, url);
  }
  await removeImageIfExists(sb, existing?.image_url);

  revalidatePath('/');
  return { status: 'success' };
}
