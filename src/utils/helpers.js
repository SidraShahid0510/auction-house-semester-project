/**
 * Format an ISO date string to a short, human-readable format.
 *
 * @param {string} isostring - ISO date string (e.g. "2025-12-31T12:00:00Z").
 * @returns {string} Formatted date like "31 Dec 2025", or "unknown" if invalid.
 */
export function formatDate(isostring) {
  if (!isostring) return "unknown";
  const date = new Date(isostring);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Safely get the first media URL of a listing or fall back to a default image.
 *
 * @param {Object} listing - Listing object.
 * @param {{url?: string}[]} [listing.media] - Array of media objects.
 * @returns {string} The image URL.
 */
export function getListingImage(listing) {
  if (listing.media && listing.media.length > 0 && listing.media[0].url) {
    return listing.media[0].url;
  }
  return "images/vase.jpg";
}

/**
 * Get the highest bid amount for a listing.
 *
 * @param {Object} listing - Listing object.
 * @param {{amount: number}[]} [listing.bids] - Array of bids.
 * @returns {number} Highest bid amount or 0 if there are no bids.
 */
export function getHighestBidAmount(listing) {
  if (!Array.isArray(listing.bids) || listing.bids.length === 0) {
    return 0;
  }

  return listing.bids.reduce((max, bid) => {
    const amount = typeof bid.amount === "number" ? bid.amount : 0;
    return amount > max ? amount : max;
  }, 0);
}

/**
 * Get a human-readable string for the time remaining until a given date.
 *
 * @param {string} endsAt - ISO date string when the listing ends.
 * @returns {string} A string such as "in about 5 days", "in about 3 hours",
 * or "Ended" if the date is in the past.
 */
export function getTimeRemaining(endsAt) {
  if (!endsAt) return "";

  const now = new Date();
  const end = new Date(endsAt);
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Ended";
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 1) {
    return `in about ${diffDays} day${diffDays > 1 ? "s" : ""}`;
  }

  if (diffHours >= 1) {
    return `in about ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  }

  return `in about ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
}
