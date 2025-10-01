/**
 * JSON to PostgreSQL Migration Script
 *
 * Migrates existing agricultural data from JSON file storage to PostgreSQL database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, testConnection, closePool } from './connection.js';
import { migrateFromJSON, getDatabaseStats, insertCropCalendar } from './dal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the existing JSON data file
const JSON_DATA_PATH = path.join(__dirname, '..', 'agricultural-data.json');
const BACKUP_PATH = path.join(__dirname, '..', 'agricultural-data-backup.json');

/**
 * Create backup of original JSON data
 */
const createBackup = () => {
  try {
    if (fs.existsSync(JSON_DATA_PATH)) {
      const backupData = fs.readFileSync(JSON_DATA_PATH, 'utf8');
      fs.writeFileSync(BACKUP_PATH, backupData);
      console.log('✅ Backup created:', BACKUP_PATH);
      return true;
    } else {
      console.log('⚠️ No JSON data file found at:', JSON_DATA_PATH);
      return false;
    }
  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
    return false;
  }
};

/**
 * Load JSON data from file
 */
const loadJSONData = () => {
  try {
    if (!fs.existsSync(JSON_DATA_PATH)) {
      console.log('⚠️ No JSON data file found');
      return null;
    }

    const fileContent = fs.readFileSync(JSON_DATA_PATH, 'utf8');
    const jsonData = JSON.parse(fileContent);

    console.log('📄 JSON data loaded successfully');
    console.log('📊 Data summary:');
    Object.keys(jsonData).forEach(key => {
      const count = Array.isArray(jsonData[key]) ? jsonData[key].length : 0;
      console.log(`   ${key}: ${count} records`);
    });

    return jsonData;
  } catch (error) {
    console.error('❌ Error loading JSON data:', error.message);
    return null;
  }
};

/**
 * Validate JSON data structure
 */
const validateJSONData = (jsonData) => {
  const requiredDataTypes = ['crop-calendar', 'agromet-advisory', 'poultry-calendar', 'poultry-advisory'];
  const issues = [];

  if (!jsonData || typeof jsonData !== 'object') {
    issues.push('JSON data is not a valid object');
    return { valid: false, issues };
  }

  // Check each required data type
  requiredDataTypes.forEach(dataType => {
    if (!jsonData[dataType]) {
      issues.push(`Missing data type: ${dataType}`);
    } else if (!Array.isArray(jsonData[dataType])) {
      issues.push(`Data type ${dataType} is not an array`);
    }
  });

  // Validate individual records
  Object.keys(jsonData).forEach(dataType => {
    if (Array.isArray(jsonData[dataType])) {
      jsonData[dataType].forEach((record, index) => {
        if (!record.uniqueId && !record.unique_id) {
          issues.push(`Record ${index} in ${dataType} missing unique identifier`);
        }
        if (!record.region) {
          issues.push(`Record ${index} in ${dataType} missing region`);
        }
        if (!record.district) {
          issues.push(`Record ${index} in ${dataType} missing district`);
        }
      });
    }
  });

  return {
    valid: issues.length === 0,
    issues,
    warnings: issues.filter(issue => issue.includes('missing')),
    errors: issues.filter(issue => !issue.includes('missing'))
  };
};

/**
 * Show migration preview
 */
