

import type { Property, NeighborhoodGuide, KnowledgeBaseArticle, ForumPost, Achievement, ForumCategory, CoInvestmentDeal, ProfessionalContact, ExclusiveDeal, ServiceProvider, Notification } from './types';
import { ListingType, PropertyType, Language, PropertyStatus, DealType, Currency, NotificationType } from './types';
import { StudentIcon, AffordableIcon, TownshipIcon, RuralIcon, StayIcon, TransportIcon, WellnessIcon } from './components/icons/CategoryIcons';
import React from 'react';
// FIX: RocketLaunchIcon is not in ActionIcons, it is in AgentDashboardIcons. Split the import.
import { StarIcon, TrophyIcon } from './components/icons/ActionIcons';
import { RocketLaunchIcon } from './components/icons/AgentDashboardIcons';

export { ALL_PROPERTIES } from './africanProperties';


export const CATEGORIES = [
  {
    titleKey: "shortTermStays",
    descriptionKey: "shortTermStaysDescription",
    Icon: StayIcon
  },
  {
    titleKey: "transportRentals",
    descriptionKey: "transportRentalsDescription",
    Icon: TransportIcon
  },
  {
    titleKey: "wellnessRetreats",
    descriptionKey: "wellnessRetreatsDescription",
    Icon: WellnessIcon
  },
  {
    titleKey: "longTermRentals",
    descriptionKey: "longTermRentalsDescription",
    Icon: StudentIcon
  }
];


export const ALL_AMENITIES: string[] = [
    'Swimming Pool', 'Gym', 'Pet Friendly', 'In-unit Laundry', 'Secure Parking',
    'Garden', 'Rooftop Deck', 'Doorman', 'Furnished', 'Utilities Included', 
    'High-speed Internet', 'Study Lounge', 'Patio', 'Fireplace', 'Garage',
    'Ocean View', 'Gated Community', 'Private Theater', 'Wine Cellar', 'Acreage',
    'Zoned Commercial'
];

