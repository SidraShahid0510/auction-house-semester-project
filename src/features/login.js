// src/features/login.js

import { LOGIN_URL } from "../api/config.js";
import { saveAuth } from "../utils/storage.js";
import {
  showMessage,
  showLoader,
  hideLoader,
  clearFieldErrors,
  validateNoroffEmail,
  validatePassword,
  setFieldError,
  postJson,
} from "../utils/authFormHelpers.js";

const loginForm = document.getElementById("login-form");
const emailHint = document.getElementById("email-hint");
const passwordHint = document.getElementById("password-hint");
const toast = document.getElementById("toast-message");
const loader = document.getElementById("page-loader");

/**
 * Call Noroff login API and handle auth + redirects.
 *
 * @param {{ email: string; password: string }} credentials
 * @returns {Promise<void>}
 */
async function loginUser(credentials) {
  showMessage(toast, "");
  showLoader(loader);

  try {
    const result = await postJson(LOGIN_URL, credentials);

    if (result?.data) {
      saveAuth(result.data);
    }

    showMessage(toast, "Login successful! Redirecting...", "success");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
  } catch (error) {
    console.error("API error:", error);

    showMessage(
      toast,
      error instanceof Error
        ? error.message
        : "Login failed. Please try again.",
    );
  } finally {
    hideLoader(loader);
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

  clearFieldErrors(emailHint, passwordHint);

  const formData = new FormData(loginForm);
  const formFields = Object.fromEntries(formData);

  let isValid = true;

  const emailError = validateNoroffEmail(String(formFields.email || ""));
  const passwordError = validatePassword(String(formFields.password || ""));

  if (emailError) {
    setFieldError(emailHint, emailError);
    isValid = false;
  }

  if (passwordError) {
    setFieldError(passwordHint, passwordError);
    isValid = false;
  }

  if (!isValid) {
    showMessage(toast, "Please fix the highlighted fields.");
    return;
  }

  loginUser({
    email: String(formFields.email).trim(),
    password: String(formFields.password),
  });
}

loginForm?.addEventListener("submit", formSubmit);
