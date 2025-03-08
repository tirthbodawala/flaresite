import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { contentSchema } from './content.schema';

export const seoSchema = sqliteTable('seo', {
  id: text('id').primaryKey(),
  contentId: text('content_id')
    .unique()
    .references(() => contentSchema.id, { onDelete: 'cascade' }),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  canonicalUrl: text('canonical_url'),
  metaKeywords: text('meta_keywords'),
  ogTitle: text('og_title'),
  ogDescription: text('og_description'),
  ogImage: text('og_image'),
  twitterCard: text('twitter_card', {
    enum: ['summary', 'summary_large_image'],
  }),
  schemaType: text('schema_type'),
  schemaHeadline: text('schema_headline'),
  schemaDescription: text('schema_description'),
  schemaImage: text('schema_image'),
  overrideJsonLd: text('override_json_ld'),
});
