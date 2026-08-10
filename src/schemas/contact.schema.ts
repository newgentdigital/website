import { z } from "astro/zod";

export const contactSchema = z.object({
  contactEmail: z.email().optional(),
  contactPhone: z
    .array(
      z.object({
        label: z.enum(["Phone", "Mobile", "Fax", "Home", "Work", "Other"]),
        number: z.string(),
      }),
    )
    .optional(),
  contactAddress: z
    .array(
      z.object({
        label: z.enum(["HQ", "Office", "Mailing", "Home", "Other"]),
        street: z.string(),
        city: z.string(),
        state: z.string().optional(),
        postalCode: z.string(),
        country: z.string(),
      }),
    )
    .optional(),
  contactWebsite: z
    .url("Must be a valid URL")
    .startsWith("https://", "Must start with https://")
    .optional(),
  contactSocial: z
    .object({
      facebook: z
        .url("Must be a valid URL")
        .startsWith(
          "https://www.facebook.com/",
          "Must start with https://www.facebook.com/",
        )
        .optional(),
      github: z
        .url("Must be a valid URL")
        .startsWith(
          "https://github.com/",
          "Must start with https://github.com/",
        )
        .optional(),
      instagram: z
        .url("Must be a valid URL")
        .startsWith(
          "https://www.instagram.com/",
          "Must start with https://www.instagram.com/",
        )
        .optional(),
      linkedin: z
        .url("Must be a valid URL")
        .startsWith(
          "https://www.linkedin.com/",
          "Must start with https://www.linkedin.com/",
        )
        .optional(),
      tiktok: z
        .url("Must be a valid URL")
        .startsWith(
          "https://www.tiktok.com/",
          "Must start with https://www.tiktok.com/",
        )
        .optional(),
      twitter: z
        .url("Must be a valid URL")
        .startsWith("https://x.com/", "Must start with https://x.com/")
        .optional(),
      youtube: z
        .url("Must be a valid URL")
        .startsWith(
          "https://www.youtube.com/",
          "Must start with https://www.youtube.com/",
        )
        .optional(),
    })
    .optional(),
});
