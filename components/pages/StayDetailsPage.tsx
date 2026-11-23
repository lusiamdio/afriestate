import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  HeartIcon,
  HomeModernIcon,
  InformationCircleIcon,
  KeyIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  ShareIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TruckIcon,
  UserGroupIcon,
  WifiIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import {
  ACCESSIBILITY_FEATURES,
  AMENITIES_BY_GROUP,
  FLAGSHIP_AFRICAN_GRAND_HOTEL,
  INVESTMENT_MODE_DEVELOPMENTS,
  NEARBY_LANDMARKS,
  NEIGHBORHOOD_AI_SCORES,
  REVIEW_CATEGORY_SCORES,
  ROOM_CATALOG,
  STAY_CATALOG_PROPERTIES,
  VERIFIED_REVIEWS,
  WELLNESS_EXPERIENCES,
  type MapModeType,
  type RatePlanOption,
  type RoomCatalogItem,
  type StayPropertyProfile,
  type StayTermMode,
  type UserIntentType,
} from '../../data/stayDetailData';
import {
  AITravelConciergeDrawer,
  AllAmenitiesModal,
  CancellationPolicyModal,
  FullscreenGalleryModal,
  InvestmentOpportunityModal,
  ManagementCompanyModal,
  SaveCollectionModal,
  SharePropertyModal,
  StayVerificationModal,
  TransparentBookingModal,
  UbuntuMenuModal,
} from '../stay/StayModals';
import { GoogleGenAI } from '../../lib/ai';
import { useToast } from '../../contexts/ToastContext';

interface StayDetailsPageProps {
  property: any;
  onBack: () => void;
  onSelectProperty?: (prop: StayPropertyProfile) => void;
  initialDates?: { checkIn: string; checkOut: string };
  initialTermMode?: StayTermMode;
  initialIntent?: UserIntentType;
}

const USER_INTENTS: UserIntentType[] = [
  'Traveler',
  'Business Traveler',
  'Family Traveler',
  'Investor',
  'Property Professional',
];

const MAP_MODES: MapModeType[] = [
  'Standard',
  'Satellite',
  'Nearby',
  'Transport',
  'Attractions',
  'Restaurants',
  'Investment',
];

function resolveStayProfile(raw: any): StayPropertyProfile {
  if (!raw) return FLAGSHIP_AFRICAN_GRAND_HOTEL;
  if (raw.heroImages && raw.specs && typeof raw.nightlyFromZar === 'number') {
    return raw as StayPropertyProfile;
  }
  const byId = STAY_CATALOG_PROPERTIES.find((p) => p.id === raw.id || p.name === raw.name || p.name === raw.title);
  if (byId) return byId;

  const parsedNum = Number(String(raw.price || '2450').replace(/[^0-9]/g, '')) || 2450;
  return {
    ...FLAGSHIP_AFRICAN_GRAND_HOTEL,
    id: raw.id || FLAGSHIP_AFRICAN_GRAND_HOTEL.id,
    name: raw.name || raw.title || FLAGSHIP_AFRICAN_GRAND_HOTEL.name,
    locationLabel: raw.location || raw.city || FLAGSHIP_AFRICAN_GRAND_HOTEL.locationLabel,
    nightlyFromZar: parsedNum,
    monthlyFromZar: Math.round(parsedNum * 19.5),
    heroImages: raw.image
      ? [
          {
            url: raw.image,
            category: 'Exterior',
            caption: `${raw.name || raw.title || 'Property'} Main Elevation`,
            specs: 'Verified Architectural View',
            aiTags: ['Exterior', 'Verified'],
          },
          ...FLAGSHIP_AFRICAN_GRAND_HOTEL.heroImages.slice(1),
        ]
      : FLAGSHIP_AFRICAN_GRAND_HOTEL.heroImages,
  };
}

