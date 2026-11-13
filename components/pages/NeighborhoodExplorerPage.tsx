import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Property } from '../../types';
import { ListingType, PropertyType } from '../../types';
import { NEIGHBORHOOD_GUIDES } from '../../constants';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useToast } from '../../contexts/ToastContext';
import { GoogleGenAI } from '../../lib/ai';
import LifestyleMatcherModal from '../LifestyleMatcherModal';
import {
  COUNTRY_MARKET_GUIDES,
  POSITIONING_MATRIX,
  COMPARATIVE_AFFORDABILITY_2026,
  getStructuredNeighborhoodProfile,
  type CountryCode,
  type MarketPositioningTier,
  type StructuredNeighborhoodProfile,
} from '../../data/africanNeighborhoodDatabase';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MapPinIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  AcademicCapIcon,
  MoonIcon,
  UserGroupIcon,
  WifiIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  ShareIcon,
  LinkIcon,
  CheckIcon,
  EnvelopeIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  BriefcaseIcon,
  HomeModernIcon,
  ArrowTrendingUpIcon,
  GlobeAltIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
  HeartIcon as ClinicIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, CheckBadgeIcon, StarIcon } from '@heroicons/react/24/solid';
import { FacebookIcon, TwitterIcon, WhatsAppIcon } from '../icons/SocialIcons';
import { VrHeadsetIcon } from '../icons/ActionIcons';

interface NeighborhoodExplorerPageProps {
  initialNeighborhoodId?: string;
  allProperties: Property[];
  savedNeighborhoodIds: Set<string>;
  onSaveToggle: (id: string) => void;
  onBack: () => void;
  onSelectProperty: (property: Property) => void;
  onFindProfessionalsInNeighborhood?: (neighborhoodName: string) => void;
}

type ExplorerTab = 'profile' | 'countries' | 'benchmarks';

const TIER_FILTERS: ('All' | MarketPositioningTier)[] = [
  'All',
  'Affordable',
  'Affordable–mid-market',
  'Mid-market',
  'Mid-market–premium',
  'Premium',
];

