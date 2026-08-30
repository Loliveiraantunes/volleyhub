import { api } from './api';
import type { TechnicalStaff, TechnicalStaffRequest } from '../types/api';

export const staffService = {
  listByTeam: (teamId: number) =>
    api.get<TechnicalStaff[]>(`/api/admin/teams/${teamId}/technical-staff`).then((r) => r.data),
  create: (teamId: number, data: TechnicalStaffRequest) =>
    api.post<TechnicalStaff>(`/api/admin/teams/${teamId}/technical-staff`, data).then((r) => r.data),
};
