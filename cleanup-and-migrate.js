import { query, testConnection } from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleanupAndMigrate() {
  console.log('🧹 Starting database cleanup and migration...');
  
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    console.log('🗑️  Cleaning up existing objects...');
    
    // Drop existing types if they exist
    const cleanupQueries = [
      'DROP TYPE IF EXISTS content_type CASCADE',
      'DROP TYPE IF EXISTS file_status CASCADE',
      'DROP TYPE IF EXISTS record_status CASCADE',
      'DROP TYPE IF EXISTS user_role CASCADE'
    ];
    
    for (const cleanupQuery of cleanupQueries) {
      try {
        await query(cleanupQuery);
        console.log('✅ Executed:', cleanupQuery);
      } catch (error) {
        console.log('⚠️  Could not execute:', cleanupQuery, '- probably doesn\'t exist');
      }
    }
    
    // Now let's run the migration in proper chunks
    console.log('🚀 Running migration in chunks...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements by semicolon, but be smarter about it
    const statements = [];
    let current = '';
    let inFunction = false;
    let inView = false;
    
    const lines = migrationContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (!trimmedLine || trimmedLine.startsWith('--')) {
        continue;
      }
      
      current += line + '\n';
      
      // Detect function/trigger blocks
      if (trimmedLine.includes('CREATE OR REPLACE FUNCTION') || 
          trimmedLine.includes('CREATE TRIGGER') ||
          trimmedLine.includes('CREATE VIEW')) {
        if (trimmedLine.includes('CREATE OR REPLACE FUNCTION')) inFunction = true;
        if (trimmedLine.includes('CREATE VIEW')) inView = true;
      }
      
      // End of function
      if (inFunction && trimmedLine.includes('$$ language')) {
        inFunction = false;
        statements.push(current.trim());
        current = '';
      }
      // End of view or regular statement
      else if ((inView && trimmedLine.endsWith(';')) || 
               (!inFunction && !inView && trimmedLine.endsWith(';'))) {
        inView = false;
        statements.push(current.trim());
        current = '';
      }
    }
    
    // Add any remaining content
    if (current.trim()) {
      statements.push(current.trim());
    }
    
    console.log(`📋 Found ${statements.length} statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
        console.log('Preview:', statement.substring(0, 80) + '...');
        
        try {
          await query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`❌ Statement ${i + 1} failed:`, error.message);
          console.error('Failed statement preview:', statement.substring(0, 300));
          
          // For certain errors, we might want to continue
          if (error.message.includes('already exists')) {
            console.log('⚠️  Object already exists, continuing...');
          } else {
            throw error;
          }
        }
      }
    }
    
    // Mark migration as completed in schema_migrations table
    try {
      await query(
        'INSERT INTO schema_migrations (migration_name, execution_time_ms, status) VALUES ($1, $2, $3) ON CONFLICT (migration_name) DO NOTHING',
        ['001_initial_schema.sql', 0, 'success']
      );
      console.log('✅ Migration marked as completed');
    } catch (error) {
      console.log('⚠️  Could not mark migration as completed:', error.message);
    }
    
    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Cleanup and migration failed:', error.message);
    process.exit(1);
  }
}

cleanupAndMigrate();