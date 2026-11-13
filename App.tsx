import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { supabase } from './lib/supabase';
import Header from './components/Header';
import Footer from './components/Footer';
import Hero from './components/Hero';
import PropertyList from './components/PropertyList';
import { CATEGORIES, AGENT_ACHIEVEMENTS, INVESTOR_ACHIEVEMENTS, DEFAULT_BLOG_POSTS } from './constants';
import type { Property, SearchFilters, TourRequest, User, Message, Review, CalendarEvent, AgentProfile, Lead, Achievement, InvestorSettings, InvestmentRequest, BlogPost, Notification } from './types';
import { ListingType, PropertyType, PropertyStatus, NotificationType } from './types';
import CategoryCard from './components/CategoryCard';
import Chatbot from './components/Chatbot';
import MortgageCalculator from './components/MortgageCalculator';
import ScheduleTourModal from './components/ScheduleTourModal';
import MarketInsights from './components/MarketInsights';
import RecommendedProperties from './components/RecommendedProperties';
import PropertyDetailPage from './components/pages/PropertyDetailPage';
import CompareBar from './components/CompareBar';
import CompareModal from './components/CompareModal';
import AuthPage, { type AuthView } from './components/pages/AuthPage';
import UserDashboardModal from './components/UserDashboardModal';
import PropertyFormModal from './components/PropertyFormModal';
import ServiceListingFormModal from './components/ServiceListingFormModal';
import FinancialServices from './components/FinancialServices';
import AIResponseModal from './components/AIResponseModal';
import { getProperties, saveProperties, getTourRequests, addTourRequest, getSavedPropertiesForUser, savePropertiesForUser, getInquiriesForSeller, getSavedSearchesForUser, saveSearchesForUser, incrementPropertyView, getMessagesForUser, sendMessage, addReview, getEvents, addEvent, updateEvent, deleteEvent, getAgentProfile, updateAgentProfile, getReviewsForAgent as getAllReviewsForAgent, getLeadsForAgent, getInvestorSettings, saveInvestorSettings, getInvestmentRequests, addInvestmentRequest, getNotifications, getReadNotificationIds, markNotificationsAsRead } from './lib/data';
import PersonalizedMatches from './components/PersonalizedMatches';
import AgentContactModal from './components/AgentContactModal';
import VRTourModal from './components/VRTourModal';
import NeighborhoodSection from './components/NeighborhoodSection';
import BlogSection from './components/BlogSection';
import { BookmarkIcon, ChatBubbleLeftRightIcon } from './components/icons/ActionIcons';
import MessageModal from './components/MessageModal';
import AgentReviewModal from './components/AgentReviewModal';
import AIImprovementModal from './components/AIImprovementModal';
import { useTranslations } from './contexts/LanguageContext';
import InvestmentRequestModal from './components/InvestmentRequestModal';
import { useCurrency } from './contexts/CurrencyContext';
import UpgradeToInvestorModal from './components/UpgradeToInvestorModal';
import { GoogleGenAI, Type } from "./lib/ai";
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import TermsOfServiceModal from './components/TermsOfServiceModal';
import CareersModal from './components/CareersModal';
import ApplicationModal from './components/ApplicationModal';
import ServiceRegistrationModal from './components/ServiceRegistrationModal';
import BlogDetailModal from './components/BlogDetailModal';
import SessionTimeoutModal from './components/SessionTimeoutModal';
import { useToast } from './contexts/ToastContext';
import { useAdminState } from './contexts/AdminStateContext';
import MapInterface from './components/MapInterface';
import ExploreAfricaMap from './components/ExploreAfricaMap';
import BookingStyleFilterSidebar from './components/BookingStyleFilterSidebar';
import PropertyVerificationModal from './components/PropertyVerificationModal';

import SuperAdminDashboard from './components/dashboards/SuperAdminDashboard';

// Page components
import AboutPage from './components/pages/AboutPage';
import ContactPage from './components/pages/ContactPage';
import ServicesPage from './components/pages/ServicesPage';
import PricingPage from './components/pages/PricingPage';
import RentACarPage from './components/pages/RentACarPage';
import FindWellnessPage from './components/pages/FindWellnessPage';
import BookAStayPage from './components/pages/BookAStayPage';
import NeighborhoodExplorerPage from './components/pages/NeighborhoodExplorerPage';
import FindProfessionalPage from './components/pages/FindProfessionalPage';
import HotelRegistrationPage from './components/pages/HotelRegistrationPage';

type Page = 'home' | 'about' | 'services' | 'contact' | 'pricing' | 'rent-a-car' | 'find-wellness' | 'book-a-stay' | 'auth' | 'property-detail' | 'neighborhood-explorer' | 'find-professional' | 'hotel-registration';

const initialFilters: SearchFilters = {
    location: '',
    listingType: ListingType.ALL,
    propertyType: PropertyType.ALL,
    priceMin: 0,
    priceMax: 10000000,
    bedrooms: 0,
    bathrooms: 0,
    amenities: [],
    mode: 'buy',
    region: '',
    country: '',
    leaseDuration: '',
    investmentType: '',
    targetReturnMin: 0,
    infrastructure: [],
    security: [],
    proximity: [],
    verifiedOnly: false,
    checkIn: '',
    checkOut: '',
    guests: 0,
    vehicleType: '',
    wellnessType: '',
};

const aiFilterSchema = {
    type: Type.OBJECT,
    properties: {
        location: { type: Type.STRING, description: "The city or neighborhood the user is searching in." },
        listingType: { type: Type.STRING, enum: Object.values(ListingType), description: "The type of listing, e.g., For Sale or For Rent." },
        propertyType: { type: Type.STRING, enum: Object.values(PropertyType), description: "The type of property, e.g., Apartment or House." },
        priceMin: { type: Type.NUMBER, description: "The minimum price, if specified." },
        priceMax: { type: Type.NUMBER, description: "The maximum price, if specified." },
        bedrooms: { type: Type.NUMBER, description: "The minimum number of bedrooms." },
        bathrooms: { type: Type.NUMBER, description: "The minimum number of bathrooms." },
        amenities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of any requested amenities." },
    },
};

const blogSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "A catchy, SEO-friendly title for the blog post." },
            author: { type: Type.STRING, description: "A realistic-sounding author name." },
            date: { type: Type.STRING, description: "A recent date in the format 'Month Day, Year'." },
            image: { type: Type.STRING, description: "A URL for a relevant image from picsum.photos, e.g., https://picsum.photos/seed/blog1/400/250." },
            summary: { type: Type.STRING, description: "A concise, one-sentence summary of the article." },
            content: { type: Type.STRING, description: "The full content of the blog post, formatted in Markdown with headings (e.g., ## My Heading), lists, and paragraphs. It should be 3-4 paragraphs long." },
        },
        required: ["title", "author", "date", "image", "summary", "content"]
    }
};

