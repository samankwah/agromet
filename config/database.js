import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL connection configuration
const dbConfig = {
  user: process.env.DB_USER || 'triagro_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'triagro_ai',
  password: process.env.DB_PASSWORD || 'triagro_password',
  port: process.env.DB_PORT || 5432,
  // Connection pool settings
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // How long to wait for a connection
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle connection errors
pool.on('error', (err, client) => {
  console.error('🔴 Unexpected error on idle client:', err);
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('🟢 Database connected successfully');
    client.release();
    return true;
  } catch (err) {
    console.error('🔴 Database connection failed:', err.message);
    return false;
  }
};

// Execute query with error handling
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Query executed in ${duration}ms:`, text.substring(0, 50) + '...');
    return result;
  } catch (error) {
    console.error('🔴 Database query error:', error.message);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
};

// Transaction wrapper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Graceful shutdown
const closePool = async () => {
  try {
    await pool.end();
    console.log('📴 Database pool closed');
  } catch (error) {
    console.error('🔴 Error closing database pool:', error);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

export {
  pool,
  query,
  transaction,
  testConnection,
  closePool
};