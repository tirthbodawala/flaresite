import { z, createRoute, RouteHandler } from "@hono/zod-openapi";
import { TaxonomySchema } from "@v1/schemas/taxonomy.schema";
import {
  BadRequestErrorSchema,
  ForbiddenErrorSchema,
  NotFoundErrorSchema,
  ServerErrorSchema,
} from "@v1/schemas/error.schema";
import { initDBInstance } from "@flarekit/database";
import { HeadersSchema } from "@v1/schemas/headers.scheme";
import type { AppContext } from "@/types";
import { ApiError } from "@/classes/ApiError.class";

// Create route
export const taxonomyGetByIdRoute = createRoute({
  method: "get",
  path: "/api/v1/taxonomies/{id}",
  tags: ["Taxonomies"],
  summary: "Get a taxonomy by ID",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    headers: HeadersSchema,
    params: z.object({
      id: z.string().uuid().openapi({
        description: "Unique identifier of the user resource",
        example: "01957ff9-01b5-748f-a7ed-15efee52c158",
      }),
    }),
  },
  responses: {
    200: {
      description: "Taxonomy details",
      content: {
        "application/json": {
          schema: TaxonomySchema,
        },
      },
    },
    400: {
      description: "Invalid request parameters",
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
    404: {
      description: "Taxonomy not found",
      content: {
        "application/json": {
          schema: NotFoundErrorSchema,
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

export const taxonomyGetByIdHandler: RouteHandler<
  typeof taxonomyGetByIdRoute,
  AppContext
> = async (c) => {
  const canViewTaxonomies = c.var.can("taxonomies", "show");
  if (!canViewTaxonomies) {
    throw new ApiError(403, "You do not have permission to view taxonomies");
  }

  const db = initDBInstance(c.env, c.env);
  const { id } = c.req.valid("param");
  const taxonomy = await db.taxonomies.getById(id);
  if (!taxonomy) {
    throw new ApiError(404, "Taxonomy not found");
  }
  return c.json(taxonomy, 200);
};
