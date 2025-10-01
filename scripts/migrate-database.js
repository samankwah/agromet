import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection, query } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Migration configuration
const MIGRATIONS_DIR = path.join(__dirname, '../migrations');
const MIGRATION_TABLE = 'schema_migrations';

class DatabaseMigrator {
  constructor() {
    this.migrationsPath = MIGRATIONS_DIR;
  }

  /**
   * Initialize migration tracking table
   */
  async initMigrationTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        execution_time_ms INTEGER,
        status VARCHAR(20) DEFAULT 'success'
      );
    `;
    
    try {
      await query(createTableQuery);
      console.log('✅ Migration tracking table initialized');
    } catch (error) {
      console.error('❌ Error initializing migration table:', error.message);
      throw error;
    }
  }

  /**
   * Get list of executed migrations
   */
  async getExecutedMigrations() {
    try {
      const result = await query(`SELECT migration_name FROM ${MIGRATION_TABLE} WHERE status = 'success'`);
      return result.rows.map(row => row.migration_name);
    } catch (error) {
      // If table doesn't exist, return empty array
      if (error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get list of migration files
   */
  getMigrationFiles() {
    try {
      const files = fs.readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      return files;
    } catch (error) {
      console.error('❌ Error reading migrations directory:', error.message);
      return [];
    }
  }

  /**
   * Read migration file content
   */
  readMigrationFile(filename) {
    const filePath = path.join(this.migrationsPath, filename);
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error(`❌ Error reading migration file ${filename}:`, error.message);
      throw error;
    }
  }

  /**
   * Execute a single migration
   */
  async executeMigration(filename, content) {
    console.log(`🔄 Executing migration: ${filename}`);
    const startTime = Date.now();
    
    try {
      // Split content by semicolons and execute each statement
      const statements = content
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          await query(statement);
        }
      }
      
      const executionTime = Date.now() - startTime;
      
      // Record successful migration
      await query(
        `INSERT INTO ${MIGRATION_TABLE} (migration_name, execution_time_ms, status) VALUES ($1, $2, 'success')`,
        [filename, executionTime]
      );
      
      console.log(`✅ Migration ${filename} completed in ${executionTime}ms`);
      return true;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Record failed migration
      try {
        await query(
          `INSERT INTO ${MIGRATION_TABLE} (migration_name, execution_time_ms, status) VALUES ($1, $2, 'failed')`,
          [filename, executionTime]
        );
      } catch (recordError) {
        console.error('❌ Error recording failed migration:', recordError.message);
      }
      
      console.error(`❌ Migration ${filename} failed after ${executionTime}ms:`, error.message);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations() {
    try {
      console.log('🚀 Starting database migrations...');
      
      // Test database connection
      const connected = await testConnection();
      if (!connected) {
        throw new Error('Cannot connect to database');
      }
      
      // Initialize migration tracking
      await this.initMigrationTable();
      
      // Get migration files and executed migrations
      const migrationFiles = this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      // Filter pending migrations
      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file)
      );
      
      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations found. Database is up to date.');
        return true;
      }
      
      console.log(`📋 Found ${pendingMigrations.length} pending migration(s):`);
      pendingMigrations.forEach(file => console.log(`   - ${file}`));
      
      // Execute pending migrations
      for (const migrationFile of pendingMigrations) {
        const content = this.readMigrationFile(migrationFile);
        await this.executeMigration(migrationFile, content);
      }
      
      console.log(`🎉 Successfully executed ${pendingMigrations.length} migration(s)`);
      
      // Display final status
      await this.showMigrationStatus();
      
      return true;
    } catch (error) {
      console.error('❌ Migration process failed:', error.message);
      return false;
    }
  }

  /**
   * Show migration status
   */
  async showMigrationStatus() {
    try {
      const result = await query(`
        SELECT 
          migration_name,
          executed_at,
          execution_time_ms,
          status
        FROM ${MIGRATION_TABLE}
        ORDER BY id
      `);
      
      console.log('\n📊 Migration Status:');
      console.log('─'.repeat(80));
      console.log('Migration File'.padEnd(40) + 'Status'.padEnd(10) + 'Executed At'.padEnd(20) + 'Time');
      console.log('─'.repeat(80));
      
      result.rows.forEach(row => {
        const status = row.status === 'success' ? '✅' : '❌';
        const executedAt = row.executed_at.toISOString().substring(0, 19).replace('T', ' ');
        const timeMs = row.execution_time_ms + 'ms';
        
        console.log(
          row.migration_name.padEnd(40) +
          status.padEnd(10) +
          executedAt.padEnd(20) +
          timeMs
        );
      });
      
      console.log('─'.repeat(80));
    } catch (error) {
      console.error('❌ Error showing migration status:', error.message);
    }
  }

  /**
   * Rollback last migration (for development use)
   */
  async rollbackLastMigration() {
    console.log('⚠️  Rollback functionality not implemented');
    console.log('   Manual database restoration required for rollbacks');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'migrate';
  
  const migrator = new DatabaseMigrator();
  
  try {
    switch (command) {
      case 'migrate':
      case 'up':
        await migrator.runMigrations();
        break;
      
      case 'status':
        await migrator.showMigrationStatus();
        break;
      
      case 'rollback':
        await migrator.rollbackLastMigration();
        break;
      
      default:
        console.log(`
TriAgro AI Database Migration Tool

Usage:
  npm run migrate        - Run all pending migrations
  npm run migrate status - Show migration status
  npm run migrate up     - Run all pending migrations (alias)

Examples:
  node scripts/migrate-database.js
  node scripts/migrate-database.js status
        `);
    }
  } catch (error) {
    console.error('❌ Migration tool error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DatabaseMigrator };