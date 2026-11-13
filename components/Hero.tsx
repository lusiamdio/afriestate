import React, { useMemo, useState } from 'react';
import SearchBar from './SearchBar';
import type { Property, SearchFilters } from '../types';
import { ListingType, PropertyStatus } from '../types';
import {
  ShieldCheckIcon,
  MapPinIcon,
  PhotoIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { AfricanGlobeIcon, SolarIcon } from './icons/AfricanInfrastructureIcons';
import { useCurrency } from '../contexts/CurrencyContext';

interface HeroProps {
  onSearch: (query: string) => void;
  isSearchingAI: boolean;
  filters: SearchFilters;
  onFilterChange: (key: keyof SearchFilters, value: any) => void;
  onMarketSelect?: (countryOrCity: string) => void;
  properties?: Property[];
  enquiryCounts?: Record<string, number>;
  onOpenDetailModal?: (property: Property) => void;
}

const FEATURED_MARKETS = [
  { name: 'South Africa', query: 'South Africa' },
  { name: 'Nigeria', query: 'Nigeria' },
  { name: 'Kenya', query: 'Kenya' },
  { name: 'Ghana', query: 'Ghana' },
  { name: 'Rwanda', query: 'Rwanda' },
  { name: 'Egypt', query: 'Egypt' },
  { name: 'Morocco', query: 'Morocco' },
  { name: 'Angola', query: 'Angola' },
];

const HERO_BACKDROPS = [
  {
    id: 'coastal',
    title: 'Cape Town Coastal',
    image: '/images/Property-1b0835e9d2737f661ff88feb4dfa6cdf-128596052.jpg',
    location: 'Camps Bay, Cape Town',
  },
  {
    id: 'villa',
    title: 'Sandton Modern Estate',
    image: '/images/565600_H_39.jpg',
    location: 'Sandhurst, Johannesburg',
  },
  {
    id: 'urban',
    title: 'Nairobi Metropolis',
    image: '/images/L_d8d3ea64-9d61-4231-8889-fefbddde1878.jpg',
    location: 'Westlands, Nairobi',
  },
  {
    id: 'harbour',
    title: 'Lagos Waterfront',
    image: '/images/Property-42d59deaa057e70bb379790361418ee2-128596051.jpg',
    location: 'Victoria Island, Lagos',
  },
  {
    id: 'pool',
    title: 'Accra Pool Compound',
    image: '/images/Property-ea7809975b5ff10a6c6dfa6b98a26492-116572885.jpg',
    location: 'Cantonments, Accra',
  },
];

const FALLBACK_SHOWCASE = [
  {
    title: 'Atlantic Seaboard Coastal Villa',
    city: 'Cape Town',
    country: 'South Africa',
    image: '/images/Property-1b0835e9d2737f661ff88feb4dfa6cdf-128596052.jpg',
    priceLabel: 'R2.45M',
    views: 4820,
    enquiries: 24,
    type: 'Buy',
  },
  {
    title: 'Modern Eco-Architectural Estate',
    city: 'Johannesburg',
    country: 'South Africa',
    image: '/images/565600_H_39.jpg',
    priceLabel: 'R12.5M',
    views: 6120,
    enquiries: 31,
    type: 'Invest',
  },
  {
    title: 'Westlands Skyline Penthouses',
    city: 'Nairobi',
    country: 'Kenya',
    image: '/images/L_d8d3ea64-9d61-4231-8889-fefbddde1878.jpg',
    priceLabel: 'KSh 32M',
    views: 5120,
    enquiries: 19,
    type: 'Invest',
  },
  {
    title: 'Victoria Island Marina Residence',
    city: 'Lagos',
    country: 'Nigeria',
    image: '/images/Property-42d59deaa057e70bb379790361418ee2-128596051.jpg',
    priceLabel: '₦450M',
    views: 7420,
    enquiries: 29,
    type: 'Buy',
  },
  {
    title: 'Cantonments Diplomatic Compound',
    city: 'Accra',
    country: 'Ghana',
    image: '/images/Property-ea7809975b5ff10a6c6dfa6b98a26492-116572885.jpg',
    priceLabel: 'GH₵ 4.8M',
    views: 4920,
    enquiries: 22,
    type: 'Rent',
  },
];

const formatCompactViews = (count: number) => {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
};

const Hero: React.FC<HeroProps> = ({
  onSearch,
  isSearchingAI,
  filters,
  onFilterChange,
  onMarketSelect,
  properties = [],
  enquiryCounts = {},
  onOpenDetailModal,
}) => {
  const [activeBackdropIndex, setActiveBackdropIndex] = useState(0);
  const { formatCurrency } = useCurrency();

  const trendingListings = useMemo(() => {
    const active = properties.filter((p) => p.status === PropertyStatus.ACTIVE);
    if (active.length === 0) return [];

    return [...active]
      .map((property) => {
        const views = property.views || 0;
        const enquiries = enquiryCounts[property.id] || 0;
        const trendingScore = views + enquiries * 500 + (property.saves || 0) * 5;
        return { property, views, enquiries, trendingScore };
      })
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 5);
  }, [properties, enquiryCounts]);

  const handleMarketClick = (marketQuery: string) => {
    onFilterChange('location', marketQuery);
    if (onMarketSelect) {
      onMarketSelect(marketQuery);
    }
  };

  const handleFallbackClick = (item: typeof FALLBACK_SHOWCASE[0]) => {
    onFilterChange('location', item.city);
    if (item.type === 'Invest') {
      onFilterChange('mode', 'invest');
    } else if (item.type === 'Rent') {
      onFilterChange('mode', 'rent');
    } else {
      onFilterChange('mode', 'buy');
    }
    if (onMarketSelect) {
      onMarketSelect(item.city);
    }
  };

  const currentBackdrop = HERO_BACKDROPS[activeBackdropIndex];

  return (
    <div className="relative pt-10 pb-16 md:pt-16 md:pb-20 text-white overflow-hidden min-h-[640px] flex flex-col justify-between">
      {/* 1. Dynamic Background Image Layer with Luxury Dark Scrim */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          key={currentBackdrop.id}
          src={currentBackdrop.image}
          alt={currentBackdrop.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-[0.38] transition-all duration-1000 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-transparent to-slate-950/90" />
      </div>

      {/* 2. Main Hero Content Container */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-10">
        {/* Eyebrow & Market Coverage Line */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300 mb-5">
          <span className="font-semibold text-amber-300 tracking-wide">
            Pan-African Property Marketplace
          </span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span>10,000+ Vetted African Listings</span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span>54 Continental Markets</span>
        </div>

        {/* Main Editorial Title */}
        <div className="text-center max-w-5xl mx-auto mb-6">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white drop-shadow-sm"
            style={{ textWrap: 'balance' }}
          >
            Find Your Place in Africa
          </h1>
          <p
            className="mt-3.5 text-base sm:text-lg md:text-xl text-slate-200 font-normal max-w-2xl mx-auto leading-relaxed drop-shadow"
            style={{ textWrap: 'balance' }}
          >
            Buy · Rent · Invest · Discover real assets, verified cadastre titles, and vetted opportunities across the continent.
          </p>
        </div>

        {/* Interactive Backdrop Switcher */}
        <div className="mb-4 flex items-center justify-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1 whitespace-nowrap">
            <PhotoIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Featured View:</span>
          </span>
          {HERO_BACKDROPS.map((backdrop, idx) => (
            <button
              key={backdrop.id}
              type="button"
              onClick={() => setActiveBackdropIndex(idx)}
              className={`px-3 py-1.5 rounded-lg transition-colors text-[11px] font-medium whitespace-nowrap shrink-0 backdrop-blur-md ${
                activeBackdropIndex === idx
                  ? 'bg-amber-400 text-slate-950 font-semibold shadow-xs'
                  : 'bg-slate-900/75 text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {backdrop.title}
            </button>
          ))}
        </div>

        {/* The 3-Mode Intent Search Card (Compact) */}
        <div className="max-w-4xl mx-auto w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-white rounded-xl p-3 sm:p-4 shadow-xl">
          <SearchBar
            onSearch={onSearch}
            isSearchingAI={isSearchingAI}
            filters={filters}
            onFilterChange={onFilterChange}
          />
        </div>

        {/* 3. Dynamic Trending Section: Ranked Automatically by Most Views & Enquiries */}
        <div className="mt-10 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 px-1">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-amber-300">
                Trending Pan-African Properties
              </p>
              <p className="text-[11px] text-slate-300/90 mt-0.5">
                Automatically ranked by highest buyer views and direct enquiries
              </p>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Select any trending listing to inspect details
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {trendingListings.length > 0
              ? trendingListings.map(({ property, views, enquiries }, idx) => {
                  const intentLabel =
                    property.listingType === ListingType.FOR_INVESTMENT
                      ? 'Invest'
                      : property.listingType === ListingType.RENT
                      ? 'Rent'
                      : 'Buy';

                  return (
                    <button
                      key={property.id}
                      type="button"
                      onClick={() => {
                        if (onOpenDetailModal) {
                          onOpenDetailModal(property);
                        } else {
                          handleMarketClick(property.address.city);
                        }
                      }}
                      className="group relative text-left rounded-xl overflow-hidden bg-slate-900/85 hover:bg-slate-900 transition-all duration-200 shadow-lg hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    >
                      <div className="relative h-32 w-full overflow-hidden bg-slate-800">
                        <img
                          src={property.images?.[0] || HERO_BACKDROPS[idx % HERO_BACKDROPS.length].image}
                          alt={property.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />

                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-semibold text-white">
                          <span className="font-mono bg-slate-950/80 px-1.5 py-0.5 rounded text-amber-300 tabular-nums">
                            #0{idx + 1} · {intentLabel}
                          </span>
                        </div>

                        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-baseline justify-between text-white">
                          <span className="text-xs font-bold text-amber-300 font-mono tabular-nums truncate">
                            {formatCurrency(property.price)}
                            {property.perNightPrice ? '/nt' : property.listingType === ListingType.RENT ? '/mo' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="p-3">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-white truncate">
                          <MapPinIcon className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">
                            {property.address.city}, {property.country || 'Africa'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 truncate mt-0.5" title={property.title}>
                          {property.title}
                        </p>

                        <div className="mt-2.5 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono tabular-nums">
                          <span className="inline-flex items-center gap-1">
                            <EyeIcon className="w-3 h-3 text-slate-400" />
                            {formatCompactViews(views)} views
                          </span>
                          <span className="inline-flex items-center gap-1 text-emerald-300">
                            <ChatBubbleLeftRightIcon className="w-3 h-3" />
                            {enquiries} enq.
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              : FALLBACK_SHOWCASE.map((item, idx) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => handleFallbackClick(item)}
                    className="group relative text-left rounded-xl overflow-hidden bg-slate-900/85 hover:bg-slate-900 transition-all duration-200 shadow-lg hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <div className="relative h-32 w-full overflow-hidden bg-slate-800">
                      <img
                        src={item.image}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
                      <div className="absolute top-2 left-2">
                        <span className="font-mono text-[10px] bg-slate-950/80 px-1.5 py-0.5 rounded text-amber-300 tabular-nums">
                          #0{idx + 1} · {item.type}
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2.5 right-2.5">
                        <span className="text-xs font-bold text-amber-300 font-mono tabular-nums">
                          {item.priceLabel}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-white truncate">
                        <MapPinIcon className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{item.city}, {item.country}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate mt-0.5">{item.title}</p>
                      <div className="mt-2.5 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono tabular-nums">
                        <span>{formatCompactViews(item.views)} views</span>
                        <span className="text-emerald-300">{item.enquiries} enq.</span>
                      </div>
                    </div>
                  </button>
                ))}
          </div>
        </div>

        {/* 4. Geographic Quick Access Strip: 54 African Markets */}
        <div className="mt-8 w-full text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">
            Quick Browse by African Market
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-xs text-slate-300">
            {FEATURED_MARKETS.map((m) => (
              <button
                key={m.name}
                type="button"
                onClick={() => handleMarketClick(m.query)}
                className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shadow-xs"
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Trust Badges Adjacency */}
        <div className="mt-10 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-slate-300 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs">Title-Deed & Land Registry Cadastre Checks</span>
          </div>
          <div className="flex items-center gap-2.5">
            <AfricanGlobeIcon className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-xs">Cross-Border Foreign Buyer Support in 54 Countries</span>
          </div>
          <div className="flex items-center gap-2.5">
            <SolarIcon className="w-5 h-5 text-sky-400 shrink-0" />
            <span className="text-xs">Power & Water Resilience (Solar, Borehole, Gen)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;