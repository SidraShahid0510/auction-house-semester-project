import { API_BASE, API_KEY } from "../../api/config.js";

const PROFILE_BASE = `${API_BASE}/auction/profiles`;

/**
 * Fetches profile data, listings, bids, and wins for the profile page.
 */
export async function fetchProfileWithListings(token, name) {
  const encodedName = encodeURIComponent(name);

  const headers = {
    Authorization: `Bearer ${token}`,
    "X-Noroff-API-Key": API_KEY,
  };

  const [profileRes, listingsRes, bidsRes, winsRes] = await Promise.all([
    fetch(`${PROFILE_BASE}/${encodedName}`, { headers }),
    fetch(`${PROFILE_BASE}/${encodedName}/listings?_bids=true`, { headers }),
    fetch(`${PROFILE_BASE}/${encodedName}/bids?_listings=true`, { headers }),
    fetch(`${PROFILE_BASE}/${encodedName}/wins?_bids=true`, { headers }),
  ]);

  if (!profileRes.ok) {
    throw new Error(`Failed to load profile: ${profileRes.status}`);
  }

  if (!listingsRes.ok) {
    throw new Error(`Failed to load listings: ${listingsRes.status}`);
  }

  if (!bidsRes.ok) {
    throw new Error(`Failed to load bids: ${bidsRes.status}`);
  }

  if (!winsRes.ok) {
    throw new Error(`Failed to load wins: ${winsRes.status}`);
  }

  const profileJson = await profileRes.json();
  const listingsJson = await listingsRes.json();
  const bidsJson = await bidsRes.json();
  const winsJson = await winsRes.json();

  return {
    profile: profileJson.data,
    listings: listingsJson.data,
    bids: bidsJson.data,
    wins: winsJson.data,
  };
}

/**
 * Updates the profile details on the server.
 */
export async function updateProfileOnServer(token, name, payload) {
  const res = await fetch(`${PROFILE_BASE}/${encodeURIComponent(name)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Noroff-API-Key": API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const result = await res.json();

  if (!res.ok) {
    const message =
      result?.errors?.[0]?.message ||
      `Failed to update profile (${res.status})`;

    throw new Error(message);
  }

  return result.data;
}
