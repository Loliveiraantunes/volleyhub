import { api, buildMultipartRequest } from './api';
import type { Event, EventRequest } from '../types/api';

export const eventService = {
  findAll: () => api.get<Event[]>('/api/admin/events').then((r) => r.data),
  findById: (id: number) => api.get<Event>(`/api/admin/events/${id}`).then((r) => r.data),
  create: (data: EventRequest, coverImageFile?: File | null) =>
    coverImageFile
      ? api.post<Event>('/api/admin/events', buildMultipartRequest(data, 'coverImageFile', coverImageFile)).then((r) => r.data)
      : api.post<Event>('/api/admin/events', data).then((r) => r.data),
  update: (id: number, data: EventRequest, coverImageFile?: File | null) =>
    coverImageFile
      ? api
          .put<Event>(`/api/admin/events/${id}`, buildMultipartRequest(data, 'coverImageFile', coverImageFile))
          .then((r) => r.data)
      : api.put<Event>(`/api/admin/events/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/admin/events/${id}`).then((r) => r.data),
};

export const publicEventService = {
  findBySlug: (slug: string) => api.get<Event>(`/api/public/events/${slug}`).then((r) => r.data),
};
