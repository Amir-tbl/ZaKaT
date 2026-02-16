import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await SQLite.openDatabaseAsync('donapp.db');
  return dbInstance;
}

export interface SQLResult {
  rows: Record<string, unknown>[];
  insertId?: number;
}

export async function executeSQL(
  sql: string,
  params: (string | number | null)[] = [],
): Promise<SQLResult> {
  const db = await getDatabase();

  // Pour les requêtes INSERT, UPDATE, DELETE
  if (sql.trim().toUpperCase().startsWith('INSERT') ||
      sql.trim().toUpperCase().startsWith('UPDATE') ||
      sql.trim().toUpperCase().startsWith('DELETE')) {
    const result = await db.runAsync(sql, params);
    return {
      rows: [],
      insertId: result.lastInsertRowId,
    };
  }

  // Pour les requêtes SELECT
  const rows = await db.getAllAsync(sql, params);
  return {
    rows: rows as Record<string, unknown>[],
  };
}

export async function executeSQLBatch(statements: string[]): Promise<void> {
  const db = await getDatabase();
  for (const statement of statements) {
    if (statement.trim()) {
      await db.execAsync(statement);
    }
  }
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}
