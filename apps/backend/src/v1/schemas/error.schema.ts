import { z } from '@hono/zod-openapi';

export const BaseErrorSchema = z.object({
  status: z.number(),
  message: z.string(),
  details: z
    .array(
      z.object({
        parameter: z.string(),
        issue: z.string(),
      }),
    )
    .optional(),
});

export const BadRequestErrorSchema = BaseErrorSchema.extend({
  status: z.number().default(400),
}).openapi('Error.BadRequest', {});

export const ServerErrorSchema = BaseErrorSchema.extend({
  status: z.number().default(500),
  details: z.object({
    stack: z.array(z.string()),
  }),
}).openapi('Error.ServerError');

export const NotFoundErrorSchema = BaseErrorSchema.extend({
  status: z.number().default(404),
  message: z.string().default('Resource not found.'),
})
  .omit({
    details: true,
  })
  .openapi('Error.NotFoundError');

export const UnauthorizedErrorSchema = BaseErrorSchema.extend({
  status: z.number().default(401),
  message: z.string().default('Invalid credentials'),
})
  .omit({
    details: true,
  })
  .openapi('Error.UnauthorizedError');
