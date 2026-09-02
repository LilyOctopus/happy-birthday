'use client';

import Image from 'next/image';
import { useActionState, useTransition, useState, useEffect } from 'react';
import { updateStory, deleteStory } from '@/actions/upload';
import { compressImage } from '@/lib/image';
import { extractDateFromImage } from '@/lib/exif-date';
import { storyImages, type Story, type UploadState } from '@/lib/types';

const initial: UploadState = { status: 'idle' };

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

export default function StoryCard({ story }: { story: Story }) {
  const originalImages = storyImages(story);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState(story.title);
  const [content, setContent] = useState(story.content ?? '');
  const [eventDate, setEventDate] = useState(story.event_date ?? '');
  // Kept images (URLs); start from what the story has.
  const [images, setImages] = useState<string[]>(originalImages);
  // Newly added files awaiting upload on save.
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [editState, editAction] = useActionState(
    (_p: UploadState, fd: FormData) => updateStory(story.id, _p, fd),
    initial
  );
  const [isPending, startTransition] = useTransition();
  const [delState, delAction, delPending] = useActionState(
    (_p: UploadState, fd: FormData) => deleteStory(story.id, _p, fd),
    initial
  );

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);

    const fd = new FormData();
    fd.set('password', password);
    fd.set('title', title);
    fd.set('content', content);
    fd.set('event_date', eventDate);

    // Images removed during editing.
    for (const url of originalImages) {
      if (!images.includes(url)) fd.append('remove_image', url);
    }

    // Newly selected images, compressed on the client.
    try {
      for (const file of newFiles) {
        const compressed = await compressImage(file);
        fd.append('images', compressed, file.name);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : '图片处理失败');
      return;
    }

    startTransition(() => editAction(fd));
  }

  async function handleNewFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setNewFiles((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    if (!eventDate && files.length > 0) {
      for (const file of files) {
        const date = await extractDateFromImage(file);
        if (date) {
          setEventDate(date);
          break;
        }
      }
    }
  }

  function enterEdit() {
    setPassword('');
    setTitle(story.title);
    setContent(story.content ?? '');
    setEventDate(story.event_date ?? '');
    setImages(storyImages(story));
    setNewFiles([]);
    setNewPreviews([]);
    setLocalError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setPassword('');
    setTitle(story.title);
    setContent(story.content ?? '');
    setEventDate(story.event_date ?? '');
    setImages(storyImages(story));
    setNewFiles([]);
    setNewPreviews([]);
    setLocalError(null);
  }

  // After a successful save, leave the edit form so the refreshed story shows.
  useEffect(() => {
    if (editState.status === 'success') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- close edit form after save
      setEditing(false);
    }
  }, [editState.status]);

  // Lightbox keyboard controls: Esc closes, arrows navigate.
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft' && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1);
      }
      if (e.key === 'ArrowRight' && lightboxIndex < originalImages.length - 1) {
        setLightboxIndex(lightboxIndex + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, originalImages.length]);

  const editError = editState.status === 'error' ? editState.message : localError;
  const date = formatDate(story.event_date);
  const inputCls =
    'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-pink-400';
  const thumbCls =
    'file:mr-3 file:rounded-lg file:border-0 file:bg-pink-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-pink-600 hover:file:bg-pink-100';

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-pink-100 transition hover:shadow-md">
      {editing ? (
        <form onSubmit={handleEdit} className="space-y-3">
          <p className="text-sm font-medium text-slate-600">编辑回忆</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="off"
            placeholder="上传密码 *"
            className={inputCls}
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={80}
            className={inputCls}
            placeholder="标题"
          />
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={inputCls}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={2000}
            className={`${inputCls} resize-y`}
            placeholder="小故事"
          />

          {images.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-slate-400">现有照片(点击 ✕ 移除)</p>
              <div className="grid grid-cols-3 gap-2">
                {images.map((url, i) => (
                  <div key={url} className="group relative h-24 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element -- storage thumbnails, avoids next/image on many edits */}
                    <img src={url} alt="现有" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs leading-none text-white transition hover:bg-red-500"
                      aria-label="移除这张照片"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {newPreviews.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-slate-400">新增照片</p>
              <div className="grid grid-cols-3 gap-2">
                {newPreviews.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element -- blob URL preview
                  <img key={i} src={url} alt="新增" className="h-24 w-full rounded-lg object-cover" />
                ))}
              </div>
            </div>
          )}

          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            onChange={handleNewFiles}
            className={`block w-full text-sm text-slate-500 ${thumbCls}`}
          />

          {editError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{editError}</p>
          )}
          {editState.status === 'success' && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">✓ 已保存</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-full bg-pink-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {isPending ? '保存中…' : '保存'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm text-slate-500 transition hover:bg-slate-50"
            >
              取消
            </button>
          </div>
        </form>
      ) : (
        <>
          {date && <p className="mb-1 text-xs font-medium text-pink-400">{date}</p>}
          <h3 className="text-lg font-bold text-slate-800">{story.title}</h3>
          {story.content && (
            <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-600">{story.content}</p>
          )}

          {originalImages.length === 1 && (
            <div className="relative mt-3 h-56 w-full overflow-hidden rounded-xl">
              <button
                type="button"
                className="block h-full w-full cursor-zoom-in"
                onClick={() => setLightboxIndex(0)}
                aria-label="查看大图"
              >
                <Image
                  src={originalImages[0]}
                  alt={story.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 500px"
                  className="object-cover"
                />
              </button>
            </div>
          )}
          {originalImages.length > 1 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {originalImages.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  className="relative block h-40 w-full cursor-zoom-in overflow-hidden rounded-xl"
                  onClick={() => setLightboxIndex(i)}
                  aria-label="查看大图"
                >
                  <Image
                    src={url}
                    alt={story.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {lightboxIndex !== null && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
              onClick={() => setLightboxIndex(null)}
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25"
                aria-label="关闭"
              >
                ×
              </button>
              {lightboxIndex > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(lightboxIndex - 1);
                  }}
                  className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25"
                  aria-label="上一张"
                >
                  ‹
                </button>
              )}
              {lightboxIndex < originalImages.length - 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(lightboxIndex + 1);
                  }}
                  className="absolute right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25"
                  aria-label="下一张"
                >
                  ›
                </button>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element -- lightbox full image */}
              <img
                src={originalImages[lightboxIndex]}
                alt={story.title}
                className="max-h-full max-w-full rounded-lg object-contain"
              />
              {originalImages.length > 1 && (
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                  {lightboxIndex + 1} / {originalImages.length}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex gap-4 text-sm">
            <button
              type="button"
              onClick={enterEdit}
              className="text-pink-500 transition hover:text-pink-600"
            >
              编辑
            </button>
            <button
              type="button"
              onClick={() => setDeleting(true)}
              className="text-red-400 transition hover:text-red-500"
            >
              删除
            </button>
          </div>

          {deleting && (
            <form action={delAction} className="mt-3 space-y-2 rounded-lg bg-red-50 p-3">
              <p className="text-sm text-red-600">删除后无法恢复,需输入上传密码确认。</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="off"
                  placeholder="上传密码"
                  className="w-full rounded-lg border border-red-200 px-3 py-1.5 text-sm outline-none focus:border-red-400"
                />
                <button
                  type="submit"
                  disabled={delPending}
                  className="shrink-0 rounded-lg bg-red-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {delPending ? '删除中…' : '确认删除'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(false)}
                  className="shrink-0 rounded-lg border border-red-200 px-4 py-1.5 text-sm text-red-500 transition hover:bg-red-100"
                >
                  取消
                </button>
              </div>
              {delState.status === 'error' && <p className="text-sm text-red-600">{delState.message}</p>}
            </form>
          )}
        </>
      )}
    </article>
  );
}
