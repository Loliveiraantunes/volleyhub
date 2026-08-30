import { api } from './api';
import type { EventCategory, EventCategoryRequest } from '../types/api';

export const eventCategoryService = {
  findAll: () => api.get<EventCategory[]>('/api/admin/event-categories').then((r) => r.data),
  findById: (id: number) => api.get<EventCategory>(`/api/admin/event-categories/${id}`).then((r) => r.data),
  create: (data: EventCategoryRequest) =>
    api.post<EventCategory>('/api/admin/event-categories', data).then((r) => r.data),
  update: (id: number, data: EventCategoryRequest) =>
    api.put<EventCategory>(`/api/admin/event-categories/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/admin/event-categories/${id}`).then((r) => r.data),
};
