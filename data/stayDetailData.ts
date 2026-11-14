export type UserIntentType = 'Traveler' | 'Business Traveler' | 'Family Traveler' | 'Investor' | 'Property Professional';
export type StayTermMode = 'short-term' | 'long-term';
export type MapModeType = 'Standard' | 'Satellite' | 'Nearby' | 'Transport' | 'Attractions' | 'Restaurants' | 'Investment';

export interface StayPropertyProfile {
  id: string;
  name: string;
  subtitle: string;
  country: string;
  province: string;
  city: string;
  suburb: string;
  category: string;
  propertyType: 'Hotel' | 'Resort' | 'Villa' | 'Serviced Apartment' | 'Safari Lodge';
  starRating: number;
  score: number;
  scoreLabel: string;
  reviewCount: number;
  nightlyFromZar: number;
  monthlyFromZar: number;
  locationLabel: string;
  heroImages: {
    url: string;
    category: 'Rooms' | 'Suites' | 'Pool' | 'Dining' | 'Spa' | 'Exterior' | 'Views' | 'Amenities';
    caption: string;
    specs: string;
    aiTags: string[];
  }[];
  overviewShort: string;
  overviewExtended: string;
  investmentEligible: boolean;
  investmentData?: {
    estimatedValue: string;
    annualRevenue: string;
    averageOccupancy: string;
    grossYield: string;
    marketGrowth: string;
    demand: string;
    risk: string;
    growth: string;
    liquidity: string;
    aiSummary: string;
  };
  specs: {
    rooms: number;
    floors: number;
    opened: number;
    lastRenovated: number;
    languages: string;
    checkIn: string;
    checkOut: string;
  };
  sustainabilityScore: number;
  certifications: string[];
}

export interface RatePlanOption {
  id: string;
  name: 'Flexible' | 'Non-refundable' | 'Breakfast Included' | 'Long-Term Corporate Monthly';
  nightlyZar: number;
  monthlyZar: number;
  perks: string[];
  excluded?: string;
  badgeText?: string;
}

export interface RoomCatalogItem {
  id: string;
  name: string;
  category: 'Rooms' | 'Suites' | 'Villas' | 'Entire Residence';
  sizeSqm: number;
  viewLabel: string;
  bedConfig: string;
  sleeps: number;
  leftCount: number;
  image: string;
  features: string[];
  cancellationSummary: string;
  cancellationCutoff: string;
  afterCutoffRule: string;
  ratePlans: RatePlanOption[];
}

export interface VerifiedGuestReview {
  id: string;
  guestName: string;
  country: string;
  rating: number;
  stayedNights: number;
  travelType: 'Couples' | 'Families' | 'Business' | 'Solo' | 'Friends';
  roomName: string;
  date: string;
  quote: string;
  helpfulCount: number;
}

