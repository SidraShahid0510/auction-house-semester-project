// src/features/edit-listing.js

import { getToken, getProfile } from "../utils/storage.js";

import { fetchListing } from "./edit-listing/editListingApi.js";

import { getListingIdFromUrl } from "./edit-listing/editListingHelpers.js";

import {
  populateForm,
  setupEditListingForm,
} from "./edit-listing/editListingForm.js";
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

    setupEditListingForm(auth, listingId);
  } catch (error) {
    console.error(error);
    alert(error.message || "Could not load listing.");
    window.location.href = "profile.html";
  }
});
