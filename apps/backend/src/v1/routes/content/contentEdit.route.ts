import { z, createRoute, RouteHandler } from "@hono/zod-openapi";
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

// Enum validation
const ContentTypeEnum = z.enum(["post", "page"]);
const StatusEnum = z.enum(["draft", "published", "private"]);

// Update schema
export const editContentSchema = z.object({
  title: z.string().min(3).max(255),
  shortId: z
    .string()
    .regex(/^[A-Za-z0-9]{4,8}$/, "Short ID must be 4-8 alphanumeric characters")
    .optional(),
  slug: z.string().optional(), // Auto-generated if missing
  content: z.string().optional(),
  status: StatusEnum.default("draft"),
  type: ContentTypeEnum.default("post"),
  authorId: z.string().optional(), // Should reference existing users
  publishedAt: z.string().datetime().optional().nullable(), // ISO 8601 format
});

// Define route
export const contentEditRoute = createRoute({
  method: "put",
  path: "/api/v1/content/{id}",
  tags: ["Content"],
  summary: "Fully update an existing content entry",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    headers: HeadersSchema,
    params: z.object({
      id: z.string(), // Content ID
    }),
    body: {
      content: {
        "application/json": {
          schema: editContentSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Content updated successfully",
      content: {
        "application/json": {
          schema: ContentSchema,
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
    404: {
      description: "Content not found",
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

// Define handler
export const contentEditHandler: RouteHandler<
  typeof contentEditRoute,
  AppContext
> = async (c) => {
  const editableContent = c.var.can("content", "edit");
  const userId = c.var.user?.id;
  if (!userId || !editableContent) {
    throw new ApiError(403, "Forbidden");
  }

  const db = initDBInstance(c.env, c.env);

  // Validate params
  const { id } = c.req.valid("param");
  const validated = c.req.valid("json");

  // Check if content exists
  const existingContent = await db.content.getById(id);
  if (!existingContent) {
    throw new ApiError(404, "Content not found");
  }

  // Update values
  const updatedContent = {
    ...existingContent,
    type: validated.type,
    title: validated.title,
    slug: validated.slug ? slugify(validated.slug) : slugify(validated.title),
    content: validated.content ?? existingContent.content,
    shortId: validated.shortId ?? existingContent.shortId,
    authorId: validated.authorId ?? existingContent.authorId,
    status: validated.status,
    publishedAt: validated.publishedAt ?? existingContent.publishedAt,
  };

  const data = await db.content.update(id, updatedContent);
  return c.json(data, 200);
};
