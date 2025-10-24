import { ActionError, defineAction } from "astro:actions";
import {
  LISTMONK_API_TOKEN,
  LISTMONK_API_USER,
  RESEND_API_KEY,
} from "astro:env/server";
import { z } from "astro:schema";
import { Resend } from "resend";

export const signupEmailList = {
  resend: defineAction({
    accept: "form",
    input: z.object({
      email: z.string().email("Must be a valid email address"),
      audienceId: z.string().min(1, "Audience ID is required"),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    }),

    handler: async (input) => {
      const resend = new Resend(RESEND_API_KEY);

      try {
        const { data, error } = await resend.contacts.create({
          email: input.email,
          audienceId: input.audienceId,
          firstName: input.firstName,
          lastName: input.lastName,
          unsubscribed: false,
        });

        if (error) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: error.message,
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

  listmonk: defineAction({
    accept: "form",
    input: z.object({
      email: z.string().email("Must be a valid email address"),
      name: z.string().optional(),
      lists: z
        .array(z.number().min(1, "List ID is required"))
        .min(1, "At least one List ID is required"),
    }),

    handler: async (input) => {
      try {
        const response = await fetch(`https://list.monks/api/subscribers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${LISTMONK_API_USER}:${LISTMONK_API_TOKEN}`,
          },
          body: JSON.stringify({
            email: input.email,
            lists: input.lists,
            status: "enabled",
            preconfirm_subscriptions: true,
          }),
        });

        if (!response.ok) {
          throw new ActionError({
            code: "BAD_GATEWAY",
            message: response.statusText,
          });
        }

        const data = await response.json();

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
