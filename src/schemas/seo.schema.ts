import { reference, z, type SchemaContext } from "astro:content";

export const seoSchema = ({ image }: SchemaContext) =>
  z.object({
    seoTitle: z.string().max(60, "Must be 60 characters or less").optional(),
    seoDescription: z
      .string()
      .max(160, "Must be 160 characters or less")
      .optional(),
    seoKeywords: z
      .array(z.string().min(2, "Must be at least 2 characters"))
      .optional(),
    seoArticle: z.boolean().optional(),
    seoAuthor: reference("people").optional(),
    seoImage: z
      .object({
        src: image(),
        alt: z.object({
          en: z.string().max(125, "Must be 125 characters or less"),
          sv: z.string().max(125, "Must be 125 characters or less"),
        }),
      })
      .optional(),
  });
