import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { supabase } from './lib/supabase';
import Header from './components/Header';
import Footer from './components/Footer';
import Hero from './components/Hero';
import PropertyList from './components/PropertyList';
import { CATEGORIES, AGENT_ACHIEVEMENTS, INVESTOR_ACHIEVEMENTS } from './constants';
import type { Property, SearchFilters, TourRequest, User, Message, Review, CalendarEvent, AgentProfile, Lead, Achievement, InvestorSettings, InvestmentRequest, BlogPost, Notification } from './types';
import { ListingType, PropertyType, PropertyStatus, NotificationType } from './types';
import CategoryCard from './components/CategoryCard';
import Chatbot from './components/Chatbot';
import MortgageCalculator from './components/MortgageCalculator';
import ScheduleTourModal from './components/ScheduleTourModal';
import MarketInsights from './components/MarketInsights';
import RecommendedProperties from './components/RecommendedProperties';
import PropertyDetailModal from './components/PropertyDetailModal';
import CompareBar from './components/CompareBar';
import CompareModal from './components/CompareModal';
import { AuthModal } from './components/AuthModal';
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
import { GoogleGenAI, Type } from "@google/genai";
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import TermsOfServiceModal from './components/TermsOfServiceModal';
import CareersModal from './components/CareersModal';
import ApplicationModal from './components/ApplicationModal';
import NeighborhoodExplorerModal from './components/NeighborhoodExplorerModal';
import ServiceRegistrationModal from './components/ServiceRegistrationModal';
import BlogDetailModal from './components/BlogDetailModal';
import ProviderServicesModal from './components/ProviderServicesModal';
import SessionTimeoutModal from './components/SessionTimeoutModal';
import RealTimeNews from './components/RealTimeNews';
import NewOfferings from './components/NewOfferings';
import { useToast } from './contexts/ToastContext';
import { useAdminState } from './contexts/AdminStateContext';
import MapInterface from './components/MapInterface';

import SuperAdminDashboard from './components/dashboards/SuperAdminDashboard';

// Page components
import AboutPage from './components/pages/AboutPage';
import ContactPage from './components/pages/ContactPage';
import ServicesPage from './components/pages/ServicesPage';
import PricingPage from './components/pages/PricingPage';
import RentACarPage from './components/pages/RentACarPage';
import FindWellnessPage from './components/pages/FindWellnessPage';
import BookAStayPage from './components/pages/BookAStayPage';

// FIX: Added 'userSignup' to the AuthView type to allow setting this view state, resolving a TypeScript error.
type AuthView = 'login' | 'signup' | 'userSignup' | 'agentSignup' | 'investorSignup' | 'pendingVerificationAgent' | 'pendingVerificationInvestor' | 'forgotPassword' | 'resetConfirmation';
type Page = 'home' | 'about' | 'services' | 'contact' | 'pricing' | 'rent-a-car' | 'find-wellness' | 'book-a-stay';

