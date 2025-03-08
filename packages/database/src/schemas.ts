import { getTableName } from 'drizzle-orm';
import { contentSchema } from '@schema/content.schema';
import { usersSchema } from '@schema/users.schema';

export const schemas = {
  [getTableName(contentSchema)]: contentSchema,
  [getTableName(usersSchema)]: usersSchema,
};
