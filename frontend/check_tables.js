import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://smmelvzldriqujaodckf.supabase.co';
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseSecretKey);

async function check() {
  console.log('Checking tables...');
  
  const tables = ['profiles', 'clinics', 'queues', 'specialists', 'symptom_logs', 'predictions'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
      
    if (error) {
      console.log(`❌ Table "${table}": Error ->`, error.message);
    } else {
      console.log(`✅ Table "${table}": Exists! Found records:`, data.length);
    }
  }
}

check();
