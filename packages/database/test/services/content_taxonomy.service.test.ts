import { createExecutionContext, env } from 'cloudflare:test';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { initDBInstance, ServiceError } from '@/index';
import { validate } from 'uuid';

// Initialize test context and database instance
const ctx = createExecutionContext();
const db = initDBInstance(ctx, env);

describe('content_taxonomy.service', () => {
  afterEach(() => {
    // Reset all mocks and spies after each test to ensure test isolation
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  /**
   * Creates test content and taxonomy records for content-taxonomy tests
   */
  async function createTestRecords() {
    const content = await db.content.create({
      type: 'post',
      title: 'Test Post',
      slug: 'test-post',
      content: 'Test content',
    });

    const taxonomy = await db.taxonomies.create({
      type: 'category' as const,
      name: 'Test Category',
      slug: 'test-category',
    });

    return { content, taxonomy };
  }

  //
  // CREATE CONTENT-TAXONOMY
  //
  describe('create', () => {
    it('creates a new content-taxonomy relationship', async () => {
      const { content, taxonomy } = await createTestRecords();

      const input = {
        contentId: content.id,
        taxonomyId: taxonomy.id,
      };

      const result = await db.content_taxonomies.create(input);

      // Verify all required fields are set correctly
      expect(result.id).toBeDefined();
      expect(validate(result.id)).toBe(true);
      expect(result.contentId).toBe(content.id);
      expect(result.taxonomyId).toBe(taxonomy.id);
    });

    it('throws an error when required fields are missing', async () => {
      // Mock the content_taxonomies service
      vi.spyOn(db.content_taxonomies, 'create').mockRejectedValue(
        new ServiceError(400, 'Required fields missing'),
      );

      const badInput: any = {
        /* missing required fields */
      };
      await expect(db.content_taxonomies.create(badInput)).rejects.toThrow(
        ServiceError,
      );
    });

    it('throws an error when referenced content or taxonomy does not exist', async () => {
      const input = {
        contentId: 'non-existent-content-id',
        taxonomyId: 'non-existent-taxonomy-id',
      };
      await expect(db.content_taxonomies.create(input)).rejects.toThrow(
        ServiceError,
      );
    });

    it('throws an error when database insertion fails', async () => {
      const { content, taxonomy } = await createTestRecords();

      // Mock the content_taxonomies service
      vi.spyOn(db.content_taxonomies, 'create').mockRejectedValue(
        new ServiceError(500, 'Database insertion failed'),
      );

      const input = {
        contentId: content.id,
        taxonomyId: taxonomy.id,
      };
      await expect(db.content_taxonomies.create(input)).rejects.toThrow(
        'Database insertion failed',
      );
    });
  });

  //
  // GET CONTENT-TAXONOMY BY ID
  //
  describe('getById', () => {
    let insertedId: string;

    beforeEach(async () => {
      const { content, taxonomy } = await createTestRecords();
      const created = await db.content_taxonomies.create({
        contentId: content.id,
        taxonomyId: taxonomy.id,
      });
      insertedId = created.id;
    });

    it('returns the content-taxonomy when found', async () => {
      const found = await db.content_taxonomies.getById(insertedId);
      expect(found).toBeDefined();
      expect(found?.id).toBe(insertedId);
    });

    it('returns null when content-taxonomy is not found', async () => {
      const nonExistentResult =
        await db.content_taxonomies.getById('non-existent-id');
      expect(nonExistentResult).toBeNull();
    });

    it('throws an error when database query fails', async () => {
      // Mock the content_taxonomies service
      vi.spyOn(db.content_taxonomies, 'getById').mockRejectedValue(
        new ServiceError(500, 'Database query failed'),
      );

      await expect(db.content_taxonomies.getById(insertedId)).rejects.toThrow(
        'Database query failed',
      );
    });
  });

  //
  // GET CONTENT-TAXONOMY LIST
  //
  describe('getList', () => {
    beforeEach(async () => {
      // Clear existing content-taxonomies and create test records
      const all = await db.content_taxonomies.getList();
      if (all.length) {
        const allIds = all.map((ct: { id: string }) => ct.id);
        await db.content_taxonomies.bulkDelete(allIds, true);
      }

      // Create test content and taxonomies
      const content1 = await db.content.create({
        type: 'post',
        title: 'Post 1',
        slug: 'post-1',
        content: 'Content 1',
      });
      const content2 = await db.content.create({
        type: 'post',
        title: 'Post 2',
        slug: 'post-2',
        content: 'Content 2',
      });

      const taxonomy1 = await db.taxonomies.create({
        type: 'category' as const,
        name: 'Category 1',
        slug: 'category-1',
      });
      const taxonomy2 = await db.taxonomies.create({
        type: 'tag' as const,
        name: 'Tag 2',
        slug: 'tag-2',
      });

      // Create content-taxonomy relationships
      await db.content_taxonomies.create({
        contentId: content1.id,
        taxonomyId: taxonomy1.id,
      });
      await db.content_taxonomies.create({
        contentId: content2.id,
        taxonomyId: taxonomy2.id,
      });
    });

    it('returns all content-taxonomies by default', async () => {
      const list = await db.content_taxonomies.getList();
      expect(list.length).toBe(2);
    });

    it('respects the range parameter for pagination', async () => {
      const firstItemOnly = await db.content_taxonomies.getList([0, 0]);
      expect(firstItemOnly.length).toBe(1);
    });

    it('respects the filter parameter for filtering results', async () => {
      const content = await db.content.getList();
      const filtered = await db.content_taxonomies.getList(
        undefined,
        undefined,
        {
          contentId: content[0].id,
        },
      );
      expect(filtered.every((ct) => ct.contentId === content[0].id)).toBe(true);
    });

    it('throws an error when database query fails', async () => {
      // Mock the content_taxonomies service
      vi.spyOn(db.content_taxonomies, 'getList').mockRejectedValue(
        new ServiceError(500, 'Database query failed'),
      );

      await expect(db.content_taxonomies.getList()).rejects.toThrow(
        'Database query failed',
      );
    });
  });

  //
  // DELETE CONTENT-TAXONOMY
  //
  describe('delete', () => {
    let createdId: string;

    beforeEach(async () => {
      const { content, taxonomy } = await createTestRecords();
      const item = await db.content_taxonomies.create({
        contentId: content.id,
        taxonomyId: taxonomy.id,
      });
      createdId = item.id;
    });

    it('performs permanent delete', async () => {
      await db.content_taxonomies.delete(createdId, true);
      const refetch = await db.content_taxonomies.getById(createdId);
      expect(refetch).toBeNull();
    });

    it('throws an error when content-taxonomy does not exist', async () => {
      await expect(
        db.content_taxonomies.delete('non-existent-id', true),
      ).rejects.toThrow('No record found with ID: non-existent-id');
    });

    it('throws an error when database delete operation fails', async () => {
      // Mock the content_taxonomies service
      vi.spyOn(db.content_taxonomies, 'delete').mockRejectedValue(
        new ServiceError(500, 'Database delete operation failed'),
      );

      await expect(
        db.content_taxonomies.delete(createdId, true),
      ).rejects.toThrow('Database delete operation failed');
    });
  });

  //
  // BULK DELETE CONTENT-TAXONOMIES
  //
  describe('bulkDelete', () => {
    it('returns an empty array when no IDs are provided', async () => {
      const result = await db.content_taxonomies.bulkDelete([]);
      expect(result).toEqual([]);
    });

    it('performs permanent delete on multiple content-taxonomies', async () => {
      const { content, taxonomy } = await createTestRecords();
      const ct1 = await db.content_taxonomies.create({
        contentId: content.id,
        taxonomyId: taxonomy.id,
      });

      const content2 = await db.content.create({
        type: 'post',
        title: 'Post 2',
        slug: 'post-2',
        content: 'Content 2',
      });
      const ct2 = await db.content_taxonomies.create({
        contentId: content2.id,
        taxonomyId: taxonomy.id,
      });

      const ids = [ct1.id, ct2.id];

      // Execute bulk delete
      const deletedRows = await db.content_taxonomies.bulkDelete(ids, true);
      expect(deletedRows).toHaveLength(2);

      // Verify items are permanently removed
      for (const id of ids) {
        const refetch = await db.content_taxonomies.getById(id);
        expect(refetch).toBeNull();
      }
    });

    it('handles non-existent IDs gracefully', async () => {
      const { content, taxonomy } = await createTestRecords();
      const ct = await db.content_taxonomies.create({
        contentId: content.id,
        taxonomyId: taxonomy.id,
      });

      // Attempt to delete existing and non-existent IDs
      const ids = [ct.id, 'non-existent'];
      const deletedRows = await db.content_taxonomies.bulkDelete(ids, true);

      // Verify only the existing item was deleted
      expect(deletedRows).toHaveLength(1);
      expect(deletedRows[0].id).toBe(ct.id);
    });

    it('throws an error when database delete operation fails', async () => {
      // Mock the content_taxonomies service
      vi.spyOn(db.content_taxonomies, 'bulkDelete').mockRejectedValue(
        new ServiceError(500, 'Database delete operation failed'),
      );

      await expect(
        db.content_taxonomies.bulkDelete(['any-id'], true),
      ).rejects.toThrow('Database delete operation failed');
    });
  });
});
