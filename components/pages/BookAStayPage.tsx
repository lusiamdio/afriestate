import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightIcon,
  BookmarkIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  HeartIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  PlusIcon,
  ScaleIcon,
  ShareIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCircleIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import StayDetailsPage from './StayDetailsPage';
import {
  FLAGSHIP_AFRICAN_GRAND_HOTEL,
  STAY_CATALOG_PROPERTIES,
  type StayPropertyProfile,
  type StayTermMode,
  type UserIntentType,
} from '../../data/stayDetailData';
import { ListingType, PropertyType, type Property } from '../../types';
import { GoogleGenAI } from '../../lib/ai';
import { useToast } from '../../contexts/ToastContext';
import { SharePropertyModal } from '../stay/StayModals';
import { getPublishedStayProfiles } from '../../lib/data';
import { generateListingSignature, sanitizeSafeUrl, sanitizeText } from '../../lib/security';

interface BookAStayPageProps {
  properties?: Property[];
  publishedStays?: StayPropertyProfile[];
  initialTermMode?: StayTermMode;
  onGoHome?: () => void;
  onOpenAuth?: () => void;
  onNavigate?: (page: string) => void;
  onListProperty?: () => void;
  onListLongTermProperty?: () => void;
}

const STAY_STYLES = [
  { id: 'All', label: 'All Stays', subtitle: 'Hotels, serviced apartments & resorts' },
  { id: 'Hotels', label: 'Hotels', subtitle: 'Flagship city & coastal properties' },
  { id: 'Serviced Apartments', label: 'Long-Term & Extended', subtitle: 'Monthly residencies, flats & homes' },
  { id: 'Resorts', label: 'Safari & Resorts', subtitle: 'All-suite sanctuaries & retreats' },
];

const USER_INTENTS: UserIntentType[] = [
  'Traveler',
  'Business Traveler',
  'Family Traveler',
  'Investor',
  'Property Professional',
];

