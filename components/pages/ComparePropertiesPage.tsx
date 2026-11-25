import React, { useMemo, useState } from 'react';
import type { Property } from '../../types';
import { ListingType } from '../../types';
import { useCurrency } from '../../contexts/CurrencyContext';
import {
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  MinusIcon,
  ArrowsRightLeftIcon,
  ChatBubbleLeftRightIcon,
  ArrowTopRightOnSquareIcon,
  FunnelIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon, StarIcon } from '../icons/ActionIcons';
import { BedIcon, BathIcon, AreaIcon } from '../icons/PropertyIcons';
import { WidgetTabGroup } from '../widgets/EmbeddedWidgetToolkit';

interface ComparePropertiesPageProps {
  properties: Property[];
  allProperties: Property[];
  onBack: () => void;
  onRemoveProperty: (property: Property) => void;
  onAddProperty: (property: Property) => void;
  onClearAll: () => void;
  onSelectProperty: (property: Property) => void;
  onMessageAgent: (property: Property) => void;
}

const FALLBACK_IMAGE = '/images/2ec34ce4ca57aef13fc8b3239a99345e.jpg';
const MAX_COMPARE_SLOTS = 3;

const formatAreaSqm = (sqft: number) => Math.max(1, Math.round((sqft || 0) * 0.092903));