const initialFilters: SearchFilters = {
    location: '',
    listingType: ListingType.ALL,
    propertyType: PropertyType.ALL,
    priceMin: 0,
    priceMax: 10000000,
    bedrooms: 0,
    bathrooms: 0,
    amenities: [],
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthView>('login');
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
  const [isNeighborhoodExplorerOpen, setIsNeighborhoodExplorerOpen] = useState(false);
  const [initialNeighborhoodId, setInitialNeighborhoodId] = useState<string | undefined>(undefined);
  const [isServiceRegistrationModalOpen, setIsServiceRegistrationModalOpen] = useState(false);
  const [isBlogDetailModalOpen, setIsBlogDetailModalOpen] = useState(false);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [isProviderServicesModalOpen, setIsProviderServicesModalOpen] = useState(false);
  const [providerServiceFilter, setProviderServiceFilter] = useState<string | undefined>(undefined);
  
  const [isSessionWarningOpen, setIsSessionWarningOpen] = useState(false);
  const [sessionCountdown, setSessionCountdown] = useState(60);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoadingBlog, setIsLoadingBlog] = useState(true);
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
        const investmentProps = allProps.filter(p => p.listingType === ListingType.FOR_INVESTMENT);

        setAllProperties(allProps);
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

  // AI Blog Generation
    useEffect(() => {
        const generateAndCacheBlogPosts = async () => {
            setIsLoadingBlog(true);
            const cachedPosts = localStorage.getItem('blogPosts');
            if (cachedPosts) {
                setBlogPosts(JSON.parse(cachedPosts));
                setIsLoadingBlog(false);
                return;
            }

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                const prompt = `Generate 3 educational, industry-relevant blog posts for a real estate marketplace called AfriEstate. Provide a JSON array.

Each object must have the following fields: 'title', 'author', 'date', 'image', 'summary', and 'content'.

The 'content' field MUST be a single Markdown string adhering to these professional formatting guidelines:

1.  **Headings**: All section headings must be bold. Use H2 markdown ('## Major Section Heading') for main sections.
2.  **Paragraphs**: Write in short, readable paragraphs (2-4 sentences each). **Crucially, you MUST use a double line break (a completely empty line) between paragraphs in the Markdown to ensure proper spacing.**
3.  **Structure**: The article must follow this structure:
    *   An **Introduction** that grabs the reader's attention.
    *   A **Main Body** organized with clear, bold headings (H2s).
    *   A **Key Takeaways** section summarizing the main points, under its own bold heading.
    *   A **Call-to-Action (CTA)** at the end, under its own bold heading.
4.  **Formatting**: Use lists and bold text for emphasis where appropriate.

The other fields should follow these rules:
- 'title': A clear, concise, and keyword-optimized title.
- 'author': A realistic-sounding author name.
- 'date': A recent date, e.g., "October 28, 2023".
- 'image': A relevant, high-quality image URL from picsum.photos, e.g., https://picsum.photos/seed/blog1/400/250. Use a different seed for each post.
- 'summary': A concise one-sentence summary of the article.
`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: { responseMimeType: 'application/json', responseSchema: blogSchema }
                });
                
                const posts = JSON.parse(response.text.trim());
                if (Array.isArray(posts)) {
                    localStorage.setItem('blogPosts', JSON.stringify(posts));
                    setBlogPosts(posts);
                }
            } catch (error) {
                console.error("Failed to generate blog posts:", error);
            } finally {
                setIsLoadingBlog(false);
            }
        };
        
        generateAndCacheBlogPosts();
    }, []);
  
  // Centralized Filtering Logic
  useEffect(() => {
    const isTraditionalSearch = [PropertyType.ALL, PropertyType.APARTMENT, PropertyType.HOUSE, PropertyType.COMMERCIAL, PropertyType.STUDENT_HOUSING, PropertyType.TOWNSHIP, PropertyType.RURAL, PropertyType.LAND, PropertyType.LUXURY_ESTATE, PropertyType.IN_CONSTRUCTION].includes(filters.propertyType);
    const isStaySearch = [PropertyType.SHORT_TERM_RENTAL, PropertyType.HOTEL].includes(filters.propertyType);
    const isTransportSearch = filters.propertyType === PropertyType.TRANSPORT;
    const isWellnessSearch = filters.propertyType === PropertyType.WELLNESS;

    const filtered = allProperties.filter(p => {
        const matchesLocation = filters.location === '' || p.address.city.toLowerCase().includes(filters.location.toLowerCase()) || p.address.street.toLowerCase().includes(filters.location.toLowerCase());
        const matchesPrice = p.price >= filters.priceMin && p.price <= filters.priceMax;

        if (isTraditionalSearch) {
             const matchesListingType = filters.listingType === ListingType.ALL || p.listingType === filters.listingType;
             const matchesPropertyType = filters.propertyType === PropertyType.ALL || p.propertyType === filters.propertyType;
             const matchesBedrooms = filters.bedrooms === 0 || p.details.beds >= filters.bedrooms;
             const matchesBathrooms = filters.bathrooms === 0 || p.details.baths >= filters.bathrooms;
             const matchesAmenities = filters.amenities.length === 0 || filters.amenities.every(a => p.amenities.includes(a));
             return matchesLocation && matchesListingType && matchesPropertyType && matchesPrice && matchesBedrooms && matchesBathrooms && matchesAmenities;
        }

        if (isStaySearch) {
            const matchesGuests = !filters.guests || (p.guests || 0) >= filters.guests;
            return matchesLocation && [PropertyType.SHORT_TERM_RENTAL, PropertyType.HOTEL].includes(p.propertyType) && matchesGuests && matchesPrice;
        }

        if (isTransportSearch) {
            const matchesVehicleType = !filters.vehicleType || p.vehicleType === filters.vehicleType;
            return matchesLocation && p.propertyType === filters.propertyType && matchesVehicleType && matchesPrice;
        }

        if (isWellnessSearch) {
            return matchesLocation && p.propertyType === filters.propertyType && matchesPrice;
        }

        return matchesLocation && matchesPrice;
    });
    setFilteredProperties(filtered);
  }, [filters, allProperties]);


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
  
  // Handlers
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAISearch = async (query: string) => {
    if (!query.trim()) return;
    setIsSearchingAI(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const prompt = `Parse the following user query into a JSON object of search filters. Use the provided schema. If a value isn't specified, omit the key.
        Query: "${query}"`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
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

    } catch (error) {
        console.error("AI Search Error:", error);
        alert("Sorry, I couldn't understand that search. Please try rephrasing.");
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
        setSelectedProperty(p);
        setIsDetailModalOpen(true);
        await incrementPropertyView(p.id);
        setAllProperties(prev => prev.map(item => item.id === p.id ? { ...item, views: (item.views || 0) + 1 } : item));
    });
  };

  const handleSaveToggle = async (propertyId: string) => {
    withIdRoleGate(propertyId, async (id) => {
        if (!currentUser) {
            setAuthModalView('login');
            setIsAuthModalOpen(true);
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
        setAuthModalView('login');
        setIsAuthModalOpen(true);
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
      setIsAuthModalOpen(false);
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
          setIsTourModalOpen(false);
          addToast("Tour requested successfully! The agent will be in touch.", "success");
      }
  };
  
  const handleSaveSearch = async () => {
    if (!currentUser) {
      setAuthModalView('login');
      setIsAuthModalOpen(true);
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
            setAuthModalView('login');
            setIsAuthModalOpen(true);
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
    setIsNeighborhoodExplorerOpen(true);
  };
  
  const handleSaveNeighborhoodToggle = (neighborhoodId: string) => {
    if (!currentUser) {
        setAuthModalView('login');
        setIsAuthModalOpen(true);
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

  const handleOpenProviderServices = (service: string) => {
    setPage('home');
    setProviderServiceFilter(service);
    setIsProviderServicesModalOpen(true);
  };

  const handlePlanSelect = (role: 'user' | 'agent' | 'investor') => {
      setPage('home');
      if (role === 'user') {
          setAuthModalView('userSignup');
      } else if (role === 'agent') {
          setAuthModalView('agentSignup');
      } else {
          setAuthModalView('investorSignup');
      }
      setIsAuthModalOpen(true);
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
      case 'about':
          return <AboutPage onExploreProperties={() => setIsAuthModalOpen(true)} />;
      case 'services':
          return <ServicesPage onServiceClick={() => setIsAuthModalOpen(true)} />;
      case 'contact':
          return <ContactPage />;
      case 'pricing':
          return <PricingPage onPlanSelect={handlePlanSelect} />;
      case 'rent-a-car':
          return <RentACarPage properties={allProperties.filter(p => p.propertyType === PropertyType.TRANSPORT)} />;
      case 'find-wellness':
          return <FindWellnessPage properties={allProperties.filter(p => p.propertyType === PropertyType.WELLNESS)} />;
      case 'book-a-stay':
          return <BookAStayPage properties={allProperties.filter(p => [PropertyType.HOTEL, PropertyType.SHORT_TERM_RENTAL].includes(p.propertyType))} />;
      case 'home':
      default:
          return (
              <>
                  <Hero 
                      onSearch={handleAISearch} 
                      isSearchingAI={isSearchingAI}
                      filters={filters}
                      onFilterChange={handleFilterChange}
                  />

                  <NewOfferings 
                      onRentCarClick={() => setPage('rent-a-car')} 
                      onFindWellnessClick={() => setPage('find-wellness')}
                      onBookStayClick={() => setPage('book-a-stay')}
                  />
                  
                  <section id="just-listed" className="py-24 bg-brand-light relative z-10 -mt-8 rounded-t-[3xl]">
                  <div className="container mx-auto px-4 sm:px-6">
                      <div className="flex flex-col items-center mb-16">
                          <div className="w-12 h-1 bg-brand-secondary mb-6"></div>
                          <h2 className="text-4xl md:text-5xl font-black text-center text-brand-dark font-heading">Just Listed</h2>
                          <p className="mt-4 text-slate-500 font-light text-center max-w-2xl text-lg">Discover the newest properties added to our exclusive collection. Your next investment starts here.</p>
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

                  <section id="featured-listings" className="py-24 bg-white">
                  <div className="container mx-auto px-4 sm:px-6">
                      <div className="flex flex-col items-center mb-16">
                          <div className="w-12 h-1 bg-brand-secondary mb-6"></div>
                          <h2 className="text-4xl md:text-5xl font-black text-center text-brand-dark font-heading">{t.app.featuredListings}</h2>
                          <p className="mt-4 text-slate-500 font-light text-center max-w-2xl text-lg">Curated selections that represent the pinnacle of luxury, comfort, and value across the continent.</p>
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

                  <section className="py-24 bg-brand-dark text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-secondary rounded-full filter blur-[120px] opacity-10 -mr-[400px] -mt-[400px]"></div>
                      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-primary rounded-full filter blur-[100px] opacity-10 -ml-[300px] -mb-[300px]"></div>
                      
                      <div className="container mx-auto px-4 sm:px-6 relative z-10">
                          <div className="text-center mb-16">
                              <h2 className="text-4xl md:text-5xl font-black font-heading tracking-tight mb-6">{t.app.exploreByLifestyle}</h2>
                              <p className="text-center text-slate-300 font-light mt-4 max-w-2xl mx-auto text-lg">{t.app.exploreByLifestyleSubtitle}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                          {CATEGORIES.map(category => (
                              <div key={category.titleKey} className="transform hover:-translate-y-2 transition-all duration-300">
                                <CategoryCard title={t.categories[category.titleKey as keyof typeof t.categories]} description={t.categories[category.descriptionKey as keyof typeof t.categories]} Icon={category.Icon} />
                              </div>
                          ))}
                          </div>
                      </div>
                  </section>

                  <section id="all-listings" className="py-24 bg-brand-light">
                  <div className="container mx-auto px-4 sm:px-6">
                      <div className="flex flex-col items-center mb-12">
                          <h2 className="text-4xl md:text-5xl font-black text-center text-brand-dark font-heading mb-6">{t.app.findYourProperty}</h2>
                      </div>
                      <div className="flex justify-between items-center w-full mb-10">
                          <div className="flex items-center gap-4">
                              <button onClick={() => setActiveTab('all')} className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${activeTab === 'all' ? 'bg-brand-primary text-white' : 'bg-white/50 text-brand-dark'}`}>{t.app.allListings}</button>
                              <button onClick={() => setActiveTab('saved')} className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors relative ${activeTab === 'saved' ? 'bg-brand-primary text-white' : 'bg-white/50 text-brand-dark'}`}>
                              {t.app.savedProperties}
                              {savedPropertyIds.size > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-white text-xs font-bold">{savedPropertyIds.size}</span>}
                              </button>
                          </div>
                          
                          <div className="flex items-center gap-4">
                              <div className="flex bg-white/50 rounded-lg p-1 border border-brand-primary/20">
                                  <button onClick={() => setIsMapView(false)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${!isMapView ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-brand-dark'}`}>
                                      List View
                                  </button>
                                  <button onClick={() => setIsMapView(true)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 ${isMapView ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-brand-dark'}`}>
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                      Map View
                                  </button>
                              </div>
                              <button onClick={handleSaveSearch} className="flex items-center gap-2 bg-white/50 text-brand-dark dark:text-white px-4 py-2 rounded-lg font-semibold hover:bg-white transition-colors border border-brand-primary/20">
                                  <BookmarkIcon className="w-5 h-5 text-brand-primary" />
                                  {t.app.saveSearch}
                              </button>
                          </div>
                      </div>
                      
                      {activeTab === 'all' && !isMapView && <p className="text-center text-slate-500 dark:text-slate-400 mb-8">{t.app.showingResults.replace('{{count}}', String(filteredProperties.length))}</p>}
                      {activeTab === 'saved' && !isMapView && <p className="text-center text-slate-500 dark:text-slate-400 mb-8">{t.app.savedCount.replace('{{count}}', String(savedProperties.length))}</p>}
                      
                      {isMapView ? (
                        <div className="mb-12">
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
                              />
                          ) : <p className="text-center text-slate-500 dark:text-slate-400">{t.app.noPropertiesFound}<br/>{t.app.adjustFilters}</p>
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
                              />
                          ) : <p className="text-center text-slate-500 dark:text-slate-400">{t.app.noSavedProperties}</p>
                      )}

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
                  <RealTimeNews />

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

                  <FinancialServices />
                  <NeighborhoodSection onOpenExplorer={handleOpenNeighborhoodExplorer} />
                  <BlogSection posts={blogPosts} onPostClick={handleBlogClick} isLoading={isLoadingBlog}/>
                  
                  {/* Home Page Call to Action */}
                  <section className="py-24 bg-brand-light relative overflow-hidden text-center sm:text-left">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-secondary rounded-full filter blur-[100px] opacity-20 -mr-48 -mt-48"></div>
                      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-primary rounded-full filter blur-[100px] opacity-20 -ml-48 -mb-48"></div>
                      <div className="container mx-auto px-6 relative z-10 max-w-5xl">
                          <div className="bg-brand-dark rounded-[3rem] p-12 md:p-20 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12 text-white">
                              <div className="text-left flex-1">
                                  <h2 className="text-4xl md:text-5xl font-black font-heading mb-6">Experience Premium Real Estate Today</h2>
                                  <p className="text-lg md:text-xl font-light text-slate-300 max-w-xl">
                                      Join thousands of property seekers, investors, and homeowners experiencing the simplest and most powerful estate platform in Africa. Create your account in minutes.
                                  </p>
                              </div>
                              <div className="flex-shrink-0 w-full md:w-auto">
                                  <button onClick={() => setPage('pricing')} className="bg-brand-primary text-white font-bold text-lg px-10 py-5 rounded-full hover:bg-white hover:text-brand-dark transition-all transform hover:-translate-y-1 shadow-2xl flex items-center justify-center gap-3 w-full sm:w-auto">
                                      Sign Up Now <ArrowRightIcon className="w-6 h-6"/>
                                  </button>
                              </div>
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
        onLoginClick={() => { setAuthModalView('login'); setIsAuthModalOpen(true); }}
        onSignUpClick={() => setPage('pricing')}
        onDashboardClick={() => setIsDashboardOpen(true)}
        onListPropertyClick={handleListPropertyClick}
        onNotificationClick={handleNotificationClick}
        onMarkAllNotificationsAsRead={handleMarkAllAsRead}
        onHomeClick={() => scrollToSection('home')}
        onAboutClick={() => scrollToSection('about', 'about')}
        onServicesClick={() => scrollToSection('services', 'services')}
        onContactClick={() => scrollToSection('contact', 'contact')}
      />
      <main className="flex-grow">
        {renderPage()}
      </main>
      <Footer 
        onAboutClick={() => scrollToSection('about', 'about')}
        onContactClick={() => scrollToSection('contact', 'contact')}
        onBlogClick={() => scrollToSection('home', 'blog')}
        onPrivacyPolicyClick={() => setIsPrivacyPolicyModalOpen(true)}
        onTermsOfServiceClick={() => setIsTermsOfServiceModalOpen(true)}
        onCareersClick={() => setIsCareersModalOpen(true)}
        onFindAProClick={() => setIsProviderServicesModalOpen(true)}
      />
      <Chatbot />
      
      {selectedProperty && <MortgageCalculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} propertyPrice={selectedProperty.price} propertyTitle={selectedProperty.title} />}
      {selectedProperty && <ScheduleTourModal isOpen={isTourModalOpen} onClose={() => setIsTourModalOpen(false)} propertyTitle={selectedProperty.title} propertyId={selectedProperty.id} agentName={selectedProperty.agent.name} onSubmit={handleScheduleTour} />}
      {selectedProperty && <PropertyDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} property={selectedProperty} currentUser={currentUser} onOpenAgentContact={(mode, name) => { setAgentContactMode(mode); setAgentContactName(name); setIsAgentContactModalOpen(true); }} onOpenVRTour={handleOpenVRTour} onMessageAgent={handleMessageAgent} onLeaveReview={handleLeaveReview} />}
      {compareList.length > 0 && <CompareBar properties={compareList} onCompare={() => setIsCompareModalOpen(true)} onClear={() => setCompareList([])} onRemove={(p) => setCompareList(prev => prev.filter(item => item.id !== p.id))} />}
      <CompareModal isOpen={isCompareModalOpen} onClose={() => setIsCompareModalOpen(false)} properties={compareList} />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLogin={handleLogin} 
        initialView={authModalView}
        onSwitchToPricing={() => {
            setIsAuthModalOpen(false);
            setPage('pricing');
        }}
        onSuperAdminLogin={() => {
          setIsAuthModalOpen(false);
          setIsSuperAdminLoggedIn(true);
        }}
      />
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
      <NeighborhoodExplorerModal 
        isOpen={isNeighborhoodExplorerOpen}
        onClose={() => setIsNeighborhoodExplorerOpen(false)}
        initialNeighborhoodId={initialNeighborhoodId}
        savedNeighborhoodIds={savedNeighborhoodIds}
        onSaveToggle={handleSaveNeighborhoodToggle}
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
       <ProviderServicesModal 
          isOpen={isProviderServicesModalOpen}
          onClose={() => {
              setIsProviderServicesModalOpen(false);
              setProviderServiceFilter(undefined);
          }}
          onContactProvider={handleContactProvider}
          initialServiceFilter={providerServiceFilter}
       />
       <SessionTimeoutModal
            isOpen={isSessionWarningOpen}
            onClose={handleStayLoggedIn}
            onLogout={handleLogout}
            countdown={sessionCountdown}
        />
    </div>
  );
};

export default App;