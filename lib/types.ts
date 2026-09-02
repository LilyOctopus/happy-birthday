// Shared domain types

export interface Story {
  id: string;
  title: string;
  content: string | null;
  /** Legacy single-image field; superseded by image_urls. */
  image_url: string | null;
  image_urls: string[] | null;
  event_date: string | null;
  created_at: string;
}

/** All images for a story, falling back to the legacy field. */
export function storyImages(story: Pick<Story, 'image_url' | 'image_urls'>): string[] {
  if (story.image_urls && story.image_urls.length > 0) return story.image_urls;
  return story.image_url ? [story.image_url] : [];
}

export type UploadState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success' }
  | { status: 'error'; message: string };