export const NEIGHBORHOOD_GUIDES: NeighborhoodGuide[] = [
    {
        id: 'Durbanville_arts_district',
        name: 'Durbanville Arts District',
        description: 'Vibrant, creative, and always buzzing. The perfect spot for those who love city life.',
        image: '/images/house_suburbs_1779978598551.png',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        profile: {
            history: "The Durbanville Arts District is anchored by the historic Rust-en-Vrede Gallery and Clay Museum. Set in an 1850s Cape Dutch building, it serves as the cultural nucleus for contemporary art, ceramics, and community workshops in the Northern Suburbs.",
            demographics: "Primarily young professionals, artists, and students. Median age is 29. Highly diverse and international.",
            publicTransport: "Excellent connectivity with access to the A, C, E, and 1, 2, 3 subway lines, plus numerous bus routes.",
            localBusinesses: ["Rust-en-Vrede Gallery + Clay Museum", "Monthly Craft Market", "The Cellar Sessions at Nitida", "Die Boer Theatre Restaurant", "Klein Roosboom Boutique Winery"],
        },
        accessibility: {
            bikePaths: "Good network of dedicated bike lanes on major avenues.",
            parking: "Parking is limited and mostly paid street parking or private garages."
        },
        scores: { safety: 7, affordability: 5, schools: 6, nightlife: 10, familyFriendly: 5 },
        marketTrends: [
            { month: 'Jan', avgRent: 3400, avgSalePrice: 950000 },
            { month: 'Feb', avgRent: 3450, avgSalePrice: 960000 },
            { month: 'Mar', avgRent: 3500, avgSalePrice: 980000 },
            { month: 'Apr', avgRent: 3520, avgSalePrice: 995000 },
        ],
        gallery: ['/images/house_suburbs_1779978598551.png', '/images/loft_interior_1779978697203.png', '/images/apartment_dining_1779978782850.png'],
        virtualTourUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&autoplay=1&mute=1&loop=1',
        reviews: [
            { author: 'Chloe R.', quote: "Living here is an inspiration. There's always a new gallery opening or a street performance to see. The energy is unmatched!", image: 'https://i.pravatar.cc/150?u=chloe' }
        ],
        events: [
            { name: 'First Friday Art Walk', date: 'First Friday of every month', description: 'Galleries stay open late, offering free wine and showcasing new exhibits.' }
        ],
        hiddenGems: [
            { name: 'The Speakeasy Scribe', category: 'Cafe', description: 'A hidden basement coffee shop with vintage typewriters for patrons to use.', image: '/images/interior_beanbags_1779978650034.png' }
        ]
    },
    {
        id: 'suburbia_green_valley',
        name: 'Suburbia Green Valley',
        description: 'Family-friendly with top-rated schools, parks, and a strong sense of community.',
        image: '/images/house_pool_1779978750296.png',
        coordinates: { lat: 41.5868, lng: -93.6250 },
        profile: {
            history: "The term 'Suburbia Green Valley' usually refers to a blend of two things in the greater Rustenburg/North West area: local self-catering accommodations (like Suburbia or Emerald Green Family Haven) and tourist destinations mimicking lush valleys (like the Lost Valley or Valley of Waves near Sun City).",
            demographics: "Mostly families with children. Median age is 42. Predominantly homeowners.",
            publicTransport: "Limited public transport, a car is recommended. Commuter rail station is a 10-minute drive.",
            localBusinesses: ["Suburbia Holiday Home", "Emerald Green Family Haven", "Lost Valley", "Valley of Waves", "Kgaswane Nature Reserve"],
        },
        accessibility: {
            bikePaths: "Well-maintained, family-friendly bike paths connecting parks and schools.",
            parking: "Ample residential street parking and private driveways."
        },
        scores: { safety: 9, affordability: 7, schools: 9, nightlife: 3, familyFriendly: 10 },
        marketTrends: [
            { month: 'Jan', avgRent: 2200, avgSalePrice: 520000 },
            { month: 'Feb', avgRent: 2200, avgSalePrice: 525000 },
            { month: 'Mar', avgRent: 2250, avgSalePrice: 535000 },
            { month: 'Apr', avgRent: 2300, avgSalePrice: 550000 },
        ],
        gallery: ['/images/house_pool_1779978750296.png', '/images/modern_house_tan_1779978632706.png', '/images/luxury_kitchen_living_1779978720358.png'],
        virtualTourUrl: 'https://www.youtube.com/embed/A45gAEQRd_A?rel=0&autoplay=1&mute=1&loop=1',
        reviews: [
            { author: 'The Miller Family', quote: "It's the perfect place to raise our kids. The schools are fantastic, and we feel so safe. We love the weekend farmers' market!", image: 'https://i.pravatar.cc/150?u=millers' }
        ],
        events: [
            { name: "Green Valley Farmers' Market", date: 'Every Saturday, 9am - 1pm', description: 'Fresh local produce, baked goods, and crafts at the community park.' }
        ],
        hiddenGems: [
            { name: 'Willow Creek Duck Pond', category: 'Park', description: 'A serene little pond hidden behind the community center, perfect for a quiet afternoon.', image: '/images/house_suburbs_1779978598551.png' }
        ]
    },
    {
        id: 'stellenbosch_winelands',
        name: 'Stellenbosch Winelands',
        description: 'Breathtaking scenery, world-class vineyards, and a tranquil, luxurious lifestyle.',
        image: '/images/images%20(14).jpg',
        coordinates: { lat: -33.9321, lng: 18.8602 },
        profile: {
            history: "Established in 1679, Stellenbosch is South Africa’s second oldest town and most inspiring wine, food, art and cultural destination. The scenic Stellenbosch Wine Route is the oldest in the country and one of the most popular destinations for local and international visitors alike. .",
            demographics: "A mix of affluent retirees, established families, and university students. Significant international population.",
            publicTransport: "A car is essential for exploring the region. Ride-sharing services are readily available.",
            localBusinesses: ["De Morgenzon Wine Estate", "Overture Restaurant", "Stellenbosch University", "The Slow Market"],
        },
        accessibility: {
            bikePaths: "Numerous scenic cycling routes through vineyards, though dedicated lanes are rare.",
            parking: "Parking is generally available at wineries and in the town center, but can be busy on weekends."
        },
        scores: { safety: 8, affordability: 4, schools: 8, nightlife: 7, familyFriendly: 8 },
        marketTrends: [
            { month: 'Jan', avgRent: 1500, avgSalePrice: 3000000 },
            { month: 'Feb', avgRent: 1550, avgSalePrice: 3050000 },
            { month: 'Mar', avgRent: 1600, avgSalePrice: 3100000 },
            { month: 'Apr', avgRent: 1600, avgSalePrice: 3200000 },
        ],
        gallery: ['/images/images%20(14).jpg', '/images/coastal_mansion_1779978805301.png', '/images/luxury_kitchen_living_1779978720358.png'],
        virtualTourUrl: 'https://www.youtube.com/embed/IyFLAz5_1I8?rel=0&autoplay=1&mute=1&loop=1',
        reviews: [
            { author: 'James B.', quote: "Retiring here was the best decision I've ever made. The views are incredible, the food is world-class, and there's a new wine to discover every weekend.", image: 'https://i.pravatar.cc/150?u=james' }
        ],
        events: [
            { name: 'Stellenbosch Wine Festival', date: 'Annually in February', description: 'A celebration of the regions finest wines, with tastings, food pairings, and live music.' }
        ],
        hiddenGems: [
            { name: 'Jonkershoek Nature Reserve', category: 'Park', description: 'Stunning hiking and mountain biking trails just a short drive from the town center.', image: '/images/spa_wellness_1779978823248.png' }
        ]
    },
    {
        id: 'soweto_cultural_hub',
        name: 'Soweto Cultural Hub',
        description: 'Rich in history and culture, offering a unique and vibrant community experience.',
        image: '/images/tersia-kroonstad.webp',
        coordinates: { lat: -26.2661, lng: 27.8587 },
        profile: {
            history: "Soweto's history is inextricably linked to the struggle against apartheid. It was home to Nelson Mandela and Desmond Tutu. Today it's a symbol of resilience and a center of vibrant culture.",
            demographics: "A diverse and dynamic population with a strong sense of community and entrepreneurship. A blend of all age groups.",
            publicTransport: "Well-served by minibus taxis and the Metrorail train system, connecting it to Johannesburg.",
            localBusinesses: ["Vilakazi Street", "Soweto Brewing Company", "Mandela House Museum", "Chaf Pozi"],
        },
        accessibility: {
            bikePaths: "Bicycle tours are popular, but dedicated bike lanes for commuting are limited.",
            parking: "Street parking is generally available, but can be crowded in popular areas like Vilakazi Street."
        },
        scores: { safety: 6, affordability: 9, schools: 6, nightlife: 8, familyFriendly: 7 },
        marketTrends: [
            { month: 'Jan', avgRent: 250, avgSalePrice: 750000 },
            { month: 'Feb', avgRent: 250, avgSalePrice: 780000 },
            { month: 'Mar', avgRent: 260, avgSalePrice: 820000 },
            { month: 'Apr', avgRent: 270, avgSalePrice: 850000 },
        ],
        gallery: ['/images/tersia-kroonstad.webp', '/images/house_suburbs_1779978598551.png', '/images/apartment_dining_1779978782850.png'],
        virtualTourUrl: 'https://www.youtube.com/embed/0uY8_ALH5Vw?rel=0&autoplay=1&mute=1&loop=1',
        reviews: [
            { author: 'Thabo M.', quote: "There is no place like Soweto. The sense of community, the history, the music... it's a place with a soul. I'm proud to call it home.", image: 'https://i.pravatar.cc/150?u=thabo' }
        ],
        events: [
            { name: 'Soweto Festival of Light', date: 'Annually in December', description: 'A festive celebration with lights, music, and food, bringing the community together.' }
        ],
        hiddenGems: [
            { name: 'Credo Mutwa Cultural Village', category: 'Art', description: 'An outdoor exhibition of sculptures and buildings depicting African folklore and culture.', image: '/images/apartment_dining_1779978782850.png' }
        ]
    }
];

