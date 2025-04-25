import { createRoute, z, type RouteHandler } from "@hono/zod-openapi";
import { initDBInstance } from "@flarekit/database";
import { UserPublicSchema } from "@v1/schemas/user.schema";
import {
  BadRequestErrorSchema,
  ForbiddenErrorSchema,
  NotFoundErrorSchema,
  ServerErrorSchema,
} from "@v1/schemas/error.schema";
import type { AppContext } from "@/types";
import { HeadersSchema } from "@/v1/schemas/headers.scheme";
import { ApiError } from "@/classes/ApiError.class";

// Define the route using createRoute
export const authorsGetByIdRoute = createRoute({
  method: "get",
  path: "/api/v1/authors/{id}",
  summary: "Get a single author resource by ID",
  tags: ["User"],
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
      description: "Successfully retrieved user resource",
      content: {
        "application/json": {
          schema: UserPublicSchema,
        },
      },
    },
    400: {
      description: "Invalid request parameters",
      content: { "application/json": { schema: BadRequestErrorSchema } },
    },
    404: {
      description: "Author not found",
      content: { "application/json": { schema: NotFoundErrorSchema } },
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

export const authorsGetByIdHandler: RouteHandler<
  typeof authorsGetByIdRoute,
  AppContext
> = async (c) => {
  if (!c.var.can("authors", "show")) {
    throw new ApiError(403, "You do not have permission to view user");
  }
  const db = initDBInstance(c.env, c.env);
  const { id } = c.req.valid("param");

  // Fetch the user resource by ID
  const user = await db.users.getById(id);

  if (!user) {
    return c.json(
      {
        status: 404,
        message: `No author found with ID: ${id}`,
        details: [],
      },
      404,
    );
  }

  return c.json(user, 200);
};