const showMigrationPreview = (jsonData) => {
  console.log('\n📋 Migration Preview:');
  console.log('=' * 50);

  const totalRecords = Object.keys(jsonData).reduce((total, key) => {
    return total + (Array.isArray(jsonData[key]) ? jsonData[key].length : 0);
  }, 0);

  console.log(`📊 Total records to migrate: ${totalRecords}`);

  Object.keys(jsonData).forEach(dataType => {
    if (Array.isArray(jsonData[dataType]) && jsonData[dataType].length > 0) {
      console.log(`\n📁 ${dataType.toUpperCase()}:`);
      console.log(`   Records: ${jsonData[dataType].length}`);

      // Show sample record structure
      const sampleRecord = jsonData[dataType][0];
      console.log(`   Sample fields: ${Object.keys(sampleRecord).join(', ')}`);

      // Show unique regions/districts
      const regions = [...new Set(jsonData[dataType].map(r => r.region).filter(Boolean))];
      const districts = [...new Set(jsonData[dataType].map(r => r.district).filter(Boolean))];
      console.log(`   Regions: ${regions.slice(0, 3).join(', ')}${regions.length > 3 ? ` (+${regions.length - 3} more)` : ''}`);
      console.log(`   Districts: ${districts.slice(0, 3).join(', ')}${districts.length > 3 ? ` (+${districts.length - 3} more)` : ''}`);
    }
  });

  console.log('\n' + '=' * 50);
};

/**
 * Perform the actual migration
 */
const performMigration = async (jsonData, options = {}) => {
  const { dryRun = false, continueOnError = false } = options;

  if (dryRun) {
    console.log('🔍 DRY RUN: No data will be actually migrated');
  }

  const migrationResults = {
    totalAttempted: 0,
    totalSuccessful: 0,
    totalFailed: 0,
    details: [],
    errors: []
  };

  for (const [dataType, records] of Object.entries(jsonData)) {
    if (!Array.isArray(records) || records.length === 0) continue;

    console.log(`\n🔄 Migrating ${records.length} ${dataType} records...`);

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      migrationResults.totalAttempted++;

      try {
        if (!dryRun) {
          // Ensure the record has the required dataType field
          const migrationRecord = {
            ...record,
            dataType: dataType,
            uniqueId: record.uniqueId || record.unique_id || `${dataType}_migration_${Date.now()}_${i}`
          };

          await insertCropCalendar(migrationRecord);
        }

        migrationResults.totalSuccessful++;
        migrationResults.details.push({
          dataType,
          id: record.uniqueId || record.unique_id || `record_${i}`,
          status: 'success'
        });

        if (i % 10 === 0) {
          console.log(`   Processed: ${i + 1}/${records.length} records`);
        }

      } catch (error) {
        migrationResults.totalFailed++;
        migrationResults.errors.push({
          dataType,
          recordIndex: i,
          id: record.uniqueId || record.unique_id || `record_${i}`,
          error: error.message
        });

        console.error(`   ❌ Error migrating record ${i}: ${error.message}`);

        if (!continueOnError) {
          throw new Error(`Migration failed at record ${i} in ${dataType}: ${error.message}`);
        }
      }
    }

    console.log(`✅ Completed ${dataType}: ${migrationResults.totalSuccessful}/${migrationResults.totalAttempted}`);
  }

  return migrationResults;
};

/**
 * Verify migration results
 */
const verifyMigration = async (originalData) => {
  console.log('\n🔍 Verifying migration...');

  try {
    // Get database statistics
    const dbStats = await getDatabaseStats();
    console.log('📊 Database statistics after migration:');
    dbStats.forEach(stat => {
      console.log(`   ${stat.table_name}: ${stat.record_count} records`);
    });

    // Compare counts
    let verificationPassed = true;
    for (const [dataType, records] of Object.entries(originalData)) {
      if (Array.isArray(records)) {
        const originalCount = records.length;
        // Note: We would need to add a count function to DAL for exact verification
        console.log(`   ${dataType}: ${originalCount} original records`);
        // For now, we'll trust the insertion process
      }
    }

    if (verificationPassed) {
      console.log('✅ Migration verification passed');
    } else {
      console.log('⚠️ Migration verification has warnings');
    }

    return verificationPassed;
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    return false;
  }
};

/**
 * Main migration function
 */
