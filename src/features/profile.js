// src/features/profile.js

import { getToken, getProfile, saveAuth } from "../utils/storage.js";
import { API_BASE, API_KEY } from "../api/config.js";
import {
  formatDate,
  getListingImage,
  getTimeRemaining,
  getHighestBidAmount,
} from "../utils/helpers.js";

const PROFILE_BASE = `${API_BASE}/auction/profiles`;

/**
 * @typedef {Object} ProfileMedia
 * @property {string} [url]
 * @property {string} [alt]
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} name
 * @property {string} email
 * @property {string} [bio]
 * @property {ProfileMedia} [avatar]
 * @property {ProfileMedia} [banner]
 * @property {number} credits
 */

/**
 * @typedef {Object} ListingCount
 * @property {number} bids
 */

/**
 * @typedef {Object} ListingMedia
 * @property {string} url
 * @property {string} [alt]
 */

/**
 * @typedef {Object} Listing
 * @property {string} id
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [endsAt]
 * @property {ListingMedia[]} [media]
 * @property {ListingCount} [_count]
 * @property {{ amount: number }[]} [bids]
 */

/**
 * @typedef {Object} AuthContext
 * @property {string} token
 * @property {UserProfile} profile
 */

/**
 * Update the page title with the logged-in user's name.
 *
 * @param {UserProfile} profile
 */
function updatePageTitleWithUser(profile) {
  if (!profile || !profile.name) return;
  document.title = `${profile.name} - Auction House`;
}

/**
 * Ensure the user is authenticated.
 * If there is no token or profile in storage, redirects to index.html.
 *
 * @returns {AuthContext | null}
 *   Auth object containing the token and profile, or null if unauthenticated.
 */
function requireAuth() {
  const token = getToken();
  const profile = /** @type {UserProfile | null} */ (getProfile());

  if (!token || !profile) {
    window.location.href = "index.html";
    return null;
  }

  return { token, profile };
}

// ---------- DOM ELEMENTS ----------

const bannerEl = document.querySelector(".profile-banner");
const avatarImgEl = document.querySelector(".profile-avatar img");
const usernameEl = document.querySelector(".profile-username");
const emailEl = document.querySelector(".profile-email");
const bioTextEl = document.querySelector(".bio-text");
const creditsHeaderEl = document.querySelector(".profile-credits-value");
const navCreditsEl = document.querySelector("#nav-credits-value");
const editSection = document.querySelector(".profile-edit");
const editBtn = document.querySelector(".profile-edit-btn");
const cancelBtn = document.querySelector(".cancel-btn");
const editForm = document.querySelector("#profile-edit-form");
const avatarInput = document.querySelector("#avatar-url");
const bannerInput = document.querySelector("#banner-url");
const bioInput = document.querySelector("#bio");
const listingsGrid = document.querySelector("#profile-listings-grid");
const bidsGrid = document.querySelector("#profile-bids-grid");
const winsGrid = document.querySelector("#profile-wins-grid");
const activityTabs = document.querySelectorAll("[data-profile-tab]");
const activityPanels = document.querySelectorAll("[data-profile-panel]");

/**
 * Holds the most recently fetched profile data used to populate the page
 * and prefill the edit form.
 * @type {UserProfile | null}
 */
let currentProfileData = null;

// Hide edit section by default
if (editSection) {
  editSection.style.display = "none";
}

// ---------- UI HELPERS ----------

/**
 * Set or clear the banner image.
 *
 * @param {string} [url] - The banner image URL. If falsy, clears the image.
 */
function setBanner(url) {
  if (!bannerEl) return;

  if (url) {
    bannerEl.style.backgroundImage = `url(${url})`;
    bannerEl.classList.add("profile-banner--has-image");
  } else {
    bannerEl.style.backgroundImage = "";
    bannerEl.classList.remove("profile-banner--has-image");
  }
}
/**
 * Show a specific activity panel by key ("listings" | "bids" | "wins").
 * Handles display + animation.
 * @param {string} key
 */
