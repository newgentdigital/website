import type { SchemaContext } from "astro:content";
import { contactSchema } from "./contact.schema";
import { dateSchema } from "./date.schema";
import { seoSchema } from "./seo.schema";

export const schema = {
  awards: "",
  blog: "",
  careers: "",
  clients: "",
  contact: contactSchema,
  culture: "",
  date: dateSchema,
  departments: "",
  events: "",
  faq: "",
  financials: "",
  handbook: "",
  legal: "",
  news: "",
  partners: "",
  people: "",
  plans: "",
  portfolio: "",
  seo: seoSchema,
  services: "",
  skills: "",
  wiki: "",
};

export const baseSchema = ({ image }: SchemaContext) => ({
  ...schema.date.shape,
  ...schema.seo({ image }).shape,
});
