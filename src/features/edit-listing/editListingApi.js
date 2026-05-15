import { API_BASE, API_KEY } from "../../api/config.js";

const LISTINGS_BASE = `${API_BASE}/auction/listings`;

/**
 * Fetch a listing by ID.
 *
 * @param {string} token - Auth token.
 * @param {string} id - Listing ID.
 * @returns {Promise<Listing>} Listing data.
 */
export async function fetchListing(token, id) {
  const res = await fetch(
    `${LISTINGS_BASE}/${encodeURIComponent(id)}?_seller=true&_bids=true`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Noroff-API-Key": API_KEY,
      },
    },
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.errors?.[0]?.message || `Failed to load listing (${res.status})`;
    throw new Error(message);
  }

  return data.data;
}
/**
 * Update an existing listing.
 *
 * @param {string} token - Auth token.
 * @param {string} id - Listing ID.
 * @param {Partial<Listing>} body - Payload to update.
 * @returns {Promise<Listing>} Updated listing.
 */
export async function updateListing(token, id, body) {
  const res = await fetch(`${LISTINGS_BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Noroff-API-Key": API_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.errors?.[0]?.message || `Failed to update listing (${res.status})`;
    throw new Error(message);
  }

  return data.data;
}

/**
 * Delete a listing.
 *
 * @param {string} token - Auth token.
 * @param {string} id - Listing ID.
 * @returns {Promise<boolean>} True if delete succeeded.
 */
export async function deleteListing(token, id) {
  const res = await fetch(`${LISTINGS_BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Noroff-API-Key": API_KEY,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      data?.errors?.[0]?.message || `Failed to delete listing (${res.status})`;
    throw new Error(message);
  }

  return true;
}
