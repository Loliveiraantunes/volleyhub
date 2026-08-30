import { api } from './api';
import type { GroupStage, GroupStageRequest, GroupStageTeam } from '../types/api';

export const groupService = {
  listByEvent: (eventId: number) => api.get<GroupStage[]>(`/api/admin/events/${eventId}/groups`).then((r) => r.data),
  create: (eventId: number, data: GroupStageRequest) =>
    api.post<GroupStage>(`/api/admin/events/${eventId}/groups`, data).then((r) => r.data),
  update: (id: number, data: GroupStageRequest) =>
    api.put<GroupStage>(`/api/admin/groups/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/admin/groups/${id}`).then((r) => r.data),
  addTeam: (groupId: number, teamId: number, displayOrder: number) =>
    api
      .post<GroupStageTeam>(`/api/admin/groups/${groupId}/teams/${teamId}`, { displayOrder })
      .then((r) => r.data),
  removeTeam: (groupId: number, teamId: number) =>
    api.delete(`/api/admin/groups/${groupId}/teams/${teamId}`).then((r) => r.data),
};
