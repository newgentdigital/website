import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { baseSchema, schema } from "./schemas";

const awards = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/awards" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
    }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
    }),
});

const careers = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/careers" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
    }),
});

const clients = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/clients" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
      ...schema.contact.shape,
    }),
});

const culture = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/culture" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
    }),
});

const departments = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/departments" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
      ...schema.contact.shape,
    }),
});

const events = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/events" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
    }),
});

const faq = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/faq" }),
  schema: z.object({}),
});

const financials = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/financials" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
    }),
});

const handbook = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/handbook" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
    }),
});

const legal = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/legal" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
    }),
});

const news = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/news" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
    }),
});

const partners = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/partners" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
      ...schema.contact.shape,
    }),
});

const people = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/people" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
      ...schema.contact.shape,
    }),
});

const plans = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/plans" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
    }),
});

const portfolio = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/portfolio" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
    }),
});

const services = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/services" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
    }),
});

const skills = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/skills" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
    }),
});

const wiki = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/wiki" }),
  schema: ({ image }) =>
    z.object({
      ...baseSchema({ image }),
    }),
});

export const collections = {
  awards,
  blog,
  careers,
  clients,
  culture,
  departments,
  events,
  faq,
  financials,
  handbook,
  legal,
  news,
  partners,
  people,
  plans,
  portfolio,
  services,
  skills,
  wiki,
};
