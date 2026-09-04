import { api } from './api';
import type { Match, MatchDetailResponse, MatchRequest } from '../types/api';

export const matchService = {
  listByEvent: (eventId: number) => api.get<Match[]>(`/api/admin/events/${eventId}/matches`).then((r) => r.data),
  generateBracket: (eventId: number, groupId: number) =>
    api.post<Match[]>(`/api/admin/events/${eventId}/groups/${groupId}/matches/generate-bracket`).then((r) => r.data),
  create: (eventId: number, data: MatchRequest) =>
    api.post<Match>(`/api/admin/events/${eventId}/matches`, data).then((r) => r.data),
  findById: (id: number) => api.get<Match>(`/api/admin/matches/${id}`).then((r) => r.data),
  update: (id: number, data: MatchRequest) => api.put<Match>(`/api/admin/matches/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/admin/matches/${id}`).then((r) => r.data),
};

export const publicMatchService = {
  findBySlugAndId: (slug: string, matchId: number) =>
    api.get<MatchDetailResponse>(`/api/public/events/${slug}/matches/${matchId}`).then((r) => r.data),
};