const App: React.FC = () => {
  const { lastAction } = useAdminState();
  const [page, setPage] = useState<Page>('home');
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  
  const scrollToSection = (targetPage: Page, sectionId?: string) => {
    if (page !== targetPage) {
      setPage(targetPage);
      setTimeout(() => {
        const element = sectionId ? document.getElementById(sectionId) : null;
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 150);
    } else {
      const element = sectionId ? document.getElementById(sectionId) : null;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };
  
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [investmentProperties, setInvestmentProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Saved Properties State
  const [savedPropertyIds, setSavedPropertyIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  
  // Tour Requests State
  const [tourRequests, setTourRequests] = useState<TourRequest[]>([]);

  // Enquiries & Live Engagement Tracking for Automatic Trending Ranking
  const [enquiryCounts, setEnquiryCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('afriestate_enquiry_counts');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return {
      '8': 34,
      '6': 29,
      '4': 26,
      '17': 24,
      '12': 21,
      '1': 19,
      '2': 17,
      '11': 15,
      '5': 14,
    };
  });

  // Saved Searches State
  const [savedSearches, setSavedSearches] = useState<SearchFilters[]>([]);
  
  // Messages State
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Calendar Events State
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  
  // Investment Requests State
  const [investmentRequests, setInvestmentRequests] = useState<InvestmentRequest[]>([]);

  // Agent Profile State
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [agentReviews, setAgentReviews] = useState<Review[]>([]);
  
  // Leads State
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // Achievements State
  const [agentAchievements, setAgentAchievements] = useState<Achievement[]>(AGENT_ACHIEVEMENTS.map((a, i) => ({...a, id: `ach_${i}`})));
  const [investorAchievements, setInvestorAchievements] = useState<Achievement[]>(INVESTOR_ACHIEVEMENTS.map((a, i) => ({...a, id: `inv_ach_${i}`})));

  // Investor Settings State
  const [investorSettings, setInvestorSettings] = useState<InvestorSettings | null>(null);

  // Currency & Theme State from Context
  const { currency, setCurrency } = useCurrency();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        return 'dark';
    }
    return 'light';
  });
  
  // AI Search State
  const [isSearchingAI, setIsSearchingAI] = useState(false);

  // Modal States
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [authPageView, setAuthPageView] = useState<AuthView>('login');
  const openAuthPage = (view: AuthView = 'login') => {
    setAuthPageView(view);
    setPage('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);
  const [isServiceListingFormOpen, setIsServiceListingFormOpen] = useState(false);
  const [isAIResponseModalOpen, setIsAIResponseModalOpen] = useState(false);
  const [isAgentContactModalOpen, setIsAgentContactModalOpen] = useState(false);
  const [isVRTourOpen, setIsVRTourOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isAIImprovementModalOpen, setIsAIImprovementModalOpen] = useState(false);
  const [isInvestmentRequestModalOpen, setIsInvestmentRequestModalOpen] = useState(false);
  const [isUpgradeToInvestorModalOpen, setIsUpgradeToInvestorModalOpen] = useState(false);
  const [isPrivacyPolicyModalOpen, setIsPrivacyPolicyModalOpen] = useState(false);
  const [isTermsOfServiceModalOpen, setIsTermsOfServiceModalOpen] = useState(false);
  const [isCareersModalOpen, setIsCareersModalOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [initialNeighborhoodId, setInitialNeighborhoodId] = useState<string | undefined>(undefined);
  const [isServiceRegistrationModalOpen, setIsServiceRegistrationModalOpen] = useState(false);
  const [isBlogDetailModalOpen, setIsBlogDetailModalOpen] = useState(false);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [providerServiceFilter, setProviderServiceFilter] = useState<string | undefined>(undefined);
  const [initialNeighborhoodFilter, setInitialNeighborhoodFilter] = useState<string | undefined>(undefined);
  
  const [isSessionWarningOpen, setIsSessionWarningOpen] = useState(false);
  const [sessionCountdown, setSessionCountdown] = useState(60);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => {
    try {
      const cached = localStorage.getItem('blogPosts');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore JSON errors
    }
    return DEFAULT_BLOG_POSTS;
  });
  const [isLoadingBlog, setIsLoadingBlog] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const [compareList, setCompareList] = useState<Property[]>([]);
  const [targetPropertyForSimilar, setTargetPropertyForSimilar] = useState<Property | null>(null);
  const [inquiryForResponse, setInquiryForResponse] = useState<TourRequest | null>(null);
  const [agentForReview, setAgentForReview] = useState<Property['agent'] | null>(null);
  const [agentContactMode, setAgentContactMode] = useState<'chat' | 'video'>('chat');
  const [agentContactName, setAgentContactName] = useState('');
  const [vrTourUrl, setVrTourUrl] = useState('');
  const [aiImprovementProperty, setAIImprovementProperty] = useState<Property | null>(null);
  const [applyingForJob, setApplyingForJob] = useState('');
  const [savedNeighborhoodIds, setSavedNeighborhoodIds] = useState<Set<string>>(new Set());
  const [isMapView, setIsMapView] = useState(false);
  const [verificationProperty, setVerificationProperty] = useState<Property | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'recommended' | 'price_low' | 'price_high' | 'yield_high' | 'rating'>('recommended');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isSuperAdminLoggedIn, setIsSuperAdminLoggedIn] = useState(false);
  const { t } = useTranslations();
  const { addToast } = useToast();

  // Session Timeout Logic
  const warningTimerRef = useRef<number | null>(null);
  const logoutTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const INACTIVITY_TIMEOUT = 15 * 60 * 1000;
  const WARNING_TIMEOUT = 14 * 60 * 1000;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          username: session.user.email || session.user.id,
          fullName: session.user.user_metadata?.full_name || 'Supabase User',
          email: session.user.email || '',
          role: session.user.user_metadata?.role || 'user',
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Real-time properties subscription
  useEffect(() => {
    const propertiesChannel = supabase
      .channel('public:properties')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'properties' },
        async () => {
          // Refetch properties when a modification happens
          const allProps = await getProperties(false);
          setAllProperties(allProps);
          setInvestmentProperties(allProps.filter(p => p.listingType === ListingType.FOR_INVESTMENT));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(propertiesChannel);
    };
  }, []);

  // Real-time user specific data subscriptions
  useEffect(() => {
    if (!currentUser) return;

    const userChannel = supabase
      .channel(`user-data:${currentUser.username}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `username=eq.${currentUser.username}` },
        async () => {
          setNotifications((await getNotifications(currentUser)).map(n => ({...n, isRead: false })));
          setReadNotificationIds(await getReadNotificationIds(currentUser.username));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        async () => {
          setMessages(await getMessagesForUser(currentUser.username));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tour_requests' },
        async () => {
          setTourRequests(await getTourRequests(currentUser.username));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
  }, [currentUser]);

  // Respond to real-time administrative changes (from Super Admin)
  useEffect(() => {
    if (!lastAction) return;
    const { type, data } = lastAction;

    switch (type) {
      case "suspend": {
        if (currentUser && (currentUser.username === data.id || currentUser.email === data.email)) {
          addToast("Your account has been suspended by the administrator.", "error");
          setCurrentUser(null);
        } else {
          addToast(`User ${data.name} has been suspended by administration.`, "info");
        }
        break;
      }
      case "freeze_wallet": {
        if (currentUser && (currentUser.username === data.id || currentUser.email === data.email)) {
          addToast("Your sovereign wallet has been frozen by administration.", "error");
          setCurrentUser(prev => prev ? { ...prev, isWalletFrozen: true } : null);
        } else {
          addToast(`Wallet security lock applied to user ${data.name}.`, "info");
        }
        break;
      }
      case "kyc_audit": {
        if (currentUser && (currentUser.username === data.id || currentUser.email === data.email)) {
          addToast("Sovereign KYC biometric audit scheduled. Account restricted.", "warn");
          setCurrentUser(prev => prev ? { ...prev, kycStatus: "Flagged", status: "Restricted" } : null);
        }
        break;
      }
      case "approve_verification": {
        if (currentUser && (currentUser.username === data.id || currentUser.email === data.email)) {
          addToast("Congratulations! Your biometrics have been approved by administration.", "success");
          setCurrentUser(prev => prev ? { ...prev, status: "Active", kycStatus: "Approved" } : null);
        } else {
          addToast(`KYC biometrics cleared for ${data.name}.`, "success");
        }
        break;
      }
      case "approve_listing_asset": {
        addToast(`Asset '${data.title}' has been successfully verified & published by administration.`, "success");
        setAllProperties(prev => prev.map(p => {
          if (p.id === data.id) {
            return { ...p, status: PropertyStatus.ACTIVE, verified: true };
          }
          return p;
        }));
        break;
      }
      case "send_listing_warning": {
        addToast(`Asset flag: '${data.title}' has been flagged and suspended for review.`, "error");
        setAllProperties(prev => prev.map(p => {
          if (p.id === data.id) {
            return { ...p, status: PropertyStatus.PENDING };
          }
          return p;
        }));
        break;
      }
      case "verify_geo_property": {
        addToast(`Geospatial data verified for asset '${data.title}'!`, "success");
        setAllProperties(prev => prev.map(p => {
          if (p.id === data.id) {
            return { ...p, verified: true };
          }
          return p;
        }));
        break;
      }
      default:
        break;
    }
  }, [lastAction, currentUser]);

  // Data Fetching and Initial Setup
  useEffect(() => {
    const fetchData = async () => {
        setIsLoadingProperties(true);
        const allProps = await getProperties(false);
        let savedViews: Record<string, number> = {};
        try {
          const raw = localStorage.getItem('afriestate_view_counts');
          if (raw) savedViews = JSON.parse(raw);
        } catch {
          // ignore
        }
        const hydratedProps = allProps.map(p => ({
          ...p,
          views: (p.views || 0) + (savedViews[p.id] || 0),
        }));
        const investmentProps = hydratedProps.filter(p => p.listingType === ListingType.FOR_INVESTMENT);

        setAllProperties(hydratedProps);
        setInvestmentProperties(investmentProps);
        setIsLoadingProperties(false);

        if (currentUser) {
            setSavedPropertyIds(await getSavedPropertiesForUser(currentUser.username));
            setTourRequests(await getTourRequests(currentUser.username));
            setSavedSearches(await getSavedSearchesForUser(currentUser.username));
            setMessages(await getMessagesForUser(currentUser.username));
            setNotifications((await getNotifications(currentUser)).map(n => ({...n, isRead: false })));
            setReadNotificationIds(await getReadNotificationIds(currentUser.username));

            if(currentUser.role === 'agent') {
                setCalendarEvents(await getEvents(currentUser.username));
                const profile = await getAgentProfile(currentUser.username);
                setAgentProfile(profile);
                setAgentReviews(await getAllReviewsForAgent(currentUser.username));
                setLeads(await getLeadsForAgent(currentUser.username));
                setInvestmentRequests(await getInvestmentRequests());
            }

            if (currentUser.role === 'investor') {
                setInvestorSettings(await getInvestorSettings(currentUser.username));
            }
        } else {
            setSavedPropertyIds(new Set<string>());
            setNotifications([]);
            setReadNotificationIds(new Set<string>());
        }
    }
    fetchData();
  }, [currentUser]);

  // Blog Post Initialization & Safe Cache (defaults to verified African real estate articles)
  useEffect(() => {
    try {
      const cached = localStorage.getItem('blogPosts');
      if (!cached) {
        localStorage.setItem('blogPosts', JSON.stringify(DEFAULT_BLOG_POSTS));
        setBlogPosts(DEFAULT_BLOG_POSTS);
      } else {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBlogPosts(parsed);
        } else {
          setBlogPosts(DEFAULT_BLOG_POSTS);
        }
      }
    } catch {
      setBlogPosts(DEFAULT_BLOG_POSTS);
    } finally {
      setIsLoadingBlog(false);
    }
  }, []);
  
  // Centralized Filtering & Sorting Logic
  useEffect(() => {
    const isTraditionalSearch = [PropertyType.ALL, PropertyType.APARTMENT, PropertyType.HOUSE, PropertyType.COMMERCIAL, PropertyType.STUDENT_HOUSING, PropertyType.TOWNSHIP, PropertyType.RURAL, PropertyType.LAND, PropertyType.LUXURY_ESTATE, PropertyType.IN_CONSTRUCTION].includes(filters.propertyType);
    const isStaySearch = [PropertyType.SHORT_TERM_RENTAL, PropertyType.HOTEL].includes(filters.propertyType);
    const isTransportSearch = filters.propertyType === PropertyType.TRANSPORT;
    const isWellnessSearch = filters.propertyType === PropertyType.WELLNESS;

    const filtered = allProperties.filter(p => {
        // 1. Pan-African Location & Cross-Border Geographic matching
        const locQuery = (filters.location || '').toLowerCase().trim();
        const matchesLocation = !locQuery || 
          p.address.city.toLowerCase().includes(locQuery) || 
          p.address.street.toLowerCase().includes(locQuery) ||
          (p.country && p.country.toLowerCase().includes(locQuery)) ||
          (p.region && p.region.toLowerCase().includes(locQuery));

        // 2. Transaction Mode / Intent (Buy / Rent / Invest)
        let matchesListingType = true;
        if (filters.listingType === ListingType.SALE || filters.mode === 'buy') {
          matchesListingType = p.listingType === ListingType.SALE;
        } else if (filters.listingType === ListingType.RENT || filters.mode === 'rent') {
          matchesListingType = p.listingType === ListingType.RENT;
        } else if (filters.listingType === ListingType.FOR_INVESTMENT || filters.mode === 'invest') {
          matchesListingType = p.listingType === ListingType.FOR_INVESTMENT || p.investmentType !== undefined || (p.targetReturn || 0) > 0;
        }

        // 3. Region and Country filter
        const matchesRegion = !filters.region || p.region === filters.region;
        const matchesCountry = !filters.country || p.country === filters.country;

        // 4. Price filter
        const matchesPrice = p.price >= filters.priceMin && p.price <= filters.priceMax;

        // 5. Property type
        const matchesPropertyType = filters.propertyType === PropertyType.ALL || p.propertyType === filters.propertyType;

        // 6. Bedrooms & Bathrooms
        const matchesBedrooms = filters.bedrooms === 0 || p.details.beds >= filters.bedrooms;
        const matchesBathrooms = filters.bathrooms === 0 || p.details.baths >= filters.bathrooms;

        // 7. African Infrastructure Filters
        let matchesInfra = true;
        if (filters.infrastructure && filters.infrastructure.length > 0) {
          for (const inf of filters.infrastructure) {
            if (inf === 'solar' && !p.hasSolar) matchesInfra = false;
            if (inf === 'generator' && !p.hasGenerator) matchesInfra = false;
            if (inf === 'borehole' && !p.hasBorehole) matchesInfra = false;
            if (inf === 'waterTank' && !p.hasWaterTank) matchesInfra = false;
            if (inf === 'fibre' && !p.hasFibre) matchesInfra = false;
          }
        }

        // 8. African Security Filters
        let matchesSec = true;
        if (filters.security && filters.security.length > 0) {
          const pSec = (p.securityFeatures || []).join(' ').toLowerCase();
          for (const sec of filters.security) {
            if (sec === 'gated' && !pSec.includes('gated')) matchesSec = false;
            if (sec === 'guards' && !pSec.includes('guard')) matchesSec = false;
            if (sec === 'cctv' && !pSec.includes('cctv')) matchesSec = false;
            if (sec === 'perimeter' && !pSec.includes('perimeter') && !pSec.includes('fence')) matchesSec = false;
          }
        }

        // 9. Accessibility / Proximity
        let matchesProx = true;
        if (filters.proximity && filters.proximity.length > 0) {
          const pProx = (p.proximity || []).join(' ').toLowerCase();
          for (const prox of filters.proximity) {
            if (prox === 'university' && !pProx.includes('university') && !pProx.includes('school')) matchesProx = false;
            if (prox === 'cbd' && !pProx.includes('cbd') && !pProx.includes('business')) matchesProx = false;
            if (prox === 'airport' && !pProx.includes('airport')) matchesProx = false;
            if (prox === 'hospital' && !pProx.includes('hospital')) matchesProx = false;
          }
        }

        // 10. Target Return Minimum
        let matchesYield = true;
        if (filters.targetReturnMin && filters.targetReturnMin > 0) {
          const y = p.targetReturn || p.rentalYield || p.marketROI || 0;
          if (y < filters.targetReturnMin) matchesYield = false;
        }

        // 11. Verified Properties Only
        const matchesVerified = !filters.verifiedOnly || p.verified === true;

        if (isTraditionalSearch) {
          const matchesAmenities = filters.amenities.length === 0 || filters.amenities.every(a => p.amenities.includes(a));
          return matchesLocation && matchesListingType && matchesRegion && matchesCountry && matchesPropertyType && matchesPrice && matchesBedrooms && matchesBathrooms && matchesAmenities && matchesInfra && matchesSec && matchesProx && matchesYield && matchesVerified;
        }

        if (isStaySearch) {
          const matchesGuests = !filters.guests || (p.guests || 0) >= filters.guests;
          return matchesLocation && [PropertyType.SHORT_TERM_RENTAL, PropertyType.HOTEL].includes(p.propertyType) && matchesGuests && matchesPrice && matchesVerified;
        }

        if (isTransportSearch) {
          const matchesVehicleType = !filters.vehicleType || p.vehicleType === filters.vehicleType;
          return matchesLocation && p.propertyType === filters.propertyType && matchesVehicleType && matchesPrice;
        }

        if (isWellnessSearch) {
          return matchesLocation && p.propertyType === filters.propertyType && matchesPrice;
        }

        return matchesLocation && matchesListingType && matchesPrice && matchesVerified;
    });

    // Apply Sorting
    filtered.sort((a, b) => {
      if (sortOrder === 'price_low') return a.price - b.price;
      if (sortOrder === 'price_high') return b.price - a.price;
      if (sortOrder === 'yield_high') {
        const yA = a.targetReturn || a.rentalYield || a.marketROI || 0;
        const yB = b.targetReturn || b.rentalYield || b.marketROI || 0;
        return yB - yA;
      }
      if (sortOrder === 'rating') return b.agent.rating - a.agent.rating;
      // Default: 'recommended'
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.agent.rating - a.agent.rating;
    });

    setFilteredProperties(filtered);
  }, [filters, allProperties, sortOrder]);


  // Derived State
  const featuredProperties = useMemo(() => {
    return allProperties.filter(p => p.featured && p.status === PropertyStatus.ACTIVE && ![PropertyType.HOTEL, PropertyType.SHORT_TERM_RENTAL, PropertyType.TRANSPORT, PropertyType.WELLNESS].includes(p.propertyType));
  }, [allProperties]);

  const recentProperties = useMemo(() => {
    return [...allProperties]
      .filter(p => ![PropertyType.HOTEL, PropertyType.SHORT_TERM_RENTAL, PropertyType.TRANSPORT, PropertyType.WELLNESS].includes(p.propertyType))
      .sort((a, b) => b.dateListed - a.dateListed)
      .slice(0, 3);
  }, [allProperties]);

  const savedProperties = useMemo(() => {
    return Array.from(savedPropertyIds).map(id => allProperties.find(p => p.id === id)).filter((p): p is Property => p !== undefined);
  }, [savedPropertyIds, allProperties]);
  
  const receivedInquiries = useMemo(() => {
      return tourRequests; 
  }, [tourRequests]);
  
  const notificationsWithReadStatus = useMemo(() => {
      return notifications
        .map(n => ({ ...n, isRead: readNotificationIds.has(n.id) }))
        .sort((a, b) => b.timestamp - a.timestamp);
  }, [notifications, readNotificationIds]);

  const computedEnquiryCounts = useMemo(() => {
      const merged: Record<string, number> = { ...enquiryCounts };
      tourRequests.forEach(tr => {
        if (tr.propertyId) {
          merged[tr.propertyId] = (merged[tr.propertyId] || 0) + 1;
        }
      });
      messages.forEach(msg => {
        if (msg.propertyId) {
          merged[msg.propertyId] = (merged[msg.propertyId] || 0) + 1;
        }
      });
      return merged;
  }, [enquiryCounts, tourRequests, messages]);

  const recordPropertyEnquiry = (propertyId: string) => {
      setEnquiryCounts(prev => {
        const next = { ...prev, [propertyId]: (prev[propertyId] || 0) + 1 };
        try {
          localStorage.setItem('afriestate_enquiry_counts', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
  };
  
  // Handlers
  const handleOpenVerificationModal = (property: Property) => {
    setVerificationProperty(property);
    setIsVerificationModalOpen(true);
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const handleSelectHub = (city: string, country: string, region: string, listingType?: ListingType) => {
    setFilters(prev => ({
      ...prev,
      location: city,
      country,
      region,
      listingType: listingType || prev.listingType,
      mode: listingType === ListingType.FOR_INVESTMENT ? 'invest' : prev.mode,
    }));
    scrollToSection('home', 'all-listings');
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const fallbackParseQuery = (q: string): Partial<SearchFilters> => {
    const lower = q.toLowerCase();
    const result: Partial<SearchFilters> = {};

    const knownLocations = [
      'cape town', 'johannesburg', 'sandton', 'camps bay', 'durban', 'lagos', 
      'abuja', 'victoria island', 'nairobi', 'westlands', 'kigali', 'accra', 
      'cantonments', 'cairo', 'casablanca', 'luanda', 'south africa', 'nigeria', 
      'kenya', 'ghana', 'rwanda', 'egypt', 'morocco', 'angola'
    ];
    for (const loc of knownLocations) {
      if (lower.includes(loc)) {
        result.location = loc.charAt(0).toUpperCase() + loc.slice(1);
        break;
      }
    }

    if (lower.includes('invest') || lower.includes('yield') || lower.includes('roi')) {
      result.mode = 'invest';
      result.listingType = ListingType.FOR_INVESTMENT;
    } else if (lower.includes('rent') || lower.includes('to let') || lower.includes('lease')) {
      result.mode = 'rent';
      result.listingType = ListingType.RENT;
    } else if (lower.includes('buy') || lower.includes('sale') || lower.includes('for sale')) {
      result.mode = 'buy';
      result.listingType = ListingType.SALE;
    }

    if (lower.includes('apartment') || lower.includes('flat')) {
      result.propertyType = PropertyType.APARTMENT;
    } else if (lower.includes('house') || lower.includes('villa') || lower.includes('mansion')) {
      result.propertyType = PropertyType.HOUSE;
    } else if (lower.includes('commercial') || lower.includes('office')) {
      result.propertyType = PropertyType.COMMERCIAL;
    }

    const bedMatch = lower.match(/(\d+)\s*(?:bed|bedroom)/);
    if (bedMatch) {
      result.bedrooms = parseInt(bedMatch[1], 10);
    }

    const infra: string[] = [];
    if (lower.includes('solar') || lower.includes('inverter')) infra.push('solar');
    if (lower.includes('generator') || lower.includes('genset')) infra.push('generator');
    if (lower.includes('borehole')) infra.push('borehole');
    if (lower.includes('water tank')) infra.push('water_tank');
    if (lower.includes('fibre') || lower.includes('fiber')) infra.push('fibre');
    if (infra.length > 0) result.infrastructure = infra;

    return result;
  };

  const handleAISearch = async (query: string) => {
    if (!query.trim()) return;
    setIsSearchingAI(true);
    try {
        const ai = new GoogleGenAI();
        const prompt = `Parse the following user query into a JSON object of search filters. Use the provided schema. If a value isn't specified, omit the key.
        Query: "${query}"`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: aiFilterSchema
            }
        });
        
        const parsedFilters = JSON.parse(response.text.trim());
        const newFilters = { ...initialFilters, ...parsedFilters };

        setFilters(newFilters);
        setActiveTab('all');
        scrollToSection('home', 'all-listings');

    } catch (error) {
        const fallback = fallbackParseQuery(query);
        setFilters(prev => ({ 
          ...prev, 
          ...fallback, 
          location: fallback.location || query 
        }));
        setActiveTab('all');
        scrollToSection('home', 'all-listings');
        addToast(`Filtered listings matching "${query}"`, 'info');
    } finally {
        setIsSearchingAI(false);
    }
  };
  
  const withRoleGate = (property: Property, action: (p: Property) => void) => {
      if (property.listingType === ListingType.FOR_INVESTMENT && currentUser?.role === 'user') {
          setIsUpgradeToInvestorModalOpen(true);
      } else {
          action(property);
      }
  };

  const withIdRoleGate = (propertyId: string, action: (id: string) => void) => {
      const property = [...allProperties, ...investmentProperties].find(p => p.id === propertyId);
      if (property && property.listingType === ListingType.FOR_INVESTMENT && currentUser?.role === 'user') {
          setIsUpgradeToInvestorModalOpen(true);
      } else {
          action(propertyId);
      }
  };

  const handleOpenDetailModal = async (property: Property) => {
    withRoleGate(property, async (p) => {
        setIsDashboardOpen(false);
        setSelectedProperty(p);
        setPage('property-detail');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        await incrementPropertyView(p.id);
        setAllProperties(prev => prev.map(item => item.id === p.id ? { ...item, views: (item.views || 0) + 1 } : item));
        try {
          const raw = localStorage.getItem('afriestate_view_counts');
          const counts = raw ? JSON.parse(raw) : {};
          counts[p.id] = (counts[p.id] || 0) + 1;
          localStorage.setItem('afriestate_view_counts', JSON.stringify(counts));
        } catch {
          // ignore
        }
    });
  };

  const handleSaveToggle = async (propertyId: string) => {
    withIdRoleGate(propertyId, async (id) => {
        if (!currentUser) {
            openAuthPage('login');
            return;
        }
        const newSaved = new Set(savedPropertyIds);
        let updatedProperties = [...allProperties];
        if (newSaved.has(id)) {
            newSaved.delete(id);
            updatedProperties = updatedProperties.map(p => p.id === id ? {...p, saves: p.saves - 1} : p);
        } else {
            newSaved.add(id);
            updatedProperties = updatedProperties.map(p => p.id === id ? {...p, saves: p.saves + 1} : p);
        }
        setSavedPropertyIds(newSaved);
        // FIX: Added explicit type cast to string[] for Array.from result to fix line 460 error
        await savePropertiesForUser(currentUser.username, Array.from(newSaved) as string[]);
        await saveProperties(updatedProperties);
        setAllProperties(updatedProperties);
    });
  };

  const handleToggleCompare = (property: Property) => {
    withRoleGate(property, (p) => {
        setCompareList(prev => {
            if (prev.some(item => item.id === p.id)) {
                return prev.filter(item => item.id !== p.id);
            }
            if (prev.length < 4) {
                return [...prev, p];
            }
            return prev;
        });
    });
  };
  
  const handleOpenCalculator = (property: Property) => {
    withRoleGate(property, (p) => {
      setSelectedProperty(p);
      setIsCalculatorOpen(true);
    });
  };
  
  const handleOpenTourModal = (property: Property) => {
    withRoleGate(property, (p) => {
      if (!currentUser) {
        openAuthPage('login');
        return;
      }
      setSelectedProperty(p);
      setIsTourModalOpen(true);
    });
  };

  const handleFindSimilar = (property: Property) => {
    withRoleGate(property, (p) => {
      setTargetPropertyForSimilar(p);
      setTimeout(() => {
        const recs = document.getElementById('recommendations');
        if (recs) recs.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
  };

  const handleOpenVRTour = (url: string) => {
    setVrTourUrl(url);
    setIsVRTourOpen(true);
  };
  
  const handleLogin = () => {
      setPage('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleLogout = async () => {
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error("Error signing out", error);
    }
    setCurrentUser(null);
    setIsDashboardOpen(false);
    setIsSessionWarningOpen(false);
  };

  const handleListPropertyClick = () => {
    if (!currentUser) {
        setPage('pricing');
        return;
    }
    
    if (currentUser.role === 'investor') {
        setIsInvestmentRequestModalOpen(true);
    } else if (currentUser.role === 'user') {
        setIsServiceListingFormOpen(true);
    } else if (currentUser.role === 'agent') {
        setPropertyToEdit(null);
        setIsPropertyFormOpen(true);
    }
  };

  const handleEditProperty = (property: Property) => {
    setPropertyToEdit(property);
    setIsPropertyFormOpen(true);
    setIsDashboardOpen(false);
  };

  const handleDeleteProperty = async (propertyId: string) => {
      if (window.confirm("Are you sure you want to delete this property?")) {
        const newProperties = allProperties.filter(p => p.id !== propertyId);
        setAllProperties(newProperties);
        await saveProperties(newProperties);
      }
  };

  const handleSaveProperty = async (property: Property) => {
    let newProperties;
    const existing = allProperties.find(p => p.id === property.id);
    if (existing) {
        newProperties = allProperties.map(p => p.id === property.id ? property : p);
    } else {
        newProperties = [...allProperties, property];
    }
    setAllProperties(newProperties);
    await saveProperties(newProperties);
    setIsPropertyFormOpen(false);
    setIsDashboardOpen(true);
  };
  
  const handleScheduleTour = async (request: Omit<TourRequest, 'id' | 'username' | 'status' | 'timestamp'>) => {
      if(currentUser) {
          const newRequest = await addTourRequest(currentUser.username, request.propertyId, request.propertyTitle, request.date, request.time);
          setTourRequests(prev => [...prev, newRequest]);
          if (request.propertyId) recordPropertyEnquiry(request.propertyId);
          setIsTourModalOpen(false);
          addToast("Tour requested successfully! The agent will be in touch.", "success");
      }
  };
  
  const handleSaveSearch = async () => {
    if (!currentUser) {
      openAuthPage('login');
      return;
    }
    const newSavedSearches = [...savedSearches, filters];
    setSavedSearches(newSavedSearches);
    await saveSearchesForUser(currentUser.username, newSavedSearches);
    addToast("Search saved!", "success");
  };

  const handleDeleteSearch = async (searchToDelete: SearchFilters) => {
      if (!currentUser) return;
      const newSavedSearches = savedSearches.filter(s => JSON.stringify(s) !== JSON.stringify(searchToDelete));
      setSavedSearches(newSavedSearches);
      await saveSearchesForUser(currentUser.username, newSavedSearches);
  };
  
  const handleRunSearch = (searchToRun: SearchFilters) => {
    setIsDashboardOpen(false);
    setFilters(searchToRun);
  };
  
  const handleMessageAgent = (property: Property) => {
      withRoleGate(property, (p) => {
          if (!currentUser) {
            openAuthPage('login');
            return;
          }
          setSelectedProperty(p);
          setIsMessageModalOpen(true);
      });
  };

  const handleSendMessage = async (text: string) => {
      if(currentUser && selectedProperty) {
          const newMessage = await sendMessage({
              propertyId: selectedProperty.id,
              propertyTitle: selectedProperty.title,
              senderUsername: currentUser.username,
              receiverUsername: selectedProperty.agent.name,
              text: text,
          });
          setMessages(prev => [...prev, newMessage]);
          recordPropertyEnquiry(selectedProperty.id);
          setIsMessageModalOpen(false);
      }
  };
  
  const handleLeaveReview = (agent: Property['agent']) => {
    setAgentForReview(agent);
    setIsReviewModalOpen(true);
  };
  
  const handleSubmitReview = async (reviewData: Omit<Review, 'id'|'timestamp'|'reviewerUsername'|'agentName'>) => {
      if(currentUser && agentForReview) {
          const newReview = await addReview({
              ...reviewData,
              agentName: agentForReview.name,
              reviewerUsername: currentUser.username,
          });
          setAgentReviews(prev => [...prev, newReview]);
          setIsReviewModalOpen(false);
          setAgentForReview(null);
      }
  };
  
  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.theme = newTheme;
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleAddEvent = async (eventData: Omit<CalendarEvent, 'id'>) => {
      if (!currentUser) return;
      const newEvent = await addEvent(currentUser.username, eventData);
      setCalendarEvents(prev => [...prev, newEvent]);
  };
  
  const handleUpdateEvent = async (event: CalendarEvent) => {
      if (!currentUser) return;
      const updatedEvent = await updateEvent(currentUser.username, event);
      setCalendarEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };
  
  const handleDeleteEvent = async (eventId: string) => {
      if (!currentUser) return;
      await deleteEvent(currentUser.username, eventId);
      setCalendarEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const handleUpdateAgentProfile = async (profile: AgentProfile) => {
      if (!currentUser) return;
      const updatedProfile = await updateAgentProfile(currentUser.username, profile);
      setAgentProfile(updatedProfile);
  };
  
  const handleOpenAIImprovementModal = (property: Property) => {
    setAIImprovementProperty(property);
    setIsAIImprovementModalOpen(true);
  };
  
  const handleUpdateInvestorSettings = async (settings: InvestorSettings) => {
      if(!currentUser) return;
      await saveInvestorSettings(currentUser.username, settings);
      setInvestorSettings(settings);
  };
  
  const handleSendInvestmentRequest = async (details: string) => {
      if (!currentUser) return;
      const newRequest = await addInvestmentRequest(currentUser.username, details);
      setInvestmentRequests(prev => [newRequest, ...prev]);
      setIsInvestmentRequestModalOpen(false);
      addToast('Your request has been sent to agents!', 'success');
  };

  const handleUpgradeAccountRequest = () => {
      setIsUpgradeToInvestorModalOpen(false);
      handlePlanSelect('investor');
  };
  
  const handleBlogClick = (post: BlogPost) => {
    setSelectedBlogPost(post);
    setIsBlogDetailModalOpen(true);
  };

  const handleOpenApplicationModal = (jobTitle: string) => {
    setIsCareersModalOpen(false);
    setApplyingForJob(jobTitle);
    setIsApplicationModalOpen(true);
  };

  const handleApplicationSubmit = () => {
    setIsApplicationModalOpen(false);
    alert(`Your application for '${applyingForJob}' has been successfully submitted! We'll be in touch.`);
    setApplyingForJob('');
  };

  const handleOpenNeighborhoodExplorer = (neighborhoodId?: string) => {
    setInitialNeighborhoodId(neighborhoodId);
    setPage('neighborhood-explorer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleSaveNeighborhoodToggle = (neighborhoodId: string) => {
    if (!currentUser) {
        openAuthPage('login');
        return;
    }
    setSavedNeighborhoodIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(neighborhoodId)) {
            newSet.delete(neighborhoodId);
        } else {
            newSet.add(neighborhoodId);
        }
        return newSet;
    });
};

  const handleContactProvider = (providerName: string) => {
    setAgentContactMode('chat');
    setAgentContactName(providerName);
    setIsAgentContactModalOpen(true);
  };

  const handleOpenProviderServices = (service: string, neighborhoodFilter?: string) => {
    setProviderServiceFilter(service);
    setInitialNeighborhoodFilter(neighborhoodFilter);
    setPage('find-professional');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlanSelect = (role: 'user' | 'agent' | 'investor') => {
      if (role === 'user') {
          openAuthPage('userSignup');
      } else if (role === 'agent') {
          openAuthPage('agentSignup');
      } else {
          openAuthPage('investorSignup');
      }
  };
  
  const handleMarkAsRead = async (id: string) => {
      if (!currentUser) return;
      const updatedReadIds = await markNotificationsAsRead(currentUser.username, [id]);
      setReadNotificationIds(updatedReadIds);
  };
  
  const handleMarkAllAsRead = async () => {
      if (!currentUser) return;
      const allIds = (notifications as any[]).map(n => n.id) as string[];
      const updatedReadIds = await markNotificationsAsRead(currentUser.username, allIds);
      setReadNotificationIds(updatedReadIds);
  };
  
  const handleNotificationClick = (notification: Notification) => {
      handleMarkAsRead(notification.id);
      if (notification.type === NotificationType.NEW_LISTING && notification.propertyId) {
          const property = allProperties.find(p => p.id === notification.propertyId);
          if (property) {
              handleOpenDetailModal(property);
          }
      }
      if (notification.type === NotificationType.INQUIRY) {
          setIsDashboardOpen(true);
      }
  };
  
  const clearTimers = () => {
      if (warningTimerRef.current) window.clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) window.clearTimeout(logoutTimerRef.current);
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
  };

  const handleStayLoggedIn = () => {
      setIsSessionWarningOpen(false);
      resetTimer();
  };

  const resetTimer = () => {
      clearTimers();
      if (currentUser) {
          warningTimerRef.current = window.setTimeout(() => {
              setSessionCountdown(60);
              setIsSessionWarningOpen(true);
              countdownIntervalRef.current = window.setInterval(() => {
                  setSessionCountdown(prev => prev - 1);
              }, 1000);
          }, WARNING_TIMEOUT);

          logoutTimerRef.current = window.setTimeout(() => {
              handleLogout();
          }, INACTIVITY_TIMEOUT);
      }
  };

  useEffect(() => {
      if (currentUser) {
          const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
          events.forEach(event => window.addEventListener(event, resetTimer));
          resetTimer();

          return () => {
              events.forEach(event => window.removeEventListener(event, resetTimer));
              clearTimers();
          };
      } else {
          clearTimers();
      }
  }, [currentUser]);

  const renderPage = () => {
    switch(page) {
      case 'auth':
          return (
            <AuthPage
              initialView={authPageView}
              onBack={() => scrollToSection('home')}
              onLogin={handleLogin}
              onSwitchToPricing={() => scrollToSection('pricing')}
              onSelectHotelManager={() => {
                setPage('hotel-registration');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSuperAdminLogin={() => {
                setIsSuperAdminLoggedIn(true);
                setPage('home');
              }}
            />
          );
      case 'property-detail':
          if (selectedProperty) {
            const liveProperty = allProperties.find(p => p.id === selectedProperty.id) || selectedProperty;
            return (
              <PropertyDetailPage
                property={liveProperty}
                allProperties={allProperties}
                currentUser={currentUser}
                isSaved={savedPropertyIds.has(selectedProperty.id)}
                isCompared={compareList.some(item => item.id === selectedProperty.id)}
                onBack={() => scrollToSection('home', 'all-listings')}
                onSelectProperty={handleOpenDetailModal}
                onSaveToggle={handleSaveToggle}
                onToggleCompare={handleToggleCompare}
                onOpenCalculator={handleOpenCalculator}
                onOpenTourModal={handleOpenTourModal}
                onOpenAgentContact={(mode, name) => {
                  setAgentContactMode(mode);
                  setAgentContactName(name);
                  setIsAgentContactModalOpen(true);
                }}
                onOpenVRTour={handleOpenVRTour}
                onMessageAgent={handleMessageAgent}
                onLeaveReview={handleLeaveReview}
              />
            );
          }
          return null;
      case 'about':
          return <AboutPage onExploreProperties={() => openAuthPage('login')} />;
      case 'services':
          return <ServicesPage onServiceClick={() => openAuthPage('login')} />;
      case 'contact':
          return <ContactPage />;
      case 'pricing':
          return <PricingPage onPlanSelect={handlePlanSelect} onBack={() => scrollToSection('home')} />;
      case 'rent-a-car':
          return <RentACarPage properties={allProperties.filter(p => p.propertyType === PropertyType.TRANSPORT)} />;
      case 'find-wellness':
          return <FindWellnessPage properties={allProperties.filter(p => p.propertyType === PropertyType.WELLNESS)} />;
      case 'book-a-stay':
          return <BookAStayPage properties={allProperties.filter(p => [PropertyType.HOTEL, PropertyType.SHORT_TERM_RENTAL].includes(p.propertyType))} />;
      case 'neighborhood-explorer':
          return (
            <NeighborhoodExplorerPage
              initialNeighborhoodId={initialNeighborhoodId}
              allProperties={allProperties}
              savedNeighborhoodIds={savedNeighborhoodIds}
              onSaveToggle={handleSaveNeighborhoodToggle}
              onBack={() => scrollToSection('home', 'neighborhoods')}
              onSelectProperty={handleOpenDetailModal}
              onFindProfessionalsInNeighborhood={(neighborhoodName) =>
                handleOpenProviderServices('All', neighborhoodName)
              }
            />
          );
      case 'find-professional':
          return (
            <FindProfessionalPage
              initialServiceFilter={providerServiceFilter}
              initialNeighborhoodFilter={initialNeighborhoodFilter}
              onBack={() => scrollToSection('home')}
              onContactProvider={handleContactProvider}
              onExploreNeighborhood={(neighborhoodId) =>
                handleOpenNeighborhoodExplorer(neighborhoodId)
              }
            />
          );
      case 'hotel-registration':
          return (
            <HotelRegistrationPage
              onBack={() => scrollToSection('home')}
              onSignInClick={() => openAuthPage('login')}
            />
          );
      case 'home':
      default:
          return (
              <>
                  <Hero 
                      onSearch={handleAISearch} 
                      isSearchingAI={isSearchingAI}
                      filters={filters}
                      onFilterChange={handleFilterChange}
                      onMarketSelect={() => scrollToSection('home', 'all-listings')}
                      properties={allProperties}
                      enquiryCounts={computedEnquiryCounts}
                      onOpenDetailModal={handleOpenDetailModal}
                  />

                  {/* Explore Africa Continental Geographic Hub Discovery */}
                  <div id="explore-africa">
                    <ExploreAfricaMap 
                      onSelectHub={handleSelectHub} 
                      activeFilters={filters} 
                    />
                  </div>
                  
                  <section id="just-listed" className="py-16 lg:py-24 bg-brand-light dark:bg-slate-950 relative z-10">
                  <div className="w-full px-4 sm:px-6 lg:px-10">
                      <div className="flex flex-col items-center mb-14">
                          <div className="w-12 h-1 bg-brand-secondary mb-6"></div>
                          <h2 className="text-4xl md:text-5xl font-black text-center text-brand-dark dark:text-white font-heading">Just Listed</h2>
                          <p className="mt-4 text-slate-500 dark:text-slate-400 font-light text-center max-w-2xl text-lg">Discover the newest properties added to our exclusive collection. Your next investment starts here.</p>
                      </div>
                      <PropertyList 
                          properties={recentProperties}
                          currentUser={currentUser}
                          onSaveToggle={handleSaveToggle}
                          savedPropertyIds={savedPropertyIds}
                          onOpenCalculator={handleOpenCalculator}
                          onOpenTourModal={handleOpenTourModal}
                          onFindSimilar={handleFindSimilar}
                          onOpenDetailModal={handleOpenDetailModal}
                          onToggleCompare={handleToggleCompare}
                          onOpenVRTour={handleOpenVRTour}
                          compareList={compareList}
                          onEdit={handleEditProperty}
                          onDelete={handleDeleteProperty}
                          isLoading={isLoadingProperties}
                      />
                  </div>
                  </section>

                  <section id="featured-listings" className="py-16 lg:py-24 bg-white dark:bg-slate-900">
                  <div className="w-full px-4 sm:px-6 lg:px-10">
                      <div className="flex flex-col items-center mb-14">
                          <div className="w-12 h-1 bg-brand-secondary mb-6"></div>
                          <h2 className="text-4xl md:text-5xl font-black text-center text-brand-dark dark:text-white font-heading">{t.app.featuredListings}</h2>
                          <p className="mt-4 text-slate-500 dark:text-slate-400 font-light text-center max-w-2xl text-lg">Curated selections that represent the pinnacle of luxury, comfort, and value across the continent.</p>
                      </div>
                      <PropertyList 
                      properties={featuredProperties}
                      currentUser={currentUser}
                      onSaveToggle={handleSaveToggle}
                      savedPropertyIds={savedPropertyIds}
                      onOpenCalculator={handleOpenCalculator}
                      onOpenTourModal={handleOpenTourModal}
                      onFindSimilar={handleFindSimilar}
                      onOpenDetailModal={handleOpenDetailModal}
                      onToggleCompare={handleToggleCompare}
                      onOpenVRTour={handleOpenVRTour}
                      compareList={compareList}
                      onEdit={handleEditProperty}
                      onDelete={handleDeleteProperty}
                      isLoading={isLoadingProperties}
                      />
                  </div>
                  </section>

                  <section className="py-20 lg:py-24 bg-[#0B1F1A] text-white">
                      <div className="w-full px-4 sm:px-6 lg:px-10">
                          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                              <div className="max-w-2xl">
                                  <p className="text-xs font-semibold tracking-widest uppercase text-amber-300 mb-2">
                                      Tailored Discovery
                                  </p>
                                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading tracking-tight text-white" style={{ textWrap: 'balance' }}>
                                      {t.app.exploreByLifestyle}
                                  </h2>
                              </div>
                              <p className="text-sm sm:text-base text-slate-300 max-w-md leading-relaxed">
                                  {t.app.exploreByLifestyleSubtitle}
                              </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
                          {CATEGORIES.map((category, idx) => {
                              const lifestyleMedia = [
                                { image: '/images/841376502.webp', actionLabel: 'Browse Short Stays', onClick: () => setPage('book-a-stay') },
                                { image: '/images/2a47542b078d54560485a1e72a5373aa9c3a4a48-800x535.avif', actionLabel: 'Explore Vehicles', onClick: () => setPage('rent-a-car') },
                                { image: '/images/getlstd-property-photo.jpg', actionLabel: 'Discover Retreats', onClick: () => setPage('find-wellness') },
                                { image: '/images/2ec34ce4ca57aef13fc8b3239a99345e.jpg', actionLabel: 'Search Long-Term', onClick: () => { handleFilterChange('mode', 'rent'); handleFilterChange('listingType', ListingType.RENT); scrollToSection('home', 'all-listings'); } },
                              ][idx] || { image: '/images/house_suburbs_1779978598551.png', actionLabel: 'Explore', onClick: () => scrollToSection('home', 'all-listings') };

                              return (
                                <CategoryCard
                                  key={category.titleKey}
                                  title={t.categories[category.titleKey as keyof typeof t.categories]}
                                  description={t.categories[category.descriptionKey as keyof typeof t.categories]}
                                  Icon={category.Icon}
                                  image={lifestyleMedia.image}
                                  indexLabel={`0${idx + 1}`}
                                  actionLabel={lifestyleMedia.actionLabel}
                                  onClick={lifestyleMedia.onClick}
                                />
                              );
                          })}
                          </div>
                      </div>
                  </section>

                  <section id="all-listings" className="py-16 md:py-24 bg-slate-50 dark:bg-slate-950">
                  <div className="w-full px-4 sm:px-6 lg:px-10">
                      {/* Section Title & Intent Summary */}
                      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                          <div>
                            <div className="text-xs uppercase tracking-widest text-emerald-600 font-semibold mb-1">
                              {filters.mode === 'invest' ? 'High-Yield Assets & Syndications' : filters.mode === 'rent' ? 'Verified African Rentals' : 'Prime Real Estate For Sale'}
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                              {filters.location ? `Properties in ${filters.location}` : t.app.findYourProperty}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              Showing {filteredProperties.length} verified listings across Africa with cadastre and surveyor checks.
                            </p>
                          </div>

                          {/* Quick Tabs: All vs Saved */}
                          <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setActiveTab('all')} 
                                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 shadow-xs'}`}
                              >
                                {t.app.allListings} ({filteredProperties.length})
                              </button>
                              <button 
                                onClick={() => setActiveTab('saved')} 
                                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all relative ${activeTab === 'saved' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 shadow-xs'}`}
                              >
                                {t.app.savedProperties}
                                {savedPropertyIds.size > 0 && (
                                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-900 text-[10px] font-bold">
                                    {savedPropertyIds.size}
                                  </span>
                                )}
                              </button>
                          </div>
                      </div>

                      {/* Top Bar for Results: Mobile filter trigger, Sort & View toggles */}
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                          {/* Mobile filter button */}
                          <button 
                            type="button"
                            onClick={() => setIsMobileFiltersOpen(true)}
                            className="lg:hidden inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters & Infrastructure
                          </button>

                          {/* Active filters summary */}
                          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <span className="font-semibold text-slate-900 dark:text-white">{activeTab === 'all' ? filteredProperties.length : savedProperties.length}</span> results found
                            {filters.verifiedOnly && <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-700 font-medium">Verified only</span>}
                            {filters.infrastructure.length > 0 && <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-amber-50 text-amber-800 font-medium">{filters.infrastructure.length} infra specs</span>}
                          </div>

                          {/* Right Controls: Sort Order & List/Map Toggle */}
                          <div className="flex items-center gap-3 ml-auto">
                              <div className="flex items-center gap-2">
                                <label htmlFor="sort-select" className="text-xs font-medium text-slate-500 hidden md:inline">Sort by:</label>
                                <select
                                  id="sort-select"
                                  value={sortOrder}
                                  onChange={(e) => setSortOrder(e.target.value as any)}
                                  className="text-xs font-medium bg-slate-100 dark:bg-slate-800 border-0 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                  <option value="recommended">Recommended & Featured</option>
                                  <option value="price_low">Price: Low to High</option>
                                  <option value="price_high">Price: High to Low</option>
                                  <option value="yield_high">Highest Yield / ROI %</option>
                                  <option value="rating">Top Agent Rating</option>
                                </select>
                              </div>

                              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                                  <button 
                                      onClick={() => setIsMapView(false)} 
                                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${!isMapView ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                                  >
                                      List
                                  </button>
                                  <button 
                                      onClick={() => setIsMapView(true)} 
                                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${isMapView ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                                  >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                      Map
                                  </button>
                              </div>

                              <button 
                                  onClick={handleSaveSearch} 
                                  title="Save current search criteria"
                                  className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                              >
                                  <BookmarkIcon className="w-4 h-4 text-emerald-600" />
                                  <span>Save</span>
                              </button>
                          </div>
                      </div>

                      {/* Main 2-Column Content: Sidebar + Cards */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                          {/* Desktop Sidebar (col-span-3) */}
                          <div className="hidden lg:block lg:col-span-3">
                              <BookingStyleFilterSidebar 
                                filters={filters} 
                                onFilterChange={handleFilterChange} 
                                onResetFilters={handleResetFilters} 
                                totalResultsCount={filteredProperties.length} 
                              />
                          </div>

                          {/* Results Column (col-span-9) */}
                          <div className="lg:col-span-9">
                              {isMapView ? (
                                <div className="rounded-xl overflow-hidden bg-white dark:bg-slate-900 p-2 shadow-sm">
                                   <MapInterface 
                                      properties={activeTab === 'all' ? filteredProperties : savedProperties} 
                                      onOpenDetailModal={handleOpenDetailModal}
                                   />
                                </div>
                              ) : activeTab === 'all' ? (
                                  filteredProperties.length > 0 ? (
                                      <PropertyList 
                                          properties={filteredProperties}
                                          currentUser={currentUser}
                                          onSaveToggle={handleSaveToggle}
                                          savedPropertyIds={savedPropertyIds}
                                          onOpenCalculator={handleOpenCalculator}
                                          onOpenTourModal={handleOpenTourModal}
                                          onFindSimilar={handleFindSimilar}
                                          onOpenDetailModal={handleOpenDetailModal}
                                          onToggleCompare={handleToggleCompare}
                                          onOpenVRTour={handleOpenVRTour}
                                          compareList={compareList}
                                          onEdit={handleEditProperty}
                                          onDelete={handleDeleteProperty}
                                          isLoading={isLoadingProperties}
                                          onOpenVerificationModal={handleOpenVerificationModal}
                                      />
                                  ) : (
                                      <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center shadow-sm">
                                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                          </div>
                                          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{t.app.noPropertiesFound}</h3>
                                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">{t.app.adjustFilters}</p>
                                          <button 
                                            onClick={handleResetFilters}
                                            className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                          >
                                            Reset all filters
                                          </button>
                                      </div>
                                  )
                              ) : (
                                  savedProperties.length > 0 ? (
                                      <PropertyList 
                                          properties={savedProperties}
                                          currentUser={currentUser}
                                          onSaveToggle={handleSaveToggle}
                                          savedPropertyIds={savedPropertyIds}
                                          onOpenCalculator={handleOpenCalculator}
                                          onOpenTourModal={handleOpenTourModal}
                                          onFindSimilar={handleFindSimilar}
                                          onOpenDetailModal={handleOpenDetailModal}
                                          onToggleCompare={handleToggleCompare}
                                          onOpenVRTour={handleOpenVRTour}
                                          compareList={compareList}
                                          onEdit={handleEditProperty}
                                          onDelete={handleDeleteProperty}
                                          isLoading={isLoadingProperties}
                                          onOpenVerificationModal={handleOpenVerificationModal}
                                      />
                                  ) : (
                                      <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center shadow-sm">
                                          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{t.app.noSavedProperties}</h3>
                                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Click the bookmark icon on any property card to save it for easy comparison.</p>
                                          <button 
                                            onClick={() => setActiveTab('all')}
                                            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                                          >
                                            Browse all properties
                                          </button>
                                      </div>
                                  )
                              )}
                          </div>
                      </div>
                  </div>
                  </section>
                  
                  {currentUser && savedProperties.length > 0 && 
                      <PersonalizedMatches 
                          savedProperties={savedProperties}
                          allProperties={allProperties}
                          currentUser={currentUser}
                          onSaveToggle={handleSaveToggle}
                          savedPropertyIds={savedPropertyIds}
                          onOpenCalculator={handleOpenCalculator}
                          onOpenTourModal={handleOpenTourModal}
                          onFindSimilar={handleFindSimilar}
                          onOpenDetailModal={handleOpenDetailModal}
                          onToggleCompare={handleToggleCompare}
                          onOpenVRTour={handleOpenVRTour}
                          compareList={compareList}
                          onEdit={handleEditProperty}
                          onDelete={handleDeleteProperty}
                      />
                  }
                  
                  <MarketInsights />

                  {targetPropertyForSimilar && 
                      <RecommendedProperties
                          targetProperty={targetPropertyForSimilar}
                          allProperties={allProperties}
                          currentUser={currentUser}
                          onSaveToggle={handleSaveToggle}
                          savedPropertyIds={savedPropertyIds}
                          onOpenCalculator={handleOpenCalculator}
                          onOpenTourModal={handleOpenTourModal}
                          onFindSimilar={handleFindSimilar}
                          onOpenDetailModal={handleOpenDetailModal}
                          onToggleCompare={handleToggleCompare}
                          onOpenVRTour={handleOpenVRTour}
                          compareList={compareList}
                          onEdit={handleEditProperty}
                          onDelete={handleDeleteProperty}
                      />
                  }

                  <FinancialServices 
                    onOpenMortgageCalculator={() => {
                      const target = allProperties.find(p => p.listingType === ListingType.SALE) || allProperties[0];
                      if (target) handleOpenCalculator(target);
                    }}
                    onExploreRentals={() => {
                      handleFilterChange('mode', 'rent');
                      handleFilterChange('listingType', ListingType.RENT);
                      scrollToSection('home', 'all-listings');
                    }}
                    onOpenProviderServices={(serviceFilter) => handleOpenProviderServices(serviceFilter || 'All')}
                  />
                  <NeighborhoodSection onOpenExplorer={handleOpenNeighborhoodExplorer} />
                  <BlogSection posts={blogPosts} onPostClick={handleBlogClick} isLoading={isLoadingBlog}/>
                  
                  {/* Home Page Closing Call to Action */}
                  <section className="w-full py-20 lg:py-24 bg-[#0B1F1A] text-white">
                      <div className="w-full px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                          <div className="lg:col-span-7">
                              <p className="text-xs font-semibold tracking-widest uppercase text-amber-300 mb-3">
                                  Ready to Transact with Certainty
                              </p>
                              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading tracking-tight text-white" style={{ textWrap: 'balance' }}>
                                  Experience Premium Real Estate Today
                              </h2>
                              <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                                  Join property seekers, diaspora buyers, institutional investors, and accredited agents operating across Africa with verified title checks and transparent market intelligence.
                              </p>

                              <div className="mt-8 pt-8 grid grid-cols-3 gap-6 max-w-lg">
                                  <div>
                                      <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-300">54</p>
                                      <p className="text-xs text-slate-400 mt-1">Continental Markets</p>
                                  </div>
                                  <div>
                                      <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">100%</p>
                                      <p className="text-xs text-slate-400 mt-1">Registry Verified</p>
                                  </div>
                                  <div>
                                      <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-300">24/7</p>
                                      <p className="text-xs text-slate-400 mt-1">Investor Desk</p>
                                  </div>
                              </div>
                          </div>

                          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end justify-center">
                              <button
                                  type="button"
                                  onClick={() => openAuthPage('signup')}
                                  className="inline-flex items-center justify-center gap-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm px-7 py-4 rounded-xl transition-colors w-full sm:w-auto lg:w-72"
                              >
                                  <span className="whitespace-nowrap">Create Free Account</span>
                                  <ArrowRightIcon className="w-4 h-4 shrink-0" />
                              </button>
                              <button
                                  type="button"
                                  onClick={() => scrollToSection('home', 'all-listings')}
                                  className="inline-flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-7 py-4 rounded-xl transition-colors w-full sm:w-auto lg:w-72"
                              >
                                  <span className="whitespace-nowrap">Browse Verified Listings</span>
                              </button>
                          </div>
                      </div>
                  </section>
              </>
          );
      }
  };


  return (
    <div className={`font-sans min-h-screen flex flex-col ${theme}`}>
      {isSuperAdminLoggedIn ? (
        <SuperAdminDashboard onClose={() => setIsSuperAdminLoggedIn(false)} />
      ) : null}
      <Header
        currentUser={currentUser}
        notifications={notificationsWithReadStatus}
        readNotificationIds={readNotificationIds}
        onLoginClick={() => openAuthPage('login')}
        onSignUpClick={() => setPage('pricing')}
        onDashboardClick={() => setIsDashboardOpen(true)}
        onListPropertyClick={handleListPropertyClick}
        onNotificationClick={handleNotificationClick}
        onMarkAllNotificationsAsRead={handleMarkAllAsRead}
        onHomeClick={() => scrollToSection('home')}
        onAboutClick={() => scrollToSection('about', 'about')}
        onServicesClick={() => scrollToSection('services', 'services')}
        onContactClick={() => scrollToSection('contact', 'contact')}
        onBuyClick={() => {
          handleFilterChange('mode', 'buy');
          handleFilterChange('listingType', ListingType.SALE);
          scrollToSection('home', 'all-listings');
        }}
        onRentClick={() => {
          handleFilterChange('mode', 'rent');
          handleFilterChange('listingType', ListingType.RENT);
          scrollToSection('home', 'all-listings');
        }}
        onInvestClick={() => {
          handleFilterChange('mode', 'invest');
          handleFilterChange('listingType', ListingType.FOR_INVESTMENT);
          scrollToSection('home', 'all-listings');
        }}
        onSellClick={handleListPropertyClick}
        onDevelopClick={() => {
          handleFilterChange('propertyType', PropertyType.IN_CONSTRUCTION);
          scrollToSection('home', 'all-listings');
        }}
        onExploreClick={() => scrollToSection('home', 'explore-africa')}
        savedCount={savedPropertyIds.size}
        onSavedClick={() => {
          setActiveTab('saved');
          scrollToSection('home', 'all-listings');
        }}
      />
      <main className="flex-grow">
        {renderPage()}
      </main>
      {page !== 'auth' && (
        <Footer 
          onAboutClick={() => scrollToSection('about', 'about')}
          onContactClick={() => scrollToSection('contact', 'contact')}
          onBlogClick={() => scrollToSection('home', 'blog')}
          onPrivacyPolicyClick={() => setIsPrivacyPolicyModalOpen(true)}
          onTermsOfServiceClick={() => setIsTermsOfServiceModalOpen(true)}
          onCareersClick={() => setIsCareersModalOpen(true)}
          onFindAProClick={() => handleOpenProviderServices('All')}
          onMarketJump={(loc) => {
            handleFilterChange('location', loc);
            setActiveTab('all');
            scrollToSection('home', 'all-listings');
          }}
          onModeJump={(mode) => {
            handleFilterChange('mode', mode);
            handleFilterChange('listingType', mode === 'buy' ? ListingType.SALE : mode === 'rent' ? ListingType.RENT : ListingType.FOR_INVESTMENT);
            setActiveTab('all');
            scrollToSection('home', 'all-listings');
          }}
        />
      )}
      <Chatbot />
      
      {selectedProperty && <MortgageCalculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} propertyPrice={selectedProperty.price} propertyTitle={selectedProperty.title} />}
      {selectedProperty && <ScheduleTourModal isOpen={isTourModalOpen} onClose={() => setIsTourModalOpen(false)} propertyTitle={selectedProperty.title} propertyId={selectedProperty.id} agentName={selectedProperty.agent.name} onSubmit={handleScheduleTour} />}
      {compareList.length > 0 && <CompareBar properties={compareList} onCompare={() => setIsCompareModalOpen(true)} onClear={() => setCompareList([])} onRemove={(p) => setCompareList(prev => prev.filter(item => item.id !== p.id))} />}
      <CompareModal isOpen={isCompareModalOpen} onClose={() => setIsCompareModalOpen(false)} properties={compareList} />
      {currentUser && 
          <UserDashboardModal
            isOpen={isDashboardOpen}
            onClose={() => setIsDashboardOpen(false)}
            user={currentUser}
            allProperties={allProperties}
            investmentProperties={investmentProperties}
            tourRequests={tourRequests}
            receivedInquiries={receivedInquiries}
            savedSearches={savedSearches}
            savedProperties={savedProperties}
            propertiesToCompare={compareList}
            messages={messages}
            calendarEvents={calendarEvents}
            agentProfile={agentProfile}
            agentReviews={agentReviews}
            leads={leads}
            agentAchievements={agentAchievements}
            investorAchievements={investorAchievements}
            investmentRequests={investmentRequests}
            investorSettings={investorSettings}
            currency={currency}
            theme={theme}
            onLogout={handleLogout}
            onEditProperty={handleEditProperty}
            onDeleteProperty={handleDeleteProperty}
            onDraftReply={(inquiry) => {setInquiryForResponse(inquiry); setIsAIResponseModalOpen(true);}}
            onRunSearch={handleRunSearch}
            onDeleteSearch={handleDeleteSearch}
            onListPropertyClick={handleListPropertyClick}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onOpenAIImprovementModal={handleOpenAIImprovementModal}
            onUpdateAgentProfile={handleUpdateAgentProfile}
            onUpdateAgentAchievements={setAgentAchievements}
            onUpdateInvestorAchievements={setInvestorAchievements}
            onUpdateInvestorSettings={handleUpdateInvestorSettings}
            onThemeToggle={handleThemeToggle}
            onCompareClick={() => setIsCompareModalOpen(true)}
            onCurrencyChange={setCurrency}
            onUpgradeAccountRequest={handleUpgradeAccountRequest}
            onSaveToggle={handleSaveToggle}
            savedPropertyIds={savedPropertyIds}
            onOpenCalculator={handleOpenCalculator}
            onOpenTourModal={handleOpenTourModal}
            onFindSimilar={handleFindSimilar}
            onOpenDetailModal={handleOpenDetailModal}
            onToggleCompare={handleToggleCompare}
            onOpenVRTour={handleOpenVRTour}
          />
      }
      {currentUser && <PropertyFormModal isOpen={isPropertyFormOpen} onClose={() => setIsPropertyFormOpen(false)} onSave={handleSaveProperty} propertyToEdit={propertyToEdit} currentUser={currentUser} />}
      {currentUser && <ServiceListingFormModal currentUser={currentUser} isOpen={isServiceListingFormOpen} onClose={() => setIsServiceListingFormOpen(false)} />}
      {inquiryForResponse && <AIResponseModal isOpen={isAIResponseModalOpen} onClose={() => setIsAIResponseModalOpen(false)} tourRequest={inquiryForResponse} />}
      <AgentContactModal isOpen={isAgentContactModalOpen} onClose={() => setIsAgentContactModalOpen(false)} mode={agentContactMode} agentName={agentContactName} />
      <VRTourModal isOpen={isVRTourOpen} onClose={() => setIsVRTourOpen(false)} url={vrTourUrl} />
      {selectedProperty && <MessageModal isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} property={selectedProperty} onSend={handleSendMessage} />}
      {agentForReview && <AgentReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} agentName={agentForReview.name} onSubmit={handleSubmitReview} />}
      {aiImprovementProperty && <AIImprovementModal isOpen={isAIImprovementModalOpen} onClose={() => setIsAIImprovementModalOpen(false)} property={aiImprovementProperty} />}
      {currentUser?.role === 'investor' && <InvestmentRequestModal isOpen={isInvestmentRequestModalOpen} onClose={() => setIsInvestmentRequestModalOpen(false)} onSendRequest={handleSendInvestmentRequest} />}
      <UpgradeToInvestorModal 
        isOpen={isUpgradeToInvestorModalOpen}
        onClose={() => setIsUpgradeToInvestorModalOpen(false)}
        onConfirm={handleUpgradeAccountRequest}
      />
      <PrivacyPolicyModal isOpen={isPrivacyPolicyModalOpen} onClose={() => setIsPrivacyPolicyModalOpen(false)} />
      <TermsOfServiceModal isOpen={isTermsOfServiceModalOpen} onClose={() => setIsTermsOfServiceModalOpen(false)} />
      <CareersModal 
        isOpen={isCareersModalOpen} 
        onClose={() => setIsCareersModalOpen(false)}
        onApplyClick={handleOpenApplicationModal}
      />
      <ApplicationModal
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
        jobTitle={applyingForJob}
        onSubmit={handleApplicationSubmit}
      />
      <ServiceRegistrationModal 
        isOpen={isServiceRegistrationModalOpen}
        onClose={() => setIsServiceRegistrationModalOpen(false)}
      />
       {selectedBlogPost && (
          <BlogDetailModal
              isOpen={isBlogDetailModalOpen}
              onClose={() => setIsBlogDetailModalOpen(false)}
              post={selectedBlogPost}
              onContactClick={() => {
                  setIsBlogDetailModalOpen(false);
                  setPage('contact');
              }}
          />
       )}
       <SessionTimeoutModal
            isOpen={isSessionWarningOpen}
            onClose={handleStayLoggedIn}
            onLogout={handleLogout}
            countdown={sessionCountdown}
        />

       {/* Title Deed Verification Modal */}
       <PropertyVerificationModal
         isOpen={isVerificationModalOpen}
         onClose={() => setIsVerificationModalOpen(false)}
         property={verificationProperty}
       />

       {/* Mobile Booking.com Filters Drawer */}
       {isMobileFiltersOpen && (
         <div className="fixed inset-0 z-50 overflow-y-auto lg:hidden">
           <div 
             className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
             onClick={() => setIsMobileFiltersOpen(false)} 
           />
           <div className="relative min-h-full flex items-end justify-center sm:items-center p-0 sm:p-4">
             <div className="relative bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-4 shadow-2xl">
               <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                 <h3 className="text-base font-bold text-slate-900">Filters & Infrastructure</h3>
                 <button 
                   onClick={() => setIsMobileFiltersOpen(false)}
                   className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                 >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
               <BookingStyleFilterSidebar 
                 filters={filters} 
                 onFilterChange={handleFilterChange} 
                 onResetFilters={handleResetFilters} 
                 totalResultsCount={filteredProperties.length} 
               />
               <div className="mt-4 pt-3 border-t border-slate-200">
                 <button 
                   onClick={() => setIsMobileFiltersOpen(false)}
                   className="w-full py-2.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                 >
                   Show {filteredProperties.length} Results
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default App;