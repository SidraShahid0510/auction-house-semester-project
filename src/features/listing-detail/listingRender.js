import {
  formatDate,
  getListingImage,
  getHighestBidAmount,
} from "../../utils/helpers.js";

const imageEl = document.querySelector("#listingImage");
const titleEl = document.querySelector("#listingTitle");
const descriptionEl = document.querySelector("#listingDescription");
const sellerEl = document.querySelector("#listingSeller");
const totalBidsEl = document.querySelector("#listingTotalBids");
const highestBidEl = document.querySelector("#listingHighestBid");
const endsAtEl = document.querySelector("#listingEndsAt");
const bidHistoryList = document.querySelector("#bidHistoryList");

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

/**
 * Render the bid history list.
 *
 * @param {Object} listing
 */
export function renderBidHistory(listing) {
  if (!bidHistoryList) return;

  bidHistoryList.innerHTML = "";

  const bids = Array.isArray(listing.bids) ? listing.bids : [];

  if (bids.length === 0) {
    bidHistoryList.innerHTML = `<p class="no-bids">No bids yet.</p>`;
    return;
  }

  const sortedBids = [...bids].sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
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
export function renderListing(listing) {
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
}
