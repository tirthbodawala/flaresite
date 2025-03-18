import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { initDBInstance } from "@flarekit/database";
import {
  UserRegisterSchema,
  UserLoginResponseSchema,
} from "@v1/schemas/user.schema";
import {
  BadRequestErrorSchema,
  ServerErrorSchema,
} from "@v1/schemas/error.schema";
import { SignJWT } from "jose";
import type { AppContext } from "@/types";

// 1) Define the route using createRoute
export const userRegisterRoute = createRoute({
  method: "post",
  path: "/api/v1/register",
  summary: "Register a new user (self-signup)",
  tags: ["User"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UserRegisterSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Successfully registered the user",
      content: {
        "application/json": {
          schema: UserLoginResponseSchema,
        },
      },
    },
    400: {
      description: "Bad Request",
      content: { "application/json": { schema: BadRequestErrorSchema } },
    },
    500: {
      description: "Internal Server Error",
      content: { "application/json": { schema: ServerErrorSchema } },
    },
  },
});

// 3) The Handler
export const userRegisterHandler: RouteHandler<
  typeof userRegisterRoute,
  AppContext
> = async (c) => {
  // a) Get DB or Service instance
  const db = initDBInstance(c.env, c.env);

  // b) Validate request body
  const validated = c.req.valid("json");

  // c) Force the role to 'subscriber', ignoring any user-supplied role
  const newUser = await db.users.createUser({
    ...validated,
    role: "subscriber",
  });

  const secretKey = new TextEncoder().encode(c.env.JWT_SECRET);

  const token = await new SignJWT({
    sub: newUser.id,
    role: newUser.role,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    email: newUser.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secretKey);

  // 5) Return the created user plus the token
  // Make sure not to return passwordHash or sensitive fields
  return c.json(
    {
      ...newUser,
      token,
    },
    201,
  );
};
