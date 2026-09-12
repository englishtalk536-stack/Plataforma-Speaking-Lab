import useSWR from 'swr';
import type {
  ApiErrorResponse,
  CompleteQuestResponse,
  StudentDashboardResponse,
} from '../types/dashboard';

export class DashboardFetchError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'DashboardFetchError';
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new DashboardFetchError(body?.error ?? `Request failed with status ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}

const DASHBOARD_ENDPOINT = '/api/student/dashboard';

export function useDashboardData() {
  const { data, error, isLoading, mutate } = useSWR<StudentDashboardResponse>(DASHBOARD_ENDPOINT, (url: string) =>
    fetchJson<StudentDashboardResponse>(url),
  );

  return { dashboard: data, error, isLoading, mutate };
}

/** Marks a quest complete on the server, then returns the reward summary so the caller can animate it in. */
export async function completeQuest(questId: string): Promise<CompleteQuestResponse> {
  return fetchJson<CompleteQuestResponse>('/api/student/quest/complete', {
    method: 'POST',
    body: JSON.stringify({ questId }),
  });
}
