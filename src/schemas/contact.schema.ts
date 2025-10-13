import { z } from "astro:content";

export const contactSchema = z.object({
  contactEmail: z.string().email().optional(),
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
    .string()
    .url("Must be a valid URL")
    .startsWith("https://", "Must start with https://")
    .optional(),
  contactSocial: z
    .object({
      facebook: z
        .string()
        .url("Must be a valid URL")
        .startsWith(
          "https://www.facebook.com/",
          "Must start with https://www.facebook.com/",
        )
        .optional(),
      github: z
        .string()
        .url("Must be a valid URL")
        .startsWith(
          "https://github.com/",
          "Must start with https://github.com/",
        )
        .optional(),
      instagram: z
        .string()
        .url("Must be a valid URL")
        .startsWith(
          "https://www.instagram.com/",
          "Must start with https://www.instagram.com/",
        )
        .optional(),
      linkedin: z
        .string()
        .url("Must be a valid URL")
        .startsWith(
          "https://www.linkedin.com/",
          "Must start with https://www.linkedin.com/",
        )
        .optional(),
      tiktok: z
        .string()
        .url("Must be a valid URL")
        .startsWith(
          "https://www.tiktok.com/",
          "Must start with https://www.tiktok.com/",
        )
        .optional(),
      twitter: z
        .string()
        .url("Must be a valid URL")
        .startsWith("https://x.com/", "Must start with https://x.com/")
        .optional(),
      youtube: z
        .string()
        .url("Must be a valid URL")
        .startsWith(
          "https://www.youtube.com/",
          "Must start with https://www.youtube.com/",
        )
        .optional(),
    })
    .optional(),
});
