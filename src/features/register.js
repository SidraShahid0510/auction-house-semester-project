// src/features/register.js

import { REGISTER_URL } from "../api/config.js";
import {
  showMessage,
  showLoader,
  hideLoader,
  clearFieldErrors,
  validateNoroffEmail,
  validatePassword,
  validateName,
  setFieldError,
  postJson,
} from "../utils/authFormHelpers.js";

const registrationForm = document.getElementById("register-form");
const nameHint = document.getElementById("name-hint");
const emailHint = document.getElementById("email-hint");
const passwordHint = document.getElementById("password-hint");
const toast = document.getElementById("toast-message");
const loader = document.getElementById("page-loader");

/**
 * Call the Noroff register API.
 *
 * @param {{ name: string; email: string; password: string }} userDetails
 * @returns {Promise<void>}
 */
async function registerUser(userDetails) {
  showMessage(toast, "");
  showLoader(loader);

  try {
    await postJson(REGISTER_URL, userDetails);

    showMessage(
      toast,
      "Registration successful! Redirecting to login...",
      "success",
    );

    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
  } catch (error) {
    console.error("API error:", error);

    showMessage(
      toast,
      error instanceof Error
        ? error.message
        : "Registration failed. Please try again.",
    );
  } finally {
    hideLoader(loader);
  }
}

/**
 * Handle registration form submit.
 *
 * @param {SubmitEvent} event
 */
function formSubmit(event) {
  event.preventDefault();
  if (!registrationForm) return;

  clearFieldErrors(nameHint, emailHint, passwordHint);

  const formData = new FormData(registrationForm);
  const formFields = Object.fromEntries(formData);

  let isValid = true;

  const nameError = validateName(String(formFields.name || ""));
  const emailError = validateNoroffEmail(String(formFields.email || ""));
  const passwordError = validatePassword(String(formFields.password || ""));

  if (nameError) {
    setFieldError(nameHint, nameError);
    isValid = false;
  }

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

  registerUser({
    name: String(formFields.name).trim(),
    email: String(formFields.email).trim(),
    password: String(formFields.password),
  });
}

registrationForm?.addEventListener("submit", formSubmit);
