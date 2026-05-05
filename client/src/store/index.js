import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchMe: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  }
}));

export const usePostStore = create((set, get) => ({
  posts: [],
  currentPost: null,
  total: 0,
  page: 1,
  loading: false,
  filter: { status: '', platform: '', search: '' },

  fetchPosts: async (params = {}) => {
    set({ loading: true });
    try {
      const query = { ...get().filter, ...params };
      const qs = new URLSearchParams(Object.fromEntries(Object.entries(query).filter(([, v]) => v))).toString();
      const { data } = await api.get(`/posts?${qs}`);
      set({ posts: data.posts, total: data.total, page: data.page, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createPost: async (postData) => {
    const { data } = await api.post('/posts', postData);
    set(s => ({ posts: [data.post, ...s.posts] }));
    return data.post;
  },

  updatePost: async (id, postData) => {
    const { data } = await api.put(`/posts/${id}`, postData);
    set(s => ({ posts: s.posts.map(p => p._id === id ? data.post : p), currentPost: data.post }));
    return data.post;
  },

  deletePost: async (id) => {
    await api.delete(`/posts/${id}`);
    set(s => ({ posts: s.posts.filter(p => p._id !== id) }));
  },

  publishPost: async (id) => {
    const { data } = await api.post(`/posts/${id}/publish`);
    set(s => ({ posts: s.posts.map(p => p._id === id ? data.post : p) }));
    return data;
  },

  schedulePost: async (id, scheduledAt, timezone) => {
    const { data } = await api.post(`/posts/${id}/schedule`, { scheduledAt, timezone });
    set(s => ({ posts: s.posts.map(p => p._id === id ? data.post : p) }));
    return data;
  },

  setFilter: (filter) => set(s => ({ filter: { ...s.filter, ...filter } }))
}));

export const useAnalyticsStore = create((set) => ({
  overview: null,
  engagement: null,
  loading: false,

  fetchOverview: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/analytics/overview');
      set({ overview: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchEngagement: async () => {
    try {
      const { data } = await api.get('/analytics/engagement');
      set({ engagement: data });
    } catch {}
  }
}));