export const LIFESTYLE_QUIZ_QUESTIONS = [
    {
        question: "What's your primary reason for moving?",
        options: ["Starting a family", "For my career or studies", "A quieter lifestyle", "To be in the center of the action"],
        key: 'reason'
    },
    {
        question: "Which best describes your ideal weekend?",
        options: ["Family time at the park", "Exploring cafes and art galleries", "Quiet time at home or in nature", "Going to bars and live music venues"],
        key: 'vibe'
    },
    {
        question: "What's your approximate monthly housing budget (USD)?",
        options: ["Under $1,000", "$1,000 - $2,500", "$2,500 - $4,000", "$4,000+"],
        key: 'budget'
    }
];

export const KNOWLEDGE_BASE_ARTICLES: KnowledgeBaseArticle[] = [
    {
        id: 'kb1',
        title: 'How to Write a Listing Description that Sells',
        category: 'Listings',
        content: "Start with a compelling headline that grabs attention. Use high-quality, professional photos to showcase the property's best features. In your description, tell a story. Describe what it's like to live in the home. Highlight unique features like a renovated kitchen or a beautiful backyard. Be honest, transparent, and always double-check for typos."
    },
    {
        id: 'kb2',
        title: '5 Tips for Working with First-Time Home Buyers',
        category: 'Clients',
        content: '1. Be patient and educational. First-time buyers have a lot of questions. 2. Help them get pre-approved for a mortgage early on. 3. Clearly define their needs vs. wants. 4. Guide them through the inspection and closing process. 5. Celebrate their big win with them!'
    },
    {
        id: 'kb3',
        title: 'Optimizing Your Agent Profile for More Leads',
        category: 'Profile',
        content: 'A great profile builds trust and attracts clients. Use a professional, high-resolution headshot. Write a detailed bio that highlights your expertise and personality. Ask past clients for reviews and display them prominently. Keep your contact information up-to-date.'
    },
    {
        id: 'kb4',
        title: 'Understanding Rental Yield: A Guide for Investors',
        category: 'Investors',
        content: 'Rental yield is a key metric for property investors. It is calculated by taking the total annual rent received and dividing it by the total amount invested in the property (usually the purchase price). A higher yield indicates a better return on investment. Gross yield does not account for expenses like maintenance or taxes, while net yield does.'
    }
];

