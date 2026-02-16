import {executeSQL} from '../client';
import {User, UpdateUserInput} from '../../domain/models';

function mapRowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as number,
    displayName: row.displayName as string,
    email: row.email as string,
    notificationsEnabled: (row.notificationsEnabled as number) === 1,
  };
}

export const userRepository = {
  async get(): Promise<User | null> {
    const result = await executeSQL('SELECT * FROM user WHERE id = 1');
    if (result.rows.length === 0) {
      return null;
    }
    return mapRowToUser(result.rows[0]);
  },

  async create(user: Omit<User, 'id'>): Promise<User> {
    await executeSQL(
      'INSERT OR REPLACE INTO user (id, displayName, email, notificationsEnabled) VALUES (1, ?, ?, ?)',
      [user.displayName, user.email, user.notificationsEnabled ? 1 : 0],
    );
    return {
      id: 1,
      ...user,
    };
  },

  async update(input: UpdateUserInput): Promise<void> {
    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (input.displayName !== undefined) {
      updates.push('displayName = ?');
      params.push(input.displayName);
    }
    if (input.email !== undefined) {
      updates.push('email = ?');
      params.push(input.email);
    }
    if (input.notificationsEnabled !== undefined) {
      updates.push('notificationsEnabled = ?');
      params.push(input.notificationsEnabled ? 1 : 0);
    }

    if (updates.length > 0) {
      await executeSQL(
        `UPDATE user SET ${updates.join(', ')} WHERE id = 1`,
        params,
      );
    }
  },

  async delete(): Promise<void> {
    await executeSQL('DELETE FROM user');
  },
};
