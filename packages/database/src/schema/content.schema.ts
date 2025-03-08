import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { usersSchema } from './users.schema';

export const contentSchema = sqliteTable(
  'content',
  {
    id: text('id').primaryKey(),
    shortId: text('short_id').notNull().unique(),
    type: text('type', { enum: ['post', 'page'] })
      .notNull()
      .default('post'),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    content: text('content'),
    status: text('status', { enum: ['draft', 'published', 'private'] }).default(
      'draft',
    ),
    authorId: text('author_id').references(() => usersSchema.id, {
      onDelete: 'cascade',
    }),
    deletedAt: text('deleted_at'),
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
    publishedAt: text('published_at'),
  },
  (t) => [
    index('idx_content_slug').on(t.slug),
    index('idx_content_author_id').on(t.authorId),
  ],
);
