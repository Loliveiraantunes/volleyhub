import axios from 'axios';

export const TOKEN_KEY = 'volleyhub_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ApiErrorInfo {
  status?: number;
  message: string;
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Requisição inválida. Verifique os dados informados.',
  401: 'Sessão expirada. Faça login novamente.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Recurso não encontrado.',
  409: 'Conflito de dados. Verifique as informações e tente novamente.',
  422: 'Não foi possível processar os dados enviados.',
  500: 'Erro interno do servidor. Tente novamente mais tarde.',
};

// listeners notified when the session becomes invalid (401)
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status as number | undefined;
    const backendMessage =
      error.response?.data?.message ?? error.response?.data?.error ?? undefined;
    const message =
      backendMessage ?? (status ? STATUS_MESSAGES[status] : undefined) ?? 'Erro de comunicação com o servidor.';

    if (status === 401) {
      clearToken();
      onUnauthorized?.();
    }

    const apiError: ApiErrorInfo = { status, message };
    return Promise.reject(apiError);
  },
);

// builds the multipart body expected by *Multipart admin/public endpoints: a JSON "request" part plus a named file part
export function buildMultipartRequest(request: unknown, fileFieldName: string, file: File | null | undefined): FormData {
  const formData = new FormData();
  formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
  if (file) {
    formData.append(fileFieldName, file);
  }
  return formData;
}

