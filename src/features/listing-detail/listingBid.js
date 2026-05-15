import { getToken, getProfile } from "../../utils/storage.js";
import { getHighestBidAmount } from "../../utils/helpers.js";
import { fetchListing, placeBid, refreshProfileCredits } from "./listingApi.js";
import { renderListing } from "./listingRender.js";

const bidForm = document.querySelector("#placeBidForm");
const bidAmountInput = document.querySelector("#bidAmountInput");
const placeBidButton = document.querySelector("#placeBidButton");
const navCreditsEl = document.querySelector("#nav-credits-value");

let currentListing = null;

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

export function setCurrentListing(listing) {
  currentListing = listing;
}

/**
 * Enable/disable bid form based on auth, ownership, and end date.
 */
export function updateBidFormState() {
  if (!bidForm || !bidAmountInput || !placeBidButton || !currentListing) return;

  const token = getToken();
  const user = getProfile();

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

  if (!isLoggedIn) {
    bidAmountInput.disabled = true;
    placeBidButton.disabled = false;
    placeBidButton.textContent = "Login or register to place a bid";
    return;
  }

  if (isOwnListing) {
    bidAmountInput.disabled = true;
    placeBidButton.disabled = true;
    placeBidButton.textContent = "Your listing";
    return;
  }

  if (isEnded) {
    bidAmountInput.disabled = true;
    placeBidButton.disabled = true;
    placeBidButton.textContent = "Auction ended";
    return;
  }

  bidAmountInput.disabled = false;
  placeBidButton.disabled = false;
  placeBidButton.textContent = "Place Bid";
}

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
      `Your bid must be higher than the current highest bid (${currentHighest} credits).`,
    );
    return;
  }

  try {
    placeBidButton.disabled = true;
    placeBidButton.textContent = "Placing bid...";

    await placeBid(currentListing.id, amount);

    const freshListing = await fetchListing(currentListing.id);

    setCurrentListing(freshListing);
    renderListing(freshListing);

    bidAmountInput.value = "";

    const updatedProfile = await refreshProfileCredits();

    if (updatedProfile) {
      updateNavCredits(updatedProfile.credits);
    }

    alert("Bid placed successfully!");
  } catch (error) {
    console.error("Error placing bid:", error);
    alert(
      error instanceof Error
        ? error.message
        : "Sorry, something went wrong placing your bid.",
    );
  } finally {
    updateBidFormState();
  }
}

export function setupBidHandlers() {
  bidForm?.addEventListener("submit", handleBidSubmit);
  placeBidButton?.addEventListener("click", handleBidSubmit);
}
