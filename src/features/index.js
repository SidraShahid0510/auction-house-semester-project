// src/features/index.js

import {
  formatDate,
  getListingImage,
  getHighestBidAmount,
  getTimeRemaining,
} from "../utils/helpers.js";
import { API_BASE, API_KEY } from "../api/config.js";

const LISTINGS_URL = `${API_BASE}/auction/listings?_seller=true&_bids=true&sort=created&sortOrder=desc`;

let allListings = [];

window.allListings = allListings;

/**
 * Create a listing card element for the public home page.
 *
 * @param {Object} listing
 * @returns {HTMLDivElement}
 */
function createListingCard(listing) {
  const { id, title, endsAt, _count } = listing;

  const bidsCount = _count?.bids ?? 0;
  const highestBid = getHighestBidAmount(listing);
  const imageUrl = getListingImage(listing);
  const endDate = formatDate(endsAt);
  const timeRemaining = getTimeRemaining(endsAt);

  const col = document.createElement("div");
  col.className = "col-12 col-md-6 col-lg-4 listings-column";

  col.innerHTML = `
    <article class="listing-card">
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
              <span>${highestBid} credits</span>
            </div>
            <p class="listing-card-meta-sub">${timeRemaining}</p>
          </div>
        </div>
      </div>

      <div class="listing-card-body">
        <h2 class="listing-card-title">${title}</h2>

        <div class="listings-bids">
          <p class="listing-card-label">Recent Bids:</p>
          <p class="value value-muted">
            ${bidsCount === 0 ? "No bids yet" : `${bidsCount} bids so far`}
          </p>
        </div>

        <p class="listing-card-auth-text">
          Please <a href="register.html">register</a> or
          <a href="login.html">login</a> to place bids
        </p>
      </div>

      <div class="listing-card-footer">
        <a href="listing-detail.html?id=${id}" class="btn listing-card-btn">
          View Details
        </a>
      </div>
    </article>
  `;

  return col;
}

/**
 * Render a list of listings into the homepage grid.
 *
 * @param {Object[]} listings
 * @returns {void}
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

window.renderListings = renderListings;

/**
 * Fetch listings for the home page and render them.
 *
 * @returns {Promise<void>}
 */
async function loadHomeListings() {
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
    console.error("Error loading listings:", error);
    grid.innerHTML = `
      <div class="col-12 text-center py-4">
        <p>Sorry, something went wrong while loading listings.</p>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadHomeListings();
});

window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    loadHomeListings();
  }
});
