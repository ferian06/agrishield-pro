import api from './api'

export const userService = {
  /** Fetch scan count, post count and memberSince for the current user */
  getStats: () => api.get('/auth/stats'),
}
