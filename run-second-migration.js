import { query, testConnection } from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSecondMigration() {
  console.log('🚀 Running second migration (reference data)...');
  
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Check if migration already ran
    const existingMigration = await query('SELECT * FROM schema_migrations WHERE migration_name = $1', ['002_seed_reference_data.sql']);
    
    if (existingMigration.rows.length > 0) {
      console.log('✅ Migration 002_seed_reference_data.sql already executed');
      return;
    }
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '002_seed_reference_data.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Executing reference data seeding...');
    
    try {
      // Execute the entire migration content
      await query(migrationContent);
      console.log('✅ Reference data migration executed successfully');
      
      // Mark migration as completed
      await query(
        'INSERT INTO schema_migrations (migration_name, execution_time_ms, status) VALUES ($1, $2, $3)',
        ['002_seed_reference_data.sql', 0, 'success']
      );
      
      console.log('✅ Migration marked as completed');
      
    } catch (error) {
      console.error('❌ Reference data migration failed:', error.message);
      
      // Mark as failed
      await query(
        'INSERT INTO schema_migrations (migration_name, execution_time_ms, status) VALUES ($1, $2, $3)',
        ['002_seed_reference_data.sql', 0, 'failed']
      );
      
      throw error;
    }
    
    // Verify data was loaded
    console.log('🔍 Verifying data was loaded...');
    
    const counts = await Promise.all([
      query('SELECT COUNT(*) as count FROM regions'),
      query('SELECT COUNT(*) as count FROM districts'),
      query('SELECT COUNT(*) as count FROM commodities'),
      query('SELECT COUNT(*) as count FROM production_stages')
    ]);
    
    console.log('📊 Data loaded:');
    console.log(`   - Regions: ${counts[0].rows[0].count}`);
    console.log(`   - Districts: ${counts[1].rows[0].count}`);
    console.log(`   - Commodities: ${counts[2].rows[0].count}`);
    console.log(`   - Production stages: ${counts[3].rows[0].count}`);
    
    console.log('🎉 Second migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Second migration failed:', error.message);
    process.exit(1);
  }
}

runSecondMigration();