function showActivityPanel(key) {
  activityPanels.forEach((panel) => {
    const panelKey = panel.getAttribute("data-profile-panel");

    if (panelKey === key) {
      panel.style.display = "block";
      panel.offsetHeight;

      panel.classList.add("is-active");
    } else {
      panel.classList.remove("is-active");
      panel.style.display = "none";
    }
  });
}

/**
 * Wire up the "My listings / My bids / Wins" tab buttons.
 * Uses data-profile-tab and data-profile-panel attributes.
 */
function setupActivityTabs() {
  if (!activityTabs.length || !activityPanels.length) return;

  activityTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-profile-tab");
      if (!target) return;
      activityTabs.forEach((btn) => {
        btn.classList.toggle("is-active", btn === tab);
      });
      showActivityPanel(target);
    });
  });

  showActivityPanel("listings");
}

/**
 *
 * Set or clear the avatar image.
 *
 * @param {string} [url] - The avatar image URL. If falsy, uses a default image.
 */
function setAvatar(url) {
  if (!avatarImgEl) return;

  if (url) {
    avatarImgEl.src = url;
  } else {
    avatarImgEl.src = "images/default-img.png";
  }
}

/**
 * Update all profile header UI elements with the given profile data.
 *
 * Also keeps {@link currentProfileData} in sync and pre-fills the edit form.
 *
 * @param {UserProfile} profile - The profile data returned from the API.
 */
function updateProfileHeader(profile) {
  if (!profile) return;

  currentProfileData = profile;

  const { name, email, bio, avatar, banner, credits } = profile;

  if (usernameEl) usernameEl.textContent = name || "Unknown user";
  if (emailEl) emailEl.textContent = email || "";
  if (bioTextEl) {
    const cleanBio = bio && bio.trim();
    bioTextEl.textContent = cleanBio || "No bio yet";
  }

  setAvatar(avatar?.url);
  setBanner(banner?.url);

  if (typeof credits === "number") {
    if (creditsHeaderEl) creditsHeaderEl.textContent = String(credits);
    if (navCreditsEl) navCreditsEl.textContent = String(credits);
  }

  // Prefill edit form fields with latest values
  if (avatarInput) avatarInput.value = avatar?.url || "";
  if (bannerInput) bannerInput.value = banner?.url || "";
  if (bioInput) bioInput.value = bio || "";
}

/**
 * Attach click handlers for the pencil icon on each listing card.
 * Clicking a pencil navigates to edit.html with the relevant listing ID.
 */
function attachEditButtons() {
  const editButtons = document.querySelectorAll("[data-edit-listing]");

  editButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const listingId = btn.getAttribute("data-listing-id");
      if (!listingId) return;

      window.location.href = `edit.html?id=${listingId}`;
    });
  });
}

/**
 * Render the user's listings in the "My Listings" grid.
 *
 * @param {Listing[]} listings - Array of listing objects belonging to the user.
 */
