import { sqliteTable, text, index, integer } from 'drizzle-orm/sqlite-core';
import { sql, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';

// Storage Schema
export const storageSchema = sqliteTable(
  'storage',
  {
    id: text('id').primaryKey(),
    key: text('key').notNull().unique(),
    originalName: text('original_name').notNull(),
    size: integer('size').notNull(),
    mimeType: text('mime_type').notNull(),
    hash: text('hash').notNull(),
    createdAt: text('created_at').default(sql`(current_timestamp)`),
    updatedAt: text('updated_at'),
    deletedAt: text('deleted_at'),
  },
  /* istanbul ignore next */
  (t) => [index('idx_r2_storage_key').on(t.key)],
);

export type InsertStorageType = InferInsertModel<typeof storageSchema>;
export type SelectStorageType = InferSelectModel<typeof storageSchema>;
