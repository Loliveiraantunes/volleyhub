import { api } from './api';
import type { Player, PlayerRequest } from '../types/api';

export const playerService = {
  listByTeam: (teamId: number) => api.get<Player[]>(`/api/admin/teams/${teamId}/players`).then((r) => r.data),
  create: (teamId: number, data: PlayerRequest) =>
    api.post<Player>(`/api/admin/teams/${teamId}/players`, data).then((r) => r.data),
};
