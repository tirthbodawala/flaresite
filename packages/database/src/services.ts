import { contentSchema } from '@schema/content.schema';
import { usersSchema } from '@schema/users.schema';
import { getTableName } from 'drizzle-orm';
import { BaseService } from '@services/base.service';
import { UserService } from '@services/user.service';
import { taxonomiesSchema } from '@schema/taxonomies.schema';
import { contentTaxonomiesSchema } from '@schema/content_taxonomies.schema';
import { organizationsSchema } from '@schema/organizations.schema';
import { seoSchema } from '@schema/seo.schema';
import { contentMetaSchema } from '@schema/content_meta.schema';
import { revisionsSchema } from '@schema/revisions.schema';
import { mediaSchema } from '@schema/media.schema';
import { mediaAttachmentsSchema } from '@schema/media_attachments.schema';
import { menusSchema } from '@schema/menus.schema';
import { menuItemsSchema } from '@schema/menu_items.schema';
import { siteSettingsSchema } from '@schema/site_settings.schema';

import { Ctx } from './types';

export const services = (ctx: Ctx) => ({
  [getTableName(usersSchema)]: new UserService(ctx),
  [getTableName(organizationsSchema)]: new BaseService<
    typeof organizationsSchema.$inferInsert,
    typeof organizationsSchema.$inferSelect
  >(organizationsSchema, ctx),
  [getTableName(contentSchema)]: new BaseService<
    typeof contentSchema.$inferInsert,
    typeof contentSchema.$inferSelect
  >(contentSchema, ctx),
  [getTableName(seoSchema)]: new BaseService<
    typeof seoSchema.$inferInsert,
    typeof seoSchema.$inferSelect
  >(seoSchema, ctx),
  [getTableName(contentMetaSchema)]: new BaseService<
    typeof contentMetaSchema.$inferInsert,
    typeof contentMetaSchema.$inferSelect
  >(contentMetaSchema, ctx),
  [getTableName(revisionsSchema)]: new BaseService<
    typeof revisionsSchema.$inferInsert,
    typeof revisionsSchema.$inferSelect
  >(revisionsSchema, ctx),
  [getTableName(taxonomiesSchema)]: new BaseService<
    typeof taxonomiesSchema.$inferInsert,
    typeof taxonomiesSchema.$inferSelect
  >(taxonomiesSchema, ctx),
  [getTableName(contentTaxonomiesSchema)]: new BaseService<
    typeof contentTaxonomiesSchema.$inferInsert,
    typeof contentTaxonomiesSchema.$inferSelect
  >(contentTaxonomiesSchema, ctx),
  [getTableName(mediaSchema)]: new BaseService<
    typeof mediaSchema.$inferInsert,
    typeof mediaSchema.$inferSelect
  >(mediaSchema, ctx),
  [getTableName(mediaAttachmentsSchema)]: new BaseService<
    typeof mediaAttachmentsSchema.$inferInsert,
    typeof mediaAttachmentsSchema.$inferSelect
  >(mediaAttachmentsSchema, ctx),
  [getTableName(menusSchema)]: new BaseService<
    typeof menusSchema.$inferInsert,
    typeof menusSchema.$inferSelect
  >(menusSchema, ctx),
  [getTableName(menuItemsSchema)]: new BaseService<
    typeof menuItemsSchema.$inferInsert,
    typeof menuItemsSchema.$inferSelect
  >(menuItemsSchema, ctx),
  [getTableName(siteSettingsSchema)]: new BaseService<
    typeof siteSettingsSchema.$inferInsert,
    typeof siteSettingsSchema.$inferSelect
  >(siteSettingsSchema, ctx),
});
