import {
  AuthResponse,
  HistoryDetail,
  HistoryPageResponse,
  LoginRequest,
  RegisterRequest,
  StoryboardResponse,
  UserProfile,
} from '@/lib/types';
import { API, API_V1, ensureApiConfigured } from '@/config';

const API_BASE_URL = API;
const BASE_URL = API_V1;

class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function normalizePath(path: string): string {
  if (!path.startsWith('/')) {
    return `/${path}`;
  }
  return path;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('scriptoria_token');
  return token
    ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    : {
        'Content-Type': 'application/json',
      };
}

async function parseResponse(response: Response): Promise<any> {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
}

async function requestJson<TResponse>(url: string, init?: RequestInit): Promise<TResponse> {
  try {
    const response = await fetch(url, init);
    const parsed = await parseResponse(response);

    if (!response.ok) {
      const message =
        parsed?.message ||
        parsed?.error ||
        `Request failed with status ${response.status}`;
      console.error('[Scriptoria] API request failed:', {
        url,
        status: response.status,
        message,
      });
      throw new ApiError(message, response.status);
    }

    return parsed as TResponse;
  } catch (error) {
    console.error('[Scriptoria] API network/request error:', {
      url,
      error,
    });
    throw error;
  }
}

export async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  ensureApiConfigured('postJson');
  return requestJson<TResponse>(`${API_BASE_URL}${normalizePath(path)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export const authApi = {
  register: (data: RegisterRequest) => {
    ensureApiConfigured('authApi.register');
    return requestJson<AuthResponse>(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },
  login: (data: LoginRequest) => {
    ensureApiConfigured('authApi.login');
    return requestJson<AuthResponse>(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },
  getProfile: () => {
    ensureApiConfigured('authApi.getProfile');
    return requestJson<UserProfile>(`${BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
  },
};

export const historyApi = {
  getHistory: (page = 0, size = 10) => {
    ensureApiConfigured('historyApi.getHistory');
    return requestJson<HistoryPageResponse>(`${BASE_URL}/history?page=${page}&size=${size}`, {
      headers: getAuthHeaders(),
    });
  },
  getDetail: (id: string) => {
    ensureApiConfigured('historyApi.getDetail');
    return requestJson<HistoryDetail>(`${BASE_URL}/history/${id}`, {
      headers: getAuthHeaders(),
    });
  },
  deleteHistory: (id: string) => {
    ensureApiConfigured('historyApi.deleteHistory');
    return requestJson<{ success?: boolean; message?: string }>(`${BASE_URL}/history/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },
  saveStoryboard: (id: string, data: StoryboardResponse) => {
    ensureApiConfigured('historyApi.saveStoryboard');
    return requestJson<StoryboardResponse>(`${BASE_URL}/history/${id}/storyboard`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  },
};

export { API_BASE_URL, BASE_URL, ApiError, getAuthHeaders };