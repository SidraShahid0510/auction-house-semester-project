// src/features/listing-detail.js

import { getToken, getProfile, saveAuth } from "../utils/storage.js";
import { API_BASE, API_KEY } from "../api/config.js";
import {
  formatDate,
  getListingImage,
  getHighestBidAmount,
} from "../utils/helpers.js";

const LISTINGS_BASE = `${API_BASE}/auction/listings`;
const PROFILE_BASE = `${API_BASE}/auction/profiles`;

// ---------- DOM ELEMENTS ----------

const imageEl = document.querySelector("#listingImage");
const titleEl = document.querySelector("#listingTitle");
const descriptionEl = document.querySelector("#listingDescription");
const sellerEl = document.querySelector("#listingSeller");
const totalBidsEl = document.querySelector("#listingTotalBids");
const highestBidEl = document.querySelector("#listingHighestBid");
const endsAtEl = document.querySelector("#listingEndsAt");
const bidForm = document.querySelector("#placeBidForm");
const bidAmountInput = document.querySelector("#bidAmountInput");
const placeBidButton = document.querySelector("#placeBidButton");
const bidHistoryList = document.querySelector("#bidHistoryList");
const navCreditsEl = document.querySelector("#nav-credits-value");

let currentListing = null;
let currentUser = null;
let accessToken = null;

// ---------- HELPERS ----------

/**
 * Get the listing ID from the URL query string.
 *
 * @returns {string | null} Listing ID or null if missing.
 */
function getListingIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

/**
 * Update the nav credits display.
 *
 * @param {number} credits
 */
function updateNavCredits(credits) {
  if (navCreditsEl && typeof credits === "number") {
    navCreditsEl.textContent = String(credits);
  }
}

/**
 * Refresh the logged-in user's profile credits from the API
 * and update local storage + nav display.
 *
 * @returns {Promise<void>}
 */
