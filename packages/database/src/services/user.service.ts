import { usersSchema } from '@schema/users.schema';
import {
  BaseService,
  GenericInsertType,
  GenericSelectType,
} from './base.service';
import { Ctx } from '../types';
import { eq, getTableColumns, or, and, isNull } from 'drizzle-orm';
import { ServiceError } from '../classes/service_error.class';
import { hashPassword, verifyPassword } from '@utils/auth.util';

export interface UserInsert extends GenericInsertType {
  username: string;
  email: string;
  // The DB column is passwordHash, but we’ll often store a hashed value:
  passwordHash?: string;
  role?: 'admin' | 'editor' | 'author' | 'subscriber';
  firstName?: string;
  lastName?: string;
  jsonLd?: string;
  createdAt?: string; // or Date, if that’s your approach
}

// We exclude passwordHash from what we actually return
export interface UserSelect extends Omit<GenericSelectType, 'deletedAt'> {
  id: string;
  deletedAt?: string | null;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'author' | 'subscriber';
  firstName?: string;
  lastName?: string;
  jsonLd?: string;
  createdAt?: string; // or Date
}

export class UserService extends BaseService<UserInsert, UserSelect> {
  constructor(ctx: Ctx) {
    super(usersSchema, ctx);
  }

  /**
   * 1) We override 'create' to block it.
   * Users must call createUser() below instead.
   */
  async create(
    _data: Omit<UserInsert, 'id'> & Partial<Pick<UserInsert, 'id'>>,
  ): Promise<UserSelect> {
    throw new ServiceError(
      400,
      'Please use createUser() for user creation. Direct create() is blocked.',
    );
  }

  /**
   * 2) The official method to create a user with a plain password.
   *    - We hash the password
   *    - Then we call super.create() behind the scenes
   */
  async createUser(
    data: { plainPassword: string } & Omit<
      UserInsert,
      'passwordHash' | 'id' | 'shortId'
    > &
      Partial<Pick<UserInsert, 'id' | 'shortId'>>,
  ): Promise<UserSelect> {
    // 1) Ensure a plain password is supplied
    if (!data.plainPassword.trim()) {
      throw new ServiceError(
        400,
        'A plain password is required to create a user.',
      );
    }

    // 2) Hash the password
    const hashed = await hashPassword(data.plainPassword);

    // 3) Create the user using BaseService
    const createdUser = await super.create({
      ...data,
      passwordHash: hashed, // Store hashed password
    });

    // 4) Return that user - Note that our TSelect does not have passwordHash,
    //    so if Drizzle tries returning it, it will mismatch. We can remove it explicitly:
    return this.#omitPasswordHash(createdUser);
  }

  /**
   * 3) Override getById to ensure passwordHash is removed from the returned object
   */
  async getById(
    id: string,
    includeDeleted = false,
  ): Promise<UserSelect | null> {
    const record = await super.getById(id, includeDeleted);
    return record ? this.#omitPasswordHash(record) : null;
  }

  /**
   * 4) Override getList similarly, removing passwordHash from each row
   */
  async getList(
    range?: [number, number],
    sort?: [keyof UserSelect, 'ASC' | 'DESC'],
    filter?: Partial<Record<keyof UserSelect, any>>,
    includeDeleted = false,
  ): Promise<UserSelect[]> {
    const records = await super.getList(range, sort, filter, includeDeleted);
    return records.map((r) => this.#omitPasswordHash(r));
  }

  /**
   * 5) Similarly override any other retrieval methods you use (getByShortId, etc.)
   */
  async getByShortId(
    shortId: string,
    includeDeleted = false,
  ): Promise<UserSelect | null> {
    const record = await super.getByShortId(shortId, includeDeleted);
    return record ? this.#omitPasswordHash(record) : null;
  }

  /**
   * 6) Example: verifyCredentials method
   */
  async verifyCredentials(
    usernameOrEmail: string,
    plainPassword: string,
  ): Promise<UserSelect | null> {
    // Suppose we have a custom method that fetches by username or email
    const user = await this.getByUsernameOrEmail(usernameOrEmail);
    if (!user) return null;

    // We do another query or store the passwordHash in a private fetch method
    // so we can compare. For brevity, let's assume user *does* contain passwordHash
    // (some DB libraries might always return columns even if our TS type excludes them).
    // If user.passwordHash is undefined in TS, we do a direct row-level fetch:

    const row = await this.ctx.db.query.users.findFirst({
      where: (fields) =>
        or(
          eq(fields.username, usernameOrEmail),
          eq(fields.email, usernameOrEmail),
        ),
    });
    if (!row || !row.passwordHash) return null;

    const isValid = await verifyPassword(plainPassword, row.passwordHash);
    if (!isValid) return null;

    return this.#omitPasswordHash(user);
  }

  // Custom method to retrieve user by username or email
  private async getByUsernameOrEmail(
    value: string,
  ): Promise<UserSelect | null> {
    const columns = getTableColumns(this.schema);
    const orConditions = [];
    const andConditions = [];
    if ('email' in columns) {
      orConditions.push(eq(columns.email, value));
    }
    if ('username' in columns) {
      orConditions.push(eq(columns.username, value));
    }
    if ('deletedAt' in columns) {
      andConditions.push(isNull(columns.deletedAt));
    }

    const records = (await this.ctx.db
      .select()
      .from(this.schema)
      .where(and(or(...orConditions), ...andConditions))) as UserSelect[];

    return records[0] ? this.#omitPasswordHash(records[0]) : null;
  }

  /**
   * Utility to remove passwordHash from the returned object, if it’s present.
   */
  #omitPasswordHash<T extends { [k: string]: any }>(record: T): T {
    // We simply destructure out passwordHash if it exists,
    // returning all other properties
    const { passwordHash, ...rest } = record;
    return rest as T;
  }
}
