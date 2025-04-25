import { getTableName } from 'drizzle-orm';
import { contentSchema } from '@schema/content.schema';
import { usersSchema } from '@schema/users.schema';
import { taxonomiesSchema } from '@schema/taxonomies.schema';
import { contentTaxonomiesSchema } from '@schema/content_taxonomies.schema';

export const schemas = {
  [getTableName(contentSchema)]: contentSchema,
  [getTableName(usersSchema)]: usersSchema,
  [getTableName(taxonomiesSchema)]: taxonomiesSchema,
  [getTableName(contentTaxonomiesSchema)]: contentTaxonomiesSchema,
};
