import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const taxonomiesSchema = sqliteTable(
  'taxonomies',
  {
    id: text('id').primaryKey(), // UUID v7
    type: text('type', { enum: ['category', 'tag'] }).notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    parentId: text('parent_id'),
  },
  (t) => [index('idx_taxonomies_slug').on(t.slug)],
);

// Define the self-referencing relation separately
export const taxonomiesRelations = relations(
  taxonomiesSchema,
  ({ one, many }) => ({
    parent: one(taxonomiesSchema, {
      fields: [taxonomiesSchema.parentId],
      references: [taxonomiesSchema.id],
    }),
    children: many(taxonomiesSchema),
  }),
);