export const FORUM_POSTS: ForumPost[] = [
    {
        id: 'fp1',
        title: 'Best CRM for new agents?',
        author: 'Jane Doe',
        timestamp: Date.now() - 2 * 60 * 60 * 1000,
        content: "Hey everyone, I'm looking for recommendations on a good, affordable CRM to manage my leads. What's everyone using?",
        replies: 5,
        views: 45
    },
    {
        id: 'fp2',
        title: 'Tips for hosting a successful open house?',
        author: 'Susan Miller',
        timestamp: Date.now() - 24 * 60 * 60 * 1000,
        content: 'I have a big open house coming up for a suburban property. Any tips to maximize foot traffic and capture leads?',
        replies: 12,
        views: 152
    },
    {
        id: 'fp3',
        title: 'Navigating new short-term rental regulations in Urbanville',
        author: 'Peter Van der Merwe',
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
        content: "Has anyone had experience with the new STR regulations? Looking to advise a client on an investment property.",
        replies: 8,
        views: 98
    }
];

export const AGENT_ACHIEVEMENTS: Omit<Achievement, 'id'>[] = [
    {
        title: 'First Listing',
        description: 'List your first property on the platform.',
        goal: 1,
        badge: RocketLaunchIcon,
    },
    {
        title: 'Sales Pro',
        description: 'Mark 3 properties as sold.',
        goal: 3,
        badge: TrophyIcon,
    },
    {
        title: 'Review Star',
        description: 'Receive 5 client reviews.',
        goal: 5,
        badge: StarIcon,
    },
];

export const FORUM_CATEGORIES: ForumCategory[] = [
    { id: 'fc1', name: 'Market Trends', description: 'Discuss the latest market shifts and economic indicators.' },
    { id: 'fc2', name: 'Investment Strategies', description: 'Share and critique different approaches to real estate investing.' },
    { id: 'fc3', name: 'Emerging Markets', description: 'Explore and analyze new opportunities in up-and-coming locations.' },
    { id: 'fc4', name: 'Property Management', description: 'Tips and tricks for managing your rental portfolio effectively.' },
];

export const INVESTOR_FORUM_POSTS: ForumPost[] = [
    {
        id: 'ifp1',
        title: 'Thoughts on the dUrbanville rental market for the next 5 years?',
        author: 'Peter Van der Merwe',
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
        content: 'With the new tech campus opening, I\'m bullish on rental demand, but concerned about rising property taxes. What are others thinking?',
        replies: 15,
        views: 210,
        category: 'Market Trends',
    },
    {
        id: 'ifp2',
        title: 'Best way to structure a multi-family property investment?',
        author: 'Investor_Alex',
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
        content: 'Looking at my first duplex. Should I go with an LLC? Any legal advice welcome, though I know this isn\'t official counsel.',
        replies: 8,
        views: 150,
        category: 'Investment Strategies',
    }
];

export const CO_INVESTMENT_DEALS: CoInvestmentDeal[] = [
    {
        id: 'cid1',
        propertyId: '6',
        fundingGoal: 2000000,
        fundedAmount: 1250000,
        investorCount: 12,
    },
    {
        id: 'cid2',
        propertyId: '10',
        fundingGoal: 4500000,
        fundedAmount: 4000000,
        investorCount: 4,
    }
];