function renderProfileListings(listings) {
  if (!listingsGrid) return;

  listingsGrid.innerHTML = "";

  if (!Array.isArray(listings) || listings.length === 0) {
    const col = document.createElement("div");
    col.className = "col-12";
    col.innerHTML = `
      <p class="profile-no-listings">No listings yet.</p>
    `;
    listingsGrid.appendChild(col);
    return;
  }

  listings.forEach((listing) => {
    const { id, title, description, endsAt, _count, bids, media } = listing;

    const bidsCount = _count?.bids ?? (Array.isArray(bids) ? bids.length : 0);

    const imageUrl = getListingImage({ media });
    const endsDate = formatDate(endsAt);
    const timeRemaining = getTimeRemaining(endsAt);
    const highestBid = getHighestBidAmount(listing);

    const shortDescription =
      description && description.length > 130
        ? description.slice(0, 127) + "..."
        : description || "No description provided.";

    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4 profile-listings-col";

    col.innerHTML = `
      <article class="profile-listing-card" data-listing-id="${id}">
        <div class="image-wrapper">
          <img
            src="${imageUrl}"
            class="listing-card-img"
            alt="${title || "Listing image"}"
          />
        </div>

        <div class="listing-card-body">
          <div class="listing-card-header">
            <h2 class="listing-card-title">${title || "Untitled listing"}</h2>
            <button
              type="button"
              class="edit-icon-btn"
              aria-label="Edit listing"
              data-edit-listing
              data-listing-id="${id}"
            >
              <i class="fa fa-pencil edit-icon" aria-hidden="true"></i>
            </button>
          </div>

          <div class="listing-card-description">
            ${shortDescription}
          </div>

          <div class="listing-footer">
            <div class="listing-meta">
              <p class="listing-end-date">Ends: ${endsDate}</p>
              <p class="listing-end-time">${timeRemaining}</p>
            </div>
            <div class="bids-counts">
              ${bidsCount} bid${
      bidsCount === 1 ? "" : "s"
    } · ${highestBid} credits
            </div>
          </div>

          <div class="listing-card-btn">
            <a href="listing-detail.html?id=${id}">View Details</a>
          </div>
        </div>
      </article>
    `;

    listingsGrid.appendChild(col);
  });

  attachEditButtons();
}
/**
 * Render all bids placed by the user.
 * Expects /profiles/<name>/bids?_listings=true
 *
 * @param {Array<any>} bids
 */
function renderProfileBids(bids) {
  if (!bidsGrid) return;

  bidsGrid.innerHTML = "";

  if (!Array.isArray(bids) || bids.length === 0) {
    const col = document.createElement("div");
    col.className = "col-12";
    col.innerHTML =
      '<p class="profile-no-listings">You haven\'t placed any bids yet.</p>';
    bidsGrid.appendChild(col);
    return;
  }

  bids.forEach((bid) => {
    const listing = bid.listing;
    if (!listing) return;

    const { id, title, description, endsAt, media, _count } = listing;

    // number of bids on this listing
    let bidsCount = 0;
    if (Array.isArray(listing.bids)) {
      bidsCount = listing.bids.length;
    } else if (typeof _count?.bids === "number") {
      bidsCount = _count.bids;
    } else {
      bidsCount = 1;
    }

    // highest bid amount on this listing
    let highestBid = getHighestBidAmount(listing);
    if (!highestBid || highestBid < bid.amount) {
      highestBid = bid.amount;
    }

    const imageUrl = getListingImage({ media });
    const endsDate = formatDate(endsAt);
    const timeRemaining = getTimeRemaining(endsAt);

    const shortDescription =
      description && description.length > 130
        ? description.slice(0, 127) + "..."
        : description || "No description provided.";

    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4 profile-listings-col";

    col.innerHTML = `
      <article class="profile-listing-card" data-listing-id="${id}">
        <div class="image-wrapper">
          <img
            src="${imageUrl}"
            class="listing-card-img"
            alt="${title || "Listing image"}"
          />
        </div>

        <div class="listing-card-body">
          <div class="listing-card-header">
            <h2 class="listing-card-title">${title || "Untitled listing"}</h2>
          </div>

          <div class="listing-card-description">
            ${shortDescription}
          </div>

          <div class="listing-footer">
            <div class="listing-meta">
              <p class="listing-end-date">Ends: ${endsDate}</p>
              <p class="listing-end-time">${timeRemaining}</p>
            </div>
            <div class="bids-counts">
              ${bidsCount} bid${bidsCount === 1 ? "" : "s"} ·
              ${highestBid} credits
            </div>
          </div>

          <div class="listing-card-btn">
            <a href="listing-detail.html?id=${id}">View Details</a>
          </div>

          <p class="profile-bid-amount">
            Your bid: <strong>${bid.amount}</strong> credits
          </p>
        </div>
      </article>
    `;

    bidsGrid.appendChild(col);
  });
}

