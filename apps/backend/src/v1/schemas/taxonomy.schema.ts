import { z } from "@hono/zod-openapi";

export const TaxonomySchema = z
  .object({
    id: z.string().openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    name: z.string().openapi({ example: "Technology" }),
    slug: z.string().openapi({ example: "technology" }),
    type: z.enum(["category", "tag"]).openapi({ example: "category" }),
    description: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "Technology related content" }),
    parentId: z.string().nullable().optional().openapi({ example: null }),
  })
  .openapi("Taxonomy");
