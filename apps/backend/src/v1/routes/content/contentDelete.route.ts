/** Create a route to delete a content item */

import { z, createRoute, RouteHandler } from "@hono/zod-openapi";
import { ContentSchema } from "@v1/schemas/content.schema";
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

// Define request schema
const deleteContentSchema = z.object({
  id: z.string().min(1),
});

// Define the route using createRoute
export const contentDeleteByIdRoute = createRoute({
  method: "delete",
  path: "/api/v1/content/{id}",
  summary: "Delete a single content resource by ID",
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
      description: "Successfully deleted content resource",
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

export const contentDeleteByIdHandler: RouteHandler<
  typeof contentDeleteByIdRoute,
  AppContext
> = async (c) => {
  const deleteContent = c.var.can("content", "delete");
  const deleteOthersContent = c.var.can("content", "deleteOthers");
  const user = c.var.user;
  if (!deleteContent && !deleteOthersContent) {
    throw new ApiError(403, "Forbidden");
  }
  const db = initDBInstance(c.env, c.env);
  const { id } = c.req.valid("param");

  const contentData = await db.content.getById(id);

  if (!contentData) {
    throw new ApiError(404, "Content not found");
  }

  if (contentData.authorId !== user?.id && !deleteOthersContent) {
    throw new ApiError(403, "Forbidden");
  }

  const content = await db.content.delete(id);

  return c.json(content, 200);
};
