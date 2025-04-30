// types.ts
import { contentSchema } from '@schema/content.schema';
import { usersSchema } from '@schema/users.schema';
import { taxonomiesSchema } from './schema/taxonomies.schema';
import { contentTaxonomiesSchema } from './schema/content_taxonomies.schema';
import { organizationsSchema } from './schema/organizations.schema';
import { seoSchema } from './schema/seo.schema';
import { contentMetaSchema } from './schema/content_meta.schema';
import { revisionsSchema } from './schema/revisions.schema';
import { mediaSchema } from './schema/media.schema';
import { mediaAttachmentsSchema } from './schema/media_attachments.schema';
import { menusSchema } from './schema/menus.schema';
import { menuItemsSchema } from './schema/menu_items.schema';
import { siteSettingsSchema } from './schema/site_settings.schema';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

export interface Ctx {
  db: DrizzleD1Database<{
    [contentSchema._.name]: typeof contentSchema;
    [usersSchema._.name]: typeof usersSchema;
    [taxonomiesSchema._.name]: typeof taxonomiesSchema;
    [contentTaxonomiesSchema._.name]: typeof contentTaxonomiesSchema;
    [organizationsSchema._.name]: typeof organizationsSchema;
    [seoSchema._.name]: typeof seoSchema;
    [contentMetaSchema._.name]: typeof contentMetaSchema;
    [revisionsSchema._.name]: typeof revisionsSchema;
    [mediaSchema._.name]: typeof mediaSchema;
    [mediaAttachmentsSchema._.name]: typeof mediaAttachmentsSchema;
    [menusSchema._.name]: typeof menusSchema;
    [menuItemsSchema._.name]: typeof menuItemsSchema;
    [siteSettingsSchema._.name]: typeof siteSettingsSchema;
  }>;
}
