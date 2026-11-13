import type { NeighborhoodGuide } from '../types';
import { NEIGHBORHOOD_GUIDES } from '../constants';

export type CountryCode = 'ZA' | 'NG' | 'KE' | 'GH' | 'RW' | 'EG' | 'MA' | 'AO';

export type MarketPositioningTier =
  | 'Affordable'
  | 'Affordable–mid-market'
  | 'Mid-market'
  | 'Mid-market–premium'
  | 'Premium';

export interface CityMarketRow {
  city: string;
  neighborhoods: string[];
  positioning: MarketPositioningTier;
}

export interface TopRecommendation {
  rank: number;
  area: string;
  city?: string;
  summary: string;
}

export interface CountryMarketGuide {
  code: CountryCode;
  name: string;
  region: 'Southern Africa' | 'West Africa' | 'East Africa' | 'North Africa' | 'Central Africa';
  scoreIndex: number;
  overview: string;
  importantNote?: string;
  highlightNote?: string;
  cities: CityMarketRow[];
  topRecommendations: TopRecommendation[];
  launchPriorityAreas: string[];
}

export interface PositioningMatrixRow {
  countryCode: CountryCode;
  country: string;
  bestValue: string[];
  bestGrowth: string[];
  premium: string[];
}

export interface AffordabilityIndexRow {
  countryCode: CountryCode;
  country: string;
  city: string;
  index: number;
}

export interface StructuredNeighborhoodProfile {
  id: string;
  countryCode: CountryCode;
  country: string;
  region: CountryMarketGuide['region'];
  city: string;
  neighborhood: string;
  propertyMarket: MarketPositioningTier;
  propertyTypes: string[];
  rentalDemand: 'Low' | 'Medium' | 'High';
  developmentActivity: string;
  isLaunchPriority: boolean;
  isTopRecommendation: boolean;
  recommendationNote?: string;
  heroImage: string;
  gallery: string[];
  coordinates: { lat: number; lng: number };
  overview: string;
  rentalRangesUsd: {
    studioOrOneBed: string;
    twoBed: string;
    threeBedPlus: string;
    avgMonthlyUsd: number;
  };
  purchaseMetricsUsd: {
    avgAskingUsd: number;
    entryRangeUsd: string;
    upperRangeUsd: string;
    pricePerSqmUsd: number;
  };
  priceTrends: { month: string; avgRentUsd: number; avgSaleUsd: number }[];
  yoyGrowthPct: number;
  yieldEstimates: {
    grossYieldPct: number;
    netYieldRange: string;
    occupancyEstimate: string;
    yieldCommentary: string;
  };
  schoolsAndUniversities: { name: string; type: string; distance: string }[];
  hospitalsAndHealthcare: { name: string; type: string; distance: string }[];
  transportAndAccessibility: {
    summary: string;
    corridors: string[];
    commutes: { label: string; driveMin: number; transitMin: number; bikeMin: number }[];
    walkabilityNote: string;
  };
  restaurantsAndShopping: { name: string; category: string; distance: string }[];
  safetyAndEnvironment: {
    score: number;
    summary: string;
    infrastructureCaveat: string;
    utilitiesNote: string;
  };
  newDevelopments: {
    name: string;
    type: string;
    status: string;
    highlight: string;
  }[];
  aiBaselineInsight: {
    headline: string;
    buyerFit: string;
    investorThesis: string;
    dueDiligenceChecklist: string[];
  };
  scores: {
    safety: number;
    schools: number;
    affordability: number;
    familyFriendly: number;
    nightlife: number;
    connectivity: number;
  };
  virtualTourUrl: string;
  events: { name: string; date: string; description: string }[];
  reviews: { author: string; quote: string }[];
  linkedGuideId?: string;
}

