import { hash } from "crypto";
import { ActionError, defineAction } from "astro:actions";
import { FORWARDEMAIL_API_KEY, RESEND_API_KEY } from "astro:env/server";
import { z } from "astro:schema";
import { Resend } from "resend";

export const sendEmail = {
  resend: defineAction({
    accept: "form",
    input: z.object({
      from: z.string().email("Must be a valid From email address").optional(),
      to: z.array(z.string().email("Must be a valid To email address")),
      subject: z.string().min(1, "Subject is required"),
      bcc: z
        .array(z.string().email("Must be a valid BCC email address"))
        .optional(),
      cc: z
        .array(z.string().email("Must be a valid CC email address"))
        .optional(),
      replyTo: z
        .string()
        .email("Must be a valid Reply-To email address")
        .optional(),
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

  forwardEmail: defineAction({
    accept: "form",
    input: z.object({
      from: z.string().email("Must be a valid From email address").optional(),
      to: z.array(z.string().email("Must be a valid To email address")),
      cc: z
        .array(z.string().email("Must be a valid CC email address"))
        .optional(),
      bcc: z
        .array(z.string().email("Must be a valid BCC email address"))
        .optional(),
      subject: z.string().min(1, "Subject is required"),
      text: z.string().optional(),
      html: z.string().min(1, "Email HTML body is required"),
      replyTo: z
        .string()
        .email("Must be a valid Reply-To email address")
        .optional(),
    }),

    handler: async (input) => {
      try {
        const response = await fetch(
          `https://api.forewardemail.net/v1/emails`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${Buffer.from(`${FORWARDEMAIL_API_KEY}:`).toString("base64")}`,
            },
            body: JSON.stringify({
              from: input.from || "www@fe.newgent.digital",
              to: input.to,
              cc: input.cc,
              bcc: input.bcc,
              subject: input.subject,
              text: input.text,
              html: input.html,
              sender: input.from || "www@fe.newgent.digital",
              replyTo: input.replyTo || "hey@newgent.digital",
            }),
          },
        );

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
