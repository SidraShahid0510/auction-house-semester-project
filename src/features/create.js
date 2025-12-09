import { getToken, getProfile } from "../utils/storage.js";
import { API_KEY } from "../api/config.js";

const API_BASE = "https://v2.api.noroff.dev";
const CREATE_LISTING_URL = `${API_BASE}/auction/listings`;

/**
 * Ensure the user is authenticated.
 * If not authenticated, redirects to the login page.
 *
 * @returns {{ token: string; profile: object } | null} Auth object or null if unauthenticated.
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

const form = document.querySelector("#createListingForm");
const titleInput = document.querySelector("#listingTitleInput");
const descriptionInput = document.querySelector("#listingDescriptionInput");
const mediaInput = document.querySelector("#mediaUrlsInput");
const endDateInput = document.querySelector("#endDateInput");
const endTimeInput = document.querySelector("#endTimeInput");
const submitBtn = document.querySelector("#createListingButton");

/**
 * Parse a string of URLs (separated by commas or new lines) into a media array.
 *
 * @param {string} value - Raw user input containing one or more URLs.
 * @param {string} title - Listing title used to build alt text.
 * @returns {{ url: string; alt: string }[]} Parsed media array.
 */
function parseMedia(value, title) {
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
 * Handle the create listing form submission.
 *
 * @param {SubmitEvent} event - Form submit event.
 * @returns {Promise<void>}
 */
async function handleCreateListing(event) {
  event.preventDefault();

  const auth = requireAuth();
  if (!auth) return;

  if (
    !titleInput ||
    !descriptionInput ||
    !endDateInput ||
    !endTimeInput ||
    !mediaInput
  ) {
    alert("Form is not correctly initialized.");
    return;
  }

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const mediaValue = mediaInput.value;
  const endDateValue = endDateInput.value;
  const endTimeValue = endTimeInput.value;

  if (!title || !description || !endDateValue || !endTimeValue) {
    alert("Please fill in all required fields.");
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

  const media = parseMedia(mediaValue, title);

  /** @type {{ title: string; description: string; endsAt: string; media?: { url: string; alt: string }[] }} */
  const payload = {
    title,
    description,
    endsAt,
  };

  if (media.length) {
    payload.media = media;
  }

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`,
      "X-Noroff-API-Key": API_KEY,
    },
    body: JSON.stringify(payload),
  };

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating...";
    }

    const res = await fetch(CREATE_LISTING_URL, options);
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        json?.errors?.[0]?.message ||
        json?.message ||
        `Failed to create listing (${res.status})`;
      throw new Error(message);
    }

    alert("Listing created successfully!");
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Create listing error:", error);
    alert(error.message || "Something went wrong while creating the listing.");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Create Listing";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const auth = requireAuth();
  if (!auth) return;

  if (form) {
    form.addEventListener("submit", handleCreateListing);
  }
});
