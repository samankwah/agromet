/**
 * Database Setup Script
 *
 * Initializes PostgreSQL database with schema and sample data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, query, testConnection, closePool } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Read and execute SQL schema file
 */
const runSchema = async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📋 Executing database schema...');

    // Split the schema into individual statements (handle multi-line statements)
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        await query(statement);
      }
    }

    console.log('✅ Database schema created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating schema:', error.message);
    throw error;
  }
};

/**
 * Check if database tables exist
 */
const checkTables = async () => {
  try {
    const result = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('crop_calendars', 'calendar_seasons', 'calendar_timelines', 'calendar_activities', 'calendar_grids')
      ORDER BY table_name
    `);

    const expectedTables = ['crop_calendars', 'calendar_seasons', 'calendar_timelines', 'calendar_activities', 'calendar_grids'];
    const existingTables = result.rows.map(row => row.table_name);

    console.log('📋 Expected tables:', expectedTables);
    console.log('📋 Existing tables:', existingTables);

    const missingTables = expectedTables.filter(table => !existingTables.includes(table));

    if (missingTables.length > 0) {
      console.log('⚠️ Missing tables:', missingTables);
      return false;
    }

    console.log('✅ All required tables exist');
    return true;
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    throw error;
  }
};

/**
 * Create sample data for testing
 */
const createSampleData = async () => {
  try {
    console.log('📝 Creating sample data...');

    // Check if sample data already exists
    const existingData = await query('SELECT COUNT(*) as count FROM crop_calendars');
    if (parseInt(existingData.rows[0].count) > 0) {
      console.log('📋 Sample data already exists, skipping...');
      return;
    }

    // Insert sample calendar
    const uniqueId = `CC_Sample_Region_Sample_District_Maize_${Date.now()}`;

    const calendarResult = await query(`
      INSERT INTO crop_calendars (unique_id, region, district, crop, data_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [uniqueId, 'Sample Region', 'Sample District', 'Maize', 'crop-calendar']);

    const calendarId = calendarResult.rows[0].id;

    // Insert sample season
    await query(`
      INSERT INTO calendar_seasons (calendar_id, season_type, start_month, start_week, has_file)
      VALUES ($1, $2, $3, $4, $5)
    `, [calendarId, 'major', 'JAN', '2025-01-01', false]);

    // Insert sample timeline
    await query(`
      INSERT INTO calendar_timelines (calendar_id, timeline_type, total_weeks, start_month, end_month, months, weeks)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      calendarId,
      'absolute',
      24,
      'JAN',
      'JUN',
      JSON.stringify(['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN']),
      JSON.stringify([
        { index: 0, label: 'WK1', month: 'JAN' },
        { index: 1, label: 'WK2', month: 'JAN' }
      ])
    ]);

    // Insert sample activities
    const sampleActivities = [
      { name: 'Site Selection', rowIndex: 1, color: '#00B0F0' },
      { name: 'Land preparation', rowIndex: 2, color: '#BF9000' },
      { name: 'Planting/sowing', rowIndex: 3, color: '#000000' }
    ];

    for (const activity of sampleActivities) {
      await query(`
        INSERT INTO calendar_activities (calendar_id, activity_name, row_index, excel_row, color)
        VALUES ($1, $2, $3, $4, $5)
      `, [calendarId, activity.name, activity.rowIndex, activity.rowIndex, activity.color]);
    }

    console.log('✅ Sample data created successfully');
  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
    throw error;
  }
};

/**
 * Display database information
 */
const showDatabaseInfo = async () => {
  try {
    console.log('\n📊 Database Information:');

    // Show table counts
    const tables = ['crop_calendars', 'calendar_seasons', 'calendar_timelines', 'calendar_activities', 'calendar_grids'];

    for (const table of tables) {
      const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`📋 ${table}: ${result.rows[0].count} records`);
    }

    // Show recent calendars
    const recentCalendars = await query(`
      SELECT region, district, crop, created_at
      FROM crop_calendars
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (recentCalendars.rows.length > 0) {
      console.log('\n📅 Recent Calendars:');
      recentCalendars.rows.forEach(calendar => {
        console.log(`   ${calendar.region} > ${calendar.district} > ${calendar.crop} (${calendar.created_at})`);
      });
    }

  } catch (error) {
    console.error('❌ Error showing database info:', error.message);
  }
};

/**
 * Main setup function
 */
const setupDatabase = async () => {
  console.log('🚀 Starting TriAgro AI Database Setup...\n');

  try {
    // Test connection
    console.log('1️⃣ Testing database connection...');
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to PostgreSQL database');
    }

    // Initialize database
    console.log('\n2️⃣ Initializing database...');
    await initializeDatabase();

    // Check if tables exist
    console.log('\n3️⃣ Checking database tables...');
    const tablesExist = await checkTables();

    if (!tablesExist) {
      console.log('\n4️⃣ Creating database schema...');
      await runSchema();
      await checkTables(); // Verify tables were created
    } else {
      console.log('✅ Database schema already exists');
    }

    // Create sample data
    console.log('\n5️⃣ Setting up sample data...');
    await createSampleData();

    // Show database info
    console.log('\n6️⃣ Database setup complete!');
    await showDatabaseInfo();

    console.log('\n🎉 TriAgro AI PostgreSQL database is ready!');
    console.log('🔗 You can now run your application with the database backend.');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    console.error('💡 Please check your database configuration and try again.');
    process.exit(1);
  } finally {
    await closePool();
  }
};

/**
 * Drop all tables (for reset/cleanup)
 */
const dropTables = async () => {
  try {
    console.log('🗑️ Dropping all tables...');

    const tables = ['calendar_grids', 'calendar_activities', 'calendar_timelines', 'calendar_seasons', 'crop_calendars'];

    for (const table of tables) {
      await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`   Dropped: ${table}`);
    }

    // Drop views
    await query(`DROP VIEW IF EXISTS calendar_overview CASCADE`);
    console.log('   Dropped: calendar_overview view');

    console.log('✅ All tables dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping tables:', error.message);
    throw error;
  }
};

/**
 * Reset database (drop and recreate)
 */
const resetDatabase = async () => {
  console.log('🔄 Resetting TriAgro AI Database...\n');

  try {
    await testConnection();
    await dropTables();
    await runSchema();
    await createSampleData();
    await showDatabaseInfo();

    console.log('\n🎉 Database reset complete!');
  } catch (error) {
    console.error('\n❌ Database reset failed:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
};

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'setup':
  case undefined:
    setupDatabase();
    break;
  case 'reset':
    resetDatabase();
    break;
  case 'drop':
    dropTables().then(() => closePool());
    break;
  case 'info':
    testConnection().then(() => showDatabaseInfo()).then(() => closePool());
    break;
  default:
    console.log('Usage: node database/setup.js [setup|reset|drop|info]');
    console.log('  setup (default) - Initialize database with schema and sample data');
    console.log('  reset           - Drop and recreate all tables');
    console.log('  drop            - Drop all tables');
    console.log('  info            - Show database information');
    process.exit(1);
}

export { setupDatabase, resetDatabase, dropTables, showDatabaseInfo };