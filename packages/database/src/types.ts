// types.ts
import { contentSchema } from '@schema/content.schema';
import { usersSchema } from '@schema/users.schema';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

export interface Ctx {
  db: DrizzleD1Database<{
    [contentSchema._.name]: typeof contentSchema;
    [usersSchema._.name]: typeof usersSchema;
  }>;
}
