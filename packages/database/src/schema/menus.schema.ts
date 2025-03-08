import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const menusSchema = sqliteTable('menus', {
  id: text('id').primaryKey(), // UUID v7
  name: text('name').notNull().unique(),
});
