import fs from 'fs';

const csvData = `Company Name,Mobile Number,Landline Number,Contact Person,Business Address,Company Description,Website / Logo Source
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
Company Name,Phone Number,Landline Number,Contact Person,Business Address,Company Description,Website / Logo Source
Avis Rent a Car,0861 021 111,+27 11 923 3500,Customer Service Team,3 Brabazon Road, Croydon, Isando, Gauteng 1600,"South Africa's leading car rental company offering a diverse fleet of vehicles including cars, bakkies and vans. Services include short-term hire, long-term rental, chauffeur drive and luxury car hire. Nationwide branches at all major airports and city centres. Part of Avis Budget Group.",https://www.avis.co.za
Europcar South Africa,+27 11 723 8000,+27 11 454 1236 (Fax),Customer Services,146 Kelvin Drive, Woodmead, Sandton, Gauteng,"One of South Africa's leading global car rental companies with over 25,000 vehicles across 100+ locations throughout the SADC region. A division of the Motus Group Ltd (JSE listed). Offers car hire, van rental, commercial vehicles and long-term leasing. BBBEE compliant.",https://www.europcar.co.za
Hertz South Africa,+27 21 935 4800,+27 21 935 4800,Customer Relations,PO Box 145, Cape Town International Airport, Cape Town 7525,"Global car rental brand offering premium car hire across South Africa. Known for quality vehicles, bakkies and commercial vehicles. Branches at all major airports in Johannesburg, Cape Town and Durban. Offers daily, weekly and monthly rental options.",https://www.hertz.co.za
First Car Rental,0861 178 227,+27 11 230 9999,Call Centre,1st Floor Prism Building, Rudd Road, Illovo, Johannesburg, Gauteng 2196,"South Africa's largest independent car rental company offering cars, bakkies and vans for business and leisure. Strong airport presence across major cities. Competitive daily rates from R273/day. Partner airline FlySafair for integrated travel deals.",https://www.firstcarrental.co.za
Tempest Car Hire,0861 836 737,+27 11 573 0000,Customer Care,16 Ernest Oppenheimer Avenue, Bruma, Johannesburg, Gauteng 2198,"Proudly South African car rental brand operating since 1986. A division of the Motus Group Ltd. Offers economy to luxury vehicles, corporate and leisure rentals, long-term 'MAXI-rent' option and commercial vehicles. Level 3 B-BBEE rated with 26 branches nationwide.",https://www.tempestcarhire.co.za
Spartan Truck Hire,0861 772 7826,0861 772 7826,Arnold Friedman (CEO),Kempton Park, Gauteng (Head Office),"South Africa's leading truck rental and leasing provider with 40+ years' experience and a fleet of over 4,500 vehicles. Services include short to medium-term truck hire, full maintenance leasing and dedicated transport contracts. Branches in Johannesburg, Pretoria, Durban and Cape Town.",https://www.spartantruckhire.co.za
Imperial Truck Rental,+27 11 977 7339,+27 11 977 7100,Surette Vorster,"160 Kelvin Road (Cnr Kelvin & Derrick Road), Spartan, Kempton Park 1619","Flexible and dependable truck rental solutions across South Africa. Anticipates and responds to clients' evolving transport needs. Multiple branches nationwide including Cape Town and Pretoria. Part of DP World logistics group. Trusted by universities and major corporates.",https://www.imperialtruckrental.co.za
Elite Truck Hire,+27 11 397 3800,+27 11 397 3800,Fleet Sales Team,Gauteng (Head Office — branches nationwide),"Trusted Level 2 BBBEE truck hire company with decades of industry experience. Offers daily, weekly and monthly rentals as well as full-maintenance leasing. Fleet includes bakkies, vans, panel vans, curtain sides, refrigerated trucks and tail-lift trucks.",https://elitetruck.co.za
Kenings Van and Truck Hire,021 555 9561,021 555 9561,Enquiries Team,Cape Town (Head Office with nationwide branches),"Affordable van, bakkie and truck hire across South Africa. Caters to logistics & distribution, business operations, personal moves, and film & production. Well-maintained vehicles with flexible rental periods. Branches located countrywide for easy collection and return.",https://kenings.co.za
GO Rentals (IT & Equipment),0861 467 368,+27 11 513 9200,Customer Service,Sandton, Johannesburg (Head Office); Cape Town: 10 Blaauwberg Business Park, Potsdam Road, Table View 7441,"South Africa's leading technology and IT equipment rental company. Offers short and long-term rentals of computers, notebooks, projectors, servers and more to Corporate, SME and Government clients. 18+ years in business with nationwide coverage including Johannesburg and Cape Town.",https://gorentals.co.za
Budget Car Rental South Africa,0800 016 622,+27 11 398 0123,Reservations Team,Isando, Johannesburg, Gauteng (Head Office),"International car rental brand with a strong presence across South Africa. Offers budget-friendly car hire at airports and city branches. Range includes economy, mid-size and SUV vehicles. Suitable for business and leisure travel with flexible daily and weekly rates.",https://www.budget.co.za
BLUU Car Rental,0800 259 888,0800 259 888,Customer Support,Nationwide (South Africa),"Affordable car hire in South Africa with nationwide coverage. Competitive rates for business trips, holidays and airport transfers. Offers a range of vehicle categories with easy online booking and excellent customer service.",https://www.bluucarrental.com
Truck Hire South Africa (TruckHire.co.za),+27 11 568 6200,+27 11 568 6200,Enquiries Desk,Johannesburg, Gauteng,"Network-based truck hire broker connecting clients with a wide variety of vehicle rental companies across South Africa. Provides moving vans, panel vans, dropsides, refrigerated trucks, rollback trucks, crane trucks, lowbeds and bakkies. Handles both local and cross-border transport.",https://truckhire.co.za
Value Logistics,+27 11 842 2000,+27 11 842 2000,Fleet Solutions Team,Johannesburg, Gauteng,"Integrated supply chain and transport solutions provider. Offers scalable fleet rental solutions and dedicated transport contracts across South Africa for businesses needing access to vehicles without capital investment. Serves retail, FMCG and distribution sectors.",https://value.co.za`

