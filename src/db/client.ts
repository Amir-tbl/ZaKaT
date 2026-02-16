import SQLite, {
  SQLiteDatabase,
  ResultSet,
} from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let dbInstance: SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await SQLite.openDatabase({
    name: 'donapp.db',
    location: 'default',
  });

  return dbInstance;
}

export async function executeSQL(
  sql: string,
  params: (string | number | null)[] = [],
): Promise<ResultSet> {
  const db = await getDatabase();
  const [result] = await db.executeSql(sql, params);
  return result;
}

export async function executeSQLBatch(statements: string[]): Promise<void> {
  const db = await getDatabase();
  for (const statement of statements) {
    if (statement.trim()) {
      await db.executeSql(statement);
    }
  }
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}
