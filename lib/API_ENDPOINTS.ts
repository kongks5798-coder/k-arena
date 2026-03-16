const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.k-arena.gg";

export const API_ENDPOINTS = {
  // Events
  EVENTS: {
    LIST: `${BASE_URL}/events`,
    DETAIL: (id: string) => `${BASE_URL}/events/${id}`,
    FEATURED: `${BASE_URL}/events/featured`,
  },

  // Portfolio / Matches
  PORTFOLIO: {
    LIST: `${BASE_URL}/portfolio`,
    DETAIL: (id: string) => `${BASE_URL}/portfolio/${id}`,
    CATEGORIES: `${BASE_URL}/portfolio/categories`,
  },

  // Orders / Tickets
  ORDERS: {
    CREATE: `${BASE_URL}/orders`,
    LIST: `${BASE_URL}/orders`,
    DETAIL: (id: string) => `${BASE_URL}/orders/${id}`,
    CANCEL: (id: string) => `${BASE_URL}/orders/${id}/cancel`,
  },

  // Auth
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    LOGOUT: `${BASE_URL}/auth/logout`,
    ME: `${BASE_URL}/auth/me`,
  },

  // Teams / Players
  TEAMS: {
    LIST: `${BASE_URL}/teams`,
    DETAIL: (id: string) => `${BASE_URL}/teams/${id}`,
    ROSTER: (id: string) => `${BASE_URL}/teams/${id}/roster`,
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
