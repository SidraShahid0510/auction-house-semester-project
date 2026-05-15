import { getToken, getProfile, saveAuth } from "../../utils/storage.js";
import { API_BASE, API_KEY } from "../../api/config.js";

const LISTINGS_BASE = `${API_BASE}/auction/listings`;
const PROFILE_BASE = `${API_BASE}/auction/profiles`;

/**
 * Refresh the logged-in user's profile credits from the API
 * and update local storage + nav display.
 *
 * @returns {Promise<void>}
 */
export async function refreshProfileCredits() {
  const token = getToken();
  const profile = getProfile();

  if (!token || !profile?.name) return null;

  const res = await fetch(
    `${PROFILE_BASE}/${encodeURIComponent(profile.name)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Noroff-API-Key": API_KEY,
      },
    },
  );

  if (!res.ok) return null;

  const result = await res.json();
  const updatedProfile = result.data;

  saveAuth({ accessToken: token, ...updatedProfile });

  return updatedProfile;
}
/**
 * Fetch a listing by ID (optionally authenticated to include user-specific data).
 *
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function fetchListing(id) {
  const token = getToken();

  const headers = {
    "X-Noroff-API-Key": API_KEY,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(
    `${LISTINGS_BASE}/${encodeURIComponent(id)}?_seller=true&_bids=true`,
    { headers },
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.errors?.[0]?.message ||
      data?.message ||
      `Failed to load listing (${res.status})`;

    throw new Error(message);
  }

  return data.data;
}

/**
 * Place a bid on a listing.
 *
 * @param {string} listingId
 * @param {number} amount
 * @returns {Promise<Object>} Updated listing
 */
export async function placeBid(listingId, amount) {
  const token = getToken();
  const profile = getProfile();

  if (!token || !profile) {
    throw new Error("You must be logged in to place a bid.");
  }

  const res = await fetch(
    `${LISTINGS_BASE}/${encodeURIComponent(listingId)}/bids`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Noroff-API-Key": API_KEY,
      },
      body: JSON.stringify({ amount: Number(amount) }),
    },
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.errors?.[0]?.message ||
      data?.message ||
      `Failed to place bid (${res.status})`;

    throw new Error(message);
  }

  return data.data;
}
