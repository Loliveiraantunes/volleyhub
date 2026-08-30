import { api } from './api';
import type { BracketGroup, BracketGroupTree, GroupStandings } from '../types/api';

export const standingsService = {
  adminStandings: (eventId: number) =>
    api.get<GroupStandings[]>(`/api/admin/events/${eventId}/standings`).then((r) => r.data),
  publicStandings: (slug: string) =>
    api.get<GroupStandings[]>(`/api/public/events/${slug}/standings`).then((r) => r.data),
  publicBracket: async (slug: string) => {
    try {
      const response = await api.get<BracketGroupTree[]>(`/api/public/events/${slug}/bracket-tree`);
      return response.data;
    } catch {
      const response = await api.get<BracketGroup[]>(`/api/public/events/${slug}/bracket`);
      return response.data;
    }
  },
};
