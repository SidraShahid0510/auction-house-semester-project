// src/features/edit-listing.js

import { getToken, getProfile } from "../utils/storage.js";
import { API_KEY } from "../api/config.js";

const API_BASE = "https://v2.api.noroff.dev";
const LISTINGS_BASE = `${API_BASE}/auction/listings`;

/**
 * @typedef {Object} ListingMedia
 * @property {string} url
 * @property {string} [alt]
 */

/**
 * @typedef {Object} ListingSeller
 * @property {string} name
 */

/**
 * @typedef {Object} Listing
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} endsAt
 * @property {ListingMedia[]} [media]
 * @property {ListingSeller} [seller]
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} name
 */

/**
 * @typedef {Object} AuthContext
 * @property {string} token
 * @property {UserProfile} profile
 */

/**
 * Ensure the user is authenticated.
 * If not, redirects to login.html.
 *
 * @returns {AuthContext | null} Auth data or null if unauthenticated.
 */
function requireAuth() {
  const token = getToken();
  const profile = getProfile();

  if (!token || !profile) {
    window.location.href = "login.html";
    return null;
  }

  return { token, profile };
}

// ---------- DOM ELEMENTS ----------
const form = document.querySelector("#editListingForm");
const titleInput = document.querySelector("#listingTitleInput");
const descriptionInput = document.querySelector("#listingDescriptionInput");
const mediaInput = document.querySelector("#mediaUrlsInput");
const saveBtn = document.querySelector("#saveListingButton");
const deleteBtn = document.querySelector("#deleteListingButton");
const endDateInput = document.querySelector("#endDateInput");
const endTimeInput = document.querySelector("#endTimeInput");

// ---------- HELPERS ----------

/**
 * Get the listing ID from the current URL query string.
 *
 * @returns {string | null} Listing ID or null if missing.
 */
function getListingIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

/**
 * Convert textarea value (URLs separated by commas or new lines)
 * into a media array for the API.
 *
 * @param {string} value - Raw textarea value.
 * @param {string} title - Listing title for alt text.
 * @returns {ListingMedia[]} Media array.
 */
function parseMediaTextarea(value, title) {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const urls = trimmed
    .split(/[\n,]+/)
    .map((u) => u.trim())
    .filter(Boolean);

  return urls.map((url, index) => ({
    url,
    alt: `${title || "Listing"} image ${index + 1}`,
  }));
}

/**
 * Convert media array into a textarea-safe string (one URL per line).
 *
 * @param {ListingMedia[] | undefined} mediaArray
 * @returns {string} Textarea string.
 */
function mediaToTextarea(mediaArray) {
  if (!Array.isArray(mediaArray) || mediaArray.length === 0) return "";
  return mediaArray.map((m) => m.url).join("\n");
}
/**
 * Build an ISO-8601 end date/time string from date and time inputs.
 *
 * @param {string} dateValue - Date string in `YYYY-MM-DD` format.
 * @param {string} timeValue - Time string in `HH:MM` format.
 * @returns {string | null} ISO-8601 datetime string or null if invalid.
 */
function buildEndsAt(dateValue, timeValue) {
  if (!dateValue) return null;

  const time = timeValue && timeValue.length ? timeValue : "00:00";
  const localDateTime = new Date(`${dateValue}T${time}`);

  if (Number.isNaN(localDateTime.getTime())) {
    return null;
  }

  return localDateTime.toISOString();
}

/**
 * Split an ISO-8601 `endsAt` value into date + time strings
 * for the form inputs.
 *
 * @param {string | undefined} endsAt
 * @returns {{ date: string; time: string }}
 */
/**
 * Split an ISO-8601 endsAt string into date + time
 * for the form inputs.
 *
 * @param {string | undefined} endsAt
 * @returns {{ date: string; time: string }}
 */
