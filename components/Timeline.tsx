import Image from 'next/image';
import { createSupabasePublic } from '@/lib/supabase-public';
import type { Story } from '@/lib/types';

async function getStories(): Promise<Story[]> {
  const sb = createSupabasePublic();
  if (!sb) return [];
  const { data, error } = await sb
    .from('stories')
    .select('id, title, content, image_url, event_date, created_at')
    .order('event_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[timeline] fetch failed:', error.message);
    return [];
  }
  return (data ?? []) as Story[];
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

export default async function Timeline() {
  const stories = await getStories();

  if (stories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-pink-300 bg-white/70 p-10 text-center text-slate-500">
        还没有回忆记录。上传第一条,让这里开始长满故事 🌱
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-3xl">
      {/* Center spine (hidden on mobile) */}
      <div className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-pink-200 md:block" />

      <ol className="space-y-10">
        {stories.map((story, i) => {
          const date = formatDate(story.event_date);
          const leftSide = i % 2 === 0;
          return (
            <li key={story.id} className="relative">
              {/* Node dot */}
              <div className="absolute left-1/2 top-6 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 border-pink-400 bg-white md:block" />

              <div
                className={`ml-6 md:ml-0 md:w-[calc(50%-2rem)] ${
                  leftSide ? 'md:mr-auto' : 'md:ml-auto'
                }`}
              >
                <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-pink-100 transition hover:shadow-md">
                  {date && <p className="mb-1 text-xs font-medium text-pink-400">{date}</p>}
                  <h3 className="text-lg font-bold text-slate-800">{story.title}</h3>
                  {story.content && (
                    <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-600">
                      {story.content}
                    </p>
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
                </article>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
