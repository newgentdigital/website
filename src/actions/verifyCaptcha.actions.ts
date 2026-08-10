import { z } from "astro/zod";
import { ActionError, defineAction } from "astro:actions";
import { TURNSTILE_SECRET_KEY } from "astro:env/server";

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

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Narrows an untrusted siteverify payload to the fields this action reads.
 *
 * @param value - The parsed JSON body of the siteverify response.
 * @returns True when the payload carries a usable `success` flag.
 */
function isTurnstileResponse(value: unknown): value is TurnstileVerifyResponse {
  if (typeof value !== "object" || value === null) return false;
  if (!("success" in value) || typeof value.success !== "boolean") return false;
  if (!("error-codes" in value)) return true;

  const codes: unknown = value["error-codes"];
  return (
    Array.isArray(codes) && codes.every((code) => typeof code === "string")
  );
}

export const verifyCaptcha = {
  turnstile: defineAction({
    accept: "form",
    input: z.object({
      "cf-turnstile-response": z
        .string()
        .min(1, "Turnstile response token is required"),
      idempotency_key: z.uuidv4("Idempotency Key must be a valid UUIDv4"),
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

        const payload: unknown = await response.json();

        if (!isTurnstileResponse(payload)) {
          throw new ActionError({
            code: "BAD_GATEWAY",
            message: "Unexpected response from the Turnstile siteverify API.",
          });
        }

        if (!payload.success) {
          const errorCodes = payload["error-codes"]?.join(", ") ?? "unknown";
          throw new ActionError({
            code: "BAD_REQUEST",
            message: `Captcha verification failed: ${errorCodes}`,
          });
        }

        return { data: payload };
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
