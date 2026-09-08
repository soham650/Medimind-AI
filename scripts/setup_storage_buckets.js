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

async function setupBuckets() {
  const rootDir = path.resolve(__dirname, '..');
  const frontendEnv = parseEnv(path.join(rootDir, 'frontend', '.env'));
  const backendEnv = parseEnv(path.join(rootDir, 'ml-service', '.env'));

  const supabaseUrl = frontendEnv.VITE_SUPABASE_URL || backendEnv.SUPABASE_URL;
  const serviceRoleKey = backendEnv.SUPABASE_SERVICE_ROLE_KEY;

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const buckets = [
    { id: 'medical-documents', public: false, limit: 15728640, mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
    { id: 'doctor-documents', public: false, limit: 15728640, mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
    { id: 'pharmacy-documents', public: false, limit: 15728640, mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
    { id: 'profile-images', public: true, limit: 5242880, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] }
  ];

  for (const b of buckets) {
    const { data, error } = await adminClient.storage.createBucket(b.id, {
      public: b.public,
      fileSizeLimit: b.limit,
      allowedMimeTypes: b.mimeTypes
    });
    if (error) {
      console.log(`Bucket [${b.id}]:`, error.message);
    } else {
      console.log(`Bucket [${b.id}]: Successfully created (public=${b.public})`);
    }
  }

  const { data: list, error: listErr } = await adminClient.storage.listBuckets();
  if (listErr) {
    console.error('Error listing buckets:', listErr.message);
  } else {
    console.log('\nVerified Storage Buckets:', list.map(x => `${x.name} (public: ${x.public})`));
  }
}

setupBuckets().catch(console.error);
