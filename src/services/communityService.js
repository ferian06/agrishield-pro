import api from './api';

/**
 * Guild Feed community service — posts, likes, sharing.
 */
export const communityService = {
  /**
   * Fetch paginated community posts.
   * @param {number} page
   * @param {number} limit
   */
  getPosts: (page = 1, limit = 20) =>
    api.get('/community/posts', { params: { page, limit } }),

  /**
   * Create a new community post (optionally with an attached scan).
   * @param {{ content, tag, scanId?, imageData? }} data
   */
  createPost: (data) =>
    api.post('/community/posts', data),

  /**
   * Toggle like on a post.
   */
  likePost: (postId) =>
    api.post(`/community/posts/${postId}/like`),

  /**
   * Get comments for a post.
   */
  getComments: (postId) =>
    api.get(`/community/posts/${postId}/comments`),

  /**
   * Add a comment to a post.
   */
  addComment: (postId, text) =>
    api.post(`/community/posts/${postId}/comments`, { text }),
};
