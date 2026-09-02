'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { uploadStory } from '@/actions/upload';
import { compressImage } from '@/lib/image';
import { extractDateFromImage } from '@/lib/exif-date';
import type { UploadState } from '@/lib/types';

const initial: UploadState = { status: 'idle' };

export default function UploadForm() {
  const [state, formAction, pending] = useActionState(uploadStory, initial);
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [previewList, setPreviewList] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);

    const fd = new FormData(e.currentTarget);
    const files = fd
      .getAll('images')
      .filter((f): f is File => f instanceof File && f.size > 0);

    try {
      if (files.length > 0) {
        fd.delete('images');
        for (const file of files) {
          const compressed = await compressImage(file);
          fd.append('images', compressed, file.name);
        }
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : '图片处理失败');
      return;
    }

    startTransition(() => formAction(fd));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPreviewList(files.map((f) => URL.createObjectURL(f)));
    // Auto-fill date from the first image that carries one (only if not set manually).
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

  // Reset the form after a successful upload so the next entry starts clean.
  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear preview blob state after success
      setPreviewList([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear date field after success
      setEventDate('');
    }
  }, [state.status]);

  const error = state.status === 'error' ? state.message : localError;
  const success = state.status === 'success';

  return (
    <div className="mx-auto mb-10 max-w-3xl">
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setPreviewList([]);
          }}
          className="rounded-full bg-pink-500 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-pink-600"
        >
          💝 添加回忆
        </button>
      ) : (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-pink-100"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">添加新回忆</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              收起
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                上传密码 <span className="text-pink-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                required
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-pink-400"
                placeholder="输入共享的上传密码"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  标题 <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  maxLength={80}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-pink-400"
                  placeholder="比如:大一那年秋游"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">发生日期</label>
                <input
                  type="date"
                  name="event_date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-pink-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">小故事</label>
              <textarea
                name="content"
                rows={4}
                maxLength={2000}
                className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-pink-400"
                placeholder="写下那天的故事…"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                照片(可选,可多选)
              </label>
              <input
                type="file"
                name="images"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-pink-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-pink-600 hover:file:bg-pink-100"
              />
              {previewList.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {previewList.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element -- blob URL preview, next/image can't optimize object URLs
                    <img
                      key={i}
                      src={url}
                      alt="预览"
                      className="h-24 w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
            {success && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
                ✓ 已保存,回忆已加入时间线!
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-pink-500 py-2.5 font-medium text-white shadow-sm transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {pending ? '保存中…' : '保存回忆'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
