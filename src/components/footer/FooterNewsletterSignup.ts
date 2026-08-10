import { actions } from "astro:actions";

import { attachFormListeners } from "../../utils/form.utils";

document.addEventListener("DOMContentLoaded", () => {
  // querySelector<T> returns `T | null`, so the absence of an element is
  // handled rather than asserted away.
  const form = document.querySelector<HTMLFormElement>(
    "#footer-newsletter-form",
  );
  const errorDiv = document.querySelector<HTMLElement>("#newsletter-error");
  const errorText = document.querySelector<HTMLElement>(
    "#newsletter-error-text",
  );
  const successDiv = document.querySelector<HTMLElement>("#newsletter-success");

  if (!form || !errorDiv || !errorText || !successDiv) return;

  const action = async (formData: FormData) => {
    const result = await actions.signupEmailList.resend(formData);

    if (result.error) {
      errorText.textContent =
        result.error instanceof Error
          ? result.error.message
          : "Something went wrong, please try again.";
      errorDiv.classList.remove("hidden");
      successDiv.classList.add("hidden");
    } else {
      successDiv.classList.remove("hidden");
      errorDiv.classList.add("hidden");
      form.reset();
    }
  };

  void attachFormListeners(form, action);
});
