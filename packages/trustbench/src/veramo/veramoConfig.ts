// This will be the name for the local sqlite database for demo purposes
const DATABASE_FILE = 'database.sqlite';

export function databaseFileName(environmentName?: string) {
  if (!environmentName) return DATABASE_FILE;
  return `${environmentName}.sqlite`;
}
