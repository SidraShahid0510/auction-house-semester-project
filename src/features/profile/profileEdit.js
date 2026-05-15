import { saveAuth } from "../../utils/storage.js";
import { updateProfileOnServer } from "./profileApi.js";
import { updateProfileHeader } from "./profileRender.js";

const editSection = document.querySelector(".profile-edit");
const editBtn = document.querySelector(".profile-edit-btn");
const cancelBtn = document.querySelector(".cancel-btn");
const editForm = document.querySelector("#profile-edit-form");
const avatarInput = document.querySelector("#avatar-url");
const bannerInput = document.querySelector("#banner-url");
const bioInput = document.querySelector("#bio");

let currentProfileData = null;

export function setCurrentProfileData(profile) {
  currentProfileData = profile;
}

/**
 * Show the profile edit section and sync the form fields
 * with the latest profile data.
 */
function showEditSection() {
  if (!editSection || !currentProfileData) return;

  editSection.style.display = "block";

  const { avatar, banner, bio } = currentProfileData;

  if (avatarInput) avatarInput.value = avatar?.url || "";
  if (bannerInput) bannerInput.value = banner?.url || "";
  if (bioInput) bioInput.value = bio || "";
}

/**
 * Hide the profile edit section.
 */
function hideEditSection() {
  if (!editSection) return;

  editSection.style.display = "none";
}

/**
 * Wire up all event listeners related to editing the profile
 * (show/hide edit section, submit form).
 *
 * @param {AuthContext} auth - Current auth info.
 */
export function setupEditHandlers(auth) {
  if (editSection) {
    editSection.style.display = "none";
  }

  editBtn?.addEventListener("click", showEditSection);
  cancelBtn?.addEventListener("click", hideEditSection);

  editForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!auth) return;

    const avatarUrl = avatarInput?.value.trim();
    const bannerUrl = bannerInput?.value.trim();
    const bioValue = bioInput?.value.trim() || "";

    const body = {
      bio: bioValue,
    };

    if (avatarUrl) {
      body.avatar = {
        url: avatarUrl,
        alt: `${auth.profile.name}'s avatar`,
      };
    }

    if (bannerUrl) {
      body.banner = {
        url: bannerUrl,
        alt: `${auth.profile.name}'s banner`,
      };
    }

    try {
      const updated = await updateProfileOnServer(
        auth.token,
        auth.profile.name,
        body,
      );

      saveAuth({ accessToken: auth.token, ...updated });
      window.dispatchEvent(new Event("auth:updated"));

      updateProfileHeader(updated);
      setCurrentProfileData(updated);
      hideEditSection();

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update failed:", error);
      alert(
        error instanceof Error ? error.message : "Could not update profile.",
      );
    }
  });
}
