export const API_BASE = import.meta.env.VITE_API_URL || '';

async function fetchJson(url: string, options?: RequestInit) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

export const api = {
  // Visitor session
  startVisitorSession: (username: string, password: string) =>
    fetchJson(`${API_BASE}/api/users/start`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getVisitorSession: () =>
    fetchJson(`${API_BASE}/api/users/me`),

  logoutVisitorSession: () =>
    fetchJson(`${API_BASE}/api/users/logout`, { method: 'POST' }),

  // Messages (public)
  sendMessage: (content: string) =>
    fetchJson(`${API_BASE}/api/messages/send`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  getMyReplies: (password: string) =>
    fetchJson(`${API_BASE}/api/messages/replies`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  // Admin (protected)
  adminLogin: (password: string) =>
    fetchJson(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  adminVerify: () =>
    fetchJson(`${API_BASE}/api/admin/verify`),

  adminLogout: () =>
    fetchJson(`${API_BASE}/api/admin/logout`, { method: 'POST' }),

  adminGetMessages: () =>
    fetchJson(`${API_BASE}/api/admin/messages`),

  adminGetStats: () =>
    fetchJson(`${API_BASE}/api/admin/stats`),

  adminReply: (id: string, reply: string) =>
    fetchJson(`${API_BASE}/api/admin/reply/${id}`, {
      method: 'POST',
      body: JSON.stringify({ reply }),
    }),

  getVapidPublicKey: async () => {
    return fetchJson(`${API_BASE}/api/notifications/vapid-public-key`);
  },

  subscribePush: async (subscription: PushSubscription) => {
    return fetchJson(`${API_BASE}/api/notifications/subscribe`, {
      method: 'POST',
      body: JSON.stringify(subscription),
    });
  },
};
