import { createRoute, z, type RouteHandler } from "@hono/zod-openapi";
import { initDBInstance } from "@flarekit/database";
import { UserPublicSchema } from "@v1/schemas/user.schema";
import {
  BadRequestErrorSchema,
  ForbiddenErrorSchema,
  ServerErrorSchema,
} from "@v1/schemas/error.schema";
import { ListQuerySchema } from "@v1/schemas/listQuery.schema";
import type { AppContext } from "@/types";
import { HeadersSchema } from "@/v1/schemas/headers.scheme";
import { ApiError } from "@/classes/ApiError.class";

// Define the route using createRoute
export const authorsListRoute = createRoute({
  method: "get",
  path: "/api/v1/authors",
  summary: "List authors with pagination, sorting, and filtering",
  tags: ["User"],
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    headers: HeadersSchema,
    query: ListQuerySchema,
  },
  responses: {
    200: {
      description: "Successfully fetched authors list",
      content: {
        "application/json": { schema: z.array(UserPublicSchema) },
      },
    },
    400: {
      description: "Invalid request parameters",
      content: { "application/json": { schema: BadRequestErrorSchema } },
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
      content: { "application/json": { schema: ServerErrorSchema } },
    },
  },
});

// Handler Function
export const authorsListHandler: RouteHandler<
  typeof authorsListRoute,
  AppContext
> = async (c) => {
  const canViewUsers = c.var.can("view_authors");
  if (!canViewUsers) {
    throw new ApiError(403, "You do not have permission to view users");
  }
  const db = initDBInstance(c.env, c.env);
  const { range, sort, filter } = c.req.valid("query");

  const parsedRange = range ? JSON.parse(range) : [0, 9];
  const parsedSort = sort ? JSON.parse(sort) : ["createdAt", "DESC"];
  const parsedFilter = filter ? JSON.parse(filter) : {};

  // Fetch paginated user
  const userList = await db.users.getList(
    parsedRange,
    parsedSort,
    parsedFilter,
  );
  const totalItems = await db.users.getCount(parsedFilter);

  return c.json(userList, 200, {
    // Set Content-Range header (important for React-Admin)
    "Content-Range": `authors ${parsedRange[0]}-${parsedRange[1]}/${totalItems}`,
    "Access-Control-Expose-Headers": "Content-Range", // Ensures React-Admin can read it
  });
};