export const COUNTRY_MARKET_GUIDES: CountryMarketGuide[] = [
  {
    code: 'ZA',
    name: 'South Africa',
    region: 'Southern Africa',
    scoreIndex: 10,
    overview:
      'South Africa offers a broad range of residential markets, from affordable suburban apartments to premium coastal properties, supported by transparent deeds registration and mature mortgage financing.',
    highlightNote:
      'Gauteng commuter hubs (Randburg, Midrand) and Western Cape transit corridors (Goodwood, Durbanville) provide benchmark sectional-title liquidity.',
    cities: [
      { city: 'Johannesburg', neighborhoods: ['Randburg', 'Ferndale', 'Florida', 'Roodepoort', 'Mondeor'], positioning: 'Affordable–mid-market' },
      { city: 'Johannesburg', neighborhoods: ['Fourways', 'Midrand', 'North Riding'], positioning: 'Mid-market' },
      { city: 'Pretoria', neighborhoods: ['Montana', 'Wonderboom', 'Queenswood', 'Waverley'], positioning: 'Affordable–mid-market' },
      { city: 'Pretoria', neighborhoods: ['Centurion', 'Hatfield', 'Garsfontein'], positioning: 'Mid-market' },
      { city: 'Cape Town', neighborhoods: ['Goodwood', 'Parow', 'Bellville', 'Kuils River'], positioning: 'Affordable–mid-market' },
      { city: 'Cape Town', neighborhoods: ['Brackenfell', 'Kraaifontein', 'Parklands'], positioning: 'Mid-market' },
      { city: 'Durban', neighborhoods: ['Pinetown', 'Newlands East', 'Glenwood', 'Bluff'], positioning: 'Affordable–mid-market' },
      { city: 'Durban', neighborhoods: ['Westville', 'Amanzimtoti', 'Umhlanga Ridge'], positioning: 'Mid-market–premium' },
      { city: 'Gqeberha', neighborhoods: ['Lorraine', 'Kabega Park', 'Newton Park', 'Summerstrand'], positioning: 'Affordable–mid-market' },
      { city: 'East London', neighborhoods: ['Beacon Bay', 'Berea', 'Gonubie'], positioning: 'Mid-market' },
    ],
    topRecommendations: [
      { rank: 1, area: 'Randburg', city: 'Johannesburg', summary: 'Good access to employment, shopping and residential developments.' },
      { rank: 2, area: 'Montana', city: 'Pretoria', summary: 'Attractive suburban housing options with strong security-estate inventory.' },
      { rank: 3, area: 'Goodwood', city: 'Cape Town', summary: 'Established residential area with transport connectivity across the N1 and rail corridors.' },
      { rank: 4, area: 'Pinetown', city: 'Durban', summary: 'Practical access to industrial and commercial employment nodes.' },
      { rank: 5, area: 'Kabega Park', city: 'Gqeberha', summary: 'Worth exploring for relatively accessible family housing and schooling proximity.' },
    ],
    launchPriorityAreas: ['Goodwood', 'Randburg', 'Montana', 'Midrand'],
  },
  {
    code: 'NG',
    name: 'Nigeria',
    region: 'West Africa',
    scoreIndex: 7,
    overview:
      'Nigeria has a large rental market, particularly around Lagos, Abuja, Port Harcourt and Ibadan, driven by urban workforce migration, university clusters, and diaspora residential demand.',
    importantNote:
      'Important: Lagos and Abuja can have significant differences in infrastructure, electricity, water supply, road access and security between individual streets and estates. Always inspect estate-level power, drainage, and Governor’s Consent / C of O documentation.',
    cities: [
      { city: 'Lagos', neighborhoods: ['Ogba', 'Agege', 'Abule Egba', 'Iba', 'Ikorodu'], positioning: 'Affordable' },
      { city: 'Lagos', neighborhoods: ['Surulere', 'Yaba', 'Maryland', 'Ikeja'], positioning: 'Affordable–mid-market' },
      { city: 'Lagos', neighborhoods: ['Lekki Phase 1', 'Ajah', 'Sangotedo'], positioning: 'Mid-market–premium' },
      { city: 'Abuja', neighborhoods: ['Kubwa', 'Lugbe', 'Kuje', 'Karu'], positioning: 'Affordable' },
      { city: 'Abuja', neighborhoods: ['Gwarinpa', 'Lokogoma', 'Jahi'], positioning: 'Affordable–mid-market' },
      { city: 'Abuja', neighborhoods: ['Wuse', 'Garki', 'Maitama'], positioning: 'Mid-market–premium' },
      { city: 'Port Harcourt', neighborhoods: ['Rumuokoro', 'Rumuola', 'Elelenwo', 'Woji'], positioning: 'Affordable–mid-market' },
      { city: 'Ibadan', neighborhoods: ['Akobo', 'Oluyole', 'Apata', 'Challenge'], positioning: 'Affordable' },
      { city: 'Enugu', neighborhoods: ['Independence Layout outskirts', 'Trans-Ekulu', 'Thinkers Corner'], positioning: 'Affordable–mid-market' },
    ],
    topRecommendations: [
      { rank: 1, area: 'Ogba', city: 'Lagos', summary: 'Established residential and commercial environment on the Lagos mainland.' },
      { rank: 2, area: 'Yaba', city: 'Lagos', summary: 'Attractive for students, young professionals and technology workers near UNILAG and innovation hubs.' },
      { rank: 3, area: 'Kubwa', city: 'Abuja', summary: 'Comparatively accessible housing and established satellite communities.' },
      { rank: 4, area: 'Lokogoma', city: 'Abuja', summary: 'Growing residential development corridor with gated estate clusters.' },
      { rank: 5, area: 'Akobo', city: 'Ibadan', summary: 'Attractive for families seeking more space and quieter residential estates.' },
    ],
    launchPriorityAreas: ['Yaba', 'Ogba', 'Kubwa', 'Gwarinpa'],
  },
  {
    code: 'KE',
    name: 'Kenya',
    region: 'East Africa',
    scoreIndex: 12,
    overview:
      "Kenya's residential market is particularly attractive around Nairobi and its expanding metropolitan region, supported by expressway upgrades, satellite town expansion, and formal affordable-housing pipelines.",
    highlightNote:
      'Ngara is particularly interesting because of government-backed affordable housing developments, including Park Road, alongside strong commuter connectivity.',
    cities: [
      { city: 'Nairobi', neighborhoods: ['Embakasi', 'Pipeline', 'Umoja', 'Kayole'], positioning: 'Affordable' },
      { city: 'Nairobi', neighborhoods: ['Kasarani', 'Roysambu', 'Zimmerman', 'Githurai'], positioning: 'Affordable–mid-market' },
      { city: 'Nairobi', neighborhoods: ['Ngara', 'South B', 'South C', 'Lang\'ata'], positioning: 'Mid-market' },
      { city: 'Nairobi', neighborhoods: ['Jamhuri', 'Komarock', 'Donholm'], positioning: 'Affordable–mid-market' },
      { city: 'Kiambu', neighborhoods: ['Ruiru', 'Juja', 'Kikuyu', 'Thika'], positioning: 'Affordable–mid-market' },
      { city: 'Mombasa', neighborhoods: ['Bamburi', 'Kisauni', 'Mtwapa', 'Likoni'], positioning: 'Affordable–mid-market' },
      { city: 'Kisumu', neighborhoods: ['Milimani outskirts', 'Mamboleo', 'Manyatta'], positioning: 'Affordable–mid-market' },
      { city: 'Nakuru', neighborhoods: ['Section 58 outskirts', 'Lanet', 'Naka'], positioning: 'Affordable–mid-market' },
    ],
    topRecommendations: [
      { rank: 1, area: 'Roysambu', city: 'Nairobi', summary: 'Strong access to Nairobi’s northern commercial corridors and Thika Superhighway.' },
      { rank: 2, area: 'Kasarani', city: 'Nairobi', summary: 'Extensive apartment and residential development with high tenant turnover liquidity.' },
      { rank: 3, area: 'Ngara', city: 'Nairobi', summary: 'Proximity to the CBD and government-backed affordable housing developments, including Park Road.' },
      { rank: 4, area: 'Ruiru', city: 'Kiambu', summary: 'Attractive for expanding suburban housing and Eastern Bypass commuter links.' },
      { rank: 5, area: 'South B', city: 'Nairobi', summary: 'Established residential location with fast access to industrial, Mombasa Road and commercial areas.' },
    ],
    launchPriorityAreas: ['Roysambu', 'Kasarani', 'Ngara', 'Ruiru'],
  },
  {
    code: 'GH',
    name: 'Ghana',
    region: 'West Africa',
    scoreIndex: 8,
    overview:
      'Ghana offers opportunities in Accra, Tema and Kumasi, particularly in expanding suburban communities with planned residential estates and coastal eastern growth corridors.',
    highlightNote:
      'Tse Addo is another area worth considering for professionals who want access to La, Labadi and the eastern Accra business corridors.',
    cities: [
      { city: 'Accra', neighborhoods: ['Madina', 'Taifa', 'Ashaiman', 'Nungua'], positioning: 'Affordable' },
      { city: 'Accra', neighborhoods: ['Adenta', 'Haatso', 'Ashaley Botwe', 'Dansoman'], positioning: 'Affordable–mid-market' },
      { city: 'Accra', neighborhoods: ['Spintex', 'Teshie', 'Tse Addo'], positioning: 'Mid-market' },
      { city: 'Accra', neighborhoods: ['East Legon', 'Cantonments', 'Airport Residential'], positioning: 'Premium' },
      { city: 'Tema', neighborhoods: ['Community 1', 'Community 5', 'Community 18', 'Community 25'], positioning: 'Affordable–mid-market' },
      { city: 'Kumasi', neighborhoods: ['Santasi', 'Kwadaso', 'Asokwa', 'Atonsu'], positioning: 'Affordable–mid-market' },
      { city: 'Takoradi', neighborhoods: ['Anaji', 'Kwesimintsim', 'Effia'], positioning: 'Affordable–mid-market' },
    ],
    topRecommendations: [
      { rank: 1, area: 'Adenta', city: 'Accra', summary: 'Growing residential market with reliable commuter access into northern and central Accra.' },
      { rank: 2, area: 'Madina', city: 'Accra', summary: 'Active residential and commercial environment near University of Ghana, Legon.' },
      { rank: 3, area: 'Dansoman', city: 'Accra', summary: 'Established residential community in western Accra with mature amenities.' },
      { rank: 4, area: 'Community 25', city: 'Tema', summary: 'Expanding planned residential development along the Accra–Aflao eastern corridor.' },
      { rank: 5, area: 'Santasi', city: 'Kumasi', summary: 'Attractive suburban residential option in the Ashanti capital.' },
    ],
    launchPriorityAreas: ['Adenta', 'Madina', 'Dansoman', 'Tema'],
  },
  {
    code: 'RW',
    name: 'Rwanda',
    region: 'East Africa',
    scoreIndex: 7,
    overview:
      'Kigali is Rwanda’s primary property market, supported by orderly urban zoning, clean municipal standards, and growing demand for apartments, family houses and planned communities.',
    highlightNote:
      'Ndera, Busanza and Rebero have identifiable affordable-housing communities, although individual property prices vary considerably by plot size and build finish.',
    cities: [
      { city: 'Kigali', neighborhoods: ['Ndera', 'Busanza', 'Kanombe'], positioning: 'Affordable' },
      { city: 'Kigali', neighborhoods: ['Kicukiro', 'Gikondo', 'Gatenga'], positioning: 'Affordable–mid-market' },
      { city: 'Kigali', neighborhoods: ['Kimironko', 'Gisozi', 'Nyamirambo'], positioning: 'Affordable–mid-market' },
      { city: 'Kigali', neighborhoods: ['Rebero', 'Kibagabaga'], positioning: 'Mid-market' },
      { city: 'Kigali', neighborhoods: ['Nyarutarama', 'Kiyovu'], positioning: 'Premium' },
      { city: 'Musanze', neighborhoods: ['Muhoza', 'Cyuve'], positioning: 'Affordable–mid-market' },
      { city: 'Rubavu', neighborhoods: ['Gisenyi', 'Rubavu residential areas'], positioning: 'Affordable–mid-market' },
    ],
    topRecommendations: [
      { rank: 1, area: 'Ndera', city: 'Kigali', summary: 'Promising value-oriented residential area near Kigali Special Economic Zone.' },
      { rank: 2, area: 'Busanza', city: 'Kigali', summary: 'Planned housing development with strong affordability appeal and organized utility layout.' },
      { rank: 3, area: 'Kicukiro', city: 'Kigali', summary: 'Established residential district with strong commercial accessibility and schools.' },
      { rank: 4, area: 'Kimironko', city: 'Kigali', summary: 'Popular residential and commercial area anchored by Kigali’s flagship market and transit hub.' },
      { rank: 5, area: 'Rebero', city: 'Kigali', summary: 'Attractive hillside residential environment with panoramic views and varying property prices.' },
    ],
    launchPriorityAreas: ['Kicukiro', 'Ndera', 'Kimironko', 'Busanza'],
  },
  {
    code: 'EG',
    name: 'Egypt',
    region: 'North Africa',
    scoreIndex: 8,
    overview:
      'Egypt stands out for broad affordability across Cairo, Giza and Alexandria, combining deep high-density apartment stock with planned satellite cities across New Cairo and 6th of October.',
    highlightNote:
      'Comparative 2026 city-level data ranks Alexandria (13.4), Giza (13.6) and Cairo (15.4) among the most cost-competitive major African hubs, though micro-location pricing still varies significantly.',
    cities: [
      { city: 'Cairo', neighborhoods: ['Ain Shams', 'Shubra', 'Hadayek El Maadi'], positioning: 'Affordable' },
      { city: 'Cairo', neighborhoods: ['Nasr City', 'Heliopolis outskirts', 'Zahraa El Maadi'], positioning: 'Affordable–mid-market' },
      { city: 'Giza', neighborhoods: ['Faisal', 'Haram', 'Hadayek October'], positioning: 'Affordable' },
      { city: 'Giza', neighborhoods: ['Sheikh Zayed outskirts', '6th of October City'], positioning: 'Mid-market' },
      { city: 'Alexandria', neighborhoods: ['Sidi Bishr', 'Miami', 'Agami', 'Mandara'], positioning: 'Affordable–mid-market' },
      { city: 'Alexandria', neighborhoods: ['Smouha', 'Sporting', 'Louran'], positioning: 'Mid-market' },
      { city: 'New Cairo', neighborhoods: ['Fifth Settlement outskirts', 'Badr City'], positioning: 'Affordable–mid-market' },
    ],
    topRecommendations: [
      { rank: 1, area: 'Nasr City', city: 'Cairo', summary: 'Established residential and commercial infrastructure with strong metro and ring-road access.' },
      { rank: 2, area: 'Zahraa El Maadi', city: 'Cairo', summary: 'Practical housing options and quick access to southern Cairo business parks.' },
      { rank: 3, area: 'Faisal', city: 'Giza', summary: 'Extensive affordable apartment market connected to Cairo Metro Line 2.' },
      { rank: 4, area: 'Sidi Bishr', city: 'Alexandria', summary: 'Attractive Mediterranean coastal residential area with high year-round occupancy.' },
      { rank: 5, area: 'Agami', city: 'Alexandria', summary: 'Potentially more affordable coastal property options west of central Alexandria.' },
    ],
    launchPriorityAreas: ['Nasr City', 'Zahraa El Maadi', 'Faisal', 'Sidi Bishr'],
  },
  {
    code: 'MA',
    name: 'Morocco',
    region: 'North Africa',
    scoreIndex: 9,
    overview:
      'Morocco offers resilient, mortgage-supported residential markets across Casablanca, Rabat, Marrakech, Tangier and Agadir, bolstered by tramway networks, high-speed rail, and hospitality demand.',
    highlightNote:
      'Sidi Bernoussi is particularly notable for relative affordability combined with direct access to Casablanca’s industrial and tram transport network.',
    cities: [
      { city: 'Casablanca', neighborhoods: ['Sidi Bernoussi', 'Aïn Sebaâ', 'Hay Mohammadi'], positioning: 'Affordable' },
      { city: 'Casablanca', neighborhoods: ['Hay Hassani', 'Sidi Maarouf', 'Oulfa'], positioning: 'Affordable–mid-market' },
      { city: 'Casablanca', neighborhoods: ['Bourgogne', 'Californie'], positioning: 'Mid-market–premium' },
      { city: 'Rabat', neighborhoods: ['Yacoub El Mansour', 'Youssoufia', 'Takaddoum'], positioning: 'Affordable' },
      { city: 'Rabat', neighborhoods: ['Salé', 'Temara'], positioning: 'Affordable–mid-market' },
      { city: 'Marrakech', neighborhoods: ['Sidi Youssef Ben Ali', 'Mhamid', 'Daoudiate'], positioning: 'Affordable' },
      { city: 'Marrakech', neighborhoods: ['Agdal', 'Targa', 'Route de Casablanca'], positioning: 'Mid-market' },
      { city: 'Tangier', neighborhoods: ['Beni Makada', 'Mesnana', 'Boukhalef'], positioning: 'Affordable' },
      { city: 'Tangier', neighborhoods: ['Malabata', 'Iberia'], positioning: 'Mid-market–premium' },
      { city: 'Agadir', neighborhoods: ['Dakhla', 'Bensergao', 'Tikiouine'], positioning: 'Affordable–mid-market' },
    ],
    topRecommendations: [
      { rank: 1, area: 'Hay Hassani', city: 'Casablanca', summary: 'Established residential community near western Casablanca tram and Ring Road.' },
      { rank: 2, area: 'Sidi Bernoussi', city: 'Casablanca', summary: 'Affordability-oriented residential market with strong Casablanca transport links.' },
      { rank: 3, area: 'Temara', city: 'Rabat', summary: 'Attractive coastal-suburban alternative serving Rabat’s administrative belt.' },
      { rank: 4, area: 'Mhamid', city: 'Marrakech', summary: 'Growing southwestern residential area near Marrakech Menara Airport.' },
      { rank: 5, area: 'Tikiouine', city: 'Agadir', summary: 'Worth exploring for more affordable family apartment and townhouse stock.' },
    ],
    launchPriorityAreas: ['Hay Hassani', 'Temara', 'Mhamid', 'Sidi Bernoussi'],
  },
  {
    code: 'AO',
    name: 'Angola',
    region: 'Central Africa',
    scoreIndex: 8,
    overview:
      'Angola offers significant residential opportunities, particularly in Greater Luanda, where planned housing developments (centralidades) and expanding suburban corridors define modern supply.',
    importantNote:
      'Important: Compare transport access, water supply, electricity, building management, road conditions and legal ownership documentation at the individual development level. Published, comparable neighbourhood rent data is more limited than in some other African markets.',
    cities: [
      { city: 'Luanda', neighborhoods: ['Zango', 'Viana', 'Cacuaco'], positioning: 'Affordable' },
      { city: 'Luanda', neighborhoods: ['Kilamba', 'Camama', 'Benfica'], positioning: 'Affordable–mid-market' },
      { city: 'Luanda', neighborhoods: ['Patriota', 'Morro Bento outskirts'], positioning: 'Mid-market' },
      { city: 'Luanda', neighborhoods: ['Talatona', 'Miramar', 'Maianga'], positioning: 'Mid-market–premium' },
      { city: 'Benguela', neighborhoods: ['Benguela city outskirts', 'Lobito'], positioning: 'Affordable–mid-market' },
      { city: 'Huambo', neighborhoods: ['Cidade Alta outskirts', 'São Pedro'], positioning: 'Affordable' },
      { city: 'Lubango', neighborhoods: ['Mapunda', 'Humpata outskirts'], positioning: 'Affordable–mid-market' },
      { city: 'Cabinda', neighborhoods: ['Central outskirts and expanding residential areas'], positioning: 'Affordable–mid-market' },
    ],
    topRecommendations: [
      { rank: 1, area: 'Kilamba', city: 'Luanda', summary: 'Planned residential development with established apartment infrastructure, schools and utilities.' },
      { rank: 2, area: 'Camama', city: 'Luanda', summary: 'Expanding residential market with direct access to Luanda’s southern growth corridors.' },
      { rank: 3, area: 'Benfica', city: 'Luanda', summary: 'Growing southern coastal-suburban area spanning apartments, compounds and family homes.' },
      { rank: 4, area: 'Zango', city: 'Luanda', summary: 'Affordable housing and large-scale planned residential development blocks.' },
      { rank: 5, area: 'Viana', city: 'Luanda', summary: 'Extensive residential and industrial growth corridor anchored by special economic zone jobs.' },
    ],
    launchPriorityAreas: ['Kilamba', 'Camama', 'Benfica', 'Viana'],
  },
];

