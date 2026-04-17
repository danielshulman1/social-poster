const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Allow self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function applyMigration(client, migrationFile) {
  try {
    const sql = fs.readFileSync(migrationFile, 'utf-8');
    console.log(`\n📝 Applying: ${path.basename(migrationFile)}`);
    
    await client.query(sql);
    console.log(`✅ ${path.basename(migrationFile)} applied successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to apply ${path.basename(migrationFile)}`);
    console.error(`Error: ${error.message}`);
    return false;
  }
}

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const migrations = [
      '../../database/migrations/020_enable_rls_all_tables.sql',
      '../../database/migrations/030_add_column_level_encryption.sql',
      '../../database/migrations/040_create_audit_logging.sql'
    ];

    console.log('\n🚀 Starting migrations...\n');
    console.log('=' .repeat(60));

    let success = 0;
    for (const migration of migrations) {
      const fullPath = path.join(__dirname, migration);
      if (fs.existsSync(fullPath)) {
        const result = await applyMigration(client, fullPath);
        if (result) success++;
      } else {
        console.warn(`⚠️  File not found: ${migration}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Migration Results: ${success}/${migrations.length} successful`);

    if (success === migrations.length) {
      console.log('\n🎉 All migrations applied successfully!');
      
      // Verify migrations
      console.log('\n📋 Verifying migrations...');
      
      const rls = await client.query(
        "SELECT COUNT(*) FROM pg_policies WHERE schemaname='public';"
      );
      console.log(`  ✅ RLS Policies: ${rls.rows[0].count}`);
      
      const tables = await client.query(
        "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'audit%';"
      );
      console.log(`  ✅ Audit Tables: ${tables.rows.length}`);
      
      const pgcrypto = await client.query(
        "SELECT COUNT(*) FROM pg_extension WHERE extname='pgcrypto';"
      );
      console.log(`  ✅ pgcrypto Extension: ${pgcrypto.rows[0].count > 0 ? 'Enabled' : 'Not found'}`);
    } else {
      console.log('\n⚠️  Some migrations failed. Please review the errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed\n');
  }
}

main();
