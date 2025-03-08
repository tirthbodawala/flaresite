import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { contentSchema } from './content.schema';
import { taxonomySchema } from './taxonomy.schema';

export const contentTaxonomySchema = sqliteTable('content_taxonomy', {
  contentId: text('content_id').references(() => contentSchema.id, {
    onDelete: 'cascade',
  }),
  taxonomyId: text('taxonomy_id').references(() => taxonomySchema.id, {
    onDelete: 'cascade',
  }),
});
