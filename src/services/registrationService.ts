import { api, buildMultipartRequest } from './api';
import type { PublicRegistrationRequest, Registration } from '../types/api';

export const registrationService = {
  create: (slug: string, data: PublicRegistrationRequest, logoFile?: File | null) =>
    logoFile
      ? api
          .post<Registration>(`/api/public/events/${slug}/registrations`, buildMultipartRequest(data, 'logoFile', logoFile))
          .then((r) => r.data)
      : api.post<Registration>(`/api/public/events/${slug}/registrations`, data).then((r) => r.data),
  confirmPayment: (id: number) =>
    api.post<Registration>(`/api/public/registrations/${id}/payment`).then((r) => r.data),
};

