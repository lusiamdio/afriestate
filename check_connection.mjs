import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jbdykuibxxqrvdgaoxet.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZHlrdWlieHhxcnZkZ2FveGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDA5MTQsImV4cCI6MjA5MjgxNjkxNH0.Hp6ILAE7WMKIC7U1e4yaRkz9U9x1Sez-MyQW7upDgbk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TABLES = [
  'profiles',
  'properties',
  'agent_profiles',
  'reviews',
  'saved_properties',
  'saved_searches',
  'tour_requests',
  'messages',
  'calendar_events',
  'notifications',
  'investor_settings',
  'investment_requests',
  'user_documents',
  'property_alerts',
  'car_rentals',
  'wellness_services'
];

async function runDiagnostics() {
  console.log('====================================================');
  console.log('       AFRIESTATE SYSTEM CONNECTION DIAGNOSTIC       ');
  console.log('====================================================');
  console.log(`Supabase Project URL: ${supabaseUrl}`);
  console.log('Testing connection...');

  try {
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log(`[-] Auth connection issue: ${authError.message}`);
    } else {
      console.log(`[+] Auth session endpoints responding normally.`);
    }
  } catch (err) {
    console.log(`[-] Critical auth connection exception: ${err.message}`);
  }

  console.log('\n--- Checking Table Connections and Schemas ---');
  
  for (const table of TABLES) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        if (error.code === '42P01') {
          console.log(`[-] Table "${table}": MISSING (Relation does not exist in Supabase database)`);
        } else {
          console.log(`[-] Table "${table}": ERROR (Code: ${error.code}, Message: ${error.message})`);
        }
      } else {
        const rowCount = count !== null ? count : 0;
        console.log(`[+] Table "${table}": CONNECTED (Records found: ${rowCount})`);
      }
    } catch (err) {
      console.log(`[-] Table "${table}": CRITICAL EXCEPTION (${err.message})`);
    }
  }

  console.log('====================================================');
}

runDiagnostics();