export const FLAGSHIP_AFRICAN_GRAND_HOTEL: StayPropertyProfile = {
  id: 'african-grand-hotel',
  name: 'The African Grand Hotel',
  subtitle: 'Luxury Hotel',
  country: 'South Africa',
  province: 'Western Cape',
  city: 'Cape Town',
  suburb: 'Camps Bay',
  category: 'Hotels',
  propertyType: 'Hotel',
  starRating: 5,
  score: 9.4,
  scoreLabel: 'Exceptional',
  reviewCount: 1284,
  nightlyFromZar: 2450,
  monthlyFromZar: 48500,
  locationLabel: 'Camps Bay, Cape Town, South Africa',
  heroImages: [
    {
      url: '/images/bQpZBCFZhwE8O_cs7mNAwkaUM8W3jpm_4o1EJoHW6CGw7RXnjNWQ4gX3DfiZQ6GxCxJqkk20Qg5bXqnlWqaI92-MaZ8a8Xmce7-Cu87PNH1kCvSJ58uf9qG4HPAkgSNvwht2w7D-62vuOPfMKOF4mrLv86eLr0x1s2VjH82vOpSiRnY3HbLAXkL6ghFJL81S.jpg',
      category: 'Exterior',
      caption: 'Atlantic Seaboard Coastal Facade & Infinity Terrace',
      specs: 'Camps Bay Flagship · 4K Architectural',
      aiTags: ['Exterior', 'Ocean view', 'Pool'],
    },
    {
      url: '/images/ciGI9jt_sGVPxiolPnhsy4lAgRDH_3j8eZMJxZIm97d_f65lcSHw26Eo1j98ieeBwr8GwTqFdYVrQxmycHYskbBo00ycrJusnkMalqSQ6xAVOdjkMa2TbZEkfwgILcYox9fLkhguJe46qif3N1OguJwZXehGdCmtWgd4E974iGSybhRE-PvS7RwPu3YvkhSr.jpg',
      category: 'Suites',
      caption: 'Private Villa & Garden Sanctuary Wing',
      specs: '42 m² · King bed · Ocean view',
      aiTags: ['Bedroom', 'Ocean view'],
    },
    {
      url: '/images/coastal_mansion_1779978805301.png',
      category: 'Exterior',
      caption: 'Grand Coastal Sanctuary Pavilion',
      specs: 'Camps Bay Wing · Panoramic Sea Views',
      aiTags: ['Exterior', 'Ocean view'],
    },
    {
      url: '/images/loft_interior_1779978697203.png',
      category: 'Suites',
      caption: 'Deluxe Ocean View Suite',
      specs: '42 m² · King bed · Ocean view',
      aiTags: ['Bedroom', 'Ocean view'],
    },
    {
      url: '/images/house_pool_1779978750296.png',
      category: 'Pool',
      caption: 'Heated Saltwater Infinity Pool Deck',
      specs: '28m Lap Deck · Sunset Panorama',
      aiTags: ['Pool', 'Ocean view'],
    },
    {
      url: '/images/apartment_dining_1779978782850.png',
      category: 'Dining',
      caption: 'Ubuntu Restaurant & Ocean Terrace Dining',
      specs: '94 Seats · Breakfast, Lunch & Dinner',
      aiTags: ['Restaurant', 'Ocean view'],
    },
    {
      url: '/images/spa_wellness_1779978823248.png',
      category: 'Spa',
      caption: 'Sanctuary Mineral Spa & Hydrotherapy Suite',
      specs: 'Thermal Circuit · Private Suites',
      aiTags: ['Bathroom', 'Spa'],
    },
    {
      url: '/images/luxury_kitchen_living_1779978720358.png',
      category: 'Rooms',
      caption: 'Executive Long-Stay Ocean Residence Lounge',
      specs: '76 m² · Workspace & Kitchen',
      aiTags: ['Bedroom', 'Dining'],
    },
    {
      url: '/images/harbour_house_1779978766107.png',
      category: 'Views',
      caption: 'Twelve Apostles & Atlantic Sunset Balcony',
      specs: 'Private Wraparound Terrace',
      aiTags: ['Ocean view', 'Exterior'],
    },
    {
      url: '/images/841376502.webp',
      category: 'Amenities',
      caption: 'Private Courtyard Lounge & Concierge Atrium',
      specs: '24/7 Reception · Valet Arrival',
      aiTags: ['Exterior', 'Amenities'],
    },
    {
      url: '/images/3zn_EkVTc6_QyptGfC9riJuiVbXsOnZlnNvKdCvSkQrpuj4PhovEAaX72CuasaF61v6l4JVHJ6h5Rvn9POlvySiLgZxfK2CHe4z1WawKYa34Mjcj8httsWa0IVJCbpgrtIwuSqzVbR17aorv96Z6D1STZYGR0kqvwSnX81F5nEFKbVo8-Qb01CM5FKe8oAD4.jpg',
      category: 'Suites',
      caption: 'Signature Short-Stay Luxury Suite',
      specs: 'Curated Interiors · Instant Book',
      aiTags: ['Bedroom', 'Amenities'],
    },
    {
      url: '/images/S5AW63xLpS5OInt3q7b2VfysVJZWUgL_mA50RmD3XPIDOg6FweUaBTyD2D55tZpB00mFfWJpOaM7y51sawZ95XIy0eckan_AR9cwNRlzXYNo8omw6E0jLV0-YEdLcA237iyhzwWVPPfb99eJb5FOkA-h5zNJ3Q4YSw2vtWqoUZNhTJV3_qUS2aKUV1ys1UEF.jpg',
      category: 'Rooms',
      caption: 'Refined Executive Short-Stay Residence',
      specs: 'Private Terrace · High-Speed Fibre',
      aiTags: ['Bedroom', 'Exterior'],
    },
    {
      url: '/images/executive_sedan_fleet.jpg',
      category: 'Amenities',
      caption: 'VIP Executive Sedan & Airport Chauffeur Fleet',
      specs: 'On-Demand Guest Transfers',
      aiTags: ['Amenities'],
    },
  ],
  overviewShort:
    'Discover an elegant coastal retreat overlooking the Atlantic Ocean, combining contemporary African design, premium hospitality and direct access to Cape Town’s most iconic destinations.',
  overviewExtended:
    'Designed for both short-term executive and leisure stays as well as extended monthly residencies, The African Grand Hotel pairs soundproofed architectural suites with fibre-backed workspaces, solar-assisted microgrid resilience, Ubuntu signature dining, and direct private access to Camps Bay’s beachfront promenade.',
  investmentEligible: true,
  investmentData: {
    estimatedValue: 'R48.5M',
    annualRevenue: 'R9.2M',
    averageOccupancy: '78%',
    grossYield: '8.7%',
    marketGrowth: '+11.4%',
    demand: 'High',
    risk: 'Moderate',
    growth: 'Strong',
    liquidity: 'Medium',
    aiSummary:
      'This property is located in a high-demand Atlantic Seaboard tourism and corporate executive corridor with consistent dual-season occupancy and strong foreign-currency ADR resilience.',
  },
  specs: {
    rooms: 142,
    floors: 8,
    opened: 2019,
    lastRenovated: 2025,
    languages: 'English · Portuguese · French',
    checkIn: '14:00',
    checkOut: '11:00',
  },
  sustainabilityScore: 87,
  certifications: ['EDGE Certified', 'Green Star'],
};

