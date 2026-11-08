import React from 'react';

export enum ListingType {
  ALL = 'All',
  RENT = 'For Rent',
  SALE = 'For Sale',
  FOR_INVESTMENT = 'For Investment',
}

export enum PropertyType {
  ALL = 'All Types',
  APARTMENT = 'Apartment',
  HOUSE = 'House',
  COMMERCIAL = 'Commercial',
  STUDENT_HOUSING = 'Student Housing',
  TOWNSHIP = 'Township Home',
  RURAL = 'Rural Property',
  LAND = 'Land',
  LUXURY_ESTATE = 'Luxury Estate',
  IN_CONSTRUCTION = 'In Construction',
  SHORT_TERM_RENTAL = 'Short-term Stay',
  HOTEL = 'Hotel',
  TRANSPORT = 'Transport Rental',
  WELLNESS = 'Wellness Retreat',
}

export enum PropertyStatus {
  ACTIVE = 'Active',
  DRAFT = 'Draft',
  PENDING = 'Pending Approval',
  EXPIRED = 'Expired',
  SOLD = 'Sold',
}

export interface FinancialEvent {
    date: number; // timestamp
    type: 'Income' | 'Expense';
    description: string;
    amount: number;
}

export interface Property {
  id: string;
  title: string;
  listingType: ListingType;
  propertyType: PropertyType;
  address: {
    street: string;
    city: string;
    zip: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  price: number;
  purchasePrice?: number;
  details: {
    beds: number;
    baths: number;
    area: number; // in sqft
  };
  description: string;
  neighborhoodInfo: string;
  amenities: string[];
  images: string[];
  virtualTourUrl?: string;
  vrTourUrl?: string;
  agent: {
    name: string; // Represents the owner/lister's username
    phone: string;
    verified: boolean;
    rating: number;
    reviewCount: number;
  };
  featured: boolean;
  verified: boolean;
  smartContractReady?: boolean;
  views: number;
  status: PropertyStatus;
  dateListed: number; // timestamp
  saves: number;
  priceHistory?: { date: number; price: number }[];
  occupancyRate?: number;
  marketROI?: number; // Market average ROI for comparison
  financials?: FinancialEvent[];
  guests?: number;
  vehicleType?: 'Sedan' | 'SUV' | 'Van' | 'Luxury';
  packageIncludes?: string[];
  perNightPrice?: boolean;
}

export interface SearchFilters {
  location: string;
  listingType: ListingType;
  propertyType: PropertyType;
  priceMin: number;
  priceMax: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  vehicleType?: string;
  wellnessType?: string;
}

export interface User {
  id?: string;
  username: string; // Unique identifier, usually email
  fullName: string; // For seekers, their name. For agents, their name or agency name.
  email: string;
  password?: string; // Should be hashed in a real app
  role: 'user' | 'agent' | 'investor';
  phone?: string;

  // Seeker-specific
  locationPreference?: string;
  budgetMin?: number;
  budgetMax?: number;
  profilePicture?: string; // Data URL for simplicity
  
  // Generic
  country?: string;
  currency?: Currency;
  has2FAEnabled?: boolean;
  
  // Agent-specific
  agencyName?: string;
  businessRegNumber?: string;
  officeAddress?: string;
  agentLicense?: string;
  commissionPreference?: string;
  idDocumentUrl?: string; // Represents uploaded file
  isVerified?: boolean; // For agent/investor verification flow
  
  // Investor-specific
  companyName?: string;
  investmentType?: 'Individual' | 'Corporate';
  proofOfIdentityUrl?: string;
  companyRegNumber?: string;
  sourceOfFunds?: string;
  bankDetails?: { accountHolder: string; accountNumber: string; bankName: string; };
  riskProfile?: { score: number; level: 'Conservative' | 'Moderate' | 'Aggressive'; };
  referralCode?: string;
}

export interface PropertyAlert {
    id: string;
    name: string;
    criteria: Partial<SearchFilters>;
}

export interface UserDocument {
    id: string;
    name: string;
    type: 'pdf' | 'doc' | 'image';
    uploadDate: number;
    url: string; // In a real app, this would be a secure URL
}


export interface TourRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  username: string;
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  timestamp: number;
}

export interface Message {
  id: string;
  propertyId: string;
  propertyTitle: string;
  senderUsername: string;
  receiverUsername: string;
  text: string;
  timestamp: number;
}

export interface ValuationResult {
    estimated_value: number;
    confidence: 'Low' | 'Medium' | 'High';
    rationale: string;
}

export enum Language {
    EN = 'en',
    FR = 'fr',
    PT = 'pt',
    ES = 'es',
    AR = 'ar',
}

// A generic type for the nested translation object
// It can be a string, or a nested object of the same type.
type TranslationValue = string | { [key: string]: TranslationValue };

export type Translations = {
    [key in Language]: {
        [key: string]: TranslationValue;
    }
};

export interface NeighborhoodReview {
    author: string;
    quote: string;
    image: string;
}

export interface NeighborhoodEvent {
    name: string;
    date: string;
    description: string;
}

export interface HiddenGem {
    name: string;
    category: 'Cafe' | 'Park' | 'Art' | 'Shop' | 'Other';
    description: string;
    image: string;
}

