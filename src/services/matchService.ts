import { api } from './api';
import type { Match, MatchRequest } from '../types/api';

export const matchService = {
  listByEvent: (eventId: number) => api.get<Match[]>(`/api/admin/events/${eventId}/matches`).then((r) => r.data),
  create: (eventId: number, data: MatchRequest) =>
    api.post<Match>(`/api/admin/events/${eventId}/matches`, data).then((r) => r.data),
  findById: (id: number) => api.get<Match>(`/api/admin/matches/${id}`).then((r) => r.data),
  update: (id: number, data: MatchRequest) => api.put<Match>(`/api/admin/matches/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/admin/matches/${id}`).then((r) => r.data),
};
