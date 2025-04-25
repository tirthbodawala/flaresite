import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { contentSchema } from './content.schema';
import { taxonomiesSchema } from './taxonomies.schema';

export const contentTaxonomiesSchema = sqliteTable('content_taxonomies', {
  id: text('id').primaryKey(),
  contentId: text('content_id').references(() => contentSchema.id, {
    onDelete: 'cascade',
  }),
  taxonomyId: text('taxonomy_id').references(() => taxonomiesSchema.id, {
    onDelete: 'cascade',
  }),
});