export const PROFESSIONAL_CONTACTS: ProfessionalContact[] = [
    { id: 'pc1', name: 'Sarah Chen', specialty: 'Financial Advisor', rating: 4.9, reviewCount: 120, image: 'https://i.pravatar.cc/150?u=sarahchen' },
    { id: 'pc2', name: 'David Rodriguez', specialty: 'Real Estate Lawyer', rating: 4.8, reviewCount: 95, image: 'https://i.pravatar.cc/150?u=davidrodriguez' },
    { id: 'pc3', name: 'Emily White', specialty: 'Property Manager', rating: 5.0, reviewCount: 210, image: 'https://i.pravatar.cc/150?u=emilywhite' },
];

export const EXCLUSIVE_DEALS: ExclusiveDeal[] = [
    {
        id: 'ed1',
        propertyId: '9',
        type: DealType.PREMIUM,
    },
    {
        id: 'ed2',
        propertyId: '5',
        type: DealType.AUCTION,
        auctionEnds: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days from now
    },
    {
        id: 'ed3',
        propertyId: '10',
        type: DealType.OFF_MARKET,
    }
];

export const INVESTOR_ACHIEVEMENTS: Omit<Achievement, 'id'>[] = [
    {
        title: 'First Investment',
        description: 'Acquire your first property.',
        goal: 1,
        badge: RocketLaunchIcon,
    },
    {
        title: 'Diversified',
        description: 'Own properties in 3+ different cities.',
        goal: 3,
        badge: TrophyIcon,
    },
    {
        title: 'Cashflow King',
        description: 'Reach $5,000 in monthly rental income.',
        goal: 5000,
        badge: StarIcon,
    },
];

export const SERVICE_PROVIDERS: ServiceProvider[] = [
  { id: 'sp1', name: 'John\'s Plumbing', service: 'Plumbing', rating: 4.8, reviewCount: 120, phone: '+27821234567', email: 'john@plumbing.co.za', image: 'https://i.pravatar.cc/150?u=johnplumb' },
  { id: 'sp2', name: 'Sparky Electrical', service: 'Electrical Work', rating: 4.9, reviewCount: 215, phone: '+27831234568', email: 'contact@sparky.co.za', image: 'https://i.pravatar.cc/150?u=sparky' },
  { id: 'sp3', name: 'Green Leaf Landscaping', service: 'Landscaping', rating: 4.7, reviewCount: 88, phone: '+27841234569', email: 'info@greenleaf.com', image: 'https://i.pravatar.cc/150?u=greenleaf' },
  { id: 'sp4', name: 'Swift Movers', service: 'Moving Services', rating: 4.9, reviewCount: 301, phone: '+27721234561', email: 'support@swiftmovers.co.za', image: 'https://i.pravatar.cc/150?u=swiftmove' },
  { id: 'sp5', name: 'Eagle Eye Home Inspectors', service: 'Home Inspection', rating: 5.0, reviewCount: 95, phone: '+27731234562', email: 'inspect@eagleeye.com', image: 'https://i.pravatar.cc/150?u=eagleeye' },
  { id: 'sp6', name: 'The Legal Eagles', service: 'Legal Services', rating: 4.8, reviewCount: 56, phone: '+27741234563', email: 'consult@legaleagles.co.za', image: 'https://i.pravatar.cc/150?u=legal' },
  { id: 'sp7', name: 'Prestige Painters', service: 'Painting', rating: 4.8, reviewCount: 74, phone: '+27741234564', email: 'quote@prestigepainters.co.za', image: 'https://i.pravatar.cc/150?u=prestige' },
  { id: 'sp8', name: 'FinSecure Mortgages', service: 'Financial Services', rating: 4.9, reviewCount: 150, phone: '+27821112222', email: 'loans@finsecure.co.za', image: 'https://i.pravatar.cc/150?u=finsecure' },
  { id: 'sp9', name: 'CoverRight Insurance', service: 'Insurance', rating: 4.8, reviewCount: 210, phone: '+27845556666', email: 'quotes@coverright.co.za', image: 'https://i.pravatar.cc/150?u=coverright' },
  { id: 'sp10', name: 'ProManage Rentals', service: 'Property Management', rating: 4.7, reviewCount: 95, phone: '+27833334444', email: 'manage@promanage.co.za', image: 'https://i.pravatar.cc/150?u=promanage' }
];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
    [Currency.USD]: '$',
    [Currency.EUR]: '€',
    [Currency.POUND]: '£',
    [Currency.FRANC]: 'Fr',
    [Currency.ZAR]: 'R',
    [Currency.NGN]: '₦',
    [Currency.KES]: 'KSh',
    [Currency.GHS]: 'GH₵',
    [Currency.UGX]: 'USh',
    [Currency.TZS]: 'TSh',
    [Currency.RWF]: 'FRw',
    [Currency.EGP]: 'E£',
    [Currency.MAD]: 'MAD',
    [Currency.XOF]: 'CFA',
    [Currency.XAF]: 'FCFA',
    [Currency.DZD]: 'DA',
    [Currency.AOA]: 'Kz',
    [Currency.BWP]: 'P',
    [Currency.BIF]: 'FBu',
    [Currency.CVE]: 'Esc',
    [Currency.KMF]: 'CF',
    [Currency.CDF]: 'FC',
    [Currency.DJF]: 'Fdj',
    [Currency.ERN]: 'Nfk',
    [Currency.SZL]: 'L',
    [Currency.ETB]: 'Br',
    [Currency.GMD]: 'D',
    [Currency.GNF]: 'FG',
    [Currency.LSL]: 'L',
    [Currency.LRD]: 'L$',
    [Currency.LYD]: 'LD',
    [Currency.MGA]: 'Ar',
    [Currency.MWK]: 'MK',
    [Currency.MRU]: 'UM',
    [Currency.MUR]: 'Rs',
    [Currency.MZN]: 'MT',
    [Currency.NAD]: 'N$',
    [Currency.STN]: 'Db',
    [Currency.SCR]: 'SR',
    [Currency.SLL]: 'Le',
    [Currency.SOS]: 'S',
    [Currency.SDG]: 'SDG',
    [Currency.TND]: 'DT',
    [Currency.ZMW]: 'ZK',
    [Currency.ZWL]: 'Z$',
};

