import React, { useState, useEffect } from 'react';
import { PropertyType, ListingType } from '../types';
import type { SearchFilters } from '../types';
import { 
  BuildingOffice2Icon, 
  HomeModernIcon, 
  BanknotesIcon, 
  MagnifyingGlassIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { YieldTrendingIcon } from './icons/AfricanInfrastructureIcons';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearchingAI: boolean;
  filters: SearchFilters;
  onFilterChange: (key: keyof SearchFilters, value: any) => void;
}

export type IntentMode = 'buy' | 'rent' | 'invest';

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isSearchingAI, filters, onFilterChange }) => {
  const [activeMode, setActiveMode] = useState<IntentMode>(() => {
    if (filters.listingType === ListingType.FOR_INVESTMENT || filters.mode === 'invest') return 'invest';
    if (filters.listingType === ListingType.RENT || filters.mode === 'rent') return 'rent';
    return 'buy';
  });

  const handleModeSwitch = (mode: IntentMode) => {
    setActiveMode(mode);
    onFilterChange('mode', mode);
    if (mode === 'buy') {
      onFilterChange('listingType', ListingType.SALE);
    } else if (mode === 'rent') {
      onFilterChange('listingType', ListingType.RENT);
    } else if (mode === 'invest') {
      onFilterChange('listingType', ListingType.FOR_INVESTMENT);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters.location);
  };

  return (
    <div className="w-full">
      {/* 1. Intent Mode Tabs */}
      <div className="flex items-center gap-1 pb-2">
        <button
          type="button"
          onClick={() => handleModeSwitch('buy')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
            activeMode === 'buy'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HomeModernIcon className="w-3.5 h-3.5" />
          <span>Buy Property</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeSwitch('rent')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
            activeMode === 'rent'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BuildingOffice2Icon className="w-3.5 h-3.5" />
          <span>Rent a Home</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeSwitch('invest')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
            activeMode === 'invest'
              ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm'
              : 'text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40'
          }`}
        >
          <YieldTrendingIcon className="w-3.5 h-3.5 text-current" />
          <span>Invest in Africa</span>
        </button>
      </div>

      {/* 2. Dynamic Input Fields Based on Intent Mode */}
      <form onSubmit={handleFormSubmit} className="pt-2">
        {activeMode === 'buy' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 items-end">
            {/* Where / Location */}
            <div className="lg:col-span-4 relative">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                Where to Buy?
              </label>
              <div className="relative">
                <MapPinIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="City, area or country (e.g. Cape Town)"
                  value={filters.location}
                  onChange={(e) => onFilterChange('location', e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
                />
              </div>
            </div>

            {/* Property Type */}
            <div className="lg:col-span-3">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                Property Type
              </label>
              <select
                value={filters.propertyType}
                onChange={(e) => onFilterChange('propertyType', e.target.value as PropertyType)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
              >
                <option value={PropertyType.ALL}>All Residential & Commercial</option>
                <option value={PropertyType.APARTMENT}>Apartment / Flat</option>
                <option value={PropertyType.HOUSE}>House / Freehold Villa</option>
                <option value={PropertyType.LUXURY_ESTATE}>Luxury Estate</option>
                <option value={PropertyType.TOWNSHIP}>Township Property</option>
                <option value={PropertyType.LAND}>Land / Plot</option>
                <option value={PropertyType.COMMERCIAL}>Commercial Property</option>
                <option value={PropertyType.IN_CONSTRUCTION}>New Development / Off-Plan</option>
              </select>
            </div>

            {/* Bedrooms */}
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                Bedrooms
              </label>
              <select
                value={filters.bedrooms}
                onChange={(e) => onFilterChange('bedrooms', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
              >
                <option value={0}>Any Beds</option>
                <option value={1}>1+ Bed</option>
                <option value={2}>2+ Beds</option>
                <option value={3}>3+ Beds</option>
                <option value={4}>4+ Beds</option>
              </select>
            </div>

            {/* Price Max */}
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                Max Price
              </label>
              <input
                type="number"
                placeholder="Max Price"
                value={filters.priceMax === 10000000 ? '' : filters.priceMax}
                onChange={(e) => onFilterChange('priceMax', e.target.value === '' ? 10000000 : Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition tabular-nums"
              />
            </div>

            {/* Search Submit Button */}
            <div className="lg:col-span-1">
              <button
                type="submit"
                disabled={isSearchingAI}
                className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold rounded-lg flex items-center justify-center transition shadow-sm"
                title="Search Properties"
              >
                {isSearchingAI ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <MagnifyingGlassIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {activeMode === 'rent' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 items-end">
            {/* Where / Location */}
            <div className="lg:col-span-4 relative">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                Where to Rent?
              </label>
              <div className="relative">
                <MapPinIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="City or area (e.g. Sea Point, Kilimani)"
                  value={filters.location}
                  onChange={(e) => onFilterChange('location', e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
                />
              </div>
            </div>

            {/* Monthly Budget */}
            <div className="lg:col-span-3">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                Monthly Budget
              </label>
              <input
                type="number"
                placeholder="Max Monthly Rent"
                value={filters.priceMax === 10000000 ? '' : filters.priceMax}
                onChange={(e) => onFilterChange('priceMax', e.target.value === '' ? 10000000 : Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition tabular-nums"
              />
            </div>

            {/* Property Type */}
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                Type
              </label>
              <select
                value={filters.propertyType}
                onChange={(e) => onFilterChange('propertyType', e.target.value as PropertyType)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
              >
                <option value={PropertyType.ALL}>All Types</option>
                <option value={PropertyType.APARTMENT}>Apartment</option>
                <option value={PropertyType.HOUSE}>House</option>
                <option value={PropertyType.STUDENT_HOUSING}>Student Housing</option>
                <option value={PropertyType.SHORT_TERM_RENTAL}>Short-Term Stay</option>
              </select>
            </div>

            {/* Lease Duration */}
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                Lease Type
              </label>
              <select
                value={filters.leaseDuration || ''}
                onChange={(e) => onFilterChange('leaseDuration', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
              >
                <option value="">Any Lease</option>
                <option value="Long term">Long term (12m+)</option>
                <option value="Medium term">Medium term (3-6m)</option>
                <option value="Short term / Stay">Short term / Flex</option>
              </select>
            </div>

            {/* Search Submit Button */}
            <div className="lg:col-span-1">
              <button
                type="submit"
                disabled={isSearchingAI}
                className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold rounded-lg flex items-center justify-center transition shadow-sm"
                title="Search Rentals"
              >
                {isSearchingAI ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <MagnifyingGlassIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {activeMode === 'invest' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 items-end">
            {/* Target Region */}
            <div className="lg:col-span-3">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-0.5">
                Where in Africa?
              </label>
              <select
                value={filters.region || ''}
                onChange={(e) => onFilterChange('region', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-amber-50/80 dark:bg-amber-950/30 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 transition"
              >
                <option value="">All Pan-African Markets</option>
                <option value="Southern Africa">Southern Africa (SA, Namibia, Botswana)</option>
                <option value="West Africa">West Africa (Nigeria, Ghana, Senegal)</option>
                <option value="East Africa">East Africa (Kenya, Rwanda, Tanzania)</option>
                <option value="North Africa">North Africa (Egypt, Morocco, Tunisia)</option>
                <option value="Central Africa">Central Africa (Angola, Cameroon)</option>
              </select>
            </div>

            {/* Investment Type */}
            <div className="lg:col-span-3">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-0.5">
                Opportunity Structure
              </label>
              <select
                value={filters.investmentType || ''}
                onChange={(e) => onFilterChange('investmentType', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-amber-50/80 dark:bg-amber-950/30 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 transition"
              >
                <option value="">All Investment Types</option>
                <option value="Student Residence">Student Residence (PBSA)</option>
                <option value="Development">Off-Plan & New Development</option>
                <option value="REIT">Commercial REIT</option>
                <option value="Fractional">Fractional Co-Ownership</option>
                <option value="Commercial">Commercial Yield Assets</option>
              </select>
            </div>

            {/* Min Investment Amount */}
            <div className="lg:col-span-3">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-0.5">
                Capital Ticket
              </label>
              <select
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onFilterChange('priceMax', val || 10000000);
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-amber-50/80 dark:bg-amber-950/30 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 transition"
              >
                <option value="">Any Capital Size</option>
                <option value="50000">Under $50,000 / R500k</option>
                <option value="250000">$50,000 – $250,000</option>
                <option value="1000000">$250,000 – $1M</option>
                <option value="10000000">Institutional ($1M+)</option>
              </select>
            </div>

            {/* Target Return */}
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-0.5">
                Target Yield
              </label>
              <select
                value={filters.targetReturnMin || 0}
                onChange={(e) => onFilterChange('targetReturnMin', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-amber-50/80 dark:bg-amber-950/30 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 transition"
              >
                <option value={0}>Any Return</option>
                <option value={8}>8%+ Net Return</option>
                <option value={10}>10%+ Net Return</option>
                <option value={12}>12%+ Net Return</option>
                <option value={15}>15%+ High Growth</option>
              </select>
            </div>

            {/* Search Submit Button */}
            <div className="lg:col-span-1">
              <button
                type="submit"
                disabled={isSearchingAI}
                className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg flex items-center justify-center transition shadow-sm"
                title="Find Investments"
              >
                {isSearchingAI ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <YieldTrendingIcon className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;