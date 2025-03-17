import { createRoute, z, type RouteHandler } from '@hono/zod-openapi';
import { initDBInstance } from '@flarekit/database';
import { ContentSchema } from '@v1/schemas/content.schema';
import {
  BadRequestErrorSchema,
  NotFoundErrorSchema,
  ServerErrorSchema,
} from '@v1/schemas/error.schema';

// Define the route using createRoute
export const contentGetByIdRoute = createRoute({
  method: 'get',
  path: '/api/v1/content/{id}',
  summary: 'Get a single content resource by ID',
  tags: ['Content'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Unique identifier of the content resource',
        example: '01957ff9-01b5-748f-a7ed-15efee52c158',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Successfully retrieved content resource',
      content: {
        'application/json': {
          schema: ContentSchema,
        },
      },
    },
    400: {
      description: 'Invalid request parameters',
      content: {
        'application/json': {
          schema: BadRequestErrorSchema,
        },
      },
    },
    404: {
      description: 'Resource not found',
      content: { 'application/json': { schema: NotFoundErrorSchema } },
    },
    500: {
      description: 'Internal Server Error',
      content: { 'application/json': { schema: ServerErrorSchema } },
    },
  },
});

export const contentGetByIdHandler: RouteHandler<
  typeof contentGetByIdRoute,
  { Bindings: Env }
> = async (c) => {
  const db = initDBInstance(c.env, c.env);
  const { id } = c.req.valid('param');

  // Fetch the content resource by ID
  const content = await db.content.getById(id);

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
