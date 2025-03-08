import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { contentSchema } from './content.schema';
import { usersSchema } from './users.schema';

export const revisionsSchema = sqliteTable('revisions', {
  id: text('id').primaryKey(),
  contentId: text('content_id').references(() => contentSchema.id, {
    onDelete: 'cascade',
  }),
  revisionContent: text('revision_content').notNull(),
  revisedBy: text('revised_by').references(() => usersSchema.id, {
    onDelete: 'set null',
  }),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});