const BookAStayPage: React.FC<BookAStayPageProps> = ({
  properties = [],
  publishedStays = [],
  initialTermMode = 'short-term',
  onGoHome,
  onOpenAuth,
  onNavigate,
  onListProperty,
  onListLongTermProperty,
}) => {
  const { addToast } = useToast();
  const [selectedStay, setSelectedStay] = useState<StayPropertyProfile | null>(null);
  const [termMode, setTermMode] = useState<StayTermMode>(initialTermMode);
  const [userIntent, setUserIntent] = useState<UserIntentType>('Traveler');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchCity, setSearchCity] = useState<string>('');
  const [checkIn, setCheckIn] = useState<string>('2026-12-12');
  const [checkOut, setCheckOut] = useState<string>('2026-12-15');
  const [leaseMonths, setLeaseMonths] = useState<number>(3);
  const [guestsCount, setGuestsCount] = useState<string>('2 guests · 1 room');
  const [savedOnly, setSavedOnly] = useState<boolean>(false);

  const [savedIds, setSavedIds] = useState<string[]>(['african-grand-hotel']);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [shareTarget, setShareTarget] = useState<StayPropertyProfile | null>(null);

  useEffect(() => {
    setTermMode(initialTermMode);
    if (initialTermMode === 'long-term' && selectedCategory === 'Hotels') {
      setSelectedCategory('All');
    }
  }, [initialTermMode]);

  // AI Hospitality Concierge Drawer
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: 'assistant' | 'user'; text: string }[]>([
    {
      role: 'assistant',
      text: 'Welcome to AfriEstate Stays. Tell me if you need a luxury weekend hotel in Cape Town, a corporate 3-month serviced residence in Kigali or Sandton, or an investment-grade coastal resort.',
    },
  ]);

  const catalogList = useMemo<StayPropertyProfile[]>(() => {
    const storedStays = getPublishedStayProfiles();
    const mergedUserStays = [...publishedStays, ...storedStays];

    const mappedFromProperties: StayPropertyProfile[] = properties.map((p) => {
      const isHotel = p.propertyType === PropertyType.HOTEL;
      const isShortStay = p.propertyType === PropertyType.SHORT_TERM_RENTAL;
      const isMonthlyRental =
        p.listingType === ListingType.RENT &&
        !isHotel &&
        !isShortStay;
      const category: StayPropertyProfile['category'] = isHotel
        ? 'Hotels'
        : isMonthlyRental || p.leaseDuration?.toLowerCase().includes('long') || p.leaseDuration?.toLowerCase().includes('medium')
          ? 'Serviced Apartments'
          : 'Resorts';

      const basePrice = Number(p.price) || 2800;
      const nightlyFromZar = p.perNightPrice
        ? Math.max(450, Math.round(basePrice))
        : Math.max(850, Math.round(basePrice / 22));
      const monthlyFromZar = p.perNightPrice
        ? Math.max(9500, Math.round(basePrice * 19))
        : Math.max(5500, Math.round(basePrice));
      const cleanTitle = sanitizeText(p.title, 120);
      const cleanCity = sanitizeText(p.address?.city || 'Cape Town', 60);
      const cleanCountry = sanitizeText(p.country || 'South Africa', 60);
      const verificationSig =
        p.verificationDetails?.titleDeedNumber ||
        generateListingSignature(p.id, p.agent?.name || 'afriestate', basePrice);

      return {
        ...FLAGSHIP_AFRICAN_GRAND_HOTEL,
        id: String(p.id),
        name: cleanTitle,
        subtitle: `${p.propertyType} · Ref ${verificationSig}`,
        country: cleanCountry,
        province: cleanCity,
        city: cleanCity,
        suburb: sanitizeText(p.address?.street || cleanCity, 80),
        category,
        propertyType: isHotel ? 'Hotel' : isMonthlyRental ? 'Serviced Apartment' : 'Villa',
        starRating: 5,
        score: p.agent?.rating ? Number(Math.min(9.9, p.agent.rating * 1.9).toFixed(1)) : 9.2,
        scoreLabel: 'Verified Stay',
        reviewCount: p.agent?.reviewCount || 18,
        nightlyFromZar,
        monthlyFromZar,
        locationLabel: `${cleanCity}, ${cleanCountry}`,
        overviewShort: sanitizeText(p.description, 260),
        heroImages: [
          {
            url: sanitizeSafeUrl(p.images?.[0], '/images/841376502.webp'),
            category: 'Exterior',
            caption: cleanTitle,
            specs: `${p.details?.beds || 2} Bedrooms · ${verificationSig}`,
            aiTags: ['Verified', isMonthlyRental ? 'Long-Term Ready' : 'Stay Ready'],
          },
          ...FLAGSHIP_AFRICAN_GRAND_HOTEL.heroImages.slice(1),
        ],
        specs: {
          ...FLAGSHIP_AFRICAN_GRAND_HOTEL.specs,
          rooms: Math.max(1, p.guests || p.details?.beds || 4),
        },
        investmentEligible: Boolean(p.targetReturn || p.rentalYield),
      };
    });

    const seen = new Map<string, StayPropertyProfile>();
    const pushIfNew = (item: StayPropertyProfile) => {
      const key = item.id || item.name.toLowerCase();
      if (!seen.has(key)) seen.set(key, item);
    };

    // Prioritize newly published live stays & mapped published properties first
    mergedUserStays.forEach(pushIfNew);
    mappedFromProperties
      .filter((m) => m.id.startsWith('hotel_') || m.id.startsWith('stay_') || m.id.startsWith('prop_') || properties.some((p) => p.id === m.id && p.dateListed > Date.now() - 1000 * 60 * 60 * 24 * 30))
      .forEach(pushIfNew);
    STAY_CATALOG_PROPERTIES.forEach(pushIfNew);
    mappedFromProperties.forEach(pushIfNew);

    const allMerged = Array.from(seen.values());
    if (termMode === 'long-term') {
      return [...allMerged].sort((a, b) => {
        const aScore = a.category === 'Serviced Apartments' ? 0 : 1;
        const bScore = b.category === 'Serviced Apartments' ? 0 : 1;
        return aScore - bScore;
      });
    }
    return allMerged;
  }, [properties, publishedStays, termMode]);

  const filteredStays = useMemo(() => {
    return catalogList.filter((item) => {
      if (savedOnly && !savedIds.includes(item.id)) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (searchCity.trim()) {
        const q = searchCity.toLowerCase();
        const hay = `${item.name} ${item.city} ${item.country} ${item.suburb} ${item.propertyType}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (userIntent === 'Investor' && !item.investmentEligible) return false;
      return true;
    });
  }, [catalogList, savedOnly, savedIds, selectedCategory, searchCity, userIntent]);

  const comparedStays = useMemo(
    () => catalogList.filter((c) => compareIds.includes(c.id)),
    [catalogList, compareIds]
  );

  const toggleSave = (id: string, name: string) => {
    setSavedIds((prev) => {
      const exists = prev.includes(id);
      addToast(exists ? `Removed ${name} from Saved Stays.` : `Saved ${name} to your stay collection.`, 'success');
      return exists ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        addToast('You can compare up to 3 stays side by side.', 'info');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = sanitizeText(aiInput.trim(), 240);
    if (!q || aiLoading) return;
    setAiMessages((prev) => [...prev, { role: 'user', text: q }]);
    setAiInput('');
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI();
      const res = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `You are AfriEstate Stays Concierge. User is looking for a ${termMode} stay (${userIntent}). Question: "${q}". Recommend between The African Grand Hotel (Cape Town beachfront, R2,450/night or R48,500/mo), Nyarutarama Ridge (Kigali extended stays, R34,200/mo), Sandton Meridian (Johannesburg CBD, R32,500/mo), or Serengeti Horizon Luxury Lodge (Tanzania, R4,950/night) in 2 concise sentences.`,
      });
      if (res.text && res.text.trim().length > 10) {
        setAiMessages((prev) => [...prev, { role: 'assistant', text: res.text.trim() }]);
        return;
      }
      throw new Error('empty');
    } catch {
      const fallback =
        termMode === 'long-term'
          ? 'For 30+ night extended stays, Nyarutarama Ridge (Kigali, from R34,200/mo) and Sandton Meridian (Johannesburg, from R32,500/mo) include full kitchens, solar backup, and 300 Mbps fibre.'
          : 'For flagship short-term hospitality, The African Grand Hotel in Camps Bay (from R2,450/night, 9.4 Exceptional) offers direct beach access, Ubuntu dining, and verified cancellation flexibility.';
      setAiMessages((prev) => [...prev, { role: 'assistant', text: fallback }]);
    } finally {
      setAiLoading(false);
    }
  };

  if (selectedStay) {
    return (
      <StayDetailsPage
        property={selectedStay}
        initialDates={{ checkIn, checkOut }}
        initialTermMode={termMode}
        initialIntent={userIntent}
        onSelectProperty={(nextProp) => setSelectedStay(nextProp)}
        onBack={() => {
          setSelectedStay(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F3] dark:bg-slate-950 text-[#151515] dark:text-slate-100 pb-24 lg:pb-16">
      {/* Premium Architectural Hero & Short/Long-Term Search Engine */}
      <section className="relative bg-[#123B2A] text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={
              termMode === 'long-term'
                ? '/images/280162474.jpg'
                : '/images/3zn_EkVTc6_QyptGfC9riJuiVbXsOnZlnNvKdCvSkQrpuj4PhovEAaX72CuasaF61v6l4JVHJ6h5Rvn9POlvySiLgZxfK2CHe4z1WawKYa34Mjcj8httsWa0IVJCbpgrtIwuSqzVbR17aorv96Z6D1STZYGR0kqvwSnX81F5nEFKbVo8-Qb01CM5FKe8oAD4.jpg'
            }
            alt={termMode === 'long-term' ? 'AfriEstate Long-Term African Residence' : 'African Short-Term Luxury Escape'}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F1A]/90 via-[#123B2A]/75 to-[#0B1F1A]/55" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C99A3D]">
                AfriEstate Hospitality &amp; Serviced Residences · Real Estate for Real People
              </p>
              <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
                {termMode === 'long-term'
                  ? 'Long-Term African Accommodation & Extended Leases'
                  : 'Short-Term Escapes & Luxury African Stays'}
              </h1>
              <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed">
                {termMode === 'long-term'
                  ? 'Verified 1–24+ month apartments, family homes, student housing, and corporate relocations synchronized directly with landlord registry checks.'
                  : 'Discover verified hotels, beachfront villas, and safari retreats engineered for travelers, corporate teams, families, and hospitality investors.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {/* Stay Term Switcher */}
                <div className="inline-flex p-1.5 rounded-2xl bg-black/40 border border-white/15 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTermMode('short-term')}
                    className={`px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap ${
                      termMode === 'short-term' ? 'bg-[#C99A3D] text-[#151515]' : 'text-white/85 hover:text-white'
                    }`}
                  >
                    Short-Term (Nightly)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTermMode('long-term')}
                    className={`px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap ${
                      termMode === 'long-term' ? 'bg-[#C99A3D] text-[#151515]' : 'text-white/85 hover:text-white'
                    }`}
                  >
                    Long-Term (1–12+ Months)
                  </button>
                </div>
                {(onListLongTermProperty || onListProperty) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (termMode === 'long-term' && onListLongTermProperty) {
                        onListLongTermProperty();
                      } else if (onListProperty) {
                        onListProperty();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition-colors whitespace-nowrap"
                  >
                    <PlusIcon className="w-4 h-4 text-[#C99A3D]" />
                    <span>List Your Stay / Rental</span>
                  </button>
                )}
              </div>
            </div>

            {/* Framed Hero Visual Card */}
            <div className="lg:col-span-5">
              {termMode === 'long-term' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl aspect-[4/3] sm:aspect-[4/5] bg-slate-900">
                    <img
                      src="/images/841376502.webp"
                      alt="Furnished Long-Term Executive Apartment Interior"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                    <div className="absolute bottom-3.5 left-3.5 right-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#C99A3D]">
                        Extended Leases
                      </p>
                      <p className="font-heading text-sm sm:text-base font-bold text-white leading-snug">
                        Move-In Ready Executive Flats
                      </p>
                    </div>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl aspect-[4/3] sm:aspect-[4/5] bg-slate-900">
                    <img
                      src="/images/2ec34ce4ca57aef13fc8b3239a99345e.jpg"
                      alt="Modern Architectural Long-Term Residence"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                    <div className="absolute bottom-3.5 left-3.5 right-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#C99A3D]">
                        Verified Landlords
                      </p>
                      <p className="font-heading text-sm sm:text-base font-bold text-white leading-snug">
                        Family Homes &amp; Estate Villas
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl aspect-[16/10] bg-slate-900">
                  <img
                    src="/images/S5AW63xLpS5OInt3q7b2VfysVJZWUgL_mA50RmD3XPIDOg6FweUaBTyD2D55tZpB00mFfWJpOaM7y51sawZ95XIy0eckan_AR9cwNRlzXYNo8omw6E0jLV0-YEdLcA237iyhzwWVPPfb99eJb5FOkA-h5zNJ3Q4YSw2vtWqoUZNhTJV3_qUS2aKUV1ys1UEF.jpg"
                    alt="Featured Short-Term Retreat & Hotel"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#C99A3D]">
                        Curated Hospitality · Instant Book
                      </p>
                      <p className="font-heading text-lg sm:text-xl font-bold text-white">
                        Villas, Safari Lodges &amp; Boutique Hotels
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Command Bar */}
          <div id="stay-search-bar" className="bg-white dark:bg-slate-900 text-[#151515] dark:text-white rounded-2xl p-3 grid grid-cols-1 md:grid-cols-12 gap-2.5 shadow-2xl">
            <div className="md:col-span-4 px-3.5 py-2.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 flex items-center gap-2.5">
              <MapPinIcon className="w-5 h-5 text-[#123B2A] dark:text-[#C99A3D] shrink-0" />
              <div className="flex-1 min-w-0">
                <label htmlFor="stay-dest-input" className="block text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                  Where are you going?
                </label>
                <input
                  id="stay-dest-input"
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="Cape Town, Kigali, Sandton, Serengeti..."
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-4 px-3.5 py-2.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 flex items-center gap-2.5">
              <CalendarDaysIcon className="w-5 h-5 text-[#123B2A] dark:text-[#C99A3D] shrink-0" />
              {termMode === 'short-term' ? (
                <div className="grid grid-cols-2 gap-2 flex-1 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-[#6B6B6B]">Check-in</span>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full bg-transparent font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-[#6B6B6B]">Check-out</span>
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
                  <span className="block text-[10px] font-bold uppercase text-[#6B6B6B]">Monthly Lease Duration</span>
                  <select
                    value={leaseMonths}
                    onChange={(e) => setLeaseMonths(Number(e.target.value))}
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold focus:outline-none"
                  >
                    {[1, 2, 3, 6, 12].map((m) => (
                      <option key={m} value={m} className="text-slate-900">
                        {m} {m === 1 ? 'Month' : 'Months'} · Starting {checkIn}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="md:col-span-2 px-3.5 py-2.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 flex items-center gap-2">
              <UserGroupIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D] shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] font-bold uppercase text-[#6B6B6B]">Guests</span>
                <select
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold focus:outline-none"
                >
                  <option className="text-slate-900">1 guest · 1 room</option>
                  <option className="text-slate-900">2 guests · 1 room</option>
                  <option className="text-slate-900">4 guests · 2 rooms</option>
                  <option className="text-slate-900">Corporate Relocation</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2 flex">
              <button
                type="button"
                onClick={() => document.getElementById('stay-catalog')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full py-3 rounded-xl bg-[#123B2A] hover:bg-[#0e2d20] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
              >
                <MagnifyingGlassIcon className="w-4 h-4 text-[#C99A3D]" />
                <span>Search Stays</span>
              </button>
            </div>
          </div>

          {/* Primary User Intent Adaptation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 mr-1">Traveling as:</span>
              {USER_INTENTS.map((intent) => (
                <button
                  key={intent}
                  type="button"
                  onClick={() => setUserIntent(intent)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    userIntent === intent
                      ? 'bg-white text-[#123B2A]'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  {intent}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsAiOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C99A3D] text-[#151515] text-xs font-bold hover:brightness-105"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Ask AfriEstate Stay AI</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        {/* Curated Short-Stay Collection & Executive Arrival Showcase */}
        {termMode === 'short-term' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#C99A3D]">
                  Short-Term Signatures &amp; Executive Arrival
                </p>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#151515] dark:text-white mt-0.5">
                  Handpicked Sanctuaries &amp; Seamless Transfers
                </h2>
              </div>
              <p className="text-xs text-[#6B6B6B] dark:text-slate-400">
                Instant confirmation · Verified hospitality partners · Chauffeur arrival options
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  image:
                    '/images/bQpZBCFZhwE8O_cs7mNAwkaUM8W3jpm_4o1EJoHW6CGw7RXnjNWQ4gX3DfiZQ6GxCxJqkk20Qg5bXqnlWqaI92-MaZ8a8Xmce7-Cu87PNH1kCvSJ58uf9qG4HPAkgSNvwht2w7D-62vuOPfMKOF4mrLv86eLr0x1s2VjH82vOpSiRnY3HbLAXkL6ghFJL81S.jpg',
                  badge: 'Boutique Suites',
                  title: 'Architectural Coastal Suites',
                  subtitle: 'Private terraces, high-speed fibre & daily hospitality',
                  action: () => setSelectedCategory('Hotels'),
                },
                {
                  image:
                    '/images/ciGI9jt_sGVPxiolPnhsy4lAgRDH_3j8eZMJxZIm97d_f65lcSHw26Eo1j98ieeBwr8GwTqFdYVrQxmycHYskbBo00ycrJusnkMalqSQ6xAVOdjkMa2TbZEkfwgILcYox9fLkhguJe46qif3N1OguJwZXehGdCmtWgd4E974iGSybhRE-PvS7RwPu3YvkhSr.jpg',
                  badge: 'Curated Retreats',
                  title: 'Private Villas & Urban Escapes',
                  subtitle: 'Ideal for leisure breaks, families & diplomatic guests',
                  action: () => setSelectedCategory('Resorts'),
                },
                {
                  image: '/images/executive_sedan_fleet.jpg',
                  badge: 'Executive Arrival',
                  title: 'Chauffeur Airport Transfer Fleet',
                  subtitle: 'Dedicated executive sedan transfers paired with your stay',
                  action: () =>
                    onNavigate
                      ? onNavigate('transport-rentals')
                      : document.getElementById('stay-catalog')?.scrollIntoView({ behavior: 'smooth' }),
                },
              ].map((card) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={card.action}
                  className="group text-left relative rounded-2xl overflow-hidden border border-[#E4E1D9] dark:border-slate-800 bg-slate-900 aspect-[16/10] shadow-sm hover:shadow-xl transition-all"
                >
                  <img
                    src={card.image}
                    alt={card.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-lg bg-[#123B2A]/95 text-[#C99A3D] text-[11px] font-bold uppercase tracking-wider">
                      {card.badge}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-heading text-lg font-bold leading-snug">{card.title}</h3>
                    <p className="text-xs text-slate-200 mt-1 line-clamp-1">{card.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Flagship Spotlight: The African Grand Hotel */}
        <section className="rounded-3xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-sm">
          <div className="lg:col-span-6 relative min-h-[280px] lg:min-h-[380px]">
            <img
              src={FLAGSHIP_AFRICAN_GRAND_HOTEL.heroImages[0].url}
              alt={FLAGSHIP_AFRICAN_GRAND_HOTEL.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-[#123B2A] text-white text-xs font-bold">
                9.4 Exceptional · 1,284 Reviews
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#C99A3D] uppercase tracking-wider">
                <span>Flagship Property Spotlight</span>
                <span className="text-[#E4E1D9]">·</span>
                <span className="inline-flex items-center gap-1 text-[#123B2A] dark:text-emerald-400">
                  <CheckBadgeIcon className="w-4 h-4 text-[#C99A3D]" />
                  AfriEstate Verified
                </span>
              </div>
              <h2 className="font-heading text-2xl sm:text-4xl font-bold text-[#151515] dark:text-white">
                {FLAGSHIP_AFRICAN_GRAND_HOTEL.name}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-[#6B6B6B] dark:text-slate-300 flex items-center gap-1.5">
                <MapPinIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D]" />
                {FLAGSHIP_AFRICAN_GRAND_HOTEL.locationLabel}
              </p>
              <p className="text-sm text-[#6B6B6B] dark:text-slate-300 leading-relaxed">
                {FLAGSHIP_AFRICAN_GRAND_HOTEL.overviewShort}
              </p>

              <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-[#F8F7F3] dark:bg-slate-800">
                  <p className="text-[#6B6B6B] dark:text-slate-400">Nightly Rate</p>
                  <p className="font-mono font-bold text-sm text-[#123B2A] dark:text-white mt-0.5">
                    From R{FLAGSHIP_AFRICAN_GRAND_HOTEL.nightlyFromZar.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F7F3] dark:bg-slate-800">
                  <p className="text-[#6B6B6B] dark:text-slate-400">Monthly Residency</p>
                  <p className="font-mono font-bold text-sm text-[#123B2A] dark:text-white mt-0.5">
                    From R{FLAGSHIP_AFRICAN_GRAND_HOTEL.monthlyFromZar.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F7F3] dark:bg-slate-800">
                  <p className="text-[#6B6B6B] dark:text-slate-400">Est. Gross Yield</p>
                  <p className="font-mono font-bold text-sm text-[#C99A3D] mt-0.5">
                    {FLAGSHIP_AFRICAN_GRAND_HOTEL.investmentData?.grossYield}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedStay(FLAGSHIP_AFRICAN_GRAND_HOTEL)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#123B2A] hover:bg-[#0d2a1e] text-white text-xs sm:text-sm font-bold"
              >
                <span>Explore Full Property &amp; Book</span>
                <ArrowRightIcon className="w-4 h-4 text-[#C99A3D]" />
              </button>
              <button
                type="button"
                onClick={() => toggleSave(FLAGSHIP_AFRICAN_GRAND_HOTEL.id, FLAGSHIP_AFRICAN_GRAND_HOTEL.name)}
                className="px-4 py-3.5 rounded-xl border border-[#E4E1D9] dark:border-slate-700 text-xs font-bold hover:border-[#123B2A]"
              >
                {savedIds.includes(FLAGSHIP_AFRICAN_GRAND_HOTEL.id) ? 'Saved in Shortlist' : 'Save Property'}
              </button>
            </div>
          </div>
        </section>

        {/* Stay Category Selector & Quick Filters */}
        <section id="stay-catalog" className="space-y-6 scroll-mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#C99A3D]">Verified Hospitality Inventory</p>
              <h2 className="font-heading text-2xl sm:text-4xl font-bold mt-1">
                {termMode === 'long-term' ? 'Long-Term Serviced Residences (30+ Days)' : 'Short-Term Hotels, Villas & Lodges'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSavedOnly((v) => !v)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  savedOnly
                    ? 'bg-[#123B2A] text-white border-[#123B2A]'
                    : 'bg-white dark:bg-slate-900 border-[#E4E1D9] dark:border-slate-700 text-[#6B6B6B] dark:text-slate-300'
                }`}
              >
                Saved Only ({savedIds.length})
              </button>
              {compareIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCompareOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C99A3D] text-[#151515] text-xs font-bold"
                >
                  <ScaleIcon className="w-4 h-4" />
                  <span>Compare ({compareIds.length})</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {STAY_STYLES.map((style) => {
              const active = selectedCategory === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedCategory(style.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    active
                      ? 'bg-[#123B2A] text-white border-[#123B2A] shadow-md'
                      : 'bg-white dark:bg-slate-900 border-[#E4E1D9] dark:border-slate-800 hover:border-[#C99A3D]'
                  }`}
                >
                  <p className={`text-sm font-bold ${active ? 'text-white' : 'text-[#151515] dark:text-white'}`}>
                    {style.label}
                  </p>
                  <p className={`text-xs mt-1 ${active ? 'text-slate-200' : 'text-[#6B6B6B] dark:text-slate-400'}`}>
                    {style.subtitle}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Stay Property Grid */}
          {filteredStays.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-12 text-center space-y-3">
              <p className="font-heading text-2xl font-bold">No stays match your active filters</p>
              <p className="text-xs sm:text-sm text-[#6B6B6B] dark:text-slate-400">
                Try clearing the search city or switching back to All Stays.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchCity('');
                  setSavedOnly(false);
                  setUserIntent('Traveler');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#123B2A] text-white text-xs font-bold"
              >
                Reset Stay Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredStays.map((stay) => {
                const isSaved = savedIds.includes(stay.id);
                const isCompared = compareIds.includes(stay.id);
                const displayPrice = termMode === 'long-term' ? stay.monthlyFromZar : stay.nightlyFromZar;

                return (
                  <article
                    key={stay.id}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={stay.heroImages[0].url}
                          alt={stay.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-[#123B2A] text-white font-mono text-xs font-bold">
                            {stay.score} {stay.scoreLabel}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-white/95 text-[#151515] text-[11px] font-bold">
                            {stay.propertyType}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleSave(stay.id, stay.name)}
                            aria-label={`Save ${stay.name}`}
                            className="p-2 rounded-full bg-white/95 text-[#151515] hover:bg-white shadow"
                          >
                            {isSaved ? (
                              <HeartSolidIcon className="w-4 h-4 text-[#123B2A]" />
                            ) : (
                              <HeartIcon className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShareTarget(stay)}
                            aria-label={`Share ${stay.name}`}
                            className="p-2 rounded-full bg-white/95 text-[#151515] hover:bg-white shadow"
                          >
                            <ShareIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between text-xs text-[#6B6B6B] dark:text-slate-400">
                          <span className="flex items-center gap-1 font-medium text-[#151515] dark:text-slate-200">
                            <MapPinIcon className="w-3.5 h-3.5 text-[#123B2A] dark:text-[#C99A3D]" />
                            {stay.locationLabel}
                          </span>
                          <span className="flex items-center gap-0.5 text-[#C99A3D]">
                            {Array.from({ length: stay.starRating }).map((_, idx) => (
                              <StarSolidIcon key={idx} className="w-3.5 h-3.5" />
                            ))}
                          </span>
                        </div>

                        <h3 className="font-heading text-2xl font-bold text-[#151515] dark:text-white">
                          {stay.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#6B6B6B] dark:text-slate-300 leading-relaxed">
                          {stay.overviewShort}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B6B6B] dark:text-slate-400 pt-1">
                          <span>{stay.specs.rooms} keys</span>
                          <span>·</span>
                          <span>Green Score {stay.sustainabilityScore}/100</span>
                          {stay.investmentEligible && stay.investmentData && (
                            <>
                              <span>·</span>
                              <span className="font-semibold text-[#123B2A] dark:text-[#C99A3D]">
                                {stay.investmentData.grossYield} Est. Yield
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-[#F8F7F3] dark:bg-slate-800/80 border-t border-[#E4E1D9] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] text-[#6B6B6B] dark:text-slate-400">
                          {termMode === 'long-term' ? `${leaseMonths}-month residency` : 'Nightly rate from'}
                        </p>
                        <p className="font-mono text-lg font-bold text-[#123B2A] dark:text-white">
                          R{displayPrice.toLocaleString()}
                          <span className="text-xs font-normal text-[#6B6B6B] dark:text-slate-400">
                            /{termMode === 'long-term' ? 'month' : 'night'}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleCompare(stay.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                            isCompared
                              ? 'bg-[#C99A3D] text-[#151515] border-[#C99A3D]'
                              : 'bg-white dark:bg-slate-900 border-[#E4E1D9] dark:border-slate-700'
                          }`}
                        >
                          {isCompared ? 'Comparing' : 'Compare'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStay(stay);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-4 py-2 rounded-xl bg-[#123B2A] hover:bg-[#0e2d20] text-white text-xs font-bold"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Booking Protection & Dual Stay Guarantee */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: CheckBadgeIcon,
              title: 'AfriEstate Verified Properties',
              desc: 'Every hotel, villa, and apartment passes identity, ownership, safety, and media checks.',
            },
            {
              icon: BuildingOffice2Icon,
              title: 'Flexible Short & Monthly Terms',
              desc: 'Switch seamlessly between 1-night hotel bookings and discounted 1–12+ month corporate leases.',
            },
            {
              icon: ShieldCheckIcon,
              title: 'Transparent Pricing & Protection',
              desc: 'Itemized nightly rates, monthly invoices, local taxes, and instant cancellation clarity.',
            },
          ].map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#123B2A] text-[#C99A3D] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold">{pillar.title}</h3>
                  <p className="text-xs text-[#6B6B6B] dark:text-slate-300 mt-1 leading-relaxed">{pillar.desc}</p>
                </div>
              </div>
            );
          })}
        </section>
      </div>

      {/* Compact Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile stay navigation"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-slate-900 border-t border-[#E4E1D9] dark:border-slate-800 px-2 py-2 grid grid-cols-5 text-[10px] font-semibold text-[#6B6B6B] dark:text-slate-300"
      >
        <button
          type="button"
          onClick={() => (onGoHome ? onGoHome() : window.scrollTo({ top: 0, behavior: 'smooth' }))}
          className="flex flex-col items-center gap-0.5 hover:text-[#123B2A]"
        >
          <HomeIcon className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button
          type="button"
          onClick={() => document.getElementById('stay-search-bar')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex flex-col items-center gap-0.5 text-[#123B2A] dark:text-[#C99A3D]"
        >
          <MagnifyingGlassIcon className="w-4 h-4" />
          <span>Search</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setSavedOnly((v) => !v);
            document.getElementById('stay-catalog')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-0.5 hover:text-[#123B2A]"
        >
          <BookmarkIcon className="w-4 h-4" />
          <span>Saved ({savedIds.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedStay(FLAGSHIP_AFRICAN_GRAND_HOTEL)}
          className="flex flex-col items-center gap-0.5 hover:text-[#123B2A]"
        >
          <CalendarDaysIcon className="w-4 h-4" />
          <span>Trips</span>
        </button>
        <button
          type="button"
          onClick={() => (onOpenAuth ? onOpenAuth() : addToast('Sign in to sync saved stays and leases.', 'info'))}
          className="flex flex-col items-center gap-0.5 hover:text-[#123B2A]"
        >
          <UserCircleIcon className="w-4 h-4" />
          <span>Account</span>
        </button>
      </nav>

      {/* Side-by-Side Comparison Modal */}
      {isCompareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCompareOpen(false)} />
          <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-2xl max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#C99A3D]">Property Comparison</p>
                <h3 className="font-heading text-2xl font-bold mt-0.5">Side-by-Side Stay Comparison</h3>
              </div>
              <button type="button" onClick={() => setIsCompareOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparedStays.map((st) => (
                <div key={st.id} className="rounded-xl bg-[#F8F7F3] dark:bg-slate-800 p-4 space-y-3 text-xs">
                  <img
                    src={st.heroImages[0].url}
                    alt={st.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div>
                    <p className="font-heading text-lg font-bold">{st.name}</p>
                    <p className="text-[#6B6B6B] dark:text-slate-400">{st.locationLabel}</p>
                  </div>
                  <div className="space-y-1.5 border-t border-[#E4E1D9] dark:border-slate-700 pt-2">
                    <p className="flex justify-between"><span>Score:</span><strong>{st.score} ({st.scoreLabel})</strong></p>
                    <p className="flex justify-between"><span>Nightly:</span><strong>R{st.nightlyFromZar.toLocaleString()}</strong></p>
                    <p className="flex justify-between"><span>Monthly:</span><strong>R{st.monthlyFromZar.toLocaleString()}</strong></p>
                    <p className="flex justify-between"><span>Green Score:</span><strong>{st.sustainabilityScore}/100</strong></p>
                    <p className="flex justify-between">
                      <span>Est. Yield:</span>
                      <strong>{st.investmentData?.grossYield || 'Hospitality Only'}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCompareOpen(false);
                      setSelectedStay(st);
                    }}
                    className="w-full py-2 rounded-lg bg-[#123B2A] text-white font-bold"
                  >
                    Inspect &amp; Reserve
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Concierge Drawer */}
      {isAiOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsAiOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 h-full flex flex-col border-l border-[#E4E1D9] dark:border-slate-800 shadow-2xl">
            <div className="px-6 py-4 bg-[#123B2A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-[#C99A3D]" />
                <div>
                  <p className="text-sm font-bold">AfriEstate Stays AI Concierge</p>
                  <p className="text-[11px] text-slate-300">Short &amp; Long-Term Accommodation Advisor</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsAiOpen(false)} className="p-1.5 rounded-lg bg-white/10">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-5 overflow-y-auto bg-[#F8F7F3] dark:bg-slate-950 space-y-3">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`px-4 py-3 rounded-xl max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#123B2A] text-white'
                        : 'bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {aiLoading && <p className="text-xs text-[#6B6B6B]">Matching stays...</p>}
            </div>

            <form onSubmit={handleAskAi} className="p-4 border-t border-[#E4E1D9] dark:border-slate-800 flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask for Cape Town oceanfront, Kigali monthly..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 border border-[#E4E1D9] dark:border-slate-700 text-xs sm:text-sm"
              />
              <button
                type="submit"
                disabled={aiLoading}
                aria-label="Ask AI"
                className="px-3.5 py-2.5 rounded-xl bg-[#123B2A] text-white"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {shareTarget && (
        <SharePropertyModal
          isOpen={Boolean(shareTarget)}
          onClose={() => setShareTarget(null)}
          propertyName={shareTarget.name}
          locationLabel={shareTarget.locationLabel}
        />
      )}
    </div>
  );
};

export default BookAStayPage;