export const CURRENCY_CONVERSION_RATES: Record<Currency, number> = {
    [Currency.USD]: 1,
    [Currency.EUR]: 0.92,
    [Currency.POUND]: 0.79,
    [Currency.FRANC]: 0.91,
    [Currency.ZAR]: 18.50,
    [Currency.NGN]: 1400.0,
    [Currency.KES]: 130.0,
    [Currency.GHS]: 14.1,
    [Currency.UGX]: 3800.0,
    [Currency.TZS]: 2500.0,
    [Currency.RWF]: 1200.0,
    [Currency.EGP]: 47.0,
    [Currency.MAD]: 10.0,
    [Currency.XOF]: 600.0,
    [Currency.XAF]: 600.0,
    [Currency.DZD]: 134.0,
    [Currency.AOA]: 820.0,
    [Currency.BWP]: 13.5,
    [Currency.BIF]: 2800.0,
    [Currency.CVE]: 102.0,
    [Currency.KMF]: 450.0,
    [Currency.CDF]: 2700.0,
    [Currency.DJF]: 177.0,
    [Currency.ERN]: 15.0,
    [Currency.SZL]: 18.5,
    [Currency.ETB]: 57.0,
    [Currency.GMD]: 67.0,
    [Currency.GNF]: 8600.0,
    [Currency.LSL]: 18.5,
    [Currency.LRD]: 190.0,
    [Currency.LYD]: 4.8,
    [Currency.MGA]: 4500.0,
    [Currency.MWK]: 1700.0,
    [Currency.MRU]: 39.0,
    [Currency.MUR]: 46.0,
    [Currency.MZN]: 63.0,
    [Currency.NAD]: 18.5,
    [Currency.STN]: 22.0,
    [Currency.SCR]: 14.0,
    [Currency.SLL]: 22000.0,
    [Currency.SOS]: 570.0,
    [Currency.SDG]: 600.0,
    [Currency.TND]: 3.1,
    [Currency.ZMW]: 25.0,
    [Currency.ZWL]: 322.0,
};

export const languageOptions: Record<Language, { name: string; flag: string }> = {
    [Language.EN]: { name: 'English', flag: 'EN' },
    [Language.FR]: { name: 'Français', flag: 'FR' },
    [Language.PT]: { name: 'Português', flag: 'PT' },
    [Language.ES]: { name: 'Español', flag: 'ES' },
    [Language.AR]: { name: 'العربية', flag: 'AR' },
};

