const TOKEN_KEY = "ah_token";
const PROFILE_KEY = "ah_profile";

/**
 * Save authentication data to localStorage.
 *
 * @param {{ accessToken?: string }} data
 */
export function saveAuth(data) {
  const { accessToken, ...profile } = data;
  if (accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
  }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

/**
 * Get the stored access token (if any).
 *
 * @returns {string|null}
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get the stored profile object.
 *
 * @returns {Object|null}
 */
export function getProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clear all authentication-related data from localStorage.
 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
}
