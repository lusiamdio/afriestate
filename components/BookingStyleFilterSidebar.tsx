import React, { useState } from 'react';
import type { SearchFilters } from '../types';
import { ListingType, PropertyType } from '../types';
import { 
  FunnelIcon, 
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { 
  SolarIcon, 
  GeneratorIcon, 
  BoreholeIcon, 
  WaterTankIcon, 
  FibreIcon, 
  GatedSecurityIcon,
  YieldTrendingIcon
} from './icons/AfricanInfrastructureIcons';

interface BookingStyleFilterSidebarProps {
  filters: SearchFilters;
  onFilterChange: (key: keyof SearchFilters, value: any) => void;
  onResetFilters: () => void;
  totalResultsCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const BookingStyleFilterSidebar: React.FC<BookingStyleFilterSidebarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalResultsCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    intent: true,
    infrastructure: true,
    security: true,
    price: true,
    propertyType: true,
    bedrooms: true,
    investment: true,
    accessibility: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInfrastructureToggle = (infraKey: string) => {
    const current = filters.infrastructure || [];
    const next = current.includes(infraKey)
      ? current.filter((k) => k !== infraKey)
      : [...current, infraKey];
    onFilterChange('infrastructure', next);
  };

  const handleSecurityToggle = (secKey: string) => {
    const current = filters.security || [];
    const next = current.includes(secKey)
      ? current.filter((k) => k !== secKey)
      : [...current, secKey];
    onFilterChange('security', next);
  };

  const handleProximityToggle = (proxKey: string) => {
    const current = filters.proximity || [];
    const next = current.includes(proxKey)
      ? current.filter((k) => k !== proxKey)
      : [...current, proxKey];
    onFilterChange('proximity', next);
  };

  return (
    <aside className={`w-full lg:w-72 shrink-0 ${isOpenMobile ? 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 overflow-y-auto' : ''}`}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Filters</h3>
            <span className="text-xs text-slate-500 tabular-nums">({totalResultsCount})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-medium"
            >
              Reset
            </button>
            {isOpenMobile && onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 1. Transaction Intention */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('intent')}
            className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2"
          >
            <span>Transaction Mode</span>
            {openSections.intent ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
          </button>
          {openSections.intent && (
            <div className="space-y-1 text-xs">
              {[
                { label: 'All Modes', val: ListingType.ALL },
                { label: 'Buy Property', val: ListingType.SALE },
                { label: 'Rent Property', val: ListingType.RENT },
                { label: 'Investment & Yield', val: ListingType.FOR_INVESTMENT },
              ].map((item) => (
                <label key={item.val} className="flex items-center gap-2 py-1 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900">
                  <input
                    type="radio"
                    name="listingTypeSidebar"
                    checked={filters.listingType === item.val}
                    onChange={() => onFilterChange('listingType', item.val)}
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 2. African Infrastructure (Crucial Differentiator) */}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => toggleSection('infrastructure')}
            className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2"
          >
            <span>Infrastructure & Power</span>
            {openSections.infrastructure ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
          </button>
          {openSections.infrastructure && (
            <div className="space-y-2 text-xs">
              {[
                { key: 'solar', label: 'Solar / Inverter Backup', icon: SolarIcon },
                { key: 'generator', label: 'Standby Generator', icon: GeneratorIcon },
                { key: 'borehole', label: 'Private Borehole', icon: BoreholeIcon },
                { key: 'waterTank', label: 'Water Tank Storage', icon: WaterTankIcon },
                { key: 'fibre', label: 'High-Speed Fibre', icon: FibreIcon },
              ].map((item) => {
                const checked = (filters.infrastructure || []).includes(item.key);
                const Icon = item.icon;
                return (
                  <label key={item.key} className="flex items-center justify-between py-1 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleInfrastructureToggle(item.key)}
                        className="rounded text-slate-900 focus:ring-slate-900"
                      />
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                      <span>{item.label}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. African Security Specifications */}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => toggleSection('security')}
            className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2"
          >
            <span>Security & Access</span>
            {openSections.security ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
          </button>
          {openSections.security && (
            <div className="space-y-2 text-xs">
              {[
                { key: 'gated', label: 'Gated Community' },
                { key: 'guards', label: '24/7 Security Guards' },
                { key: 'cctv', label: 'CCTV & Biometrics' },
                { key: 'perimeter', label: 'Perimeter Electric Fence' },
              ].map((item) => {
                const checked = (filters.security || []).includes(item.key);
                return (
                  <label key={item.key} className="flex items-center gap-2 py-1 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleSecurityToggle(item.key)}
                      className="rounded text-slate-900 focus:ring-slate-900"
                    />
                    <GatedSecurityIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Proximity & Accessibility */}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => toggleSection('accessibility')}
            className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2"
          >
            <span>Proximity</span>
            {openSections.accessibility ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
          </button>
          {openSections.accessibility && (
            <div className="space-y-2 text-xs">
              {[
                { key: 'university', label: 'Near University' },
                { key: 'cbd', label: 'Near Central Business District' },
                { key: 'airport', label: 'Near International Airport' },
                { key: 'hospital', label: 'Near Hospital' },
              ].map((item) => {
                const checked = (filters.proximity || []).includes(item.key);
                return (
                  <label key={item.key} className="flex items-center gap-2 py-1 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleProximityToggle(item.key)}
                      className="rounded text-slate-900 focus:ring-slate-900"
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Investment Target Return */}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => toggleSection('investment')}
            className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2"
          >
            <span>Target Rental Yield</span>
            {openSections.investment ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
          </button>
          {openSections.investment && (
            <div className="space-y-1 text-xs">
              {[
                { label: 'Any Yield', val: 0 },
                { label: '8%+ Net Yield', val: 8 },
                { label: '10%+ High Yield', val: 10 },
                { label: '12%+ Prime Return', val: 12 },
                { label: '15%+ Growth Yield', val: 15 },
              ].map((item) => (
                <label key={item.val} className="flex items-center gap-2 py-1 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900">
                  <input
                    type="radio"
                    name="targetReturnSidebar"
                    checked={(filters.targetReturnMin || 0) === item.val}
                    onChange={() => onFilterChange('targetReturnMin', item.val)}
                    className="rounded text-amber-600 focus:ring-amber-600"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 6. Verification Only Toggle */}
        <div className="pt-4">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-900 dark:text-white">
            <input
              type="checkbox"
              checked={!!filters.verifiedOnly}
              onChange={(e) => onFilterChange('verifiedOnly', e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-600"
            />
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <span>Verified Properties Only</span>
              <CheckIcon className="w-3.5 h-3.5 shrink-0" />
            </span>
          </label>
        </div>
      </div>
    </aside>
  );
};

export default BookingStyleFilterSidebar;