const StayDetailsPage: React.FC<StayDetailsPageProps> = ({
  property,
  onBack,
  onSelectProperty,
  initialDates,
  initialTermMode = 'short-term',
  initialIntent = 'Traveler',
}) => {
  const { addToast } = useToast();
  const profile = useMemo(() => resolveStayProfile(property), [property]);

  const [userIntent, setUserIntent] = useState<UserIntentType>(initialIntent);
  const [termMode, setTermMode] = useState<StayTermMode>(initialTermMode);
  const [searchDest, setSearchDest] = useState(profile.city);
  const [checkIn, setCheckIn] = useState(initialDates?.checkIn || '2026-12-12');
  const [checkOut, setCheckOut] = useState(initialDates?.checkOut || '2026-12-15');
  const [leaseMonths, setLeaseMonths] = useState<number>(3);
  const [guestsLabel, setGuestsLabel] = useState('2 guests · 1 room');
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Interactive Content States
  const [galleryCategory, setGalleryCategory] = useState<string>('All');
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [aiHighlightText, setAiHighlightText] = useState(
    'Guests love the Atlantic Ocean views, attentive staff and direct beach access — also ideal for executive retreats and flexible monthly residencies.'
  );
  const [aiRefreshing, setAiRefreshing] = useState(false);

  // Room & Pricing States
  const [selectedPlanByRoom, setSelectedPlanByRoom] = useState<Record<string, string>>({
    'deluxe-ocean-suite': 'flex',
    'executive-courtyard-suite': termMode === 'long-term' ? 'longterm' : 'flex',
    'presidential-atlantic-villa': 'breakfast',
  });
  const [checkoutRoom, setCheckoutRoom] = useState<RoomCatalogItem | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<RatePlanOption | null>(null);

  // Map, Reviews & Accessibility States
  const [mapMode, setMapMode] = useState<MapModeType>('Standard');
  const [selectedLandmark, setSelectedLandmark] = useState(NEARBY_LANDMARKS[0].name);
  const [reviewFilter, setReviewFilter] = useState<string>('All');
  const [reviewSort, setReviewSort] = useState<'recent' | 'highest'>('recent');
  const [accessSearch, setAccessSearch] = useState('');

  // Saved Collections & Modals
  const [collections, setCollections] = useState<string[]>([
    'Cape Town Luxury Trip',
    'Honeymoon Hotels',
    'Business Travel Favorites',
  ]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(['Cape Town Luxury Trip']);
  const [recentlyViewed, setRecentlyViewed] = useState<StayPropertyProfile[]>(() =>
    STAY_CATALOG_PROPERTIES.filter((p) => p.id !== profile.id)
  );

  // Modal Open States
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [galleryModalIdx, setGalleryModalIdx] = useState<number | null>(null);
  const [isAllAmenitiesOpen, setIsAllAmenitiesOpen] = useState(false);
  const [policyRoom, setPolicyRoom] = useState<RoomCatalogItem | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isInvestmentOpen, setIsInvestmentOpen] = useState(false);
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);

  const nightsCount = useMemo(() => {
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 3;
  }, [checkIn, checkOut]);

  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 560);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setRecentlyViewed((prev) => {
      const others = STAY_CATALOG_PROPERTIES.filter((p) => p.id !== profile.id);
      return others.length ? others : prev;
    });
  }, [profile.id]);

  const photoCategories = useMemo(
    () => ['All', ...Array.from(new Set(profile.heroImages.map((img) => img.category)))],
    [profile.heroImages]
  );

  const visibleGalleryImages = useMemo(() => {
    if (galleryCategory === 'All') return profile.heroImages;
    const filtered = profile.heroImages.filter((i) => i.category === galleryCategory);
    return filtered.length ? filtered : profile.heroImages;
  }, [profile.heroImages, galleryCategory]);

  const filteredReviews = useMemo(() => {
    const list = VERIFIED_REVIEWS.filter((r) => reviewFilter === 'All' || r.travelType === reviewFilter);
    return [...list].sort((a, b) => (reviewSort === 'highest' ? b.rating - a.rating : b.helpfulCount - a.helpfulCount));
  }, [reviewFilter, reviewSort]);

  const filteredAccess = useMemo(
    () =>
      ACCESSIBILITY_FEATURES.filter((item) =>
        item.label.toLowerCase().includes(accessSearch.trim().toLowerCase()) ||
        item.category.toLowerCase().includes(accessSearch.trim().toLowerCase())
      ),
    [accessSearch]
  );

  const intentBannerText = useMemo(() => {
    switch (userIntent) {
      case 'Business Traveler':
        return '300 Mbps dual-ISP fibre, 6 private boardrooms, 11 min to CBD, airport express & VAT invoicing enabled.';
      case 'Family Traveler':
        return 'Interconnecting two-bedroom suites, heated children’s splash pool, vetted babysitting & beachfront walkability.';
      case 'Investor':
        return profile.investmentEligible && profile.investmentData
          ? `${profile.investmentData.grossYield} estimated gross yield · ${profile.investmentData.averageOccupancy} annual occupancy · ${profile.investmentData.marketGrowth} YoY.`
          : 'Operated hospitality asset under private ownership — explore investment-grade regional comparables below.';
      case 'Property Professional':
        return `Managed by AfriLuxury Hospitality · ${profile.specs.rooms} keys across ${profile.specs.floors} floors · EDGE & Green Star certified.`;
      default:
        return `${profile.score} ${profile.scoreLabel} rating · Direct Atlantic Ocean frontage, Ubuntu Restaurant & verified concierge stays.`;
    }
  }, [userIntent, profile]);

  const handleRefreshAiSummary = async () => {
    if (aiRefreshing) return;
    setAiRefreshing(true);
    try {
      const ai = new GoogleGenAI();
      const res = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Write a crisp 1-sentence luxury hospitality summary for ${profile.name} in ${profile.locationLabel} tailored for a ${userIntent} looking for a ${termMode} stay.`,
      });
      if (res.text && res.text.trim().length > 12) {
        setAiHighlightText(res.text.trim());
      }
    } catch {
      setAiHighlightText(
        `Matched 94% for ${userIntent}s: ${profile.name} pairs beach-level tranquility in ${profile.suburb} with high-speed fibre workspace and transparent ${termMode === 'long-term' ? 'monthly lease' : 'nightly'} billing.`
      );
    } finally {
      setAiRefreshing(false);
    }
  };

  const openCheckout = (room: RoomCatalogItem, explicitPlan?: RatePlanOption) => {
    const planId = selectedPlanByRoom[room.id] || (termMode === 'long-term' ? 'longterm' : 'flex');
    const chosenPlan = explicitPlan || room.ratePlans.find((rp) => rp.id === planId) || room.ratePlans[0];
    setCheckoutRoom(room);
    setCheckoutPlan(chosenPlan);
  };

  const scrollToSectionId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] dark:bg-slate-950 text-[#151515] dark:text-slate-100 pb-24 lg:pb-16">
      {/* Persistent Sticky Navigation Bar on Scroll */}
      {showStickyBar && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#E4E1D9] dark:border-slate-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button
                type="button"
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-[#F8F7F3] dark:hover:bg-slate-800 text-[#151515] dark:text-white shrink-0"
                aria-label="Back to stays"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <p className="font-heading text-base sm:text-lg font-bold truncate">{profile.name}</p>
                <p className="text-xs text-[#6B6B6B] dark:text-slate-400 truncate">
                  {profile.score} {profile.scoreLabel} · {profile.suburb}, {profile.city}
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-5 text-xs font-semibold text-[#6B6B6B] dark:text-slate-300">
              <button type="button" onClick={() => scrollToSectionId('rooms-rates')} className="hover:text-[#123B2A]">
                Rooms &amp; Rates
              </button>
              <button type="button" onClick={() => scrollToSectionId('amenities-section')} className="hover:text-[#123B2A]">
                Amenities
              </button>
              <button type="button" onClick={() => scrollToSectionId('neighborhood-map')} className="hover:text-[#123B2A]">
                Location
              </button>
              <button type="button" onClick={() => scrollToSectionId('guest-reviews')} className="hover:text-[#123B2A]">
                Reviews
              </button>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-[11px] text-[#6B6B6B] dark:text-slate-400">
                  {termMode === 'long-term' ? 'Monthly from' : 'Nightly from'}
                </p>
                <p className="font-mono font-bold text-sm text-[#123B2A] dark:text-[#C99A3D]">
                  R{(termMode === 'long-term' ? profile.monthlyFromZar : profile.nightlyFromZar).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openCheckout(ROOM_CATALOG[0])}
                className="px-4 py-2.5 rounded-xl bg-[#123B2A] hover:bg-[#0e2d20] text-white text-xs font-bold whitespace-nowrap"
              >
                Reserve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level 2 Search Strip & Back Header */}
      <div className="bg-[#123B2A] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-[#C99A3D]"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back to AfriEstate Stays</span>
            </button>

            <div className="flex items-center gap-2 bg-white/10 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTermMode('short-term')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  termMode === 'short-term' ? 'bg-[#C99A3D] text-[#151515]' : 'text-white/80 hover:text-white'
                }`}
              >
                Short-Term Stay
              </button>
              <button
                type="button"
                onClick={() => setTermMode('long-term')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  termMode === 'long-term' ? 'bg-[#C99A3D] text-[#151515]' : 'text-white/80 hover:text-white'
                }`}
              >
                Long-Term Monthly
              </button>
            </div>
          </div>

          {/* Interactive Search Bar */}
          <div className="bg-white dark:bg-slate-900 text-[#151515] dark:text-white rounded-2xl p-2 sm:p-2.5 grid grid-cols-1 md:grid-cols-12 gap-2 shadow-lg">
            <div className="md:col-span-4 px-3 py-2 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 flex items-center gap-2.5">
              <MapPinIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6B6B]">Where are you going?</p>
                <input
                  type="text"
                  value={searchDest}
                  onChange={(e) => setSearchDest(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-4 px-3 py-2 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 flex items-center gap-2.5">
              <CalendarDaysIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D] shrink-0" />
              {termMode === 'short-term' ? (
                <div className="grid grid-cols-2 gap-2 flex-1 text-xs">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6B6B]">Check-in</p>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full bg-transparent font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6B6B]">Check-out</p>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full bg-transparent font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6B6B]">Residency Duration</p>
                  <select
                    value={leaseMonths}
                    onChange={(e) => setLeaseMonths(Number(e.target.value))}
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold focus:outline-none"
                  >
                    {[1, 2, 3, 6, 12].map((m) => (
                      <option key={m} value={m} className="text-slate-900">
                        {m} {m === 1 ? 'Month Stay' : 'Months Stay'} · Move-in {checkIn}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="md:col-span-2 px-3 py-2 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 flex items-center gap-2">
              <UserGroupIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6B6B]">Guests</p>
                <select
                  value={guestsLabel}
                  onChange={(e) => setGuestsLabel(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold focus:outline-none"
                >
                  <option className="text-slate-900">1 guest · 1 room</option>
                  <option className="text-slate-900">2 guests · 1 room</option>
                  <option className="text-slate-900">4 guests · 2 rooms</option>
                  <option className="text-slate-900">Executive Corporate Suite</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2 flex">
              <button
                type="button"
                onClick={() => scrollToSectionId('rooms-rates')}
                className="w-full rounded-xl bg-[#123B2A] hover:bg-[#0e2d20] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 py-2.5"
              >
                <MagnifyingGlassIcon className="w-4 h-4 text-[#C99A3D]" />
                <span>Check Rates</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-10">
        {/* Adaptive User Intent Bar */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C99A3D]">
              Tailored Experience Lens
            </span>
            <div className="flex flex-wrap gap-1.5">
              {USER_INTENTS.map((intent) => (
                <button
                  key={intent}
                  type="button"
                  onClick={() => setUserIntent(intent)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    userIntent === intent
                      ? 'bg-[#123B2A] text-white'
                      : 'bg-[#F8F7F3] dark:bg-slate-800 text-[#6B6B6B] dark:text-slate-300 hover:text-[#151515]'
                  }`}
                >
                  {intent}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#6B6B6B] dark:text-slate-300">{intentBannerText}</p>
        </div>

        {/* Geographic Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-[#6B6B6B] dark:text-slate-400">
          {['Africa', profile.country, profile.province, profile.city, profile.suburb, profile.category, profile.name]
            .map((crumb) => (typeof crumb === 'string' ? crumb.trim() : ''))
            .filter((crumb, idx, list) => Boolean(crumb) && list.findIndex((c) => c.toLowerCase() === crumb.toLowerCase()) === idx)
            .map((crumb, i, arr) => (
              <React.Fragment key={`crumb-${i}-${crumb}`}>
                <button
                  type="button"
                  onClick={() => {
                    if (i < arr.length - 1) onBack();
                  }}
                  className={`hover:text-[#123B2A] dark:hover:text-white ${
                    i === arr.length - 1 ? 'font-bold text-[#151515] dark:text-white' : ''
                  }`}
                >
                  {crumb}
                </button>
                {i < arr.length - 1 && <ChevronRightIcon className="w-3 h-3 text-slate-400" />}
              </React.Fragment>
            ))}
        </nav>

        {/* Property Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <div className="flex items-center gap-0.5 text-[#C99A3D]" aria-label={`${profile.starRating} star property`}>
                {Array.from({ length: profile.starRating }).map((_, idx) => (
                  <StarSolidIcon key={idx} className="w-4 h-4" />
                ))}
              </div>
              <span className="text-[#6B6B6B] dark:text-slate-300">{profile.subtitle}</span>
              <span className="text-[#E4E1D9]">·</span>
              <button
                type="button"
                onClick={() => setIsVerificationOpen(true)}
                className="inline-flex items-center gap-1 text-[#123B2A] dark:text-emerald-400 hover:underline font-bold"
              >
                <CheckBadgeIcon className="w-4 h-4 text-[#C99A3D]" />
                <span>AfriEstate Verified</span>
              </button>
              <span className="text-[#E4E1D9]">·</span>
              <span className="text-[#6B6B6B] dark:text-slate-300">Secure Booking · Best Rate Guarantee</span>
            </div>

            <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-[#151515] dark:text-white">
              {profile.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-[#6B6B6B] dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5 font-medium text-[#151515] dark:text-slate-200">
                <MapPinIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D]" />
                {profile.locationLabel}
              </span>
              <button
                type="button"
                onClick={() => scrollToSectionId('neighborhood-map')}
                className="font-semibold text-[#123B2A] dark:text-[#C99A3D] underline underline-offset-4"
              >
                Show on map
              </button>
              <span className="font-semibold text-[#151515] dark:text-white">
                {profile.score} {profile.scoreLabel} · {profile.reviewCount.toLocaleString()} verified reviews
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsSaveOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-700 text-xs font-semibold hover:border-[#123B2A]"
            >
              {selectedCollections.length > 0 ? (
                <HeartSolidIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D]" />
              ) : (
                <HeartIcon className="w-4 h-4" />
              )}
              <span>Save ({selectedCollections.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-700 text-xs font-semibold hover:border-[#123B2A]"
            >
              <ShareIcon className="w-4 h-4" />
              <span>Share</span>
            </button>
            <button
              type="button"
              onClick={() => openCheckout(ROOM_CATALOG[0])}
              className="px-5 py-2.5 rounded-xl bg-[#123B2A] hover:bg-[#0d2b1f] text-white text-xs font-bold"
            >
              Reserve Stay
            </button>
          </div>
        </header>

        {/* Immersive Bento Photo Gallery + Category Filter */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {photoCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setGalleryCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    galleryCategory === cat
                      ? 'bg-[#123B2A] text-white'
                      : 'bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 text-[#6B6B6B] dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <p className="text-[11px] font-mono text-[#6B6B6B] dark:text-slate-400">
              AI Image Check: High resolution · Zero duplicates · Watermark-free
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Hero Image */}
            <button
              type="button"
              onClick={() => setGalleryModalIdx(0)}
              className="md:col-span-2 md:row-span-2 relative aspect-[16/10] md:aspect-auto md:h-[420px] rounded-2xl overflow-hidden group text-left"
            >
              <img
                src={visibleGalleryImages[0].url}
                alt={visibleGalleryImages[0].caption}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (!e.currentTarget.dataset.fb) {
                    e.currentTarget.dataset.fb = '1';
                    e.currentTarget.src = '/images/841376502.webp';
                  }
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/75 via-black/30 to-transparent text-white">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C99A3D]">
                  {visibleGalleryImages[0].category}
                </p>
                <p className="text-sm sm:text-base font-bold">{visibleGalleryImages[0].caption}</p>
                <p className="text-xs text-slate-200">{visibleGalleryImages[0].specs}</p>
              </div>
            </button>

            {/* 4 Supporting Grid Cells */}
            {[1, 2, 3, 4].map((offset) => {
              const item = visibleGalleryImages[offset % visibleGalleryImages.length];
              const isLast = offset === 4;
              return (
                <button
                  key={`${item.url}-${offset}`}
                  type="button"
                  onClick={() => setGalleryModalIdx(offset % visibleGalleryImages.length)}
                  className="relative aspect-[16/10] md:h-[204px] rounded-2xl overflow-hidden group text-left"
                >
                  <img
                    src={item.url}
                    alt={item.caption}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      if (!e.currentTarget.dataset.fb) {
                        e.currentTarget.dataset.fb = '1';
                        e.currentTarget.src = '/images/841376502.webp';
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white">
                    <p className="text-xs font-semibold truncate">{item.caption}</p>
                  </div>
                  {isLast && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#151515] text-xs font-bold shadow">
                        <PhotoIcon className="w-4 h-4 text-[#123B2A]" />
                        <span>+ 87 Photos</span>
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Property Trust Bar */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 px-5 py-4 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
          <span className="inline-flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#123B2A] text-white font-mono">{profile.score}</span>
            <span>{profile.scoreLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#6B6B6B] dark:text-slate-300">
            <MapPinIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D]" />
            Excellent location (9.7)
          </span>
          <button
            type="button"
            onClick={() => setIsVerificationOpen(true)}
            className="inline-flex items-center gap-1.5 text-[#123B2A] dark:text-emerald-400 hover:underline"
          >
            <CheckBadgeIcon className="w-4 h-4 text-[#C99A3D]" />
            AfriEstate Verified
          </button>
          <span className="inline-flex items-center gap-1.5 text-[#6B6B6B] dark:text-slate-300">
            <WifiIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D]" />
            Free 300Mbps Wi-Fi
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#6B6B6B] dark:text-slate-300">
            <TruckIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D]" />
            Free Gated Parking
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#6B6B6B] dark:text-slate-300">
            <SparklesIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D]" />
            Pool &amp; Ubuntu Restaurant
          </span>
        </section>

        {/* Editorial 2-Column Overview + Dominant Availability Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Columns */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 sm:p-8 space-y-5">
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#C99A3D]">Property Overview</p>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#151515] dark:text-white">
                  Architecture &amp; Hospitality on Africa’s Atlantic Rim
                </h2>
                <p className="text-sm sm:text-base text-[#6B6B6B] dark:text-slate-300 leading-relaxed">
                  {profile.overviewShort}
                </p>
                {overviewExpanded && (
                  <p className="text-sm text-[#6B6B6B] dark:text-slate-300 leading-relaxed pt-2 border-t border-[#E4E1D9] dark:border-slate-800">
                    {profile.overviewExtended}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setOverviewExpanded((v) => !v)}
                  className="text-xs font-bold text-[#123B2A] dark:text-[#C99A3D] underline underline-offset-4"
                >
                  {overviewExpanded ? 'Read less' : 'Read more'}
                </button>
              </div>

              {/* AI Summary */}
              <div className="rounded-xl bg-[#F8F7F3] dark:bg-slate-800 border border-[#E4E1D9] dark:border-slate-700 p-5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#123B2A] dark:text-[#C99A3D]">
                    <SparklesIcon className="w-4 h-4" />
                    <span>AfriEstate AI says</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#123B2A] dark:text-emerald-300">
                      94% Match for you
                    </span>
                    <button
                      type="button"
                      onClick={handleRefreshAiSummary}
                      disabled={aiRefreshing}
                      className="text-[11px] font-semibold text-[#6B6B6B] hover:text-[#151515] dark:hover:text-white underline"
                    >
                      {aiRefreshing ? 'Updating...' : 'Tailor to lens'}
                    </button>
                  </div>
                </div>
                <p className="text-sm font-medium text-[#151515] dark:text-slate-100 leading-relaxed">
                  “{aiHighlightText}”
                </p>
              </div>
            </div>

            {/* Property Highlights Grid */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 space-y-4">
              <h3 className="font-heading text-xl font-bold">Property Highlights</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  { title: 'Prime location score 9.7', desc: '400m to Camps Bay Beach & 150m to Promenade.' },
                  { title: 'Short & Long-Term Ready', desc: 'Nightly hotel flexibility or 1–12 month corporate leases.' },
                  { title: '24/7 Power & Fibre Uptime', desc: 'Solar microgrid plus redundant 300 Mbps workspace Wi-Fi.' },
                  { title: 'Breakfast & Fine Dining', desc: 'On-site Ubuntu Restaurant serving breakfast, lunch & dinner.' },
                ].map((h) => (
                  <div key={h.title} className="p-4 rounded-xl bg-[#F8F7F3] dark:bg-slate-800/80 space-y-1">
                    <p className="font-bold text-[#151515] dark:text-white flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D] shrink-0" />
                      <span>{h.title}</span>
                    </p>
                    <p className="text-xs text-[#6B6B6B] dark:text-slate-300 pl-6">{h.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Dominant Booking Panel */}
          <aside className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 sm:p-7 space-y-5 shadow-md">
            <div className="flex items-start justify-between gap-4 border-b border-[#E4E1D9] dark:border-slate-800 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#C99A3D]">
                  {termMode === 'long-term' ? 'Long-Term Monthly Residency' : 'Nightly Hospitality Rate'}
                </p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-[#123B2A] dark:text-white">
                    R{(termMode === 'long-term' ? profile.monthlyFromZar : profile.nightlyFromZar).toLocaleString()}
                  </span>
                  <span className="text-xs text-[#6B6B6B] dark:text-slate-400">
                    /{termMode === 'long-term' ? 'month' : 'night'}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                Instant Confirmation
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#F8F7F3] dark:bg-slate-800">
                  <p className="text-[10px] uppercase font-bold text-[#6B6B6B]">
                    {termMode === 'long-term' ? 'Move-In Date' : 'Check-in'}
                  </p>
                  <p className="font-semibold text-sm mt-0.5">{checkIn}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F7F3] dark:bg-slate-800">
                  <p className="text-[10px] uppercase font-bold text-[#6B6B6B]">
                    {termMode === 'long-term' ? 'Lease Term' : 'Check-out'}
                  </p>
                  <p className="font-semibold text-sm mt-0.5">
                    {termMode === 'long-term' ? `${leaseMonths} Months` : `${checkOut} (${nightsCount} nights)`}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#6B6B6B]">Configuration</p>
                  <p className="font-semibold text-sm mt-0.5">
                    {profile.propertyType === 'Hotel' || profile.propertyType === 'Safari Lodge'
                      ? `${guestsLabel} · Rooms, Suites & Villas`
                      : 'Entire Residence · 1–2 Bedrooms · Full Kitchen'}
                  </p>
                </div>
                <HomeModernIcon className="w-5 h-5 text-[#123B2A] dark:text-[#C99A3D]" />
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#6B6B6B] dark:text-slate-300">
              <p className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D]" />
                Free cancellation before 10 December 2026 on Flexible plans
              </p>
              <p className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D]" />
                Pay today or reserve now and pay at property
              </p>
              <p className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D]" />
                AfriEstate Best Rate Guarantee &amp; verified taxes
              </p>
            </div>

            <button
              type="button"
              onClick={() => openCheckout(ROOM_CATALOG[0])}
              className="w-full py-3.5 rounded-xl bg-[#123B2A] hover:bg-[#0d2a1e] text-white text-sm font-bold shadow"
            >
              {termMode === 'long-term' ? 'Apply for Lease (Off-Platform)' : 'Book Selected Unit'}
            </button>

            <button
              type="button"
              onClick={() => setIsConciergeOpen(true)}
              className="w-full py-3 rounded-xl border border-[#E4E1D9] dark:border-slate-700 hover:bg-[#F8F7F3] dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2"
            >
              <SparklesIcon className="w-4 h-4 text-[#C99A3D]" />
              <span>Ask AfriEstate AI Concierge</span>
            </button>
          </aside>
        </section>

        {/* Room & Rate Selection + Transparent Pricing */}
        <section id="rooms-rates" className="space-y-6 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#C99A3D]">Accommodations &amp; Rate Plans</p>
              <h2 className="font-heading text-2xl sm:text-4xl font-bold mt-1">
                Choose Your Suite or Residence
              </h2>
            </div>
            <p className="text-xs text-[#6B6B6B] dark:text-slate-400">
              Showing {termMode === 'long-term' ? `${leaseMonths}-month residential rates` : `${nightsCount}-night stay rates`} · All taxes itemized upfront
            </p>
          </div>

          <div className="space-y-5">
            {ROOM_CATALOG.map((room) => {
              const selectedPlanId = selectedPlanByRoom[room.id] || (termMode === 'long-term' ? 'longterm' : 'flex');
              const activePlan = room.ratePlans.find((rp) => rp.id === selectedPlanId) || room.ratePlans[0];
              const basePrice = termMode === 'long-term' ? activePlan.monthlyZar * leaseMonths : activePlan.nightlyZar * nightsCount;
              const taxes = Math.round(basePrice * 0.15);
              const fee = termMode === 'long-term' ? 650 : 250;

              return (
                <article
                  key={room.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12"
                >
                  {/* Room Image & Core Info */}
                  <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#E4E1D9] dark:border-slate-800 flex flex-col">
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={room.image}
                        alt={room.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          if (!e.currentTarget.dataset.fb) {
                            e.currentTarget.dataset.fb = '1';
                            e.currentTarget.src = '/images/841376502.webp';
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#123B2A]/90 text-white text-[11px] font-bold">
                        Only {room.leftCount} left
                      </span>
                    </div>
                    <div className="p-5 space-y-3 flex-1">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#C99A3D]">{room.category}</p>
                        <h3 className="font-heading text-xl font-bold mt-0.5">{room.name}</h3>
                        <p className="text-xs text-[#6B6B6B] dark:text-slate-400 mt-1">
                          {room.sizeSqm} m² · {room.viewLabel} · {room.bedConfig} · Sleeps {room.sleeps}
                        </p>
                      </div>
                      <ul className="space-y-1.5 text-xs text-[#6B6B6B] dark:text-slate-300">
                        {room.features.map((f) => (
                          <li key={f} className="flex items-center gap-2">
                            <CheckIcon className="w-3.5 h-3.5 text-[#123B2A] dark:text-[#C99A3D] shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => setPolicyRoom(room)}
                        className="text-xs font-semibold text-[#123B2A] dark:text-[#C99A3D] underline underline-offset-4 pt-1"
                      >
                        View full cancellation policy
                      </button>
                    </div>
                  </div>

                  {/* Rate Plan Tiers + Transparent Checkout */}
                  <div className="lg:col-span-8 p-5 sm:p-6 flex flex-col justify-between gap-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {room.ratePlans.map((plan) => {
                        const isSelected = plan.id === activePlan.id;
                        const displayPrice = termMode === 'long-term' ? plan.monthlyZar : plan.nightlyZar;
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlanByRoom((prev) => ({ ...prev, [room.id]: plan.id }))}
                            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                              isSelected
                                ? 'border-[#123B2A] bg-[#F8F7F3] dark:bg-emerald-950/30 ring-1 ring-[#123B2A]'
                                : 'border-[#E4E1D9] dark:border-slate-700 hover:border-[#C99A3D]'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-bold text-[#151515] dark:text-white">{plan.name}</span>
                                {plan.badgeText && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C99A3D]">
                                    {plan.badgeText}
                                  </span>
                                )}
                              </div>
                              <ul className="space-y-1 text-xs text-[#6B6B6B] dark:text-slate-300">
                                {plan.perks.map((p) => (
                                  <li key={p} className="flex items-center gap-1.5">
                                    <CheckIcon className="w-3.5 h-3.5 text-[#123B2A] dark:text-[#C99A3D] shrink-0" />
                                    <span>{p}</span>
                                  </li>
                                ))}
                                {plan.excluded && (
                                  <li className="text-rose-600 dark:text-rose-400 font-medium">× {plan.excluded}</li>
                                )}
                              </ul>
                            </div>
                            <div className="pt-2 border-t border-[#E4E1D9] dark:border-slate-700 flex items-baseline justify-between">
                              <span className="font-mono font-bold text-base text-[#123B2A] dark:text-white">
                                R{displayPrice.toLocaleString()}
                              </span>
                              <span className="text-[11px] text-[#6B6B6B] dark:text-slate-400">
                                /{termMode === 'long-term' ? 'mo' : 'night'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Transparent Pricing Summary Row */}
                    <div className="rounded-xl bg-[#F8F7F3] dark:bg-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-sm text-[#151515] dark:text-white">
                          Total with taxes &amp; protection: R{(basePrice + taxes + fee).toLocaleString()}
                        </p>
                        <p className="text-[#6B6B6B] dark:text-slate-300">
                          {termMode === 'long-term' ? `${leaseMonths} months` : `${nightsCount} nights`} R{basePrice.toLocaleString()} · Taxes R{taxes.toLocaleString()} · Service fee R{fee.toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openCheckout(room, activePlan)}
                        className="px-6 py-3 rounded-xl bg-[#123B2A] hover:bg-[#0d2a1e] text-white text-xs sm:text-sm font-bold whitespace-nowrap"
                      >
                        {termMode === 'long-term' ? 'Apply for Lease' : 'Select & Book Now'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Property Amenities + Dining (Ubuntu) + Experiences */}
        <section id="amenities-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 scroll-mt-24">
          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#C99A3D]">Inspected Facilities</p>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold mt-1">Property Amenities</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAllAmenitiesOpen(true)}
                className="px-4 py-2 rounded-xl border border-[#123B2A] text-xs font-bold text-[#123B2A] dark:text-[#C99A3D] dark:border-[#C99A3D]"
              >
                Show all 64 amenities
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Object.entries(AMENITIES_BY_GROUP).map(([group, items]) => (
                <div key={group} className="space-y-2.5">
                  <h3 className="text-sm font-bold text-[#151515] dark:text-white border-b border-[#E4E1D9] dark:border-slate-800 pb-2">
                    {group}
                  </h3>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-[#6B6B6B] dark:text-slate-300">
                    {items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D] shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            {/* Ubuntu Restaurant Card */}
            <div className="rounded-2xl bg-[#123B2A] text-white p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C99A3D]">On-Site Signature Dining</span>
                <span className="text-xs text-slate-300">Open 06:30 – 23:00</span>
              </div>
              <h3 className="font-heading text-2xl font-bold">Ubuntu Restaurant</h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Cuisine: African, International &amp; Atlantic Seafood · Serving breakfast, lunch &amp; candlelit dinner on the ocean terrace.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-white text-[#151515] text-xs font-bold hover:bg-slate-100"
                >
                  View Menu
                </button>
                <button
                  type="button"
                  onClick={() => addToast('Ubuntu Restaurant table reservation request received by concierge.', 'success')}
                  className="px-4 py-2.5 rounded-xl bg-[#C99A3D] text-[#151515] text-xs font-bold hover:brightness-105"
                >
                  Reserve a Table
                </button>
              </div>
            </div>

            {/* Wellness & Experiences */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xl font-bold">Wellness &amp; Curated Experiences</h3>
                <span className="text-xs text-[#6B6B6B]">Concierge Bookable</span>
              </div>
              <div className="divide-y divide-[#E4E1D9] dark:divide-slate-800">
                {WELLNESS_EXPERIENCES.map((exp) => (
                  <div key={exp.title} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-[#151515] dark:text-white">{exp.title}</p>
                      <p className="text-[11px] text-[#6B6B6B] dark:text-slate-400">
                        {exp.duration} · {exp.tag}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToast(`Added "${exp.title}" inquiry to your concierge itinerary.`, 'success')}
                      className="px-3 py-1.5 rounded-lg bg-[#F8F7F3] dark:bg-slate-800 hover:bg-[#123B2A] hover:text-white text-xs font-mono font-bold transition-colors shrink-0"
                    >
                      R{exp.priceZar.toLocaleString()}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Multi-Mode Neighborhood Map + AI Scores */}
        <section id="neighborhood-map" className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 sm:p-8 space-y-6 scroll-mt-24">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#C99A3D]">Spatial Intelligence</p>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold mt-1">
                Location &amp; Neighborhood Explorer · {profile.suburb}
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {MAP_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMapMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    mapMode === mode
                      ? 'bg-[#123B2A] text-white'
                      : 'bg-[#F8F7F3] dark:bg-slate-800 text-[#6B6B6B] dark:text-slate-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Interactive Map Canvas */}
            <div className="lg:col-span-7 relative h-[360px] rounded-2xl overflow-hidden border border-[#E4E1D9] dark:border-slate-700 bg-[#E6ECE7] dark:bg-slate-800">
              {mapMode === 'Satellite' ? (
                <img
                  src="/images/getlstd-property-photo.jpg"
                  alt="Aerial coastal satellite view"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = '/images/841376502.webp';
                  }}
                  className="w-full h-full object-cover opacity-55"
                />
              ) : (
                <svg className="w-full h-full opacity-40" viewBox="0 0 800 400" aria-hidden="true">
                  <path d="M0 300 Q 220 260, 440 310 T 800 280 L 800 400 L 0 400 Z" fill="#8CC4C9" />
                  <path d="M0 120 L 800 120 M 0 210 L 800 210 M 180 0 L 180 400 M 420 0 L 420 400 M 640 0 L 640 400" stroke="#123B2A" strokeWidth="1.5" strokeDasharray="6 6" />
                </svg>
              )}

              {/* Property Center Marker */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                <span className="px-3 py-1.5 rounded-xl bg-[#123B2A] text-white text-xs font-bold shadow-lg border border-[#C99A3D] whitespace-nowrap">
                  {profile.name}
                </span>
                <span className="w-3 h-3 rounded-full bg-[#C99A3D] border-2 border-white mt-1" />
              </div>

              {/* Conditional Overlay Markers */}
              {mapMode === 'Investment'
                ? INVESTMENT_MODE_DEVELOPMENTS.map((dev) => (
                    <button
                      key={dev.name}
                      type="button"
                      onClick={() => addToast(`${dev.name}: Est. ${dev.price} · ${dev.yield} yield (${dev.demand})`, 'info')}
                      style={{ left: dev.x, top: dev.y }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#C99A3D] shadow text-[11px] font-bold text-left hover:scale-105 transition-transform"
                    >
                      <span className="block text-[#123B2A] dark:text-[#C99A3D]">{dev.yield} Yield · {dev.price}</span>
                      <span className="block text-[10px] text-[#6B6B6B] dark:text-slate-300">{dev.name}</span>
                    </button>
                  ))
                : NEARBY_LANDMARKS.filter((lm) => mapMode === 'Standard' || mapMode === 'Satellite' || mapMode === 'Nearby' || lm.mode === mapMode).map((lm) => (
                    <button
                      key={lm.name}
                      type="button"
                      onClick={() => setSelectedLandmark(lm.name)}
                      style={{ left: lm.x, top: lm.y }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[11px] font-semibold shadow transition-all ${
                        selectedLandmark === lm.name
                          ? 'bg-[#C99A3D] text-[#151515]'
                          : 'bg-white/95 dark:bg-slate-900/95 text-[#151515] dark:text-white border border-[#E4E1D9]'
                      }`}
                    >
                      {lm.name} ({lm.dist})
                    </button>
                  ))}

              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 text-[11px] font-semibold shadow">
                Active Mode: <span className="text-[#123B2A] dark:text-[#C99A3D]">{mapMode}</span>
              </div>
            </div>

            {/* Neighborhood AI Scores + Distances */}
            <div className="lg:col-span-5 space-y-5">
              <div className="rounded-xl bg-[#F8F7F3] dark:bg-slate-800 p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#123B2A] dark:text-[#C99A3D]">
                  AfriEstate Neighborhood Intelligence
                </p>
                <div className="space-y-2.5">
                  {NEIGHBORHOOD_AI_SCORES.map((dim) => (
                    <div key={dim.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{dim.label}</span>
                        <span className="font-mono">{dim.score} / 100</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full bg-[#123B2A] dark:bg-[#C99A3D]" style={{ width: `${dim.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-[#E4E1D9] dark:divide-slate-800 text-xs">
                {NEARBY_LANDMARKS.map((lm) => (
                  <div
                    key={lm.name}
                    className={`py-2.5 flex items-center justify-between ${
                      selectedLandmark === lm.name ? 'font-bold text-[#123B2A] dark:text-[#C99A3D]' : ''
                    }`}
                  >
                    <span>{lm.name}</span>
                    <span className="font-mono text-[#6B6B6B] dark:text-slate-400">
                      {lm.dist} · {lm.walkTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Verified Guest Reviews + AI Review Intelligence */}
        <section id="guest-reviews" className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 sm:p-8 space-y-6 scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Review Summary & AI Insights */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#123B2A] text-white flex flex-col items-center justify-center shrink-0">
                  <span className="font-mono text-2xl font-bold">{profile.score}</span>
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold">{profile.scoreLabel}</p>
                  <p className="text-xs text-[#6B6B6B] dark:text-slate-400">
                    Based on {profile.reviewCount.toLocaleString()} verified guest stays
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {REVIEW_CATEGORY_SCORES.map((cat) => (
                  <div key={cat.label} className="flex items-center gap-3 text-xs">
                    <span className="w-24 font-semibold">{cat.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-[#123B2A] dark:bg-[#C99A3D]" style={{ width: `${cat.score * 10}%` }} />
                    </div>
                    <span className="font-mono font-bold w-8 text-right">{cat.score}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-[#F8F7F3] dark:bg-slate-800 p-4 space-y-2.5 text-xs">
                <p className="font-bold text-[#123B2A] dark:text-[#C99A3D] flex items-center gap-1.5">
                  <SparklesIcon className="w-4 h-4" />
                  <span>AI Review Sentiment</span>
                </p>
                <p className="text-[#151515] dark:text-slate-200">
                  <strong>Guests consistently praise:</strong> Location (96%) · Staff (95%) · Cleanliness (94%) · Views (92%)
                </p>
                <p className="text-[#6B6B6B] dark:text-slate-400">
                  <strong>Common notes:</strong> Street parking congestion on peak weekends · Reserve sunset Ubuntu tables early.
                </p>
              </div>
            </div>

            {/* Review Cards + Filters */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {['All', 'Couples', 'Families', 'Business', 'Solo', 'Friends'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setReviewFilter(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        reviewFilter === t
                          ? 'bg-[#123B2A] text-white'
                          : 'bg-[#F8F7F3] dark:bg-slate-800 text-[#6B6B6B] dark:text-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <select
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value as 'recent' | 'highest')}
                  className="px-3 py-1.5 rounded-lg bg-[#F8F7F3] dark:bg-slate-800 text-xs font-semibold border border-[#E4E1D9] dark:border-slate-700"
                >
                  <option value="recent">Most Helpful</option>
                  <option value="highest">Highest Rated</option>
                </select>
              </div>

              <div className="space-y-3">
                {filteredReviews.map((rev) => (
                  <article
                    key={rev.id}
                    className="p-5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800/70 border border-[#E4E1D9] dark:border-slate-700 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[#151515] dark:text-white">
                          {rev.guestName} · <span className="font-normal text-[#6B6B6B] dark:text-slate-400">{rev.country}</span>
                        </p>
                        <p className="text-[11px] text-[#6B6B6B] dark:text-slate-400">
                          Verified Stay · {rev.travelType} · {rev.stayedNights} nights · {rev.roomName}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#123B2A] dark:text-[#C99A3D]">
                        {rev.rating}.0 / 5.0 · {rev.date}
                      </span>
                    </div>
                    <p className="text-sm text-[#151515] dark:text-slate-200 leading-relaxed">“{rev.quote}”</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Property Management + Property Info + Accessibility + Sustainability */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-6">
            {/* Property Management Company */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#C99A3D]">Property Management</p>
                  <h3 className="font-heading text-2xl font-bold mt-0.5">AfriLuxury Hospitality</h3>
                  <p className="text-xs text-[#6B6B6B] dark:text-slate-400 mt-0.5">Verified Management Company</p>
                </div>
                <BuildingOffice2Icon className="w-7 h-7 text-[#123B2A] dark:text-[#C99A3D] shrink-0" />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-[#F8F7F3] dark:bg-slate-800">
                  <p className="font-mono font-bold text-lg text-[#123B2A] dark:text-white">18</p>
                  <p className="text-[11px] text-[#6B6B6B]">Properties</p>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F7F3] dark:bg-slate-800">
                  <p className="font-mono font-bold text-lg text-[#123B2A] dark:text-white">9.2</p>
                  <p className="text-[11px] text-[#6B6B6B]">Rating</p>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F7F3] dark:bg-slate-800">
                  <p className="font-mono font-bold text-lg text-[#123B2A] dark:text-white">94%</p>
                  <p className="text-[11px] text-[#6B6B6B]">Satisfaction</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManagementOpen(true)}
                className="text-xs font-bold text-[#123B2A] dark:text-[#C99A3D] underline underline-offset-4"
              >
                View other properties managed by AfriLuxury Hospitality
              </button>
            </div>

            {/* Property Information & House Rules */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 space-y-5">
              <div>
                <h3 className="font-heading text-xl font-bold">Property Information &amp; House Rules</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {[
                  { label: 'Total Rooms', val: `${profile.specs.rooms}` },
                  { label: 'Floors', val: `${profile.specs.floors}` },
                  { label: 'Opened / Renovated', val: `${profile.specs.opened} / ${profile.specs.lastRenovated}` },
                  { label: 'Check-in', val: `From ${profile.specs.checkIn}` },
                  { label: 'Check-out', val: `Until ${profile.specs.checkOut}` },
                  { label: 'Languages', val: profile.specs.languages },
                ].map((spec) => (
                  <div key={spec.label} className="p-3 rounded-xl bg-[#F8F7F3] dark:bg-slate-800">
                    <p className="text-[#6B6B6B] dark:text-slate-400">{spec.label}</p>
                    <p className="font-bold mt-0.5 text-[#151515] dark:text-white">{spec.val}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#6B6B6B] dark:text-slate-300 pt-2 border-t border-[#E4E1D9] dark:border-slate-800">
                <p className="flex items-center gap-2"><ClockIcon className="w-4 h-4 text-[#123B2A]" /> Quiet hours: 22:00 – 07:00</p>
                <p className="flex items-center gap-2"><KeyIcon className="w-4 h-4 text-[#123B2A]" /> Govt ID &amp; card required at check-in</p>
                <p className="flex items-center gap-2"><InformationCircleIcon className="w-4 h-4 text-[#123B2A]" /> Non-smoking interior suites</p>
                <p className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[#123B2A]" /> Children of all ages welcome</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            {/* Searchable Accessibility */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-heading text-xl font-bold">Accessibility Features</h3>
                <input
                  type="text"
                  value={accessSearch}
                  onChange={(e) => setAccessSearch(e.target.value)}
                  placeholder="Filter access features..."
                  className="px-3 py-1.5 rounded-lg bg-[#F8F7F3] dark:bg-slate-800 border border-[#E4E1D9] dark:border-slate-700 text-xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {filteredAccess.map((acc) => (
                  <div key={acc.label} className="p-3 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D] shrink-0" />
                    <span>{acc.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sustainability */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#C99A3D]">Sustainability &amp; Resilience</p>
                  <h3 className="font-heading text-xl font-bold mt-0.5">
                    AfriEstate Green Score: {profile.sustainabilityScore} / 100
                  </h3>
                </div>
                <GlobeAltIcon className="w-7 h-7 text-[#123B2A] dark:text-emerald-400" />
              </div>
              <p className="text-xs text-[#6B6B6B] dark:text-slate-300">
                Certifications: <strong className="text-[#151515] dark:text-white">{profile.certifications.join(' · ')}</strong>
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-[#6B6B6B] dark:text-slate-300">
                <span className="px-3 py-1.5 rounded-lg bg-[#F8F7F3] dark:bg-slate-800">Solar energy microgrid</span>
                <span className="px-3 py-1.5 rounded-lg bg-[#F8F7F3] dark:bg-slate-800">Water conservation</span>
                <span className="px-3 py-1.5 rounded-lg bg-[#F8F7F3] dark:bg-slate-800">Zero single-use plastics</span>
                <span className="px-3 py-1.5 rounded-lg bg-[#F8F7F3] dark:bg-slate-800">Community sourced</span>
              </div>
            </div>
          </div>
        </section>

        {/* Conditional Investment Intelligence Section */}
        {profile.investmentEligible && profile.investmentData && (
          <section className="rounded-2xl bg-[#123B2A] text-white p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#C99A3D]">AfriEstate Investment Intelligence</p>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold mt-1">
                  Institutional Yield &amp; Property Performance
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsInvestmentOpen(true)}
                className="px-5 py-3 rounded-xl bg-[#C99A3D] text-[#151515] text-xs sm:text-sm font-bold inline-flex items-center gap-2 self-start lg:self-auto"
              >
                <span>Explore Investment Opportunity</span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Estimated Value', val: profile.investmentData.estimatedValue },
                { label: 'Annual Revenue', val: profile.investmentData.annualRevenue },
                { label: 'Avg Occupancy', val: profile.investmentData.averageOccupancy },
                { label: 'Est. Gross Yield', val: profile.investmentData.grossYield },
                { label: 'Market Growth', val: profile.investmentData.marketGrowth },
              ].map((m) => (
                <div key={m.label} className="p-4 rounded-xl bg-white/10 border border-white/10">
                  <p className="text-[11px] text-slate-300">{m.label}</p>
                  <p className="font-mono text-xl font-bold text-[#C99A3D] mt-1">{m.val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              <div className="lg:col-span-8 p-4 rounded-xl bg-black/25 text-xs sm:text-sm text-slate-100 leading-relaxed">
                <strong className="text-[#C99A3D]">AI Investment Insight:</strong> “{profile.investmentData.aiSummary}”
              </div>
              <div className="lg:col-span-4 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white/10">Demand: <strong>{profile.investmentData.demand}</strong></div>
                <div className="p-2.5 rounded-lg bg-white/10">Risk: <strong>{profile.investmentData.risk}</strong></div>
                <div className="p-2.5 rounded-lg bg-white/10">Growth: <strong>{profile.investmentData.growth}</strong></div>
                <div className="p-2.5 rounded-lg bg-white/10">Liquidity: <strong>{profile.investmentData.liquidity}</strong></div>
              </div>
            </div>

            <p className="text-[11px] text-slate-300">
              Financial Disclaimer: Estimated yield, occupancy, and valuation figures are historical market indicators and not regulated financial advice.
            </p>
          </section>
        )}

        {/* Booking Protection & Help Bar */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#123B2A] text-[#C99A3D] flex items-center justify-center shrink-0">
              <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold">AfriEstate Booking Protection</h3>
              <p className="text-xs text-[#6B6B6B] dark:text-slate-300 leading-relaxed">
                Verified property · Secure escrow payment · Transparent pricing · Dedicated concierge support before, during, and after your stay.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-heading text-lg font-bold">Need help choosing?</h3>
              <p className="text-xs text-[#6B6B6B] dark:text-slate-300">
                Ask AfriEstate AI Concierge about rooms, airport transfers, or corporate monthly stays.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsConciergeOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#123B2A] text-white text-xs font-bold whitespace-nowrap flex items-center gap-2"
            >
              <SparklesIcon className="w-4 h-4 text-[#C99A3D]" />
              <span>Open AI Concierge</span>
            </button>
          </div>
        </section>

        {/* Similar Properties & Continue Exploring */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold">You May Also Like Across Africa</h2>
            <span className="text-xs text-[#6B6B6B]">Short-Term &amp; Extended Residences</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recentlyViewed.map((sim) => (
              <article
                key={sim.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 overflow-hidden flex flex-col justify-between"
              >
                <div className="relative h-48">
                  <img
                    src={sim.heroImages[0].url}
                    alt={sim.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      if (!e.currentTarget.dataset.fb) {
                        e.currentTarget.dataset.fb = '1';
                        e.currentTarget.src = '/images/841376502.webp';
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#123B2A] text-white font-mono text-xs font-bold">
                    {sim.score} {sim.scoreLabel}
                  </span>
                </div>
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#C99A3D]">{sim.propertyType}</p>
                    <h3 className="font-heading text-xl font-bold mt-0.5">{sim.name}</h3>
                    <p className="text-xs text-[#6B6B6B] dark:text-slate-400 mt-0.5">{sim.locationLabel}</p>
                  </div>
                  <div className="pt-3 border-t border-[#E4E1D9] dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-mono font-bold text-sm text-[#123B2A] dark:text-white">
                        R{(termMode === 'long-term' ? sim.monthlyFromZar : sim.nightlyFromZar).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-[#6B6B6B]">
                        /{termMode === 'long-term' ? 'month' : 'night'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectProperty) onSelectProperty(sim);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-4 py-2 rounded-xl bg-[#123B2A] text-white text-xs font-bold"
                    >
                      View Property
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Final Decision Support CTA */}
        <section className="rounded-2xl bg-[#123B2A] text-white p-7 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold">Ready to stay at {profile.name}?</h2>
            <p className="text-xs sm:text-sm text-slate-200">
              Only {ROOM_CATALOG[0].leftCount} luxury Ocean View Suites remaining for your selected window.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openCheckout(ROOM_CATALOG[0])}
              className="px-6 py-3.5 rounded-xl bg-[#C99A3D] text-[#151515] text-sm font-bold"
            >
              {termMode === 'long-term' ? 'Apply for Lease' : 'Book Stay Now'}
            </button>
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold"
            >
              Share Shortlist
            </button>
          </div>
        </section>
      </div>

      {/* Compact Mobile Bottom Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-slate-900 border-t border-[#E4E1D9] dark:border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-[#6B6B6B] dark:text-slate-400">
            {termMode === 'long-term' ? 'Monthly from' : 'Nightly from'}
          </p>
          <p className="font-mono text-base font-bold text-[#123B2A] dark:text-[#C99A3D]">
            R{(termMode === 'long-term' ? profile.monthlyFromZar : profile.nightlyFromZar).toLocaleString()}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCheckout(ROOM_CATALOG[0])}
          className="px-6 py-2.5 rounded-xl bg-[#123B2A] text-white text-xs font-bold tracking-wider uppercase"
        >
          {termMode === 'long-term' ? 'Apply for Lease' : 'Book Now'}
        </button>
      </div>

      {/* Modals & AI Concierge Drawer */}
      <StayVerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        propertyName={profile.name}
      />
      <FullscreenGalleryModal
        isOpen={galleryModalIdx !== null}
        onClose={() => setGalleryModalIdx(null)}
        images={profile.heroImages}
        initialIndex={galleryModalIdx ?? 0}
      />
      <AllAmenitiesModal isOpen={isAllAmenitiesOpen} onClose={() => setIsAllAmenitiesOpen(false)} />
      <CancellationPolicyModal room={policyRoom} onClose={() => setPolicyRoom(null)} />
      <UbuntuMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onReserveTable={() => addToast('Ubuntu table request added to concierge notes.', 'success')}
      />
      <SaveCollectionModal
        isOpen={isSaveOpen}
        onClose={() => setIsSaveOpen(false)}
        propertyName={profile.name}
        collections={collections}
        selectedCollections={selectedCollections}
        onToggleCollection={(col) =>
          setSelectedCollections((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]))
        }
        onCreateCollection={(name) => {
          setCollections((prev) => [...prev, name]);
          setSelectedCollections((prev) => [...prev, name]);
        }}
      />
      <SharePropertyModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        propertyName={profile.name}
        locationLabel={profile.locationLabel}
      />
      <ManagementCompanyModal isOpen={isManagementOpen} onClose={() => setIsManagementOpen(false)} />
      <InvestmentOpportunityModal
        isOpen={isInvestmentOpen}
        onClose={() => setIsInvestmentOpen(false)}
        property={profile}
      />
      <AITravelConciergeDrawer
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
        property={profile}
        onSelectRomanticRoom={() => openCheckout(ROOM_CATALOG[0])}
        onExploreRestaurants={() => {
          setMapMode('Restaurants');
          scrollToSectionId('neighborhood-map');
        }}
      />
      <TransparentBookingModal
        isOpen={Boolean(checkoutRoom && checkoutPlan)}
        onClose={() => {
          setCheckoutRoom(null);
          setCheckoutPlan(null);
        }}
        property={profile}
        room={checkoutRoom}
        ratePlan={checkoutPlan}
        termMode={termMode}
        nights={nightsCount}
        months={leaseMonths}
        checkIn={checkIn}
        checkOut={checkOut}
        guestsLabel={guestsLabel}
      />
    </div>
  );
};

export default StayDetailsPage;
