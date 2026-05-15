/**
 * Get the listing ID from the current URL query string.
 *
 * @returns {string | null} Listing ID or null if missing.
 */
export function getListingIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}