export const POSITIONING_MATRIX: PositioningMatrixRow[] = [
  {
    countryCode: 'ZA',
    country: 'South Africa',
    bestValue: ['Goodwood', 'Montana', 'Pinetown'],
    bestGrowth: ['Midrand', 'Parklands', 'Fourways'],
    premium: ['Sandton', 'Camps Bay'],
  },
  {
    countryCode: 'NG',
    country: 'Nigeria',
    bestValue: ['Kubwa', 'Ogba', 'Akobo'],
    bestGrowth: ['Lekki outskirts', 'Lokogoma', 'Yaba'],
    premium: ['Ikoyi', 'Victoria Island'],
  },
  {
    countryCode: 'KE',
    country: 'Kenya',
    bestValue: ['Kasarani', 'Roysambu', 'Ruiru'],
    bestGrowth: ['Ngara', 'Syokimau', 'Juja'],
    premium: ['Kilimani', 'Westlands'],
  },
  {
    countryCode: 'GH',
    country: 'Ghana',
    bestValue: ['Madina', 'Adenta', 'Dansoman'],
    bestGrowth: ['Tema', 'Spintex', 'Ashaley Botwe'],
    premium: ['East Legon', 'Cantonments'],
  },
  {
    countryCode: 'RW',
    country: 'Rwanda',
    bestValue: ['Ndera', 'Busanza', 'Kicukiro'],
    bestGrowth: ['Kimironko', 'Rebero', 'Gikondo'],
    premium: ['Nyarutarama', 'Kiyovu'],
  },
  {
    countryCode: 'EG',
    country: 'Egypt',
    bestValue: ['Faisal', 'Zahraa El Maadi', 'Agami'],
    bestGrowth: ['Nasr City', 'New Cairo', '6th of October City'],
    premium: ['Zamalek', 'Maadi'],
  },
  {
    countryCode: 'MA',
    country: 'Morocco',
    bestValue: ['Mhamid', 'Temara', 'Tikiouine'],
    bestGrowth: ['Sidi Maarouf', 'Hay Hassani', 'Tangier'],
    premium: ['Anfa', 'Agdal', 'Malabata'],
  },
  {
    countryCode: 'AO',
    country: 'Angola',
    bestValue: ['Zango', 'Viana', 'Camama'],
    bestGrowth: ['Kilamba', 'Benfica', 'Talatona outskirts'],
    premium: ['Miramar', 'Maianga', 'Talatona'],
  },
];

export const COMPARATIVE_AFFORDABILITY_2026: AffordabilityIndexRow[] = [
  { countryCode: 'EG', country: 'Egypt', city: 'Alexandria', index: 13.4 },
  { countryCode: 'EG', country: 'Egypt', city: 'Giza', index: 13.6 },
  { countryCode: 'EG', country: 'Egypt', city: 'Cairo', index: 15.4 },
  { countryCode: 'RW', country: 'Rwanda', city: 'Kigali', index: 21.4 },
  { countryCode: 'MA', country: 'Morocco', city: 'Marrakech', index: 22.2 },
  { countryCode: 'KE', country: 'Kenya', city: 'Nairobi', index: 22.7 },
  { countryCode: 'ZA', country: 'South Africa', city: 'Durban', index: 24.6 },
  { countryCode: 'MA', country: 'Morocco', city: 'Rabat', index: 24.9 },
  { countryCode: 'GH', country: 'Ghana', city: 'Accra', index: 25.4 },
  { countryCode: 'NG', country: 'Nigeria', city: 'Lagos', index: 25.9 },
];

export interface DistrictSeedConfig {
  countryCode: CountryCode;
  city: string;
  neighborhood: string;
  positioning: MarketPositioningTier;
  avgPriceUsd: number;
  avgRentUsd: number;
  grossYieldPct: number;
  yoyGrowthPct: number;
  rentalDemand: 'Low' | 'Medium' | 'High';
  coordinates: { lat: number; lng: number };
  heroImage: string;
  gallery: string[];
  propertyTypes: string[];
  overview: string;
  transportSummary: string;
  corridors: string[];
  schools: { name: string; type: string; distance: string }[];
  healthcare: { name: string; type: string; distance: string }[];
  retail: { name: string; type: string; distance: string }[];
  developments: { name: string; type: string; status: string; highlight: string }[];
  utilitiesNote: string;
  safetyNote: string;
  scores?: { safety: number; schools: number; affordability: number; familyFriendly: number; nightlife: number; connectivity: number };
}

