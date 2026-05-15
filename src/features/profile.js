// src/features/profile.js

import { getToken, getProfile, saveAuth } from "../utils/storage.js";

import {
  updateProfileHeader,
  renderProfileListings,
  renderProfileBids,
  renderProfileWins,
} from "./profile/profileRender.js";

import { fetchProfileWithListings } from "./profile/profileApi.js";

import {
  setupEditHandlers,
  setCurrentProfileData,
} from "./profile/profileEdit.js";

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
const listingsGrid = document.querySelector("#profile-listings-grid");
const activityTabs = document.querySelectorAll("[data-profile-tab]");
const activityPanels = document.querySelectorAll("[data-profile-panel]");

// ---------- UI HELPERS ----------

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

/**
 * Update the profile on the server with the given payload.
 *
 * @param {string} token - Access token for authorization.
 * @param {string} name - Profile name/handle.
 * @param {Partial<UserProfile>} payload - Fields to update (e.g. bio, avatar, banner).
 * @returns {Promise<UserProfile>} The updated profile data.
 */

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
      auth.profile.name,
    );

    // Save fresh profile (with updated credits) to localStorage
    saveAuth({ accessToken: auth.token, ...profile });
    window.dispatchEvent(new Event("auth:updated"));
    updateProfileHeader(profile);
    setCurrentProfileData(profile);
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