export const STAY_CATALOG_PROPERTIES: StayPropertyProfile[] = [
  FLAGSHIP_AFRICAN_GRAND_HOTEL,
  {
    id: 'kigali-horizon-residences',
    name: 'Nyarutarama Ridge Serviced Residences',
    subtitle: 'Long-Term & Boutique Apartment Hotel',
    country: 'Rwanda',
    province: 'Kigali City',
    city: 'Kigali',
    suburb: 'Nyarutarama',
    category: 'Serviced Apartments',
    propertyType: 'Serviced Apartment',
    starRating: 5,
    score: 9.3,
    scoreLabel: 'Superb',
    reviewCount: 418,
    nightlyFromZar: 1850,
    monthlyFromZar: 34200,
    locationLabel: 'Nyarutarama, Kigali, Rwanda',
    heroImages: [
      {
        url: '/images/ciGI9jt_sGVPxiolPnhsy4lAgRDH_3j8eZMJxZIm97d_f65lcSHw26Eo1j98ieeBwr8GwTqFdYVrQxmycHYskbBo00ycrJusnkMalqSQ6xAVOdjkMa2TbZEkfwgILcYox9fLkhguJe46qif3N1OguJwZXehGdCmtWgd4E974iGSybhRE-PvS7RwPu3YvkhSr.jpg',
        category: 'Exterior',
        caption: 'Nyarutarama Ridge Hillside Architectural Sanctuary',
        specs: '92 m² · Full Kitchen · Golf Valley View',
        aiTags: ['Exterior', 'Garden'],
      },
      {
        url: '/images/bQpZBCFZhwE8O_cs7mNAwkaUM8W3jpm_4o1EJoHW6CGw7RXnjNWQ4gX3DfiZQ6GxCxJqkk20Qg5bXqnlWqaI92-MaZ8a8Xmce7-Cu87PNH1kCvSJ58uf9qG4HPAkgSNvwht2w7D-62vuOPfMKOF4mrLv86eLr0x1s2VjH82vOpSiRnY3HbLAXkL6ghFJL81S.jpg',
        category: 'Suites',
        caption: 'Two-Bedroom Executive Extended Stay Residence',
        specs: 'Private Terrace · 24h Diplomatic Concierge',
        aiTags: ['Living', 'Kitchen'],
      },
      {
        url: '/images/luxury_kitchen_living_1779978720358.png',
        category: 'Rooms',
        caption: 'Open-Plan Executive Lounge & Kitchen',
        specs: '92 m² · Designer Appliances',
        aiTags: ['Living', 'Kitchen'],
      },
      {
        url: '/images/modern_house_tan_1779978632706.png',
        category: 'Exterior',
        caption: 'Terraced Hillside Architecture',
        specs: 'Private Gated Compound',
        aiTags: ['Exterior', 'Garden'],
      },
      {
        url: '/images/house_pool_1779978750296.png',
        category: 'Pool',
        caption: 'Heated Courtyard Pool',
        specs: 'Year-Round Solar Heated',
        aiTags: ['Pool', 'Exterior'],
      },
      {
        url: '/images/loft_interior_1779978697203.png',
        category: 'Rooms',
        caption: 'Primary King Workspace Suite',
        specs: 'Fibre 300Mbps · Ergonomic Desk',
        aiTags: ['Bedroom', 'Workspace'],
      },
      {
        url: '/images/spa_wellness_1779978823248.png',
        category: 'Spa',
        caption: 'Private Wellness Studio',
        specs: 'Sauna & Recovery Room',
        aiTags: ['Spa', 'Bathroom'],
      },
    ],
    overviewShort:
      'Purpose-built for diplomatic teams, founders, and extended stays in Kigali’s greenest hillside enclave with full kitchen suites and 24-hour concierge.',
    overviewExtended:
      'Minutes from Kigali Convention Centre and international embassies, Nyarutarama Ridge pairs hotel-grade housekeeping and backup power with flexible 7-night to 12-month corporate residency leases.',
    investmentEligible: true,
    investmentData: {
      estimatedValue: 'R28.4M',
      annualRevenue: 'R5.8M',
      averageOccupancy: '84%',
      grossYield: '9.4%',
      marketGrowth: '+12.8%',
      demand: 'High',
      risk: 'Low–Moderate',
      growth: 'Strong',
      liquidity: 'Medium',
      aiSummary:
        'Anchored by year-round diplomatic and conference demand, Kigali serviced apartments outperform seasonal leisure stock in occupancy stability.',
    },
    specs: {
      rooms: 48,
      floors: 4,
      opened: 2022,
      lastRenovated: 2025,
      languages: 'English · French · Kinyarwanda',
      checkIn: '14:00',
      checkOut: '11:00',
    },
    sustainabilityScore: 91,
    certifications: ['EDGE Certified'],
  },
  {
    id: 'serengeti-sanctuary-lodge',
    name: 'Serengeti Horizon Luxury Lodge',
    subtitle: 'All-Suite Safari Resort',
    country: 'Tanzania',
    province: 'Arusha Region',
    city: 'Arusha & Serengeti',
    suburb: 'Seronera Corridor',
    category: 'Resorts',
    propertyType: 'Safari Lodge',
    starRating: 5,
    score: 9.6,
    scoreLabel: 'Exceptional',
    reviewCount: 612,
    nightlyFromZar: 4950,
    monthlyFromZar: 98000,
    locationLabel: 'Serengeti Reserve Border, Tanzania',
    heroImages: [
      {
        url: '/images/safari_lodge_retreat.jpg',
        category: 'Exterior',
        caption: 'Savannah Overlook Main Pavilion',
        specs: 'Elevated Timber Deck · Off-Grid Solar',
        aiTags: ['Exterior', 'Views'],
      },
      {
        url: '/images/loft_interior_1779978697203.png',
        category: 'Suites',
        caption: 'Savannah Panorama Tented Suite',
        specs: '68 m² · King Canopy · Private Plunge',
        aiTags: ['Bedroom', 'Views'],
      },
      {
        url: '/images/house_pool_1779978750296.png',
        category: 'Pool',
        caption: 'Horizon Rim Pool',
        specs: 'Heated Natural Mineral Water',
        aiTags: ['Pool', 'Exterior'],
      },
      {
        url: '/images/apartment_dining_1779978782850.png',
        category: 'Dining',
        caption: 'Boma Terrace Fine Dining',
        specs: 'Farm-to-Table East African Menu',
        aiTags: ['Restaurant'],
      },
      {
        url: '/images/spa_wellness_1779978823248.png',
        category: 'Spa',
        caption: 'Bush Spa Treatment Pavilion',
        specs: 'Botanical Oils & Massage',
        aiTags: ['Spa'],
      },
    ],
    overviewShort:
      'Architectural safari suites suspended above acacia plains with private game-drive guides, solar sustainability, and full-board culinary hospitality.',
    overviewExtended:
      'Available for milestone retreats and seasonal buyouts, featuring 24 private pavilions, private airstrip transfers, star-gazing decks, and curated wellness rituals.',
    investmentEligible: false,
    specs: {
      rooms: 24,
      floors: 1,
      opened: 2021,
      lastRenovated: 2025,
      languages: 'English · Swahili · French',
      checkIn: '13:00',
      checkOut: '10:30',
    },
    sustainabilityScore: 94,
    certifications: ['Green Star', 'Solar Off-Grid Verified'],
  },
  {
    id: 'sandton-executive-sky-suites',
    name: 'Sandton Meridian Corporate Suites',
    subtitle: 'Extended-Stay Aparthotel',
    country: 'South Africa',
    province: 'Gauteng',
    city: 'Johannesburg',
    suburb: 'Sandton Central',
    category: 'Serviced Apartments',
    propertyType: 'Serviced Apartment',
    starRating: 5,
    score: 9.1,
    scoreLabel: 'Superb',
    reviewCount: 842,
    nightlyFromZar: 1950,
    monthlyFromZar: 32500,
    locationLabel: 'Sandton Central, Johannesburg, South Africa',
    heroImages: [
      {
        url: '/images/bQpZBCFZhwE8O_cs7mNAwkaUM8W3jpm_4o1EJoHW6CGw7RXnjNWQ4gX3DfiZQ6GxCxJqkk20Qg5bXqnlWqaI92-MaZ8a8Xmce7-Cu87PNH1kCvSJ58uf9qG4HPAkgSNvwht2w7D-62vuOPfMKOF4mrLv86eLr0x1s2VjH82vOpSiRnY3HbLAXkL6ghFJL81S.jpg',
        category: 'Exterior',
        caption: 'Sandton Meridian Executive Tower & Courtyard',
        specs: '18 Floors · Gautrain 350m Walk',
        aiTags: ['Exterior'],
      },
      {
        url: '/images/ciGI9jt_sGVPxiolPnhsy4lAgRDH_3j8eZMJxZIm97d_f65lcSHw26Eo1j98ieeBwr8GwTqFdYVrQxmycHYskbBo00ycrJusnkMalqSQ6xAVOdjkMa2TbZEkfwgILcYox9fLkhguJe46qif3N1OguJwZXehGdCmtWgd4E974iGSybhRE-PvS7RwPu3YvkhSr.jpg',
        category: 'Suites',
        caption: 'Private Executive Residence Terrace',
        specs: '64 m² · Solar Backup · Dual-ISP Fibre',
        aiTags: ['Exterior', 'Workspace'],
      },
      {
        url: '/images/apartment_block_1779978678706.png',
        category: 'Exterior',
        caption: 'Sandton Financial District Facade',
        specs: '18 Floors · Biometric Security',
        aiTags: ['Exterior'],
      },
      {
        url: '/images/loft_interior_1779978697203.png',
        category: 'Suites',
        caption: 'Corner Executive Sky Apartment',
        specs: '64 m² · Full Kitchen & Fibre Desk',
        aiTags: ['Bedroom', 'Workspace'],
      },
      {
        url: '/images/apartment_dining_1779978782850.png',
        category: 'Dining',
        caption: 'Skyline Bistro & Espresso Bar',
        specs: 'Co-Working Café · All-Day Dining',
        aiTags: ['Restaurant'],
      },
      {
        url: '/images/house_pool_1779978750296.png',
        category: 'Pool',
        caption: 'Rooftop Lap Pool & Deck',
        specs: 'City Skyline Views',
        aiTags: ['Pool'],
      },
      {
        url: '/images/spa_wellness_1779978823248.png',
        category: 'Spa',
        caption: 'Executive Fitness & Steam Room',
        specs: '24/7 Access',
        aiTags: ['Spa'],
      },
    ],
    overviewShort:
      'Walk-to-JSE serviced suites tailored for corporate relocations, consultants, and long-term stays from 30 days to 12 months with zero utility interruptions.',
    overviewExtended:
      'Dual-source solar and generator backup, private meeting pods, weekly linen service, and discounted multi-month billing on one unified AfriEstate agreement.',
    investmentEligible: true,
    investmentData: {
      estimatedValue: 'R36.2M',
      annualRevenue: 'R7.1M',
      averageOccupancy: '82%',
      grossYield: '9.1%',
      marketGrowth: '+8.9%',
      demand: 'High',
      risk: 'Low',
      growth: 'Steady',
      liquidity: 'High',
      aiSummary:
        'Consistent Sandton corporate relocation contracts drive predictable 12-month occupancy and corporate lease renewals.',
    },
    specs: {
      rooms: 110,
      floors: 18,
      opened: 2020,
      lastRenovated: 2025,
      languages: 'English · Zulu · French',
      checkIn: '14:00',
      checkOut: '11:00',
    },
    sustainabilityScore: 85,
    certifications: ['Green Star'],
  },
];

