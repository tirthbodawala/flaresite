import { z } from '@hono/zod-openapi';

// Shared fields for a user (regardless of public vs. create vs. update)
const BaseUserFields = z.object({
  username: z.string().min(1).openapi({ example: 'alex' }),
  email: z.string().email().openapi({ example: 'alex@example.com' }),
  role: z
    .enum(['admin', 'editor', 'author', 'subscriber'])
    .openapi({ example: 'author' }),
  firstName: z.string().nullable().optional().openapi({ example: 'Alex' }),
  lastName: z.string().nullable().optional().openapi({ example: 'Johnson' }),
  createdAt: z
    .string()
    .nullable()
    .optional()
    .openapi({ example: '2025-03-10 09:00:00' }),
});

export const UserPublicSchema = BaseUserFields.extend({
  id: z.string().openapi({ example: '01957fc3-1239-7fb3-9df5-8914cd9c9172' }),
  // and so forth (e.g., updatedAt, deletedAt, etc.) if you want them publicly visible
}).openapi('User.Public');

export const UserCreateSchema = BaseUserFields.pick({
  // For create, we definitely want username & email
  username: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
})
  .extend({
    firstName: z.string().openapi({ example: 'Alex' }),
    // We add 'plainPassword' for the creation process
    plainPassword: z.string().min(6).openapi({ example: 'MySecureP@ss' }),
  })
  .openapi('User.Create');

export const UserUpdateSchema = BaseUserFields.partial()
  .extend({
    // If the user wants to update the password
    plainPassword: z
      .string()
      .min(6)
      .optional()
      .openapi({ example: 'MyNewP@ssw0rd' }),
  })
  .omit({
    // Possibly omit 'createdAt' if your service handles timestamps
    createdAt: true,
  })
  .openapi('User.Update');

export const UserLoginSchema = z
  .object({
    usernameOrEmail: z.string().openapi({ example: 'alex' }),
    plainPassword: z.string().min(6).openapi({ example: 'MySecureP@ss' }),
  })
  .openapi('User.Login');

export const UserRegisterSchema = BaseUserFields.pick({
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  // If you only want them to be 'subscriber', you can exclude role
})
  .extend({
    firstName: z.string().openapi({ example: 'Alex' }),
    plainPassword: z.string().min(6).openapi({ example: 'MySecureP@ss' }),
  })
  .openapi('User.Register');

export const UserLoginResponseSchema = UserPublicSchema.extend({
  token: z.string(),
}).openapi('User.LoginResponse');
