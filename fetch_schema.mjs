const url = 'https://jbdykuibxxqrvdgaoxet.supabase.co/rest/v1/';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZHlrdWlieHhxcnZkZ2FveGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDA5MTQsImV4cCI6MjA5MjgxNjkxNH0.Hp6ILAE7WMKIC7U1e4yaRkz9U9x1Sez-MyQW7upDgbk';

async function fetchSchema() {
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    const spec = await res.json();
    
    console.log('=== Swagger Keys ===');
    console.log(Object.keys(spec));
    if (spec.message) {
      console.log('Error Message:', spec.message);
    }
    const paths = spec.paths || {};
    console.log('Exposed Paths:', Object.keys(paths));
    
    const definitions = spec.definitions || {};
    console.log('Exposed Definitions:', Object.keys(definitions));
  } catch (err) {
    console.error('Failed to fetch OpenAPI schema:', err);
  }
}

fetchSchema();
