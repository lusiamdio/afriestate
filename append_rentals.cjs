const fs = require('fs');

const angolaRentals = `Company Name,Mobile Number,Landline Number,Contact Person,Business Address,Company Description,Website / Logo Source
Avis Angola (Airport Branch),+244 222 321 551,+244 222 321 551,Branch Manager,"Aeroporto Internacional 4 de Fevereiro (Quatro de Fevereiro Airport), Av. Revolução de Outubro, Luanda, Angola","International car rental brand operating at Luanda's main international airport. Open daily 06:30–20:30. Accepts Avis Charge Cards, Amex, Diners Club, Mastercard and Visa. Offers CDW and Theft Protection. Caters to business and leisure travellers arriving in Angola.",https://www.avis.com/en/locations/af/ao/luanda
Avis Angola (Downtown Branch),+244 222 323 182,+244 222 323 182,Branch Manager,"Av. Che Guevara Nr 250, Maculusso, Luanda, Angola","City-centre branch of the global Avis Rent a Car brand in Luanda. Open Mon–Fri 08:00–18:00, Sat 08:00–12:00. Offers a full range of rental cars with optional coverages. Conveniently located 0.58 km from the city centre.",https://www.avis.com/en/locations/af/ao/luanda
Europcar Angola (Airport),+244 222 783 861,+244 222 783 861,Customer Services,"Aeroporto Internacional 4 de Fevereiro, Luanda, Angola","Global car rental brand with the largest presence in Angola. Located at Luanda International Airport arrivals. Offers compact to family-size vehicles with competitive rates. Part of the Europcar international network operating in 150+ countries. Open 06:00–22:00 daily.",https://www.europcar.com/en-us/places/car-rental-angola
Europcar Angola (Bairro Mártires),+244 222 783 487,+244 222 783 487,Customer Services,"Rua 7, Bairro dos Mártires do Kifangondo, Luanda, Angola","City branch of Europcar offering car and van hire in central Luanda. Wide range of vehicles from economy models to spacious SUVs. Suitable for business and leisure clients. Offers flexible daily and weekly rental options.",https://www.europcar.com/en-us/places/car-rental-angola
Europcar Angola (Avenida Mucufi),+244 222 772 933,+244 222 772 933,Customer Services,"Avenida Mucufi Boulevard, Luanda, Angola","Additional Europcar city branch serving Luanda's business district. Access to the full Europcar fleet including economy cars, sedans and minivans. 24/7 reservations available online. SADC-wide network coverage.",https://www.europcar.com/en-us/places/car-rental-angola
Europcar Angola (Meet & Greet / Largo 17 de Setembro),+244 914 613 614,N/A,Meet & Greet Coordinator,"Largo 17 de Setembro Nr 4, Luanda, Angola / Rua da Missão, Hotel Trópico, Luanda","Europcar meet-and-greet station offering vehicle delivery and collection services in central Luanda. Ideal for hotel-based clients and corporate travellers. Also located at Hotel Trópico on Rua da Missão.",https://www.europcar.com/en-us/places/car-rental-angola
Hertz Angola,+244 914 622 668,N/A,Branch Manager,"Rua da Missão 20, Luanda, Angola","Global Hertz car rental brand with a presence in Luanda. Offers premium and economy vehicles for daily, weekly and long-term hire. Well-known for quality maintained vehicles and straightforward booking process. Serves both leisure and corporate clients.",https://www.hertz.com/us/en/location/angola/luanda
SIXT Angola (Airport),+244 933 728 002,N/A,Branch Manager,"International Arrivals Lounge, Aeroporto Internacional 4 de Fevereiro, Luanda, Angola","SIXT Rent a Car with a 24-hour pick-up location at Luanda Airport arrivals hall. Family-managed global brand since 1912. Fleet includes SUVs, minivans, sedans, station wagons and convertibles. Minimum rental age 18. International Driving Permit required.",https://www.sixt.com/car-rental/angola/luanda/
SIXT Angola (City),+244 933 728 002,N/A,Branch Manager,"Hotel de Convencoes CCB4 GU02, Luanda, Angola","SIXT city branch in Luanda located at Hotel de Convenções. 24-hour vehicle pick-up available. Offers the same diverse fleet as the airport branch. Convenient for hotel-based guests and travellers not using the airport.",https://www.sixt.com/car-rental/angola/luanda/
Budget Angola,N/A,N/A,Reservations Desk,"Quatro de Fevereiro Airport & Luanda City, Angola","Budget Car Rental with operations in Luanda, Angola. Offers competitive daily and weekly car hire rates at the airport and city locations. Popular among budget-conscious business and leisure travellers. Online bookings available through Budget's global portal.",https://www.budget.com/en/locations/ao/luanda
Chana Rent-A-Car,N/A,N/A,"Paulo Vaal Neto (Director-Geral); Fátima Jeremias (Gestora)","Estrada Principal do Lar do Patriota, Luanda; also Lobito Branch – Benguela Province, Angola","Proudly Angolan car rental company operating since 2012 under the Grupo Chana (Organizações Chana), founded in 1992. Fleet of ~200 vehicles including small, medium and large vehicles. Offers rental with and without driver for weddings, corporate missions, events and general transport. Also present in Benguela Province (Lobito) and at Luanda Airport.",https://chanarentacar.ao/
Daimic Rent (Sede – Viana),+244 936 514 976,+244 941 131 127,Customer Service Team,"Avenida Deolinda Rodrigues, KM 13, Viana (Estrada de Catete), Luanda, Angola","Vehicle rental division of the Daimic Motors Group (part of Grupo Imporáfrica, founded 1989). Offers a wide range of rental vehicles for personal and corporate clients from multiple branches across Luanda. Monthly renting (renting) options available. Official Changan and Citroen representative.",https://www.daimic.com/alugar
Daimic Rent (Talatona),+244 972 626 993,+244 972 626 948,Commercial Department,"Edifício One Metropolis, Loja Nº 1, Talatona, Luanda, Angola","Talatona branch of Daimic Rent offering vehicle rental for corporate and individual clients. Ideally positioned near Luanda's business hub. Full range of cars available from compact to SUV. Backed by Daimic's nationwide service network.",https://www.daimic.com/alugar
Daimic Rent (Morro Bento),+244 972 626 994,+244 972 626 949,Commercial Department,"Av. 21 de Janeiro, Morro Bento (Alongside Hotel AGATHA), Luanda, Angola","Morro Bento branch of Daimic Rent serving one of Luanda's prime residential and business areas. Vehicles available for short and long-term hire. Certified clean vehicles with rigorous hygiene standards.",https://www.daimic.com/alugar
Daimic Rent (Via Expressa – Patriota),+244 972 419 913,N/A,Commercial Department,"Via Expressa – Patriota, Before the Boa Vida Urbanisation (direction Kilamba), Luanda, Angola","Patriota corridor branch of Daimic Rent serving the rapidly growing suburban belt south-east of Luanda. Caters to residents of Kilamba and surrounding areas. Full range of rental vehicles available.",https://www.daimic.com/alugar
Daimic Rent (Lubango – via EMPOWER),N/A,N/A,Authorised Representative,"Rua Patrice Lumumba, Next to Prédio dos Médicos, Lubango, Huíla Province, Angola","Authorised Daimic Rent representative in Lubango, serving Angola's second-largest inland city. Provides vehicle rental solutions to corporate and individual clients in the Huíla province.",https://www.daimic.com/alugar
`;

