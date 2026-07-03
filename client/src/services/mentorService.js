import api from './api';

/**
 * Mentor Service — wraps all mentor-related API calls.
 * Designed to be future-ready for vector embedding / Pinecone upgrades.
 */

// ─── Mentor Recommendation ───────────────────────────────────────────────────

/**
 * Ask Gemini AI to recommend mentors based on a natural language query.
 * @param {string} query - User's natural language request
 * @param {string[]} interests - Optional known user interests for richer context
 * @returns {{ recommendations: Array, query: string }}
 */
export async function recommendMentors(query, interests = []) {
  const { data } = await api.post('/ai/recommend-mentors', { query, userInterests: interests });
  return data;
}

// ─── Mentor CRUD ─────────────────────────────────────────────────────────────

/**
 * Fetch paginated mentor list with optional filters.
 * @param {{ page?: number, limit?: number, tag?: string, skill?: string, category?: string }}
 */
export async function getMentors({ page = 1, limit = 12, tag, skill, category } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (tag) params.append('tag', tag);
  if (skill) params.append('skill', skill);
  if (category) params.append('category', category);
  const { data } = await api.get(`/mentors?${params.toString()}`);
  return data;
}

/**
 * Create a new mentor profile.
 * @param {object} mentorData
 */
export async function createMentor(mentorData) {
  const { data } = await api.post('/mentors', mentorData);
  return data;
}

/**
 * Toggle follow/unfollow a mentor.
 * @param {string} mentorId
 * @returns {{ following: boolean, followerCount: number }}
 */
export async function followMentor(mentorId) {
  const { data } = await api.post(`/mentors/${mentorId}/follow`);
  return data;
}

// ─── User Interests ──────────────────────────────────────────────────────────

/**
 * Fetch the current user's stored art interests.
 */
export async function getUserInterests() {
  const { data } = await api.get('/ai/user-interests');
  return data;
}

/**
 * Update the current user's art interest profile.
 * @param {{ interests?: string[], favoriteTags?: string[], learningGoals?: string[] }}
 */
export async function updateUserInterests(payload) {
  const { data } = await api.post('/ai/user-interests', payload);
  return data;
}
