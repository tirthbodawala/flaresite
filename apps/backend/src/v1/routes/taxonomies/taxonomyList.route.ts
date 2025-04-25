import { z, createRoute, RouteHandler } from "@hono/zod-openapi";
import { TaxonomySchema } from "@v1/schemas/taxonomy.schema";
import {
  BadRequestErrorSchema,
  ForbiddenErrorSchema,
  ServerErrorSchema,
} from "@v1/schemas/error.schema";
import { initDBInstance } from "@flarekit/database";
import { HeadersSchema } from "@v1/schemas/headers.scheme";
import type { AppContext } from "@/types";
import { ApiError } from "@/classes/ApiError.class";

// Create route
export const taxonomyListRoute = createRoute({
  method: "get",
  path: "/api/v1/taxonomies",
  tags: ["Taxonomies"],
  summary: "List all taxonomies",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    headers: HeadersSchema,
    query: z.object({
      range: z.string().optional(),
      sort: z.string().optional(),
      filter: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "List of taxonomies",
      content: {
        "application/json": {
          schema: z.array(TaxonomySchema),
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

export const taxonomyListHandler: RouteHandler<
  typeof taxonomyListRoute,
  AppContext
> = async (c) => {
  const canViewTaxonomies = c.var.can("taxonomies", "list");
  if (!canViewTaxonomies) {
    throw new ApiError(403, "You do not have permission to view taxonomies");
  }

  const db = initDBInstance(c.env, c.env);
  const { range, sort, filter } = c.req.valid("query");

  const parsedRange = range ? JSON.parse(range) : [0, 9];
  const parsedSort = sort ? JSON.parse(sort) : [];
  const parsedFilter = filter ? JSON.parse(filter) : {};

  // Fetch paginated taxonomies
  const taxonomyList = await db.taxonomies.getList(
    parsedRange,
    parsedSort,
    parsedFilter,
  );
  const totalItems = await db.taxonomies.getCount(parsedFilter);

  return c.json(taxonomyList, 200, {
    "Content-Range": `taxonomies ${parsedRange[0]}-${parsedRange[1]}/${totalItems}`,
    "Access-Control-Expose-Headers": "Content-Range",
  });
};
