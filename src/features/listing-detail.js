// src/features/listing-detail.js

import { renderListing } from "./listing-detail/listingRender.js";
import { fetchListing } from "./listing-detail/listingApi.js";

import {
  setupBidHandlers,
  setCurrentListing,
  updateBidFormState,
} from "./listing-detail/listingBid.js";

/**
 * Get the listing ID from the URL query string.
 *
 * @returns {string | null} Listing ID or null if missing.
 */
function getListingIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

document.addEventListener("DOMContentLoaded", async () => {
  const listingId = getListingIdFromUrl();

  if (!listingId) {
    alert("No listing ID provided.");
    window.location.href = "dashboard.html";
    return;
  }

  setupBidHandlers();

  try {
    const listing = await fetchListing(listingId);

    setCurrentListing(listing);
    renderListing(listing);
    updateBidFormState();
  } catch (error) {
    console.error(error);

    alert(
      error instanceof Error
        ? error.message
        : "Could not load listing details.",
    );

    window.location.href = "dashboard.html";
  }
});

window.addEventListener("pageshow", async (event) => {
  if (!event.persisted) return;

  const listingId = getListingIdFromUrl();
  if (!listingId) return;

  try {
    const listing = await fetchListing(listingId);

    setCurrentListing(listing);
    renderListing(listing);
    updateBidFormState();
  } catch (error) {
    console.error("Error refreshing listing on pageshow:", error);
  }
});
