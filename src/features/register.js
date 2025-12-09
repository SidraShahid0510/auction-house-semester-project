// src/features/register.js

import { REGISTER_URL } from "../api/config.js";
const registrationForm = document.getElementById("register-form");
const nameHint = document.getElementById("name-hint");
const emailHint = document.getElementById("email-hint");
const passwordHint = document.getElementById("password-hint");
const toast = document.getElementById("toast-message");
const loader = document.getElementById("page-loader");

/**
 * @typedef {Object} RegisterUserDetails
 * @property {string} name
 * @property {string} email
 * @property {string} password
 */

/**
 * Show or clear a toast message.
 *
 * @param {string} text - Message text. Pass empty string to clear.
 * @param {"error" | "success"} [type="error"] - Message style.
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
 * Call the Noroff register API.
 *
 * @param {RegisterUserDetails} userDetails
 * @returns {Promise<void>}
 */
async function registerUser(userDetails) {
  showMessage("");
  showLoader();

  const fetchOptions = /** @type {RequestInit} */ ({
    method: "POST",
    body: JSON.stringify(userDetails),
    headers: {
      "Content-Type": "application/json",
    },
  });

  try {
    const response = await fetch(REGISTER_URL, fetchOptions);
    const result = await response.json();

    if (!response.ok) {
      const errorMessage =
        result?.errors?.map((err) => err.message).join(", ") ||
        result?.message ||
        "Something went wrong.";
      throw new Error(errorMessage);
    }

    // Success
    showMessage("Registration successful! Redirecting to login...", "success");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
  } catch (error) {
    console.error("API error:", error);
    showMessage("Registration failed. Please try again.");
  } finally {
    hideLoader();
  }
}

/**
 * Clear all field error states.
 */
function clearFieldErrors() {
  if (nameHint) nameHint.classList.remove("is-invalid");
  if (emailHint) emailHint.classList.remove("is-invalid");
  if (passwordHint) passwordHint.classList.remove("is-invalid");
}

/**
 * Handle registration form submit.
 *
 * @param {SubmitEvent} event
 */
function formSubmit(event) {
  event.preventDefault();
  if (!registrationForm) return;

  clearFieldErrors();

  const formData = new FormData(registrationForm);
  /** @type {{ name?: string; email?: string; password?: string }} */
  const formFields = Object.fromEntries(formData);

  let isValid = true;

  // Username: at least 4 chars
  if (!formFields.name || formFields.name.trim().length < 4) {
    if (nameHint) nameHint.classList.add("is-invalid");
    isValid = false;
  }

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
    // don’t call API if basic validation fails
    return;
  }

  registerUser(
    /** @type {RegisterUserDetails} */ ({
      name: formFields.name,
      email: formFields.email,
      password: formFields.password,
    })
  );
}

if (registrationForm) {
  registrationForm.addEventListener("submit", formSubmit);
}
