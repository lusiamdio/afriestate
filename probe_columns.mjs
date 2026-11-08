import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jbdykuibxxqrvdgaoxet.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZHlrdWlieHhxcnZkZ2FveGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDA5MTQsImV4cCI6MjA5MjgxNjkxNH0.Hp6ILAE7WMKIC7U1e4yaRkz9U9x1Sez-MyQW7upDgbk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PROBE_COLUMNS = [
  'id',
  'title',
  'price',
  'address',
  'coordinates',
  'details',
  'description',
  'neighborhood_info',
  'neighborhoodInfo',
  'amenities',
  'images',
  'virtual_tour_url',
  'virtualTourUrl',
  'vr_tour_url',
  'vrTourUrl',
  'agent_name',
  'agentName',
  'featured',
  'verified',
  'smart_contract_ready',
  'smartContractReady',
  'views',
  'status',
  'date_listed',
  'dateListed',
  'saves',
  'purchase_price',
  'purchasePrice',
  'price_history',
  'priceHistory',
  'occupancy_rate',
  'occupancyRate',
  'market_roi',
  'marketROI',
  'financials',
  'guests',
  'vehicle_type',
  'vehicleType',
  'package_includes',
  'packageIncludes',
  'per_night_price',
  'perNightPrice',
  'likes',
  'rating',
  'reviews',
  'agent',
  'location'
];

async function probe() {
  console.log('Probing properties table columns...');
  const existingCols = [];
  const missingCols = [];
  
  for (const col of PROBE_COLUMNS) {
    const payload = {
      id: 'd3b07384-d113-49c3-a5f1-8cb16b1104e6' // valid UUID
    };
    if (col !== 'id') {
      payload[col] = 'test'; // dummy string value to trigger validation
    }
    
    const { error } = await supabase.from('properties').insert(payload);
    
    if (error) {
      if (error.code === 'PGRST204' && error.message.includes(`Could not find the '${col}'`)) {
        missingCols.push(col);
      } else {
        existingCols.push(col);
      }
    } else {
      existingCols.push(col);
    }
  }
  
  console.log('\n=== PROBE RESULTS ===');
  console.log('[+] Existing Columns:', existingCols.join(', '));
  console.log('[-] Missing Columns:', missingCols.join(', '));
}

probe();