export interface NeighborhoodGuide {
    id: string;
    name: string;
    description: string;
    image: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    profile: {
        history: string;
        demographics: string;
        publicTransport: string;
        localBusinesses: string[];
    };
    accessibility?: {
        bikePaths: string;
        parking: string;
    };
    scores: {
        safety: number; // out of 10
        affordability: number;
        schools: number;
        nightlife: number;
        familyFriendly: number;
    };
    marketTrends: { month: string; avgRent: number; avgSalePrice: number }[];
    gallery: string[];
    virtualTourUrl: string;
    reviews?: NeighborhoodReview[];
    events?: NeighborhoodEvent[];
    hiddenGems?: HiddenGem[];
}


export interface BlogPost {
    title: string;
    author: string;
    date: string;
    image: string;
    summary: string;
    content: string;
}

export interface Review {
  id: string;
  agentName: string;
  reviewerUsername: string;
  rating: number; // 1 to 5
  comment: string;
  timestamp: number;
}

export enum EventType {
  SHOWING = 'Property Showing',
  MEETING = 'Client Meeting',
  DEADLINE = 'Deadline',
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  type: EventType;
  notes?: string;
}

export interface AgentProfile {
  username: string;
  bio: string;
  email: string;
  phone: string;
  profilePicture: string;
  socials: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
  };
}

export enum ActivityType {
    MESSAGE_SENT = 'Message Sent',
    TOUR_REQUESTED = 'Tour Requested',
}

export interface LeadActivity {
    type: ActivityType;
    timestamp: number;
    propertyTitle: string;
    detail: string;
}

export interface Lead {
    id: string; // username
    username: string;
    email: string;
    phone: string;
    score: number;
    lastContact: number;
    activity: LeadActivity[];
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  category: string;
  content: string;
}

export interface ForumPost {
  id: string;
  title: string;
  author: string;
  timestamp: number;
  content: string;
  replies: number;
  views: number;
  category?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  goal: number;
  badge: React.ElementType; // Icon component
}

export interface InvestmentMetrics {
  roi: number;
  annualYield: number;
}

export interface AIRecommendation {
  property: Property;
  rationale: string;
}

export interface MarketHotspot {
  location: string;
  risk_reward_profile: string;
  analysis: string;
}

export interface DashboardWidget {
    id: 'total_investment' | 'portfolio_value' | 'asset_appreciation' | 'monthly_income' | 'global_map' | 'watchlist_properties';
    label: string;
    isVisible: boolean;
}

export interface InvestorSettings {
    widgets: DashboardWidget[];
    alerts: {
        priceDrop: boolean;
        roiThreshold: {
            isEnabled: boolean;
            value: number;
        };
        rentalVacancy: boolean;
    };
    apiToken: string;
}

export interface ForumCategory {
    id: string;
    name: string;
    description: string;
}

export interface CoInvestmentDeal {
    id: string;
    propertyId: string;
    fundingGoal: number;
    fundedAmount: number;
    investorCount: number;
}

export interface ProfessionalContact {
    id: string;
    name: string;
    specialty: 'Financial Advisor' | 'Real Estate Lawyer' | 'Property Manager';
    rating: number;
    reviewCount: number;
    image: string;
}

export enum DealType {
    PREMIUM = 'Premium Early Access',
    AUCTION = 'Auction',
    OFF_MARKET = 'Off-Market Deal',
}

export interface ExclusiveDeal {
    id: string;
    propertyId: string;
    type: DealType;
    auctionEnds?: number; // timestamp for auction end
}

export interface MarketComparison {
    country_a: {
        name: string;
        summary: string;
        pros: string[];
        cons: string[];
    };
    country_b: {
        name: string;
        summary: string;
        pros: string[];
        cons: string[];
    };
}

export interface TaxLegalInfo {
    tax_benefits: string[];
    legal_restrictions: string[];
    ownership_structures: string[];
}

export interface InvestmentRequest {
  id: string;
  investorUsername: string;
  requestDetails: string;
  timestamp: number;
  status: 'Open' | 'Contacted' | 'Closed';
}

export enum Currency {
    USD = 'USD',
    EUR = 'EUR',
    POUND = 'POUND',
    FRANC = 'FRANC',
    ZAR = 'ZAR',
    NGN = 'NGN',
    KES = 'KES',
    GHS = 'GHS',
    UGX = 'UGX',
    TZS = 'TZS',
    RWF = 'RWF',
    EGP = 'EGP',
    MAD = 'MAD',
    XOF = 'XOF',
    XAF = 'XAF',
    DZD = 'DZD',
    AOA = 'AOA',
    BWP = 'BWP',
    BIF = 'BIF',
    CVE = 'CVE',
    KMF = 'KMF',
    CDF = 'CDF',
    DJF = 'DJF',
    ERN = 'ERN',
    SZL = 'SZL',
    ETB = 'ETB',
    GMD = 'GMD',
    GNF = 'GNF',
    LSL = 'LSL',
    LRD = 'LRD',
    LYD = 'LYD',
    MGA = 'MGA',
    MWK = 'MWK',
    MRU = 'MRU',
    MUR = 'MUR',
    MZN = 'MZN',
    NAD = 'NAD',
    STN = 'STN',
    SCR = 'SCR',
    SLL = 'SLL',
    SOS = 'SOS',
    SDG = 'SDG',
    TND = 'TND',
    ZMW = 'ZMW',
    ZWL = 'ZWL',
}

export interface ServiceProvider {
  id: string;
  name: string;
  service: string;
  rating: number;
  reviewCount: number;
  phone: string;
  email: string;
  image: string;
}

export enum NotificationType {
  NEW_LISTING = 'New Listing',
  ADMIN_MESSAGE = 'Admin Message',
  INQUIRY = 'New Inquiry',
  ACHIEVEMENT = 'Achievement',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  propertyId?: string; // Optional: for linking to a property
}