import {
  formatDate,
  getListingImage,
  getTimeRemaining,
  getHighestBidAmount,
} from "../../utils/helpers.js";

const bannerEl = document.querySelector(".profile-banner");
const avatarImgEl = document.querySelector(".profile-avatar img");
const usernameEl = document.querySelector(".profile-username");
const emailEl = document.querySelector(".profile-email");
const bioTextEl = document.querySelector(".bio-text");
const creditsHeaderEl = document.querySelector(".profile-credits-value");
const navCreditsEl = document.querySelector("#nav-credits-value");
const avatarInput = document.querySelector("#avatar-url");
const bannerInput = document.querySelector("#banner-url");
const bioInput = document.querySelector("#bio");
const listingsGrid = document.querySelector("#profile-listings-grid");
const bidsGrid = document.querySelector("#profile-bids-grid");
const winsGrid = document.querySelector("#profile-wins-grid");

export let currentProfileData = null;

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
export function updateProfileHeader(profile) {
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
export function renderProfileListings(listings) {
  if (!listingsGrid) return;

  listingsGrid.innerHTML = "";

  if (!Array.isArray(listings) || listings.length === 0) {
    const col = document.createElement("div");
    col.className = "col-12";
    col.innerHTML = `<p class="profile-no-listings">No listings yet.</p>`;
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
        ? `${description.slice(0, 127)}...`
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
              ${bidsCount} bid${bidsCount === 1 ? "" : "s"} · ${highestBid} credits
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
export function renderProfileBids(bids) {
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

    let bidsCount = 0;

    if (Array.isArray(listing.bids)) {
      bidsCount = listing.bids.length;
    } else if (typeof _count?.bids === "number") {
      bidsCount = _count.bids;
    } else {
      bidsCount = 1;
    }

    let highestBid = getHighestBidAmount(listing);

    if (!highestBid || highestBid < bid.amount) {
      highestBid = bid.amount;
    }

    const imageUrl = getListingImage({ media });
    const endsDate = formatDate(endsAt);
    const timeRemaining = getTimeRemaining(endsAt);

    const shortDescription =
      description && description.length > 130
        ? `${description.slice(0, 127)}...`
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

export function renderProfileWins(wins) {
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
        ? `${description.slice(0, 127)}...`
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
