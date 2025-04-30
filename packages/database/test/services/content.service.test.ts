import { createExecutionContext, env } from 'cloudflare:test';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

import { getInstance, initDBInstance, ServiceError } from '@/index'; // Adjust to your paths
import { validate } from 'uuid';
import { toSQLiteUTCString } from '@utils/date.util';

// Initialize test context and database instance
const ctx = createExecutionContext();
const db = initDBInstance(ctx, env);

describe('content.service', () => {
  afterEach(() => {
    // Reset all mocks and spies after each test to ensure test isolation
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  //
  // UTILITIES / SETUP
  //
  /**
   * Forces a database error for testing error handling scenarios
   * @param methodName - The database method to mock
   * @param impl - The implementation that throws the error
   */
  const forceDBError = (methodName: string, impl: () => any) => {
    const instance = getInstance(ctx);
    if (!instance) throw new Error('Context instance not found');
    if (methodName in instance.db) {
      // @ts-expect-error - We're intentionally mocking the method
      const property = instance.db[methodName] as unknown;
      if (typeof property === 'function') {
        // @ts-expect-error - We're intentionally mocking the method
        vi.spyOn(instance.db, methodName).mockImplementation(impl as any);
      }
    }
  };

  /**
   * Creates a test user if needed for content creation
   * This is required because content references a user through authorId
   */
  async function createUserIfNeeded() {
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
    it('creates a new content entry with all required fields', async () => {
      const author = await createUserIfNeeded();
      const input: Parameters<typeof db.content.create>[0] = {
        type: 'post', // Must be one of ['post', 'page']
        title: 'A new post',
        slug: 'unique-slug-123', // Must be unique
        content: 'Hello world!',
        authorId: author.id, // References the user who created the content
        // status is optional and defaults to 'draft'
      };
      const result = await db.content.create(input);

      // Verify all required fields are set correctly
      expect(result.id).toBeDefined();
      expect(validate(result.id)).toBe(true);
      expect(result.shortId).toBeDefined();
      expect(result.type).toBe('post');
      expect(result.title).toBe('A new post');
      expect(result.slug).toBe('unique-slug-123');
      expect(result.content).toBe('Hello world!');
      expect(result.status).toBe('draft'); // Default value
      expect(result.authorId).toBe(author.id);

      // Verify auto-generated timestamps
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.publishedAt).toBeNull(); // Should be null unless explicitly set
      expect(result.deletedAt).toBeNull(); // Should be null for new content
    });

    it('honors provided status and publishedAt fields', async () => {
      const input: Parameters<typeof db.content.create>[0] = {
        type: 'page',
        title: 'Status Test',
        slug: 'status-test',
        content: 'Some content',
        status: 'published', // Override default status
        publishedAt: new Date().toISOString(),
      };
      const result = await db.content.create(input);

      expect(result.status).toBe('published');
      expect(result.publishedAt).toBeDefined();
      expect(result.publishedAt!).toBe(toSQLiteUTCString(input.publishedAt));
    });

    it('auto-generates shortId when not provided', async () => {
      const input: Parameters<typeof db.content.create>[0] = {
        type: 'page',
        title: 'Short ID Test',
        slug: 'short-id-test',
      };
      const result = await db.content.create(input);
      expect(result.shortId).toBeDefined();
      expect(result.shortId).not.toHaveLength(0);
    });

    it('throws an error when required fields are missing', async () => {
      // Missing required fields: type, title, and slug
      const badInput: any = {
        /* missing required fields */
      };
      await expect(db.content.create(badInput)).rejects.toThrow(ServiceError);
    });

    it('throws an error when type or status violates enum constraints', async () => {
      const invalidType: Parameters<typeof db.content.create>[0] = {
        // @ts-expect-error - Testing invalid type
        type: 'unknown', // Not in ['post', 'page']
        title: 'Invalid Type Test',
        slug: 'invalid-type',
      };
      await expect(db.content.create(invalidType)).rejects.toThrow(
        ServiceError,
      );

      const invalidStatus: Parameters<typeof db.content.create>[0] = {
        type: 'post',
        title: 'Invalid Status Test',
        slug: 'invalid-status',
        status: 'abcdefg' as any, // Not in ['draft', 'published', 'private']
      };
      await expect(db.content.create(invalidStatus)).rejects.toThrow(
        ServiceError,
      );
    });

    it('throws an error when database insertion fails', async () => {
      forceDBError('insert', () => {
        throw new Error('Database insertion failed');
      });
      const input: Parameters<typeof db.content.create>[0] = {
        type: 'post',
        title: 'Insertion Error',
        slug: 'error-test',
      };
      await expect(db.content.create(input)).rejects.toThrow(
        'Database insertion failed',
      );
    });
  });

  //
  // GET CONTENT BY ID
  //
  describe('getById', () => {
    let insertedId: string;

    beforeEach(async () => {
      // Create a test record to fetch
      const created = await db.content.create({
        type: 'post',
        title: 'Single fetch test',
        slug: 'single-fetch-test',
      });
      insertedId = created.id;
    });

    it('returns the content when found and not deleted', async () => {
      const found = await db.content.getById(insertedId);
      expect(found).toBeDefined();
      expect(found?.id).toBe(insertedId);
    });

    it('returns null when content is not found or soft-deleted', async () => {
      // Test with non-existent ID
      const nonExistentResult = await db.content.getById('non-existent-id');
      expect(nonExistentResult).toBeNull();

      // Test with soft-deleted content
      await db.content.delete(insertedId);
      const softDeletedResult = await db.content.getById(insertedId);
      expect(softDeletedResult).toBeNull();
    });

    it('throws an error when database query fails', async () => {
      const instance = getInstance(ctx);
      if (!instance) throw new Error('Context instance not found');

      // Mock database query to force an error
      vi.spyOn(instance.db.query.content, 'findFirst').mockImplementation(
        () => {
          throw new Error('Database query failed');
        },
      );

      await expect(db.content.getById(insertedId)).rejects.toThrow(
        'Database query failed',
      );
    });
  });

  //
  // GET CONTENT LIST
  //
  describe('getList', () => {
    beforeEach(async () => {
      // Clear existing content and create test records
      const all = await db.content.getList(undefined, undefined, {});
      if (all.length) {
        const allIds = all.map((c) => c.id);
        await db.content.bulkDelete(allIds, true); // Permanently delete all existing records
      }

      // Create test content with different types and statuses
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

    it('returns only non-deleted items by default', async () => {
      const list = await db.content.getList();
      expect(list.length).toBe(3);

      // Soft-delete one item and verify it's excluded from results
      await db.content.delete(list[0].id);
      const listAfter = await db.content.getList();
      expect(listAfter.length).toBe(2);
    });

    it('respects the range parameter for pagination', async () => {
      // Get only the first item using range [0, 0]
      const firstItemOnly = await db.content.getList([0, 0]);
      expect(firstItemOnly.length).toBe(1);
    });

    it('respects the sort parameter for ordering results', async () => {
      // Sort by title in descending order
      const sortedDesc = await db.content.getList(undefined, ['title', 'DESC']);
      // Verify the first item's title is lexicographically greater than the second
      expect(sortedDesc[0].title >= sortedDesc[1].title).toBe(true);
    });

    it('respects the filter parameter for filtering results', async () => {
      // Filter to show only posts
      const postsOnly = await db.content.getList(undefined, undefined, {
        type: 'post',
      });
      expect(postsOnly.every((p) => p.type === 'post')).toBe(true);
    });

    it('throws an error when database query fails', async () => {
      const instance = getInstance(ctx);
      if (!instance) throw new Error('Context instance not found');

      // Mock database query to force an error
      vi.spyOn(instance.db.query.content, 'findMany').mockImplementation(() => {
        throw new Error('Database query failed');
      });

      await expect(
        db.content.getList(undefined, undefined, {}),
      ).rejects.toThrow('Database query failed');
    });
  });

  //
  // UPDATE CONTENT
  //
  describe('update', () => {
    let existingId: string;

    beforeEach(async () => {
      // Create a test record to update
      const item = await db.content.create({
        type: 'page',
        title: 'Update Target',
        slug: 'update-target',
        content: 'initial content',
      });
      existingId = item.id;
    });

    it('updates content when it exists', async () => {
      const updated = await db.content.update(existingId, {
        title: 'Updated Title!',
        status: 'private',
      });
      expect(updated.title).toBe('Updated Title!');
      expect(updated.status).toBe('private');
      expect(updated.updatedAt).toBeDefined(); // Verify timestamp was updated
    });

    it('throws an error when content does not exist', async () => {
      await expect(
        db.content.update('non-existent-id', { title: 'Nope' }),
      ).rejects.toThrow('No record found with ID: non-existent-id');
    });

    it('throws an error when database update fails', async () => {
      forceDBError('update', () => {
        throw new Error('Database update failed');
      });
      await expect(
        db.content.update(existingId, { title: 'Fail' }),
      ).rejects.toThrow('Database update failed');
    });
  });

  //
  // DELETE CONTENT
  //
  describe('delete', () => {
    let createdId: string;

    beforeEach(async () => {
      // Create a test record to delete
      const item = await db.content.create({
        type: 'post',
        title: 'Delete Me',
        slug: 'delete-me',
      });
      createdId = item.id;
    });

    it('performs soft-delete by default', async () => {
      const deleted = await db.content.delete(createdId);
      expect(deleted.deletedAt).toBeDefined();

      // Verify the content is no longer retrievable
      const refetch = await db.content.getById(createdId);
      expect(refetch).toBeNull();
    });

    it('performs permanent delete when permanent=true', async () => {
      await db.content.delete(createdId, true);
      const refetch = await db.content.getById(createdId);
      expect(refetch).toBeNull();
    });

    it('throws an error when content does not exist', async () => {
      await expect(db.content.delete('non-existent-id')).rejects.toThrow(
        'No record found with ID: non-existent-id',
      );
    });

    it('throws an error when database delete operation fails', async () => {
      forceDBError('delete', () => {
        throw new Error('Database delete operation failed');
      });
      await expect(db.content.delete(createdId, true)).rejects.toThrow(
        'Database delete operation failed',
      );
    });
  });

  //
  // BULK UPDATE CONTENT
  //
  describe('bulkUpdate', () => {
    it('returns an empty array when no updates are provided', async () => {
      const result = await db.content.bulkUpdate([]);
      expect(result).toEqual([]);
    });

    it('updates multiple items in a single transaction', async () => {
      // Create test records to update
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

      // Prepare bulk update operations
      const updates = [
        {
          id: item1.id,
          data: { title: 'Updated Bulk 1', content: 'Some changes' },
        },
        { id: item2.id, data: { title: 'Updated Bulk 2' } },
      ];

      // Execute bulk update
      const result = await db.content.bulkUpdate(updates);

      // Verify updates were applied correctly
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Updated Bulk 1');
      expect(result[1].title).toBe('Updated Bulk 2');
    });
  });

  //
  // BULK DELETE CONTENT
  //
  describe('bulkDelete', () => {
    it('returns an empty array when no IDs are provided', async () => {
      const result = await db.content.bulkDelete([]);
      expect(result).toEqual([]);
    });

    it('performs soft-delete on multiple items by default', async () => {
      // Create test records to delete
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

      // Execute bulk delete
      const deletedRows = await db.content.bulkDelete(ids);

      // Verify soft-delete was applied
      expect(deletedRows).toHaveLength(2);
      expect(deletedRows.every((r) => r.deletedAt)).toBe(true);

      // Verify items are no longer retrievable
      for (const id of ids) {
        const refetch = await db.content.getById(id);
        expect(refetch).toBeNull();
      }
    });

    it('performs permanent delete when permanent=true', async () => {
      // Create test records to delete
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

      // Execute permanent delete
      const deleted = await db.content.bulkDelete(ids, true);
      expect(deleted).toHaveLength(2);

      // Verify items are permanently removed
      for (const id of ids) {
        const refetch = await db.content.getById(id);
        expect(refetch).toBeNull();
      }
    });

    it('handles non-existent IDs gracefully', async () => {
      // Create a test record
      const item = await db.content.create({
        type: 'page',
        title: 'Partial Del',
        slug: 'pdel',
      });

      // Attempt to delete existing and non-existent IDs
      const ids = [item.id, 'non-existent'];
      const deletedRows = await db.content.bulkDelete(ids);

      // Verify only the existing item was deleted
      expect(deletedRows).toHaveLength(1);
      expect(deletedRows[0].id).toBe(item.id);
    });

    it('throws an error when database delete operation fails', async () => {
      forceDBError('delete', () => {
        throw new Error('Database delete operation failed');
      });
      await expect(db.content.bulkDelete(['any-id'], true)).rejects.toThrow(
        'Database delete operation failed',
      );
    });
  });

  //
  // GET CONTENT COUNT
  //
  describe('getCount', () => {
    beforeEach(async () => {
      // Clear existing content and create test records
      const all = await db.content.getList(undefined, undefined, {});
      if (all.length) {
        const allIds = all.map((c) => c.id);
        await db.content.bulkDelete(allIds, true); // Permanently delete all existing records
      }

      // Create test content with different types and statuses
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

    it('returns the total count of non-deleted items', async () => {
      const count = await db.content.getCount();
      expect(count).toBe(3);

      // Soft-delete one item and verify count decreases
      const list = await db.content.getList();
      await db.content.delete(list[0].id);
      const countAfter = await db.content.getCount();
      expect(countAfter).toBe(2);
    });

    it('respects filter parameters when counting', async () => {
      // Count only posts
      const postCount = await db.content.getCount({ type: 'post' });
      expect(postCount).toBe(2);

      // Count only published content
      const publishedCount = await db.content.getCount({ status: 'published' });
      expect(publishedCount).toBe(1);
    });
  });

  //
  // CLEAR CONTENT
  //
  describe('clear', () => {
    beforeEach(async () => {
      // Clear existing content and create test records
      const all = await db.content.getList(undefined, undefined, {});
      if (all.length) {
        const allIds = all.map((c) => c.id);
        await db.content.bulkDelete(allIds, true); // Permanently delete all existing records
      }

      // Create test content
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
    });

    it('deletes all records from the content table', async () => {
      const records = await db.content.getList();
      expect(records).toHaveLength(2);

      // Delete all records
      await db.content.bulkDelete(
        records.map((r) => r.id),
        true,
      );

      // Verify table is empty
      const postDeleteRecords = await db.content.getList();
      expect(postDeleteRecords).toHaveLength(0);
    });

    it('handles empty table gracefully', async () => {
      // Delete all records
      const records = await db.content.getList();
      await db.content.bulkDelete(
        records.map((r) => r.id),
        true,
      );

      // Verify table remains empty
      const postDeleteRecords = await db.content.getList();
      expect(postDeleteRecords).toHaveLength(0);
    });

    it('throws an error when database delete operation fails', async () => {
      forceDBError('delete', () => {
        throw new Error('Database delete operation failed');
      });
      await expect(db.content.bulkDelete(['any-id'], true)).rejects.toThrow(
        'Database delete operation failed',
      );
    });
  });
});
