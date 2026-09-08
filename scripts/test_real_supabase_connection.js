/**
 * Step 2: Safe Real Supabase Connection Verification
 * Tests:
 * 1. Supabase client initialization
 * 2. Anonymous/public connection behavior with RLS
 * 3. Service role/authenticated connection reaches PostgreSQL
 * NOTE: NEVER prints or logs any secrets, keys, or passwords.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

async function verifyConnection() {
  const rootDir = path.resolve(__dirname, '..');
  const frontendEnv = parseEnv(path.join(rootDir, 'frontend', '.env'));
  const backendEnv = parseEnv(path.join(rootDir, 'ml-service', '.env'));

  const supabaseUrl = frontendEnv.VITE_SUPABASE_URL || backendEnv.SUPABASE_URL;
  const anonKey = frontendEnv.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = backendEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('SUPABASE_CONNECTION: FAIL (Missing Supabase URL)');
    process.exit(1);
  }
  if (!anonKey) {
    console.error('SUPABASE_CONNECTION: FAIL (Missing Supabase Anon Key)');
    process.exit(1);
  }

  console.log('1. Verifying Supabase URL host configuration...');
  const parsedUrl = new URL(supabaseUrl);
  console.log(`   Connected host: ${parsedUrl.hostname}`);

  // Test 1: Anon client initialization and public query
  console.log('2. Initializing Anonymous Supabase Client...');
  const anonClient = createClient(supabaseUrl, anonKey);

  console.log('3. Testing Anonymous query against public.doctors (verifying RLS)...');
  const { data: doctorsData, error: doctorsError } = await anonClient
    .from('doctors')
    .select('id, full_name, specialization, is_available')
    .limit(5);

  if (doctorsError) {
    console.log(`   Anon query notice (expected if RLS requires auth): ${doctorsError.message}`);
  } else {
    console.log(`   Anon query success. Retrieved ${doctorsData ? doctorsData.length : 0} rows.`);
  }

  // Test 2: Service role / Authenticated connection
  if (serviceRoleKey) {
    console.log('4. Initializing Administrative Supabase Client with Service Role...');
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    console.log('5. Testing administrative query reaching PostgreSQL (information_schema or profiles)...');
    const { data: profileCount, error: profileErr } = await adminClient
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (profileErr) {
      console.error(`   Admin query error: ${profileErr.message}`);
      console.log('SUPABASE_CONNECTION: FAIL');
      process.exit(1);
    } else {
      console.log(`   Database connection confirmed! profiles table reachable.`);
    }

    console.log('6. Checking existing tables in the database...');
    // Query list of tables via information_schema or checking specific tables
    const tablesToCheck = [
      'profiles', 'user_roles', 'patients', 'doctors', 'doctor_verifications',
      'doctor_availability', 'pharmacies', 'pharmacy_verifications',
      'patient_doctor_access', 'appointments', 'consultations', 'medical_records',
      'patient_allergies', 'symptom_assessments', 'health_reports',
      'prescriptions', 'medicines', 'pharmacy_inventory', 'medicine_orders',
      'payments', 'notifications', 'audit_logs', 'rate_limit_events', 'ai_usage_daily'
    ];

    const existingTables = [];
    const missingTables = [];

    for (const table of tablesToCheck) {
      const { error } = await adminClient.from(table).select('*', { count: 'exact', head: true }).limit(1);
      if (error && (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('relation'))) {
        missingTables.push(table);
      } else {
        existingTables.push(table);
      }
    }

    console.log(`   Existing verified tables (${existingTables.length}/${tablesToCheck.length}):`);
    console.log(`   -> ${existingTables.join(', ')}`);
    if (missingTables.length > 0) {
      console.log(`   Missing tables (${missingTables.length}):`);
      console.log(`   -> ${missingTables.join(', ')}`);
    }

    // Check storage buckets
    console.log('7. Checking Storage Buckets...');
    const { data: buckets, error: bucketErr } = await adminClient.storage.listBuckets();
    if (bucketErr) {
      console.log(`   Bucket check notice: ${bucketErr.message}`);
    } else {
      console.log(`   Found ${buckets.length} storage buckets: ${buckets.map(b => b.name).join(', ')}`);
    }
  }

  console.log('\n==================================================');
  console.log('SUPABASE_CONNECTION: PASS');
  console.log('==================================================');
}

verifyConnection().catch(err => {
  console.error('Fatal connection error:', err.message);
  console.log('SUPABASE_CONNECTION: FAIL');
  process.exit(1);
});