function renderProfileWins(wins) {
  if (!winsGrid) return;

  winsGrid.innerHTML = "";

  if (!Array.isArray(wins) || wins.length === 0) {
    const col = document.createElement("div");
    col.className = "col-12";
    col.innerHTML =
      '<p class="profile-no-listings">No wins yet. Keep bidding!</p>';
    winsGrid.appendChild(col);
    return;
  }

  wins.forEach((listing) => {
    const { id, title, description, endsAt, _count, bids, media } = listing;

    const bidsCount = _count?.bids ?? (Array.isArray(bids) ? bids.length : 0);

    let highestBid = getHighestBidAmount(listing);
    if (!highestBid && Array.isArray(bids) && bids.length) {
      highestBid = bids[bids.length - 1].amount;
    }

    const imageUrl = getListingImage({ media });
    const endsDate = formatDate(endsAt);
    const timeRemaining = getTimeRemaining(endsAt);

    const shortDescription =
      description && description.length > 130
        ? description.slice(0, 127) + "..."
        : description || "No description provided.";

    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4 profile-listings-col";

    col.innerHTML = `
      <article class="profile-listing-card" data-listing-id="${id}">
        <div class="image-wrapper">
          <img
            src="${imageUrl}"
            class="listing-card-img"
            alt="${title || "Listing image"}"
          />
        </div>

        <div class="listing-card-body">
          <div class="listing-card-header">
            <h2 class="listing-card-title">${title || "Untitled listing"}</h2>
          </div>

          <div class="listing-card-description">
            ${shortDescription}
          </div>

          <div class="listing-footer">
            <div class="listing-meta">
              <p class="listing-end-date">Ended: ${endsDate}</p>
              <p class="listing-end-time">${timeRemaining}</p>
            </div>
            <div class="bids-counts">
              ${bidsCount} bid${bidsCount === 1 ? "" : "s"} ·
              ${highestBid || 0} credits
            </div>
          </div>

          <div class="listing-card-btn">
            <a href="listing-detail.html?id=${id}">View Details</a>
          </div>

          <p class="profile-bid-amount">
            You won this listing 🎉
          </p>
        </div>
      </article>
    `;

    winsGrid.appendChild(col);
  });
}

// ---------- API CALLS ----------

/**
 * Fetch the profile and its listings, bids and wins from the server.
 *
 * - listings: all listings created by the user
 * - bids: all bids the user has placed (with associated listing via `_listings`)
 * - wins: all listings the user has won
 *
 * @param {string} token
 * @param {string} name
 * @returns {Promise<{
 *   profile: UserProfile;
 *   listings: Listing[];
 *   bids: any[];
 *   wins: Listing[];
 * }>}
 */
