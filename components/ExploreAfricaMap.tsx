import React, { useState } from 'react';
import type { SearchFilters } from '../types';
import { ListingType } from '../types';
import { MapPinIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';
import { AfricanGlobeIcon, YieldTrendingIcon } from './icons/AfricanInfrastructureIcons';

interface ExploreAfricaMapProps {
  onSelectHub: (city: string, country: string, region: string, listingType?: ListingType) => void;
  activeFilters: SearchFilters;
}

interface AfricanHub {
  city: string;
  country: string;
  region: 'Southern Africa' | 'West Africa' | 'East Africa' | 'North Africa' | 'Central Africa';
  flag: string;
  propertiesCount: number;
  avgYield: string;
  currency: string;
  tag: string;
  neighborhoods: string[];
}

const AFRICAN_HUBS: AfricanHub[] = [
  {
    city: 'Cape Town',
    country: 'South Africa',
    region: 'Southern Africa',
    flag: 'ZA',
    propertiesCount: 1842,
    avgYield: '7.8% - 10.2%',
    currency: 'ZAR',
    tag: 'Coastal & Luxury Prime',
    neighborhoods: ['Sea Point', 'Camps Bay', 'Bree Street', 'Waterfront'],
  },
  {
    city: 'Johannesburg',
    country: 'South Africa',
    region: 'Southern Africa',
    flag: 'ZA',
    propertiesCount: 2410,
    avgYield: '9.4% - 12.5%',
    currency: 'ZAR',
    tag: 'Financial Capital & REITs',
    neighborhoods: ['Sandton CBD', 'Rosebank', 'Soweto', 'Melrose Arch'],
  },
  {
    city: 'Lagos',
    country: 'Nigeria',
    region: 'West Africa',
    flag: 'NG',
    propertiesCount: 3150,
    avgYield: '12.1% - 16.5%',
    currency: 'NGN',
    tag: 'Mega-City High Yield',
    neighborhoods: ['Ikoyi', 'Victoria Island', 'Lekki Phase 1', 'Eko Atlantic'],
  },
  {
    city: 'Nairobi',
    country: 'Kenya',
    region: 'East Africa',
    flag: 'KE',
    propertiesCount: 1920,
    avgYield: '10.8% - 14.2%',
    currency: 'KES',
    tag: 'Silicon Savannah Tech Hub',
    neighborhoods: ['Kilimani', 'Westlands', 'Karen', 'Riverside'],
  },
  {
    city: 'Accra',
    country: 'Ghana',
    region: 'West Africa',
    flag: 'GH',
    propertiesCount: 1140,
    avgYield: '11.5% - 15.2%',
    currency: 'GHS',
    tag: 'Diplomatic & PBSA Capital',
    neighborhoods: ['Cantonments', 'Airport Residential', 'East Legon', 'Labone'],
  },
  {
    city: 'Kigali',
    country: 'Rwanda',
    region: 'East Africa',
    flag: 'RW',
    propertiesCount: 680,
    avgYield: '12.5% - 14.8%',
    currency: 'RWF',
    tag: 'Green Smart Capital',
    neighborhoods: ['Nyarutarama', 'Kacyiru', 'Kimihurura', 'Gacuriro'],
  },
  {
    city: 'Cairo',
    country: 'Egypt',
    region: 'North Africa',
    flag: 'EG',
    propertiesCount: 2800,
    avgYield: '8.9% - 11.4%',
    currency: 'EGP',
    tag: 'Historic & Megaproject Growth',
    neighborhoods: ['New Cairo', 'Zamalek', 'Sheikh Zayed', 'Maadi'],
  },
  {
    city: 'Casablanca',
    country: 'Morocco',
    region: 'North Africa',
    flag: 'MA',
    propertiesCount: 1250,
    avgYield: '8.1% - 10.5%',
    currency: 'MAD',
    tag: 'Financial Gateway to Europe',
    neighborhoods: ['Anfa', 'Gauthier', 'Bouskoura', 'Finance City'],
  },
  {
    city: 'Luanda',
    country: 'Angola',
    region: 'Central Africa',
    flag: 'AO',
    propertiesCount: 520,
    avgYield: '13.0% - 17.5%',
    currency: 'AOA',
    tag: 'Energy & Corporate Leases',
    neighborhoods: ['Talatona', 'Miramar', 'Ilha de Luanda', 'Alvalade'],
  },
];

const REGIONS = ['All Africa', 'Southern Africa', 'West Africa', 'East Africa', 'North Africa', 'Central Africa'] as const;

const ExploreAfricaMap: React.FC<ExploreAfricaMapProps> = ({ onSelectHub, activeFilters }) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('All Africa');
  const [activeIntentTab, setActiveIntentTab] = useState<'all' | 'invest' | 'dev'>('all');

  const filteredHubs = AFRICAN_HUBS.filter((hub) => {
    if (selectedRegion === 'All Africa') return true;
    return hub.region === selectedRegion;
  });

  const handleHubClick = (hub: AfricanHub) => {
    let listingType: ListingType | undefined = undefined;
    if (activeIntentTab === 'invest') {
      listingType = ListingType.FOR_INVESTMENT;
    }
    onSelectHub(hub.city, hub.country, hub.region, listingType);
  };

  return (
    <section className="py-12 bg-slate-100/70 dark:bg-slate-950/60">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
              <AfricanGlobeIcon className="w-4 h-4" />
              <span>Cross-Border Geographic Discovery</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Explore Africa
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
              From the Atlantic Seaboard to the Gulf of Guinea and Silicon Savannah, discover verified real estate and high-yield asset hubs.
            </p>
          </div>

          {/* Quick Opportunity Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => setActiveIntentTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeIntentTab === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              All Properties
            </button>
            <button
              type="button"
              onClick={() => setActiveIntentTab('invest')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeIntentTab === 'invest'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              Investments & Yields
            </button>
          </div>
        </div>

        {/* Region Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {REGIONS.map((region) => (
            <button
              key={region}
              type="button"
              onClick={() => setSelectedRegion(region)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                selectedRegion === region
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        {/* Continental Hub Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHubs.map((hub) => {
            const isSelected = activeFilters.location.toLowerCase().includes(hub.city.toLowerCase());
            return (
              <div
                key={hub.city}
                onClick={() => handleHubClick(hub)}
                className={`group cursor-pointer rounded-2xl p-5 transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 shadow-lg'
                    : 'bg-white dark:bg-slate-900 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center shrink-0" aria-label={hub.country}>
                      {hub.flag}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                        {hub.city}
                        <ArrowUpRightIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {hub.country} · {hub.region}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                      {hub.propertiesCount.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      listings
                    </p>
                  </div>
                </div>

                {/* Metrics & Highlights */}
                <div className="mt-4 pt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                    <YieldTrendingIcon className="w-3.5 h-3.5" />
                    <span>Avg Yield: {hub.avgYield}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {hub.tag}
                  </span>
                </div>

                {/* Popular Neighborhoods */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {hub.neighborhoods.map((n) => (
                    <span
                      key={n}
                      className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ExploreAfricaMap;
