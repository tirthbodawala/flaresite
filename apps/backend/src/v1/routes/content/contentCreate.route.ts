import { z, createRoute, RouteHandler } from "@hono/zod-openapi";
import { ContentSchema } from "@v1/schemas/content.schema";
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
const createContentSchema = z.object({
  title: z.string().min(3).max(255),
  content: z.string().min(10),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
});

// Create route
export const contentCreateRoute = createRoute({
  method: "post",
  path: "/api/v1/content",
  tags: ["Content"],
  description: "Create a new content entry",
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
          schema: createContentSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Content created successfully",
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

export const contentCreateHandler: RouteHandler<
  typeof contentCreateRoute,
  AppContext
> = async (c) => {
  const canCreateContent = c.var.can("create_content");
  const userId = c.var.user?.id;
  if (!userId || !canCreateContent) {
    throw new ApiError(403, "Forbidden");
  }

  const db = initDBInstance(c.env, c.env);
  // Validate request body
  const validated = c.req.valid("json");

  // Insert into database
  const content = {
    title: validated.title,
    slug: slugify(validated.title),
    content: validated.content,
    authorId: userId,
    tags: validated.tags || [],
    category: validated.category || null,
  };

  const data = await db.content.create(content);
  return c.json(data, 201);
};
