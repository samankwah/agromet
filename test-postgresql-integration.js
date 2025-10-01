/**
 * PostgreSQL Integration Test Script
 *
 * Tests the complete flow from Excel upload to PostgreSQL storage
 */

import { testConnection, initializeDatabase, closePool } from './database/connection.js';
import {
  insertCropCalendar,
  getCropCalendarsByType,
  getFullCalendarById,
  updateCropCalendar,
  deleteCropCalendar,
  getDatabaseStats
} from './database/dal.js';

// Test data
const testCalendarData = {
  uniqueId: `TEST_Integration_Test_Maize_${Date.now()}`,
  region: 'Integration Test Region',
  district: 'Test District',
  crop: 'Maize',
  dataType: 'crop-calendar',

  majorSeason: {
    startMonth: 'JAN',
    startWeek: '2025-01-01',
    filename: 'test-calendar.xlsx',
    file: 'test-calendar.xlsx'
  },

  minorSeason: {
    startMonth: 'JUL',
    startWeek: '2025-07-01',
    hasFile: false,
    file: null
  },

  timeline: {
    type: 'absolute',
    totalWeeks: 24,
    startMonth: 'JAN',
    endMonth: 'JUN',
    months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
    weeks: [
      { index: 0, label: 'WK1', month: 'JAN', dateRange: '1-7' },
      { index: 1, label: 'WK2', month: 'JAN', dateRange: '8-14' },
      { index: 2, label: 'WK3', month: 'JAN', dateRange: '15-21' }
    ]
  },

  activities: [
    {
      id: 'activity_1',
      name: 'Site Selection',
      rowIndex: 1,
      excelRow: 4,
      color: '#00B0F0',
      weeks: [0, 1, 2]
    },
    {
      id: 'activity_2',
      name: 'Land preparation',
      rowIndex: 2,
      excelRow: 5,
      color: '#BF9000',
      weeks: [1, 2, 3]
    },
    {
      id: 'activity_3',
      name: 'Planting/sowing',
      rowIndex: 3,
      excelRow: 6,
      color: '#000000',
      weeks: [3, 4]
    }
  ],

  calendarGrid: {
    'WK1': { 'Site Selection': true },
    'WK2': { 'Site Selection': true, 'Land preparation': true },
    'WK3': { 'Site Selection': true, 'Land preparation': true },
    'WK4': { 'Land preparation': true, 'Planting/sowing': true }
  },

  uploadDate: new Date().toISOString(),
  userId: 'test-user-id'
};

/**
 * Run all tests
 */