// Very basic CSV parser
let rows = [];
let currentRow = [];
let currentCell = '';
let inQuotes = false;
for (let i = 0; i < angolaRentals.length; i++) {
  const char = angolaRentals[i];
  if (inQuotes) {
    if (char === '"' && angolaRentals[i + 1] === '"') {
      currentCell += '"';
      i++;
    } else if (char === '"') {
      inQuotes = false;
    } else {
      currentCell += char;
    }
  } else {
    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (char === '\n') {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
}
if (currentCell) currentRow.push(currentCell.trim());
if (currentRow.length > 0) rows.push(currentRow);

rows.shift(); // remove header

const images = [
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1562225219-c636f1c4df82?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1586191552066-d52cd8bd002e?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1616431940984-7a3c7dd59b58?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1549318182-ed32ffed7b45?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1518987114704-51a84f3ccfa4?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1502877338535-775f0054817a?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1591768793355-74d04bb6608f?auto=format&fit=crop&q=80&w=800',
    'https://plus.unsplash.com/premium_photo-1661962386187-b99bcf41865c?auto=format&fit=crop&q=80&w=800'
];

const newObjects = rows.filter(r => r.length > 3).map((r, i) => {
  return `  {
    name: ${JSON.stringify(r[0])},
    phone: ${JSON.stringify(r[1])},
    landline: ${JSON.stringify(r[2])},
    contactPerson: ${JSON.stringify(r[3])},
    address: ${JSON.stringify(r[4])},
    description: ${JSON.stringify(r[5])},
    website: ${JSON.stringify(r[6])},
    image: '${images[i % images.length]}'
  }`;
}).join(',\n');

let fileContent = fs.readFileSync('components/pages/RentACarPage.tsx', 'utf8');
fileContent = fileContent.replace('  }\n];', '  },\n' + newObjects + '\n];');
fs.writeFileSync('components/pages/RentACarPage.tsx', fileContent);
