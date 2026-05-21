import api from './api';

/**
 * CropSense AI service — scan submission, diagnosis retrieval, feedback.
 * All functions are async and throw on failure so the caller can handle errors.
 */
export const cropService = {
  /**
   * Submit a base-64 encoded crop image for AI diagnosis.
   * @param {string} imageData  - base64 JPEG data URL from the camera
   * @param {string} cropType   - e.g. "tomato" | "corn"
   * @returns {{ scanId, disease, confidence, severity, recommendations }}
   */
  submitScan: (imageData, cropType) =>
    api.post('/scans', { image: imageData, cropType }),

  /**
   * Retrieve a previously completed diagnosis by scan ID.
   */
  getDiagnosis: (scanId) =>
    api.get(`/scans/${scanId}/diagnosis`),

  /**
   * Submit thumbs-up / thumbs-down feedback for a diagnosis.
   * @param {string|number} scanId
   * @param {'up'|'down'}   rating
   * @param {string}        [comment]
   */
  submitFeedback: (scanId, rating, comment = '') =>
    api.post(`/scans/${scanId}/feedback`, { rating, comment }),

  /**
   * Fetch the authenticated user's scan history.
   */
  getScanHistory: () =>
    api.get('/scans/history'),
};