export const ROOM_CATALOG: RoomCatalogItem[] = [
  {
    id: 'deluxe-ocean-suite',
    name: 'Deluxe Ocean View Suite',
    category: 'Suites',
    sizeSqm: 42,
    viewLabel: 'Ocean view',
    bedConfig: 'King bed',
    sleeps: 2,
    leftCount: 3,
    image: '/images/loft_interior_1779978697203.png',
    features: ['Free Wi-Fi', 'Breakfast available', 'Free cancellation', 'Private ocean terrace', 'Workspace desk'],
    cancellationSummary: 'Free cancellation Until 10 December',
    cancellationCutoff: '10 December 2026',
    afterCutoffRule: "First night's charge applies after 10 December 2026.",
    ratePlans: [
      {
        id: 'flex',
        name: 'Flexible',
        nightlyZar: 2450,
        monthlyZar: 48500,
        perks: ['Free cancellation', 'Pay at property or online', 'Breakfast optional'],
      },
      {
        id: 'nonref',
        name: 'Non-refundable',
        nightlyZar: 2180,
        monthlyZar: 43200,
        perks: ['Save 11%', 'Instant confirmation'],
        excluded: 'No cancellation after booking',
        badgeText: 'Best Value',
      },
      {
        id: 'breakfast',
        name: 'Breakfast Included',
        nightlyZar: 2850,
        monthlyZar: 54900,
        perks: ['Daily Ubuntu breakfast for 2', 'Free cancellation'],
      },
      {
        id: 'longterm',
        name: 'Long-Term Corporate Monthly',
        nightlyZar: 1790,
        monthlyZar: 44500,
        perks: ['30+ night monthly rate', 'Weekly housekeeping & fibre included', 'Flexible corporate invoice'],
      },
    ],
  },
  {
    id: 'executive-courtyard-suite',
    name: 'Executive Residence One-Bedroom',
    category: 'Entire Residence',
    sizeSqm: 68,
    viewLabel: 'Pool & Mountain view',
    bedConfig: 'Super King + Lounge Sofa',
    sleeps: 4,
    leftCount: 4,
    image: '/images/luxury_kitchen_living_1779978720358.png',
    features: ['Full kitchen', 'Free Wi-Fi', 'Dedicated workspace', 'Free cancellation', 'Washer & dryer'],
    cancellationSummary: 'Free cancellation Until 10 December',
    cancellationCutoff: '10 December 2026',
    afterCutoffRule: "First night's charge applies for cancellations within 48 hours of arrival.",
    ratePlans: [
      {
        id: 'flex',
        name: 'Flexible',
        nightlyZar: 3450,
        monthlyZar: 62000,
        perks: ['Free cancellation', 'Pay at property', 'Full residence kitchen'],
      },
      {
        id: 'nonref',
        name: 'Non-refundable',
        nightlyZar: 3070,
        monthlyZar: 55800,
        perks: ['Save 11%', 'Priority check-in'],
        excluded: 'No cancellation',
      },
      {
        id: 'breakfast',
        name: 'Breakfast Included',
        nightlyZar: 3890,
        monthlyZar: 68500,
        perks: ['Daily Ubuntu breakfast', 'Free cancellation'],
      },
      {
        id: 'longterm',
        name: 'Long-Term Corporate Monthly',
        nightlyZar: 2290,
        monthlyZar: 56000,
        perks: ['Ideal for 1–12 month relocations', 'Dedicated parking bay & fibre included'],
      },
    ],
  },
  {
    id: 'presidential-atlantic-villa',
    name: 'Presidential Two-Bedroom Ocean Villa',
    category: 'Villas',
    sizeSqm: 138,
    viewLabel: 'Panoramic Atlantic Ocean',
    bedConfig: '2 King Beds',
    sleeps: 4,
    leftCount: 1,
    image: '/images/coastal_mansion_1779978805301.png',
    features: ['Private plunge pool', 'Dedicated butler', 'Free Wi-Fi', 'Airport transfer included', 'Family dining deck'],
    cancellationSummary: 'Free cancellation Until 8 December',
    cancellationCutoff: '8 December 2026',
    afterCutoffRule: '50% deposit retained if cancelled within 72 hours of check-in.',
    ratePlans: [
      {
        id: 'flex',
        name: 'Flexible',
        nightlyZar: 6850,
        monthlyZar: 118000,
        perks: ['Free cancellation', 'Chauffeur airport pick-up', 'Private pool deck'],
      },
      {
        id: 'nonref',
        name: 'Non-refundable',
        nightlyZar: 6090,
        monthlyZar: 105000,
        perks: ['Save 11%', 'Guaranteed top floor wing'],
        excluded: 'No cancellation',
      },
      {
        id: 'breakfast',
        name: 'Breakfast Included',
        nightlyZar: 7450,
        monthlyZar: 126000,
        perks: ['Private chef breakfast on terrace', 'Free cancellation'],
      },
      {
        id: 'longterm',
        name: 'Long-Term Corporate Monthly',
        nightlyZar: 4950,
        monthlyZar: 109000,
        perks: ['Private diplomatic security wing', 'Concierge & spa membership included'],
      },
    ],
  },
];

