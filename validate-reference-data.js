import { query, testConnection } from './config/database.js';

async function validateReferenceData() {
  console.log('🔍 Validating reference data...');
  
  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Check regions
    console.log('\n📍 Regions Sample:');
    const regions = await query('SELECT code, name, zone FROM regions ORDER BY code LIMIT 5');
    regions.rows.forEach(row => {
      console.log(`   ${row.code}: ${row.name} (${row.zone})`);
    });
    
    // Check districts
    console.log('\n🏘️  Districts Sample:');
    const districts = await query(`
      SELECT d.code, d.name, r.name as region_name 
      FROM districts d 
      JOIN regions r ON d.region_id = r.id 
      ORDER BY d.code 
      LIMIT 5
    `);
    districts.rows.forEach(row => {
      console.log(`   ${row.code}: ${row.name} (${row.region_name})`);
    });
    
    // Check commodities
    console.log('\n🌾 Commodities Sample:');
    const commodities = await query('SELECT code, name, category FROM commodities ORDER BY category, name LIMIT 8');
    commodities.rows.forEach(row => {
      console.log(`   ${row.code}: ${row.name} (${row.category})`);
    });
    
    // Check production stages
    console.log('\n⚙️  Production Stages Sample:');
    const stages = await query('SELECT name, category, sequence_order FROM production_stages ORDER BY category, sequence_order LIMIT 8');
    stages.rows.forEach(row => {
      console.log(`   ${row.sequence_order}. ${row.name} (${row.category})`);
    });
    
    // Check admin user
    console.log('\n👤 Admin User:');
    const adminUser = await query('SELECT name, email, role FROM users WHERE role = $1', ['super_admin']);
    if (adminUser.rows.length > 0) {
      const admin = adminUser.rows[0];
      console.log(`   ✅ ${admin.name} (${admin.email}) - Role: ${admin.role}`);
    } else {
      console.log('   ❌ No admin user found');
    }
    
    // Check migration status
    console.log('\n📋 Migration Status:');
    const migrations = await query('SELECT migration_name, status, executed_at FROM schema_migrations ORDER BY id');
    migrations.rows.forEach(row => {
      const status = row.status === 'success' ? '✅' : '❌';
      const date = row.executed_at.toISOString().substring(0, 19).replace('T', ' ');
      console.log(`   ${status} ${row.migration_name} - ${date}`);
    });
    
    console.log('\n🎉 Reference data validation completed!');
    
  } catch (error) {
    console.error('❌ Reference data validation failed:', error.message);
  }
}

validateReferenceData();