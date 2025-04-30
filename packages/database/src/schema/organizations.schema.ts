import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const organizationsSchema = sqliteTable('organizations', {
  id: text('id').primaryKey(), // UUID v7
  name: text('name').notNull(),
  logo: text('logo'),
  url: text('url').notNull(),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  address: text('address'),
  socialLinks: text('social_links'),
  jsonLd: text('json_ld'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
  deletedAt: text('deleted_at'),
});
