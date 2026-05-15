/**
 * Show or clear a toast message.
 *
 * @param {HTMLElement | null} toast - Toast message element.
 * @param {string} text - Message text. Pass an empty string to clear it.
 * @param {"error" | "success"} [type="error"] - Message style.
 */
export function showMessage(toast, text, type = "error") {
  if (!toast) return;

  if (!text) {
    toast.textContent = "";
    toast.className = "toast-message";
    return;
  }

  toast.className = "toast-message toast-message--visible";
  toast.classList.add(
    type === "success" ? "toast-message--success" : "toast-message--error",
  );

  toast.textContent = text;
}

/**
 * Show the page loader.
 *
 * @param {HTMLElement | null} loader - Loader element.
 */
export function showLoader(loader) {
  loader?.classList.add("is-visible");
}

/**
 * Hide the page loader.
 *
 * @param {HTMLElement | null} loader - Loader element.
 */
export function hideLoader(loader) {
  loader?.classList.remove("is-visible");
}

/**
 * Remove invalid styles from form hint elements.
 *
 * @param {...HTMLElement | null} hints - Hint elements to reset.
 */
export function clearFieldErrors(...hints) {
  hints.forEach((hint) => hint?.classList.remove("is-invalid"));
}

/**
 * Check if the email belongs to a Noroff student account.
 *
 * @param {string} email - User email.
 * @returns {boolean} True if valid Noroff email.
 */
export function isNoroffEmail(email) {
  return Boolean(email && email.endsWith("@stud.noroff.no"));
}

/**
 * Check if the password meets the minimum length requirement.
 *
 * @param {string} password - User password.
 * @returns {boolean} True if password is valid.
 */
export function isValidPassword(password) {
  return Boolean(password && password.length >= 8);
}

/**
 * Send a POST request with JSON data.
 * Used for login and registration requests.
 *
 * @param {string} url - API endpoint.
 * @param {object} payload - Request body data.
 * @returns {Promise<object>} Parsed API response.
 */
export async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.errors?.map((err) => err.message).join(", ") ||
      result?.message ||
      "Something went wrong.";

    throw new Error(message);
  }

  return result;
}
/**
 * Validate a Noroff student email address.
 * Returns an error message if the value is invalid.
 *
 * @param {string} email - User email input.
 * @returns {string} Validation message. Empty string means valid.
 */
export function validateNoroffEmail(email) {
  const value = String(email || "").trim();
  const pattern = /^[^\s@]+@stud\.noroff\.no$/;

  if (!value) {
    return "Email is required.";
  }

  if (!pattern.test(value)) {
    return "Email must be a valid @stud.noroff.no address.";
  }

  return "";
}

/**
 * Validate the user password.
 * Checks for empty values and minimum length.
 *
 * @param {string} password - User password input.
 * @returns {string} Validation message. Empty string means valid.
 */
export function validatePassword(password) {
  const value = String(password || "");

  if (!value.trim()) {
    return "Password is required.";
  }

  if (value.length < 8) {
    return "Password must be at least 8 characters.";
  }

  return "";
}

/**
 * Validate the username field.
 * Ensures the value is not empty and meets the minimum length.
 *
 * @param {string} name - Username input.
 * @returns {string} Validation message. Empty string means valid.
 */
export function validateName(name) {
  const value = String(name || "").trim();

  if (!value) {
    return "Name is required.";
  }

  if (value.length < 4) {
    return "Name must be at least 4 characters.";
  }

  return "";
}

/**
 * Display an inline validation error message for a form field.
 *
 * @param {HTMLElement | null} hintEl - Field hint/error element.
 * @param {string} message - Validation message to display.
 */
export function setFieldError(hintEl, message) {
  if (!hintEl) return;

  hintEl.textContent = message;
  hintEl.classList.add("is-invalid");
}
