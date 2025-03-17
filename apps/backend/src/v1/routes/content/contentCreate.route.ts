import { z, createRoute, RouteHandler } from '@hono/zod-openapi';
import { ContentSchema } from '@v1/schemas/content.schema';
import {
  BadRequestErrorSchema,
  ServerErrorSchema,
} from '@v1/schemas/error.schema';
import { initDBInstance } from '@flarekit/database';
import { slugify } from '@flarekit/database';

// Define request schema
const createContentSchema = z.object({
  title: z.string().min(3).max(255),
  content: z.string().min(10),
  authorId: z.string().uuid(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
});

// Create route
export const contentCreateRoute = createRoute({
  method: 'post',
  path: '/api/v1/content',
  tags: ['Content'],
  description: 'Create a new content entry',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createContentSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Content created successfully',
      content: {
        'application/json': {
          schema: ContentSchema,
        },
      },
    },
    400: {
      description: 'Invalid request body',
      content: {
        'application/json': {
          schema: BadRequestErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: ServerErrorSchema,
        },
      },
    },
  },
});

export const contentCreateHandler: RouteHandler<
  typeof contentCreateRoute,
  { Bindings: Env }
> = async (c) => {
  const db = initDBInstance(c.env, c.env);
  // Validate request body
  const validated = c.req.valid('json');

  // Insert into database
  const content = {
    title: validated.title,
    slug: slugify(validated.title),
    content: validated.content,
    authorId: validated.authorId,
    tags: validated.tags || [],
    category: validated.category || null,
  };

  const data = await db.content.create(content);
  return c.json(data, 201);
};
