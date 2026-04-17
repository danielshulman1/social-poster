#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Allow self-signed certificates for Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ai_operations_platform',
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected to database');

    // Read the RLS migration file
    const migrationPath = path.join(__dirname, '../../database/migrations/020_enable_rls_all_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running RLS migration...');
    await client.query(migrationSQL);
    console.log('✓ RLS migration applied successfully');

    // Verify RLS is enabled
    const result = await client.query(`
      SELECT tablename, COUNT(*) as policy_count
      FROM pg_policies
      WHERE schemaname='public'
      GROUP BY tablename
      ORDER BY tablename;
    `);

    console.log('\n✓ Row-Level Security Status:');
    console.log(`  Total tables with RLS: ${result.rows.length}`);
    result.rows.forEach(row => {
      console.log(`  - ${row.tablename}: ${row.policy_count} policies`);
    });

  } catch (error) {
    console.error('✗ Migration failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
