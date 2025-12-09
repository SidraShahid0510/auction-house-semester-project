// dashboard.js
import {
  formatDate,
  getListingImage,
  getHighestBidAmount,
  getTimeRemaining,
} from "../utils/helpers.js";

import { getToken, getProfile, saveAuth } from "../utils/storage.js";
import { API_KEY, API_BASE } from "../api/config.js";

const LISTINGS_URL = `${API_BASE}/auction/listings?_seller=true&_bids=true&sort=created&sortOrder=desc`;

/**
 * @typedef {Object} ListingBid
 * @property {number} amount
 * @property {string} id
 * @property {string} created
 * @property {{ name: string }} [bidder]
 */

/**
 * @typedef {Object} Listing
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} endsAt
 * @property {string} created
 * @property {{ name: string }} seller
 * @property {{ bids: number }} [_count]
 * @property {ListingBid[]} [bids]
 * @property {{ url: string; alt?: string }[]} [media]
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} name
 * @property {number} credits
 */

let allListings = [];
window.allListings = allListings;
let currentUser = null;

/**
 * Ensure the user is authenticated.
 * Redirects to index.html if no auth found.
 *
 * @returns {{ token: string; profile: UserProfile } | null}
 */
function requireAuth() {
  const token = getToken();
  const profile = /** @type {UserProfile | null} */ (getProfile());

  if (!token || !profile) {
    window.location.href = "index.html";
    return null;
  }

  currentUser = profile;
  return { token, profile };
}

/**
 * Update the credits value displayed in the navbar.
 *
 * @param {number} credits
 */
function updateCreditsDisplay(credits) {
  const creditsEl = document.querySelector("#nav-credits-value");
  if (creditsEl) {
    creditsEl.textContent = String(credits);
  }
}

/**
 * Refresh the current user's profile from the API and update credits.
 *
 * @returns {Promise<void>}
 */