const runTests = async () => {
  console.log('🧪 Starting PostgreSQL Integration Tests');
  console.log('=' * 60);

  let testResults = {
    passed: 0,
    failed: 0,
    details: []
  };

  try {
    // Test 1: Database Connection
    console.log('\n1️⃣ Testing database connection...');
    const connectionTest = await testConnection();
    if (connectionTest) {
      console.log('✅ Database connection test passed');
      testResults.passed++;
    } else {
      console.log('❌ Database connection test failed');
      testResults.failed++;
      testResults.details.push('Database connection failed');
    }

    // Test 2: Database Initialization
    console.log('\n2️⃣ Testing database initialization...');
    try {
      await initializeDatabase();
      console.log('✅ Database initialization test passed');
      testResults.passed++;
    } catch (error) {
      console.log('❌ Database initialization test failed:', error.message);
      testResults.failed++;
      testResults.details.push(`Database initialization failed: ${error.message}`);
    }

    // Test 3: Insert Calendar Data
    console.log('\n3️⃣ Testing calendar data insertion...');
    let insertedCalendar = null;
    try {
      insertedCalendar = await insertCropCalendar(testCalendarData);
      console.log('✅ Calendar insertion test passed');
      console.log(`   Inserted calendar: ${insertedCalendar.unique_id}`);
      testResults.passed++;
    } catch (error) {
      console.log('❌ Calendar insertion test failed:', error.message);
      testResults.failed++;
      testResults.details.push(`Calendar insertion failed: ${error.message}`);
      return testResults; // Can't continue without inserted data
    }

    // Test 4: Retrieve Calendar Data
    console.log('\n4️⃣ Testing calendar data retrieval...');
    try {
      const calendars = await getCropCalendarsByType('crop-calendar', {
        region: 'Integration Test Region'
      });

      if (calendars.length > 0) {
        console.log('✅ Calendar retrieval test passed');
        console.log(`   Retrieved ${calendars.length} calendars`);
        testResults.passed++;
      } else {
        console.log('❌ Calendar retrieval test failed - no data returned');
        testResults.failed++;
        testResults.details.push('No calendars retrieved');
      }
    } catch (error) {
      console.log('❌ Calendar retrieval test failed:', error.message);
      testResults.failed++;
      testResults.details.push(`Calendar retrieval failed: ${error.message}`);
    }

    // Test 5: Get Full Calendar Details
    console.log('\n5️⃣ Testing full calendar details retrieval...');
    try {
      const fullCalendar = await getFullCalendarById(insertedCalendar.id);

      if (fullCalendar && fullCalendar.uniqueId === insertedCalendar.unique_id) {
        console.log('✅ Full calendar details test passed');
        console.log(`   Retrieved calendar: ${fullCalendar.uniqueId}`);
        console.log(`   Activities: ${fullCalendar.activities?.length || 0}`);
        console.log(`   Timeline weeks: ${fullCalendar.timeline?.weeks?.length || 0}`);
        testResults.passed++;
      } else {
        console.log('❌ Full calendar details test failed - data mismatch');
        testResults.failed++;
        testResults.details.push('Full calendar data mismatch');
      }
    } catch (error) {
      console.log('❌ Full calendar details test failed:', error.message);
      testResults.failed++;
      testResults.details.push(`Full calendar details failed: ${error.message}`);
    }

    // Test 6: Update Calendar Data
    console.log('\n6️⃣ Testing calendar data update...');
    try {
      const updateData = {
        region: 'Updated Test Region',
        district: 'Updated Test District'
      };

      const updatedCalendar = await updateCropCalendar(insertedCalendar.id, updateData);

      if (updatedCalendar && updatedCalendar.region === 'Updated Test Region') {
        console.log('✅ Calendar update test passed');
        console.log(`   Updated region: ${updatedCalendar.region}`);
        testResults.passed++;
      } else {
        console.log('❌ Calendar update test failed - data not updated');
        testResults.failed++;
        testResults.details.push('Calendar update failed');
      }
    } catch (error) {
      console.log('❌ Calendar update test failed:', error.message);
      testResults.failed++;
      testResults.details.push(`Calendar update failed: ${error.message}`);
    }

    // Test 7: Database Statistics
    console.log('\n7️⃣ Testing database statistics...');
    try {
      const stats = await getDatabaseStats();

      if (Array.isArray(stats) && stats.length > 0) {
        console.log('✅ Database statistics test passed');
        stats.forEach(stat => {
          console.log(`   ${stat.table_name}: ${stat.record_count} records`);
        });
        testResults.passed++;
      } else {
        console.log('❌ Database statistics test failed - no stats returned');
        testResults.failed++;
        testResults.details.push('No database statistics returned');
      }
    } catch (error) {
      console.log('❌ Database statistics test failed:', error.message);
      testResults.failed++;
      testResults.details.push(`Database statistics failed: ${error.message}`);
    }

    // Test 8: Delete Calendar Data (cleanup)
    console.log('\n8️⃣ Testing calendar data deletion...');
    try {
      const deleteSuccess = await deleteCropCalendar('crop-calendar', insertedCalendar.unique_id);

      if (deleteSuccess) {
        console.log('✅ Calendar deletion test passed');
        console.log(`   Deleted calendar: ${insertedCalendar.unique_id}`);
        testResults.passed++;
      } else {
        console.log('❌ Calendar deletion test failed - delete returned false');
        testResults.failed++;
        testResults.details.push('Calendar deletion returned false');
      }
    } catch (error) {
      console.log('❌ Calendar deletion test failed:', error.message);
      testResults.failed++;
      testResults.details.push(`Calendar deletion failed: ${error.message}`);
    }

    // Test Summary
    console.log('\n' + '=' * 60);
    console.log('🧪 Test Results Summary');
    console.log('=' * 60);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total: ${testResults.passed + testResults.failed}`);

    if (testResults.failed > 0) {
      console.log('\n❌ Failed Test Details:');
      testResults.details.forEach((detail, index) => {
        console.log(`   ${index + 1}. ${detail}`);
      });
    }

    const successRate = (testResults.passed / (testResults.passed + testResults.failed)) * 100;
    console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);

    if (testResults.failed === 0) {
      console.log('\n🎉 All tests passed! PostgreSQL integration is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Please check the database configuration and try again.');
    }

    return testResults;

  } catch (error) {
    console.error('\n💥 Unexpected test error:', error.message);
    testResults.failed++;
    testResults.details.push(`Unexpected error: ${error.message}`);
    return testResults;
  } finally {
    await closePool();
  }
};

/**
 * Run a quick smoke test
 */
const runSmokeTest = async () => {
  console.log('🔥 Running PostgreSQL Smoke Test...');

  try {
    const isConnected = await testConnection();
    if (isConnected) {
      console.log('✅ Smoke test passed - PostgreSQL is accessible');
      return true;
    } else {
      console.log('❌ Smoke test failed - Cannot connect to PostgreSQL');
      return false;
    }
  } catch (error) {
    console.log('❌ Smoke test failed:', error.message);
    return false;
  } finally {
    await closePool();
  }
};

/**
 * Test dual-mode functionality (requires server to be running)
 */
const testDualMode = async () => {
  console.log('🔄 Testing Dual-Mode Storage Functionality...');

  const baseURL = process.env.SERVER_URL || 'http://localhost:3002';

  try {
    // Test 1: Health check
    console.log('\n1️⃣ Testing server health...');
    const healthResponse = await fetch(`${baseURL}/api/health`);
    if (!healthResponse.ok) {
      throw new Error('Server health check failed');
    }
    console.log('✅ Server is running');

    // Test 2: GET endpoint (should work with both PostgreSQL and JSON)
    console.log('\n2️⃣ Testing data retrieval...');
    const getResponse = await fetch(`${baseURL}/api/agricultural-data/crop-calendar`);
    if (!getResponse.ok) {
      throw new Error('GET endpoint failed');
    }
    const getData = await getResponse.json();
    console.log('✅ Data retrieval successful');
    console.log(`📊 Retrieved ${getData.length || 0} records`);

    return {
      success: true,
      tests: ['Server Health', 'Data Retrieval'],
      recordCount: getData.length || 0
    };

  } catch (error) {
    console.error('❌ Dual-mode test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Command line interface
const command = process.argv[2];

if (command === 'smoke') {
  runSmokeTest()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Smoke test error:', error.message);
      process.exit(1);
    });
} else if (command === 'dual-mode') {
  testDualMode()
    .then(result => {
      if (result.success) {
        console.log(`\n✅ Dual-mode test passed: ${result.tests.join(', ')}`);
        process.exit(0);
      } else {
        console.error(`\n❌ Dual-mode test failed: ${result.error}`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Dual-mode test error:', error.message);
      process.exit(1);
    });
} else if (command === 'full' || !command) {
  runTests()
    .then(results => {
      const success = results.failed === 0;
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution error:', error.message);
      process.exit(1);
    });
} else {
  console.log('Usage: node test-postgresql-integration.js [smoke|dual-mode|full]');
  console.log('  smoke     - Quick PostgreSQL connection test');
  console.log('  dual-mode - Test dual-mode storage with running server');
  console.log('  full      - Complete integration test suite (default)');
  process.exit(1);
}

export { runTests, runSmokeTest };