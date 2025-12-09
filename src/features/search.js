// src/features/search.js

/**
 * Shared search logic for listings on index + dashboard.
 *
 * This file expects TWO globals to exist on the page:
 * - window.allListings: Listing[]       -> array of all listings (already fetched)
 * - window.renderListings(listings): () -> function that renders a given array
 *
 * @typedef {Object} Listing
 * @property {string} [title]
 * @property {string} [description]
 */

/**
 * Handle the search form submit event:
 * - Reads the query from #home-search-query
 * - If empty, renders all listings
 * - Otherwise filters by title and description, then renders results
 *
 * @param {SubmitEvent} event
 */
function handleSearchSubmit(event) {
  event.preventDefault();

  const input = document.querySelector("#home-search-query");
  if (!input) return;

  const query = input.value.trim().toLowerCase();

  const allListings = window.allListings || [];

  const renderListings = window.renderListings;

  if (!Array.isArray(allListings) || typeof renderListings !== "function") {
    console.warn(
      "[search] Missing global allListings or renderListings. Did you include this script after index/dashboard?"
    );
    return;
  }

  // If search is empty -show all listings again
  if (!query) {
    renderListings(allListings);
    return;
  }

  // Filter by title and description
  const filtered = allListings.filter((listing) => {
    const title = (listing.title || "").toLowerCase();
    const description = (listing.description || "").toLowerCase();
    return title.includes(query) || description.includes(query);
  });

  renderListings(filtered);
}

document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.querySelector("#home-search-form");
  if (!searchForm) return;

  searchForm.addEventListener("submit", handleSearchSubmit);
});
