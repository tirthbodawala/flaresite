import { AppContext } from "@/types";
import { OpenAPIHono, RouteHandler, createRoute, z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { HeadersSchema } from "./schemas/headers.scheme";
import { ListQuerySchema } from "./schemas/listQuery.schema";

type OpenAPIRouteConfig = Parameters<typeof createRoute>[0];
type Method = OpenAPIRouteConfig["method"];

// Base response schemas
const baseErrorResponse = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.unknown()).optional(),
});

const baseSuccessResponse = <T extends z.ZodSchema>(schema: T) => schema;

// Error response types
const ERROR_RESPONSES = {
  VALIDATION: { status: 400, description: "Validation Error" },
  UNAUTHORIZED: { status: 401, description: "Unauthorized Access" },
  FORBIDDEN: { status: 403, description: "Forbidden" },
  NOT_FOUND: { status: 404, description: "Resource Not Found" },
  CONFLICT: { status: 409, description: "Conflict" },
  SERVER_ERROR: { status: 500, description: "Internal Server Error" },
} as const;

const defaultMethodStatusMapping: Record<Method, number> = {
  get: 200,
  post: 201,
  put: 200,
  patch: 200,
  delete: 204,
  options: 204,
  head: 200,
  trace: 200,
};

interface RouteConfig<T extends z.ZodSchema> extends OpenAPIRouteConfig {
  resource: string;
  responseSchema: T;
  handler: RouteHandler<RouteConfig<T>, AppContext>;
  requiresAuth?: boolean;
  cache?: {
    enabled?: boolean;
    maxAge?: number;
    private?: boolean;
  };
}

const generateSummary = (method: Method, resource: string) => {
  const action =
    method === "get"
      ? "Retrieve"
      : method === "post"
        ? "Create"
        : method === "put" || method === "patch"
          ? "Update"
          : "Delete";

  return `${action} ${resource}`;
};

const generateDescription = (method: Method, resource: string) => {
  return `${generateSummary(method, resource)} resource operation.`;
};

export const createEndpoint = <T extends z.ZodSchema>({
  resource,
  method,
  path,
  responseSchema,
  handler,
  summary,
  description,
  request,
  requiresAuth = true,
  cache = { enabled: false, maxAge: 0, private: true },
}: RouteConfig<T>) => {
  const route = new OpenAPIHono<AppContext>();

  // Check for method get without variables in the path
  const isListRoute = method === "get" && !/\{\w+\}/.test(path);
  const isEditRoute = method === "put" && /\{\w+\}/.test(path);
  const isDeleteRoute = method === "delete" && /\{\w+\}/.test(path);
  const isCreateRoute = method === "post" && !/\{\w+\}/.test(path);
  const isGetByIdRoute = method === "get" && /\{\w+\}/.test(path);

  const variables = path.match(/\{\w+\}/g);
  let querySchema = request?.query;
  let paramsSchema = request?.params;

  // if the method is get and the path does not contain curly braces for variables then it is a list route which requires ListQuerySchema
  if (!querySchema && isListRoute) {
    querySchema = ListQuerySchema;
  }

  /**
   * if the method is get and the path contains curly braces for variables then it is a get by id route which requires a single variable in the path
   * if the method is put or delete and the path contains curly braces for variables then it is an edit or delete route which requires a single variable in the path
   */
  if (
    !paramsSchema &&
    (isGetByIdRoute || isEditRoute || isDeleteRoute) &&
    variables &&
    variables.length === 1
  ) {
    paramsSchema = z.object({
      [variables[0]]: z
        .string()
        .uuid()
        .openapi({
          description: `Unique identifier of the ${resource} resource`,
          example: "01957ff9-01b5-748f-a7ed-15efee52c158",
        }),
    });
  }

  const successStatus = defaultMethodStatusMapping[method];
  const responses = {
    [successStatus]: {
      description: generateDescription(method, resource),
      schema: {
        "application/json": baseSuccessResponse(responseSchema),
      },
    },
    400: {
      description: ERROR_RESPONSES.VALIDATION.description,
      schema: { "application/json": baseErrorResponse },
    },
    ...(requiresAuth
      ? {
          401: {
            description: ERROR_RESPONSES.UNAUTHORIZED.description,
            schema: { "application/json": baseErrorResponse },
          },
        }
      : {}),
    ...(requiresAuth
      ? {
          403: {
            description: ERROR_RESPONSES.FORBIDDEN.description,
            schema: { "application/json": baseErrorResponse },
          },
        }
      : {}),
    ...(isListRoute || isCreateRoute
      ? {
          404: {
            description: ERROR_RESPONSES.NOT_FOUND.description,
            schema: { "application/json": baseErrorResponse },
          },
        }
      : {}),
    409: {
      description: ERROR_RESPONSES.CONFLICT.description,
      schema: { "application/json": baseErrorResponse },
    },
    500: {
      description: ERROR_RESPONSES.SERVER_ERROR.description,
      schema: { "application/json": baseErrorResponse },
    },
  };

  const tags = [
    resource
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
  ];

  const routeDefinition = createRoute({
    method,
    path,
    summary: summary || generateSummary(method, resource),
    description: description || generateDescription(method, resource),
    tags,
    security: requiresAuth ? [{ Bearer: [] }] : undefined,
    request: {
      headers: requiresAuth ? HeadersSchema : undefined,
      body: request?.body,
      query: querySchema,
      params: paramsSchema,
    },
    responses,
  });

  const wrappedHandler: RouteHandler<RouteConfig<T>, AppContext> = async (
    c,
  ) => {
    try {
      const response = await handler(c, next);

      if (cache.enabled && response instanceof Response) {
        response.headers.set(
          "Cache-Control",
          `max-age=${cache.maxAge}${cache.private ? ", private" : ""}`,
        );
      }

      return response;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            success: false,
            message: ERROR_RESPONSES.VALIDATION.description,
            errors: error.errors,
          },
          ERROR_RESPONSES.VALIDATION.status,
        );
      }

      return c.json(
        { success: false, message: ERROR_RESPONSES.SERVER_ERROR.description },
        ERROR_RESPONSES.SERVER_ERROR.status,
      );
    }
  };

  route.openapi(routeDefinition, wrappedHandler);

  return route;
};
