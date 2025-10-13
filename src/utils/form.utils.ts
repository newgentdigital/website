import { actions } from "astro:actions";
import { TURNSTILE_SITE_KEY } from "astro:env/client";

declare global {
  var turnstile: {
    render: (
      container: string,
      options: {
        sitekey: string;
        size: string;
        callback: () => void;
        "error-callback": (errorCode: string) => void;
      },
    ) => void;
    reset: (container: string) => void;
    isExpired: (container: string, callback: () => void) => void;
  };
}

/** The ID selector for the Turnstile container. */
const TURNSTILE_CONTAINER_ID = "#cf-turnstile";
/** The name attribute for the Turnstile response input. */
const TURNSTILE_RESPONSE_NAME = "cf-turnstile-response";
/** The name attribute for the idempotency key input. */
const IDEMPOTENCY_KEY_NAME = "idempotency_key";
/** The dataset attribute for client-side captcha validity. */
const CAPTCHA_CLIENT_VALID_DATASET = "captchaClientValid";
/** Selector for the submit button. */
const SUBMIT_BUTTON_SELECTOR = 'button[type="submit"]';
/** Selector for all required form fields. */
const REQUIRED_FIELDS_SELECTOR =
  "input[required], textarea[required], select[required]";
/** Selector for all form fields (input, textarea, select). */
const ALL_FIELDS_SELECTOR = "input, textarea, select";
/** Selector for the Turnstile response input. */
const TURNSTILE_RESPONSE_SELECTOR = `input[name="${TURNSTILE_RESPONSE_NAME}"]`;
/** Selector for the idempotency key input. */
const IDEMPOTENCY_KEY_SELECTOR = `input[name="${IDEMPOTENCY_KEY_NAME}"]`;

/**
 * Sets an idempotency key for the given form.
 *
 * @param form - The HTML form element to which the idempotency key will be
 *   added.
 */
async function setFormIdempotencyKey(form: HTMLFormElement) {
  const idempotencyKey = crypto.randomUUID();

  if (form) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = IDEMPOTENCY_KEY_NAME;
    input.value = idempotencyKey;
    form.appendChild(input);
  }
}

/**
 * Manages Turnstile by rendering the widget on the first focus event of any
 * form field. Handles form validation and Turnstile expiration checks.
 *
 * @param form - The HTML form element to manage.
 */
async function manageTurnstileForm(form: HTMLFormElement) {
  let turnstileRendered = false;
  const allFields = form.querySelectorAll(ALL_FIELDS_SELECTOR);

  allFields.forEach((field) => {
    field.addEventListener("focus", () => {
      if (!turnstileRendered) {
        turnstile.render(TURNSTILE_CONTAINER_ID, {
          sitekey: TURNSTILE_SITE_KEY,
          size: "flexible",
          theme: localStorage.getItem("theme") || "auto",
          callback: async function () {
            form.dataset[CAPTCHA_CLIENT_VALID_DATASET] = "true";
          },
          "error-callback": function (errorCode: string) {
            form.dataset[CAPTCHA_CLIENT_VALID_DATASET] = "false";
            console.error("Turnstile callback error:", errorCode);
          },
        });
        turnstileRendered = true;
      }

      turnstile.isExpired(TURNSTILE_CONTAINER_ID, function () {
        turnstile.reset(TURNSTILE_CONTAINER_ID);
      });
    });
  });
}

/**
 * Validates a form field based on its type and attributes.
 *
 * @param field - The form field to validate.
 * @returns True if the field is valid, false otherwise.
 */
function validateField(
  field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
): boolean {
  const value = field.value.trim();

  if (value === "" && !field.hasAttribute("required")) {
    return true;
  }

  if (field.type === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  if (field.type === "tel") {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(value) && value.length >= 7; // Minimum length check
  }

  if (field.type === "url") {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  if (field.hasAttribute("pattern")) {
    const pattern = field.getAttribute("pattern");
    if (pattern) {
      try {
        const regex = new RegExp(pattern);
        return regex.test(value);
      } catch {
        // Invalid regex pattern, fall back to no validation
        return true;
      }
    }
  }

  // For other types or no specific validation, consider valid
  return true;
}

/**
 * Checks form validity by ensuring all required fields are filled and the
 * client-side captcha is valid. Disables the submit button if form is invalid.
 *
 * @param form - The HTML form element to check.
 */
async function checkFormValidity(form: HTMLFormElement) {
  const submitButton = form.querySelector(
    SUBMIT_BUTTON_SELECTOR,
  ) as HTMLButtonElement;
  const requiredFields = form.querySelectorAll(REQUIRED_FIELDS_SELECTOR);

  const allRequiredFilled = Array.from(requiredFields).every(
    (field) =>
      (
        field as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      ).value.trim() !== "",
  );

  const allFieldsValid = Array.from(requiredFields).every((field) =>
    validateField(
      field as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    ),
  );

  submitButton.disabled =
    !allRequiredFilled ||
    !allFieldsValid ||
    !form.dataset[CAPTCHA_CLIENT_VALID_DATASET];
}

/**
 * Attaches event listeners to required form fields and performs initial form
 * setup.
 *
 * @param form - The HTML form element to attach listeners to.
 * @param action - Optional action function to call with the form data if
 *   captcha verification succeeds.
 */
export async function attachFormListeners(
  form: HTMLFormElement,
  action?: (formData: FormData) => void,
) {
  const requiredFields = form.querySelectorAll(REQUIRED_FIELDS_SELECTOR);

  requiredFields.forEach((field) => {
    if (field.tagName === "SELECT") {
      field.addEventListener("change", () => checkFormValidity(form));
    } else {
      field.addEventListener("input", () => checkFormValidity(form));
    }
  });

  const submitButton = form.querySelector(
    SUBMIT_BUTTON_SELECTOR,
  ) as HTMLButtonElement;

  submitButton.addEventListener("click", async (event) => {
    event.preventDefault();

    const turnstileRespone = form.querySelector(
      TURNSTILE_RESPONSE_SELECTOR,
    ) as HTMLInputElement;

    const idempotencyKeyInput = form.querySelector(
      IDEMPOTENCY_KEY_SELECTOR,
    ) as HTMLInputElement;

    const captchaData = new FormData();
    captchaData.append(TURNSTILE_RESPONSE_NAME, turnstileRespone.value);
    captchaData.append(IDEMPOTENCY_KEY_NAME, idempotencyKeyInput.value);

    try {
      const result = await actions.verifyCaptcha.turnstile(captchaData);
      if (result.data?.data.success) {
        const formData = new FormData(form);
        if (action) {
          action(formData);
        }
      } else {
        turnstile.reset(TURNSTILE_CONTAINER_ID);
      }
    } catch (error) {
      console.error(error);
      turnstile.reset(TURNSTILE_CONTAINER_ID);
    }
  });

  await setFormIdempotencyKey(form);
  await manageTurnstileForm(form);
  await checkFormValidity(form);
}
