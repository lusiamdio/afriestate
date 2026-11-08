import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jbdykuibxxqrvdgaoxet.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZHlrdWlieHhxcnZkZ2FveGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDA5MTQsImV4cCI6MjA5MjgxNjkxNH0.Hp6ILAE7WMKIC7U1e4yaRkz9U9x1Sez-MyQW7upDgbk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test backend connection
async function testConnection() {
  try {
    // Attempt an auth lookup or simple query to verify connection
    const { error } = await supabase.auth.getSession();
    if (error) {
      console.error("Supabase connection error:", error.message);
    } else {
      console.log("Supabase backend successfully connected.");
    }
  } catch (err) {
    console.error("Supabase connection failed.", err);
  }
}

testConnection();
