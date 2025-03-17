import { OpenAPIHono, RouteHandler } from '@hono/zod-openapi';
import { Handler, type Context } from 'hono';
import routesv1 from './v1/routes';
import { swaggerUI } from '@hono/swagger-ui';

import { cors } from 'hono/cors';
import { ZodError } from 'zod';
import { ServiceError } from '@flarekit/database';
import { ContentfulStatusCode } from 'hono/utils/http-status';
import { ApiError } from './classes/ApiError.class';

const handleError = (ex: unknown, c: Context<{ Bindings: Env }>) => {
  if (
    ex instanceof ZodError ||
    (typeof ex === 'object' &&
      ex !== null &&
      'name' in ex &&
      ex.name === 'ZodError')
  ) {
    let e = ex as ZodError;
    return c.json(
      {
        status: 400,
        message:
          e.issues.map((i) => i.message).join(', ') ||
          'Invalid request parameters',
        details: e.issues.map((issue) => ({
          parameter: issue.path.join('.'),
          issue: issue.message,
        })),
      },
      400,
    );
  }

  if (ex instanceof ServiceError) {
    return c.json(ex.toJSON(), ex.status as ContentfulStatusCode);
  }
  if (ex instanceof ApiError) {
    return c.json(ex.toJSON(), ex.status as ContentfulStatusCode);
  }

  console.error('Unexpected Error:', ex);
  return c.json(
    {
      status: 500,
      message: 'An unexpected error occurred',
      details: { stack: ex instanceof Error ? ex.stack?.split('\n') : [] },
    },
    500,
  );
};

// Initialize Hono app with OpenAPI support
const app = new OpenAPIHono<{ Bindings: Env }>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return handleError(result.error, c);
    }
  },
});
app.use(cors());

/**
 * Error handling at app level before context.finshed
 */
app.onError((err, c) => {
  return handleError(err, c);
});

/**
 * Home route for the application
 */
const honoHomeRoute: Handler = (c) => {
  return c.json({
    success: true,
    message: 'Welcome to Flarekit APIs!',
  });
};
app.all('/', honoHomeRoute);

// Register all routes
routesv1.forEach(({ route, handler }) => {
  app.openapi(route, handler as RouteHandler<any, any>);
});

// Serve the OpenAPI documentation at /doc
app.doc('/specification.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Flaresite API',
  },
});

app.get('/docs', swaggerUI({ url: '/specification.json' }));

export { app };

export default {
  fetch: app.fetch,
  /* istanbul ignore next: Cannot test Queue invocation */
  // async queue( batch: MessageBatch, env: Environment, ctx: ExecutionContext)
  async queue(batch): Promise<void> {
    let messages = JSON.stringify(batch.messages);
    console.log(`Consumed from our queue: ${messages}`);
    batch.ackAll();
  },

  /* istanbul ignore next: Cannot test scheduled invocation */
  // scheduled(event: ScheduledEvent, env: Environment, ctx: ExecutionContext)
  // async scheduled(event, env, ctx) {
  //   const db = initDBInstance(ctx, env);
  //   // Pass a promise
  //   ctx.waitUntil(
  //     (async () => {
  //       // Clear the storage every 2th minute
  //       if (event.cron.startsWith('*/2')) {
  //         const storageRecords = await db.storage.listStorageRecords();
  //         // Remove each storage record from
  //         for (const record of storageRecords) {
  //           await env.STORAGE.delete(record.key);
  //         }
  //         await db.storage.clearStorageRecords();
  //       }
  //     })(),
  //   );
  // },
} satisfies ExportedHandler<Env>;