async function fetchProfileWithListings(token, name) {
  const encodedName = encodeURIComponent(name);

  const headers = {
    Authorization: `Bearer ${token}`,
    "X-Noroff-API-Key": API_KEY,
  };

  const profileResPromise = fetch(`${PROFILE_BASE}/${encodedName}`, {
    headers,
  });

  const listingsResPromise = fetch(
    `${PROFILE_BASE}/${encodedName}/listings?_bids=true`,
    { headers }
  );

  const bidsResPromise = fetch(
    `${PROFILE_BASE}/${encodedName}/bids?_listings=true`,
    { headers }
  );

  const winsResPromise = fetch(
    `${PROFILE_BASE}/${encodedName}/wins?_bids=true`,
    { headers }
  );

  const [profileRes, listingsRes, bidsRes, winsRes] = await Promise.all([
    profileResPromise,
    listingsResPromise,
    bidsResPromise,
    winsResPromise,
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
    profile: /** @type {UserProfile} */ (profileJson.data),
    listings: /** @type {Listing[]} */ (listingsJson.data),
    bids: /** @type {any[]} */ (bidsJson.data),
    wins: /** @type {Listing[]} */ (winsJson.data),
  };
}

/**
 * Update the profile on the server with the given payload.
 *
 * @param {string} token - Access token for authorization.
 * @param {string} name - Profile name/handle.
 * @param {Partial<UserProfile>} payload - Fields to update (e.g. bio, avatar, banner).
 * @returns {Promise<UserProfile>} The updated profile data.
 */
async function updateProfileOnServer(token, name, payload) {
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

  return /** @type {UserProfile} */ (result.data);
}

// ---------- EDIT PROFILE TOGGLING ----------

/**
 * Show the profile edit section and sync the form fields
 * with the latest profile data.
 */
function showEditSection() {
  if (!editSection || !currentProfileData) return;

  editSection.style.display = "block";

  const { avatar, banner, bio } = currentProfileData;
  if (avatarInput) avatarInput.value = avatar?.url || "";
  if (bannerInput) bannerInput.value = banner?.url || "";
  if (bioInput) bioInput.value = bio || "";
}

/**
 * Hide the profile edit section.
 */
function hideEditSection() {
  if (!editSection) return;
  editSection.style.display = "none";
}

// ---------- FORM HANDLERS ----------

/**
 * Wire up all event listeners related to editing the profile
 * (show/hide edit section, submit form).
 *
 * @param {AuthContext} auth - Current auth info.
 */
function setupEditHandlers(auth) {
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      showEditSection();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      hideEditSection();
    });
  }

  if (editForm) {
    editForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!auth) return;

      const avatarUrl = avatarInput?.value.trim();
      const bannerUrl = bannerInput?.value.trim();
      const bioValue = bioInput?.value.trim() || "";

      /** @type {Partial<UserProfile> & { avatar?: ProfileMedia; banner?: ProfileMedia }} */
      const body = {
        bio: bioValue,
      };

      if (avatarUrl) {
        body.avatar = {
          url: avatarUrl,
          alt: `${auth.profile.name}'s avatar`,
        };
      }

      if (bannerUrl) {
        body.banner = {
          url: bannerUrl,
          alt: `${auth.profile.name}'s banner`,
        };
      }

      try {
        const updated = await updateProfileOnServer(
          auth.token,
          auth.profile.name,
          body
        );

        saveAuth({ accessToken: auth.token, ...updated });
        window.dispatchEvent(new Event("auth:updated"));

        updateProfileHeader(updated);
        hideEditSection();

        alert("Profile updated successfully!");
      } catch (error) {
        console.error("Profile update failed:", error);
        alert(
          error instanceof Error ? error.message : "Could not update profile."
        );
      }
    });
  }
}

/**
 * Initialize the profile page once the DOM is ready.
 *
 * - Requires authentication
 * - Fetches fresh profile + listings (including bids)
 * - Updates header and listings UI
 * - Sets up edit/profile handlers
 */
document.addEventListener("DOMContentLoaded", async () => {
  const auth = requireAuth();
  if (!auth) return;

  try {
    const { profile, listings, bids, wins } = await fetchProfileWithListings(
      auth.token,
      auth.profile.name
    );

    // Save fresh profile (with updated credits) to localStorage
    saveAuth({ accessToken: auth.token, ...profile });
    window.dispatchEvent(new Event("auth:updated"));
    updateProfileHeader(profile);
    renderProfileListings(listings || []);
    renderProfileBids(bids || []);
    renderProfileWins(wins || []);

    updatePageTitleWithUser(profile);
    setupEditHandlers({ token: auth.token, profile });
    setupActivityTabs();
  } catch (error) {
    console.error(error);
    if (listingsGrid) {
      listingsGrid.innerHTML = `
        <div class="col-12">
          <p class="profile-error">Could not load profile data.</p>
        </div>
      `;
    }
  }
});