export const AMENITIES_BY_GROUP = {
  Popular: ['Free Wi-Fi', 'Swimming pool', 'Free parking', 'Restaurant', 'Air conditioning', 'Room service'],
  Wellness: ['Spa', 'Gym', 'Sauna', 'Massage', 'Steam room'],
  Business: ['Business centre', 'Meeting rooms', 'Conference facilities', 'Printing', 'High-speed Wi-Fi'],
  Family: ['Family rooms', "Children's pool", 'Kids activities', 'Babysitting'],
};

export const ALL_64_AMENITIES = [
  'Free high-speed Wi-Fi (300 Mbps)', 'Solar-backed power resilience', 'Heated infinity pool', 'Free gated underground parking',
  'Ubuntu Signature Restaurant', 'Sunset Rooftop Lounge', '24-hour room service', 'Individual climate control',
  'Full-service mineral spa', '24/7 fitness studio', 'Cedarwood sauna', 'Aromatherapy massage suites',
  'Eucalyptus steam room', 'Yoga & breathwork deck', 'Executive business centre', '6 private meeting boardrooms',
  '320-seat Atlantic conference hall', 'Wireless printing & concierge tech', 'Dual-ISP redundant enterprise Wi-Fi', 'Soundproofed acoustic glazing',
  'Interconnecting family suites', "Heated children's splash pool", 'Curated kids discovery club', 'Vetted evening babysitting',
  'Bottle warmers & cribs on request', 'Wheelchair accessible step-free lobby', 'Accessible basement elevator', 'Accessible roll-in rain showers',
  'Priority accessible parking bays', 'Visual & audio fire alarms', '24-hour multi-lingual front desk', 'Private airport chauffeur fleet',
  'Electric vehicle fast chargers', 'In-suite espresso machine', 'Walk-in rain shower & soaking tub', 'Organic African botanical toiletries',
  'Digital mobile room key access', 'In-room laptop safe', 'Iron & vertical steamer', 'Daily housekeeping & turndown',
  'Extended-stay washer & dryer suites', 'Full designer induction kitchenettes', 'Dishwasher & wine cooler', 'Private oceanfront dining terrace',
  'Baggage vault & early shower lounge', 'On-site medical doctor on call', '24/7 biometric perimeter security', 'CCTV monitored grounds',
  'Tour & safari desk', 'Curated Winelands shuttle', 'Private art gallery corridor', 'Filtered sparkling & still water taps',
  'Rainwater harvesting irrigation', 'Zero single-use plastics', 'Vegetarian, vegan & halal kitchens', 'Sommelier cellar tastings',
  'Poolside cabana dining', 'Shoe shine & express pressing', 'Currency exchange & multi-currency POS', 'Corporate VAT invoicing',
  'Flexible monthly extended-stay billing', 'Luggage porter & valet', 'Pet-friendly diplomatic arrangements on request', 'Direct Camps Bay beach gate',
];

