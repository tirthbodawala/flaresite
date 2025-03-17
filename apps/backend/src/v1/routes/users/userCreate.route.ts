import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { initDBInstance } from '@flarekit/database';
import { UserCreateSchema, UserPublicSchema } from '@v1/schemas/user.schema';
import {
  BadRequestErrorSchema,
  ServerErrorSchema,
} from '@v1/schemas/error.schema';

export const userCreateRoute = createRoute({
  method: 'post',
  path: '/api/v1/user',
  summary: 'Create a new user',
  tags: ['User'],
  request: {
    // Validate request body against UserCreateSchema
    body: {
      content: {
        'application/json': {
          schema: UserCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Successfully created the user',
      // Return a single user with the public schema
      content: {
        'application/json': {
          schema: UserPublicSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: BadRequestErrorSchema } },
    },
    500: {
      description: 'Internal Server Error',
      content: { 'application/json': { schema: ServerErrorSchema } },
    },
  },
});

// Handler
export const userCreateHandler: RouteHandler<
  typeof userCreateRoute,
  { Bindings: Env }
> = async (c) => {
  const db = initDBInstance(c.env, c.env);
  // Validate request body
  const validated = c.req.valid('json');

  // Create the user using your specialized method
  const newUser = await db.users.createUser({
    ...validated,
  });

  // Return the created user in the response
  return c.json(newUser, 201);
};
