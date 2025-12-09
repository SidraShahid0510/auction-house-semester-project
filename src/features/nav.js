// src/features/nav.js

import { getToken, getProfile, clearAuth } from "../utils/storage.js";

const nav = document.querySelector(".site-nav");
const guestLinks = document.querySelector(".nav-auth-links");
const userArea = document.querySelector(".nav-user-area");
const usernameEl = document.querySelector("#nav-user-name");
const creditsEl = document.querySelector("#nav-credits-value");
const avatarImg = document.querySelector("#nav-avatar");
const userIconButton = document.querySelector(".nav-user-icon");
const userMenu = document.querySelector("#nav-user-menu");
const profileLink = document.querySelector("#nav-profile-link");
const logoutButton = document.querySelector("#nav-logout-btn");
const homeLink = document.querySelector("[data-nav-home]"); // <a ... data-nav-home>

/**
 * Apply logged-in / guest state to the nav bar.
 * Reads token + profile from storage and updates:
 * - root classes: .site-nav--guest / .site-nav--user
 * - username, credits, avatar
 * - home link (index.html vs dashboard.html)
 */
export function applyAuthStateToNav() {
  const token = getToken();
  const profile = getProfile();
  const isLoggedIn = !!token && !!profile;

  if (!nav || !guestLinks || !userArea) {
    return;
  }

  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  if (isLoggedIn) {
    if (currentPage === "index.html") {
      window.location.href = "dashboard.html";
      return;
    }

    nav.classList.remove("site-nav--guest");
    nav.classList.add("site-nav--user");

    if (homeLink) {
      homeLink.setAttribute("href", "dashboard.html");
    }

    if (usernameEl && profile.name) {
      usernameEl.textContent = profile.name;
    }

    if (creditsEl && typeof profile.credits === "number") {
      creditsEl.textContent = String(profile.credits);
    }

    const avatarUrl = profile.avatar && profile.avatar.url;

    if (userIconButton && avatarImg) {
      if (avatarUrl) {
        avatarImg.src = avatarUrl;
        avatarImg.alt = profile.name || "User avatar";
        userIconButton.classList.add("has-avatar");
      } else {
        avatarImg.removeAttribute("src");
        userIconButton.classList.remove("has-avatar");
      }
    }
  } else {
    nav.classList.remove("site-nav--user");
    nav.classList.add("site-nav--guest");

    // Guest home always points to index.html
    if (homeLink) {
      homeLink.setAttribute("href", "index.html");
    }

    if (usernameEl) {
      usernameEl.textContent = "";
    }
    if (creditsEl) {
      creditsEl.textContent = "";
    }

    if (userIconButton && avatarImg) {
      avatarImg.removeAttribute("src");
      userIconButton.classList.remove("has-avatar");
    }

    if (userMenu) {
      userMenu.classList.remove("is-open");
    }
  }
}

/**
 * Public helper so other modules (e.g. profile.js) can force
 * a nav refresh after updating auth / avatar.
 */
export function refreshNavAuthState() {
  applyAuthStateToNav();
}

/**
 * Toggle the visibility of the user menu.
 */
function toggleUserMenu() {
  if (!userMenu || !userIconButton) return;

  const isOpen = userMenu.classList.contains("is-open");

  if (isOpen) {
    userMenu.classList.remove("is-open");
    userIconButton.setAttribute("aria-expanded", "false");
  } else {
    userMenu.classList.add("is-open");
    userIconButton.setAttribute("aria-expanded", "true");
  }
}

/**
 * Initialise user menu behaviour (open/close on avatar click, outside click, Esc).
 */
function initUserMenu() {
  if (!userIconButton || !userMenu) return;

  userMenu.classList.remove("is-open");
  userIconButton.setAttribute("aria-expanded", "false");

  userIconButton.addEventListener("click", () => {
    toggleUserMenu();
  });

  document.addEventListener("click", (event) => {
    if (!userMenu || !userIconButton) return;

    const target = event.target;
    if (!userMenu.contains(target) && !userIconButton.contains(target)) {
      userMenu.classList.remove("is-open");
      userIconButton.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && userMenu.classList.contains("is-open")) {
      userMenu.classList.remove("is-open");
      userIconButton.setAttribute("aria-expanded", "false");
    }
  });
}

/**
 * Initialise profile link behaviour.
 */
function initProfileLink() {
  if (!profileLink) return;

  profileLink.addEventListener("click", () => {
    window.location.href = "profile.html";
  });

  profileLink.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      window.location.href = "profile.html";
    }
  });
}

/**
 * Set up the logout button click handler.
 */
function initLogoutHandler() {
  if (!logoutButton) return;

  logoutButton.addEventListener("click", (event) => {
    event.preventDefault();
    clearAuth();
    applyAuthStateToNav();
    window.location.href = "index.html";
  });

  logoutButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      clearAuth();
      applyAuthStateToNav();
      window.location.href = "index.html";
    }
  });
}

/**
 * Initialise navbar behaviour on page load.
 */
function initNav() {
  applyAuthStateToNav();
  initUserMenu();
  initProfileLink();
  initLogoutHandler();
}

document.addEventListener("DOMContentLoaded", initNav);
window.addEventListener("pageshow", applyAuthStateToNav);
window.addEventListener("auth:updated", applyAuthStateToNav);
