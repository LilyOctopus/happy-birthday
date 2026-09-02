'use client';

import Image from 'next/image';
import { useActionState, useState } from 'react';
import { updateStory, deleteStory } from '@/actions/upload';
import { compressImage } from '@/lib/image';
import type { Story, UploadState } from '@/lib/types';

const initial: UploadState = { status: 'idle' };

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

export default function StoryCard({ story }: { story: Story }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const [editState, editAction, editPending] = useActionState(
    (_p: UploadState, fd: FormData) => updateStory(story.id, _p, fd),
    initial
  );
  const [delState, delAction, delPending] = useActionState(
    (_p: UploadState, fd: FormData) => deleteStory(story.id, _p, fd),
    initial
  );

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get('image');
    try {
      if (file instanceof File && file.size > 0) {
        const compressed = await compressImage(file);
        fd.set('image', compressed, file.name);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : '图片处理失败');
      return;
    }
    editAction(fd);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  const editError = editState.status === 'error' ? editState.message : localError;
  const date = formatDate(story.event_date);
  const inputCls =
    'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-pink-400';

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-pink-100 transition hover:shadow-md">
      {editing ? (
        <form onSubmit={handleEdit} className="space-y-3">
          <p className="text-sm font-medium text-slate-600">编辑回忆</p>
          <input type="password" name="password" required autoComplete="off" placeholder="上传密码 *" className={inputCls} />
          <input type="text" name="title" required maxLength={80} defaultValue={story.title} className={inputCls} placeholder="标题" />
          <input type="date" name="event_date" defaultValue={story.event_date ?? ''} className={inputCls} />
          <textarea name="content" rows={3} defaultValue={story.content ?? ''} maxLength={2000} className={`${inputCls} resize-y`} placeholder="小故事" />
          <input type="file" name="image" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-pink-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-pink-600 hover:file:bg-pink-100" />
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element -- blob URL preview
            <img src={preview} alt="预览" className="h-32 w-full rounded-lg object-cover" />
          )}
          {editError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{editError}</p>}
          {editState.status === 'success' && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">✓ 已保存</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={editPending}
              className="rounded-full bg-pink-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editPending ? '保存中…' : '保存'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setPreview(null);
                setLocalError(null);
              }}
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
          {story.image_url && (
            <div className="relative mt-3 h-56 w-full overflow-hidden rounded-xl">
              <Image
                src={story.image_url}
                alt={story.title}
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover"
              />
            </div>
          )}

          <div className="mt-3 flex gap-4 text-sm">
            <button type="button" onClick={() => setEditing(true)} className="text-pink-500 transition hover:text-pink-600">
              编辑
            </button>
            <button type="button" onClick={() => setDeleting(true)} className="text-red-400 transition hover:text-red-500">
              删除
            </button>
          </div>

          {deleting && (
            <form action={delAction} className="mt-3 space-y-2 rounded-lg bg-red-50 p-3">
              <p className="text-sm text-red-600">删除后无法恢复,需输入上传密码确认。</p>
              <div className="flex gap-2">
                <input type="password" name="password" required autoComplete="off" placeholder="上传密码" className="w-full rounded-lg border border-red-200 px-3 py-1.5 text-sm outline-none focus:border-red-400" />
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
