import { createSupabasePublic } from '@/lib/supabase-public';
import StoryCard from '@/components/StoryCard';
import type { Story } from '@/lib/types';

async function getStories(): Promise<Story[]> {
  const sb = createSupabasePublic();
  if (!sb) return [];
  const { data, error } = await sb
    .from('stories')
    .select('id, title, content, image_url, image_urls, event_date, created_at')
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

  // Desktop: two staggered columns — the right column drops by half a card so
  // rows interlock like a brick wall. Mobile: single column.
  const left = stories.filter((_, i) => i % 2 === 0);
  const right = stories.filter((_, i) => i % 2 === 1);

  return (
    <div className="relative mx-auto max-w-4xl">
      {/* Center spine (desktop) */}
      <div className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-pink-200 md:block" />

      {/* Mobile: single column */}
      <div className="space-y-6 md:hidden">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      {/* Desktop: staggered two columns */}
      <div className="hidden gap-x-12 pb-24 md:grid md:grid-cols-2">
        <div className="flex flex-col gap-6">
          {left.map((story) => (
            <div key={story.id} className="relative">
              <div className="absolute left-1/2 top-6 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 border-pink-400 bg-white md:block" />
              <StoryCard story={story} />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6">
          {right.map((story) => (
            <div key={story.id} className="relative md:translate-y-1/2">
              <div className="absolute left-1/2 top-6 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 border-pink-400 bg-white md:block" />
              <StoryCard story={story} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
