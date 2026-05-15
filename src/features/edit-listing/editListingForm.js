import {
  parseMediaTextarea,
  mediaToTextarea,
  buildEndsAt,
  splitEndsAtToDateTime,
} from "../../utils/listingFormHelpers.js";
import { updateListing, deleteListing } from "./editListingApi.js";

const form = document.querySelector("#editListingForm");
const titleInput = document.querySelector("#listingTitleInput");
const descriptionInput = document.querySelector("#listingDescriptionInput");
const mediaInput = document.querySelector("#mediaUrlsInput");
const saveBtn = document.querySelector("#saveListingButton");
const deleteBtn = document.querySelector("#deleteListingButton");
const endDateInput = document.querySelector("#endDateInput");
const endTimeInput = document.querySelector("#endTimeInput");

/**
 * Populate the edit form with listing data.
 * Redirects away if the listing does not belong to the current user.
 *
 * @param {Listing} listing
 * @param {string} currentUserName
 */
export function populateForm(listing, currentUserName) {
  const { title, description, media, seller, endsAt } = listing;

  if (!seller || seller.name !== currentUserName) {
    alert("You can only edit your own listings.");
    window.location.href = "profile.html";
    return;
  }

  if (titleInput) titleInput.value = title || "";
  if (descriptionInput) descriptionInput.value = description || "";
  if (mediaInput) mediaInput.value = mediaToTextarea(media);

  const { date, time } = splitEndsAtToDateTime(endsAt);

  if (endDateInput) endDateInput.value = date;
  if (endTimeInput) endTimeInput.value = time;
}

/**
 * Handle the "Save Listing" form submit.
 *
 * @param {SubmitEvent} event
 * @param {AuthContext} auth
 * @param {string} listingId
 * @returns {Promise<void>}
 */
async function handleSave(event, auth, listingId) {
  event.preventDefault();

  if (
    !titleInput ||
    !descriptionInput ||
    !mediaInput ||
    !endDateInput ||
    !endTimeInput
  ) {
    alert("Form is not correctly initialized.");
    return;
  }

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const mediaValue = mediaInput.value;
  const endDateValue = endDateInput.value;
  const endTimeValue = endTimeInput.value;

  if (!title || !description) {
    alert("Title and description are required.");
    return;
  }

  if (!endDateValue || !endTimeValue) {
    alert("Please select an end date and time.");
    return;
  }

  const endsAt = buildEndsAt(endDateValue, endTimeValue);

  if (!endsAt) {
    alert("Please choose a valid end date and time.");
    return;
  }

  const endDateObj = new Date(endsAt);

  if (endDateObj <= new Date()) {
    alert("End date/time must be in the future.");
    return;
  }

  const media = parseMediaTextarea(mediaValue, title);

  const payload = {
    title,
    description,
    media: media.length ? media : [],
    endsAt,
  };

  try {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
    }

    await updateListing(auth.token, listingId, payload);

    alert("Listing updated successfully!");
    window.location.href = "profile.html";
  } catch (error) {
    console.error("Update listing error:", error);
    alert(error.message || "Could not update listing.");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Listing";
    }
  }
}

/**
 * Handle the "Delete Listing" action.
 *
 * @param {AuthContext} auth
 * @param {string} listingId
 * @returns {Promise<void>}
 */
async function handleDelete(auth, listingId) {
  const confirmed = confirm(
    "Are you sure you want to delete this listing? This cannot be undone.",
  );

  if (!confirmed) return;

  try {
    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.textContent = "Deleting...";
    }

    await deleteListing(auth.token, listingId);

    alert("Listing deleted successfully.");
    window.location.href = "profile.html";
  } catch (error) {
    console.error("Delete listing error:", error);
    alert(error.message || "Could not delete listing.");
  } finally {
    if (deleteBtn) {
      deleteBtn.disabled = false;
      deleteBtn.textContent = "Delete Listing";
    }
  }
}

/**
 * Adds the form submit and delete button events.
 */
export function setupEditListingForm(auth, listingId) {
  form?.addEventListener("submit", (event) =>
    handleSave(event, auth, listingId),
  );

  deleteBtn?.addEventListener("click", () => handleDelete(auth, listingId));
}