export const ACCESSIBILITY_FEATURES = [
  { label: 'Wheelchair accessible entrance', category: 'Mobility' },
  { label: 'Accessible parking', category: 'Parking' },
  { label: 'Accessible rooms', category: 'Rooms' },
  { label: 'Elevator', category: 'Vertical Access' },
  { label: 'Accessible bathroom', category: 'Bathroom' },
  { label: 'Step-free dining terrace', category: 'Dining' },
  { label: 'Braille floor signage', category: 'Visual' },
  { label: 'Hearing loop at reception', category: 'Audio' },
];

export const NEARBY_LANDMARKS = [
  { name: 'Camps Bay Beach', dist: '400 m', mode: 'Nearby' as MapModeType, walkTime: '5 min walk', x: '24%', y: '56%' },
  { name: 'Promenade Restaurants', dist: '150 m', mode: 'Restaurants' as MapModeType, walkTime: '2 min walk', x: '36%', y: '48%' },
  { name: 'V&A Waterfront', dist: '7.2 km', mode: 'Attractions' as MapModeType, walkTime: '14 min drive', x: '68%', y: '28%' },
  { name: 'Cape Town CBD', dist: '5.4 km', mode: 'Transport' as MapModeType, walkTime: '11 min drive', x: '74%', y: '44%' },
  { name: 'Table Mountain Aerial Cableway', dist: '4.8 km', mode: 'Attractions' as MapModeType, walkTime: '9 min drive', x: '58%', y: '68%' },
  { name: 'Cape Town International Airport', dist: '24 km', mode: 'Transport' as MapModeType, walkTime: '26 min express', x: '84%', y: '72%' },
];

