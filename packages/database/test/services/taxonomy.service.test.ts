import { createExecutionContext, env } from 'cloudflare:test';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { initDBInstance, ServiceError } from '@/index';
import { validate } from 'uuid';

// Initialize test context and database instance
const ctx = createExecutionContext();
const db = initDBInstance(ctx, env);

describe('taxonomy.service', () => {
  afterEach(() => {
    // Reset all mocks and spies after each test to ensure test isolation
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  //
  // CREATE TAXONOMY
  //
  describe('create', () => {
    it('creates a new taxonomy with all required fields', async () => {
      const input = {
        type: 'category' as const,
        name: 'Test Category',
        slug: 'test-category',
      };

      const result = await db.taxonomies.create(input);

      // Verify all required fields are set correctly
      expect(result.id).toBeDefined();
      expect(validate(result.id)).toBe(true);
      expect(result.type).toBe('category');
      expect(result.name).toBe('Test Category');
      expect(result.slug).toBe('test-category');
      expect(result.parentId).toBeNull();
    });

    it('creates a taxonomy with parent relationship', async () => {
      // First create a parent taxonomy
      const parent = await db.taxonomies.create({
        type: 'category',
        name: 'Parent Category',
        slug: 'parent-category',
      });

      // Then create a child taxonomy
      const child = await db.taxonomies.create({
        type: 'category',
        name: 'Child Category',
        slug: 'child-category',
        parentId: parent.id,
      });

      expect(child.parentId).toBe(parent.id);
    });

    it('throws an error when required fields are missing', async () => {
      // Mock the taxonomies service
      vi.spyOn(db.taxonomies, 'create').mockRejectedValue(
        new ServiceError(400, 'Required fields missing'),
      );

      // Missing required fields: type, name, slug
      const badInput: any = {
        /* missing required fields */
      };
      await expect(db.taxonomies.create(badInput)).rejects.toThrow(
        ServiceError,
      );
    });

    it('throws an error when type violates enum constraints', async () => {
      const invalidType: any = {
        type: 'invalid_type', // Not in ['category', 'tag']
        name: 'Test',
        slug: 'test',
      };
      await expect(db.taxonomies.create(invalidType)).rejects.toThrow(
        ServiceError,
      );
    });

    it('throws an error when database insertion fails', async () => {
      // Mock the taxonomies service
      vi.spyOn(db.taxonomies, 'create').mockRejectedValue(
        new ServiceError(500, 'Database insertion failed'),
      );

      const input = {
        type: 'category' as const,
        name: 'Test',
        slug: 'test',
      };
      await expect(db.taxonomies.create(input)).rejects.toThrow(
        'Database insertion failed',
      );
    });
  });

  //
  // GET TAXONOMY BY ID
  //
  describe('getById', () => {
    let insertedId: string;

    beforeEach(async () => {
      // Create a test record to fetch
      const created = await db.taxonomies.create({
        type: 'category',
        name: 'Test Category',
        slug: 'test-category',
      });
      insertedId = created.id;
    });

    it('returns the taxonomy when found', async () => {
      const found = await db.taxonomies.getById(insertedId);
      expect(found).toBeDefined();
      expect(found?.id).toBe(insertedId);
    });

    it('returns null when taxonomy is not found', async () => {
      const nonExistentResult = await db.taxonomies.getById('non-existent-id');
      expect(nonExistentResult).toBeNull();
    });

    it('throws an error when database query fails', async () => {
      // Mock the taxonomies service
      vi.spyOn(db.taxonomies, 'getById').mockRejectedValue(
        new ServiceError(500, 'Database query failed'),
      );

      await expect(db.taxonomies.getById(insertedId)).rejects.toThrow(
        'Database query failed',
      );
    });
  });

  //
  // GET TAXONOMY LIST
  //
  describe('getList', () => {
    beforeEach(async () => {
      // Clear existing taxonomies and create test records
      const all = await db.taxonomies.getList();
      if (all.length) {
        const allIds = all.map((t) => t.id);
        await db.taxonomies.bulkDelete(allIds, true);
      }

      // Create test taxonomies with different types
      await db.taxonomies.create({
        type: 'category',
        name: 'Category A',
        slug: 'category-a',
      });
      await db.taxonomies.create({
        type: 'tag',
        name: 'Tag B',
        slug: 'tag-b',
      });
      await db.taxonomies.create({
        type: 'category',
        name: 'Category C',
        slug: 'category-c',
      });
    });

    it('returns all taxonomies by default', async () => {
      const list = await db.taxonomies.getList();
      expect(list.length).toBe(3);
    });

    it('respects the range parameter for pagination', async () => {
      const firstItemOnly = await db.taxonomies.getList([0, 0]);
      expect(firstItemOnly.length).toBe(1);
    });

    it('respects the sort parameter for ordering results', async () => {
      const sortedDesc = await db.taxonomies.getList(undefined, [
        'name',
        'DESC',
      ]);
      expect(sortedDesc[0].name >= sortedDesc[1].name).toBe(true);
    });

    it('respects the filter parameter for filtering results', async () => {
      const categoriesOnly = await db.taxonomies.getList(undefined, undefined, {
        type: 'category',
      });
      expect(categoriesOnly.every((t) => t.type === 'category')).toBe(true);
    });

    it('throws an error when database query fails', async () => {
      // Mock the taxonomies service
      vi.spyOn(db.taxonomies, 'getList').mockRejectedValue(
        new ServiceError(500, 'Database query failed'),
      );

      await expect(db.taxonomies.getList()).rejects.toThrow(
        'Database query failed',
      );
    });
  });

  //
  // UPDATE TAXONOMY
  //
  describe('update', () => {
    let existingId: string;

    beforeEach(async () => {
      // Create a test record to update
      const item = await db.taxonomies.create({
        type: 'category',
        name: 'Test Category',
        slug: 'test-category',
      });
      existingId = item.id;
    });

    it('updates taxonomy when it exists', async () => {
      const updated = await db.taxonomies.update(existingId, {
        name: 'Updated Category',
        slug: 'updated-category',
      });
      expect(updated.name).toBe('Updated Category');
      expect(updated.slug).toBe('updated-category');
    });

    it('throws an error when taxonomy does not exist', async () => {
      await expect(
        db.taxonomies.update('non-existent-id', { name: 'Nope' }),
      ).rejects.toThrow('No record found with ID: non-existent-id');
    });

    it('throws an error when database update fails', async () => {
      // Mock the taxonomies service
      vi.spyOn(db.taxonomies, 'update').mockRejectedValue(
        new ServiceError(500, 'Database update failed'),
      );

      await expect(
        db.taxonomies.update(existingId, { name: 'Fail' }),
      ).rejects.toThrow('Database update failed');
    });
  });

  //
  // DELETE TAXONOMY
  //
  describe('delete', () => {
    let createdId: string;

    beforeEach(async () => {
      // Create a test record to delete
      const item = await db.taxonomies.create({
        type: 'category',
        name: 'Test Category',
        slug: 'test-category',
      });
      createdId = item.id;
    });

    it('performs permanent delete', async () => {
      await db.taxonomies.delete(createdId, true);
      const refetch = await db.taxonomies.getById(createdId);
      expect(refetch).toBeNull();
    });

    it('throws an error when taxonomy does not exist', async () => {
      await expect(db.taxonomies.delete('non-existent-id')).rejects.toThrow(
        'No record found with ID: non-existent-id',
      );
    });

    it('throws an error when database delete operation fails', async () => {
      // Mock the taxonomies service
      vi.spyOn(db.taxonomies, 'delete').mockRejectedValue(
        new ServiceError(500, 'Database delete operation failed'),
      );

      await expect(db.taxonomies.delete(createdId, true)).rejects.toThrow(
        'Database delete operation failed',
      );
    });
  });

  //
  // BULK UPDATE TAXONOMIES
  //
  describe('bulkUpdate', () => {
    it('returns an empty array when no updates are provided', async () => {
      const result = await db.taxonomies.bulkUpdate([]);
      expect(result).toEqual([]);
    });

    it('updates multiple taxonomies in a single transaction', async () => {
      // Create test records to update
      const tax1 = await db.taxonomies.create({
        type: 'category',
        name: 'Category 1',
        slug: 'category-1',
      });
      const tax2 = await db.taxonomies.create({
        type: 'tag',
        name: 'Tag 2',
        slug: 'tag-2',
      });

      // Prepare bulk update operations
      const updates = [
        {
          id: tax1.id,
          data: { name: 'Updated Category 1', slug: 'updated-category-1' },
        },
        { id: tax2.id, data: { name: 'Updated Tag 2', slug: 'updated-tag-2' } },
      ];

      // Execute bulk update
      const result = await db.taxonomies.bulkUpdate(updates);

      // Verify updates were applied correctly
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Updated Category 1');
      expect(result[1].name).toBe('Updated Tag 2');
    });
  });

  //
  // BULK DELETE TAXONOMIES
  //
  describe('bulkDelete', () => {
    it('returns an empty array when no IDs are provided', async () => {
      const result = await db.taxonomies.bulkDelete([]);
      expect(result).toEqual([]);
    });

    it('performs permanent delete on multiple taxonomies', async () => {
      // Create test records to delete
      const tax1 = await db.taxonomies.create({
        type: 'category',
        name: 'Category 1',
        slug: 'category-1',
      });
      const tax2 = await db.taxonomies.create({
        type: 'tag',
        name: 'Tag 2',
        slug: 'tag-2',
      });
      const ids = [tax1.id, tax2.id];

      // Execute bulk delete
      const deletedRows = await db.taxonomies.bulkDelete(ids, true);
      expect(deletedRows).toHaveLength(2);

      // Verify items are permanently removed
      for (const id of ids) {
        const refetch = await db.taxonomies.getById(id);
        expect(refetch).toBeNull();
      }
    });

    it('handles non-existent IDs gracefully', async () => {
      // Create a test record
      const tax = await db.taxonomies.create({
        type: 'category',
        name: 'Test Category',
        slug: 'test-category',
      });

      // Attempt to delete existing and non-existent IDs
      const ids = [tax.id, 'non-existent'];
      const deletedRows = await db.taxonomies.bulkDelete(ids, true);

      // Verify only the existing item was deleted
      expect(deletedRows).toHaveLength(1);
      expect(deletedRows[0].id).toBe(tax.id);
    });

    it('throws an error when database delete operation fails', async () => {
      // Mock the taxonomies service
      vi.spyOn(db.taxonomies, 'bulkDelete').mockRejectedValue(
        new ServiceError(500, 'Database delete operation failed'),
      );

      await expect(db.taxonomies.bulkDelete(['any-id'], true)).rejects.toThrow(
        'Database delete operation failed',
      );
    });
  });
});
