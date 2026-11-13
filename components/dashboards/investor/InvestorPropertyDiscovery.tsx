import React, { useMemo, useState } from 'react';
import type { Property, User } from '../../../types';
import PropertyList from '../../PropertyList';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface InvestorPropertyDiscoveryProps {
  user: User;
  investmentProperties: Property[];
  onSaveToggle: (propertyId: string) => void;
  savedPropertyIds: Set<string>;
  onOpenCalculator: (property: Property) => void;
  onOpenTourModal: (property: Property) => void;
  onFindSimilar: (property: Property) => void;
  onOpenDetailModal: (property: Property) => void;
  onOpenVRTour: (url: string) => void;
  onToggleCompare: (property: Property) => void;
  propertiesToCompare: Property[];
}

const InvestorPropertyDiscovery: React.FC<InvestorPropertyDiscoveryProps> = (props) => {
  const { investmentProperties, user } = props;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');

  const propertyTypes = useMemo(
    () => ['All', ...Array.from(new Set(investmentProperties.map((p) => p.propertyType)))],
    [investmentProperties]
  );

  const filteredProperties = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return investmentProperties.filter((p) => {
      const matchesType = selectedType === 'All' || p.propertyType === selectedType;
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.address.city.toLowerCase().includes(q) ||
        p.propertyType.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [investmentProperties, searchTerm, selectedType]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Deal Marketplace
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Vetted high-yield acquisitions and commercial investment opportunities.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter city or asset..."
              className="w-full sm:w-56 pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D25]"
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto">
            {propertyTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  selectedType === type
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <PropertyList
        properties={filteredProperties}
        currentUser={user}
        onSaveToggle={props.onSaveToggle}
        savedPropertyIds={props.savedPropertyIds}
        onOpenCalculator={props.onOpenCalculator}
        onOpenTourModal={props.onOpenTourModal}
        onFindSimilar={props.onFindSimilar}
        onOpenDetailModal={props.onOpenDetailModal}
        onToggleCompare={props.onToggleCompare}
        onOpenVRTour={props.onOpenVRTour}
        compareList={props.propertiesToCompare}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </div>
  );
};

export default InvestorPropertyDiscovery;