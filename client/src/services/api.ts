import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const AI_URL = 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ===== AUTH =====
export const authAPI = {
  register: (data: { name: string; email: string; password: string; role: string; institution?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () =>
    api.get('/auth/profile'),
};

// ===== CARDS =====
export const cardsAPI = {
  getAll: (params?: { search?: string; subject?: string; tag?: string; page?: number }) =>
    api.get('/cards', { params }),
  getById: (id: string) =>
    api.get(`/cards/${id}`),
  getMyCards: () =>
    api.get('/cards/my/cards'),
  create: (formData: FormData) =>
    api.post('/cards', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  update: (id: string, formData: FormData) =>
    api.put(`/cards/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  delete: (id: string) =>
    api.delete(`/cards/${id}`),
};

// ===== ACCESS =====
export const accessAPI = {
  requestAccess: (cardId: string, message?: string) =>
    api.post(`/access/request/${cardId}`, { message }),
  getMyRequests: () =>
    api.get('/access/my-requests'),
  getTeacherRequests: () =>
    api.get('/access/teacher-requests'),
  getCardRequests: (cardId: string) =>
    api.get(`/access/card-requests/${cardId}`),
  handleRequest: (requestId: string, status: 'approved' | 'rejected') =>
    api.put(`/access/handle/${requestId}`, { status }),
  revokeAccess: (cardId: string, userId: string) =>
    api.delete(`/access/revoke/${cardId}/${userId}`),
};

// ===== USERS =====
export const usersAPI = {
  getDashboardStats: () =>
    api.get('/users/dashboard-stats'),
};

// ===== QUIZ =====
export const quizAPI = {
  get: (cardId: string) =>
    api.get(`/cards/${cardId}/quiz`),
  create: (cardId: string, data: { title: string; description?: string; questions: any[] }) =>
    api.post(`/cards/${cardId}/quiz`, data),
  submit: (cardId: string, answers: number[]) =>
    api.post(`/cards/${cardId}/quiz/attempt`, { answers }),
  getResults: (cardId: string) =>
    api.get(`/cards/${cardId}/quiz/results`),
  delete: (cardId: string) =>
    api.delete(`/cards/${cardId}/quiz`),
};

// ===== DISCUSSION =====
export const discussionAPI = {
  getMessages: (cardId: string, page = 1) =>
    api.get(`/cards/${cardId}/chat`, { params: { page, limit: 100 } }),
  postMessage: (cardId: string, content: string) =>
    api.post(`/cards/${cardId}/chat`, { content }),
  deleteMessage: (cardId: string, msgId: string) =>
    api.delete(`/cards/${cardId}/chat/${msgId}`),
};

// ===== AI =====
const aiApi = axios.create({
  baseURL: AI_URL,
  headers: { 'Content-Type': 'application/json' }
});

export const aiAPI = {
  chat: (data: { card_id: string; question: string; user_id: string; conversation_history: { role: string; content: string }[] }) =>
    aiApi.post('/ai/chat', data),
  health: () =>
    aiApi.get('/ai/health'),
};

export default api;
