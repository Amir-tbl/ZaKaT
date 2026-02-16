export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amountCents INTEGER NOT NULL,
    createdAt INTEGER NOT NULL,
    applicantId INTEGER NULL
  );

  CREATE TABLE IF NOT EXISTS applicants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    city TEXT NOT NULL,
    shortStory TEXT NOT NULL,
    validated INTEGER NOT NULL DEFAULT 0,
    goalCents INTEGER NOT NULL,
    collectedCents INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY,
    displayName TEXT NOT NULL,
    email TEXT NOT NULL,
    notificationsEnabled INTEGER NOT NULL DEFAULT 1
  );
`;

export const DROP_TABLES_SQL = `
  DROP TABLE IF EXISTS donations;
  DROP TABLE IF EXISTS applicants;
  DROP TABLE IF EXISTS user;
  DROP TABLE IF EXISTS meta;
`;
