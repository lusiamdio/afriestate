import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jbdykuibxxqrvdgaoxet.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZHlrdWlieHhxcnZkZ2FveGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDA5MTQsImV4cCI6MjA5MjgxNjkxNH0.Hp6ILAE7WMKIC7U1e4yaRkz9U9x1Sez-MyQW7upDgbk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  const testProp = {
    id: 'd3b07384-d113-49c3-a5f1-8cb16b1104e6',
    title: 'Diagnostic Test Property',
    price: 1500000,
    address: '123 test street'
  };
  
  console.log('Attempting to insert simple property...');
  const { data, error } = await supabase.from('properties').insert(testProp).select();
  if (error) {
    console.log('Insert failed with error:', error);
  } else {
    console.log('Insert succeeded! Inserted row:', data);
    // Let's clean it up
    await supabase.from('properties').delete().eq('id', testProp.id);
  }
}

runTest();
