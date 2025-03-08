import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { menusSchema } from './menus.schema';

export const menuItemsSchema = sqliteTable(
  'menu_items',
  {
    id: text('id').primaryKey(), // UUID v7
    menuId: text('menu_id').notNull(), // Foreign key reference to menus
    label: text('label').notNull(),
    url: text('url'),
    parentId: text('parent_id'),
    position: integer('position').default(0),
  },
  (t) => [index('idx_menu_items_menu_id').on(t.menuId)],
);

// Relationships, including foreign key reference to `menusSchema`
export const menuItemsRelations = relations(
  menuItemsSchema,
  ({ one, many }) => ({
    menu: one(menusSchema, {
      fields: [menuItemsSchema.menuId],
      references: [menusSchema.id],
    }),
    parent: one(menuItemsSchema, {
      fields: [menuItemsSchema.parentId],
      references: [menuItemsSchema.id],
    }),
    children: many(menuItemsSchema),
  }),
);
