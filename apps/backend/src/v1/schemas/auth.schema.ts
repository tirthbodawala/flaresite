import { z } from "@hono/zod-openapi";
import { BaseUserFields, UserPublicSchema } from "./user.schema";
import { ACTIONS, RESOURCES } from "../acl";

export const AuthLoginSchema = z
  .object({
    usernameOrEmail: z.string().openapi({ example: "alex" }),
    plainPassword: z.string().min(6).openapi({ example: "MySecureP@ss" }),
  })
  .openapi("User.Login");

export const AuthRegisterSchema = BaseUserFields.pick({
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  // If you only want them to be 'subscriber', you can exclude role
})
  .extend({
    firstName: z.string().openapi({ example: "Alex" }),
    plainPassword: z.string().min(6).openapi({ example: "MySecureP@ss" }),
  })
  .openapi("User.Register");

export const AuthLoginResponseSchema = UserPublicSchema.extend({
  token: z.string(),
}).openapi("User.LoginResponse");

// Define a schema for an individual permission based on our ACL definitions.
export const PermissionSchema = z.object({
  action: z.enum(ACTIONS).openapi("Auth.Actions", { example: "list" }),
  resource: z.enum(RESOURCES).openapi("Auth.Resources", { example: "content" }),
});

// Define the overall response schema as a mapping of roles to arrays of permissions.
// This aligns with the PermissionsMap type defined in acl.ts.
export const PermissionsResponseSchema = z
  .object({
    guest: z.array(PermissionSchema),
    admin: z.array(PermissionSchema),
    editor: z.array(PermissionSchema),
    author: z.array(PermissionSchema),
    subscriber: z.array(PermissionSchema),
  })
  .openapi("User.PermissionsResponse");
