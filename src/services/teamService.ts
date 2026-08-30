import { api, buildMultipartRequest } from './api';
import type { Team, TeamRequest } from '../types/api';

export const teamService = {
  listByEvent: (eventId: number) => api.get<Team[]>(`/api/admin/events/${eventId}/teams`).then((r) => r.data),
  create: (eventId: number, data: TeamRequest, logoFile?: File | null) =>
    logoFile
      ? api
          .post<Team>(`/api/admin/events/${eventId}/teams`, buildMultipartRequest(data, 'logoFile', logoFile))
          .then((r) => r.data)
      : api.post<Team>(`/api/admin/events/${eventId}/teams`, data).then((r) => r.data),
  findById: (id: number) => api.get<Team>(`/api/admin/teams/${id}`).then((r) => r.data),
  update: (id: number, data: TeamRequest, logoFile?: File | null) =>
    logoFile
      ? api.put<Team>(`/api/admin/teams/${id}`, buildMultipartRequest(data, 'logoFile', logoFile)).then((r) => r.data)
      : api.put<Team>(`/api/admin/teams/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/admin/teams/${id}`).then((r) => r.data),
  approve: (id: number) => api.post<Team>(`/api/admin/teams/${id}/approve`).then((r) => r.data),
  reject: (id: number) => api.post<Team>(`/api/admin/teams/${id}/reject`).then((r) => r.data),
};

export const publicTeamService = {
  listBySlug: (slug: string) => api.get<Team[]>(`/api/public/events/${slug}/teams`).then((r) => r.data),
};
