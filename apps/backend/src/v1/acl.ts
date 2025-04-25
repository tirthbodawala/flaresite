// Roles
export const ROLES = [
  "guest",
  "admin",
  "editor",
  "author",
  "subscriber",
] as const;
export type Role = (typeof ROLES)[number];

// Allowed actions. Extend this list as needed.
export const ACTIONS = [
  "list",
  "show",
  "create",
  "edit",
  "delete",
  "assign",
  "promote",
  "listOthers",
  "showOthers",
  "editOthers",
  "deleteOthers",
  "publish",
  "readPrivate",
  "upload",
  "deleteAny",
  "deleteOwn",
  "manage",
  "login",
  "register",
] as const;
export type Action = (typeof ACTIONS)[number];

// Allowed resources. Extend this list as needed.
export const RESOURCES = [
  "acls",
  "users",
  "authors",
  "content",
  "taxonomies",
  "revisions",
  "media",
  "media_library",
  "menus",
  "menu_items",
  "seo",
  "categories",
  "organizations",
  "options",
  "auth",
] as const;
export type Resource = (typeof RESOURCES)[number];

// Permission type using the object format
export type Permission = {
  action: Action;
  resource: Resource;
};

// Permission mapping for each role using the new format
export type PermissionsMap = {
  guest: Permission[];
  admin: Permission[];
  editor: Permission[];
  author: Permission[];
  subscriber: Permission[];
};

export const PERMISSIONS: PermissionsMap = {
  admin: [
    // Auth
    { action: "list", resource: "acls" },

    // Users
    { action: "list", resource: "users" },
    { action: "show", resource: "users" },
    { action: "create", resource: "users" },
    { action: "edit", resource: "users" },
    { action: "delete", resource: "users" },
    { action: "promote", resource: "users" },
    { action: "list", resource: "authors" },
    { action: "show", resource: "authors" },

    // Content
    { action: "create", resource: "content" },
    { action: "list", resource: "content" },
    { action: "show", resource: "content" },
    { action: "listOthers", resource: "content" },
    { action: "showOthers", resource: "content" },
    { action: "edit", resource: "content" },
    { action: "editOthers", resource: "content" },
    { action: "delete", resource: "content" },
    { action: "deleteOthers", resource: "content" },
    { action: "publish", resource: "content" },
    { action: "readPrivate", resource: "content" },

    // Taxonomies
    { action: "create", resource: "taxonomies" },
    { action: "list", resource: "taxonomies" },
    { action: "show", resource: "taxonomies" },
    { action: "edit", resource: "taxonomies" },
    { action: "delete", resource: "taxonomies" },

    // Revisions
    { action: "edit", resource: "revisions" },
    { action: "delete", resource: "revisions" },

    // Media
    { action: "upload", resource: "media" },
    { action: "deleteAny", resource: "media" },
    { action: "manage", resource: "media_library" },

    // Menus
    { action: "edit", resource: "menus" },
    { action: "delete", resource: "menus" },
    { action: "edit", resource: "menu_items" },
    { action: "delete", resource: "menu_items" },

    // SEO
    { action: "edit", resource: "seo" },

    // Categories
    { action: "manage", resource: "categories" },
    { action: "edit", resource: "categories" },
    { action: "delete", resource: "categories" },
    { action: "assign", resource: "categories" },

    // Organizations
    { action: "edit", resource: "organizations" },
    { action: "manage", resource: "organizations" },

    // Options
    { action: "manage", resource: "options" },
  ],
  editor: [
    // Auth
    { action: "list", resource: "acls" },

    // Users / Authors
    { action: "list", resource: "authors" },
    { action: "show", resource: "authors" },

    // Content
    { action: "create", resource: "content" },
    { action: "list", resource: "content" },
    { action: "show", resource: "content" },
    { action: "listOthers", resource: "content" },
    { action: "showOthers", resource: "content" },
    { action: "edit", resource: "content" },
    { action: "editOthers", resource: "content" },
    { action: "delete", resource: "content" },
    { action: "deleteOthers", resource: "content" },
    { action: "publish", resource: "content" },
    { action: "readPrivate", resource: "content" },

    // Revisions
    { action: "edit", resource: "revisions" },
    { action: "delete", resource: "revisions" },

    // Media
    { action: "upload", resource: "media" },
    { action: "deleteOwn", resource: "media" },

    // Menus
    { action: "edit", resource: "menu_items" },
    { action: "delete", resource: "menu_items" },

    // SEO
    { action: "edit", resource: "seo" },

    // Categories
    { action: "manage", resource: "categories" },
    { action: "edit", resource: "categories" },
    { action: "delete", resource: "categories" },
    { action: "assign", resource: "categories" },
  ],
  author: [
    // Auth
    { action: "list", resource: "acls" },

    { action: "list", resource: "authors" },
    { action: "show", resource: "authors" },

    // Content
    { action: "create", resource: "content" },
    { action: "list", resource: "content" },
    { action: "show", resource: "content" },
    { action: "edit", resource: "content" },
    { action: "delete", resource: "content" },
    { action: "publish", resource: "content" },

    // Media
    { action: "upload", resource: "media" },
    { action: "deleteOwn", resource: "media" },

    // Categories
    { action: "assign", resource: "categories" },
  ],
  subscriber: [
    // Auth
    { action: "list", resource: "acls" },

    { action: "list", resource: "authors" },
    { action: "show", resource: "authors" },

    { action: "readPrivate", resource: "content" },
  ],
  guest: [
    { action: "list", resource: "authors" },
    { action: "show", resource: "authors" },

    { action: "login", resource: "auth" },
    { action: "register", resource: "auth" },
  ],
} as const;

// It accepts a role and a permission object { action, resource }, then checks
// whether that permission is present in the PERMISSIONS for the given role.
export const hasPermission = (
  role: Role,
  { action, resource }: { action: Action; resource: Resource },
): boolean => {
  console.log("--- ACL ---", role, action, resource);
  return (
    PERMISSIONS[role]?.some(
      (perm) => perm.action === action && perm.resource === resource,
    ) ?? false
  );
};
