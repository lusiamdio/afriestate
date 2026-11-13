import React, { useState, useMemo } from 'react';
import type { Property, User } from '../../../types';
import { PropertyStatus } from '../../../types';
import AgentPropertyCard from './AgentPropertyCard';
import { SearchIcon } from '../../icons/SearchIcons';
import { EyeIcon, HeartIcon, PencilIcon, TrashIcon } from '../../icons/ActionIcons';
import { ListBulletIcon, Squares2X2Icon } from '@heroicons/react/20/solid';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { useToast } from '../../../contexts/ToastContext';

interface AgentListingsManagementProps {
  user: User;
  allProperties: Property[];
  onEditProperty: (property: Property) => void;
  onDeleteProperty: (propertyId: string) => void;
  onListPropertyClick?: () => void;
}

const statusBadges: Record<PropertyStatus, string> = {
  [PropertyStatus.ACTIVE]: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
  [PropertyStatus.PENDING]: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
  [PropertyStatus.DRAFT]: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  [PropertyStatus.EXPIRED]: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/60',
  [PropertyStatus.SOLD]: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60',
};

const AgentListingsManagement: React.FC<AgentListingsManagementProps> = ({
  user,
  allProperties,
  onEditProperty,
  onDeleteProperty,
  onListPropertyClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | 'All'>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const { formatCurrency } = useCurrency();
  const { addToast } = useToast();

  const userProperties = useMemo(() => {
    return allProperties.filter((p) => p.agent.name === user.username);
  }, [allProperties, user.username]);

  const filteredProperties = useMemo(() => {
    return userProperties.filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        q === '' ||
        p.title.toLowerCase().includes(q) ||
        p.address.street.toLowerCase().includes(q) ||
        p.address.city.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [userProperties, searchTerm, statusFilter]);

  const handleSelectProperty = (id: string, isSelected: boolean) => {
    setSelectedProperties((prev) => {
      const next = new Set(prev);
      if (isSelected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedProperties(new Set(filteredProperties.map((p) => p.id)));
    else setSelectedProperties(new Set());
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    const count = selectedProperties.size;
    if (count === 0) return;
    if (action === 'delete') {
      selectedProperties.forEach((id) => onDeleteProperty(id));
      addToast(`Removed ${count} selected listing(s).`, 'success');
    } else {
      addToast(
        `${action === 'activate' ? 'Activated' : 'Paused'} ${count} selected listing(s).`,
        'success'
      );
    }
    setSelectedProperties(new Set());
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Listings Inventory
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage pricing, availability, and media across {userProperties.length} listings.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#0F2D25] text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ListBulletIcon className="w-4 h-4" />
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#0F2D25] text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Squares2X2Icon className="w-4 h-4" />
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Bulk Action Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by title, street, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PropertyStatus | 'All')}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            {Object.values(PropertyStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {selectedProperties.size > 0 && (
          <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 mr-1">
              {selectedProperties.size} selected
            </span>
            <button
              onClick={() => handleBulkAction('activate')}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Pause
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Data Grid / Cards */}
      {filteredProperties.length > 0 ? (
        viewMode === 'table' ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3 pl-4 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={
                          selectedProperties.size > 0 &&
                          selectedProperties.size === filteredProperties.length
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[#0F2D25] focus:ring-[#0F2D25] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3 font-semibold">Property</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 px-3 font-semibold text-right">Price</th>
                    <th className="py-3 px-3 font-semibold text-right">Views</th>
                    <th className="py-3 px-3 font-semibold text-right">Saves</th>
                    <th className="py-3 pl-3 pr-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProperties.map((property) => (
                    <tr
                      key={property.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 pl-4 pr-2">
                        <input
                          type="checkbox"
                          checked={selectedProperties.has(property.id)}
                          onChange={(e) => handleSelectProperty(property.id, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-[#0F2D25] focus:ring-[#0F2D25] cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <img
                            src={property.images[0] || '/images/house_suburbs_1779978598551.png'}
                            alt={property.title}
                            className="w-11 h-9 rounded-md object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[260px]">
                              {property.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                              {property.address.city} · {property.propertyType}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${
                            statusBadges[property.status]
                          }`}
                        >
                          {property.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {property.listingType === 'For Rent'
                          ? `${formatCurrency(property.price)}/mo`
                          : formatCurrency(property.price)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <EyeIcon className="w-3.5 h-3.5 text-slate-400" />
                          {property.views}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <HeartIcon className="w-3.5 h-3.5 text-slate-400" />
                          {property.saves}
                        </span>
                      </td>
                      <td className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onEditProperty(property)}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                            title="Edit listing"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteProperty(property.id)}
                            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/50 text-red-500 hover:text-red-700"
                            title="Delete listing"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredProperties.map((property) => (
              <AgentPropertyCard
                key={property.id}
                property={property}
                isSelected={selectedProperties.has(property.id)}
                onSelect={handleSelectProperty}
                onEdit={onEditProperty}
                onDelete={onDeleteProperty}
              />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">No listings match your criteria</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Clear your search or status filter, or publish a new property listing to the marketplace.
          </p>
          {onListPropertyClick && (
            <button
              onClick={onListPropertyClick}
              className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0F2D25] text-white hover:bg-[#173f34]"
            >
              Create New Listing
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentListingsManagement;