const curatedSeeds: Record<string, DistrictSeedConfig> = {
  goodwood: {
    countryCode: 'ZA',
    city: 'Cape Town',
    neighborhood: 'Goodwood',
    positioning: 'Affordable–mid-market',
    avgPriceUsd: 128000,
    avgRentUsd: 780,
    grossYieldPct: 8.8,
    yoyGrowthPct: 9.4,
    rentalDemand: 'High',
    coordinates: { lat: -33.9125, lng: 18.5488 },
    heroImage: '/images/house_suburbs_1779978598551.png',
    gallery: ['/images/house_suburbs_1779978598551.png', '/images/apartment_block_1779978678706.png', '/images/modern_house_tan_1779978632706.png'],
    propertyTypes: ['Apartments', 'Houses', 'Townhouses'],
    overview: 'Established northern-suburbs residential node in Cape Town combining central train and N1 highway connectivity with strong family and commuter tenant demand.',
    transportSummary: 'Direct Voortrekker Road transit corridor, Goodwood & Vasco Metrorail stations, and 15-minute N1 access into Cape Town CBD.',
    corridors: ['Voortrekker Road BRT/Bus Spine', 'N1 National Highway', 'Goodwood Metrorail'],
    schools: [
      { name: 'JG Meiring High School', type: 'Public High School', distance: '0.8 km' },
      { name: 'Fairbairn College', type: 'Combined Academy', distance: '1.9 km' },
      { name: 'CPUT Tygerberg Campus', type: 'University / TVET', distance: '3.6 km' },
    ],
    healthcare: [
      { name: 'N1 City Netcare Hospital', type: 'Private Hospital', distance: '1.4 km' },
      { name: 'Karl Bremer Hospital', type: 'Regional Hospital', distance: '3.9 km' },
    ],
    retail: [
      { name: 'N1 City Mall', type: 'Regional Mall & Cinema', distance: '1.3 km' },
      { name: 'GrandWest Entertainment World', type: 'Dining & Leisure', distance: '1.7 km' },
    ],
    developments: [
      { name: 'Goodwood Park Sectional Village', type: 'Mixed-Use Apartments', status: 'Delivering 2026', highlight: 'Solar-ready studio and 2-bed commuter units near N1 City.' },
    ],
    utilitiesNote: 'City of Cape Town municipal grid with widespread 5kVA–8kVA inverter installations in newer complexes.',
    safetyNote: 'Active neighbourhood watch & CID security patrols along N1 City and Townsend Estate; verify street block.',
  },
  randburg: {
    countryCode: 'ZA',
    city: 'Johannesburg',
    neighborhood: 'Randburg',
    positioning: 'Affordable–mid-market',
    avgPriceUsd: 135000,
    avgRentUsd: 860,
    grossYieldPct: 9.6,
    yoyGrowthPct: 8.9,
    rentalDemand: 'High',
    coordinates: { lat: -26.0941, lng: 27.9977 },
    heroImage: '/images/apartment_block_1779978678706.png',
    gallery: ['/images/apartment_block_1779978678706.png', '/images/loft_interior_1779978697203.png', '/images/house_pool_1779978750296.png'],
    propertyTypes: ['Apartments', 'Townhouses', 'Cluster Homes'],
    overview: 'Major northwestern Johannesburg residential and commercial corridor offering immediate employment proximity to Sandton, Rosebank and Bryanston at attainable price points.',
    transportSummary: 'Served by Malibongwe Drive, Bram Fischer Drive, Jan Smuts Avenue and Gautrain feeder buses to Sandton & Rosebank.',
    corridors: ['Bram Fischer Drive', 'Malibongwe Drive Corridor', 'Gautrain Bus M1/M3'],
    schools: [
      { name: 'Randburg Hoërskool', type: 'High School', distance: '1.5 km' },
      { name: 'IR Griffith Primary & Trinityhouse', type: 'Private & Public Schools', distance: '2.2 km' },
      { name: 'IIE MSA / Varsity College Sandton', type: 'Higher Education', distance: '6.8 km' },
    ],
    healthcare: [
      { name: 'Mediclinic Olivedale', type: 'Private Hospital', distance: '4.1 km' },
      { name: 'Randburg Day Clinic & Medical Suites', type: 'Primary Clinic', distance: '0.9 km' },
    ],
    retail: [
      { name: 'Ferndale on Republic', type: 'Retail & Grocery Hub', distance: '0.7 km' },
      { name: 'Cresta Shopping Centre', type: 'Regional Mall', distance: '3.2 km' },
    ],
    developments: [
      { name: 'Ferndale Ridge Urban Lofts', type: 'Sectional Apartments', status: 'Under Construction', highlight: 'Backup borehole water storage and fibre-to-the-home standard.' },
    ],
    utilitiesNote: 'Estate solar-hybrid backups and JoJo/borehole water tanks are standard differentiators across Randburg complexes.',
    safetyNote: 'Well-established boomed enclaves in Ferndale, Robin Hills and Blairgowrie; verify body corporate security levy.',
  },
  montana: {
    countryCode: 'ZA',
    city: 'Pretoria',
    neighborhood: 'Montana',
    positioning: 'Affordable–mid-market',
    avgPriceUsd: 142000,
    avgRentUsd: 820,
    grossYieldPct: 9.1,
    yoyGrowthPct: 9.8,
    rentalDemand: 'High',
    coordinates: { lat: -25.6752, lng: 28.2584 },
    heroImage: '/images/modern_house_tan_1779978632706.png',
    gallery: ['/images/modern_house_tan_1779978632706.png', '/images/house_pool_1779978750296.png', '/images/house_suburbs_1779978598551.png'],
    propertyTypes: ['Full-Title Houses', 'Security Estates', 'Townhouses'],
    overview: 'Attractive northern Pretoria suburban district prized for spacious family clusters, Kolonnade retail convenience, and N1/N4 highway connectivity.',
    transportSummary: 'Instant access to Sefako Makgatho Drive, N1 North/South interchange, and N4 Bakwena highway.',
    corridors: ['Sefako Makgatho Drive (M2)', 'N1 Zambezi Interchange', 'Wonderboom Airport Node'],
    schools: [
      { name: 'Hoërskool Montana', type: 'Public Secondary', distance: '1.4 km' },
      { name: 'Curro Hazeldean / Academy', type: 'Private School Group', distance: '3.8 km' },
    ],
    healthcare: [
      { name: 'Netcare Montana Hospital', type: 'Acute Care Hospital', distance: '1.1 km' },
      { name: 'Kolonnade Medical Centre', type: 'Outpatient Clinic', distance: '1.6 km' },
    ],
    retail: [
      { name: 'Kolonnade Shopping Centre', type: 'Regional Mall & Ice Rink', distance: '1.5 km' },
      { name: 'Montana Crossing', type: 'Retail Strip & Cafés', distance: '1.9 km' },
    ],
    developments: [
      { name: 'Montana Crest Security Gardens', type: 'Duplex Townhouses', status: 'Phase 2 Selling', highlight: 'Prepaid utility metering, solar geysers, and 24-hour guardhouse.' },
    ],
    utilitiesNote: 'Suburban estates increasingly incorporate rooftop PV solar and reserve greywater systems.',
    safetyNote: 'Biometric access security estates dominate new family inventory around Montana Park and Zambezi Country Estate.',
  },
  midrand: {
    countryCode: 'ZA',
    city: 'Johannesburg',
    neighborhood: 'Midrand',
    positioning: 'Mid-market',
    avgPriceUsd: 168000,
    avgRentUsd: 1020,
    grossYieldPct: 9.8,
    yoyGrowthPct: 11.2,
    rentalDemand: 'High',
    coordinates: { lat: -25.9895, lng: 28.1284 },
    heroImage: '/images/Property-1b0835e9d2737f661ff88feb4dfa6cdf-128596052.jpg',
    gallery: ['/images/Property-1b0835e9d2737f661ff88feb4dfa6cdf-128596052.jpg', '/images/luxury_kitchen_living_1779978720358.png', '/images/apartment_dining_1779978782850.png'],
    propertyTypes: ['Lifestyle Estate Apartments', 'Townhouses', 'Corporate Cluster Homes'],
    overview: 'Strategic growth corridor positioned halfway between Johannesburg and Pretoria, anchored by Waterfall City corporate headquarters and Gautrain rapid rail.',
    transportSummary: 'Centered around Midrand Gautrain Station, N1 Ben Schoeman Highway, and Allandale arterial interchange.',
    corridors: ['Midrand Gautrain Station', 'N1 Allandale Interchange', 'R55 Arterial'],
    schools: [
      { name: 'Reddam House Waterfall', type: 'Private K-12', distance: '2.3 km' },
      { name: 'UNISA Graduate School of Business', type: 'University Campus', distance: '1.8 km' },
    ],
    healthcare: [
      { name: 'Netcare Waterfall City Hospital', type: 'Tertiary Private Hospital', distance: '2.1 km' },
      { name: 'Carstenhof Hospital', type: 'Private Hospital', distance: '2.9 km' },
    ],
    retail: [
      { name: 'Mall of Africa', type: 'Flagship Super-Regional Mall', distance: '2.2 km' },
      { name: 'Carlswald Lifestyle Centre', type: 'Dining & Supermarkets', distance: '1.5 km' },
    ],
    developments: [
      { name: 'Waterfall Mia Residences', type: 'Estate Apartments', status: 'Active Delivery', highlight: 'Lagoon amenities, co-working clubhouses, and direct fibre.' },
    ],
    utilitiesNote: 'Master-planned Waterfall and Carlswald precincts maintain estate backup generators and treated water reserves.',
    safetyNote: 'Strict gated estate perimeter control across Noordwyk, Kyalami Hills and Waterfall precincts.',
  },
  yaba: {
    countryCode: 'NG',
    city: 'Lagos',
    neighborhood: 'Yaba',
    positioning: 'Affordable–mid-market',
    avgPriceUsd: 145000,
    avgRentUsd: 620,
    grossYieldPct: 11.8,
    yoyGrowthPct: 14.5,
    rentalDemand: 'High',
    coordinates: { lat: 6.5095, lng: 3.3711 },
    heroImage: '/images/apartment_dining_1779978782850.png',
    gallery: ['/images/apartment_dining_1779978782850.png', '/images/loft_interior_1779978697203.png', '/images/Property-ea7809975b5ff10a6c6dfa6b98a26492-116572885.jpg'],
    propertyTypes: ['Apartments', 'Co-Living Studios', 'Terraced Duplexes'],
    overview: 'Nigeria’s premier Mainland technology and university innovation district ("Yabacon Valley"), offering exceptional occupancy from tech professionals, founders and UNILAG/YABATECH students.',
    transportSummary: 'Direct connectivity via the Lagos Red Line Rail corridor, Third Mainland Bridge toward Victoria Island/Ikoyi, and Herbert Macaulay BRT.',
    corridors: ['Third Mainland Bridge Link', 'Lagos Rail Red Line (Yaba Station)', 'Herbert Macaulay Way BRT'],
    schools: [
      { name: 'University of Lagos (UNILAG)', type: 'Federal University', distance: '1.4 km' },
      { name: 'Yaba College of Technology', type: 'Tertiary Polytechnic', distance: '0.6 km' },
      { name: 'Queen’s College Yaba', type: 'Secondary Academy', distance: '0.9 km' },
    ],
    healthcare: [
      { name: 'Federal Medical Centre Ebute-Metta', type: 'Tertiary Hospital', distance: '2.1 km' },
      { name: 'Harvey Road General Hospital', type: 'Municipal Clinic', distance: '0.8 km' },
    ],
    retail: [
      { name: 'Tejuosho Ultramodern Shopping Complex', type: 'Commercial & Markets', distance: '0.9 km' },
      { name: 'Jevinik & Alara Mainland Tech Hubs', type: 'Dining & Co-Working', distance: '1.2 km' },
    ],
    developments: [
      { name: 'Sabo Co-Living & Tech Courts', type: 'Smart Studio Apartments', status: 'Leasing & Off-Plan', highlight: 'Pre-installed solar-inverter microgrid and dedicated broadband.' },
    ],
    utilitiesNote: 'Power supply varies sharply by street feeder and estate; verify Band-A / dedicated estate solar-diesel hybrid uptime before committing.',
    safetyNote: 'Gated streets around Alagomeji, Onike and Montgomery Road offer stronger evening security and flood drainage than low-lying fringe lanes.',
  },
  ogba: {
    countryCode: 'NG',
    city: 'Lagos',
    neighborhood: 'Ogba',
    positioning: 'Affordable',
    avgPriceUsd: 92000,
    avgRentUsd: 420,
    grossYieldPct: 12.2,
    yoyGrowthPct: 12.1,
    rentalDemand: 'High',
    coordinates: { lat: 6.6317, lng: 3.3372 },
    heroImage: '/images/565600_H_39.jpg',
    gallery: ['/images/565600_H_39.jpg', '/images/280162474.jpg', '/images/house_suburbs_1779978598551.png'],
    propertyTypes: ['Flats', 'Mini-Estates', 'Mixed Commercial-Residential'],
    overview: 'Established northern Lagos Mainland residential and commercial hub bordering Ikeja CBD, prized for practical access to factories, corporate offices, and dependable family rental demand.',
    transportSummary: 'Connected by Acme Road, Aguda-Ogba arterial roads, Iju Road, and the Agege-Ikeja rail & BRT network.',
    corridors: ['Acme / Ikeja Industrial Corridor', 'Wempco Road Link', 'Lagos-Abeokuta Expressway Feeder'],
    schools: [
      { name: 'Lagos African Church Grammar School', type: 'Secondary School', distance: '1.2 km' },
      { name: 'Ogba Excellence Academy', type: 'Primary & Junior High', distance: '0.7 km' },
    ],
    healthcare: [
      { name: 'Ifako-Ijaiye General Hospital', type: 'General Hospital', distance: '2.5 km' },
      { name: 'Blue Cross Hospital Ogba', type: 'Private Hospital', distance: '0.9 km' },
    ],
    retail: [
      { name: 'Ogba Sunday Market & Plaza', type: 'Retail & Wholesale', distance: '0.6 km' },
      { name: 'Ikeja City Mall (Alausa)', type: 'Major Mall', distance: '3.4 km' },
    ],
    developments: [
      { name: 'Obawole Terrace Enclave', type: 'Compact Terraced Homes', status: 'Active Build', highlight: 'Gated 12-unit compound with treated borehole and dedicated transformer.' },
    ],
    utilitiesNote: 'Estate transformers, treated borehole filtration and storm-drainage elevation should be audited per street.',
    safetyNote: 'Residential courts around Ijaiye-Ogba and Wemco estate streets feature organized CDA (Community Development Association) gates.',
  },
  kubwa: {
    countryCode: 'NG',
    city: 'Abuja',
    neighborhood: 'Kubwa',
    positioning: 'Affordable',
    avgPriceUsd: 78000,
    avgRentUsd: 360,
    grossYieldPct: 11.4,
    yoyGrowthPct: 11.5,
    rentalDemand: 'High',
    coordinates: { lat: 9.1538, lng: 7.3220 },
    heroImage: '/images/Ensure960x540.jpg',
    gallery: ['/images/Ensure960x540.jpg', '/images/modern_house_tan_1779978632706.png', '/images/interior_beanbags_1779978650034.png'],
    propertyTypes: ['Bungalows', 'Terrace Houses', 'Apartments'],
    overview: 'One of Abuja’s largest, best-established satellite residential towns delivering accessible housing and mature neighborhood markets along the Kubwa Express Corridor.',
    transportSummary: 'Served by the 10-lane Kubwa Expressway (Outer Northern Expressway) and Abuja Rail Mass Transit (Kubwa Railway Station).',
    corridors: ['Kubwa Expressway (Murtala Muhammed Way)', 'Abuja-Kaduna Standard Gauge Rail', 'Bwari Road'],
    schools: [
      { name: 'Government Secondary School Kubwa', type: 'Public Secondary', distance: '1.1 km' },
      { name: 'Veritas University & Baze Corridor', type: 'University', distance: '7.5 km' },
    ],
    healthcare: [
      { name: 'Kubwa General Hospital', type: 'Public Hospital', distance: '1.0 km' },
      { name: 'Nisa Premier Satellite Clinic', type: 'Private Clinic', distance: '2.2 km' },
    ],
    retail: [
      { name: 'Kubwa Village Market & Mall Plaza', type: 'Regional Commerce', distance: '0.8 km' },
      { name: 'Phase 4 Family Parks & Restaurants', type: 'Dining & Leisure', distance: '1.4 km' },
    ],
    developments: [
      { name: 'Phase 4 Solar Bungalow Estates', type: 'Family Detached Units', status: 'Handover Ongoing', highlight: 'Paved internal access roads with FCDA allocation documentation.' },
    ],
    utilitiesNote: 'Verify FCDA title documentation and confirm road paving plus municipal vs estate water service in Phase 2, Phase 4 and Arab Road.',
    safetyNote: 'Mature estate clusters around PW, Phase 2 Site 1 and Phase 4 maintain active estate vigilante coordination.',
  },
  gwarinpa: {
    countryCode: 'NG',
    city: 'Abuja',
    neighborhood: 'Gwarinpa',
    positioning: 'Affordable–mid-market',
    avgPriceUsd: 175000,
    avgRentUsd: 880,
    grossYieldPct: 10.8,
    yoyGrowthPct: 12.8,
    rentalDemand: 'High',
    coordinates: { lat: 9.1099, lng: 7.4042 },
    heroImage: '/images/coastal_mansion_1779978805301.png',
    gallery: ['/images/coastal_mansion_1779978805301.png', '/images/luxury_kitchen_living_1779978720358.png', '/images/house_pool_1779978750296.png'],
    propertyTypes: ['Detached Duplexes', 'Semi-Detached Homes', 'Serviced Flats'],
    overview: 'Africa’s largest single planned residential estate neighborhood inside Abuja Municipal Area Council, favoured by civil servants, families and mid-to-senior executives.',
    transportSummary: 'Flanked by Kubwa Expressway, 3rd Avenue commercial avenues, and 15 minutes from Wuse II and Maitama.',
    corridors: ['Gwarinpa 3rd Avenue', '1st & 6th Avenue Arterials', 'Kubwa Expressway Link'],
    schools: [
      { name: 'Start-Rite Schools', type: 'Private International School', distance: '1.6 km' },
      { name: 'Aduvie International School', type: 'Cambridge Curriculum School', distance: '3.1 km' },
    ],
    healthcare: [
      { name: 'Gwarinpa General Hospital', type: 'General Hospital', distance: '1.4 km' },
      { name: 'Kelina Hospital Gwarinpa', type: 'Specialist Surgical Hospital', distance: '1.1 km' },
    ],
    retail: [
      { name: 'H-Medix & Gwarinpa Mall Strip', type: 'Supermarket & Pharmacies', distance: '0.5 km' },
      { name: 'Next Cash and Carry', type: 'Wholesale Retail', distance: '4.2 km' },
    ],
    developments: [
      { name: '6th Avenue Serviced Courts', type: 'Serviced Apartments', status: 'Completing 2026', highlight: 'Dedicated generator + solar inverter power and paved cul-de-sacs.' },
    ],
    utilitiesNote: 'Service quality varies by Avenue and inner close; inspect AEDC feeder band and FHA/FCDA title verification.',
    safetyNote: 'Well-policed main avenues with gated residential closes across 3rd, 5th and 6th Avenues.',
  },
  roysambu: {
    countryCode: 'KE',
    city: 'Nairobi',
    neighborhood: 'Roysambu',
    positioning: 'Affordable–mid-market',
    avgPriceUsd: 74000,
    avgRentUsd: 390,
    grossYieldPct: 11.4,
    yoyGrowthPct: 12.6,
    rentalDemand: 'High',
    coordinates: { lat: -1.2186, lng: 36.8869 },
    heroImage: '/images/Property-42d59deaa057e70bb379790361418ee2-128596051.jpg',
    gallery: ['/images/Property-42d59deaa057e70bb379790361418ee2-128596051.jpg', '/images/2ec34ce4ca57aef13fc8b3239a99345e.jpg', '/images/apartment_block_1779978678706.png'],
    propertyTypes: ['Apartments', 'Studios', '1–3 Bedroom Flats'],
    overview: 'High-occupancy residential hub along Nairobi’s Thika Superhighway anchored by TRM (Thika Road Mall), offering fast access to northern commercial corridors and universities.',
    transportSummary: 'Direct exit onto Thika Superhighway (A2), Northern Bypass access to Ruaka/Westlands, and 20 minutes from Nairobi CBD off-peak.',
    corridors: ['Thika Superhighway (A2)', 'Nairobi Northern Bypass', 'Lumumba Drive Hub'],
    schools: [
      { name: 'USIU-Africa', type: 'International University', distance: '1.8 km' },
      { name: 'Kenyatta University (Main Campus)', type: 'Public University', distance: '4.9 km' },
      { name: 'PAC University Roysambu', type: 'Private University', distance: '0.6 km' },
    ],
    healthcare: [
      { name: 'Aga Khan Hospital Outreach Roysambu', type: 'Diagnostic & Clinic', distance: '0.5 km' },
      { name: 'St. Scholastica Uzima Hospital', type: 'Maternity & General Hospital', distance: '2.1 km' },
    ],
    retail: [
      { name: 'Thika Road Mall (TRM)', type: 'Major Shopping & Dining Hub', distance: '0.4 km' },
      { name: 'Garden City Mall', type: 'Regional Mall & Residences', distance: '2.3 km' },
    ],
    developments: [
      { name: 'TRM Vista Smart Apartments', type: 'High-Density Residential', status: 'Selling Off-Plan', highlight: 'Sectional title deeds, borehole water, and student/professional tenant demand.' },
    ],
    utilitiesNote: 'Modern blocks incorporate county borehole backup, solar water heating, and fibre internet.',
    safetyNote: 'Verify building CCTV, controlled biometric lobbies, and internal road lighting around Lumumba Drive vs TRM Drive.',
  },
  kasarani: {
    countryCode: 'KE',
    city: 'Nairobi',
    neighborhood: 'Kasarani',
    positioning: 'Affordable–mid-market',
    avgPriceUsd: 78000,
    avgRentUsd: 410,
    grossYieldPct: 11.7,
    yoyGrowthPct: 13.0,
    rentalDemand: 'High',
    coordinates: { lat: -1.2212, lng: 36.8981 },
    heroImage: '/images/7b00bc20-eba0-9398-25a4-11eb51c86abc.jpg',
    gallery: ['/images/7b00bc20-eba0-9398-25a4-11eb51c86abc.jpg', '/images/apartment_block_1779978678706.png', '/images/house_suburbs_1779978598551.png'],
    propertyTypes: ['Apartments', 'Maisonettes', 'Gated Plots'],
    overview: 'One of Nairobi’s most active apartment and family housing sub-markets surrounding the Moi International Sports Centre, delivering consistent middle-income rental absorption.',
    transportSummary: 'Linked to Thika Superhighway, Outering Road toward JKIA Airport, and Kasarani-Mwiki arterial corridor.',
    corridors: ['Kasarani–Thika Road Link', 'Outering Road Express Link', 'Seasons Estate Loop'],
    schools: [
      { name: 'Kasarani Academy', type: 'Private Primary/High', distance: '1.1 km' },
      { name: 'Safaricom Stadium Youth Sports Academies', type: 'Sports & Athletics', distance: '1.5 km' },
    ],
    healthcare: [
      { name: 'St. Francis Community Hospital Kasarani', type: 'Community Hospital', distance: '1.3 km' },
      { name: 'Nairobi West Outreach Kasarani', type: 'Medical Clinic', distance: '1.8 km' },
    ],
    retail: [
      { name: 'Powerstar & Naivas Kasarani', type: 'Supermarkets', distance: '0.6 km' },
      { name: 'Mountain Mall & Garden City', type: 'Regional Retail', distance: '3.0 km' },
    ],
    developments: [
      { name: 'Seasons Ridge Heights', type: 'Modern Apartment Blocks', status: 'Under Construction', highlight: 'Paved access, borehole storage, and gated basement parking.' },
    ],
    utilitiesNote: 'Borehole and rooftop tank backups mitigate Nairobi municipal water rationing schedules.',
    safetyNote: 'Seasons and Clay City pockets provide calmer, gated street environments compared to denser commercial bus routes.',
  },
  ngara: {
    countryCode: 'KE',
    city: 'Nairobi',
    neighborhood: 'Ngara',
    positioning: 'Mid-market',
    avgPriceUsd: 96000,
    avgRentUsd: 540,
    grossYieldPct: 12.4,
    yoyGrowthPct: 15.1,
    rentalDemand: 'High',
    coordinates: { lat: -1.2735, lng: 36.8277 },
    heroImage: '/images/y6yoxxh75dq751wyygey.avif',
    gallery: ['/images/y6yoxxh75dq751wyygey.avif', '/images/loft_interior_1779978697203.png', '/images/apartment_dining_1779978782850.png'],
    propertyTypes: ['High-Rise Apartments', 'Affordable Housing Units', 'Student Studios'],
    overview: 'Prime central Nairobi transitional district directly bordering the CBD and Parklands, highlighted by landmark government-backed affordable housing developments including the Park Road project.',
    transportSummary: 'Walkable 10-minute access to Nairobi CBD, Murang’a Road, Limuru Road, and Globe Roundabout transit interchange.',
    corridors: ['Park Road Affordable Precinct', 'Murang’a Road Bus Spine', 'Nairobi CBD Walkshed'],
    schools: [
      { name: 'University of Nairobi (Main Campus)', type: 'Flagship National University', distance: '1.5 km' },
      { name: 'Ngara Girls High School & St. Teresa', type: 'Secondary Academies', distance: '0.6 km' },
    ],
    healthcare: [
      { name: 'Aga Khan University Hospital (Parklands)', type: 'Premier Tertiary Hospital', distance: '2.2 km' },
      { name: 'MP Shah Hospital', type: 'Specialist Hospital', distance: '2.4 km' },
    ],
    retail: [
      { name: 'Ngara Market & Sarit Centre Corridor', type: 'Markets & Malls', distance: '1.1 km' },
      { name: 'CBD Financial District Restaurants', type: 'Cafés & Dining', distance: '1.3 km' },
    ],
    developments: [
      { name: 'Park Road Affordable Housing Precinct', type: 'Government-Backed Apartments', status: 'Delivered & Expanding', highlight: 'Solar streetlights, piped gas/water provisions, and high-density urban walkability.' },
    ],
    utilitiesNote: 'CBD trunk power & Nairobi City Water lines supplemented by borehole infrastructure inside Park Road and newer private towers.',
    safetyNote: 'Well-lit main avenues near Park Road and Parklands border; inspect building security and parking allocation.',
  },
  ruiru: {
    countryCode: 'KE',
    city: 'Kiambu',
    neighborhood: 'Ruiru',
    positioning: 'Affordable–mid-market',
    avgPriceUsd: 88000,
    avgRentUsd: 460,
    grossYieldPct: 10.9,
    yoyGrowthPct: 13.8,
    rentalDemand: 'High',
    coordinates: { lat: -1.1489, lng: 36.9606 },
    heroImage: '/images/getlstd-property-photo.jpg',
    gallery: ['/images/getlstd-property-photo.jpg', '/images/modern_house_tan_1779978632706.png', '/images/house_pool_1779978750296.png'],
    propertyTypes: ['Master-Planned Estate Homes', 'Townhouses', 'Apartments'],
    overview: 'Fastest-expanding commuter municipality in the Nairobi Metropolitan Area, anchored by Tatu City SEZ and organized gated developments around Membley and Kamakis.',
    transportSummary: 'Intersects Thika Superhighway (A2) and the Eastern Bypass directly linking to JKIA Airport and Mombasa Road.',
    corridors: ['Eastern Bypass Dual Carriageway', 'Thika Superhighway', 'Ruiru Railway Commuter Line'],
    schools: [
      { name: 'Crawford International School (Tatu City)', type: 'Private International', distance: '4.5 km' },
      { name: 'Zetech University (Ruiru Campus)', type: 'Private University', distance: '1.4 km' },
    ],
    healthcare: [
      { name: 'Ruiru Sub-County Hospital', type: 'Public Hospital', distance: '1.2 km' },
      { name: 'Plainview & RFH Specialist Clinics', type: 'Private Healthcare', distance: '1.9 km' },
    ],
    retail: [
      { name: 'Spur Mall Kimbo & Kamakis Strip', type: 'Shopping & Dining', distance: '1.7 km' },
      { name: 'Two Rivers & Unicity Mall (KU)', type: 'Major Retail Hubs', distance: '7.5 km' },
    ],
    developments: [
      { name: 'Membley & Tatu City Controlled Estates', type: 'Gated Plots & Townhouses', status: 'Active Phases', highlight: 'Tarmac internal roads, underground power cables, and controlled HOA zoning.' },
    ],
    utilitiesNote: 'Master-planned communities (Tatu/Membley) feature independent water treatment and dedicated solar/grid feeders.',
    safetyNote: 'Controlled estate courts feature perimeter walls and 24-hour guard posts; verify freehold title deed searches at Ruiru Lands Registry.',
  },
  adenta: {
    countryCode: 'GH',
    city: 'Accra',
    neighborhood: 'Adenta',
    positioning: 'Affordable–mid-market',
    avgPriceUsd: 112000,
    avgRentUsd: 540,
    grossYieldPct: 10.6,
    yoyGrowthPct: 12.4,
    rentalDemand: 'High',
    coordinates: { lat: 5.7069, lng: -0.1653 },
    heroImage: '/images/50_88d3447798594a3781403aa23f0baf00_t_w_1440_h_900.jpg',
    gallery: ['/images/50_88d3447798594a3781403aa23f0baf00_t_w_1440_h_900.jpg', '/images/house_suburbs_1779978598551.png', '/images/modern_house_tan_1779978632706.png'],
    propertyTypes: ['Detached Houses', 'Gated Townhouses', '2–3 Bed Apartments'],
    overview: 'Growing northeastern Accra suburban district popular with families and salaried commuters seeking modern gated estate houses along the N4 corridor.',
    transportSummary: 'Connected directly via the N4 (Tetteh Quarshie–Madina–Adenta Highway) with quick access to Kotoka Airport within 25–30 minutes.',
    corridors: ['N4 Madina–Adenta Highway', 'Frafraha Bypass', 'Pantang–Abokobi Link'],
    schools: [
      { name: 'De Youngsters & North Legon International Schools', type: 'Basic & High Schools', distance: '2.4 km' },
      { name: 'University of Ghana (Legon)', type: 'Flagship National University', distance: '6.8 km' },
    ],
    healthcare: [
      { name: 'Pantang Municipal & Claron Clinics', type: 'Medical Facilities', distance: '2.9 km' },
      { name: 'University of Ghana Medical Centre (UGMC)', type: 'Quaternary Teaching Hospital', distance: '7.4 km' },
    ],
    retail: [
      { name: 'Adenta SSNIT Market & Melcom Plus', type: 'Grocery & Daily Retail', distance: '1.1 km' },
      { name: 'A&C Mall (East Legon)', type: 'Lifestyle & Dining Mall', distance: '7.9 km' },
    ],
    developments: [
      { name: 'Oyarifa–Adenta Ridge Estates', type: 'Gated Townhouses', status: 'Under Construction', highlight: 'Paved internal estate roads, Ghana Water connection, and inverter pre-wiring.' },
    ],
    utilitiesNote: 'ECG grid reliability improves within new estate transformers; borehole & poly-tank storage recommended across detached plots.',
    safetyNote: 'Planned SSNIT Flats and gated housing courts offer settled neighborhood associations; always conduct Lands Commission title searches.',
  },
  madina: {
    countryCode: 'GH',
    city: 'Accra',
    neighborhood: 'Madina',
    positioning: 'Affordable',
    avgPriceUsd: 84000,
    avgRentUsd: 410,
    grossYieldPct: 11.9,
    yoyGrowthPct: 11.0,
    rentalDemand: 'High',
    coordinates: { lat: 5.6806, lng: -0.1683 },
    heroImage: '/images/12553630.jpg',
    gallery: ['/images/12553630.jpg', '/images/apartment_block_1779978678706.png', '/images/280162474.jpg'],
    propertyTypes: ['Apartments', 'Chamber & Hall Flats', 'Mixed Retail Flats'],
    overview: 'Bustling residential and commercial hub immediately adjacent to the University of Ghana and UPSA campuses, guaranteeing continuous student and trade rental demand.',
    transportSummary: 'Centered around the Madina Market transport terminal on the N4 dual carriageway connecting Legon, Shiashie and Accra Central.',
    corridors: ['N4 Highway Overhead', 'UPSA / IPS Campus Link', 'Atomic–Haatso Road'],
    schools: [
      { name: 'University of Professional Studies (UPSA)', type: 'Public University', distance: '0.9 km' },
      { name: 'University of Ghana, Legon', type: 'National University', distance: '2.6 km' },
      { name: 'Presbyterian Boys’ Secondary (PRESEC)', type: 'Premier High School', distance: '1.8 km' },
    ],
    healthcare: [
      { name: 'Madina Polyclinic (Kekele & Rawlings Circle)', type: 'Municipal Polyclinic', distance: '0.8 km' },
      { name: 'UGMC Teaching Hospital', type: 'Referral Medical Centre', distance: '3.2 km' },
    ],
    retail: [
      { name: 'Madina Central Market & Melcom', type: 'Commercial & Markets', distance: '0.4 km' },
      { name: 'UPSA Boulevard Eateries', type: 'Cafés & Services', distance: '0.9 km' },
    ],
    developments: [
      { name: 'Legon Edge Student Suites', type: 'Purpose-Built Student Housing', status: 'Leasing Now', highlight: 'Solar water pumps, prepaid ECG meters, and study lounges.' },
    ],
    utilitiesNote: 'Poly-tank reserve storage and compact inverter units protect against peak dry-season utility cycles.',
    safetyNote: 'Madina Estates and PRESEC perimeter lanes are quieter than Zongo Junction commercial thoroughfares.',
  },
  kicukiro: {
    countryCode: 'RW',
    city: 'Kigali',
    neighborhood: 'Kicukiro',
    positioning: 'Affordable–mid-market',
    avgPriceUsd: 118000,
    avgRentUsd: 690,
    grossYieldPct: 10.4,
    yoyGrowthPct: 12.9,
    rentalDemand: 'High',
    coordinates: { lat: -1.9866, lng: 30.1041 },
    heroImage: '/images/L_d8d3ea64-9d61-4231-8889-fefbddde1878.jpg',
    gallery: ['/images/L_d8d3ea64-9d61-4231-8889-fefbddde1878.jpg', '/images/modern_house_tan_1779978632706.png', '/images/house_suburbs_1779978598551.png'],
    propertyTypes: ['Family Bungalows', 'Modern Apartments', 'Gated Villas'],
    overview: 'Well-established southern Kigali residential district known for clean tree-lined roads, university presence, and fast accessibility to both Kigali CBD and Kanombe International Airport.',
    transportSummary: 'Served by KK 15 Rd municipal paved arterials and electric/shuttle Tap&Go bus corridors to Nyabugogo and CBD.',
    corridors: ['KK 15 Road Spine', 'Airport Link Corridor', 'Kicukiro Centre Transit Hub'],
    schools: [
      { name: 'Mount Kenya University & IPRC Kigali', type: 'Universities / Polytechnics', distance: '0.9 km' },
      { name: 'Saint Patrick Secondary School', type: 'High School', distance: '0.7 km' },
    ],
    healthcare: [
      { name: 'Masaka District & Kanombe Military Hospital', type: 'Regional Hospitals', distance: '4.2 km' },
      { name: 'Legacy Clinics Kicukiro', type: 'Private Medical Clinic', distance: '1.5 km' },
    ],
    retail: [
      { name: 'Kicukiro Centre & Simba Supermarket', type: 'Shopping & Dining', distance: '0.6 km' },
      { name: 'Sonatubes Commercial Corridor', type: 'Retail & Cafés', distance: '1.9 km' },
    ],
    developments: [
      { name: 'Kicukiro Hillside Terraces', type: 'Family Apartments', status: 'Under Construction', highlight: 'Compliant with City of Kigali 2050 Master Plan and rainwater harvesting.' },
    ],
    utilitiesNote: 'High REG electricity stability, WASAC piped water, and City of Kigali paved stormwater drainage.',
    safetyNote: 'Consistently high personal security and evening street lighting characteristic of Kigali urban sectors.',
  },
  nasr_city: {
    countryCode: 'EG',
    city: 'Cairo',
    neighborhood: 'Nasr City',
    positioning: 'Affordable–mid-market',
    avgPriceUsd: 98000,
    avgRentUsd: 520,
    grossYieldPct: 9.8,
    yoyGrowthPct: 14.0,
    rentalDemand: 'High',
    coordinates: { lat: 30.0511, lng: 31.3656 },
    heroImage: '/images/Property-ea7809975b5ff10a6c6dfa6b98a26492-116572885.jpg',
    gallery: ['/images/Property-ea7809975b5ff10a6c6dfa6b98a26492-116572885.jpg', '/images/apartment_dining_1779978782850.png', '/images/luxury_kitchen_living_1779978720358.png'],
    propertyTypes: ['High-Rise Apartments', 'Duplexes', 'Family Flats'],
    overview: 'Eastern Cairo’s heavyweight residential and commercial hub situated between Heliopolis and New Cairo, pairing Cairo’s competitive Numbeo cost index (15.4) with deep family and student apartment stock.',
    transportSummary: 'Anchored by Cairo Metro Line 3 (Stadium & Fair Zone), Cairo Monorail Eastern corridor, and El Nasr Road toward Cairo International Airport.',
    corridors: ['El Nasr Road Dual Arterial', 'Cairo Metro Line 3 & Monorail', 'Abbas El Akkad & Makram Ebeid'],
    schools: [
      { name: 'Al-Azhar University (Main Campus)', type: 'Public University', distance: '1.8 km' },
      { name: 'Manarat & Saint Fatima Language Schools', type: 'Private & International Schools', distance: '1.2 km' },
    ],
    healthcare: [
      { name: 'Dar El Fouad Hospital (Nasr City)', type: 'Premier Private Hospital', distance: '1.1 km' },
      { name: 'Air Force Specialized Hospital Annex', type: 'Specialist Healthcare', distance: '4.5 km' },
    ],
    retail: [
      { name: 'Citystars Mall Heliopolis/Nasr City', type: 'Super-Regional Mall & Cinema', distance: '1.5 km' },
      { name: 'Genena Mall & Abbas El Akkad Strip', type: 'Retail & Dining', distance: '0.8 km' },
    ],
    developments: [
      { name: 'Nasr Gardens Monorail Residence', type: 'Modern High-Rise', status: 'Finishing Phase', highlight: 'Direct Monorail station access linking central Cairo and New Capital.' },
    ],
    utilitiesNote: 'Natural gas pipelines, fibre-optic telecoms, and municipal water meters standard across registered zones (District 1, District 6, Tenth).',
    safetyNote: 'Busy 24-hour commercial boulevards with concierge buildings; confirm building registration (Shahr El Aqari) at acquisition.',
  },
  hay_hassani: {
    countryCode: 'MA',
    city: 'Casablanca',
    neighborhood: 'Hay Hassani',
    positioning: 'Affordable–mid-market',
    avgPriceUsd: 132000,
    avgRentUsd: 670,
    grossYieldPct: 8.9,
    yoyGrowthPct: 9.6,
    rentalDemand: 'High',
    coordinates: { lat: 33.5579, lng: -7.6746 },
    heroImage: '/images/383842941.jpg',
    gallery: ['/images/383842941.jpg', '/images/apartment_block_1779978678706.png', '/images/loft_interior_1779978697203.png'],
    propertyTypes: ['Apartments', 'Duplex Residences', 'Gated Complexes'],
    overview: 'Established southwestern Casablanca residential community valued by families and Casablanca Finance City professionals for strong value relative to Bourgogne or Anfa.',
    transportSummary: 'Served directly by Casablanca Tramway Line T1, Busway, and fast access to the A1 coastal motorway and Morocco Mall.',
    corridors: ['Casablanca Tramway Line T1', 'Boulevard de l’Aéropostale', 'A1 Autoroute Coastal Link'],
    schools: [
      { name: 'Hassan II University (Faculté El Jadida Road)', type: 'Public University', distance: '2.5 km' },
      { name: 'Groupe Scolaire Al Jabr Extension', type: 'Private Multilingual School', distance: '3.1 km' },
    ],
    healthcare: [
      { name: 'Cheikh Khalifa Bin Zayed International Hospital', type: 'University Teaching Hospital', distance: '2.2 km' },
      { name: 'Clinique Hay Hassani', type: 'Private Surgical Clinic', distance: '0.9 km' },
    ],
    retail: [
      { name: 'Morocco Mall', type: 'Atlantic Coastal Mall', distance: '3.8 km' },
      { name: 'Oulfa & Hay Hassani Boulevards', type: 'Markets, Bakeries & Cafés', distance: '0.5 km' },
    ],
    developments: [
      { name: 'Les Jardins de l’Oulfa & Lissasfa Border', type: 'Gated Condominiums', status: 'Delivered & Resales', highlight: 'Underground parking bays, elevator access, and ANCFCC freehold title deeds.' },
    ],
    utilitiesNote: 'Reliable Lydec electricity/water distribution and widespread Maroc Telecom / Orange fibre.',
    safetyNote: 'Well-lit tram corridors and managed syndic residences around Nassim and Oulfa border.',
  },
  kilamba: {
    countryCode: 'AO',
    city: 'Luanda',
    neighborhood: 'Kilamba',
    positioning: 'Affordable–mid-market',
    avgPriceUsd: 115000,
    avgRentUsd: 640,
    grossYieldPct: 11.2,
    yoyGrowthPct: 10.4,
    rentalDemand: 'High',
    coordinates: { lat: -9.0012, lng: 13.2683 },
    heroImage: '/images/841376502.webp',
    gallery: ['/images/841376502.webp', '/images/apartment_block_1779978678706.png', '/images/house_suburbs_1779978598551.png'],
    propertyTypes: ['Planned Centralidade Apartments', 'T3/T4 Family Flats'],
    overview: 'Luanda’s flagship master-planned residential city (Centralidade do Kilamba) offering organized paved avenues, dedicated schools, green plazas, and reliable apartment infrastructure.',
    transportSummary: 'Connected to southern Luanda and Talatona via Via Expressa Fidel Castro Ruz and dedicated commuter bus services.',
    corridors: ['Via Expressa Highway', 'Kilamba Boulevard Grid', 'Estádio 11 de Novembro Interchange'],
    schools: [
      { name: 'Escolas Primárias e Secundárias do Kilamba (Bloco A–Z)', type: 'Integrated Public Schools', distance: '0.5 km' },
      { name: 'Universidade Óscar Ribas (Talatona Axis)', type: 'University', distance: '8.5 km' },
    ],
    healthcare: [
      { name: 'Hospital Geral do Kilamba Kiaxi', type: 'Public General Hospital', distance: '5.5 km' },
      { name: 'Clínicas Municipais do Kilamba', type: 'Local Health Centers', distance: '0.9 km' },
    ],
    retail: [
      { name: 'Kero Hypermarket Kilamba & Xyami Plaza', type: 'Shopping & Grocery', distance: '1.2 km' },
      { name: 'Centralidade Community Retail Blocks', type: 'Bakeries & Pharmacies', distance: '0.3 km' },
    ],
    developments: [
      { name: 'Kilamba Blocks K–Z & KK 5000 Extension', type: 'T3/T4 Planned Apartments', status: 'Occupied & Upgrading', highlight: 'Pre-planned sewerage, paved boulevards, and integrated school proximity.' },
    ],
    utilitiesNote: 'Evaluate block-by-block building management commission (comissão de moradores), water pumping pressure, and backup generator uptime.',
    safetyNote: 'Planned street layout allows clearer security oversight than informal peripheral zones; verify official title documentation at building level.',
  },
};

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Johannesburg: { lat: -26.2041, lng: 28.0473 },
  Pretoria: { lat: -25.7479, lng: 28.2293 },
  'Cape Town': { lat: -33.9249, lng: 18.4241 },
  Durban: { lat: -29.8587, lng: 31.0218 },
  Gqeberha: { lat: -33.9608, lng: 25.6022 },
  'East London': { lat: -33.0153, lng: 27.9116 },
  Lagos: { lat: 6.5244, lng: 3.3792 },
  Abuja: { lat: 9.0765, lng: 7.3986 },
  'Port Harcourt': { lat: 4.8156, lng: 7.0498 },
  Ibadan: { lat: 7.3775, lng: 3.9470 },
  Enugu: { lat: 6.4584, lng: 7.5464 },
  Nairobi: { lat: -1.2921, lng: 36.8219 },
  Kiambu: { lat: -1.1714, lng: 36.8356 },
  Mombasa: { lat: -4.0435, lng: 39.6682 },
  Kisumu: { lat: -0.0917, lng: 34.7680 },
  Nakuru: { lat: -0.3031, lng: 36.0800 },
  Accra: { lat: 5.6037, lng: -0.1870 },
  Tema: { lat: 5.6698, lng: -0.0166 },
  Kumasi: { lat: 6.6885, lng: -1.6244 },
  Takoradi: { lat: 4.8845, lng: -1.7554 },
  Kigali: { lat: -1.9441, lng: 30.0619 },
  Musanze: { lat: -1.4998, lng: 29.6349 },
  Rubavu: { lat: -1.6761, lng: 29.2610 },
  Cairo: { lat: 30.0444, lng: 31.2357 },
  Giza: { lat: 30.0131, lng: 31.2089 },
  Alexandria: { lat: 31.2001, lng: 29.9187 },
  'New Cairo': { lat: 30.0074, lng: 31.4913 },
  Casablanca: { lat: 33.5731, lng: -7.5898 },
  Rabat: { lat: 34.0209, lng: -6.8416 },
  Marrakech: { lat: 31.6295, lng: -7.9811 },
  Tangier: { lat: 35.7595, lng: -5.8340 },
  Agadir: { lat: 30.4278, lng: -9.5981 },
  Luanda: { lat: -8.8383, lng: 13.2344 },
  Benguela: { lat: -12.5763, lng: 13.4055 },
  Huambo: { lat: -12.7761, lng: 15.7392 },
  Lubango: { lat: -14.9172, lng: 13.4925 },
  Cabinda: { lat: -5.5500, lng: 12.2000 },
};

