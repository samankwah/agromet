import { query, testConnection } from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runManualMigration() {
  console.log('🚀 Testing manual migration execution...');
  
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file length:', migrationContent.length, 'characters');
    
    // Let's try executing the entire content as one statement
    console.log('🔄 Executing migration as single statement...');
    
    try {
      const result = await query(migrationContent);
      console.log('✅ Migration executed successfully!');
      console.log('Result:', result);
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      
      // Let's try breaking it into logical chunks manually
      console.log('🔄 Trying manual chunk execution...');
      
      // Split by major sections (double newlines)
      const chunks = migrationContent
        .split('\n\n')
        .map(chunk => chunk.trim())
        .filter(chunk => chunk && !chunk.startsWith('--'));
      
      console.log(`📋 Found ${chunks.length} chunks to execute`);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (chunk.trim()) {
          console.log(`🔄 Executing chunk ${i + 1}/${chunks.length}...`);
          console.log('Chunk preview:', chunk.substring(0, 100) + '...');
          
          try {
            await query(chunk);
            console.log(`✅ Chunk ${i + 1} executed successfully`);
          } catch (chunkError) {
            console.error(`❌ Chunk ${i + 1} failed:`, chunkError.message);
            console.error('Failed chunk:', chunk.substring(0, 200));
            break;
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Manual migration test failed:', error.message);
  }
}

runManualMigration();