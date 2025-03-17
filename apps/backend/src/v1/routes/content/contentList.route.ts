import { createRoute, z, type RouteHandler } from '@hono/zod-openapi';
import { initDBInstance } from '@flarekit/database';
import { ContentSchema } from '@v1/schemas/content.schema';
import {
  BadRequestErrorSchema,
  ServerErrorSchema,
} from '@v1/schemas/error.schema';
import { ListQuerySchema } from '@v1/schemas/listQuery.schema';

// Define the route using createRoute
export const contentListRoute = createRoute({
  method: 'get',
  path: '/api/v1/content',
  summary: 'List Content with pagination, sorting, and filtering',
  tags: ['Content'],
  request: {
    query: ListQuerySchema,
  },
  responses: {
    200: {
      description: 'Successfully fetched content list',
      content: {
        'application/json': {
          schema: z.array(ContentSchema),
        },
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
export const contentListHandler: RouteHandler<
  typeof contentListRoute,
  { Bindings: Env }
> = async (c) => {
  const db = initDBInstance(c.env, c.env);
  const { range, sort, filter } = c.req.valid('query');

  const parsedRange = range ? JSON.parse(range) : [0, 9];
  const parsedSort = sort ? JSON.parse(sort) : ['createdAt', 'DESC'];
  const parsedFilter = filter ? JSON.parse(filter) : {};

  // Fetch paginated content
  const contentList = await db.content.getList(
    parsedRange,
    parsedSort,
    parsedFilter,
  );
  const totalItems = contentList.length;

  return c.json(contentList, 200, {
    // Set Content-Range header (important for React-Admin)
    'Content-Range': `content ${parsedRange[0]}-${parsedRange[1]}/${totalItems}`,
    'Access-Control-Expose-Headers': 'Content-Range', // Ensures React-Admin can read it
  });
};