async function refreshProfileCredits() {
  const token = getToken();
  const profile = /** @type {UserProfile | null} */ (getProfile());

  if (!token || !profile?.name) return;

  try {
    const res = await fetch(
      `${API_BASE}/auction/profiles/${encodeURIComponent(profile.name)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Noroff-API-Key": API_KEY,
        },
      }
    );

    if (!res.ok) return;

    const result = await res.json();
    const updatedProfile = /** @type {UserProfile} */ (result.data);

    saveAuth({ accessToken: token, ...updatedProfile });

    currentUser = updatedProfile;
    updateCreditsDisplay(updatedProfile.credits);
  } catch (error) {
    console.error("Error refreshing profile credits:", error);
  }
}

/**
 * Place a bid on a listing.
 *
 * @param {string} listingId - Listing ID.
 * @param {number} amount - Bid amount.
 * @returns {Promise<Listing>} Updated listing from the API.
 */
async function placeBid(listingId, amount) {
  const token = getToken();
  if (!token) {
    throw new Error("You must be logged in to place a bid.");
  }

  const response = await fetch(
    `${API_BASE}/auction/listings/${listingId}/bids`,
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

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody.errors?.[0]?.message || `API error: ${response.status}`;
    throw new Error(message);
  }

  const result = await response.json();
  return /** @type {Listing} */ (result.data);
}

/**
 * Fetch a single listing with seller and bids from the API.
 *
 * @param {string} listingId
 * @returns {Promise<Listing>}
 */
async function fetchListingById(listingId) {
  const token = getToken();

  const headers = {
    "X-Noroff-API-Key": API_KEY,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE}/auction/listings/${encodeURIComponent(
      listingId
    )}?_seller=true&_bids=true`,
    { headers }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody.errors?.[0]?.message || `API error: ${response.status}`;
    throw new Error(message);
  }

  const result = await response.json();
  return /** @type {Listing} */ (result.data);
}

/**
 * Create a listing card element for the dashboard grid.
 *
 * @param {Listing} listing
 * @returns {HTMLDivElement}
 */
function createListingCard(listing) {
  const { id, title, description, endsAt, created, seller, _count, bids } =
    listing;

  const bidsCount = _count?.bids ?? (Array.isArray(bids) ? bids.length : 0);

  const highestBid = getHighestBidAmount(listing);
  const imageUrl = getListingImage(listing);
  const endDate = formatDate(endsAt);
  const postedDate = formatDate(created);
  const timeRemaining = getTimeRemaining(endsAt);
  const username = seller?.name || "Unknown seller";

  const shortDescription =
    description && description.length > 130
      ? description.slice(0, 127) + "..."
      : description || "No description provided.";

  const col = document.createElement("div");
  col.className = "col-12 col-md-6 col-lg-4 listings-column";

  col.innerHTML = `
    <article class="listing-card" data-listing-id="${id}">
      <div class="image-wrapper">
        <span class="listing-card-badge">${bidsCount} bids</span>
        <img
          src="${imageUrl}"
          alt="${title}"
          class="listing-card-img"
        />
      </div>

      <div class="listing-card-meta">
        <div class="listing-card-meta-row">
          <div>
            <div class="listing-card-meta-main">
              <span>Ends: ${endDate}</span>
              <span class="listing-card-highest-bid">${highestBid} credits</span>
            </div>
            <p class="listing-card-meta-sub">${timeRemaining}</p>
          </div>
        </div>
      </div>

      <div class="listing-card-body">
        <h2 class="listing-card-title">${title}</h2>

        <div class="listing-card-user">
          <span class="listing-card-username">By ${username}</span>
          <span class="listing-card-posted">Posted ${postedDate}</span>
        </div>

        <p class="listing-card-description">
          ${shortDescription}
        </p>

        <div class="listings-bids">
          <p class="listing-card-label">Recent Bids:</p>
          <p class="value value-muted listing-card-bids-text">
            ${
              bidsCount === 0
                ? "No bids yet"
                : `${bidsCount} bid${bidsCount === 1 ? "" : "s"} so far`
            }
          </p>
        </div>

        <div class="listing-card-bid-form">
          <input
            type="number"
            class="bid-input"
            placeholder="Enter bid amount"
            min="0"
          />
          <button type="button" class="btn listing-card-bid-btn">
            Bid
          </button>
        </div>
      </div>

      <div class="listing-card-footer">
        <a href="listing-detail.html?id=${id}" class="btn listing-card-btn">
          View Details
        </a>
      </div>
    </article>
  `;

  const bidBtn = col.querySelector(".listing-card-bid-btn");
  const bidInput = col.querySelector(".bid-input");
  const badgeEl = col.querySelector(".listing-card-badge");
  const bidsTextEl = col.querySelector(".listing-card-bids-text");
  const highestBidEl = col.querySelector(".listing-card-highest-bid");

  if (!bidBtn || !bidInput || !badgeEl || !bidsTextEl || !highestBidEl) {
    return col;
  }

  const isOwnListing =
    currentUser && seller && seller.name === currentUser.name;

  if (isOwnListing) {
    bidBtn.disabled = true;
    bidBtn.textContent = "Your listing";
  }

  bidBtn.addEventListener("click", async () => {
    if (!bidInput.value) {
      alert("Please enter a bid amount.");
      return;
    }

    const amount = Number(bidInput.value);
    if (Number.isNaN(amount) || amount <= 0) {
      alert("Bid amount must be greater than 0.");
      return;
    }

    const currentHighest = getHighestBidAmount(listing);
    if (amount <= currentHighest) {
      alert(
        `Your bid must be higher than the current highest bid (${currentHighest} credits).`
      );
      return;
    }

    try {
      bidBtn.disabled = true;
      bidBtn.textContent = "Placing bid...";
      await placeBid(id, amount);
      const freshListing = await fetchListingById(id);
      Object.assign(listing, freshListing);
      const newBidsCount =
        freshListing._count?.bids ??
        (Array.isArray(freshListing.bids) ? freshListing.bids.length : 0);

      const newHighestBid = getHighestBidAmount(freshListing);
      highestBidEl.textContent = `${newHighestBid} credits`;

      badgeEl.textContent = `${newBidsCount} bid${
        newBidsCount === 1 ? "" : "s"
      }`;
      bidsTextEl.textContent =
        newBidsCount === 0
          ? "No bids yet"
          : `${newBidsCount} bid${newBidsCount === 1 ? "" : "s"} so far`;

      bidInput.value = "";
      await refreshProfileCredits();

      alert("Bid placed successfully!");
    } catch (error) {
      console.error("Error placing bid:", error);
      alert(error.message || "Sorry, something went wrong placing your bid.");
    } finally {
      if (!isOwnListing) {
        bidBtn.disabled = false;
        bidBtn.textContent = "Bid";
      }
    }
  });

  return col;
}

/**
 * Render listings into the dashboard grid.
 *
 * @param {Listing[]} listings
 */
function renderListings(listings) {
  const grid = document.querySelector("#listings-grid");
  if (!grid) return;

  if (!Array.isArray(listings) || listings.length === 0) {
    grid.innerHTML = `
      <div class="col-12 text-center py-4">
        <p>No listings found.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = "";
  listings.forEach((listing) => {
    const card = createListingCard(listing);
    grid.appendChild(card);
  });
}

// Expose renderListings for search.js
window.renderListings = renderListings;

/**
 * Load dashboard listings from the API and render them.
 *
 * @returns {Promise<void>}
 */
async function loadDashboardListings() {
  const grid = document.querySelector("#listings-grid");
  if (!grid) return;

  try {
    const response = await fetch(LISTINGS_URL, {
      headers: {
        "X-Noroff-API-Key": API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    allListings = result.data || [];

    window.allListings = allListings;

    renderListings(allListings);
  } catch (error) {
    console.error("Error loading dashboard listings:", error);
    grid.innerHTML = `
      <div class="col-12 text-center py-4">
        <p>Sorry, something went wrong while loading listings.</p>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const auth = requireAuth();
  if (!auth) return;

  await refreshProfileCredits();
  loadDashboardListings();
});

window.addEventListener("pageshow", async (event) => {
  if (!event.persisted) return;

  const auth = requireAuth();
  if (!auth) return;

  await refreshProfileCredits();
  loadDashboardListings();
});
