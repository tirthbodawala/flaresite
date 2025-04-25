import { contentSchema } from '@schema/content.schema';
import { usersSchema } from '@schema/users.schema';
import { getTableName } from 'drizzle-orm';
import { Ctx } from './types';
import { BaseService } from '@services/base.service';
import { UserService } from '@services/user.service';
import { taxonomiesSchema } from '@schema/taxonomies.schema';
import { contentTaxonomiesSchema } from '@schema/content_taxonomies.schema';

export const services = (ctx: Ctx) => ({
  [getTableName(contentSchema)]: new BaseService<
    typeof contentSchema.$inferInsert,
    typeof contentSchema.$inferSelect
  >(contentSchema, ctx),

  [getTableName(taxonomiesSchema)]: new BaseService<
    typeof taxonomiesSchema.$inferInsert,
    typeof taxonomiesSchema.$inferSelect
  >(taxonomiesSchema, ctx),

  [getTableName(contentTaxonomiesSchema)]: new BaseService<
    typeof contentTaxonomiesSchema.$inferInsert,
    typeof contentTaxonomiesSchema.$inferSelect
  >(contentTaxonomiesSchema, ctx),

  [getTableName(usersSchema)]: new UserService(ctx),
});
