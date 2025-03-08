import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { contentSchema } from './content.schema';

export const contentMetaSchema = sqliteTable(
  'content_meta',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id').references(() => contentSchema.id, {
      onDelete: 'cascade',
    }),
    metaKey: text('meta_key').notNull(),
    metaValue: text('meta_value'),
  },
  (t) => [index('idx_content_meta_key').on(t.contentId, t.metaKey)],
);
