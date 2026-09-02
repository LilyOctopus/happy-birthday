'use client';

import { useEffect, useRef, useState } from 'react';
import StoryCard from './StoryCard';
import type { Story } from '@/lib/types';

/**
 * Desktop staggered two-column layout. The right column is pushed down by half
 * the height of the first left card, so pairs interlock without overlapping —
 * column flow stays intact, so tall cards never collide.
 */
export default function StaggeredTimeline({ left, right }: { left: Story[]; right: Story[] }) {
  const leftColRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const first = leftColRef.current?.firstElementChild as HTMLElement | null;
    if (!first) return;
    const update = () => setOffset(Math.round(first.offsetHeight / 2));
    update();
    // Re-measure when images load and change the card height.
    const ro = new ResizeObserver(update);
    ro.observe(first);
    return () => ro.disconnect();
  }, [left]);

  return (
    <div
      className="hidden gap-x-12 md:grid md:grid-cols-2"
      style={{ paddingBottom: offset }}
    >
      <div ref={leftColRef} className="flex flex-col gap-6">
        {left.map((story) => (
          <div key={story.id} className="relative">
            {/* Dot on the center spine: for left-column cards that's the right edge. */}
            <div className="absolute left-full top-6 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 border-pink-400 bg-white md:block" />
            <StoryCard story={story} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-6" style={{ transform: `translateY(${offset}px)` }}>
        {right.map((story) => (
          <div key={story.id} className="relative">
            {/* Dot on the spine: for right-column cards that's the left edge. */}
            <div className="absolute left-0 top-6 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 border-pink-400 bg-white md:block" />
            <StoryCard story={story} />
          </div>
        ))}
      </div>
    </div>
  );
}
