'use server';

import { createHash, timingSafeEqual, randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase';
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

/** Extract the storage path from a public object URL, if it belongs to our bucket. */
function storagePathFromUrl(url: string): string | null {
  const marker = '/object/public/birthday-images/';
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length) : null;
}

async function removeImageIfExists(
  sb: NonNullable<ReturnType<typeof createSupabaseAdmin>>,
  url: string | null
): Promise<void> {
  const path = url ? storagePathFromUrl(url) : null;
  if (path) {
    await sb.storage.from('birthday-images').remove([path]);
  }
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
  const eventDate = String(formData.get('event_date') ?? '').trim() || null;
  if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return { status: 'error', message: '日期格式不正确' };
  }

  const file = formData.get('image');
  let imageUrl: string | null = null;

  if (file instanceof File && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length > MAX_IMAGE_BYTES) {
      return { status: 'error', message: '图片过大,请压缩后重试(需小于 4MB)' };
    }
    const ext = EXT_BY_MIME[file.type] ?? 'jpg';
    const path = `memories/${Date.now()}-${randomUUID()}.${ext}`;

    const sb = createSupabaseAdmin();
    if (!sb) {
      return { status: 'error', message: 'Supabase 未配置,无法上传图片' };
    }

    const { error: uploadError } = await sb.storage
      .from('birthday-images')
      .upload(path, bytes, { contentType: file.type });

    if (uploadError) {
      console.error('[upload] storage error:', uploadError.message);
      return { status: 'error', message: '图片上传失败,请稍后再试' };
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    imageUrl = `${url}/storage/v1/object/public/birthday-images/${path}`;
  }

  const sb = createSupabaseAdmin();
  if (!sb) {
    return { status: 'error', message: 'Supabase 未配置,无法保存记录' };
  }

  const { error: insertError } = await sb.from('stories').insert({
    title,
    content: content || null,
    image_url: imageUrl,
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
  const eventDate = String(formData.get('event_date') ?? '').trim() || null;
  if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return { status: 'error', message: '日期格式不正确' };
  }

  const sb = createSupabaseAdmin();
  if (!sb) return { status: 'error', message: 'Supabase 未配置,无法保存记录' };

  const { data: existing } = await sb
    .from('stories')
    .select('image_url')
    .eq('id', storyId)
    .single();

  let imageUrl: string | null = existing?.image_url ?? null;
  const file = formData.get('image');

  if (file instanceof File && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length > MAX_IMAGE_BYTES) {
      return { status: 'error', message: '图片过大,请压缩后重试(需小于 4MB)' };
    }
    const ext = EXT_BY_MIME[file.type] ?? 'jpg';
    const path = `memories/${Date.now()}-${randomUUID()}.${ext}`;
    const { error: upErr } = await sb.storage
      .from('birthday-images')
      .upload(path, bytes, { contentType: file.type });
    if (upErr) {
      console.error('[update] storage error:', upErr.message);
      return { status: 'error', message: '图片上传失败,请稍后再试' };
    }
    const newUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/birthday-images/${path}`;
    if (existing?.image_url && existing.image_url !== newUrl) {
      await removeImageIfExists(sb, existing.image_url);
    }
    imageUrl = newUrl;
  }

  const { error } = await sb
    .from('stories')
    .update({ title, content: content || null, image_url: imageUrl, event_date: eventDate })
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
    .select('image_url')
    .eq('id', storyId)
    .single();

  const { error } = await sb.from('stories').delete().eq('id', storyId);
  if (error) {
    console.error('[delete] error:', error.message);
    return { status: 'error', message: '删除失败,请稍后再试' };
  }

  if (existing?.image_url) {
    await removeImageIfExists(sb, existing.image_url);
  }

  revalidatePath('/');
  return { status: 'success' };
}
