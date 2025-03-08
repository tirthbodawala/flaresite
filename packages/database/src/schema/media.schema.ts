import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { usersSchema } from './users.schema';

export const mediaSchema = sqliteTable('media', {
  id: text('id').primaryKey(),
  filePath: text('file_path').notNull(),
  mimeType: text('mime_type').notNull(),
  altText: text('alt_text'),
  width: integer('width'),
  height: integer('height'),
  size: integer('size'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  createdBy: text('created_by').references(() => usersSchema.id, {
    onDelete: 'set null',
  }),
});
