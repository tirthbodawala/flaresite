import { createExecutionContext, env } from 'cloudflare:test';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

import { getInstance, initDBInstance, ServiceError } from '@/index';
import { validate } from 'uuid';
import { toSQLiteUTCString } from '@utils/date.util';
import { forceDBError } from '../setup.util';

// Initialize test context and database instance
const ctx = createExecutionContext();
const db = initDBInstance(ctx, env);

describe('organizations.service', () => {
  afterEach(() => {
    // Reset all mocks and spies after each test to ensure test isolation
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  //
  // CREATE ORGANIZATION
  //
  describe('create', () => {
    it('creates a new organization with all required fields', async () => {
      const input: Parameters<typeof db.organizations.create>[0] = {
        name: 'Test Organization',
        url: 'https://test.org',
      };
      const result = await db.organizations.create(input);

      // Verify all required fields are set correctly
      expect(result.id).toBeDefined();
      expect(validate(result.id)).toBe(true);
      expect(result.name).toBe('Test Organization');
      expect(result.url).toBe('https://test.org');

      // Verify auto-generated timestamp
      expect(result.createdAt).toBeDefined();
    });

    it('creates a new organization with all optional fields', async () => {
      const input: Parameters<typeof db.organizations.create>[0] = {
        name: 'Test Organization',
        url: 'https://test.org',
        logo: 'https://test.org/logo.png',
        contactEmail: 'contact@test.org',
        contactPhone: '+1234567890',
        address: '123 Test St, Test City',
        socialLinks: JSON.stringify({ twitter: 'https://twitter.com/test' }),
        jsonLd: JSON.stringify({ '@context': 'https://schema.org' }),
      };
      const result = await db.organizations.create(input);

      // Verify all fields are set correctly
      expect(result.logo).toBe('https://test.org/logo.png');
      expect(result.contactEmail).toBe('contact@test.org');
      expect(result.contactPhone).toBe('+1234567890');
      expect(result.address).toBe('123 Test St, Test City');
      expect(result.socialLinks).toBe(
        JSON.stringify({ twitter: 'https://twitter.com/test' }),
      );
      expect(result.jsonLd).toBe(
        JSON.stringify({ '@context': 'https://schema.org' }),
      );
    });

    it('throws an error when required fields are missing', async () => {
      // Missing required fields: name and url
      const badInput: any = {
        /* missing required fields */
      };
      await expect(db.organizations.create(badInput)).rejects.toThrow(
        ServiceError,
      );
    });

    it('throws an error when database insertion fails', async () => {
      forceDBError(ctx, 'insert', () => {
        throw new Error('Database insertion failed');
      });
      const input: Parameters<typeof db.organizations.create>[0] = {
        name: 'Error Test',
        url: 'https://error.test',
      };
      await expect(db.organizations.create(input)).rejects.toThrow(
        'Database insertion failed',
      );
    });
  });

  //
  // GET ORGANIZATION BY ID
  //
  describe('getById', () => {
    let insertedId: string;

    beforeEach(async () => {
      // Create a test record to fetch
      const created = await db.organizations.create({
        name: 'Single fetch test',
        url: 'https://single-fetch.test',
      });
      insertedId = created.id;
    });

    it('returns the organization when found', async () => {
      const found = await db.organizations.getById(insertedId);
      expect(found).toBeDefined();
      expect(found?.id).toBe(insertedId);
    });

    it('returns null when organization is not found', async () => {
      const nonExistentResult =
        await db.organizations.getById('non-existent-id');
      expect(nonExistentResult).toBeNull();
    });

    it('throws an error when database query fails', async () => {
      const instance = getInstance(ctx);
      if (!instance) throw new Error('Context instance not found');

      // Mock database query to force an error
      vi.spyOn(instance.db.query.organizations, 'findFirst').mockImplementation(
        () => {
          throw new Error('Database query failed');
        },
      );

      await expect(db.organizations.getById(insertedId)).rejects.toThrow(
        new ServiceError(500, 'Database error: Database query failed'),
      );
    });
  });

  //
  // GET ORGANIZATION LIST
  //
  describe('getList', () => {
    beforeEach(async () => {
      // Clear existing organizations and create test records
      const all = await db.organizations.getList();
      if (all.length) {
        const allIds = all.map((o) => o.id);
        await db.organizations.bulkDelete(allIds);
      }

      // Create test organizations
      await db.organizations.create({
        name: 'Org A',
        url: 'https://org-a.test',
      });
      await db.organizations.create({
        name: 'Org B',
        url: 'https://org-b.test',
      });
      await db.organizations.create({
        name: 'Org C',
        url: 'https://org-c.test',
      });
    });

    it('returns all organizations by default', async () => {
      const list = await db.organizations.getList();
      expect(list.length).toBe(3);
    });

    it('respects the range parameter for pagination', async () => {
      // Get only the first item using range [0, 0]
      const firstItemOnly = await db.organizations.getList([0, 0]);
      expect(firstItemOnly.length).toBe(1);
    });

    it('respects the sort parameter for ordering results', async () => {
      // Sort by name in descending order
      const sortedDesc = await db.organizations.getList(undefined, [
        'name',
        'DESC',
      ]);
      // Verify the first item's name is lexicographically greater than the second
      expect(sortedDesc[0].name >= sortedDesc[1].name).toBe(true);
    });

    it('throws an error when database query fails', async () => {
      const instance = getInstance(ctx);
      if (!instance) throw new Error('Context instance not found');

      // Mock database query to force an error
      vi.spyOn(instance.db.query.organizations, 'findMany').mockImplementation(
        () => {
          throw new Error('Database query failed');
        },
      );

      await expect(
        db.organizations.getList(undefined, undefined, {}),
      ).rejects.toThrow('Database query failed');
    });
  });

  //
  // UPDATE ORGANIZATION
  //
  describe('update', () => {
    let existingId: string;

    beforeEach(async () => {
      // Create a test record to update
      const item = await db.organizations.create({
        name: 'Update Target',
        url: 'https://update.test',
      });
      existingId = item.id;
    });

    it('updates organization when it exists', async () => {
      const updated = await db.organizations.update(existingId, {
        name: 'Updated Name!',
        contactEmail: 'updated@test.org',
      });
      expect(updated.name).toBe('Updated Name!');
      expect(updated.contactEmail).toBe('updated@test.org');
    });

    it('throws an error when organization does not exist', async () => {
      await expect(
        db.organizations.update('non-existent-id', { name: 'Nope' }),
      ).rejects.toThrow('No record found with ID: non-existent-id');
    });

    it('throws an error when database update fails', async () => {
      forceDBError(ctx, 'update', () => {
        throw new Error('Database update failed');
      });
      await expect(
        db.organizations.update(existingId, { name: 'Fail' }),
      ).rejects.toThrow('Database update failed');
    });
  });

  //
  // DELETE ORGANIZATION
  //
  describe('delete', () => {
    let createdId: string;

    beforeEach(async () => {
      // Create a test record to delete
      const item = await db.organizations.create({
        name: 'Delete Me',
        url: 'https://delete.test',
      });
      createdId = item.id;
    });

    it('deletes organization when it exists', async () => {
      await db.organizations.delete(createdId);

      // Verify the organization is no longer retrievable
      const refetch = await db.organizations.getById(createdId);
      expect(refetch).toBeNull();
    });

    it('throws an error when organization does not exist', async () => {
      await expect(db.organizations.delete('non-existent-id')).rejects.toThrow(
        'No record found with ID: non-existent-id',
      );
    });

    it('throws an error when database soft-delete operation fails', async () => {
      forceDBError(ctx, 'update', () => {
        throw new Error('Database delete operation failed');
      });
      await expect(db.organizations.delete(createdId)).rejects.toThrow(
        new ServiceError(
          500,
          'Database error: Database delete operation failed',
        ),
      );
    });
  });

  //
  // BULK UPDATE ORGANIZATIONS
  //
  describe('bulkUpdate', () => {
    it('returns an empty array when no updates are provided', async () => {
      const result = await db.organizations.bulkUpdate([]);
      expect(result).toEqual([]);
    });

    it('updates multiple items in a single transaction', async () => {
      // Create test records to update
      const item1 = await db.organizations.create({
        name: 'Bulk Item 1',
        url: 'https://bulk1.test',
      });
      const item2 = await db.organizations.create({
        name: 'Bulk Item 2',
        url: 'https://bulk2.test',
      });

      // Prepare bulk update operations
      const updates = [
        {
          id: item1.id,
          data: { name: 'Updated Bulk 1', contactEmail: 'bulk1@test.org' },
        },
        { id: item2.id, data: { name: 'Updated Bulk 2' } },
      ];

      // Execute bulk update
      const result = await db.organizations.bulkUpdate(updates);

      // Verify updates were applied correctly
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Updated Bulk 1');
      expect(result[1].name).toBe('Updated Bulk 2');
    });
  });

  //
  // BULK DELETE ORGANIZATIONS
  //
  describe('bulkDelete', () => {
    it('returns an empty array when no IDs are provided', async () => {
      const result = await db.organizations.bulkDelete([]);
      expect(result).toEqual([]);
    });

    it('deletes multiple items in a single transaction', async () => {
      // Create test records to delete
      const item1 = await db.organizations.create({
        name: 'Multi-delete 1',
        url: 'https://multi1.test',
      });
      const item2 = await db.organizations.create({
        name: 'Multi-delete 2',
        url: 'https://multi2.test',
      });
      const ids = [item1.id, item2.id];

      // Execute bulk delete
      const deletedRows = await db.organizations.bulkDelete(ids);
      expect(deletedRows).toHaveLength(2);

      // Verify items are no longer retrievable
      for (const id of ids) {
        const refetch = await db.organizations.getById(id);
        expect(refetch).toBeNull();
      }
    });

    it('handles non-existent IDs gracefully', async () => {
      // Create a test record
      const item = await db.organizations.create({
        name: 'Partial Del',
        url: 'https://partial.test',
      });

      // Attempt to delete existing and non-existent IDs
      const ids = [item.id, 'non-existent'];
      const deletedRows = await db.organizations.bulkDelete(ids);

      // Verify only the existing item was deleted
      expect(deletedRows).toHaveLength(1);
      expect(deletedRows[0].id).toBe(item.id);
    });
  });

  //
  // GET ORGANIZATION COUNT
  //
  describe('getCount', () => {
    beforeEach(async () => {
      // Clear existing organizations and create test records
      const all = await db.organizations.getList();
      if (all.length) {
        const allIds = all.map((o) => o.id);
        await db.organizations.bulkDelete(allIds);
      }

      // Create test organizations
      await db.organizations.create({
        name: 'Count Org 1',
        url: 'https://count1.test',
      });
      await db.organizations.create({
        name: 'Count Org 2',
        url: 'https://count2.test',
      });
      await db.organizations.create({
        name: 'Count Org 3',
        url: 'https://count3.test',
      });
    });

    it('returns the total count of organizations', async () => {
      const count = await db.organizations.getCount();
      expect(count).toBe(3);

      // Delete one item and verify count decreases
      const list = await db.organizations.getList();
      await db.organizations.delete(list[0].id);
      const countAfter = await db.organizations.getCount();
      expect(countAfter).toBe(2);
    });
  });
});