const TIER_BASE_PRICE: Record<MarketPositioningTier, { price: number; rent: number; yieldPct: number; affordScore: number }> = {
  Affordable: { price: 76000, rent: 380, yieldPct: 11.4, affordScore: 9 },
  'Affordable–mid-market': { price: 122000, rent: 640, yieldPct: 10.6, affordScore: 7 },
  'Mid-market': { price: 215000, rent: 1180, yieldPct: 9.8, affordScore: 6 },
  'Mid-market–premium': { price: 365000, rent: 1980, yieldPct: 9.2, affordScore: 4 },
  Premium: { price: 640000, rent: 3300, yieldPct: 8.6, affordScore: 3 },
};

const COUNTRY_IMAGES: Record<CountryCode, string[]> = {
  ZA: ['/images/house_suburbs_1779978598551.png', '/images/Property-1b0835e9d2737f661ff88feb4dfa6cdf-128596052.jpg', '/images/house_pool_1779978750296.png'],
  NG: ['/images/harbour_house_1779978766107.png', '/images/coastal_mansion_1779978805301.png', '/images/apartment_dining_1779978782850.png'],
  KE: ['/images/Property-42d59deaa057e70bb379790361418ee2-128596051.jpg', '/images/2ec34ce4ca57aef13fc8b3239a99345e.jpg', '/images/y6yoxxh75dq751wyygey.avif'],
  GH: ['/images/50_88d3447798594a3781403aa23f0baf00_t_w_1440_h_900.jpg', '/images/12553630.jpg', '/images/modern_house_tan_1779978632706.png'],
  RW: ['/images/L_d8d3ea64-9d61-4231-8889-fefbddde1878.jpg', '/images/getlstd-property-photo.jpg', '/images/house_suburbs_1779978598551.png'],
  EG: ['/images/Property-ea7809975b5ff10a6c6dfa6b98a26492-116572885.jpg', '/images/luxury_kitchen_living_1779978720358.png', '/images/loft_interior_1779978697203.png'],
  MA: ['/images/383842941.jpg', '/images/apartment_block_1779978678706.png', '/images/interior_beanbags_1779978650034.png'],
  AO: ['/images/841376502.webp', '/images/7b00bc20-eba0-9398-25a4-11eb51c86abc.jpg', '/images/Ensure960x540.jpg'],
};

