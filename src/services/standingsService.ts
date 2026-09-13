import { api } from './api';
import type { BracketGroup, BracketGroupTree, GroupStandings } from '../types/api';

export const standingsService = {
  adminStandings: (eventId: number) =>
    api.get<{ groups?: GroupStandings[]; unclassifiedMatches?: any[] } | GroupStandings[]>(`/api/admin/events/${eventId}/standings`).then((r) => {
      const response = r.data;
      
      // Handle both old format (array) and new format (object with groups)
      let groups: GroupStandings[] = [];
      let unclassifiedMatches: any[] = [];
      
      if (Array.isArray(response)) {
        // Old format: array of groups
        groups = response;
      } else if (typeof response === 'object' && response !== null) {
        // New format: { groups, unclassifiedMatches }
        groups = response.groups ?? [];
        unclassifiedMatches = response.unclassifiedMatches ?? [];
      }
      
      const result = groups.map((group) => ({
        ...group,
        unclassifiedMatches: unclassifiedMatches,
      }));
      
      // Se não houver grupos mas houver unclassifiedMatches, retornar um array com os unclassifiedMatches
      if (result.length === 0 && unclassifiedMatches.length > 0) {
        return [{
          groupId: 0,
          groupName: '',
          entries: [],
          unclassifiedMatches: unclassifiedMatches,
        }];
      }
      
      return result;
    }),
  publicStandings: (slug: string) =>
    api.get<{ groups?: GroupStandings[]; unclassifiedMatches?: any[] } | GroupStandings[]>(`/api/public/events/${slug}/standings`).then((r) => {
      const response = r.data;
      
      // Handle both old format (array) and new format (object with groups)
      let groups: GroupStandings[] = [];
      let unclassifiedMatches: any[] = [];
      
      if (Array.isArray(response)) {
        // Old format: array of groups
        groups = response;
      } else if (typeof response === 'object' && response !== null) {
        // New format: { groups, unclassifiedMatches }
        groups = response.groups ?? [];
        unclassifiedMatches = response.unclassifiedMatches ?? [];
      }
      
      const result = groups.map((group) => ({
        ...group,
        unclassifiedMatches: unclassifiedMatches,
      }));
      
      // Se não houver grupos mas houver unclassifiedMatches, retornar um array com os unclassifiedMatches
      if (result.length === 0 && unclassifiedMatches.length > 0) {
        return [{
          groupId: 0,
          groupName: '',
          entries: [],
          unclassifiedMatches: unclassifiedMatches,
        }];
      }
      
      return result;
    }),
  publicDetailedStandings: (slug: string) =>
    api.get<{ groups?: GroupStandings[]; unclassifiedMatches?: any[] } | GroupStandings[]>(`/api/public/events/${slug}/standings/detailed`).then((r) => {
      const response = r.data;
      
      // Handle both old format (array) and new format (object with groups)
      let groups: GroupStandings[] = [];
      let unclassifiedMatches: any[] = [];
      
      if (Array.isArray(response)) {
        // Old format: array of groups
        groups = response;
      } else if (typeof response === 'object' && response !== null) {
        // New format: { groups, unclassifiedMatches }
        groups = response.groups ?? [];
        unclassifiedMatches = response.unclassifiedMatches ?? [];
      }
      
      const result = groups.map((group) => ({
        ...group,
        unclassifiedMatches: unclassifiedMatches,
        entries: (group.entries ?? []).map((entry) => ({
          ...entry,
          wins: entry.wins ?? entry.victories ?? entry.matchesWon ?? 0,
          setsWon: entry.setsWon ?? entry.wonSets ?? entry.totalSetsWon ?? 0,
          totalMatches: entry.totalMatches ?? 0,
        })),
      }));
      
      // Se não houver grupos mas houver unclassifiedMatches, retornar um array com os unclassifiedMatches
      if (result.length === 0 && unclassifiedMatches.length > 0) {
        return [{
          groupId: 0,
          groupName: '',
          entries: [],
          unclassifiedMatches: unclassifiedMatches,
        }];
      }
      
      return result;
    }),
  adminDetailedStandings: (eventId: number) =>
    api.get<{ groups?: GroupStandings[]; unclassifiedMatches?: any[] } | GroupStandings[]>(`/api/admin/events/${eventId}/standings`).then((r) => {
      const response = r.data;
      
      // Handle both old format (array) and new format (object with groups)
      let groups: GroupStandings[] = [];
      let unclassifiedMatches: any[] = [];
      
      if (Array.isArray(response)) {
        // Old format: array of groups
        groups = response;
      } else if (typeof response === 'object' && response !== null) {
        // New format: { groups, unclassifiedMatches }
        groups = response.groups ?? [];
        unclassifiedMatches = response.unclassifiedMatches ?? [];
      }
      
      const result = groups.map((group) => ({
        ...group,
        unclassifiedMatches: unclassifiedMatches,
        entries: (group.entries ?? []).map((entry) => ({
          ...entry,
          wins: entry.wins ?? entry.victories ?? entry.matchesWon ?? 0,
          setsWon: entry.setsWon ?? entry.wonSets ?? entry.totalSetsWon ?? 0,
          totalMatches: entry.totalMatches ?? 0,
        })),
      }));
      
      // Se não houver grupos mas houver unclassifiedMatches, retornar um array com os unclassifiedMatches
      if (result.length === 0 && unclassifiedMatches.length > 0) {
        return [{
          groupId: 0,
          groupName: '',
          entries: [],
          unclassifiedMatches: unclassifiedMatches,
        }];
      }
      
      return result;
    }),
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