function splitEndsAtToDateTime(endsAt) {
  if (!endsAt) {
    return { date: "", time: "" };
  }

  const dt = new Date(endsAt);
  if (Number.isNaN(dt.getTime())) {
    return { date: "", time: "" };
  }

  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");

  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${min}`,
  };
}

// ---------- API CALLS ----------

/**
 * Fetch a listing by ID.
 *
 * @param {string} token - Auth token.
 * @param {string} id - Listing ID.
 * @returns {Promise<Listing>} Listing data.
 */
async function fetchListing(token, id) {
  const res = await fetch(`${LISTINGS_BASE}/${id}?_seller=true&_bids=true`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Noroff-API-Key": API_KEY,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.errors?.[0]?.message || `Failed to load listing (${res.status})`;
    throw new Error(message);
  }

  return /** @type {Listing} */ (data.data);
}

/**
 * Update an existing listing.
 *
 * @param {string} token - Auth token.
 * @param {string} id - Listing ID.
 * @param {Partial<Listing>} body - Payload to update.
 * @returns {Promise<Listing>} Updated listing.
 */
async function updateListing(token, id, body) {
  const res = await fetch(`${LISTINGS_BASE}/${id}`, {
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

  return /** @type {Listing} */ (data.data);
}

/**
 * Delete a listing.
 *
 * @param {string} token - Auth token.
 * @param {string} id - Listing ID.
 * @returns {Promise<boolean>} True if delete succeeded.
 */
async function deleteListing(token, id) {
  const res = await fetch(`${LISTINGS_BASE}/${id}`, {
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

// ---------- POPULATE FORM ----------

/**
 * Populate the edit form with listing data.
 * Redirects away if the listing does not belong to the current user.
 *
 * @param {Listing} listing
 * @param {string} currentUserName
 */
function populateForm(listing, currentUserName) {
  const { title, description, media, seller, endsAt } = listing;

  if (!seller || seller.name !== currentUserName) {
    alert("You can only edit your own listings.");
    window.location.href = "profile.html";
    return;
  }

  if (titleInput) titleInput.value = title || "";
  if (descriptionInput) descriptionInput.value = description || "";
  if (mediaInput) mediaInput.value = mediaToTextarea(media);

  const { date, time } = splitEndsAtToDateTime(endsAt);
  if (endDateInput) endDateInput.value = date;
  if (endTimeInput) endTimeInput.value = time;
}

// ---------- FORM HANDLERS ----------

/**
 * Handle the "Save Listing" form submit.
 *
 * @param {SubmitEvent} event
 * @param {AuthContext} auth
 * @param {string} listingId
 * @returns {Promise<void>}
 */
async function handleSave(event, auth, listingId) {
  event.preventDefault();

  if (
    !titleInput ||
    !descriptionInput ||
    !mediaInput ||
    !endDateInput ||
    !endTimeInput
  ) {
    alert("Form is not correctly initialized.");
    return;
  }

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const mediaValue = mediaInput.value;
  const endDateValue = endDateInput.value;
  const endTimeValue = endTimeInput.value;

  if (!title || !description) {
    alert("Title and description are required.");
    return;
  }

  if (!endDateValue || !endTimeValue) {
    alert("Please select an end date and time.");
    return;
  }

  const endsAt = buildEndsAt(endDateValue, endTimeValue);
  if (!endsAt) {
    alert("Please choose a valid end date and time.");
    return;
  }

  const now = new Date();
  const endDateObj = new Date(endsAt);
  if (endDateObj <= now) {
    alert("End date/time must be in the future.");
    return;
  }

  const media = parseMediaTextarea(mediaValue, title);

  /** @type {Partial<Listing> & { media: ListingMedia[]; endsAt: string }} */
  const payload = {
    title,
    description,
    media: media.length ? media : [],
    endsAt,
  };

  try {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
    }

    await updateListing(auth.token, listingId, payload);

    alert("Listing updated successfully!");
    window.location.href = "profile.html";
  } catch (error) {
    console.error("Update listing error:", error);
    alert(error.message || "Could not update listing.");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Listing";
    }
  }
}

/**
 * Handle the "Delete Listing" action.
 *
 * @param {AuthContext} auth
 * @param {string} listingId
 * @returns {Promise<void>}
 */
async function handleDelete(auth, listingId) {
  const confirmed = confirm(
    "Are you sure you want to delete this listing? This cannot be undone."
  );
  if (!confirmed) return;

  try {
    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.textContent = "Deleting...";
    }

    await deleteListing(auth.token, listingId);

    alert("Listing deleted successfully.");
    window.location.href = "profile.html";
  } catch (error) {
    console.error("Delete listing error:", error);
    alert(error.message || "Could not delete listing.");
  } finally {
    if (deleteBtn) {
      deleteBtn.disabled = false;
      deleteBtn.textContent = "Delete Listing";
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const auth = requireAuth();
  if (!auth) return;

  const listingId = getListingIdFromUrl();
  if (!listingId) {
    alert("No listing ID provided.");
    window.location.href = "profile.html";
    return;
  }

  try {
    const listing = await fetchListing(auth.token, listingId);
    populateForm(listing, auth.profile.name);

    if (form) {
      form.addEventListener("submit", (event) =>
        handleSave(event, auth, listingId)
      );
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => handleDelete(auth, listingId));
    }
  } catch (error) {
    console.error(error);
    alert(error.message || "Could not load listing.");
    window.location.href = "profile.html";
  }
});
