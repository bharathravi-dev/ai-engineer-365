import { create } from 'zustand';
import * as api from './lib/api';
import type { Enrollment, LearningSummary, TopicStatus, TrackDetail, TrackSummary } from './lib/api';

/**
 * Store for the multi-track roadmap experience (catalog, enrollment, per-topic
 * status/notes, "My Learning" summary). Auth lives in useDashboardStore; this
 * store calls the Node API (which attaches the Supabase JWT). Progress is only
 * loaded/persisted for signed-in users — guests can browse but not track.
 *
 * `status` holds only non-default states; a topic with no entry is 'todo'.
 */
type TrackState = {
  catalog: TrackSummary[];
  catalogLoading: boolean;
  current: TrackDetail | null;
  currentLoading: boolean;
  enrollments: Record<string, Enrollment>;
  status: Record<string, TopicStatus>; // topic_id -> in_progress | done | skip
  notes: Record<string, string>;
  summaries: LearningSummary[];
  summaryLoading: boolean;
  error: string | null;

  loadCatalog: () => Promise<void>;
  loadTrack: (slug: string) => Promise<void>;
  loadEnrollments: () => Promise<void>;
  loadTrackState: (trackId: string) => Promise<void>;
  loadSummary: () => Promise<void>;
  enroll: (body: Enrollment) => Promise<{ error: string | null }>;
  leave: (trackId: string) => Promise<void>;
  setTopicStatus: (topicId: string, status: TopicStatus) => void;
  toggleDone: (topicId: string) => void;
  saveTopicNote: (topicId: string, content: string) => void;
  reset: () => void;
};

export const useTrackStore = create<TrackState>((set, get) => ({
  catalog: [],
  catalogLoading: false,
  current: null,
  currentLoading: false,
  enrollments: {},
  status: {},
  notes: {},
  summaries: [],
  summaryLoading: false,
  error: null,

  loadCatalog: async () => {
    set({ catalogLoading: true, error: null });
    try {
      const { tracks } = await api.getTracks();
      set({ catalog: tracks, catalogLoading: false });
    } catch (e) {
      set({ catalogLoading: false, error: e instanceof Error ? e.message : 'Failed to load tracks.' });
    }
  },

  loadTrack: async (slug) => {
    set({ currentLoading: true, error: null });
    try {
      set({ current: await api.getTrack(slug), currentLoading: false });
    } catch (e) {
      set({ current: null, currentLoading: false, error: e instanceof Error ? e.message : 'Track not found.' });
    }
  },

  loadEnrollments: async () => {
    try {
      const { enrollments } = await api.getMyEnrollments();
      set({ enrollments: Object.fromEntries(enrollments.map((e) => [e.track_id, e])) });
    } catch {
      set({ enrollments: {} });
    }
  },

  loadTrackState: async (trackId) => {
    try {
      const { progress, notes } = await api.getTrackState(trackId);
      set({
        status: Object.fromEntries(progress.map((p) => [p.topic_id, p.status])),
        notes: Object.fromEntries(notes.map((n) => [n.topic_id, n.content ?? ''])),
      });
    } catch {
      /* keep existing */
    }
  },

  loadSummary: async () => {
    set({ summaryLoading: true });
    try {
      const { summaries } = await api.getMySummary();
      set({ summaries, summaryLoading: false });
    } catch {
      set({ summaries: [], summaryLoading: false });
    }
  },

  enroll: async (body) => {
    try {
      await api.enrollInTrack(body);
      await get().loadEnrollments();
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Failed to enroll.' };
    }
  },

  leave: async (trackId) => {
    await api.leaveTrack(trackId).catch(() => {});
    await get().loadEnrollments();
  },

  setTopicStatus: (topicId, status) => {
    const next = { ...get().status };
    if (status === 'todo') delete next[topicId];
    else next[topicId] = status;
    set({ status: next });
    void api.putTopicProgress(topicId, status).catch(() => {});
  },

  toggleDone: (topicId) => {
    const isDone = get().status[topicId] === 'done';
    get().setTopicStatus(topicId, isDone ? 'todo' : 'done');
  },

  saveTopicNote: (topicId, content) => {
    set({ notes: { ...get().notes, [topicId]: content } });
    void api.putTopicNote(topicId, content).catch(() => {});
  },

  reset: () => set({ enrollments: {}, status: {}, notes: {}, summaries: [] }),
}));