export const currencyOptions: Record<Currency, { name: string; symbol: string }> = {
    [Currency.USD]: { name: 'US Dollar', symbol: '$' },
    [Currency.EUR]: { name: 'Euro', symbol: '€' },
    [Currency.POUND]: { name: 'British Pound', symbol: '£' },
    [Currency.FRANC]: { name: 'Swiss Franc', symbol: 'Fr' },
    [Currency.ZAR]: { name: 'South African Rand', symbol: 'R' },
    [Currency.NGN]: { name: 'Nigerian Naira', symbol: '₦' },
    [Currency.KES]: { name: 'Kenyan Shilling', symbol: 'KSh' },
    [Currency.GHS]: { name: 'Ghanaian Cedi', symbol: 'GH₵' },
    [Currency.UGX]: { name: 'Ugandan Shilling', symbol: 'USh' },
    [Currency.TZS]: { name: 'Tanzanian Shilling', symbol: 'TSh' },
    [Currency.RWF]: { name: 'Rwandan Franc', symbol: 'FRw' },
    [Currency.EGP]: { name: 'Egyptian Pound', symbol: 'E£' },
    [Currency.MAD]: { name: 'Moroccan Dirham', symbol: 'MAD' },
    [Currency.XOF]: { name: 'West African CFA', symbol: 'CFA' },
    [Currency.XAF]: { name: 'Central African CFA', symbol: 'FCFA' },
    [Currency.DZD]: { name: 'Algerian Dinar', symbol: 'DA' },
    [Currency.AOA]: { name: 'Angolan Kwanza', symbol: 'Kz' },
    [Currency.BWP]: { name: 'Botswana Pula', symbol: 'P' },
    [Currency.BIF]: { name: 'Burundian Franc', symbol: 'FBu' },
    [Currency.CVE]: { name: 'Cape Verdean Escudo', symbol: 'Esc' },
    [Currency.KMF]: { name: 'Comorian Franc', symbol: 'CF' },
    [Currency.CDF]: { name: 'Congolese Franc', symbol: 'FC' },
    [Currency.DJF]: { name: 'Djiboutian Franc', symbol: 'Fdj' },
    [Currency.ERN]: { name: 'Eritrean Nakfa', symbol: 'Nfk' },
    [Currency.SZL]: { name: 'Swazi Lilangeni', symbol: 'L' },
    [Currency.ETB]: { name: 'Ethiopian Birr', symbol: 'Br' },
    [Currency.GMD]: { name: 'Gambian Dalasi', symbol: 'D' },
    [Currency.GNF]: { name: 'Guinean Franc', symbol: 'FG' },
    [Currency.LSL]: { name: 'Lesotho Loti', symbol: 'L' },
    [Currency.LRD]: { name: 'Liberian Dollar', symbol: 'L$' },
    [Currency.LYD]: { name: 'Libyan Dinar', symbol: 'LD' },
    [Currency.MGA]: { name: 'Malagasy Ariary', symbol: 'Ar' },
    [Currency.MWK]: { name: 'Malawian Kwacha', symbol: 'MK' },
    [Currency.MRU]: { name: 'Mauritanian Ouguiya', symbol: 'UM' },
    [Currency.MUR]: { name: 'Mauritian Rupee', symbol: 'Rs' },
    [Currency.MZN]: { name: 'Mozambican Metical', symbol: 'MT' },
    [Currency.NAD]: { name: 'Namibian Dollar', symbol: 'N$' },
    [Currency.STN]: { name: 'São Tomé/Príncipe Dobra', symbol: 'Db' },
    [Currency.SCR]: { name: 'Seychellois Rupee', symbol: 'SR' },
    [Currency.SLL]: { name: 'Sierra Leonean Leone', symbol: 'Le' },
    [Currency.SOS]: { name: 'Somali Shilling', symbol: 'S' },
    [Currency.SDG]: { name: 'Sudanese Pound', symbol: 'SDG' },
    [Currency.TND]: { name: 'Tunisian Dinar', symbol: 'DT' },
    [Currency.ZMW]: { name: 'Zambian Kwacha', symbol: 'ZK' },
    [Currency.ZWL]: { name: 'Zimbabwean Dollar', symbol: 'Z$' },
};

export const countryOptions = [
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'GH', name: 'Ghana' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'PT', name: 'Portugal' },
  { code: 'DE', name: 'Germany' },
];

