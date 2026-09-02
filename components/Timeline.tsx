import { createSupabasePublic } from '@/lib/supabase-public';
import StoryCard from '@/components/StoryCard';
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
                <StoryCard story={story} />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
