import { reference, z } from "astro:content";

export const dateSchema = z.object({
  datePublished: z.object({
    dateTime: z.string().datetime({
      message: "Must be a valid ISO 8601 string with optional offset",
      offset: true,
    }),
    author: reference("people").optional(),
  }),
  dateModified: z
    .object({
      dateTime: z.string().datetime({
        message: "Must be a valid ISO 8601 string with optional offset",
        offset: true,
      }),
      author: reference("people").optional(),
    })
    .optional(),
  dateArchived: z
    .object({
      dateTime: z.string().datetime({
        message: "Must be a valid ISO 8601 string with optional offset",
        offset: true,
      }),
      author: reference("people").optional(),
    })
    .optional(),
  dateCreated: z
    .object({
      dateTime: z.string().datetime({
        message: "Must be a valid ISO 8601 string with optional offset",
        offset: true,
      }),
      author: reference("people").optional(),
    })
    .optional(),
});
