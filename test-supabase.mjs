import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://jbdykuibxxqrvdgaoxet.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZHlrdWlieHhxcnZkZ2FveGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDA5MTQsImV4cCI6MjA5MjgxNjkxNH0.Hp6ILAE7WMKIC7U1e4yaRkz9U9x1Sez-MyQW7upDgbk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
supabase.auth.signInWithPassword({email:'simao@neurogrowthlabs.co.za',password:'AfriEstate2@'}).then(res => console.log(JSON.stringify(res, null, 2))).catch(console.error);
