import { createExecutionContext, env } from 'cloudflare:test';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { getInstance, initDBInstance, ServiceError } from '@/index';
import { validate } from 'uuid';
import { UserSelect } from '@/services/user.service';
import { forceDBError } from '../setup.util';

// Initialize test context and database instance
const ctx = createExecutionContext();
const db = initDBInstance(ctx, env);

describe('user.service', () => {
  afterEach(() => {
    // Reset all mocks and spies after each test to ensure test isolation
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  //
  // CREATE USER
  //
  describe('createUser', () => {
    it('blocks direct create() method', async () => {
      await expect(
        db.users.create({
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: 'hashed',
        }),
      ).rejects.toThrow('Please use createUser() for user creation');
    });

    it('creates a new user with all required fields', async () => {
      const input = {
        username: 'testuser',
        email: 'test@example.com',
        plainPassword: 'password123',
        role: 'author',
        firstName: 'Test',
        lastName: 'User',
      };

      const result = await db.users.createUser(input);

      // Verify all required fields are set correctly
      expect(result.id).toBeDefined();
      expect(validate(result.id)).toBe(true);
      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('author');
      expect(result.firstName).toBe('Test');
      expect(result.lastName).toBe('User');

      // Verify auto-generated timestamps
      expect(result.createdAt).toBeDefined();

      // passwordHash should NOT be present in the returned object
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws an error when required fields are missing', async () => {
      // Include plainPassword but set it to an empty string
      const badInput = {
        plainPassword: '',
        // Missing other required fields like username, email
      };
      await expect(db.users.createUser(badInput)).rejects.toThrow(ServiceError);
    });

    it('throws an error when password is empty string', async () => {
      const input = {
        username: 'testuser',
        email: 'test@example.com',
        plainPassword: '', // Empty string
      };
      await expect(db.users.createUser(input)).rejects.toThrow(ServiceError);
    });

    it('throws an error when password is only whitespace', async () => {
      const input = {
        username: 'testuser',
        email: 'test@example.com',
        plainPassword: '   ', // Whitespace only
      };
      await expect(db.users.createUser(input)).rejects.toThrow(ServiceError);
    });

    it('throws an error when role violates enum constraints', async () => {
      const invalidRole: any = {
        username: 'testuser',
        email: 'test@example.com',
        plainPassword: 'password123',
        role: 'invalid_role', // Not in ['admin', 'editor', 'author', 'subscriber']
      };
      await expect(db.users.createUser(invalidRole)).rejects.toThrow(
        ServiceError,
      );
    });

    it('throws an error when database insertion fails', async () => {
      // Mock the super.create method that createUser calls internally
      forceDBError(ctx, 'insert', () => {
        throw new Error('Database insertion failed');
      });

      const input = {
        username: 'testuser',
        email: 'test@example.com',
        plainPassword: 'password123',
      };
      await expect(db.users.createUser(input)).rejects.toThrow(
        'Database insertion failed',
      );
    });

    it('accepts valid non-empty password', async () => {
      const input = {
        username: 'testuser',
        email: 'test@example.com',
        plainPassword: 'validPassword123',
      };
      const result = await db.users.createUser(input);
      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
    });
  });

  //
  // GET USER BY ID
  //
  describe('getById', () => {
    let insertedId: string;

    beforeEach(async () => {
      // Create a test record to fetch
      const created = await db.users.createUser({
        username: 'testuser',
        email: 'test@example.com',
        plainPassword: 'password123',
      });
      insertedId = created.id;
    });

    it('returns the user when found', async () => {
      const found = await db.users.getById(insertedId);
      expect(found).toBeDefined();
      expect(found?.id).toBe(insertedId);
      // passwordHash should not be present
      expect(found).not.toHaveProperty('passwordHash');
    });

    it('returns null when user is not found', async () => {
      const nonExistentResult = await db.users.getById('non-existent-id');
      expect(nonExistentResult).toBeNull();
    });

    it('throws an error when database query fails', async () => {
      const instance = getInstance(ctx);
      if (!instance) throw new Error('Context instance not found');
      // Mock the getById method of BaseService that UserService.getById calls
      vi.spyOn(instance.db.query.users, 'findFirst').mockImplementation(() => {
        throw new Error('Database query failed');
      });

      await expect(db.users.getById(insertedId)).rejects.toThrow(
        'Database query failed',
      );
    });
  });

  //
  // GET USER LIST
  //
  describe('getList', () => {
    beforeEach(async () => {
      // Clear existing users and create test records
      const all = await db.users.getList();
      if (all.length) {
        const allIds = all.map((u) => u.id);
        await db.users.bulkDelete(allIds, true);
      }

      // Create test users with different roles
      await db.users.createUser({
        username: 'admin1',
        email: 'admin1@example.com',
        plainPassword: 'password123',
        role: 'admin',
      });
      await db.users.createUser({
        username: 'editor1',
        email: 'editor1@example.com',
        plainPassword: 'password123',
        role: 'editor',
      });
      await db.users.createUser({
        username: 'author1',
        email: 'author1@example.com',
        plainPassword: 'password123',
        role: 'author',
      });
    });

    it('returns all users by default', async () => {
      const list = await db.users.getList();
      expect(list.length).toBe(3);
      // No passwords exposed
      list.forEach((user) => {
        expect(user).not.toHaveProperty('passwordHash');
      });
    });

    it('respects the range parameter for pagination', async () => {
      const firstItemOnly = await db.users.getList([0, 0]);
      expect(firstItemOnly.length).toBe(1);
    });

    it('respects the sort parameter for ordering results', async () => {
      const sortedDesc = await db.users.getList(undefined, [
        'username',
        'DESC',
      ]);
      expect(sortedDesc[0].username >= sortedDesc[1].username).toBe(true);
    });

    it('respects the filter parameter for filtering results', async () => {
      const adminsOnly = await db.users.getList(undefined, undefined, {
        role: 'admin',
      });
      expect(adminsOnly.every((u) => u.role === 'admin')).toBe(true);
    });

    it('throws an error when database query fails', async () => {
      const instance = getInstance(ctx);
      if (!instance) throw new Error('Context instance not found');

      // Mock the query.users.findFirst method directly
      vi.spyOn(instance.db.query.users, 'findMany').mockImplementation(() => {
        throw new Error('Database query failed');
      });

      await expect(db.users.getList()).rejects.toThrow('Database query failed');
    });
  });

  //
  // UPDATE USER
  //
  describe('update', () => {
    let existingId: string;

    beforeEach(async () => {
      // Create a test record to update
      const item = await db.users.createUser({
        username: 'testuser',
        email: 'test@example.com',
        plainPassword: 'password123',
      });
      existingId = item.id;
    });

    it('updates user when it exists', async () => {
      const updated = await db.users.update(existingId, {
        firstName: 'Updated',
        lastName: 'Name',
      });

      expect(updated.firstName).toBe('Updated');
      expect(updated.lastName).toBe('Name');

      // The object returned to the client should not have passwordHash
      expect(updated).not.toHaveProperty('passwordHash');
    });

    it('throws an error when user does not exist', async () => {
      await expect(
        db.users.update('non-existent-id', { firstName: 'Nope' }),
      ).rejects.toThrow('No record found with ID: non-existent-id');
    });

    it('throws an error when database update fails', async () => {
      // Mock the update method directly
      forceDBError(ctx, 'update', () => {
        throw new Error('Database update failed');
      });

      await expect(
        db.users.update(existingId, { firstName: 'Fail' }),
      ).rejects.toThrow('Database update failed');
    });
  });

  //
  // DELETE USER
  //
  describe('delete', () => {
    let createdId: string;

    beforeEach(async () => {
      // Create a test record to delete
      const item = await db.users.createUser({
        username: 'testuser',
        email: 'test@example.com',
        plainPassword: 'password123',
      });
      createdId = item.id;
    });

    it('performs permanent delete', async () => {
      await db.users.delete(createdId, true);
      const refetch = await db.users.getById(createdId);
      expect(refetch).toBeNull();
    });

    it('performs soft delete when permanent is false', async () => {
      await db.users.delete(createdId, false);
      const refetch = await db.users.getById(createdId);
      expect(refetch).toBeNull(); // User should not be visible in normal queries

      // Verify user is still in database but marked as deleted
      const refetchWithDeleted = await db.users.getById(createdId, true);
      expect(refetchWithDeleted).toBeDefined();
      expect(refetchWithDeleted?.deletedAt).toBeDefined();
    });

    it('throws an error when user does not exist', async () => {
      await expect(db.users.delete('non-existent-id', true)).rejects.toThrow(
        'No record found with ID: non-existent-id',
      );
    });

    it('throws an error when database delete operation fails', async () => {
      forceDBError(ctx, 'delete', () => {
        throw new Error('Database delete operation failed');
      });

      await expect(db.users.delete(createdId, true)).rejects.toThrow(
        'Database delete operation failed',
      );
    });
  });

  //
  // BULK UPDATE USERS
  //
  describe('bulkUpdate', () => {
    it('returns an empty array when no updates are provided', async () => {
      const result = await db.users.bulkUpdate([]);
      expect(result).toEqual([]);
    });

    it('updates multiple users in a single transaction', async () => {
      // Create test records to update
      const user1 = await db.users.createUser({
        username: 'user1',
        email: 'user1@example.com',
        plainPassword: 'password123',
      });
      const user2 = await db.users.createUser({
        username: 'user2',
        email: 'user2@example.com',
        plainPassword: 'password123',
      });

      // Prepare bulk update operations
      const updates = [
        {
          id: user1.id,
          data: { firstName: 'Updated1', lastName: 'User1' },
        },
        { id: user2.id, data: { firstName: 'Updated2', lastName: 'User2' } },
      ];

      const result = await db.users.bulkUpdate(updates);

      // Verify updates were applied correctly
      expect(result).toHaveLength(2);
      expect(result[0].firstName).toBe('Updated1');
      expect(result[1].firstName).toBe('Updated2');

      // Verify no passwordHash is exposed in the client results
      result.forEach((user) => {
        expect(user).not.toHaveProperty('passwordHash');
      });
    });
  });

  //
  // BULK DELETE USERS
  //
  describe('bulkDelete', () => {
    it('returns an empty array when no IDs are provided', async () => {
      const result = await db.users.bulkDelete([]);
      expect(result).toEqual([]);
    });

    it('performs permanent delete on multiple users', async () => {
      const user1 = await db.users.createUser({
        username: 'user1',
        email: 'user1@example.com',
        plainPassword: 'password123',
      });
      const user2 = await db.users.createUser({
        username: 'user2',
        email: 'user2@example.com',
        plainPassword: 'password123',
      });
      const ids = [user1.id, user2.id];

      const deletedRows = await db.users.bulkDelete(ids, true);
      expect(deletedRows).toHaveLength(2);

      for (const id of ids) {
        const refetch = await db.users.getById(id);
        expect(refetch).toBeNull();
      }
    });

    it('performs soft delete on multiple users when permanent is false', async () => {
      const user1 = await db.users.createUser({
        username: 'user1',
        email: 'user1@example.com',
        plainPassword: 'password123',
      });
      const user2 = await db.users.createUser({
        username: 'user2',
        email: 'user2@example.com',
        plainPassword: 'password123',
      });
      const ids = [user1.id, user2.id];

      const deletedRows = await db.users.bulkDelete(ids, false);
      expect(deletedRows).toHaveLength(2);

      // Verify users are not visible in normal queries
      for (const id of ids) {
        const refetch = await db.users.getById(id);
        expect(refetch).toBeNull();

        // Verify users are still in database but marked as deleted
        const refetchWithDeleted = await db.users.getById(id, true);
        expect(refetchWithDeleted).toBeDefined();
        expect(refetchWithDeleted?.deletedAt).toBeDefined();
      }
    });

    it('handles non-existent IDs gracefully', async () => {
      const user = await db.users.createUser({
        username: 'testuser',
        email: 'test@example.com',
        plainPassword: 'password123',
      });

      const ids = [user.id, 'non-existent'];
      const deletedRows = await db.users.bulkDelete(ids, true);

      expect(deletedRows).toHaveLength(1);
      expect(deletedRows[0].id).toBe(user.id);
    });

    it('resolves to empty array when no data is deleted', async () => {
      await expect(db.users.bulkDelete(['any-id'], true)).resolves.toEqual([]);
    });
  });

  //
  // VERIFY CREDENTIALS
  //
  describe('verifyCredentials', () => {
    let testUser: UserSelect;

    beforeEach(async () => {
      testUser = await db.users.createUser({
        username: 'testuser',
        email: 'test@example.com',
        plainPassword: 'password123',
      });
    });

    it('returns user when credentials are valid', async () => {
      const result = await db.users.verifyCredentials(
        'testuser',
        'password123',
      );
      expect(result).toBeDefined();
      expect(result?.id).toBe(testUser.id);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('returns null when username/email is not found', async () => {
      const result = await db.users.verifyCredentials(
        'nonexistent',
        'password123',
      );
      expect(result).toBeNull();
    });

    it('returns null when password is incorrect', async () => {
      const result = await db.users.verifyCredentials(
        'testuser',
        'wrongpassword',
      );
      expect(result).toBeNull();
    });

    it('works with email as well as username', async () => {
      const result = await db.users.verifyCredentials(
        'test@example.com',
        'password123',
      );
      expect(result).toBeDefined();
      expect(result?.id).toBe(testUser.id);
    });

    it('returns null when user is soft deleted', async () => {
      // Soft delete the user
      await db.users.delete(testUser.id, false);

      // Try to verify credentials for the deleted user
      const result = await db.users.verifyCredentials(
        'testuser',
        'password123',
      );
      expect(result).toBeNull();

      // Try with email as well
      const resultByEmail = await db.users.verifyCredentials(
        'test@example.com',
        'password123',
      );
      expect(resultByEmail).toBeNull();
    });

    it('handles username and email lookups separately', async () => {
      // Create a user with distinct username and email
      const user = await db.users.createUser({
        username: 'separateuser',
        email: 'separate@example.com',
        plainPassword: 'password123',
      });

      // Test username lookup
      const resultByUsername = await db.users.verifyCredentials(
        'separateuser',
        'password123',
      );
      expect(resultByUsername).toBeDefined();
      expect(resultByUsername?.id).toBe(user.id);

      // Test email lookup separately
      const resultByEmail = await db.users.verifyCredentials(
        'separate@example.com',
        'password123',
      );
      expect(resultByEmail).toBeDefined();
      expect(resultByEmail?.id).toBe(user.id);
    });

    it('handles deletedAt condition in getByUsernameOrEmail', async () => {
      // Create a user with deletedAt set
      const deletedUser = await db.users.createUser({
        username: 'deleteduser',
        email: 'deleted@example.com',
        plainPassword: 'password123',
      });

      // Delete the user
      await db.users.delete(deletedUser.id, true);

      // Try to find the deleted user by username
      const resultByUsername = await db.users.verifyCredentials(
        'deleteduser',
        'password123',
      );
      expect(resultByUsername).toBeNull();

      // Try to find the deleted user by email
      const resultByEmail = await db.users.verifyCredentials(
        'deleted@example.com',
        'password123',
      );
      expect(resultByEmail).toBeNull();
    });

    it('handles deletedAt condition with multiple users', async () => {
      // Create two users
      const user1 = await db.users.createUser({
        username: 'user1',
        email: 'user1@example.com',
        plainPassword: 'password123',
      });

      const user2 = await db.users.createUser({
        username: 'user2',
        email: 'user2@example.com',
        plainPassword: 'password123',
      });

      // Delete one user
      await db.users.delete(user1.id, true);

      // Verify we can still find the non-deleted user
      const result = await db.users.verifyCredentials('user2', 'password123');
      expect(result).toBeDefined();
      expect(result?.id).toBe(user2.id);
    });

    it('throws an error when database query fails', async () => {
      // Mock the database query to simulate a failure
      const instance = getInstance(ctx);
      if (!instance) throw new Error('Context instance not found');

      vi.spyOn(instance.db.query.users, 'findFirst').mockImplementation(() => {
        throw new Error('Database query failed');
      });

      await expect(
        db.users.verifyCredentials('testuser', 'password123'),
      ).rejects.toThrow('Database query failed');
    });

    it('handles user lookup by email and username', async () => {
      // Create a test user with unique email
      const user = await db.users.createUser({
        username: 'testuser_lookup',
        email: 'test_lookup@example.com',
        plainPassword: 'password123',
      });

      // Test lookup by username
      const resultByUsername = await db.users.verifyCredentials(
        'testuser_lookup',
        'password123',
      );
      expect(resultByUsername).toBeDefined();
      expect(resultByUsername?.id).toBe(user.id);

      // Test lookup by email
      const resultByEmail = await db.users.verifyCredentials(
        'test_lookup@example.com',
        'password123',
      );
      expect(resultByEmail).toBeDefined();
      expect(resultByEmail?.id).toBe(user.id);
    });

    it('handles deleted user lookup', async () => {
      // Create two users with unique emails
      const user1 = await db.users.createUser({
        username: 'user1_deleted',
        email: 'user1_deleted@example.com',
        plainPassword: 'password123',
      });

      const user2 = await db.users.createUser({
        username: 'user2_active',
        email: 'user2_active@example.com',
        plainPassword: 'password123',
      });

      // Delete one user
      await db.users.delete(user1.id, false);

      // Verify deleted user cannot be found
      const resultDeleted = await db.users.verifyCredentials(
        'user1_deleted',
        'password123',
      );
      expect(resultDeleted).toBeNull();

      // Verify non-deleted user can still be found
      const resultActive = await db.users.verifyCredentials(
        'user2_active',
        'password123',
      );
      expect(resultActive).toBeDefined();
      expect(resultActive?.id).toBe(user2.id);
    });
  });
});