async function refreshProfileCredits() {
  const token = getToken();
  const profile = /** @type {{ name?: string } | null} */ (getProfile());

  if (!token || !profile?.name) return;

  try {
    const res = await fetch(
      `${PROFILE_BASE}/${encodeURIComponent(profile.name)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Noroff-API-Key": API_KEY,
        },
      }
    );

    if (!res.ok) return;

    const result = await res.json();
    const updatedProfile = result.data;

    saveAuth({ accessToken: token, ...updatedProfile });
    updateNavCredits(updatedProfile.credits);
  } catch (error) {
    console.error("Error refreshing profile credits:", error);
  }
}

/**
 * Format an ISO date string as "Date, HH:MM".
 *
 * @param {string | undefined} isoString
 * @returns {string}
 */
function formatEndsAt(isoString) {
  if (!isoString) return "Unknown";

  const date = new Date(isoString);
  const datePart = formatDate(isoString);
  const timePart = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${datePart}, ${timePart}`;
}

// ---------- RENDERING ----------

/**
 * Render the bid history list.
 *
 * @param {Object} listing
 */
function renderBidHistory(listing) {
  if (!bidHistoryList) return;

  bidHistoryList.innerHTML = "";

  const bids = Array.isArray(listing.bids) ? listing.bids : [];

  if (bids.length === 0) {
    bidHistoryList.innerHTML = `
      <p class="no-bids">No bids yet.</p>
    `;
    return;
  }

  const sortedBids = [...bids].sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
  );

  sortedBids.forEach((bid) => {
    const row = document.createElement("div");
    row.className = "bid-row";

    const bidderName =
      (bid.bidder && bid.bidder.name) || bid.bidderName || "Unknown bidder";

    const created = bid.created ? new Date(bid.created) : null;
    const timeText = created
      ? created.toLocaleString([], {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Unknown time";

    row.innerHTML = `
      <div class="bid-left">
        <span class="bid-username">${bidderName}</span>
        <span class="bid-time">${timeText}</span>
      </div>
      <div class="bid-right">
        <span class="bid-amount">${bid.amount} credits</span>
      </div>
    `;

    bidHistoryList.appendChild(row);
  });
}

/**
 * Render the listing details UI.
 *
 * @param {Object} listing
 */
function renderListing(listing) {
  currentListing = listing;

  const { title, description, seller, _count, endsAt, bids } = listing;

  const imageUrl = getListingImage(listing);
  const sellerName = seller?.name || "Unknown seller";
  const bidsCount = _count?.bids ?? (Array.isArray(bids) ? bids.length : 0);
  const highestBid = getHighestBidAmount(listing);
  const endsAtText = formatEndsAt(endsAt);

  if (imageEl) {
    imageEl.src = imageUrl;
    imageEl.alt = title || "Listing image";
  }

  if (titleEl) titleEl.textContent = title || "Untitled listing";
  if (descriptionEl) {
    descriptionEl.textContent =
      description || "No description provided for this listing.";
  }

  if (sellerEl) sellerEl.textContent = sellerName;
  if (totalBidsEl) totalBidsEl.textContent = String(bidsCount);

  if (highestBidEl) {
    highestBidEl.textContent =
      bidsCount === 0 ? "No bids yet" : `${highestBid} credits`;
  }

  if (endsAtEl) endsAtEl.textContent = endsAtText;

  renderBidHistory(listing);
  updateBidFormState();
}

/**
 * Enable/disable bid form based on auth, ownership, and end date.
 */
function updateBidFormState() {
  if (!bidForm || !bidAmountInput || !placeBidButton || !currentListing) return;

  const token = getToken();
  const user = /** @type {{ name?: string } | null} */ (getProfile()) || null;

  const isLoggedIn = !!token && !!user;
  const isOwnListing =
    isLoggedIn &&
    currentListing.seller &&
    currentListing.seller.name === user.name;

  const now = new Date();
  const endsAtDate = currentListing.endsAt
    ? new Date(currentListing.endsAt)
    : null;
  const isEnded = endsAtDate ? endsAtDate <= now : false;

  // NOT LOGGED IN
  if (!isLoggedIn) {
    bidAmountInput.disabled = true;
    placeBidButton.disabled = false;
    placeBidButton.textContent = "Login or register to place a bid";
    return;
  }

  // OWN LISTING
  if (isOwnListing) {
    bidAmountInput.disabled = true;
    placeBidButton.disabled = true;
    placeBidButton.textContent = "Your listing";
    return;
  }

  // AUCTION ENDED
  if (isEnded) {
    bidAmountInput.disabled = true;
    placeBidButton.disabled = true;
    placeBidButton.textContent = "Auction ended";
    return;
  }

  // Normal case: logged in, not own listing, not ended
  bidAmountInput.disabled = false;
  placeBidButton.disabled = false;
  placeBidButton.textContent = "Place Bid";
}

// ---------- API ----------

/**
 * Fetch a listing by ID (optionally authenticated to include user-specific data).
 *
 * @param {string} id
 * @returns {Promise<Object>}
 */
async function fetchListing(id) {
  const token = getToken();

  const headers = {
    "X-Noroff-API-Key": API_KEY,
  };

  if (token) {
    // @ts-ignore
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(
    `${LISTINGS_BASE}/${encodeURIComponent(id)}?_seller=true&_bids=true`,
    { headers }
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
async function placeBid(listingId, amount) {
  const token = getToken();
  const profile = getProfile();

  // MUST have a token AND profile, otherwise no bidding
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
    }
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

// ---------- EVENT HANDLERS ----------

/**
 * Handle bid form submission (and button click).
 *
 * @param {Event} event
 * @returns {Promise<void>}
 */
async function handleBidSubmit(event) {
  event.preventDefault();

  if (!currentListing || !bidAmountInput || !placeBidButton) return;

  const token = getToken();
  const profile = getProfile();

  // Guest: redirect to login, do NOT place bid
  if (!token || !profile) {
    alert("You need to login or register before placing a bid.");
    window.location.href = "login.html";
    return;
  }

  const amountValue = bidAmountInput.value;
  if (!amountValue) {
    alert("Please enter a bid amount.");
    return;
  }

  const amount = Number(amountValue);
  if (Number.isNaN(amount) || amount <= 0) {
    alert("Bid amount must be greater than 0.");
    return;
  }

  const currentHighest = getHighestBidAmount(currentListing);
  if (amount <= currentHighest) {
    alert(
      `Your bid must be higher than the current highest bid (${currentHighest} credits).`
    );
    return;
  }

  try {
    placeBidButton.disabled = true;
    placeBidButton.textContent = "Placing bid...";

    await placeBid(currentListing.id, amount);

    // Always re-fetch fresh data from API
    const freshListing = await fetchListing(currentListing.id);

    currentListing = freshListing;
    renderListing(freshListing);

    bidAmountInput.value = "";
    await refreshProfileCredits();

    alert("Bid placed successfully!");
  } catch (error) {
    console.error("Error placing bid:", error);
    alert(
      error instanceof Error
        ? error.message
        : "Sorry, something went wrong placing your bid."
    );
  } finally {
    updateBidFormState();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  accessToken = getToken();
  currentUser = getProfile();

  const listingId = getListingIdFromUrl();
  if (!listingId) {
    alert("No listing ID provided.");
    window.location.href = "dashboard.html";
    return;
  }

  if (bidForm) {
    bidForm.addEventListener("submit", handleBidSubmit);
  }
  if (placeBidButton) {
    placeBidButton.addEventListener("click", handleBidSubmit);
  }

  try {
    const listing = await fetchListing(listingId);
    currentListing = listing;
    renderListing(listing);

    if (accessToken && currentUser) {
      await refreshProfileCredits();
    }

    updateBidFormState();
  } catch (error) {
    console.error(error);
    alert(
      error instanceof Error ? error.message : "Could not load listing details."
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
    currentListing = listing;
    renderListing(listing);
  } catch (error) {
    console.error("Error refreshing listing on pageshow:", error);
  }
});
