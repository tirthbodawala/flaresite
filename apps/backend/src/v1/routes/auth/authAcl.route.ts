import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { PermissionsResponseSchema } from "@v1/schemas/auth.schema";
import {
  BadRequestErrorSchema,
  ForbiddenErrorSchema,
  ServerErrorSchema,
} from "@v1/schemas/error.schema";
import { ApiError } from "@/classes/ApiError.class";
import type { AppContext } from "@/types";
import { PERMISSIONS } from "@/v1/acl";

// 1) Define the route using createRoute
export const authACLRoute = createRoute({
  method: "get",
  path: "/api/v1/acl",
  summary: "Get Access Control List",
  tags: ["Auth"],
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    200: {
      description: "Successfully fetched access control list",
      content: {
        "application/json": {
          schema: PermissionsResponseSchema,
        },
      },
    },
    400: {
      description: "Bad Request",
      content: { "application/json": { schema: BadRequestErrorSchema } },
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
      content: { "application/json": { schema: ServerErrorSchema } },
    },
  },
});

// 3) The Handler
export const authACLHandler: RouteHandler<
  typeof authACLRoute,
  AppContext
> = async (c) => {
  const canCreateContent = c.var.can("acls", "list");
  const userId = c.var.user?.id;
  if (!userId || !canCreateContent) {
    throw new ApiError(403, "Forbidden");
  }

  return c.json(PERMISSIONS, 200);
};
