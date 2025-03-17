export const ROLES = ['admin', 'editor', 'author', 'subscriber'] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS: Record<Role, string[]> = {
  admin: [
    'list_users',
    'edit_users',
    'delete_users',
    'promote_users',
    'edit_content',
    'edit_others_content',
    'delete_content',
    'delete_others_content',
    'publish_content',
    'read_private_content',
    'edit_revisions',
    'delete_revisions',
    'upload_media',
    'delete_any_media',
    'manage_media_library',
    'edit_menus',
    'delete_menus',
    'edit_menu_items',
    'delete_menu_items',
    'edit_seo',
    'manage_categories',
    'edit_categories',
    'delete_categories',
    'assign_categories',
    'edit_organizations',
    'manage_organizations',
    'manage_options',
  ],
  editor: [
    'edit_content',
    'edit_others_content',
    'delete_content',
    'delete_others_content',
    'publish_content',
    'read_private_content',
    'edit_revisions',
    'delete_revisions',
    'upload_media',
    'delete_own_media',
    'edit_menu_items',
    'delete_menu_items',
    'edit_seo',
    'manage_categories',
    'edit_categories',
    'delete_categories',
    'assign_categories',
  ],
  author: [
    'edit_content',
    'delete_content',
    'publish_content',
    'upload_media',
    'delete_own_media',
    'assign_categories',
  ],
  subscriber: ['read_private_content'],
} as const;

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: Role, permission: string): boolean => {
  return PERMISSIONS[role]?.includes(permission) ?? false;
};
