import { auth } from './firebase';
import { API_BASE_URL } from '../constants/config';

// ── Token helper ──────────────────────────────────────────────────────────────

const getToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    console.error('[API] getToken failed: No user logged in to Firebase');
    throw new Error('Not authenticated');
  }
  console.log('[API] Retrieving Firebase ID token...');
  const token = await user.getIdToken();
  console.log('[API] Token retrieved successfully');
  return token;
};

const authHeaders = async () => {
  console.log('[API] Preparing auth headers...');
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// ── Generic fetch wrapper ─────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  console.log(`[API] Fetching: ${path}`, options.method || 'GET');
  const headers = await authHeaders();
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    console.log(`[API] Response from ${path}:`, res.status);
    if (!res.ok) {
      const body = await res.text();
      console.error(`[API] Error body from ${path}:`, body);
      throw new Error(body || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  } catch (err) {
    console.error(`[API] Network/Fetch Error for ${path}:`, err);
    throw err;
  }
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface ApiUser {
  uid: string;
  email: string;
  display_name: string;
  xp: number;
  level: number;
}

export const apiGetUser = (): Promise<ApiUser> =>
  apiFetch<ApiUser>('/api/users/me');

export const apiCreateUser = (display_name: string): Promise<ApiUser> =>
  apiFetch<ApiUser>('/api/users', {
    method: 'POST',
    body: JSON.stringify({ display_name }),
  });

export const apiUpdateUserXp = (xp: number, level: number): Promise<ApiUser> =>
  apiFetch<ApiUser>('/api/users/xp', {
    method: 'PUT',
    body: JSON.stringify({ xp, level }),
  });

export const apiLogout = (): Promise<{ message: string }> =>
  apiFetch<{ message: string }>('/api/users/logout', { method: 'POST' });

// ── Tasks ─────────────────────────────────────────────────────────────────────

export interface ApiTask {
  id: number;
  user_uid: string;
  title: string;
  xp_reward: number;
  priority: 'EASY' | 'MEDIUM' | 'HARD';
  status: string;
  progress: string;
  created_at: string;
}

export const apiFetchTasks = (): Promise<ApiTask[]> =>
  apiFetch<ApiTask[]>('/api/tasks');

export const apiCreateTask = (
  title: string,
  xp_reward: number,
  priority: 'EASY' | 'MEDIUM' | 'HARD'
): Promise<ApiTask> =>
  apiFetch<ApiTask>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title, xp_reward, priority }),
  });

export const apiUpdateTask = (id: number, status: string): Promise<ApiTask> =>
  apiFetch<ApiTask>(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

export const apiDeleteTask = (id: number): Promise<{ message: string }> =>
  apiFetch<{ message: string }>(`/api/tasks/${id}`, { method: 'DELETE' });

// ── XP Logs ───────────────────────────────────────────────────────────────────

export const apiAddXpLog = (task_id: number, xp_earned: number) =>
  apiFetch('/api/xp_logs', {
    method: 'POST',
    body: JSON.stringify({ task_id, xp_earned }),
  });
