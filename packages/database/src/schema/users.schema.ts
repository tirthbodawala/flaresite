import { sqliteTable, text, index, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const usersSchema = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(), // UUID v7
    username: text('username').notNull().unique(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', {
      enum: ['admin', 'editor', 'author', 'subscriber'],
    }).default('subscriber'),
    firstName: text('first_name'),
    lastName: text('last_name'),
    jsonLd: text('json_ld'),
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
    deletedAt: text('deleted_at'),
  },
  (t) => [
    index('idx_users_email').on(t.email),
    unique('idx_users_email_deleted_unique').on(t.email, t.deletedAt),
  ],
);