export const NEIGHBORHOOD_AI_SCORES = [
  { label: 'Walkability', score: 92 },
  { label: 'Safety', score: 89 },
  { label: 'Dining', score: 96 },
  { label: 'Transport', score: 87 },
  { label: 'Tourism', score: 98 },
  { label: 'Business access', score: 84 },
];

export const REVIEW_CATEGORY_SCORES = [
  { label: 'Cleanliness', score: 9.6 },
  { label: 'Comfort', score: 9.5 },
  { label: 'Location', score: 9.7 },
  { label: 'Facilities', score: 9.3 },
  { label: 'Staff', score: 9.6 },
  { label: 'Value', score: 9.1 },
  { label: 'Wi-Fi', score: 9.2 },
];

export const VERIFIED_REVIEWS: VerifiedGuestReview[] = [
  {
    id: 'rev-1',
    guestName: 'Maria S.',
    country: 'Angola',
    rating: 5,
    stayedNights: 5,
    travelType: 'Families',
    roomName: 'Executive Residence One-Bedroom',
    date: 'October 2026',
    quote:
      'Beautiful property with excellent service. Having both hotel breakfast at Ubuntu and a full kitchen for our children made a five-night Cape Town stay effortless.',
    helpfulCount: 28,
  },
  {
    id: 'rev-2',
    guestName: 'David M.',
    country: 'South Africa',
    rating: 5,
    stayedNights: 3,
    travelType: 'Business',
    roomName: 'Deluxe Ocean View Suite',
    date: 'October 2026',
    quote:
      'Fibre speed stayed rock solid across back-to-back video calls and board meetings in the business wing, and Sunset Terrace was ideal for client dinners.',
    helpfulCount: 19,
  },
  {
    id: 'rev-3',
    guestName: 'Amara K.',
    country: 'Kenya',
    rating: 5,
    stayedNights: 4,
    travelType: 'Couples',
    roomName: 'Deluxe Ocean View Suite',
    date: 'September 2026',
    quote:
      'Unbeatable ocean views, quiet soundproofed rooms, and genuinely warm concierge help booking our Winelands driver.',
    helpfulCount: 24,
  },
  {
    id: 'rev-4',
    guestName: 'Tariq B.',
    country: 'Nigeria',
    rating: 4,
    stayedNights: 32,
    travelType: 'Solo',
    roomName: 'Executive Residence One-Bedroom',
    date: 'August 2026',
    quote:
      'Booked a one-month corporate extended stay. Monthly pricing was transparent, laundry and parking ran smoothly, though weekend street parking outside can fill fast.',
    helpfulCount: 15,
  },
  {
    id: 'rev-5',
    guestName: 'Claire & Hugo V.',
    country: 'France',
    rating: 5,
    stayedNights: 6,
    travelType: 'Friends',
    roomName: 'Presidential Two-Bedroom Ocean Villa',
    date: 'August 2026',
    quote:
      'The villa plunge pool overlooking Camps Bay at dusk felt extraordinary. Everything matched the verified photos completely.',
    helpfulCount: 31,
  },
];

