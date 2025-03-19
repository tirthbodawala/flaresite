export const ROLES = [
  "guest",
  "admin",
  "editor",
  "author",
  "subscriber",
] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSION_VALUES = [
  // Auth
  "login",
  "register",

  // Users
  "view_users",
  "create_users",
  "edit_users",
  "delete_users",
  "promote_users",
  "view_authors",

  // Content
  "create_content",
  "view_content",
  "view_others_content",
  "edit_content",
  "edit_others_content",
  "delete_content",
  "delete_others_content",
  "publish_content",
  "read_private_content",

  // Revisions
  "edit_revisions",
  "delete_revisions",

  // Media
  "upload_media",
  "delete_any_media",
  "manage_media_library",

  // Menus
  "edit_menus",
  "delete_menus",
  "edit_menu_items",
  "delete_menu_items",
  "delete_own_media",

  // Seo
  "edit_seo",

  // Categories
  "manage_categories",
  "edit_categories",
  "delete_categories",
  "assign_categories",

  // Organizations
  "edit_organizations",
  "manage_organizations",

  // Options
  "manage_options",
] as const;

export type Permission = (typeof PERMISSION_VALUES)[number];

// Define permission structure for each role
export type PermissionsMap = {
  guest: readonly Permission[];
  admin: readonly Permission[];
  editor: readonly Permission[];
  author: readonly Permission[];
  subscriber: readonly Permission[];
};

// Strictly type `PERMISSIONS` and keep it as `const`
export const PERMISSIONS: PermissionsMap = {
  admin: [
    // Users
    "view_users",
    "create_users",
    "edit_users",
    "delete_users",
    "promote_users",
    "view_authors",

    // Content
    "create_content",
    "view_content",
    "view_others_content",
    "edit_content",
    "edit_others_content",
    "delete_content",
    "delete_others_content",
    "publish_content",
    "read_private_content",

    // Revisions
    "edit_revisions",
    "delete_revisions",

    // Media
    "upload_media",
    "delete_any_media",
    "manage_media_library",

    // Menus
    "edit_menus",
    "delete_menus",
    "edit_menu_items",
    "delete_menu_items",

    // SEO
    "edit_seo",

    // Categories
    "manage_categories",
    "edit_categories",
    "delete_categories",
    "assign_categories",

    // Organizations
    "edit_organizations",
    "manage_organizations",

    // Options
    "manage_options",
  ],
  editor: [
    // User
    "view_authors",

    // Content
    "create_content",
    "view_content",
    "view_others_content",
    "edit_content",
    "edit_others_content",
    "delete_content",
    "delete_others_content",
    "publish_content",
    "read_private_content",

    // Revisions
    "edit_revisions",
    "delete_revisions",

    // Media
    "upload_media",
    "delete_own_media",

    // Menu
    "edit_menu_items",
    "delete_menu_items",

    // Seo
    "edit_seo",

    // Categories
    "manage_categories",
    "edit_categories",
    "delete_categories",
    "assign_categories",
  ],
  author: [
    "view_authors",

    // Content
    "create_content",
    "view_content",
    "edit_content",
    "delete_content",
    "publish_content",

    // Media
    "upload_media",
    "delete_own_media",
    "assign_categories",
  ],
  subscriber: ["view_authors", "read_private_content"],
  guest: [
    // Users
    "view_authors",

    // Auth
    "login",
    "register",
  ],
} as const;

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: Role, permission: Permission): boolean => {
  return PERMISSIONS[role]?.includes(permission) ?? false;
};