export const RealTimeNews_NOTIFICATIONS: Omit<Notification, 'isRead'>[] = [
  {
    id: 'noti_1',
    type: NotificationType.NEW_LISTING,
    title: 'New Loft in Urbanville!',
    message: 'A new 2-bedroom loft has just been listed in your saved search area.',
    timestamp: Date.now() - 5 * 60 * 1000,
    propertyId: '1',
  },
  {
    id: 'noti_2',
    type: NotificationType.ADMIN_MESSAGE,
    title: 'Platform Maintenance',
    message: 'We will be undergoing scheduled maintenance this Sunday from 2 AM to 3 AM.',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: 'noti_3',
    type: NotificationType.INQUIRY,
    title: 'New Tour Request',
    message: 'You have a new tour request for "Suburban Family Dream Home".',
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
  },
   {
    id: 'noti_4',
    type: NotificationType.ACHIEVEMENT,
    title: 'Achievement Unlocked!',
    message: 'Congratulations! You\'ve earned the "Sales Pro" badge.',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
  },
];

export const MOCK_NOTIFICATIONS = RealTimeNews_NOTIFICATIONS;

export const DEFAULT_BLOG_POSTS = [
  {
    title: 'Navigating Property Acquisition and Title Deeds in South Africa',
    author: 'Kagiso Mokoena',
    date: 'November 4, 2026',
    image: '/images/media_1759112685.webp',
    summary: 'A comprehensive guide for first-time buyers on understanding the conveyancing process, transfer duties, and sectional titles.',
    content: `## Understanding the Conveyancing Lifecycle

Purchasing real estate across major metropolitan centers requires a clear understanding of conveyancing, notary deed registration, and regulatory transfer fees. Whether you are acquiring an apartment in Johannesburg or an estate in the Western Cape, each phase protects your financial interest.

## Key Steps in the Transfer Process

First-time buyers must account for bond registration fees, transfer duty payable to the South African Revenue Service (SARS), and municipal rates clearance certificates. Engaging a verified conveyancing attorney ensures that the title deed is properly updated at the deeds registry without unexpected delays.

## Key Takeaways

Always obtain pre-approval before making an offer to purchase, review body corporate financials for sectional title units, and calculate auxiliary closing costs upfront.

## Partner with AfriEstate

Explore our verified listings and schedule a consultation with accredited agents to find your dream property today.`
  },
  {
    title: 'The Rise of Fractional and REIT Real Estate Investment in Africa',
    author: 'Amara Diallo',
    date: 'November 1, 2026',
    image: '/images/2ec34ce4ca57aef13fc8b3239a99345e.jpg',
    summary: 'How fractional ownership models and Real Estate Investment Trusts are democratizing prime property investment across the continent.',
    content: `## Democratizing Commercial and Luxury Real Estate

Historically, commercial office towers, industrial logistics hubs, and beachfront luxury villas required substantial capital reserves. Today, innovative syndicated frameworks and fractional models allow individual investors to participate with accessible ticket sizes.

## High-Yield Growth Corridors

Key urban corridors in Nairobi, Lagos, and Cape Town continue to showcase resilient rental yields driven by urbanization, tech hubs, and commercial logistics demand. Co-ownership structures distribute risk while delivering steady quarterly dividend distributions.

## Key Takeaways

Fractional property ownership offers liquidity, diversification, and passive income without the operational burdens of sole asset management.

## Start Investing Today

Visit the AfriEstate Investor Hub to discover institutional-grade commercial deals and fractional investment portfolios.`
  },
  {
    title: 'Sustainable Architecture: Off-Grid and Solar-Powered African Homes',
    author: 'David Ndlovu',
    date: 'October 27, 2026',
    image: '/images/50_88d3447798594a3781403aa23f0baf00_t_w_1440_h_900.jpg',
    summary: 'Exploring how solar microgrids, rainwater harvesting, and bioclimatic building techniques are defining modern African housing.',
    content: `## The Modern Self-Sustaining Home

With increasing demand for energy security and eco-friendly living, property developers are integrating high-efficiency solar photovoltaic systems, borehole filtration, and smart battery storage into modern residential designs.

## Value Appreciation and Resilience

Properties equipped with renewable microgrids and water autonomy routinely command higher resale valuations and premium rental yields. Tenants and buyers actively prioritize homes that guarantee uninterrupted power and lower utility expenditures.

## Key Takeaways

Sustainable infrastructure not only shields homeowners from grid interruptions but significantly enhances long-term capital appreciation.

## Browse Eco-Friendly Listings

Discover our curated selection of solar-ready and off-grid residential homes on AfriEstate.`
  }
];