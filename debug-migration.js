import { DatabaseMigrator } from './scripts/migrate-database.js';

console.log('🚀 Starting debug migration...');

const migrator = new DatabaseMigrator();

console.log('📋 Running migrations with debug output...');

try {
  const result = await migrator.runMigrations();
  console.log('✅ Migration completed:', result);
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error('Stack:', error.stack);
} finally {
  console.log('🏁 Migration process finished');
  process.exit(0);
}