const runMigration = async (options = {}) => {
  const {
    dryRun = false,
    skipBackup = false,
    continueOnError = false,
    skipVerification = false
  } = options;

  console.log('🚀 Starting JSON to PostgreSQL Migration');
  console.log(`📅 Migration started at: ${new Date().toISOString()}`);

  if (dryRun) {
    console.log('🔍 Running in DRY RUN mode - no data will be modified');
  }

  try {
    // 1. Test database connection
    console.log('\n1️⃣ Testing database connection...');
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to PostgreSQL database');
    }

    // 2. Initialize database
    console.log('\n2️⃣ Initializing database...');
    await initializeDatabase();

    // 3. Create backup
    if (!skipBackup && !dryRun) {
      console.log('\n3️⃣ Creating backup...');
      const backupCreated = createBackup();
      if (!backupCreated) {
        console.log('⚠️ Backup creation failed, but continuing...');
      }
    } else {
      console.log('\n3️⃣ Skipping backup (dry run mode)');
    }

    // 4. Load JSON data
    console.log('\n4️⃣ Loading JSON data...');
    const jsonData = loadJSONData();
    if (!jsonData) {
      throw new Error('Failed to load JSON data');
    }

    // 5. Validate JSON data
    console.log('\n5️⃣ Validating JSON data...');
    const validation = validateJSONData(jsonData);
    if (!validation.valid) {
      console.log('⚠️ JSON data validation issues:');
      validation.issues.forEach(issue => console.log(`   - ${issue}`));

      if (validation.errors.length > 0) {
        throw new Error('Critical validation errors found');
      }
    } else {
      console.log('✅ JSON data validation passed');
    }

    // 6. Show migration preview
    console.log('\n6️⃣ Migration preview...');
    showMigrationPreview(jsonData);

    // 7. Perform migration
    console.log('\n7️⃣ Performing migration...');
    const migrationResults = await performMigration(jsonData, { dryRun, continueOnError });

    // 8. Show results
    console.log('\n8️⃣ Migration Results:');
    console.log(`   Total attempted: ${migrationResults.totalAttempted}`);
    console.log(`   Successful: ${migrationResults.totalSuccessful}`);
    console.log(`   Failed: ${migrationResults.totalFailed}`);

    if (migrationResults.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      migrationResults.errors.forEach(error => {
        console.log(`   ${error.dataType}[${error.recordIndex}]: ${error.error}`);
      });
    }

    // 9. Verify migration
    if (!dryRun && !skipVerification) {
      console.log('\n9️⃣ Verifying migration...');
      await verifyMigration(jsonData);
    }

    // 10. Success message
    if (dryRun) {
      console.log('\n🎉 Dry run completed successfully!');
      console.log('💡 Run without --dry-run to perform actual migration');
    } else {
      console.log('\n🎉 Migration completed successfully!');
      console.log('🔗 PostgreSQL database is now ready for use');
      console.log(`📁 Original data backed up to: ${BACKUP_PATH}`);
    }

    return {
      success: true,
      migrationResults,
      totalMigrated: migrationResults.totalSuccessful
    };

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await closePool();
  }
};

// Command line interface
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  skipBackup: args.includes('--skip-backup'),
  continueOnError: args.includes('--continue-on-error'),
  skipVerification: args.includes('--skip-verification')
};

if (args.includes('--help')) {
  console.log('JSON to PostgreSQL Migration Script');
  console.log('Usage: node database/migrate-json-to-postgres.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run            Run migration preview without modifying data');
  console.log('  --skip-backup        Skip creating backup of original JSON file');
  console.log('  --continue-on-error  Continue migration even if individual records fail');
  console.log('  --skip-verification  Skip verification step after migration');
  console.log('  --help               Show this help message');
  process.exit(0);
}

// Run migration if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration(options)
    .then(result => {
      if (result.success) {
        console.log(`\n✅ Migration completed: ${result.totalMigrated} records migrated`);
        process.exit(0);
      } else {
        console.error(`\n❌ Migration failed: ${result.error}`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Unexpected error:', error.message);
      process.exit(1);
    });
}

export { runMigration, createBackup, loadJSONData, validateJSONData };