function normalizeKey(str: string): string {
  return str.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/**
 * Generates or retrieves a complete 15-section structured Neighbourhood Intelligence Profile
 * for any requested neighbourhood name, city, or existing NeighborhoodGuide ID.
 */
export function getStructuredNeighborhoodProfile(
  queryNameOrId: string,
  hintCity?: string,
  hintCountryCode?: CountryCode
): StructuredNeighborhoodProfile {
  const normalizedQuery = normalizeKey(queryNameOrId);

  // 1. Check if it matches one of the 4 existing legacy guides in constants.ts
  const legacyMatch: NeighborhoodGuide | undefined = NEIGHBORHOOD_GUIDES.find(
    (g) => normalizeKey(g.id) === normalizedQuery || normalizeKey(g.name) === normalizedQuery
  );

  // 2. Check curated seed configs (first check exact seed key, or by neighborhood token)
  const directSeedKey = Object.keys(curatedSeeds).find(
    (k) => normalizeKey(k) === normalizedQuery || normalizeKey(curatedSeeds[k].neighborhood) === normalizedQuery
  );
  const seed = directSeedKey ? curatedSeeds[directSeedKey] : undefined;

  // 3. Locate country & city context in COUNTRY_MARKET_GUIDES
  let matchedCountry: CountryMarketGuide | undefined = hintCountryCode
    ? COUNTRY_MARKET_GUIDES.find((c) => c.code === hintCountryCode)
    : undefined;
  let matchedRow: CityMarketRow | undefined;
  let resolvedNeighborhoodName = queryNameOrId;

  for (const country of COUNTRY_MARKET_GUIDES) {
    if (matchedCountry && country.code !== matchedCountry.code) continue;
    for (const row of country.cities) {
      if (hintCity && row.city.toLowerCase() !== hintCity.toLowerCase()) continue;
      const foundArea = row.neighborhoods.find(
        (n) => normalizeKey(n) === normalizedQuery || n.toLowerCase().includes(queryNameOrId.toLowerCase())
      );
      if (foundArea) {
        matchedCountry = country;
        matchedRow = row;
        resolvedNeighborhoodName = foundArea;
        break;
      }
    }
    if (matchedRow) break;
  }

  // Second pass without hintCity if nothing found
  if (!matchedRow) {
    for (const country of COUNTRY_MARKET_GUIDES) {
      for (const row of country.cities) {
        const foundArea = row.neighborhoods.find(
          (n) =>
            normalizeKey(n) === normalizedQuery ||
            normalizeKey(n).includes(normalizedQuery) ||
            normalizedQuery.includes(normalizeKey(n))
        );
        if (foundArea) {
          matchedCountry = country;
          matchedRow = row;
          resolvedNeighborhoodName = foundArea;
          break;
        }
      }
      if (matchedRow) break;
    }
  }

  // Fallback for legacy guides not inside table (e.g. Stellenbosch, Durbanville, Suburbia Green Valley, Soweto)
  if (!matchedCountry && legacyMatch) {
    matchedCountry = COUNTRY_MARKET_GUIDES[0]; // ZA
  }

  const finalCountry = matchedCountry || COUNTRY_MARKET_GUIDES[0];
  const finalCity =
    seed?.city ||
    matchedRow?.city ||
    hintCity ||
    (legacyMatch?.id === 'stellenbosch_winelands'
      ? 'Stellenbosch'
      : legacyMatch?.id === 'Durbanville_arts_district'
      ? 'Cape Town'
      : legacyMatch?.id === 'soweto_cultural_hub'
      ? 'Johannesburg'
      : 'Johannesburg');

  const finalNeighborhood = seed?.neighborhood || (legacyMatch ? legacyMatch.name : resolvedNeighborhoodName);
  const positioning: MarketPositioningTier =
    seed?.positioning ||
    matchedRow?.positioning ||
    (legacyMatch?.scores.affordability && legacyMatch.scores.affordability <= 4
      ? 'Premium'
      : 'Affordable–mid-market');

  const tierMetrics = TIER_BASE_PRICE[positioning];
  const basePrice = seed?.avgPriceUsd || (legacyMatch?.marketTrends?.[3]?.avgSalePrice ?? tierMetrics.price);
  const baseRent = seed?.avgRentUsd || (legacyMatch?.marketTrends?.[3]?.avgRent ?? tierMetrics.rent);
  const grossYield = seed?.grossYieldPct || tierMetrics.yieldPct;
  const yoyGrowth = seed?.yoyGrowthPct || Number((8.5 + (finalNeighborhood.length % 6) * 0.9).toFixed(1));

  const coordsBase = seed?.coordinates || legacyMatch?.coordinates || CITY_COORDS[finalCity] || { lat: -26.2041, lng: 28.0473 };
  // Slight deterministic micro-offset per neighbourhood so map pins don't stack identically on city center
  const latOffset = !seed && !legacyMatch ? ((normalizedQuery.length % 7) - 3) * 0.011 : 0;
  const lngOffset = !seed && !legacyMatch ? ((normalizedQuery.charCodeAt(0) % 7) - 3) * 0.011 : 0;
  const coords = {
    lat: Number((coordsBase.lat + latOffset).toFixed(4)),
    lng: Number((coordsBase.lng + lngOffset).toFixed(4)),
  };

  const countryImgs = COUNTRY_IMAGES[finalCountry.code];
  const heroImage = seed?.heroImage || legacyMatch?.image || countryImgs[normalizedQuery.length % countryImgs.length];
  const gallery = seed?.gallery || legacyMatch?.gallery || countryImgs;

  const isTopRec = finalCountry.topRecommendations.find(
    (r) => normalizeKey(r.area) === normalizeKey(finalNeighborhood)
  );
  const isLaunchPriority = finalCountry.launchPriorityAreas.some(
    (a) => normalizeKey(a) === normalizeKey(finalNeighborhood)
  );

  const avgSqmSize = positioning === 'Affordable' ? 68 : positioning === 'Affordable–mid-market' ? 95 : 145;
  const pricePerSqmUsd = Math.round(basePrice / avgSqmSize);

  const trends =
    legacyMatch?.marketTrends?.map((m) => ({
      month: m.month,
      avgRentUsd: m.avgRent,
      avgSaleUsd: m.avgSalePrice,
    })) || [
      { month: 'Jan', avgRentUsd: Math.round(baseRent * 0.94), avgSaleUsd: Math.round(basePrice * 0.94) },
      { month: 'Feb', avgRentUsd: Math.round(baseRent * 0.96), avgSaleUsd: Math.round(basePrice * 0.96) },
      { month: 'Mar', avgRentUsd: Math.round(baseRent * 0.98), avgSaleUsd: Math.round(basePrice * 0.98) },
      { month: 'Apr', avgRentUsd: baseRent, avgSaleUsd: basePrice },
    ];

  const scores = seed?.scores || (legacyMatch
    ? { ...legacyMatch.scores, connectivity: 9 }
    : {
        safety: positioning === 'Premium' ? 9 : positioning === 'Mid-market' ? 8 : 7,
        schools: positioning === 'Affordable' ? 7 : 8,
        affordability: tierMetrics.affordScore,
        familyFriendly: 8,
        nightlife: 7,
        connectivity: finalCountry.code === 'KE' || finalCountry.code === 'ZA' || finalCountry.code === 'RW' ? 9 : 8,
      });

  const schools = seed?.schools || (legacyMatch
    ? [
        { name: `${finalCity} International Academy`, type: 'K-12 Academy', distance: '1.8 km' },
        { name: `${finalNeighborhood} Community Secondary`, type: 'Secondary School', distance: '0.9 km' },
        { name: `${finalCity} Polytechnic / University Annex`, type: 'Higher Education', distance: '4.2 km' },
      ]
    : [
        { name: `${finalNeighborhood} Central Academy`, type: 'Primary & High School', distance: '1.1 km' },
        { name: `${finalCity} Bilingual & International School`, type: 'International K-12', distance: '2.6 km' },
        { name: `${finalCity} National University Campus`, type: 'University / College', distance: '5.1 km' },
      ]);

  const hospitals = seed?.healthcare || [
    { name: `${finalCity} Regional Medical Centre`, type: 'Multi-Specialty Hospital', distance: '2.4 km' },
    { name: `${finalNeighborhood} Community Clinic & Pharmacy`, type: 'Outpatient & Urgent Care', distance: '0.8 km' },
  ];

  const retail = seed?.retail
    ? seed.retail.map((r) => ({
        name: r.name,
        category: r.type,
        distance: r.distance,
      }))
    : (legacyMatch?.profile.localBusinesses
    ? legacyMatch.profile.localBusinesses.map((b, i) => ({
        name: b,
        category: i % 2 === 0 ? 'Retail & Lifestyle' : 'Dining & Culture',
        distance: `${(0.5 + i * 0.7).toFixed(1)} km`,
      }))
    : [
        { name: `${finalNeighborhood} Central Plaza & Market`, category: 'Supermarkets & Retail', distance: '0.7 km' },
        { name: `${finalCity} Boulevard Cafés & Dining`, category: 'Restaurants & Cafés', distance: '1.6 km' },
      ]);

  const developments = seed?.developments || [
    {
      name: `${finalNeighborhood} Modern Terraces & Apartments`,
      type: `${positioning} Residential`,
      status: 'Active Delivery 2026',
      highlight: `Solar-ready utility design and dedicated parking tailored for ${finalCity} commuters.`,
    },
    {
      name: `${finalCity} Urban Infill Residences`,
      type: 'Sectional Title / Apartments',
      status: 'Planning & Off-Plan',
      highlight: `Paved estate access and water storage integrated with local municipal lines.`,
    },
  ];

  const transportSummary =
    seed?.transportSummary ||
    legacyMatch?.profile.publicTransport ||
    `Direct arterial road connectivity linking ${finalNeighborhood} to ${finalCity} CBD, major employment hubs, and intercity transit terminals.`;

  const overviewText =
    seed?.overview ||
    legacyMatch?.description ||
    `${finalNeighborhood} is a key ${positioning.toLowerCase()} residential market within ${finalCity}, ${finalCountry.name}, offering practical access to urban employment nodes, local retail amenities, and steady tenant absorption.`;

  const caveatText =
    finalCountry.importantNote ||
    finalCountry.highlightNote ||
    'Boundary characteristics, road paving, utility stability, and estate covenants vary by street; validate with local title registries and recent closed listings before pricing commitments.';

  return {
    id: normalizedQuery,
    countryCode: finalCountry.code,
    country: finalCountry.name,
    region: finalCountry.region,
    city: finalCity,
    neighborhood: finalNeighborhood,
    propertyMarket: positioning,
    propertyTypes: seed?.propertyTypes || ['Apartments', 'Houses', 'Townhouses'],
    rentalDemand: seed?.rentalDemand || (isLaunchPriority || positioning.includes('Affordable') ? 'High' : 'Medium'),
    developmentActivity: developments[0].name + ' (' + developments[0].status + ')',
    isLaunchPriority,
    isTopRecommendation: Boolean(isTopRec),
    recommendationNote: isTopRec?.summary,
    heroImage,
    gallery,
    coordinates: coords,
    overview: overviewText,
    rentalRangesUsd: {
      studioOrOneBed: `$${Math.round(baseRent * 0.65).toLocaleString()} – $${Math.round(baseRent * 0.85).toLocaleString()}/mo`,
      twoBed: `$${Math.round(baseRent * 0.9).toLocaleString()} – $${Math.round(baseRent * 1.15).toLocaleString()}/mo`,
      threeBedPlus: `$${Math.round(baseRent * 1.25).toLocaleString()} – $${Math.round(baseRent * 1.65).toLocaleString()}/mo`,
      avgMonthlyUsd: baseRent,
    },
    purchaseMetricsUsd: {
      avgAskingUsd: basePrice,
      entryRangeUsd: `$${Math.round(basePrice * 0.72).toLocaleString()}`,
      upperRangeUsd: `$${Math.round(basePrice * 1.38).toLocaleString()}`,
      pricePerSqmUsd,
    },
    priceTrends: trends,
    yoyGrowthPct: yoyGrowth,
    yieldEstimates: {
      grossYieldPct: grossYield,
      netYieldRange: `${(grossYield - 1.8).toFixed(1)}% – ${(grossYield - 0.6).toFixed(1)}% net`,
      occupancyEstimate: positioning.includes('Affordable') ? '91% – 95% annual occupancy' : '86% – 92% annual occupancy',
      yieldCommentary: `Indicative gross yields around ${grossYield.toFixed(1)}% driven by sustained ${finalCity} commuter and family lease demand.`,
    },
    schoolsAndUniversities: schools,
    hospitalsAndHealthcare: hospitals,
    transportAndAccessibility: {
      summary: transportSummary,
      corridors: seed?.corridors || [`${finalCity} CBD Arterial`, `${finalNeighborhood} Transit Hub`, 'Regional Airport Link'],
      commutes: [
        { label: `${finalCity} Central Business District`, driveMin: 18, transitMin: 28, bikeMin: 44 },
        { label: `Primary Commercial & Industrial Hub`, driveMin: 12, transitMin: 19, bikeMin: 29 },
        { label: `International Airport Terminal`, driveMin: 29, transitMin: 46, bikeMin: 78 },
      ],
      walkabilityNote: legacyMatch?.accessibility?.bikePaths || `Active neighborhood pedestrian arteries connecting local markets, schools, and transit stops.`,
    },
    restaurantsAndShopping: retail,
    safetyAndEnvironment: {
      score: scores.safety,
      summary: seed?.safetyNote || `Indicative safety index ${scores.safety}/10 across established residential courts; verify street lighting, HOA patrols, and perimeter gates locally.`,
      infrastructureCaveat: caveatText,
      utilitiesNote: seed?.utilitiesNote || 'Confirm municipal electricity feeder band, backup solar/inverter readiness, and borehole/reservoir water autonomy per development.',
    },
    newDevelopments: developments,
    aiBaselineInsight: {
      headline: `${finalNeighborhood} Positioning Brief — ${finalCity}, ${finalCountry.name}`,
      buyerFit: `Suited for ${positioning.toLowerCase()} owner-occupiers and long-term residential landlords prioritizing ${finalCity} workforce connectivity.`,
      investorThesis: `Estimated ${grossYield.toFixed(1)}% gross rental yield with +${yoyGrowth.toFixed(1)}% 12-month directional valuation velocity; verify actual estate comparables and FX lease indexing.`,
      dueDiligenceChecklist: [
        `Conduct official land registry / title deed verification in ${finalCountry.name} before deposit release.`,
        `Inspect street-level water pressure, backup power/solar installation, and flood drainage during site visit.`,
        `Benchmark service charges, HOA levies, and comparable closed leases in ${finalNeighborhood}.`,
      ],
    },
    scores,
    virtualTourUrl: legacyMatch?.virtualTourUrl || 'https://www.youtube.com/embed/0uY8_ALH5Vw?rel=0',
    events: legacyMatch?.events || [
      {
        name: `${finalNeighborhood} Community & Market Day`,
        date: 'Weekly · Saturdays',
        description: 'Local produce vendors, artisans, and neighborhood homeowners association updates.',
      },
    ],
    reviews: legacyMatch?.reviews || [
      {
        author: 'Local Resident Panel',
        quote: `${finalNeighborhood} strikes a practical balance between daily commute convenience in ${finalCity} and long-term residential community stability.`,
      },
    ],
    linkedGuideId: legacyMatch?.id,
  };
}
