import { createRoute, RouteHandler } from "@hono/zod-openapi";
import { ContentSchema } from "@v1/schemas/content.schema";
import {
  BadRequestErrorSchema,
  ForbiddenErrorSchema,
  NotFoundErrorSchema,
  ServerErrorSchema,
} from "@v1/schemas/error.schema";
import { initDBInstance } from "@flarekit/database";
import { slugify } from "@flarekit/database";
import { HeadersSchema } from "@v1/schemas/headers.scheme";
import type { AppContext } from "@/types";
import { ApiError } from "@/classes/ApiError.class";
import { z } from "@hono/zod-openapi";

const ContentTypeEnum = z.enum(["post", "page"]);
const StatusEnum = z.enum(["draft", "published", "private"]);

// Partial Update Schema
export const updateContentSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  shortId: z
    .string()
    .regex(/^[A-Za-z0-9]{4,8}$/, "Short ID must be 4-8 alphanumeric characters")
    .optional(),
  slug: z.string().optional(),
  content: z.string().optional(),
  status: StatusEnum.optional(),
  type: ContentTypeEnum.optional(),
  authorId: z.string().optional(), // Should reference existing users
  publishedAt: z.string().datetime().optional().nullable(), // ISO 8601 format
});

// Define route
export const contentUpdateRoute = createRoute({
  method: "patch", // Partial update
  path: "/api/v1/content/{id}",
  tags: ["Content"],
  summary: "Partially update an existing content entry",
  security: [{ Bearer: [] }],
  request: {
    headers: HeadersSchema,
    params: z.object({ id: z.string() }),
    body: { content: { "application/json": { schema: updateContentSchema } } },
  },
  responses: {
    200: {
      description: "Content updated successfully",
      content: { "application/json": { schema: ContentSchema } },
    },
    400: {
      description: "Invalid request body",
      content: { "application/json": { schema: BadRequestErrorSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ForbiddenErrorSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: NotFoundErrorSchema } },
    },
    500: {
      description: "Internal Server Error",
      content: { "application/json": { schema: ServerErrorSchema } },
    },
  },
});

// Handler function
export const contentUpdateHandler: RouteHandler<
  typeof contentUpdateRoute,
  AppContext
> = async (c) => {
  const canUpdate = c.var.can("content", "edit");
  const userId = c.var.user?.id;
  if (!userId || !canUpdate) throw new ApiError(403, "Forbidden");

  const db = initDBInstance(c.env, c.env);
  const { id } = c.req.valid("param");
  const validated = c.req.valid("json");

  const existingContent = await db.content.getById(id);
  if (!existingContent) throw new ApiError(404, "Content not found");

  // Apply partial updates (only provided fields)
  const updatedContent = {
    ...existingContent,
    ...(validated.title && { title: validated.title }),
    ...(validated.slug && { slug: slugify(validated.slug) }),
    ...(validated.content && { content: validated.content }),
    ...(validated.status && { status: validated.status }),
    ...(validated.type && { type: validated.type }),
    ...(validated.authorId && { authorId: validated.authorId }),
    ...(validated.publishedAt !== undefined && {
      publishedAt: validated.publishedAt,
    }),
  };

  const data = await db.content.update(id, updatedContent);
  return c.json(data, 200);
};
