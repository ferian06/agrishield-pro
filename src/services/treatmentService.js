import api from './api'

export const treatmentService = {
  /** Log a treatment as applied for a given scan */
  log: (scanId, note = '') =>
    api.post('/treatments', { scanId, note }),

  /** Get the most recent treatment log for a specific scan */
  getByScan: (scanId) =>
    api.get(`/treatments/scan/${scanId}`),

  /** Get full treatment history for the current user */
  getHistory: () =>
    api.get('/treatments/history'),
}
