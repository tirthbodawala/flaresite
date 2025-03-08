import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { organizationsSchema } from './organizations.schema';

export const siteSettingsSchema = sqliteTable('site_settings', {
  id: text('id').primaryKey(), // UUID v7
  siteName: text('site_name').notNull(),
  siteUrl: text('site_url').notNull(),
  siteLogo: text('site_logo'),
  type: text('type', { enum: ['Organization', 'Person'] }).default(
    'Organization',
  ),
  organizationId: text('organization_id').references(
    () => organizationsSchema.id,
    { onDelete: 'set null' },
  ),
  jsonLd: text('json_ld'),
});
