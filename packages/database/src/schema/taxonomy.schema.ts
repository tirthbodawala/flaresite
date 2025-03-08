import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const taxonomySchema = sqliteTable(
  'taxonomy',
  {
    id: text('id').primaryKey(), // UUID v7
    type: text('type', { enum: ['category', 'tag'] }).notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    parentId: text('parent_id'),
  },
  (t) => [index('idx_taxonomy_slug').on(t.slug)],
);

// Define the self-referencing relation separately
export const taxonomyRelations = relations(taxonomySchema, ({ one, many }) => ({
  parent: one(taxonomySchema, {
    fields: [taxonomySchema.parentId],
    references: [taxonomySchema.id],
  }),
  children: many(taxonomySchema),
}));
