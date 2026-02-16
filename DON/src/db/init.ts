import {getDatabase} from './client';
import {CREATE_TABLES_SQL} from './schema';
import {seedDatabase} from './seed';

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();

  const statements = CREATE_TABLES_SQL.split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    await db.execAsync(statement + ';');
  }

  await seedDatabase();
}
