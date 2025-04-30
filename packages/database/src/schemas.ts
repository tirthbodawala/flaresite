import { getTableName } from 'drizzle-orm';
import { contentSchema } from '@schema/content.schema';
import { usersSchema } from '@schema/users.schema';
import { taxonomiesSchema } from '@schema/taxonomies.schema';
import { contentTaxonomiesSchema } from '@schema/content_taxonomies.schema';
import { contentMetaSchema } from '@schema/content_meta.schema';
import { mediaSchema } from '@schema/media.schema';
import { mediaAttachmentsSchema } from '@schema/media_attachments.schema';
import { organizationsSchema } from '@schema/organizations.schema';
import { revisionsSchema } from '@schema/revisions.schema';
import { menusSchema } from '@schema/menus.schema';
import { menuItemsSchema } from '@schema/menu_items.schema';
import { seoSchema } from './schema/seo.schema';
import { siteSettingsSchema } from './schema/site_settings.schema';

export const schemas = {
  [getTableName(usersSchema)]: usersSchema,
  [getTableName(organizationsSchema)]: organizationsSchema,
  [getTableName(contentSchema)]: contentSchema,
  [getTableName(seoSchema)]: seoSchema,
  [getTableName(contentMetaSchema)]: contentMetaSchema,
  [getTableName(revisionsSchema)]: revisionsSchema,
  [getTableName(taxonomiesSchema)]: taxonomiesSchema,
  [getTableName(contentTaxonomiesSchema)]: contentTaxonomiesSchema,
  [getTableName(mediaSchema)]: mediaSchema,
  [getTableName(mediaAttachmentsSchema)]: mediaAttachmentsSchema,
  [getTableName(menusSchema)]: menusSchema,
  [getTableName(menuItemsSchema)]: menuItemsSchema,
  [getTableName(siteSettingsSchema)]: siteSettingsSchema,
};
