import { supabase } from './supabase';

/**
 * Base URL of the Node API. In dev this defaults to '/api', which the Vite dev
 * server proxies to the Node service (see vite.config.ts). In production set
 * VITE_API_URL to the deployed API origin, e.g. https://api.example.com/api.
 */
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';

/** True when an API base is configured (always true given the '/api' default). */
export const isApiConfigured = Boolean(API_URL);

async function authHeader(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    ...(await authHeader()),
    ...((opts.headers as Record<string, string>) ?? {}),
  };
  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error as string;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// -------------------------------------------------------------------------
// Current user profile (drives the admin gate)
// -------------------------------------------------------------------------
export type MeProfile = { id: string; email: string | null; is_admin: boolean };
export function getMe() {
  return apiFetch<MeProfile>('/me');
}

// -------------------------------------------------------------------------
// Tracks (multi-track roadmap platform)
// -------------------------------------------------------------------------
export type Resource = { kind: string; title: string; url: string };
export type TrackSummary = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  difficulty: string;
  module_count: number;
  topic_count: number;
  total_hours: number;
};
export type Topic = {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  description: string;
  est_hours: number;
  resources: Resource[];
  sort_order: number;
};
export type Module = { id: string; slug: string; title: string; goal: string; sort_order: number; topics: Topic[] };
export type TrackDetail = { track: Omit<TrackSummary, 'module_count' | 'topic_count' | 'total_hours'>; modules: Module[] };
export type Enrollment = {
  track_id: string;
  start_date: string;
  weekday_hours: number;
  weekend_hours: number;
};

export function getTracks() {
  return apiFetch<{ tracks: TrackSummary[] }>('/tracks');
}
export function getTrack(slug: string) {
  return apiFetch<TrackDetail>(`/tracks/${slug}`);
}
export function getMyEnrollments() {
  return apiFetch<{ enrollments: Enrollment[] }>('/tracks/me/enrollments');
}
export function enrollInTrack(body: Enrollment) {
  return apiFetch<{ ok: true }>('/tracks/enroll', { method: 'POST', body: JSON.stringify(body) });
}
export function leaveTrack(trackId: string) {
  return apiFetch<{ ok: true }>(`/tracks/enroll/${trackId}`, { method: 'DELETE' });
}
export type TopicStatus = 'todo' | 'in_progress' | 'done' | 'skip';
export function getTrackState(trackId: string) {
  return apiFetch<{
    progress: Array<{ topic_id: string; status: TopicStatus }>;
    notes: Array<{ topic_id: string; content: string }>;
  }>(`/tracks/me/state/${trackId}`);
}
export function putTopicProgress(topicId: string, status: TopicStatus) {
  return apiFetch<{ ok: true }>(`/tracks/me/progress/${topicId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export type LearningSummary = {
  track: { id: string; slug: string; title: string; icon: string; color: string };
  total: number;
  done: number;
  next: { id: string; title: string } | null;
  start_date: string;
  weekday_hours: number;
  weekend_hours: number;
};
export function getMySummary() {
  return apiFetch<{ summaries: LearningSummary[] }>('/tracks/me/summary');
}
export function putTopicNote(topicId: string, content: string) {
  return apiFetch<{ ok: true }>(`/tracks/me/notes/${topicId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

// -------------------------------------------------------------------------
// Admin: author study plans (tracks / modules / topics)
// -------------------------------------------------------------------------
export function adminSaveTrack(body: Record<string, unknown>) {
  return apiFetch<{ ok: true }>('/tracks/admin/track', { method: 'POST', body: JSON.stringify(body) });
}
export function adminDeleteTrack(id: string) {
  return apiFetch<{ ok: true }>(`/tracks/admin/track/${id}`, { method: 'DELETE' });
}
export function adminSaveModule(body: Record<string, unknown>) {
  return apiFetch<{ ok: true }>('/tracks/admin/module', { method: 'POST', body: JSON.stringify(body) });
}
export function adminDeleteModule(id: string) {
  return apiFetch<{ ok: true }>(`/tracks/admin/module/${id}`, { method: 'DELETE' });
}
export function adminSaveTopic(body: Record<string, unknown>) {
  return apiFetch<{ ok: true }>('/tracks/admin/topic', { method: 'POST', body: JSON.stringify(body) });
}
export function adminDeleteTopic(id: string) {
  return apiFetch<{ ok: true }>(`/tracks/admin/topic/${id}`, { method: 'DELETE' });
}
/** Create a whole track (modules + topics + resources) from one JSON document. */
export function adminImportTrack(body: unknown) {
  return apiFetch<{ ok: true; slug: string; modules: number; topics: number }>(
    '/tracks/admin/import',
    { method: 'POST', body: JSON.stringify(body) },
  );
}
