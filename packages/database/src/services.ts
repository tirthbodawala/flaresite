import { contentSchema } from '@schema/content.schema';
import { usersSchema } from '@schema/users.schema';
import { getTableName } from 'drizzle-orm';
import { Ctx } from './types';
import { BaseService } from '@services/base.service';

export const services = (ctx: Ctx) => ({
  [getTableName(contentSchema)]: new BaseService<
    typeof contentSchema.$inferInsert,
    typeof contentSchema.$inferSelect
  >(contentSchema, ctx),
  [getTableName(usersSchema)]: new BaseService<
    typeof usersSchema.$inferInsert,
    typeof usersSchema.$inferSelect
  >(usersSchema, ctx),
});
