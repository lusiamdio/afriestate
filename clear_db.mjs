import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://jbdykuibxxqrvdgaoxet.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZHlrdWlieHhxcnZkZ2FveGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDA5MTQsImV4cCI6MjA5MjgxNjkxNH0.Hp6ILAE7WMKIC7U1e4yaRkz9U9x1Sez-MyQW7upDgbk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearAndSeed() {
    console.log('Clearing properties table...');
    const { error: delError } = await supabase.from('properties').delete().not('id', 'is', null);
    console.log(delError ? 'Error deleting:'+ delError.message : 'Deleted successfully.');
}

clearAndSeed();
