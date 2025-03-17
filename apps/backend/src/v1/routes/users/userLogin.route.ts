import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { initDBInstance } from '@flarekit/database';
import {
  UserLoginSchema,
  UserLoginResponseSchema,
} from '@v1/schemas/user.schema';
import {
  BadRequestErrorSchema,
  ServerErrorSchema,
  UnauthorizedErrorSchema,
} from '@v1/schemas/error.schema';
import { SignJWT } from 'jose';
import { ApiError } from '../../../classes/ApiError.class';

// 1) Define the route using createRoute
export const userLoginRoute = createRoute({
  method: 'post',
  path: '/api/v1/login',
  summary: 'Authenticate a user (Login)',
  tags: ['User'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: UserLoginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successfully authenticated the user',
      content: {
        'application/json': {
          schema: UserLoginResponseSchema,
        },
      },
    },
    401: {
      description: 'Invalid credentials',
      content: {
        'application/json': {
          schema: UnauthorizedErrorSchema,
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

// 3) The Handler
export const userLoginHandler: RouteHandler<
  typeof userLoginRoute,
  { Bindings: Env }
> = async (c) => {
  // a) Get DB or Service instance
  const db = initDBInstance(c.env, c.env);

  // b) Validate request body
  const validated = c.req.valid('json');

  // c) Force the role to 'subscriber', ignoring any user-supplied role
  const user = await db.users.verifyCredentials(
    validated.usernameOrEmail,
    validated.plainPassword,
  );

  if (!user) {
    throw new ApiError(401, 'Invalid credentails');
  }

  const secretKey = new TextEncoder().encode(c.env.JWT_SECRET);

  const token = await new SignJWT({
    sub: user.id,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secretKey);

  // 5) Return the created user plus the token
  // Make sure not to return passwordHash or sensitive fields
  return c.json(
    {
      ...user,
      token,
    },
    200,
  );
};