const ShareMenu: React.FC<{ profile: StructuredNeighborhoodProfile }> = ({ profile }) => {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.href.split('?')[0]}?neighborhood=${encodeURIComponent(profile.neighborhood)}`;
  const shareText = `Explore ${profile.neighborhood} (${profile.city}, ${profile.country}) neighborhood intelligence on AfriEstate`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-40">
      <a
        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
      >
        <WhatsAppIcon className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Share on WhatsApp</span>
      </a>
      <a
        href={`mailto:?subject=${encodeURIComponent(`Neighborhood Brief: ${profile.neighborhood}, ${profile.city}`)}&body=${encodeURIComponent(`${shareText}\n\n${url}`)}`}
        className="w-full px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
      >
        <EnvelopeIcon className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Share via Email</span>
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
      >
        <TwitterIcon className="w-4 h-4 text-slate-800 dark:text-white shrink-0" />
        <span>Share on X / Twitter</span>
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
      >
        <FacebookIcon className="w-4 h-4 text-blue-600 shrink-0" />
        <span>Share on Facebook</span>
      </a>
      <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
      <button
        type="button"
        onClick={handleCopy}
        className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
      >
        {copied ? (
          <>
            <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Link Copied</span>
          </>
        ) : (
          <>
            <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Copy Direct Link</span>
          </>
        )}
      </button>
    </div>
  );
};

const NeighborhoodExplorerPage: React.FC<NeighborhoodExplorerPageProps> = ({
  initialNeighborhoodId,
  allProperties,
  savedNeighborhoodIds,
  onSaveToggle,
  onBack,
  onSelectProperty,
  onFindProfessionalsInNeighborhood,
}) => {
  const { formatCurrency } = useCurrency();
  const { addToast } = useToast();

  // Build searchable catalog of all launch neighbourhoods + table entries + legacy guides
  const catalogIndex = useMemo(() => {
    const items: { name: string; city: string; countryCode: CountryCode; country: string; positioning: MarketPositioningTier; isLaunch: boolean }[] = [];
    const seen = new Set<string>();

    COUNTRY_MARKET_GUIDES.forEach((c) => {
      c.cities.forEach((row) => {
        row.neighborhoods.forEach((n) => {
          const key = `${c.code}::${n.toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            items.push({
              name: n,
              city: row.city,
              countryCode: c.code,
              country: c.name,
              positioning: row.positioning,
              isLaunch: c.launchPriorityAreas.some((l) => l.toLowerCase() === n.toLowerCase()),
            });
          }
        });
      });
    });

    NEIGHBORHOOD_GUIDES.forEach((g) => {
      const key = `ZA::${g.name.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push({
          name: g.name,
          city: 'South Africa',
          countryCode: 'ZA',
          country: 'South Africa',
          positioning: 'Mid-market',
          isLaunch: false,
        });
      }
    });

    return items;
  }, []);

  const initialSelection = useMemo(() => {
    if (initialNeighborhoodId) {
      return getStructuredNeighborhoodProfile(initialNeighborhoodId);
    }
    return getStructuredNeighborhoodProfile('Goodwood', 'Cape Town', 'ZA');
  }, [initialNeighborhoodId]);

  const [activeTab, setActiveTab] = useState<ExplorerTab>('profile');
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(initialSelection.countryCode);
  const [selectedQuery, setSelectedQuery] = useState<{ name: string; city?: string; countryCode?: CountryCode }>({
    name: initialNeighborhoodId || 'Goodwood',
    city: initialSelection.city,
    countryCode: initialSelection.countryCode,
  });
  const [compareNeighborhoodName, setCompareNeighborhoodName] = useState<string>('Randburg');
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'All' | MarketPositioningTier>('All');
  const [inventoryFilter, setInventoryFilter] = useState<'rent' | 'sale'>('rent');
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);
  const [commuteDestination, setCommuteDestination] = useState('');
  const [customCommute, setCustomCommute] = useState<{ drive: number; transit: number; bike: number } | null>(null);
  const [isLifestyleMatcherOpen, setIsLifestyleMatcherOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // AI Neighbourhood Insights state (Section 12, item 15)
  const [aiBriefText, setAiBriefText] = useState<string | null>(null);
  const [isGeneratingAiBrief, setIsGeneratingAiBrief] = useState(false);

  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialNeighborhoodId) {
      const resolved = getStructuredNeighborhoodProfile(initialNeighborhoodId);
      setSelectedCountryCode(resolved.countryCode);
      setSelectedQuery({
        name: initialNeighborhoodId,
        city: resolved.city,
        countryCode: resolved.countryCode,
      });
      setActiveTab('profile');
      setActiveGalleryIdx(0);
      setAiBriefText(null);
    }
  }, [initialNeighborhoodId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
        setIsShareOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const profile = useMemo(
    () => getStructuredNeighborhoodProfile(selectedQuery.name, selectedQuery.city, selectedQuery.countryCode),
    [selectedQuery]
  );

  const comparedProfile = useMemo(
    () => getStructuredNeighborhoodProfile(compareNeighborhoodName),
    [compareNeighborhoodName]
  );

  const activeCountryGuide = useMemo(
    () => COUNTRY_MARKET_GUIDES.find((c) => c.code === selectedCountryCode) || COUNTRY_MARKET_GUIDES[0],
    [selectedCountryCode]
  );

  const selectNeighborhood = (name: string, city?: string, countryCode?: CountryCode) => {
    const next = getStructuredNeighborhoodProfile(name, city, countryCode);
    setSelectedCountryCode(next.countryCode);
    setSelectedQuery({ name: next.neighborhood, city: next.city, countryCode: next.countryCode });
    setActiveTab('profile');
    setActiveGalleryIdx(0);
    setCustomCommute(null);
    setAiBriefText(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered quick-pick items for search or country switcher
  const quickPickItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return catalogIndex.filter((item) => {
      const matchesCountry = item.countryCode === selectedCountryCode || q.length > 0;
      const matchesTier = tierFilter === 'All' || item.positioning === tierFilter;
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q) ||
        item.positioning.toLowerCase().includes(q);
      return matchesCountry && matchesTier && matchesQuery;
    });
  }, [catalogIndex, selectedCountryCode, tierFilter, searchTerm]);

  // Real filtered Rent vs Sale inventory matching selected neighborhood/city/country
  const { rentListings, saleListings } = useMemo(() => {
    const cityToken = profile.city.toLowerCase();
    const countryToken = profile.country.toLowerCase();
    const neighborhoodToken = profile.neighborhood.toLowerCase();

    const matchesPlace = (p: Property) => {
      const text = `${p.title} ${p.address.city} ${p.address.street} ${p.country || ''} ${p.neighborhoodInfo || ''}`.toLowerCase();
      return text.includes(neighborhoodToken) || text.includes(cityToken) || text.includes(countryToken);
    };

    const isRentOrStay = (p: Property) =>
      p.listingType === ListingType.RENT ||
      p.propertyType === PropertyType.SHORT_TERM_RENTAL ||
      p.propertyType === PropertyType.HOTEL ||
      Boolean(p.perNightPrice);

    const rents = allProperties.filter((p) => isRentOrStay(p) && matchesPlace(p));
    const sales = allProperties.filter(
      (p) => (p.listingType === ListingType.SALE || p.listingType === ListingType.FOR_INVESTMENT) && matchesPlace(p)
    );

    const fallbackRents = allProperties.filter(isRentOrStay);
    const fallbackSales = allProperties.filter(
      (p) => p.listingType === ListingType.SALE || p.listingType === ListingType.FOR_INVESTMENT
    );

    return {
      rentListings: (rents.length > 0 ? rents : fallbackRents).slice(0, 4),
      saleListings: (sales.length > 0 ? sales : fallbackSales).slice(0, 4),
    };
  }, [allProperties, profile]);

  const activeInventory = inventoryFilter === 'rent' ? rentListings : saleListings;

  const maxSaleTrend = useMemo(
    () => Math.max(...profile.priceTrends.map((t) => t.avgSaleUsd), 1),
    [profile]
  );

  const handleCalculateCommute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commuteDestination.trim()) return;
    const seed = commuteDestination.trim().length;
    setCustomCommute({
      drive: 14 + (seed % 18),
      transit: 24 + (seed % 24),
      bike: 32 + (seed % 26),
    });
  };

  const handleGenerateAiBrief = async () => {
    setIsGeneratingAiBrief(true);
    try {
      const ai = new GoogleGenAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Provide a concise, factual real estate investor and resident intelligence note (3 short sentences) for ${profile.neighborhood} in ${profile.city}, ${profile.country}. Positioning: ${profile.propertyMarket}. Avg Asking: $${profile.purchaseMetricsUsd.avgAskingUsd}, Avg Rent: $${profile.rentalRangesUsd.avgMonthlyUsd}/mo, Gross Yield: ${profile.yieldEstimates.grossYieldPct}%. Emphasize street-level due diligence on utilities and title verification.`,
      });
      if (response.text && response.text.trim().length > 20) {
        setAiBriefText(response.text.trim());
      } else {
        throw new Error('Empty response');
      }
    } catch {
      // Structured deterministic intelligence brief fallback — never exposes API errors to users
      setAiBriefText(
        `${profile.neighborhood} anchors ${profile.city}'s ${profile.propertyMarket.toLowerCase()} segment with an estimated ${profile.yieldEstimates.grossYieldPct.toFixed(1)}% gross rental yield and ${profile.rentalDemand.toLowerCase()} tenant absorption. Buyers and diaspora investors should prioritize street-level utility verification (backup solar/inverter, water storage, paved drainage) alongside an official ${profile.country} title deed registry check before deposit escrow release.`
      );
    } finally {
      setIsGeneratingAiBrief(false);
    }
  };

  const handleSave = () => {
    onSaveToggle(profile.id);
    addToast(
      savedNeighborhoodIds.has(profile.id)
        ? `Removed ${profile.neighborhood} from saved districts.`
        : `Saved ${profile.neighborhood} (${profile.city}) to your Watchlist.`,
      'success'
    );
  };

  const isSaved = savedNeighborhoodIds.has(profile.id);

  const scoreMetrics = [
    { label: 'Safety Context', score: profile.scores.safety, icon: ShieldCheckIcon },
    { label: 'Schools & Universities', score: profile.scores.schools, icon: AcademicCapIcon },
    { label: 'Value & Affordability', score: profile.scores.affordability, icon: BanknotesIcon },
    { label: 'Family Suitability', score: profile.scores.familyFriendly, icon: UserGroupIcon },
    { label: 'Retail & Dining', score: profile.scores.nightlife, icon: MoonIcon },
    { label: 'Connectivity & Fibre', score: profile.scores.connectivity, icon: WifiIcon },
  ];

  const allLaunchComparisonOptions = useMemo(() => {
    return COUNTRY_MARKET_GUIDES.flatMap((c) =>
      c.launchPriorityAreas.map((area) => ({
        label: `${area} (${c.name})`,
        name: area,
        country: c.name,
      }))
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Sticky Top Navigation & Mode Bar */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeftIcon className="w-4 h-4 shrink-0" />
              <span>Back to Marketplace</span>
            </button>
            <nav className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span>African Neighbourhood Intelligence</span>
              <span aria-hidden="true">·</span>
              <span>{profile.country}</span>
              <span aria-hidden="true">·</span>
              <span>{profile.city}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate">{profile.neighborhood}</span>
            </nav>
          </div>

          {/* Primary View Mode Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              15-Point Neighbourhood Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('countries')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'countries'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              8-Country Directory & Launch Hubs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('benchmarks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'benchmarks'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Investment Matrix & 2026 Index
            </button>
          </div>

          {/* Right Utility Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsLifestyleMatcherOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-amber-300 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <SparklesIcon className="w-4 h-4 shrink-0" />
              <span>Lifestyle Matcher</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isSaved
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {isSaved ? <HeartIconSolid className="w-4 h-4 shrink-0" /> : <HeartIcon className="w-4 h-4 shrink-0" />}
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <div className="relative" ref={shareRef}>
              <button
                type="button"
                onClick={() => setIsShareOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                <ShareIcon className="w-4 h-4 shrink-0" />
                <span>Share</span>
              </button>
              {isShareOpen && <ShareMenu profile={profile} />}
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Hero Header & Country + Launch Neighbourhood Control Deck */}
      <section className="w-full bg-[#0B1F1A] text-white border-b border-white/10">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-10 lg:py-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-amber-300">
                <GlobeAltIcon className="w-4 h-4 shrink-0" />
                <span>African Neighbourhood Intelligence Database</span>
              </div>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading tracking-tight text-white"
                style={{ textWrap: 'balance' }}
              >
                Pan-African Neighbourhood Explorer
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Explore structured neighbourhood intelligence across 8 priority African markets—covering South Africa, Nigeria, Kenya, Ghana, Rwanda, Egypt, Morocco, and Angola—from high-yield urban centres to family commuter belts.
              </p>
            </div>

            {/* Live Neighbourhood Search + Tier Filter */}
            <div className="lg:col-span-5 space-y-3">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search neighbourhood or city (e.g. Goodwood, Yaba, Ngara, Kilamba)..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 text-white placeholder:text-slate-400 text-xs sm:text-sm border border-white/15 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {TIER_FILTERS.map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setTierFilter(tier)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      tierFilter === tier
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-white/10 text-slate-200 hover:bg-white/15'
                    }`}
                  >
                    {tier === 'All' ? 'All Positioning Tiers' : tier}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 8 Country Market Selector Row (Zero Flag Emojis — Clean ISO Codes) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {COUNTRY_MARKET_GUIDES.map((country) => {
              const active = selectedCountryCode === country.code;
              return (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    setSelectedCountryCode(country.code);
                    if (activeTab === 'profile') {
                      const firstArea = country.launchPriorityAreas[0];
                      selectNeighborhood(firstArea, undefined, country.code);
                    }
                  }}
                  className={`p-3 rounded-xl text-left transition-all border ${
                    active
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg'
                      : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                        active ? 'bg-slate-950 text-amber-300' : 'bg-white/10 text-amber-300'
                      }`}
                    >
                      {country.code}
                    </span>
                    <span className={`font-mono text-[11px] tabular-nums ${active ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                      {country.cities.reduce((sum, r) => sum + r.neighborhoods.length, 0)} areas
                    </span>
                  </div>
                  <p className="text-xs font-bold mt-2 truncate">{country.name}</p>
                </button>
              );
            })}
          </div>

          {/* Launch & Filtered Neighbourhoods Strip for Selected Country / Search */}
          <div className="pt-2 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <span>
                {searchTerm.trim()
                  ? `Matching neighbourhoods (${quickPickItems.length})`
                  : `${activeCountryGuide.name} Priority & Tracked Neighbourhoods — Select any location to inspect its full 15-point profile`}
              </span>
              {searchTerm.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-amber-300 hover:underline font-medium"
                >
                  Clear search
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {(quickPickItems.length > 0 ? quickPickItems.slice(0, 18) : catalogIndex.filter((i) => i.countryCode === selectedCountryCode)).map((item) => {
                const isSelected =
                  profile.neighborhood.toLowerCase() === item.name.toLowerCase() &&
                  profile.countryCode === item.countryCode &&
                  activeTab === 'profile';
                return (
                  <button
                    key={`${item.countryCode}-${item.city}-${item.name}`}
                    type="button"
                    onClick={() => selectNeighborhood(item.name, item.city, item.countryCode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-white text-slate-950 font-semibold shadow-sm'
                        : item.isLaunch
                        ? 'bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/60'
                        : 'bg-white/10 hover:bg-white/15 text-slate-200'
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-slate-500' : 'text-slate-400'}`}>
                      {item.city}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="w-full px-4 sm:px-6 lg:px-10 pt-8 space-y-10">
        {/* ==================== TAB 1: 15-POINT STRUCTURED PROFILE ==================== */}
        {activeTab === 'profile' && (
          <>
            {/* Structured Intelligence Database Record Summary Strip */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-amber-300">
                    Structured Database Record
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                    {profile.neighborhood}, {profile.city}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                  <span>
                    Country: <strong className="text-slate-900 dark:text-white">{profile.country} ({profile.countryCode})</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Market Tier: <strong className="text-slate-900 dark:text-white">{profile.propertyMarket}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Rental Demand: <strong className="text-emerald-700 dark:text-emerald-400">{profile.rentalDemand}</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Property Types</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                    {profile.propertyTypes.join(', ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Avg Monthly Lease</span>
                  <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white mt-0.5 block">
                    {formatCurrency(profile.rentalRangesUsd.avgMonthlyUsd)}/mo
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Avg Asking Price</span>
                  <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white mt-0.5 block">
                    {formatCurrency(profile.purchaseMetricsUsd.avgAskingUsd)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Indicative Gross Yield</span>
                  <span className="font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                    {profile.yieldEstimates.grossYieldPct.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">12-Mo Price Velocity</span>
                  <span className="font-mono font-bold tabular-nums text-amber-600 dark:text-amber-300 mt-0.5 block">
                    +{profile.yoyGrowthPct.toFixed(1)}% YoY
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Development Activity</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block line-clamp-2">
                    {profile.developmentActivity}
                  </span>
                </div>
              </div>
            </section>

            {/* Points 01, 05, 06, 08: Gallery + Overview + Rental & Purchase Benchmarks */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Left 7 cols: Photography, Overview & Recommendation Status */}
              <div className="lg:col-span-7 flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  <div className="relative h-[300px] sm:h-[400px] rounded-2xl overflow-hidden bg-slate-900">
                    <img
                      src={profile.gallery[activeGalleryIdx] || profile.heroImage}
                      alt={`${profile.neighborhood}, ${profile.city}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
                    <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4 text-white">
                      <div>
                        <p className="text-xs font-medium text-amber-300">
                          {profile.country} · {profile.city} · {profile.propertyMarket}
                        </p>
                        <h3 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight mt-0.5">
                          01. {profile.neighborhood} Overview
                        </h3>
                      </div>

                      <a
                        href={profile.virtualTourUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-semibold hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
                      >
                        <VrHeadsetIcon className="w-4 h-4 shrink-0" />
                        <span>360° Virtual Walk</span>
                      </a>
                    </div>
                  </div>

                  {/* Thumbnails */}
                  <div className="grid grid-cols-3 gap-3">
                    {profile.gallery.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveGalleryIdx(idx)}
                        className={`relative h-20 sm:h-24 rounded-xl overflow-hidden transition-opacity ${
                          activeGalleryIdx === idx ? 'ring-2 ring-emerald-700 dark:ring-amber-400' : 'opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`${profile.neighborhood} photo ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Narrative Overview & Priority Advisory */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    {profile.isLaunchPriority && (
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        Priority Launch Coverage Hub
                      </span>
                    )}
                    {profile.isLaunchPriority && profile.isTopRecommendation && <span aria-hidden="true">·</span>}
                    {profile.isTopRecommendation && (
                      <span className="font-semibold text-amber-700 dark:text-amber-300">
                        Top Country Recommendation
                      </span>
                    )}
                  </div>

                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                    {profile.overview}
                  </p>

                  {profile.recommendationNote && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-[#FAF8F5] dark:bg-slate-800/70 p-4 rounded-xl">
                      <strong className="text-slate-900 dark:text-white">Analyst Note: </strong>
                      {profile.recommendationNote}
                    </p>
                  )}
                </div>
              </div>

              {/* Right 5 cols: Points 05 (Average Rental Prices), 06 (Average Purchase Prices), 08 (Rental Yield Estimates) */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-5">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 h-full flex flex-col justify-between">
                  <div className="space-y-6">
                    {/* 05. Average Rental Prices */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        05. Average Rental Prices
                      </p>
                      <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                        <div className="py-2.5 flex items-center justify-between gap-4">
                          <span className="text-slate-600 dark:text-slate-300">Studio / 1-Bedroom Apartment</span>
                          <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                            {formatCurrency(Math.round(profile.rentalRangesUsd.avgMonthlyUsd * 0.72))}/mo est.
                          </span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between gap-4">
                          <span className="text-slate-600 dark:text-slate-300">2-Bedroom Residence</span>
                          <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                            {formatCurrency(profile.rentalRangesUsd.avgMonthlyUsd)}/mo avg
                          </span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between gap-4">
                          <span className="text-slate-600 dark:text-slate-300">3-Bedroom+ House / Duplex</span>
                          <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                            {formatCurrency(Math.round(profile.rentalRangesUsd.avgMonthlyUsd * 1.45))}/mo est.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 06. Average Purchase Prices */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                        06. Average Purchase Prices
                      </p>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            Median Asking Price
                          </span>
                          <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1 block">
                            {formatCurrency(profile.purchaseMetricsUsd.avgAskingUsd)}
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            Estimated Rate / sqm
                          </span>
                          <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1 block">
                            {formatCurrency(profile.purchaseMetricsUsd.pricePerSqmUsd)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 08. Rental Yield Estimates */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        08. Rental Yield Estimates
                      </p>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-3xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                          {profile.yieldEstimates.grossYieldPct.toFixed(1)}% Gross
                        </span>
                        <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {profile.yieldEstimates.netYieldRange} · {profile.yieldEstimates.occupancyEstimate}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {profile.yieldEstimates.yieldCommentary}
                      </p>
                    </div>
                  </div>

                  {onFindProfessionalsInNeighborhood && (
                    <button
                      type="button"
                      onClick={() => onFindProfessionalsInNeighborhood(profile.neighborhood)}
                      className="w-full py-3.5 px-5 rounded-xl bg-[#0B1F1A] hover:bg-emerald-950 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <BriefcaseIcon className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>Find Vetted Professionals in {profile.neighborhood}</span>
                      <ArrowRightIcon className="w-4 h-4 shrink-0" />
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Points 03 & 04: Available Properties for Rent & For Sale */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    03 & 04 · Live Marketplace Inventory
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                    {inventoryFilter === 'rent'
                      ? `Available Properties for Rent (${profile.city})`
                      : `Available Properties for Sale (${profile.city})`}
                  </h3>
                </div>

                <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setInventoryFilter('rent')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      inventoryFilter === 'rent'
                        ? 'bg-[#0B1F1A] text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    03. For Rent ({rentListings.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInventoryFilter('sale')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      inventoryFilter === 'sale'
                        ? 'bg-[#0B1F1A] text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    04. For Sale ({saleListings.length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {activeInventory.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectProperty(item)}
                    className="group text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col"
                  >
                    <div className="relative h-44 w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                      <img
                        src={item.images[0] || '/images/house_suburbs_1779978598551.png'}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span>{item.listingType}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{item.address.city}</span>
                          {item.verified && <CheckBadgeIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </p>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 mt-1 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors">
                          {item.title}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                          {formatCurrency(item.price)}
                        </span>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-amber-300 inline-flex items-center gap-1">
                          View <ArrowRightIcon className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Points 02 & 11: Interactive Map & Transport + Accessibility */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* 02. Interactive Map */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      02. Interactive Map
                    </p>
                    <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                      {profile.neighborhood} Spatial Coordinates
                    </h3>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {profile.coordinates.lat.toFixed(4)}, {profile.coordinates.lng.toFixed(4)}
                  </span>
                </div>

                <div className="flex-1 min-h-[320px] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <iframe
                    title={`Map of ${profile.neighborhood}, ${profile.city}`}
                    className="w-full h-full min-h-[320px]"
                    loading="lazy"
                    allowFullScreen
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${profile.neighborhood}, ${profile.city}, ${profile.country}`)}&ll=${profile.coordinates.lat},${profile.coordinates.lng}&z=13&output=embed`}
                  />
                </div>
              </div>

              {/* 11. Transport & Accessibility + Custom Commute Estimator */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    11. Transport & Accessibility
                  </p>
                  <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                    Transit Corridors & Commute Times
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                    {profile.transportAndAccessibility.summary}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white block">Primary Arterials & Transit Links:</span>
                  <p className="text-slate-600 dark:text-slate-300">
                    {profile.transportAndAccessibility.corridors.join(' · ')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {profile.transportAndAccessibility.commutes.map((dest) => (
                    <div key={dest.label} className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 space-y-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{dest.label}</p>
                      <p className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        Car: {dest.driveMin} min
                      </p>
                      <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        Transit: {dest.transitMin} min
                      </p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleCalculateCommute} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Estimate Custom Commute From {profile.neighborhood}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={commuteDestination}
                      onChange={(e) => setCommuteDestination(e.target.value)}
                      placeholder="Enter workplace, university campus, or airport..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 text-xs font-semibold inline-flex items-center justify-center gap-2 shrink-0 hover:bg-emerald-900 transition-colors"
                    >
                      <ClockIcon className="w-4 h-4" />
                      <span>Estimate</span>
                    </button>
                  </div>
                  {customCommute && (
                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-center">
                        <span className="text-lg font-bold font-mono tabular-nums text-emerald-900 dark:text-emerald-200">
                          {customCommute.drive}m
                        </span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">By Car</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 text-center">
                        <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                          {customCommute.transit}m
                        </span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">Public Transit</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 text-center">
                        <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                          {customCommute.bike}m
                        </span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">By Bicycle</span>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </section>

            {/* Points 07, 09, 10, 12: Price Trends & Local Infrastructure Anchors */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* 07. Property Price Trends + 14. New Developments */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                        07. Property Price Trends
                      </p>
                      <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                        Pricing Velocity ({profile.yoyGrowthPct > 0 ? `+${profile.yoyGrowthPct}%` : profile.yoyGrowthPct}% YoY)
                      </h3>
                    </div>
                    <ArrowTrendingUpIcon className="w-6 h-6 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  </div>

                  <div className="mt-5 space-y-4">
                    {profile.priceTrends.map((point) => {
                      const pct = Math.round((point.avgSaleUsd / maxSaleTrend) * 100);
                      return (
                        <div key={point.month} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{point.month} 2026</span>
                            <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                              Sale {formatCurrency(point.avgSaleUsd)} · Rent {formatCurrency(point.avgRentUsd)}/mo
                            </span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-500 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 14. New Developments */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    14. New Developments & Pipeline
                  </p>
                  <div className="space-y-3">
                    {profile.newDevelopments.map((dev) => (
                      <div key={dev.name} className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-slate-900 dark:text-white">{dev.name}</span>
                          <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 shrink-0">
                            {dev.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{dev.type}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5">
                          {dev.highlight}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 09. Schools & Universities + 10. Hospitals & Healthcare + 12. Restaurants & Shopping */}
              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 09. Schools */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <AcademicCapIcon className="w-5 h-5 shrink-0" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">09. Schools & Universities</h4>
                  </div>
                  <div className="space-y-3">
                    {profile.schoolsAndUniversities.map((school) => (
                      <div key={school.name} className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">{school.name}</span>
                          <span className="font-mono tabular-nums text-slate-500 shrink-0">{school.distance}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{school.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 10. Hospitals */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <ClinicIcon className="w-5 h-5 shrink-0" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">10. Hospitals & Healthcare</h4>
                  </div>
                  <div className="space-y-3">
                    {profile.hospitalsAndHealthcare.map((hosp) => (
                      <div key={hosp.name} className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">{hosp.name}</span>
                          <span className="font-mono tabular-nums text-slate-500 shrink-0">{hosp.distance}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{hosp.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 12. Restaurants & Shopping */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                    <BuildingStorefrontIcon className="w-5 h-5 shrink-0" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">12. Restaurants & Shopping</h4>
                  </div>
                  <div className="space-y-3">
                    {profile.restaurantsAndShopping.map((shop) => (
                      <div key={shop.name} className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">{shop.name}</span>
                          <span className="font-mono tabular-nums text-slate-500 shrink-0">{shop.distance}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{shop.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Points 13 & 15: Safety & Environment + AI-Generated Neighbourhood Insights */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* 13. Safety & Environmental Information */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    13. Safety & Environmental Information
                  </p>
                  <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                    Livability Dimensions & Street-Level Due Diligence
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {scoreMetrics.map((metric) => (
                    <div key={metric.label} className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                          <metric.icon className="w-4 h-4 text-emerald-700 dark:text-amber-300 shrink-0" />
                          <span>{metric.label}</span>
                        </span>
                        <span className="font-mono tabular-nums text-slate-900 dark:text-white">{metric.score}/10</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-800 dark:bg-amber-400"
                          style={{ width: `${metric.score * 10}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 text-xs leading-relaxed">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                    <span className="font-bold text-slate-900 dark:text-white block">Local Environment & Utilities</span>
                    <p className="text-slate-600 dark:text-slate-300">{profile.safetyAndEnvironment.summary}</p>
                    <p className="text-slate-600 dark:text-slate-300 pt-1">{profile.safetyAndEnvironment.utilitiesNote}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 flex items-start gap-2.5">
                    <ExclamationTriangleIcon className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
                    <p className="text-amber-950 dark:text-amber-200">
                      <strong>Verification Notice: </strong>
                      {profile.safetyAndEnvironment.infrastructureCaveat}
                    </p>
                  </div>
                </div>
              </div>

              {/* 15. AI-Generated Neighbourhood Insights & Side-by-Side Comparison */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#0B1F1A] text-white rounded-2xl p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                        15. AI-Generated Neighbourhood Insights
                      </p>
                      <h3 className="text-lg font-bold font-heading text-white mt-0.5">
                        {profile.aiBaselineInsight.headline}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateAiBrief}
                      disabled={isGeneratingAiBrief}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                    >
                      <SparklesIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{isGeneratingAiBrief ? 'Synthesizing...' : aiBriefText ? 'Refresh Brief' : 'Generate AI Brief'}</span>
                    </button>
                  </div>

                  {aiBriefText && (
                    <div className="p-3.5 rounded-xl bg-white/10 text-xs sm:text-sm text-amber-100 leading-relaxed">
                      {aiBriefText}
                    </div>
                  )}

                  <div className="space-y-3 text-xs text-slate-200 leading-relaxed">
                    <div>
                      <span className="font-semibold text-amber-300 block">Resident & Buyer Fit</span>
                      <p className="mt-0.5">{profile.aiBaselineInsight.buyerFit}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-amber-300 block">Yield & Demand Context</span>
                      <p className="mt-0.5">{profile.aiBaselineInsight.investorThesis}</p>
                    </div>
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <span className="font-semibold text-white block">Street-Level Validation Checklist</span>
                      {profile.aiBaselineInsight.dueDiligenceChecklist.map((step, i) => (
                        <p key={i} className="text-slate-300">
                          0{i + 1}. {step}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Head-to-Head Compare Widget */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Side-by-Side Comparison</h4>
                    <select
                      value={compareNeighborhoodName}
                      onChange={(e) => setCompareNeighborhoodName(e.target.value)}
                      className="text-xs bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      {allLaunchComparisonOptions.map((opt) => (
                        <option key={`${opt.country}-${opt.name}`} value={opt.name}>
                          {opt.name} ({opt.country})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 p-4 space-y-2.5 text-xs">
                    <div className="grid grid-cols-3 font-semibold text-slate-500 dark:text-slate-400">
                      <span>Indicator</span>
                      <span className="text-right truncate">{profile.neighborhood}</span>
                      <span className="text-right truncate">{comparedProfile.neighborhood}</span>
                    </div>
                    <div className="grid grid-cols-3 font-mono tabular-nums">
                      <span className="font-sans text-slate-700 dark:text-slate-300">Avg Ask</span>
                      <span className="text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(profile.purchaseMetricsUsd.avgAskingUsd)}
                      </span>
                      <span className="text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(comparedProfile.purchaseMetricsUsd.avgAskingUsd)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 font-mono tabular-nums">
                      <span className="font-sans text-slate-700 dark:text-slate-300">Avg Rent</span>
                      <span className="text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(profile.rentalRangesUsd.avgMonthlyUsd)}/mo
                      </span>
                      <span className="text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(comparedProfile.rentalRangesUsd.avgMonthlyUsd)}/mo
                      </span>
                    </div>
                    <div className="grid grid-cols-3 font-mono tabular-nums">
                      <span className="font-sans text-slate-700 dark:text-slate-300">Gross Yield</span>
                      <span className="text-right font-bold text-emerald-700 dark:text-emerald-400">
                        {profile.yieldEstimates.grossYieldPct.toFixed(1)}%
                      </span>
                      <span className="text-right font-bold text-emerald-700 dark:text-emerald-400">
                        {comparedProfile.yieldEstimates.grossYieldPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ==================== TAB 2: 8-COUNTRY MARKET DIRECTORY & LAUNCH HUBS ==================== */}
        {activeTab === 'countries' && (
          <div className="space-y-10">
            {/* Selected Country Detailed Market Table + Top 5 Recommendations */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                      {activeCountryGuide.code}
                    </span>
                    <span>{activeCountryGuide.region}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">Market Depth Rating {activeCountryGuide.scoreIndex}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white">
                    {activeCountryGuide.name} Residential Market Directory
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeCountryGuide.overview}
                  </p>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                  Click any neighbourhood below to launch its 15-point dossier
                </div>
              </div>

              {/* Clean Responsive Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-3 pr-4">City</th>
                      <th className="py-3 px-4">Recommended Neighbourhoods</th>
                      <th className="py-3 pl-4 text-right">Market Positioning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {activeCountryGuide.cities
                      .filter((row) => tierFilter === 'All' || row.positioning === tierFilter)
                      .map((row, idx) => (
                        <tr key={`${row.city}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 pr-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap align-top">
                            {row.city}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1.5">
                              {row.neighborhoods.map((nb) => {
                                const isPriority = activeCountryGuide.launchPriorityAreas.includes(nb);
                                return (
                                  <button
                                    key={nb}
                                    type="button"
                                    onClick={() => selectNeighborhood(nb, row.city, activeCountryGuide.code)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                      isPriority
                                        ? 'bg-[#0B1F1A] text-amber-300 hover:bg-emerald-900'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-amber-100 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    {nb}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-3.5 pl-4 text-right text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap align-top">
                            {row.positioning}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Top 5 Recommendations + Important Advisory */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                <div className="lg:col-span-8 bg-[#FAF8F5] dark:bg-slate-800/60 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Top 5 Recommended Areas in {activeCountryGuide.name}
                  </h3>
                  <div className="space-y-2.5">
                    {activeCountryGuide.topRecommendations.map((rec) => (
                      <div key={rec.rank} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm py-1.5 border-b border-slate-200/70 dark:border-slate-700/60 last:border-0">
                        <div>
                          <span className="font-mono font-bold text-emerald-700 dark:text-amber-300 mr-2">
                            0{rec.rank}.
                          </span>
                          <button
                            type="button"
                            onClick={() => selectNeighborhood(rec.area, rec.city, activeCountryGuide.code)}
                            className="font-bold text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-amber-300 underline-offset-2 hover:underline"
                          >
                            {rec.area}{rec.city ? `, ${rec.city}` : ''}
                          </button>
                          <span className="text-slate-600 dark:text-slate-300"> — {rec.summary}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  {(activeCountryGuide.importantNote || activeCountryGuide.highlightNote) && (
                    <div className="p-5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                        <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                        <span>Local Market Advisory</span>
                      </div>
                      <p className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed">
                        {activeCountryGuide.importantNote || activeCountryGuide.highlightNote}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Priority Initial AfriEstate Launch Coverage Blueprint */}
            <section className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Launch Coverage Blueprint
                </p>
                <h3 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                  Recommended Initial High-Priority Coverage Across 8 African Markets
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Start with these core priority districts before expanding into secondary cities and outer growth corridors.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {COUNTRY_MARKET_GUIDES.map((country) => (
                  <div
                    key={country.code}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{country.code}</span>
                        <span>High Priority</span>
                      </div>
                      <h4 className="text-lg font-bold font-heading text-slate-900 dark:text-white mt-1">
                        {country.name}
                      </h4>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {country.launchPriorityAreas.map((area) => (
                          <button
                            key={area}
                            type="button"
                            onClick={() => selectNeighborhood(area, undefined, country.code)}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 hover:bg-[#0B1F1A] hover:text-amber-300 dark:hover:bg-amber-400 dark:hover:text-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedCountryCode(country.code)}
                      className="text-xs font-semibold text-emerald-700 dark:text-amber-300 inline-flex items-center gap-1 hover:underline self-start"
                    >
                      <span>View {country.name} table</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ==================== TAB 3: INVESTMENT POSITIONING MATRIX & 2026 INDEX ==================== */}
        {activeTab === 'benchmarks' && (
          <div className="space-y-10">
            {/* Section 9: Best Neighbourhoods by Investment & Lifestyle Potential */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Market Segmentation Matrix
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                  Best Neighbourhoods by Value, Growth & Premium Positioning
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
                  Distinguish between affordable everyday residential value markets, rapidly expanding mid-market tenant corridors, and premier diplomatic or coastal districts.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-3 pr-4">Country</th>
                      <th className="py-3 px-4">Best Value Areas</th>
                      <th className="py-3 px-4">Best Growth Areas</th>
                      <th className="py-3 pl-4">Premium Areas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {POSITIONING_MATRIX.map((row) => (
                      <tr key={row.countryCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 pr-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          <span className="font-mono text-xs text-slate-400 mr-2">{row.countryCode}</span>
                          {row.country}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {row.bestValue.map((area) => (
                              <button
                                key={area}
                                type="button"
                                onClick={() => selectNeighborhood(area, undefined, row.countryCode)}
                                className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium hover:underline"
                              >
                                {area}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {row.bestGrowth.map((area) => (
                              <button
                                key={area}
                                type="button"
                                onClick={() => selectNeighborhood(area, undefined, row.countryCode)}
                                className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-medium hover:underline"
                              >
                                {area}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 pl-4">
                          <div className="flex flex-wrap gap-1.5">
                            {row.premium.map((area) => (
                              <button
                                key={area}
                                type="button"
                                onClick={() => selectNeighborhood(area, undefined, row.countryCode)}
                                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium hover:underline"
                              >
                                {area}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Disclaimer: These are indicative market-positioning categories for property search organization, not verified investment forecasts or official safety rankings.
              </p>
            </section>

            {/* Section 10: Comparative Affordability 2026 Cost of Living Plus Rent Index */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    2026 Macro Affordability Reference
                  </p>
                  <h3 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                    Cost of Living Plus Rent Index (New York = 100)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Lower index scores denote lower combined everyday living and apartment rental expenses relative to New York City (100.0).
                  </p>
                </div>

                <div className="space-y-3.5 pt-2">
                  {COMPARATIVE_AFFORDABILITY_2026.map((row) => {
                    const barWidthPct = Math.round((row.index / 30) * 100);
                    return (
                      <div key={`${row.countryCode}-${row.city}`} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                              {row.countryCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const firstArea =
                                  COUNTRY_MARKET_GUIDES.find((c) => c.code === row.countryCode)?.launchPriorityAreas[0] ||
                                  row.city;
                                selectNeighborhood(firstArea, row.city, row.countryCode);
                              }}
                              className="font-semibold text-slate-900 dark:text-white hover:underline"
                            >
                              {row.city}, {row.country}
                            </button>
                          </div>
                          <span className="font-mono font-bold tabular-nums text-emerald-700 dark:text-amber-300">
                            {row.index.toFixed(1)}
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#0B1F1A] dark:bg-amber-400"
                            style={{ width: `${barWidthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#0B1F1A] text-white rounded-2xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider">
                  <BuildingOffice2Icon className="w-4 h-4 shrink-0" />
                  <span>Methodology & Local Validation Rules</span>
                </div>
                <h3 className="text-xl font-bold font-heading text-white">
                  How to Interpret Continental Pricing Data
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <p>
                    1. <strong className="text-white">City vs. Street Reality:</strong> Numbeo indicators measure broad metropolitan averages. Premium enclaves in low-index cities (such as Zamalek in Cairo or Ikoyi in Lagos) still trade well above city medians.
                  </p>
                  <p>
                    2. <strong className="text-white">Currency & Inflation Adjustment:</strong> Markets including Nigeria, Ghana and Angola experience exchange-rate and inflation shifts that rapidly reprice USD-equivalent rent comparisons.
                  </p>
                  <p>
                    3. <strong className="text-white">Pre-Publish Verification:</strong> Always benchmark indicative indices against verified closed listings, street utility audits, and municipal/title deeds documentation before signing leases or purchase offers.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {isLifestyleMatcherOpen && (
        <LifestyleMatcherModal
          isOpen={isLifestyleMatcherOpen}
          onClose={() => setIsLifestyleMatcherOpen(false)}
          onMatchFound={(id) => {
            selectNeighborhood(id);
            setIsLifestyleMatcherOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default NeighborhoodExplorerPage;
