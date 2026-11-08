import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://jbdykuibxxqrvdgaoxet.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZHlrdWlieHhxcnZkZ2FveGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDA5MTQsImV4cCI6MjA5MjgxNjkxNH0.Hp6ILAE7WMKIC7U1e4yaRkz9U9x1Sez-MyQW7upDgbk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    const { data: cols } = await supabase.rpc('get_columns_for_table', { tablename: 'properties' });
    console.log(cols);
    const { data, error } = await supabase.from('properties').select('*').limit(1);
    console.log(error);
}

checkSchema();
