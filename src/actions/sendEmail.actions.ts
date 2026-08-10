import { z } from "astro/zod";
import { ActionError, defineAction } from "astro:actions";
import { RESEND_API_KEY } from "astro:env/server";
import { hash } from "crypto";
import { Resend } from "resend";

export const sendEmail = {
  resend: defineAction({
    accept: "form",
    input: z.object({
      from: z.email("Must be a valid From email address").optional(),
      to: z.array(z.email("Must be a valid To email address")),
      subject: z.string().min(1, "Subject is required"),
      bcc: z.array(z.email("Must be a valid BCC email address")).optional(),
      cc: z.array(z.email("Must be a valid CC email address")).optional(),
      replyTo: z.email("Must be a valid Reply-To email address").optional(),
      html: z.string().min(1, "Email HTML body is required"),
      text: z.string().optional(),
    }),

    handler: async (input) => {
      const resend = new Resend(RESEND_API_KEY);

      try {
        const { data, error } = await resend.emails.send(
          {
            from: input.from || "www@re.newgent.digital",
            to: input.to,
            subject: input.subject,
            bcc: input.bcc,
            cc: input.cc,
            replyTo: input.replyTo || "hey@newgent.digital",
            html: input.html,
            text: input.text,
          },
          {
            idempotencyKey: hash("sha512", JSON.stringify(input)),
          },
        );

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