const ComparePropertiesPage: React.FC<ComparePropertiesPageProps> = ({
  properties,
  allProperties,
  onBack,
  onRemoveProperty,
  onAddProperty,
  onClearAll,
  onSelectProperty,
  onMessageAgent,
}) => {
  const { formatCurrency } = useCurrency();
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');

  const compared = useMemo(() => properties.slice(0, MAX_COMPARE_SLOTS), [properties]);

  const availableCandidates = useMemo(() => {
    const selectedIds = new Set(compared.map((p) => p.id));
    return allProperties.filter((p) => !selectedIds.has(p.id));
  }, [allProperties, compared]);

  const allAmenities = useMemo(
    () => [...new Set(compared.flatMap((p) => p.amenities || []))].sort(),
    [compared]
  );

  const visibleAmenities = useMemo(() => {
    if (!showDifferencesOnly || compared.length < 2) return allAmenities;
    return allAmenities.filter((amenity) => {
      const states = compared.map((p) => (p.amenities || []).includes(amenity));
      return new Set(states).size > 1;
    });
  }, [allAmenities, compared, showDifferencesOnly]);

  const lowestPrice = useMemo(() => {
    if (compared.length < 2) return null;
    return Math.min(...compared.map((p) => p.price));
  }, [compared]);

  const handleCandidateAdd = (propertyId: string) => {
    const match = availableCandidates.find((p) => p.id === propertyId);
    if (match) {
      onAddProperty(match);
      setSelectedCandidateId('');
    }
  };

  const hasDiff = (values: Array<string | number | boolean>) => {
    if (values.length < 2) return true;
    return new Set(values.map(String)).size > 1;
  };

  const shouldRenderRow = (values: Array<string | number | boolean>) =>
    !showDifferencesOnly || compared.length < 2 || hasDiff(values);

  const emptySlotCount = Math.max(0, MAX_COMPARE_SLOTS - compared.length);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-30 bg-[#FAF8F5]/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-amber-300 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back to Listings</span>
            </button>
            <span className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:inline-block" />
            <div className="hidden sm:flex items-center gap-2">
              <ArrowsRightLeftIcon className="w-4 h-4 text-emerald-700 dark:text-amber-300" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Side-by-Side Comparison
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-amber-300 text-[11px] font-semibold">
                {compared.length} / {MAX_COMPARE_SLOTS}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {compared.length >= 2 && (
              <button
                type="button"
                onClick={() => setShowDifferencesOnly((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  showDifferencesOnly
                    ? 'bg-[#0B1F1A] text-amber-300'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FunnelIcon className="w-3.5 h-3.5" />
                <span>{showDifferencesOnly ? 'Showing Differences Only' : 'Show Differences Only'}</span>
              </button>
            )}

            {compared.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200/80 hover:bg-rose-100 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Page Intro & Slot Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-amber-300">
              AfriEstate Decision Workspace
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              Compare Up to 3 Properties Side-by-Side
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Evaluate asking price, floor area, resilient infrastructure, and verified amenities across your top picks.
            </p>
          </div>

          {compared.length < MAX_COMPARE_SLOTS && availableCandidates.length > 0 && (
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <select
                value={selectedCandidateId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCandidateId(val);
                  if (val) handleCandidateAdd(val);
                }}
                aria-label="Add property to compare"
                className="w-full lg:w-80 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">+ Add a property to slot {compared.length + 1} of 3...</option>
                {availableCandidates.slice(0, 40).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} — {item.address.city} ({formatCurrency(item.price)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Empty State */}
        {compared.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-amber-300 flex items-center justify-center mx-auto">
              <ArrowsRightLeftIcon className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              No properties selected for comparison yet
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Select up to 3 listings using the selector above or click &ldquo;Compare&rdquo; on any property card across the marketplace.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1F1A] hover:bg-emerald-950 text-white text-xs font-semibold transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Browse Marketplace Listings</span>
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 align-top">
                    <th className="w-52 p-5 bg-[#FAF8F5] dark:bg-slate-900/80">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                        Selected Listings
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {compared.length} of {MAX_COMPARE_SLOTS} Slots Filled
                      </p>
                      <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        Click any listing title or photo to inspect full deed verification, QR link, and gallery.
                      </p>
                    </th>

                    {compared.map((p) => {
                      const isBestValue = lowestPrice !== null && p.price === lowestPrice;
                      const imgSrc = p.images && p.images.length > 0 ? p.images[0] : FALLBACK_IMAGE;

                      return (
                        <th key={p.id} className="w-64 p-5 border-l border-slate-200 dark:border-slate-800 align-top">
                          <div className="space-y-3">
                            <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-slate-100 dark:bg-slate-800 group">
                              <img
                                src={imgSrc}
                                alt={p.title}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  const img = e.currentTarget;
                                  if (!img.dataset.fallbackApplied) {
                                    img.dataset.fallbackApplied = 'true';
                                    img.src = FALLBACK_IMAGE;
                                  }
                                }}
                                onClick={() => onSelectProperty(p)}
                                className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                              />
                              <button
                                type="button"
                                onClick={() => onRemoveProperty(p)}
                                title="Remove from comparison"
                                aria-label={`Remove ${p.title} from comparison`}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-950/75 hover:bg-rose-600 text-white flex items-center justify-center transition-colors"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                              {isBestValue && (
                                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                                  Lowest Price
                                </span>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-amber-300">
                                <span>{p.listingType}</span>
                                {p.verified && <CheckBadgeIcon className="w-3.5 h-3.5 text-emerald-600" />}
                              </div>
                              <button
                                type="button"
                                onClick={() => onSelectProperty(p)}
                                className="text-left text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-amber-300 transition-colors line-clamp-2 mt-0.5"
                              >
                                {p.title}
                              </button>
                              <p className="text-xs font-normal text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {p.address.city}{p.country ? `, ${p.country}` : ''}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => onSelectProperty(p)}
                                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-[#0B1F1A] hover:bg-emerald-950 text-white text-xs font-semibold transition-colors"
                              >
                                <span>View</span>
                                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onMessageAgent(p)}
                                className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-colors"
                              >
                                <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                                <span>Message</span>
                              </button>
                            </div>
                          </div>
                        </th>
                      );
                    })}

                    {[...Array(emptySlotCount)].map((_, idx) => (
                      <th
                        key={`empty-slot-${idx}`}
                        className="w-64 p-5 border-l border-slate-200 dark:border-slate-800 align-middle bg-slate-50/60 dark:bg-slate-900/40"
                      >
                        <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 text-center space-y-2">
                          <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                            <PlusIcon className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            Empty Slot ({compared.length + idx + 1} of 3)
                          </p>
                          <p className="text-[11px] font-normal text-slate-400">
                            Pick another listing from the dropdown above to compare side-by-side.
                          </p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {/* SECTION: Price & Valuation */}
                  <tr className="bg-emerald-950/5 dark:bg-slate-800/70">
                    <td
                      colSpan={MAX_COMPARE_SLOTS + 1}
                      className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-emerald-900 dark:text-amber-300"
                    >
                      Price &amp; Financial Terms
                    </td>
                  </tr>

                  {shouldRenderRow(compared.map((p) => p.price)) && (
                    <tr>
                      <td className="p-4 px-5 font-semibold text-slate-600 dark:text-slate-300 bg-[#FAF8F5]/60 dark:bg-slate-900/40">
                        Asking Price / Rate
                      </td>
                      {compared.map((p) => (
                        <td key={p.id} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800 font-mono font-bold text-base text-slate-900 dark:text-white">
                          {p.listingType === ListingType.RENT
                            ? `${formatCurrency(p.price)} / mo`
                            : p.perNightPrice
                            ? `${formatCurrency(p.price)} / night`
                            : formatCurrency(p.price)}
                        </td>
                      ))}
                      {[...Array(emptySlotCount)].map((_, i) => (
                        <td key={`e-price-${i}`} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700">—</td>
                      ))}
                    </tr>
                  )}

                  {shouldRenderRow(compared.map((p) => Math.round(p.price / formatAreaSqm(p.details.area)))) && (
                    <tr>
                      <td className="p-4 px-5 font-semibold text-slate-600 dark:text-slate-300 bg-[#FAF8F5]/60 dark:bg-slate-900/40">
                        Price per m²
                      </td>
                      {compared.map((p) => {
                        const sqm = formatAreaSqm(p.details.area);
                        return (
                          <td key={p.id} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300">
                            {formatCurrency(Math.round(p.price / sqm))} / m²
                          </td>
                        );
                      })}
                      {[...Array(emptySlotCount)].map((_, i) => (
                        <td key={`e-sqm-${i}`} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700">—</td>
                      ))}
                    </tr>
                  )}

                  {shouldRenderRow(compared.map((p) => `${p.listingType}-${p.propertyType}`)) && (
                    <tr>
                      <td className="p-4 px-5 font-semibold text-slate-600 dark:text-slate-300 bg-[#FAF8F5]/60 dark:bg-slate-900/40">
                        Category &amp; Type
                      </td>
                      {compared.map((p) => (
                        <td key={p.id} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200">
                          {p.listingType} · {p.propertyType}
                        </td>
                      ))}
                      {[...Array(emptySlotCount)].map((_, i) => (
                        <td key={`e-type-${i}`} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700">—</td>
                      ))}
                    </tr>
                  )}

                  {compared.some((p) => p.targetReturn || p.rentalYield) && (
                    <tr>
                      <td className="p-4 px-5 font-semibold text-slate-600 dark:text-slate-300 bg-[#FAF8F5]/60 dark:bg-slate-900/40">
                        Target Return / Yield
                      </td>
                      {compared.map((p) => (
                        <td key={p.id} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          {p.targetReturn
                            ? `${p.targetReturn}% Target ROI`
                            : p.rentalYield
                            ? `${p.rentalYield}% Rental Yield`
                            : 'Standard Residential'}
                        </td>
                      ))}
                      {[...Array(emptySlotCount)].map((_, i) => (
                        <td key={`e-roi-${i}`} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700">—</td>
                      ))}
                    </tr>
                  )}

                  {/* SECTION: Core Features */}
                  <tr className="bg-emerald-950/5 dark:bg-slate-800/70">
                    <td
                      colSpan={MAX_COMPARE_SLOTS + 1}
                      className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-emerald-900 dark:text-amber-300"
                    >
                      Property Features &amp; Dimensions
                    </td>
                  </tr>

                  {shouldRenderRow(compared.map((p) => p.details.beds)) && (
                    <tr>
                      <td className="p-4 px-5 font-semibold text-slate-600 dark:text-slate-300 bg-[#FAF8F5]/60 dark:bg-slate-900/40">
                        Bedrooms
                      </td>
                      {compared.map((p) => (
                        <td key={p.id} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800">
                          <span className="inline-flex items-center gap-2 text-xs font-semibold">
                            <BedIcon className="w-4 h-4 text-slate-400" />
                            <span>{p.details.beds} Bedrooms</span>
                          </span>
                        </td>
                      ))}
                      {[...Array(emptySlotCount)].map((_, i) => (
                        <td key={`e-beds-${i}`} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700">—</td>
                      ))}
                    </tr>
                  )}

                  {shouldRenderRow(compared.map((p) => p.details.baths)) && (
                    <tr>
                      <td className="p-4 px-5 font-semibold text-slate-600 dark:text-slate-300 bg-[#FAF8F5]/60 dark:bg-slate-900/40">
                        Bathrooms
                      </td>
                      {compared.map((p) => (
                        <td key={p.id} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800">
                          <span className="inline-flex items-center gap-2 text-xs font-semibold">
                            <BathIcon className="w-4 h-4 text-slate-400" />
                            <span>{p.details.baths} Bathrooms</span>
                          </span>
                        </td>
                      ))}
                      {[...Array(emptySlotCount)].map((_, i) => (
                        <td key={`e-baths-${i}`} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700">—</td>
                      ))}
                    </tr>
                  )}

                  {shouldRenderRow(compared.map((p) => p.details.area)) && (
                    <tr>
                      <td className="p-4 px-5 font-semibold text-slate-600 dark:text-slate-300 bg-[#FAF8F5]/60 dark:bg-slate-900/40">
                        Floor Area
                      </td>
                      {compared.map((p) => (
                        <td key={p.id} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800">
                          <span className="inline-flex items-center gap-2 text-xs font-semibold">
                            <AreaIcon className="w-4 h-4 text-slate-400" />
                            <span>
                              {formatAreaSqm(p.details.area).toLocaleString()} m² ({p.details.area.toLocaleString()} sqft)
                            </span>
                          </span>
                        </td>
                      ))}
                      {[...Array(emptySlotCount)].map((_, i) => (
                        <td key={`e-area-${i}`} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700">—</td>
                      ))}
                    </tr>
                  )}

                  {shouldRenderRow(compared.map((p) => Boolean(p.verified))) && (
                    <tr>
                      <td className="p-4 px-5 font-semibold text-slate-600 dark:text-slate-300 bg-[#FAF8F5]/60 dark:bg-slate-900/40">
                        Title Deed Verification
                      </td>
                      {compared.map((p) => (
                        <td key={p.id} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800 text-xs font-semibold">
                          {p.verified ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                              <CheckCircleIcon className="w-4 h-4" />
                              <span>Verified Registry Title</span>
                            </span>
                          ) : (
                            <span className="text-slate-500">Standard Listing</span>
                          )}
                        </td>
                      ))}
                      {[...Array(emptySlotCount)].map((_, i) => (
                        <td key={`e-ver-${i}`} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700">—</td>
                      ))}
                    </tr>
                  )}

                  {/* SECTION: African Infrastructure */}
                  <tr className="bg-emerald-950/5 dark:bg-slate-800/70">
                    <td
                      colSpan={MAX_COMPARE_SLOTS + 1}
                      className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-emerald-900 dark:text-amber-300"
                    >
                      Infrastructure &amp; Utilities
                    </td>
                  </tr>

                  {[
                    { label: 'Solar Power Backup', get: (p: Property) => Boolean(p.hasSolar) },
                    { label: 'Standby Generator', get: (p: Property) => Boolean(p.hasGenerator) },
                    { label: 'Borehole / Water Reserve', get: (p: Property) => Boolean(p.hasBorehole || p.hasWaterTank) },
                    { label: 'High-Speed Fibre Internet', get: (p: Property) => Boolean(p.hasFibre) },
                  ]
                    .filter((row) => shouldRenderRow(compared.map(row.get)))
                    .map((row) => (
                      <tr key={row.label}>
                        <td className="p-4 px-5 font-semibold text-slate-600 dark:text-slate-300 bg-[#FAF8F5]/60 dark:bg-slate-900/40">
                          {row.label}
                        </td>
                        {compared.map((p) => (
                          <td key={p.id} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800 text-xs">
                            {row.get(p) ? (
                              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Included</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                <MinusIcon className="w-4 h-4" />
                                <span>Not listed</span>
                              </span>
                            )}
                          </td>
                        ))}
                        {[...Array(emptySlotCount)].map((_, i) => (
                          <td key={`e-inf-${row.label}-${i}`} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700">—</td>
                        ))}
                      </tr>
                    ))}

                  {/* SECTION: Amenities Matrix */}
                  <tr className="bg-emerald-950/5 dark:bg-slate-800/70">
                    <td
                      colSpan={MAX_COMPARE_SLOTS + 1}
                      className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-emerald-900 dark:text-amber-300"
                    >
                      Amenities ({visibleAmenities.length})
                    </td>
                  </tr>

                  {visibleAmenities.length === 0 ? (
                    <tr>
                      <td
                        colSpan={MAX_COMPARE_SLOTS + 1}
                        className="p-5 text-xs text-slate-500 dark:text-slate-400 text-center"
                      >
                        {showDifferencesOnly
                          ? 'All selected properties share identical amenities.'
                          : 'No amenities recorded for the selected properties.'}
                      </td>
                    </tr>
                  ) : (
                    visibleAmenities.map((amenity) => (
                      <tr key={amenity}>
                        <td className="p-3.5 px-5 font-medium text-xs text-slate-700 dark:text-slate-300 bg-[#FAF8F5]/60 dark:bg-slate-900/40">
                          {amenity}
                        </td>
                        {compared.map((p) => {
                          const has = (p.amenities || []).includes(amenity);
                          return (
                            <td key={p.id} className="p-3.5 px-5 border-l border-slate-200 dark:border-slate-800 text-xs">
                              {has ? (
                                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                                  <CheckCircleIcon className="w-4 h-4" />
                                  <span>Yes</span>
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          );
                        })}
                        {[...Array(emptySlotCount)].map((_, i) => (
                          <td key={`e-am-${amenity}-${i}`} className="p-3.5 px-5 border-l border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700">—</td>
                        ))}
                      </tr>
                    ))
                  )}

                  {/* SECTION: Agent & Practitioner */}
                  <tr className="bg-emerald-950/5 dark:bg-slate-800/70">
                    <td
                      colSpan={MAX_COMPARE_SLOTS + 1}
                      className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-emerald-900 dark:text-amber-300"
                    >
                      Agent &amp; Practitioner
                    </td>
                  </tr>

                  <tr>
                    <td className="p-4 px-5 font-semibold text-slate-600 dark:text-slate-300 bg-[#FAF8F5]/60 dark:bg-slate-900/40">
                      Listing Representative
                    </td>
                    {compared.map((p) => (
                      <td key={p.id} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                          <span>{p.agent.name}</span>
                          {p.agent.verified && <CheckBadgeIcon className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mt-1">
                          <StarIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{p.agent.rating.toFixed(1)} ({p.agent.reviewCount} reviews)</span>
                        </div>
                      </td>
                    ))}
                    {[...Array(emptySlotCount)].map((_, i) => (
                      <td key={`e-agent-${i}`} className="p-4 px-5 border-l border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700">—</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <WidgetTabGroup
          title="Financial & Decision Scoring Workbench"
          subtitle="Quantify asking price trade-offs, total ownership costs, and weighted shortlist rankings alongside your selected AfriEstate properties."
          toolIds={['property-comparison', 'property-decider', 'rent-vs-buy', 'mortgage']}
        />
      </div>
    </div>
  );
};

export default ComparePropertiesPage;
