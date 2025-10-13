import { actions } from "astro:actions";
import { attachFormListeners } from "../../utils/form.utils";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById(
    "footer-newsletter-form",
  ) as HTMLFormElement;

  const action = async (formData: FormData) => {
    const result = await actions.signupEmailList.resend(formData);

    if (result.error) {
      const errorDiv = document.getElementById(
        "newsletter-error",
      ) as HTMLElement;
      const errorText = document.getElementById(
        "newsletter-error-text",
      ) as HTMLElement;

      const message =
        result.error instanceof Error
          ? result.error.message
          : "Something went wrong, please try again.";
      errorText.textContent = message;
      errorDiv.classList.remove("hidden");

      const successDiv = document.getElementById(
        "newsletter-success",
      ) as HTMLElement;
      successDiv.classList.add("hidden");
    } else {
      const successDiv = document.getElementById(
        "newsletter-success",
      ) as HTMLElement;
      const errorDiv = document.getElementById(
        "newsletter-error",
      ) as HTMLElement;

      successDiv.classList.remove("hidden");
      errorDiv.classList.add("hidden");
      form.reset();
    }
  };

  attachFormListeners(form, action);
});
