#!/usr/bin/env node

/**
 * Unified Server Startup Script for TriAgro AI
 * Starts both auth server (port 3003) and data server (port 3002)
 * with health checks and graceful shutdown handling
 */

import { spawn } from 'child_process';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const AUTH_PORT = process.env.AUTH_PORT || 3003;
const DATA_PORT = process.env.DATA_PORT || 3002;
const STARTUP_TIMEOUT = 30000; // 30 seconds

// Server processes
let authServerProcess = null;
let dataServerProcess = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Check if a server is healthy
 */
async function checkServerHealth(port, endpoint = '/health') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: endpoint,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * Wait for server to become healthy
 */
async function waitForServer(name, port, maxAttempts = 30) {
  log(`⏳ Waiting for ${name} to be ready on port ${port}...`, 'yellow');

  for (let i = 0; i < maxAttempts; i++) {
    const isHealthy = await checkServerHealth(port);

    if (isHealthy) {
      log(`✅ ${name} is healthy and ready!`, 'green');
      return true;
    }

    // Wait 1 second before retry
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  log(`❌ ${name} failed to start within ${maxAttempts} seconds`, 'red');
  return false;
}

/**
 * Start a server process
 */
function startServer(name, scriptPath, port, envVars = {}) {
  log(`🚀 Starting ${name}...`, 'cyan');

  const env = {
    ...process.env,
    ...envVars
  };

  const serverProcess = spawn('node', [scriptPath], {
    env,
    stdio: 'inherit',
    shell: true
  });

  serverProcess.on('error', (error) => {
    log(`❌ ${name} error: ${error.message}`, 'red');
  });

  serverProcess.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      log(`❌ ${name} exited with code ${code}`, 'red');
    } else if (signal) {
      log(`⚠️ ${name} killed with signal ${signal}`, 'yellow');
    }
  });

  return serverProcess;
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    log(`\n⚠️ Received ${signal}, shutting down gracefully...`, 'yellow');

    // Kill server processes
    if (authServerProcess) {
      log('🔄 Stopping auth server...', 'yellow');
      authServerProcess.kill('SIGTERM');
    }

    if (dataServerProcess) {
      log('🔄 Stopping data server...', 'yellow');
      dataServerProcess.kill('SIGTERM');
    }

    // Wait for processes to exit
    await new Promise(resolve => setTimeout(resolve, 2000));

    log('✅ Shutdown complete', 'green');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Windows-specific signals
  if (process.platform === 'win32') {
    process.on('SIGBREAK', () => shutdown('SIGBREAK'));
  }
}

/**
 * Main startup function
 */
async function startServers() {
  log('═══════════════════════════════════════════════', 'bright');
  log('  TriAgro AI - Unified Server Startup', 'bright');
  log('═══════════════════════════════════════════════', 'bright');
  log('');

  // Setup graceful shutdown
  setupGracefulShutdown();

  // Start Auth Server (port 3003)
  authServerProcess = startServer(
    'Auth Server',
    'auth-server.js',
    AUTH_PORT,
    { AUTH_PORT }
  );

  // Wait for auth server to be healthy
  const authHealthy = await waitForServer('Auth Server', AUTH_PORT);
  if (!authHealthy) {
    log('❌ Auth server failed to start. Exiting...', 'red');
    process.exit(1);
  }

  log('');

  // Start Data Server (port 3002)
  dataServerProcess = startServer(
    'Data Server',
    'server.js',
    DATA_PORT,
    { PORT: DATA_PORT }
  );

  // Wait for data server to be healthy
  const dataHealthy = await waitForServer('Data Server', DATA_PORT);
  if (!dataHealthy) {
    log('❌ Data server failed to start. Exiting...', 'red');
    process.exit(1);
  }

  log('');
  log('═══════════════════════════════════════════════', 'green');
  log('  🎉 All servers are running!', 'green');
  log('═══════════════════════════════════════════════', 'green');
  log('');
  log(`📡 Auth Server:  http://localhost:${AUTH_PORT}/health`, 'cyan');
  log(`📡 Data Server:  http://localhost:${DATA_PORT}/health`, 'cyan');
  log('');
  log('Press Ctrl+C to stop all servers', 'yellow');
  log('');
}

// Start the servers
startServers().catch(error => {
  log(`❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
