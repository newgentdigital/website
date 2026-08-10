import { z } from "astro/zod";
import { ActionError, defineAction } from "astro:actions";
import { RESEND_API_KEY } from "astro:env/server";
import { Resend } from "resend";

export const signupEmailList = {
  resend: defineAction({
    accept: "form",
    input: z.object({
      email: z.email("Must be a valid email address"),
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
};
