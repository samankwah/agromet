/**
 * PostgreSQL Database Connection
 *
 * Handles database connection pooling and configuration for TriAgro AI
 */

import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'triagro_ai',
  user: process.env.DB_USER || 'triagro_user',
  password: process.env.DB_PASSWORD || 'triagro_password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,

  // Connection pool settings
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 10000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,

  // Additional settings for production
  statement_timeout: 60000, // 60 seconds
  query_timeout: 60000, // 60 seconds
};

// Create connection pool
const pool = new Pool(dbConfig);

// Connection pool event handlers
pool.on('connect', (client) => {
  console.log('🐘 New PostgreSQL client connected');
});

pool.on('error', (err, client) => {
  console.error('🚨 Unexpected error on idle PostgreSQL client:', err);
  process.exit(-1);
});

pool.on('remove', (client) => {
  console.log('🐘 PostgreSQL client removed from pool');
});

/**
 * Test database connection
 */
export const testConnection = async () => {
  let client;
  try {
    console.log('🔍 Testing PostgreSQL connection...');
    client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ PostgreSQL connection successful!');
    console.log('📅 Server time:', result.rows[0].current_time);
    console.log('🐘 PostgreSQL version:', result.rows[0].pg_version.split(' ')[0]);
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

/**
 * Execute a query with automatic connection handling
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
export const query = async (text, params = []) => {
  const start = Date.now();
  let client;

  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries (over 500ms)
    if (duration > 500) {
      console.warn(`🐌 Slow query detected (${duration}ms):`, text.substring(0, 100));
    }

    return result;
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    console.error('📝 Query:', text);
    console.error('📋 Params:', params);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};

/**
 * Execute multiple queries in a transaction
 * @param {Array} queries - Array of {text, params} objects
 * @returns {Promise<Array>} Array of query results
 */
export const transaction = async (queries) => {
  let client;
  const results = [];

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    for (const { text, params = [] } of queries) {
      const result = await client.query(text, params);
      results.push(result);
    }

    await client.query('COMMIT');
    console.log('✅ Transaction completed successfully');
    return results;
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
      console.log('🔄 Transaction rolled back due to error');
    }
    console.error('❌ Transaction error:', error.message);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};

/**
 * Get a client from the pool for complex operations
 * @returns {Promise<Object>} Database client
 */
export const getClient = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error('❌ Failed to get database client:', error.message);
    throw error;
  }
};

/**
 * Get database pool statistics
 * @returns {Object} Pool statistics
 */
export const getPoolStats = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    maxConnections: dbConfig.max
  };
};

/**
 * Close all database connections (for graceful shutdown)
 */
export const closePool = async () => {
  try {
    await pool.end();
    console.log('🐘 PostgreSQL connection pool closed');
  } catch (error) {
    console.error('❌ Error closing database pool:', error.message);
  }
};

/**
 * Initialize database connection and run schema setup
 */
export const initializeDatabase = async () => {
  try {
    console.log('🚀 Initializing PostgreSQL database...');

    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to establish database connection');
    }

    // Log pool configuration (without sensitive data)
    console.log('⚙️ Database configuration:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      ssl: !!dbConfig.ssl,
      maxConnections: dbConfig.max
    });

    // Check if tables exist
    const tablesResult = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('crop_calendars', 'calendar_seasons', 'calendar_timelines', 'calendar_activities', 'calendar_grids', 'weekly_advisories')
    `);

    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log('📋 Existing tables:', existingTables);

    if (existingTables.length === 0) {
      console.log('⚠️ No tables found. Database schema needs to be created.');
      console.log('💡 Run: npm run db:setup or manually execute database/schema.sql and weekly_advisories_schema.sql');
    } else {
      console.log('✅ Database tables found:', existingTables.length);
    }

    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

// Export the pool for direct access if needed
export default pool;