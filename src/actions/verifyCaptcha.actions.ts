import { ActionError, defineAction } from "astro:actions";
import { TURNSTILE_SECRET_KEY } from "astro:env/server";
import { z } from "astro:schema";

/**
 * Retrieves the client's IP address from the request headers.
 *
 * @param request - The incoming request object.
 * @returns The client's IP address as a string.
 */
export async function getClientIp(request: Request): Promise<string> {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    request.headers.get("X-Real-IP") ||
    ""
  );
}

export const verifyCaptcha = {
  turnstile: defineAction({
    accept: "form",
    input: z.object({
      "cf-turnstile-response": z
        .string()
        .min(1, "Turnstile response token is required"),
      idempotency_key: z
        .string()
        .uuid("Idempotency Key must be a valid UUIDv4")
        .min(1, "Idempotency Key is required"),
    }),

    handler: async (input, context) => {
      try {
        const response = await fetch(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              secret: TURNSTILE_SECRET_KEY,
              response: input["cf-turnstile-response"],
              remoteip: await getClientIp(context.request),
              idempotency_key: input.idempotency_key,
            }),
          },
        );

        if (!response.ok) {
          throw new ActionError({
            code: "BAD_GATEWAY",
            message: response.statusText,
          });
        }

        const data = await (response.json() as Promise<{
          success: boolean;
          "error-codes": string[];
        }>);

        if (!data.success) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: `Captcha verification failed: ${data["error-codes"].join(", ")}`,
          });
        }

        return { data };
      } catch (error) {
        if (error) throw error;
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
        });
      }
    },
  }),
};
