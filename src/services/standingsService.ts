import { api } from './api';
import type { BracketGroup, BracketGroupTree, GroupStandings } from '../types/api';

export const standingsService = {
  adminStandings: (eventId: number) =>
    api.get<GroupStandings[]>(`/api/admin/events/${eventId}/standings`).then((r) => r.data),
  publicStandings: (slug: string) =>
    api.get<GroupStandings[]>(`/api/public/events/${slug}/standings`).then((r) => r.data),
  publicDetailedStandings: (slug: string) =>
    api.get<GroupStandings[]>(`/api/public/events/${slug}/standings/detailed`).then((r) => r.data.map((group) => ({
      ...group,
      entries: group.entries.map((entry) => ({
        ...entry,
        wins: entry.wins ?? entry.victories ?? entry.matchesWon ?? 0,
        setsWon: entry.setsWon ?? entry.wonSets ?? entry.totalSetsWon ?? 0,
      })),
    }))),
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
