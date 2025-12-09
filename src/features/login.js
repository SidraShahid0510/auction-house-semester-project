// src/features/login.js

import { LOGIN_URL } from "../api/config.js";
import { saveAuth } from "../utils/storage.js";

const loginForm = document.getElementById("login-form");
const emailHint = document.getElementById("email-hint");
const passwordHint = document.getElementById("password-hint");
const toast = document.getElementById("toast-message");
const loader = document.getElementById("page-loader");

/**
 * @typedef {Object} LoginCredentials
 * @property {string} email
 * @property {string} password
 */

/**
 * Show or clear a toast message.
 *
 * @param {string} text - Message text. Pass empty string to clear.
 * @param {"error" | "success"} [type="error"] - Message type.
 */
function showMessage(text, type = "error") {
  if (!toast) return;

  if (!text) {
    toast.textContent = "";
    toast.className = "toast-message";
    return;
  }

  toast.className = "toast-message toast-message--visible";

  if (type === "success") {
    toast.classList.add("toast-message--success");
  } else {
    toast.classList.add("toast-message--error");
  }

  toast.textContent = text;
}

/**
 * Show the page loader.
 */
function showLoader() {
  if (loader) {
    loader.classList.add("is-visible");
  }
}

/**
 * Hide the page loader.
 */
function hideLoader() {
  if (loader) {
    loader.classList.remove("is-visible");
  }
}

/**
 * Clear email/password field error states.
 */
function clearFieldErrors() {
  if (emailHint) emailHint.classList.remove("is-invalid");
  if (passwordHint) passwordHint.classList.remove("is-invalid");
}

/**
 * Call Noroff login API and handle auth + redirects.
 *
 * @param {LoginCredentials} credentials
 * @returns {Promise<void>}
 */
async function loginUser(credentials) {
  showMessage("");
  showLoader();

  const fetchOptions = {
    method: "POST",
    body: JSON.stringify(credentials),
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await fetch(LOGIN_URL, fetchOptions);
    const result = await response.json();

    if (!response.ok) {
      const errorMessage =
        result?.errors?.map((err) => err.message).join(", ") ||
        result?.message ||
        "Something went wrong.";

      console.error("Login error:", errorMessage);
      throw new Error(errorMessage);
    }

    if (result && result.data) {
      saveAuth(result.data);
    }

    showMessage("Login successful! Redirecting...", "success");

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
  } catch (error) {
    console.error("API error:", error);
    showMessage(
      error instanceof Error ? error.message : "Login failed. Please try again."
    );
  } finally {
    hideLoader();
  }
}

/**
 * Handle login form submit.
 *
 * @param {SubmitEvent} event
 */
function formSubmit(event) {
  event.preventDefault();
  if (!loginForm) return;

  clearFieldErrors();

  const formData = new FormData(loginForm);
  const formFields = Object.fromEntries(formData);

  let isValid = true;

  // Email: must end with @stud.noroff.no
  if (!formFields.email || !formFields.email.endsWith("@stud.noroff.no")) {
    if (emailHint) emailHint.classList.add("is-invalid");
    isValid = false;
  }

  // Password: at least 8 chars
  if (!formFields.password || formFields.password.length < 8) {
    if (passwordHint) passwordHint.classList.add("is-invalid");
    isValid = false;
  }

  if (!isValid) {
    // do not call API if basic validation fails
    return;
  }

  // If validation passed, call API
  loginUser({
    email: formFields.email,
    password: formFields.password,
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", formSubmit);
}
