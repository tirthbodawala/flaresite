import { z, createRoute, RouteHandler } from "@hono/zod-openapi";
import { TaxonomySchema } from "@v1/schemas/taxonomy.schema";
import {
  BadRequestErrorSchema,
  ForbiddenErrorSchema,
  ServerErrorSchema,
} from "@v1/schemas/error.schema";
import { initDBInstance } from "@flarekit/database";
import { slugify } from "@flarekit/database";
import { HeadersSchema } from "@v1/schemas/headers.scheme";
import type { AppContext } from "@/types";
import { ApiError } from "@/classes/ApiError.class";

// Define request schema
const createTaxonomySchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(["category", "tag"]),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

// Create route
export const taxonomyCreateRoute = createRoute({
  method: "post",
  path: "/api/v1/taxonomies",
  tags: ["Taxonomies"],
  summary: "Create a new taxonomy entry",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    headers: HeadersSchema,
    body: {
      content: {
        "application/json": {
          schema: createTaxonomySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Taxonomy created successfully",
      content: {
        "application/json": {
          schema: TaxonomySchema,
        },
      },
    },
    400: {
      description: "Invalid request body",
      content: {
        "application/json": {
          schema: BadRequestErrorSchema,
        },
      },
    },
    403: {
      description: "Access Denied",
      content: {
        "application/json": {
          schema: ForbiddenErrorSchema,
        },
      },
    },
    500: {
      description: "Internal Server Error",
      content: {
        "application/json": {
          schema: ServerErrorSchema,
        },
      },
    },
  },
});

export const taxonomyCreateHandler: RouteHandler<
  typeof taxonomyCreateRoute,
  AppContext
> = async (c) => {
  const canCreateTaxonomy = c.var.can("taxonomies", "create");
  const userId = c.var.user?.id;
  if (!userId || !canCreateTaxonomy) {
    throw new ApiError(403, "Forbidden");
  }

  const db = initDBInstance(c.env, c.env);
  // Validate request body
  const validated = c.req.valid("json");

  // Insert into database
  const taxonomy = {
    name: validated.name,
    slug: slugify(validated.name),
    type: validated.type,
    description: validated.description || null,
    parentId: validated.parentId || null,
  };

  const data = await db.taxonomies.create(taxonomy);
  return c.json(data, 201);
};
