import { createRoute, z, type RouteHandler } from '@hono/zod-openapi';
import { initDBInstance } from '@flarekit/database';
import { UserPublicSchema } from '@v1/schemas/user.schema';
import {
  BadRequestErrorSchema,
  ServerErrorSchema,
} from '@v1/schemas/error.schema';
import { ListQuerySchema } from '@v1/schemas/listQuery.schema';

// Define the route using createRoute
export const userListRoute = createRoute({
  method: 'get',
  path: '/api/v1/user',
  summary: 'List User with pagination, sorting, and filtering',
  tags: ['User'],
  request: {
    query: ListQuerySchema,
  },
  responses: {
    200: {
      description: 'Successfully fetched user list',
      content: {
        'application/json': { schema: z.array(UserPublicSchema) },
      },
    },
    400: {
      description: 'Invalid request parameters',
      content: { 'application/json': { schema: BadRequestErrorSchema } },
    },
    500: {
      description: 'Internal Server Error',
      content: { 'application/json': { schema: ServerErrorSchema } },
    },
  },
});

// Handler Function
export const userListHandler: RouteHandler<
  typeof userListRoute,
  { Bindings: Env }
> = async (c) => {
  const db = initDBInstance(c.env, c.env);
  const { range, sort, filter } = c.req.valid('query');

  const parsedRange = range ? JSON.parse(range) : [0, 9];
  const parsedSort = sort ? JSON.parse(sort) : ['createdAt', 'DESC'];
  const parsedFilter = filter ? JSON.parse(filter) : {};

  // Fetch paginated user
  const userList = await db.users.getList(
    parsedRange,
    parsedSort,
    parsedFilter,
  );
  const totalItems = userList.length;

  return c.json(userList, 200, {
    // Set User-Range header (important for React-Admin)
    'User-Range': `user ${parsedRange[0]}-${parsedRange[1]}/${totalItems}`,
    'Access-Control-Expose-Headers': 'User-Range', // Ensures React-Admin can read it
  });
};
