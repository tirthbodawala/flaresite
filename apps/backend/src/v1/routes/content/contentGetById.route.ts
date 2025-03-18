import { createRoute, z, type RouteHandler } from "@hono/zod-openapi";
import { initDBInstance } from "@flarekit/database";
import { ContentSchema } from "@v1/schemas/content.schema";
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
export const contentGetByIdRoute = createRoute({
  method: "get",
  path: "/api/v1/content/{id}",
  summary: "Get a single content resource by ID",
  tags: ["Content"],
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    headers: HeadersSchema,
    params: z.object({
      id: z.string().uuid().openapi({
        description: "Unique identifier of the content resource",
        example: "01957ff9-01b5-748f-a7ed-15efee52c158",
      }),
    }),
  },
  responses: {
    200: {
      description: "Successfully retrieved content resource",
      content: {
        "application/json": {
          schema: ContentSchema,
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
      description: "Resource not found",
      content: { "application/json": { schema: NotFoundErrorSchema } },
    },
    500: {
      description: "Internal Server Error",
      content: { "application/json": { schema: ServerErrorSchema } },
    },
  },
});

export const contentGetByIdHandler: RouteHandler<
  typeof contentGetByIdRoute,
  AppContext
> = async (c) => {
  const viewContent = c.var.can("view_content");
  const viewOthersContent = c.var.can("view_others_content");
  const user = c.var.user;
  if (!viewContent && !viewOthersContent) {
    throw new ApiError(403, "Forbidden");
  }
  const db = initDBInstance(c.env, c.env);
  const { id } = c.req.valid("param");

  // Fetch the content resource by ID
  const content = await db.content.getById(id);

  if (!viewOthersContent && content?.authorId !== user?.id) {
    throw new ApiError(403, "Forbidden");
  }

  if (!content) {
    return c.json(
      {
        status: 404,
        message: `No content found with ID: ${id}`,
        details: [],
      },
      404,
    );
  }

  return c.json(content, 200);
};
