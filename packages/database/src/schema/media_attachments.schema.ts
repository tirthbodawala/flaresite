import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { mediaSchema } from './media.schema';
import { usersSchema } from './users.schema';

export const mediaAttachmentsSchema = sqliteTable(
  'media_attachments',
  {
    id: text('id').primaryKey(), // UUID v7
    mediaId: text('media_id').references(() => mediaSchema.id, {
      onDelete: 'cascade',
    }),
    parentId: text('parent_id').notNull(),
    parentTable: text('parent_table').notNull(),
    role: text('role'),
    createdBy: text('created_by').references(() => usersSchema.id, {
      onDelete: 'set null',
    }),
  },
  (t) => [index('idx_media_attachments_parent').on(t.parentId, t.parentTable)],
);
