import { createExecutionContext, env } from 'cloudflare:test';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

import { getInstance, initDBInstance } from '../../src'; // Adjust to your paths
import { validate } from 'uuid';
import { toSQLiteUTCString } from '@utils/date.util';

const ctx = createExecutionContext();
const db = initDBInstance(ctx, env);

describe('content.service', () => {
  afterEach(() => {
    // Reset mocks/spies after each test
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  //
  // UTILITIES / SETUP
  //
  const forceDBError = (methodName: string, impl: () => any) => {
    const instance = getInstance(ctx);
    if (!instance) throw new Error('Ctx instance not found.');
    if (methodName in instance.db) {
      // @ts-expect-error
      const property = instance.db[methodName] as unknown;
      if (typeof property === 'function') {
        // @ts-expect-error
        vi.spyOn(instance.db, methodName).mockImplementation(impl as any);
      }
    }
  };

  // Helper to create an author if needed (since authorId references usersSchema).
  // In your real tests, you might have a separate user creation utility.
  async function createUserIfNeeded() {
    // If your code references a user table, you might do:
    return await db.users.createUser({
      username: 'test',
      email: 'test@flaresite.com',
      plainPassword: 'hash',
    });
  }

  //
  // CREATE CONTENT
  //
  describe('create', () => {
    it('should create a new content entry with valid required fields', async () => {
      const author = await createUserIfNeeded(); // from hypothetical utility
      const input: Parameters<typeof db.content.create>[0] = {
        type: 'post', // from enum ['post','page']
        title: 'A new post',
        slug: 'unique-slug-123', // must be unique
        content: 'Hello world!',
        authorId: author.id, // references user
        // status is optional, defaults to 'draft'
      };
      const result = await db.content.create(input);

      // Basic expectations
      expect(result.id).toBeDefined();
      expect(validate(result.id)).toBe(true);
      expect(result.shortId).toBeDefined();
      expect(result.type).toBe('post');
      expect(result.title).toBe('A new post');
      expect(result.slug).toBe('unique-slug-123');
      expect(result.content).toBe('Hello world!');
      expect(result.status).toBe('draft'); // default
      expect(result.authorId).toBe(author.id);

      // Check auto-timestamps
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      // publishedAt is undefined unless we explicitly set it
      expect(result.publishedAt).toBeNull();
      // deletedAt is undefined
      expect(result.deletedAt).toBeNull();
    });

    it('should honor any provided status, publishedAt, etc.', async () => {
      const input: Parameters<typeof db.content.create>[0] = {
        type: 'page',
        title: 'Status Test',
        slug: 'status-test',
        content: 'Some content',
        status: 'published', // Overriding default
        publishedAt: new Date().toISOString(),
      };
      const result = await db.content.create(input);

      expect(result.status).toBe('published');
      expect(result.publishedAt).toBeDefined(); // we explicitly set it
      expect(result.publishedAt!).toBe(toSQLiteUTCString(input.publishedAt));
    });

    it('should auto-generate shortId if not supplied', async () => {
      const input: Parameters<typeof db.content.create>[0] = {
        type: 'page',
        title: 'Short ID Test',
        slug: 'short-id-test',
      };
      const result = await db.content.create(input);
      expect(result.shortId).toBeDefined();
      expect(result.shortId).not.toHaveLength(0);
    });

    it('should throw if required fields are missing', async () => {
      // For instance, 'type' is not null, 'title' is not null, 'slug' is not null
      const badInput: any = {
        /* missing type, title, slug */
      };
      await expect(db.content.create(badInput)).rejects.toThrow();
    });

    it('should throw if type or status is invalid (violates enum constraint)', async () => {
      const invalidType: Parameters<typeof db.content.create>[0] = {
        // @ts-expect-error as we are trying to insert wrong data
        type: 'unknown', // Not in ['post', 'page']
        title: 'Invalid Type Test',
        slug: 'invalid-type',
      };
      await expect(db.content.create(invalidType)).rejects.toThrow();

      const invalidStatus: Parameters<typeof db.content.create>[0] = {
        type: 'post',
        title: 'Invalid Status Test',
        slug: 'invalid-status',
        status: 'abcdefg' as any, // Not in ['draft','published','private']
      };
      await expect(db.content.create(invalidStatus)).rejects.toThrow();
    });

    it('should throw on DB insertion error', async () => {
      forceDBError('insert', () => {
        throw new Error('DB Insert Failed');
      });
      const input: Parameters<typeof db.content.create>[0] = {
        type: 'post',
        title: 'Insertion Error',
        slug: 'error-test',
      };
      await expect(db.content.create(input)).rejects.toThrow(
        'DB Insert Failed',
      );
    });
  });

  //
  // GET CONTENT BY ID
  //
  describe('getById', () => {
    let insertedId: string;

    beforeEach(async () => {
      // Create a record to fetch
      const created = await db.content.create({
        type: 'post',
        title: 'Single fetch test',
        slug: 'single-fetch-test',
      });
      insertedId = created.id;
    });

    it('should return the content if found and not deleted', async () => {
      const found = await db.content.getById(insertedId);
      expect(found).toBeDefined();
      expect(found?.id).toBe(insertedId);
    });

    it('should return null if no content matches the ID (or is soft-deleted)', async () => {
      // 1) Non-existent ID
      const res1 = await db.content.getById('non-existent-id');
      expect(res1).toBeNull();

      // 2) Soft-delete existing item, then try to fetch
      await db.content.delete(insertedId);
      const res2 = await db.content.getById(insertedId);
      expect(res2).toBeNull();
    });

    it('should throw on DB error', async () => {
      const instance = getInstance(ctx);
      if (!instance) throw new Error('Ctx instance not found.');
      vi.spyOn(instance.db.query.content, 'findFirst').mockImplementation(
        () => {
          throw new Error('DB Select Failed');
        },
      );
      await expect(db.content.getById(insertedId)).rejects.toThrow(
        'DB Select Failed',
      );
    });
  });

  //
  // GET CONTENT LIST
  //
  describe('getList', () => {
    beforeEach(async () => {
      // Clear table and add a few items
      // Use the bulkDelete to remove everything
      const all = await db.content.getList(undefined, undefined, {});
      if (all.length) {
        const allIds = all.map((c) => c.id);
        await db.content.bulkDelete(allIds, true); // permanent delete
      }

      await db.content.create({
        type: 'page',
        title: 'Page A',
        slug: 'page-a',
        status: 'draft',
      });
      await db.content.create({
        type: 'post',
        title: 'Post B',
        slug: 'post-b',
        status: 'published',
      });
      await db.content.create({
        type: 'post',
        title: 'Post C',
        slug: 'post-c',
        status: 'private',
      });
    });

    it('should return non-deleted items by default', async () => {
      const list = await db.content.getList();
      expect(list.length).toBe(3);

      // Soft-delete one
      await db.content.delete(list[0].id);
      const listAfter = await db.content.getList();
      expect(listAfter.length).toBe(2);
    });

    it('should respect the `range` param if provided', async () => {
      // e.g. range [0,0] => first item only
      const firstItemOnly = await db.content.getList([0, 0]);
      expect(firstItemOnly.length).toBe(1);
    });

    it('should respect the `sort` param if provided', async () => {
      // Sort by title DESC
      const sortedDesc = await db.content.getList(undefined, ['title', 'DESC']);
      // Expect the first item has a "higher" (lexicographically) title than the next
      expect(sortedDesc[0].title >= sortedDesc[1].title).toBe(true);
    });

    it('should respect the `filter` param if provided', async () => {
      // Filter by type = 'post'
      const postsOnly = await db.content.getList(undefined, undefined, {
        type: 'post',
      });
      expect(postsOnly.every((p) => p.type === 'post')).toBe(true);
    });

    it('should throw on DB error', async () => {
      const instance = getInstance(ctx);
      if (!instance) throw new Error('Ctx instance not found.');
      // Force an error
      vi.spyOn(instance.db.query.content, 'findMany').mockImplementation(() => {
        throw new Error('DB FindMany Error');
      });
      await expect(
        db.content.getList(undefined, undefined, {}),
      ).rejects.toThrow('DB FindMany Error');
    });
  });

  //
  // UPDATE CONTENT
  //
  describe('update', () => {
    let existingId: string;

    beforeEach(async () => {
      const item = await db.content.create({
        type: 'page',
        title: 'Update Target',
        slug: 'update-target',
        content: 'initial content',
      });
      existingId = item.id;
    });

    it('should update the content if it exists', async () => {
      const updated = await db.content.update(existingId, {
        title: 'Updated Title!',
        status: 'private',
      });
      expect(updated.title).toBe('Updated Title!');
      expect(updated.status).toBe('private');
      // updatedAt should be changed automatically
      expect(updated.updatedAt).toBeDefined();
    });

    it('should throw if the content does not exist', async () => {
      await expect(
        db.content.update('bogus-id', { title: 'Nope' }),
      ).rejects.toThrow('No record found with ID: bogus-id');
    });

    it('should throw if DB update fails', async () => {
      forceDBError('update', () => {
        throw new Error('DB Update Failed');
      });
      await expect(
        db.content.update(existingId, { title: 'Fail' }),
      ).rejects.toThrow('DB Update Failed');
    });
  });

  //
  // DELETE CONTENT
  //
  describe('delete', () => {
    let createdId: string;

    beforeEach(async () => {
      const item = await db.content.create({
        type: 'post',
        title: 'Delete Me',
        slug: 'delete-me',
      });
      createdId = item.id;
    });

    it('should soft-delete by default', async () => {
      const deleted = await db.content.delete(createdId);
      expect(deleted.deletedAt).toBeDefined();

      // Confirm that getById now returns null
      const refetch = await db.content.getById(createdId);
      expect(refetch).toBeNull();
    });

    it('should permanently delete if `permanent=true`', async () => {
      await db.content.delete(createdId, true);
      const refetch = await db.content.getById(createdId);
      expect(refetch).toBeNull();
    });

    it('should throw if the item is not found', async () => {
      await expect(db.content.delete('bad-id')).rejects.toThrow(
        'No record found with ID: bad-id',
      );
    });

    it('should throw on DB error', async () => {
      forceDBError('delete', () => {
        throw new Error('DB Delete Error');
      });
      await expect(db.content.delete(createdId, true)).rejects.toThrow(
        'DB Delete Error',
      );
    });
  });

  //
  // BULK UPDATE CONTENT
  //
  describe('bulkUpdate', () => {
    it('should return [] if updates array is empty', async () => {
      const res = await db.content.bulkUpdate([]);
      expect(res).toEqual([]);
    });

    it('should update multiple items in a transaction', async () => {
      const item1 = await db.content.create({
        type: 'post',
        title: 'Bulk Item 1',
        slug: 'bulk-11',
      });
      const item2 = await db.content.create({
        type: 'page',
        title: 'Bulk Item 2',
        slug: 'bulk-21',
      });

      // Attempt a bulk update
      const updates = [
        {
          id: item1.id,
          data: { title: 'Updated Bulk 1', content: 'Some changes' },
        },
        { id: item2.id, data: { title: 'Updated Bulk 2' } },
      ];
      const result = await db.content.bulkUpdate(updates);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Updated Bulk 1');
      expect(result[1].title).toBe('Updated Bulk 2');
    });
  });

  //
  // BULK DELETE CONTENT
  //
  describe('bulkDelete', () => {
    it('should return [] if no IDs are provided', async () => {
      const res = await db.content.bulkDelete([]);
      expect(res).toEqual([]);
    });

    it('should soft-delete multiple items by default', async () => {
      const item1 = await db.content.create({
        type: 'post',
        title: 'Multi-delete 1',
        slug: 'multi-del-1',
      });
      const item2 = await db.content.create({
        type: 'post',
        title: 'Multi-delete 2',
        slug: 'multi-del-2',
      });
      const ids = [item1.id, item2.id];

      const deletedRows = await db.content.bulkDelete(ids);
      expect(deletedRows).toHaveLength(2);
      expect(deletedRows.every((r) => r.deletedAt)).toBe(true);

      // Confirm they don't show in getById
      for (const id of ids) {
        const refetch = await db.content.getById(id);
        expect(refetch).toBeNull();
      }
    });

    it('should permanently delete multiple items if permanent=true', async () => {
      const item1 = await db.content.create({
        type: 'post',
        title: 'Perm 1',
        slug: 'p1',
      });
      const item2 = await db.content.create({
        type: 'post',
        title: 'Perm 2',
        slug: 'p2',
      });
      const ids = [item1.id, item2.id];

      const deleted = await db.content.bulkDelete(ids, true);
      expect(deleted).toHaveLength(2);

      // Verify they’re gone
      for (const id of ids) {
        const refetch = await db.content.getById(id);
        expect(refetch).toBeNull();
      }
    });

    it('should not fail if one ID does not exist; it just won’t appear in results', async () => {
      const item = await db.content.create({
        type: 'page',
        title: 'Partial Del',
        slug: 'pdel',
      });
      const ids = [item.id, 'non-existent'];
      const deletedRows = await db.content.bulkDelete(ids);
      expect(deletedRows).toHaveLength(1);
      expect(deletedRows[0].id).toBe(item.id);
    });
  });
});
