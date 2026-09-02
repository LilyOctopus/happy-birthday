// Shared domain types

export interface Story {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  event_date: string | null;
  created_at: string;
}

export type UploadState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success' }
  | { status: 'error'; message: string };
