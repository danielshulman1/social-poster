const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const tables = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);
    
    console.log('\n📊 Tables in database:\n');
    if (tables.rows.length === 0) {
      console.log('  ❌ No tables found\n');
      console.log('  Your Supabase database appears to be empty.');
      console.log('  You need to create the base schema first.\n');
    } else {
      console.log(`  ✅ Found ${tables.rows.length} tables:\n`);
      tables.rows.forEach(row => {
        console.log(`    • ${row.tablename}`);
      });
      console.log('\n  ✅ Base schema exists! Ready to apply Phase 2-3 migrations.\n');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