// Parse CSV manually correctly handling quotes
let rows = [];
let currentRow = [];
let currentVal = '';
let inQuotes = false;
for (let i = 0; i < csvData.length; i++) {
  let char = csvData[i];
  if (inQuotes) {
    if (char === '"') {
      if (csvData[i + 1] === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else {
      currentVal += char;
    }
  } else {
    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if (char === '\n') {
      currentRow.push(currentVal.trim());
      rows.push(currentRow);
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
}
if (currentVal || currentRow.length > 0) {
  currentRow.push(currentVal.trim());
  rows.push(currentRow);
}

// Ensure header skip
const filteredRows = rows.filter(r => r.length >= 6 && !r[0].includes('Company Name') && r[0].length > 0);

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

let itemsStr = "[\n";
filteredRows.forEach((r, i) => {
  itemsStr += `  {
    name: ${JSON.stringify(r[0])},
    phone: ${JSON.stringify(r[1])},
    landline: ${JSON.stringify(r[2])},
    contactPerson: ${JSON.stringify(r[3])},
    address: ${JSON.stringify(r[4])},
    description: ${JSON.stringify(r[5])},
    website: ${JSON.stringify(r[6] || '')},
    image: '${images[i % images.length]}'
  }${i < filteredRows.length - 1 ? ',' : ''}\n`;
});
itemsStr += "];";

const filePath = 'components/pages/RentACarPage.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const regex = /const carRentals = \[[^]*?\];/m;
const newContent = content.replace(regex, 'const carRentals = ' + itemsStr);

fs.writeFileSync(filePath, newContent);
console.log('Updated carRentals');