export const UBUNTU_MENU_HIGHLIGHTS = [
  { course: 'Starter', name: 'West Coast Mussel & Saffron Velouté', priceZar: 195, notes: 'Artisan sourdough · Fresh sea fennel' },
  { course: 'Signature', name: 'Cape Malay Spiced Linefish', priceZar: 365, notes: 'Sustainably caught · Jasmine rice & charred baby carrots' },
  { course: 'Signature', name: 'Karoo Lamb Saddle & Herb Jus', priceZar: 410, notes: 'Roasted heirloom squash · Red wine reduction' },
  { course: 'Plant-Based', name: 'Charred Aubergine & Harissa Chickpea Bowl', priceZar: 245, notes: 'Tahini yogurt · Pomegranate & flatbread' },
  { course: 'Dessert', name: 'Rooibos Crème Brûlée', priceZar: 145, notes: 'Caramelized fig & honeycomb' },
];

export const WELLNESS_EXPERIENCES = [
  { title: 'Cape Town Wine Tour', duration: 'Half Day · Private Chauffeur', priceZar: 1950, tag: 'Curated Excursion' },
  { title: 'Table Mountain Summit Pass', duration: '3 Hours · Priority Cableway', priceZar: 890, tag: 'Landmark Access' },
  { title: 'Camps Bay Sunset Beach Experience', duration: '2 Hours · Private Cabana', priceZar: 650, tag: 'Coastal Leisure' },
  { title: 'Big Five Private Safari Transfer', duration: 'Full Day · Aquila / Reserve', priceZar: 3450, tag: 'Wildlife' },
  { title: 'Bo-Kaap & Waterfront Cultural Tour', duration: '3.5 Hours · Guided Historian', priceZar: 980, tag: 'Heritage' },
];

export const INVESTMENT_MODE_DEVELOPMENTS = [
  { name: 'Victoria Ridge Aparthotel', price: 'R31.8M', yield: '9.1%', demand: '94% Peak', x: '28%', y: '34%' },
  { name: 'Camps Bay Promenade Suites', price: 'R48.5M', yield: '8.7%', demand: '78% Annual', x: '50%', y: '52%' },
  { name: 'Clifton Cliffside Villas', price: 'R74.0M', yield: '7.9%', demand: '82% Seasonal', x: '72%', y: '36%' },
];
