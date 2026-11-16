import React, { useState, useMemo, useEffect } from 'react';
import type {
  Property,
  TourRequest,
  User,
  SearchFilters,
  Message,
  PropertyAlert,
  UserDocument,
} from '../../types';
import { ListingType } from '../../types';
import {
  BookmarkIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  BanknotesIcon,
  BellIcon,
  ClipboardDocumentIcon as DocumentDuplicateIcon,
  ArrowUpTrayIcon,
  HeartIcon,
} from '../icons/ActionIcons';
import { DashboardIcon } from '../icons/AgentDashboardIcons';
import { SearchIcon } from '../icons/SearchIcons';
import { Bars3Icon, XMarkIcon } from '../icons/InvestorDashboardIcons';
import {
  ArrowRightIcon,
  CalculatorIcon,
  MapPinIcon,
  RocketLaunchIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import {
  getPropertyAlerts,
  addPropertyAlert,
  deletePropertyAlert,
  getUserDocuments,
  addUserDocument,
  deleteUserDocument,
} from '../../lib/data';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useToast } from '../../contexts/ToastContext';

export type SeekerView =
  | 'overview'
  | 'saved'
  | 'tours'
  | 'searches'
  | 'messages'
  | 'alerts'
  | 'documents'
  | 'payments';

interface UserDashboardProps {
  user: User;
  allProperties?: Property[];
  savedProperties?: Property[];
  savedPropertyIds?: Set<string>;
  tourRequests: TourRequest[];
  savedSearches: SearchFilters[];
  messages: Message[];
  propertiesToCompare?: Property[];
  onRunSearch: (filters: SearchFilters) => void;
  onDeleteSearch: (filters: SearchFilters) => void;
  onBrowseMarketplace?: () => void;
  onOpenDetailModal?: (property: Property) => void;
  onOpenCalculator?: (property: Property) => void;
  onOpenTourModal?: (property: Property) => void;
  onSaveToggle?: (propertyId: string) => void;
  onToggleCompare?: (property: Property) => void;
  onCompareClick?: () => void;
  onUpgradeAccountRequest?: () => void;
  onListPropertyClick?: () => void;
  onSendMessage?: (property: Property, text: string) => Promise<void> | void;
}

const viewMeta: Record<SeekerView, { label: string; group: string }> = {
  overview: { label: 'Seeker Overview', group: 'My Journey' },
  saved: { label: 'Saved Homes', group: 'My Journey' },
  tours: { label: 'Scheduled Viewings', group: 'My Journey' },
  searches: { label: 'Saved Searches', group: 'Search & Comms' },
  messages: { label: 'Agent Conversations', group: 'Search & Comms' },
  alerts: { label: 'Property Alerts', group: 'Search & Comms' },
  documents: { label: 'Document & KYC Vault', group: 'Readiness' },
  payments: { label: 'Payments & Pre-Approval', group: 'Readiness' },
};

const formatSearchFilters = (filters: SearchFilters) => {
  const parts = [];
  if (filters.location) parts.push(filters.location);
  if (filters.listingType && filters.listingType !== ListingType.ALL) parts.push(filters.listingType);
  if (filters.propertyType && filters.propertyType !== 'All Types') parts.push(filters.propertyType);
  if (filters.bedrooms > 0) parts.push(`${filters.bedrooms}+ beds`);
  if (filters.bathrooms > 0) parts.push(`${filters.bathrooms}+ baths`);
  if (filters.amenities?.length > 0) parts.push(`${filters.amenities.length} amenities`);
  return parts.join(' · ') || 'Any property across Africa';
};

const UserDashboard: React.FC<UserDashboardProps> = (props) => {
  const {
    user,
    allProperties = [],
    savedProperties = [],
    tourRequests,
    savedSearches,
    messages,
    propertiesToCompare = [],
    onRunSearch,
    onDeleteSearch,
    onBrowseMarketplace,
    onOpenDetailModal,
    onOpenCalculator,
    onOpenTourModal,
    onSaveToggle,
    onToggleCompare,
    onCompareClick,
    onUpgradeAccountRequest,
    onListPropertyClick,
    onSendMessage,
  } = props;

  const [activeView, setActiveView] = useState<SeekerView>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { formatCurrency } = useCurrency();
  const { addToast } = useToast();

  const groupedMessages = useMemo(() => {
    return messages.reduce((acc: Record<string, Message[]>, msg) => {
      if (!acc[msg.propertyId]) {
        acc[msg.propertyId] = [];
      }
      acc[msg.propertyId].push(msg);
      return acc;
    }, {} as Record<string, Message[]>);
  }, [messages]);

  const journeyItems: { id: SeekerView; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: DashboardIcon },
    { id: 'saved', label: 'Saved Homes', icon: HeartIcon, badge: savedProperties.length },
    { id: 'tours', label: 'Scheduled Tours', icon: CalendarIcon, badge: tourRequests.length },
  ];

  const searchItems: { id: SeekerView; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'searches', label: 'Saved Searches', icon: BookmarkIcon, badge: savedSearches.length },
    { id: 'messages', label: 'Agent Messages', icon: ChatBubbleLeftRightIcon, badge: Object.keys(groupedMessages).length },
    { id: 'alerts', label: 'Property Alerts', icon: BellIcon },
  ];

  const readinessItems: { id: SeekerView; label: string; icon: React.ElementType }[] = [
    { id: 'documents', label: 'Document Vault', icon: DocumentDuplicateIcon },
    { id: 'payments', label: 'Payments & Escrow', icon: BanknotesIcon },
  ];

  const currentMeta = viewMeta[activeView];

  const handleSelectView = (view: SeekerView) => {
    setActiveView(view);
    setIsSidebarOpen(false);
  };

  const renderGroup = (
    title: string,
    items: { id: SeekerView; label: string; icon: React.ElementType; badge?: number }[]
  ) => (
    <div className="mb-5">
      <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-200/50">
        {title}
      </p>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectView(item.id)}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-white/10 text-amber-300 font-semibold'
                  : 'text-emerald-100/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-emerald-300/70'}`} />
                <span className="truncate">{item.label}</span>
              </span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums ${
                    isActive ? 'bg-amber-400/20 text-amber-200' : 'bg-white/10 text-emerald-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return (
          <SeekerOverview
            user={user}
            savedProperties={savedProperties}
            tourRequests={tourRequests}
            savedSearches={savedSearches}
            messageThreadCount={Object.keys(groupedMessages).length}
            formatCurrency={formatCurrency}
            onNavigate={setActiveView}
            onBrowseMarketplace={onBrowseMarketplace}
            onOpenDetailModal={onOpenDetailModal}
            onUpgradeAccountRequest={onUpgradeAccountRequest}
          />
        );
      case 'saved':
        return (
          <SavedPropertiesView
            savedProperties={savedProperties}
            propertiesToCompare={propertiesToCompare}
            formatCurrency={formatCurrency}
            onBrowseMarketplace={onBrowseMarketplace}
            onOpenDetailModal={onOpenDetailModal}
            onOpenCalculator={onOpenCalculator}
            onOpenTourModal={onOpenTourModal}
            onSaveToggle={onSaveToggle}
            onToggleCompare={onToggleCompare}
            onCompareClick={onCompareClick}
          />
        );
      case 'tours':
        return <TourRequestsView tourRequests={tourRequests} onBrowseMarketplace={onBrowseMarketplace} />;
      case 'searches':
        return (
          <SavedSearchesView
            savedSearches={savedSearches}
            onRunSearch={onRunSearch}
            onDeleteSearch={onDeleteSearch}
            onBrowseMarketplace={onBrowseMarketplace}
          />
        );
      case 'messages':
        return (
          <MessagesView
            groupedMessages={groupedMessages}
            user={user}
            allProperties={allProperties}
            onSendMessage={onSendMessage}
            onBrowseMarketplace={onBrowseMarketplace}
          />
        );
      case 'alerts':
        return <PropertyAlertsView user={user} addToast={addToast} />;
      case 'documents':
        return <DocumentVaultView user={user} addToast={addToast} />;
      case 'payments':
        return <PaymentsView addToast={addToast} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 min-h-[calc(100vh-8rem)] font-sans relative bg-slate-50 dark:bg-slate-950">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Executive Emerald Sidebar */}
      <div
        className={`fixed lg:sticky lg:top-16 inset-y-0 left-0 z-50 lg:z-30 transform transition-transform duration-200 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 flex-shrink-0 h-screen lg:h-[calc(100vh-4rem)]`}
      >
        <aside className="w-64 bg-[#0B1F1A] text-white flex flex-col h-full border-r border-emerald-950 select-none">
          <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={user.profilePicture || '/images/tersia-kroonstad.webp'}
                referrerPolicy="no-referrer"
                alt={user.fullName || user.username}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.fb) {
                    target.dataset.fb = '1';
                    target.src = '/images/tersia-kroonstad.webp';
                  }
                }}
                className="w-9 h-9 rounded-lg object-cover shrink-0 border border-white/15"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user.fullName || user.username}
                </p>
                <p className="text-[11px] text-amber-300/80 font-medium truncate">
                  Property Seeker
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-md text-emerald-200 hover:bg-white/10"
              aria-label="Close sidebar"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            {renderGroup('My Journey', journeyItems)}
            {renderGroup('Search & Comms', searchItems)}
            {renderGroup('Readiness', readinessItems)}
          </div>

          <div className="p-3 border-t border-white/10 space-y-2">
            {onUpgradeAccountRequest && (
              <button
                type="button"
                onClick={onUpgradeAccountRequest}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-[#C9A35D] text-[#0B1F1A] hover:bg-amber-300 transition-colors"
              >
                <RocketLaunchIcon className="w-4 h-4" />
                <span>Upgrade to Investor</span>
              </button>
            )}
            {onListPropertyClick && (
              <button
                type="button"
                onClick={onListPropertyClick}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-white/10 text-white hover:bg-white/15 transition-colors"
              >
                <span>Host Stay / Service</span>
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Main Full-Page Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 sticky top-16 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="hidden sm:inline">{currentMeta.group}</span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {currentMeta.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onBrowseMarketplace && (
              <button
                type="button"
                onClick={onBrowseMarketplace}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#0F2D25] text-white hover:bg-[#173f34] transition-colors whitespace-nowrap"
              >
                <span>Explore Properties</span>
                <ArrowRightIcon className="w-3.5 h-3.5 text-[#C9A35D]" />
              </button>
            )}
          </div>
        </div>

        <main className="flex-1">{renderContent()}</main>
      </div>
    </div>
  );
};

const SeekerOverview: React.FC<{
  user: User;
  savedProperties: Property[];
  tourRequests: TourRequest[];
  savedSearches: SearchFilters[];
  messageThreadCount: number;
  formatCurrency: (val: number) => string;
  onNavigate: (view: SeekerView) => void;
  onBrowseMarketplace?: () => void;
  onOpenDetailModal?: (property: Property) => void;
  onUpgradeAccountRequest?: () => void;
}> = ({
  user,
  savedProperties,
  tourRequests,
  savedSearches,
  messageThreadCount,
  formatCurrency,
  onNavigate,
  onBrowseMarketplace,
  onOpenDetailModal,
  onUpgradeAccountRequest,
}) => {
  const kpis = [
    { label: 'Saved Homes', value: String(savedProperties.length), sub: 'Shortlisted residences', icon: HeartIcon, view: 'saved' as SeekerView },
    { label: 'Scheduled Tours', value: String(tourRequests.length), sub: 'Upcoming viewings', icon: CalendarIcon, view: 'tours' as SeekerView },
    { label: 'Saved Searches', value: String(savedSearches.length), sub: 'Tracked market filters', icon: BookmarkIcon, view: 'searches' as SeekerView },
    { label: 'Agent Threads', value: String(messageThreadCount), sub: 'Direct enquiries', icon: ChatBubbleLeftRightIcon, view: 'messages' as SeekerView },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {(user.fullName || user.username).split(' ')[0]}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your saved residences, viewing appointments, saved search criteria, and pre-approval documents.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onUpgradeAccountRequest && (
            <button
              type="button"
              onClick={onUpgradeAccountRequest}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Switch to Investor Tier
            </button>
          )}
          {onBrowseMarketplace && (
            <button
              type="button"
              onClick={onBrowseMarketplace}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0F2D25] text-white hover:bg-[#173f34] transition-colors whitespace-nowrap"
            >
              Browse Marketplace
            </button>
          )}
        </div>
      </div>

      {/* Unified KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={() => onNavigate(kpi.view)}
            className="p-5 flex items-start justify-between gap-3 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {kpi.label}
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums tracking-tight">
                {kpi.value}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{kpi.sub}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
              <kpi.icon className="w-5 h-5" />
            </div>
          </button>
        ))}
      </div>

      {/* Main Split: Shortlisted Residences + Upcoming Tours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Shortlisted Properties
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Quick access to properties you saved across Africa
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('saved')}
              className="text-xs font-semibold text-[#0F2D25] dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              View All ({savedProperties.length}) &rarr;
            </button>
          </div>

          {savedProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedProperties.slice(0, 4).map((prop) => (
                <button
                  key={prop.id}
                  type="button"
                  onClick={() => onOpenDetailModal?.(prop)}
                  className="text-left group rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors bg-slate-50/50 dark:bg-slate-950/50"
                >
                  <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={prop.images?.[0] || '/images/383842941.jpg'}
                      alt={prop.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3.5">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {prop.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {prop.address.city} · {prop.propertyType}
                    </p>
                    <p className="text-sm font-bold text-[#0F2D25] dark:text-amber-300 font-mono tabular-nums mt-2">
                      {formatCurrency(prop.price)}
                      {prop.listingType === ListingType.RENT ? '/mo' : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl px-4">
              <HeartIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-3">
                No shortlisted properties yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Tap the heart button on any verified listing to build your private comparison shortlist.
              </p>
              {onBrowseMarketplace && (
                <button
                  type="button"
                  onClick={onBrowseMarketplace}
                  className="mt-4 px-4 py-2 rounded-lg bg-[#0F2D25] text-white text-xs font-semibold hover:bg-[#173f34]"
                >
                  Explore Verified Homes
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Upcoming Viewings
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('tours')}
                className="text-xs font-semibold text-[#0F2D25] dark:text-emerald-400 hover:underline"
              >
                All
              </button>
            </div>
            {tourRequests.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {tourRequests.slice(0, 4).map((r) => (
                  <div key={r.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {r.propertyTitle}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono tabular-nums">
                        {r.date} · {r.time}
                      </span>
                      <span className="font-semibold text-amber-700 dark:text-amber-300">
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No viewings booked yet. Request a private tour from any listing page.
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <ShieldCheckIcon className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Buyer &amp; Renter Readiness</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Prepare KYC documents, proof of funds, or lease references in advance for priority agent scheduling.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('documents')}
              className="w-full py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
            >
              Open Document Vault &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SavedPropertiesView: React.FC<{
  savedProperties: Property[];
  propertiesToCompare: Property[];
  formatCurrency: (v: number) => string;
  onBrowseMarketplace?: () => void;
  onOpenDetailModal?: (property: Property) => void;
  onOpenCalculator?: (property: Property) => void;
  onOpenTourModal?: (property: Property) => void;
  onSaveToggle?: (propertyId: string) => void;
  onToggleCompare?: (property: Property) => void;
  onCompareClick?: () => void;
}> = ({
  savedProperties,
  propertiesToCompare,
  formatCurrency,
  onBrowseMarketplace,
  onOpenDetailModal,
  onOpenCalculator,
  onOpenTourModal,
  onSaveToggle,
  onToggleCompare,
  onCompareClick,
}) => (
  <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Saved Homes ({savedProperties.length})
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Compare homes side-by-side, model financing, or book private inspections.
        </p>
      </div>
      {onCompareClick && propertiesToCompare.length >= 2 && (
        <button
          type="button"
          onClick={onCompareClick}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0F2D25] text-white hover:bg-[#173f34] transition-colors whitespace-nowrap"
        >
          <ScaleIcon className="w-4 h-4 text-[#C9A35D]" />
          Compare Selected ({propertiesToCompare.length})
        </button>
      )}
    </div>

    {savedProperties.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {savedProperties.map((property) => {
          const isCompared = propertiesToCompare.some((c) => c.id === property.id);
          return (
            <div
              key={property.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/10] relative bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <img
                  src={property.images?.[0] || '/images/383842941.jpg'}
                  alt={property.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base text-slate-900 dark:text-white truncate">
                      {property.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                      <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                      {property.address.city}, {property.country || 'South Africa'}
                    </p>
                  </div>
                  <p className="font-mono tabular-nums text-sm font-bold text-[#0F2D25] dark:text-amber-300 whitespace-nowrap">
                    {formatCurrency(property.price)}
                    {property.listingType === ListingType.RENT ? '/mo' : ''}
                  </p>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-mono tabular-nums">
                  {property.details?.beds ?? 0} bd · {property.details?.baths ?? 0} ba · {(property.details?.area ?? 0).toLocaleString()} sq ft · {property.propertyType}
                </p>

                <div className="mt-auto pt-4 flex flex-wrap items-center gap-2">
                  {onOpenDetailModal && (
                    <button
                      type="button"
                      onClick={() => onOpenDetailModal(property)}
                      className="flex-1 px-3 py-2 rounded-lg bg-[#0F2D25] text-white text-xs font-semibold hover:bg-[#173f34] transition-colors whitespace-nowrap"
                    >
                      Inspect
                    </button>
                  )}
                  {onOpenTourModal && (
                    <button
                      type="button"
                      onClick={() => onOpenTourModal(property)}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                    >
                      Book Tour
                    </button>
                  )}
                  {onOpenCalculator && (
                    <button
                      type="button"
                      onClick={() => onOpenCalculator(property)}
                      title="Mortgage Calculator"
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <CalculatorIcon className="w-4 h-4" />
                    </button>
                  )}
                  {onToggleCompare && (
                    <button
                      type="button"
                      onClick={() => onToggleCompare(property)}
                      title={isCompared ? 'Remove from comparison' : 'Add to comparison'}
                      className={`p-2 rounded-lg border transition-colors ${
                        isCompared
                          ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/50 dark:border-amber-700 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ScaleIcon className="w-4 h-4" />
                    </button>
                  )}
                  {onSaveToggle && (
                    <button
                      type="button"
                      onClick={() => onSaveToggle(property.id)}
                      title="Remove from saved"
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <EmptyState
        icon={HeartIcon}
        title="No Saved Homes"
        message="Properties you bookmark across the AfriEstate marketplace will appear here for comparison and private scheduling."
        actionLabel={onBrowseMarketplace ? 'Browse Marketplace' : undefined}
        onAction={onBrowseMarketplace}
      />
    )}
  </div>
);

const TourRequestsView: React.FC<{
  tourRequests: TourRequest[];
  onBrowseMarketplace?: () => void;
}> = ({ tourRequests, onBrowseMarketplace }) => (
  <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
        Scheduled Viewings ({tourRequests.length})
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Confirmed and pending in-person or virtual property tours.
      </p>
    </div>

    {tourRequests.length > 0 ? (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Property</th>
                <th className="py-3 px-4 font-semibold">Requested Date</th>
                <th className="py-3 px-4 font-semibold">Time</th>
                <th className="py-3 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tourRequests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {r.propertyTitle}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 dark:text-slate-300">
                    {r.date}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 dark:text-slate-300">
                    {r.time}
                  </td>
                  <td className="py-3 px-4 text-right text-xs font-semibold text-amber-700 dark:text-amber-300">
                    {r.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ) : (
      <EmptyState
        icon={CalendarIcon}
        title="No Tour Requests"
        message="When you schedule a private tour for a property, your appointment status and timing will appear here."
        actionLabel={onBrowseMarketplace ? 'Explore Properties' : undefined}
        onAction={onBrowseMarketplace}
      />
    )}
  </div>
);

const SavedSearchesView: React.FC<{
  savedSearches: SearchFilters[];
  onRunSearch: (f: SearchFilters) => void;
  onDeleteSearch: (f: SearchFilters) => void;
  onBrowseMarketplace?: () => void;
}> = ({ savedSearches, onRunSearch, onDeleteSearch, onBrowseMarketplace }) => (
  <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
        Saved Searches ({savedSearches?.length || 0})
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Re-run saved regional and infrastructure filters directly on the marketplace.
      </p>
    </div>

    {savedSearches && savedSearches.length > 0 ? (
      <div className="space-y-3">
        {savedSearches.map((search, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#0F2D25] dark:text-[#C9A35D] shrink-0">
                <BookmarkIcon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                {formatSearchFilters(search)}
              </p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => onRunSearch(search)}
                className="bg-[#0F2D25] hover:bg-[#173f34] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <SearchIcon className="w-3.5 h-3.5 text-[#C9A35D]" />
                Run Search
              </button>
              <button
                type="button"
                onClick={() => onDeleteSearch(search)}
                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-2 rounded-lg transition-colors"
                title="Delete saved search"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState
        icon={BookmarkIcon}
        title="No Saved Searches"
        message='Perform a search in the marketplace and click "Save this Search" to track matching homes.'
        actionLabel={onBrowseMarketplace ? 'Start Searching' : undefined}
        onAction={onBrowseMarketplace}
      />
    )}
  </div>
);

const MessagesView: React.FC<{
  groupedMessages: Record<string, Message[]>;
  user: User;
  allProperties: Property[];
  onSendMessage?: (property: Property, text: string) => Promise<void> | void;
  onBrowseMarketplace?: () => void;
}> = ({ groupedMessages, user, allProperties, onSendMessage, onBrowseMarketplace }) => {
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const handleReplySubmit = async (e: React.FormEvent, propertyId: string, propertyTitle: string, msgs: Message[]) => {
    e.preventDefault();
    const text = (replyDrafts[propertyId] || '').trim();
    if (!text || !onSendMessage) return;

    const matchedProperty =
      allProperties.find((p) => p.id === propertyId) ||
      ({
        id: propertyId,
        title: propertyTitle,
        agent: {
          name: msgs.find((m) => m.senderUsername !== user.username)?.senderUsername || msgs[0]?.receiverUsername || 'AfriEstate Advisor',
        },
      } as Property);

    await onSendMessage(matchedProperty, text);
    setReplyDrafts((prev) => ({ ...prev, [propertyId]: '' }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Agent Conversations
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Direct messages with listing advisors and property managers.
        </p>
      </div>

      {Object.keys(groupedMessages).length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(groupedMessages).map(([propertyId, msgs]) => (
            <div
              key={propertyId}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col"
            >
              <h3 className="font-semibold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                {msgs[0].propertyTitle}
              </h3>
              <div className="space-y-3 max-h-72 overflow-y-auto py-4 pr-1 flex-1">
                {msgs.map((msg) => {
                  const isMine = msg.senderUsername === user.username;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`px-3.5 py-2.5 rounded-xl max-w-sm text-xs ${
                          isMine
                            ? 'bg-[#0F2D25] text-white'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.text}</p>
                        <p className="text-[10px] opacity-70 mt-1 text-right font-mono tabular-nums">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {onSendMessage && (
                <form
                  onSubmit={(e) => handleReplySubmit(e, propertyId, msgs[0].propertyTitle, msgs)}
                  className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={replyDrafts[propertyId] || ''}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [propertyId]: e.target.value }))}
                    placeholder="Write a follow-up message..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#0F2D25] text-white hover:bg-[#173f34] transition-colors whitespace-nowrap"
                  >
                    Send
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ChatBubbleLeftRightIcon}
          title="No Messages Yet"
          message="Inquiries and replies exchanged with listing agents will appear here."
          actionLabel={onBrowseMarketplace ? 'Browse Listings' : undefined}
          onAction={onBrowseMarketplace}
        />
      )}
    </div>
  );
};

const PropertyAlertsView: React.FC<{
  user: User;
  addToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}> = ({ user, addToast }) => {
  const [alerts, setAlerts] = useState<PropertyAlert[]>([]);
  const [newAlertName, setNewAlertName] = useState('');

  useEffect(() => {
    const fetchAlerts = async () => {
      const data = await getPropertyAlerts(user.username);
      setAlerts(Array.isArray(data) ? (data as PropertyAlert[]) : []);
    };
    fetchAlerts();
  }, [user.username]);

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertName.trim()) return;
    const newAlert = await addPropertyAlert(user.username, { name: newAlertName.trim(), criteria: {} });
    setAlerts((prev) => [newAlert, ...prev]);
    setNewAlertName('');
    addToast('Property alert created.', 'success');
  };

  const handleDeleteAlert = async (id: string) => {
    await deletePropertyAlert(user.username, id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Property Alerts ({alerts.length})
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Receive alerts as soon as matching verified homes hit the market.
        </p>
      </div>

      <form
        onSubmit={handleAddAlert}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        <input
          type="text"
          value={newAlertName}
          onChange={(e) => setNewAlertName(e.target.value)}
          placeholder="e.g., 3-bed Solar Villa in Sea Point under R6M"
          className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
          required
        />
        <button
          type="submit"
          className="bg-[#0F2D25] hover:bg-[#173f34] text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          Create Alert
        </button>
      </form>

      {alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <BellIcon className="w-5 h-5 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
                  {alert.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteAlert(alert.id)}
                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-2 rounded-lg shrink-0"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BellIcon}
          title="No Property Alerts"
          message="Create a named alert above to monitor new properties matching your criteria."
        />
      )}
    </div>
  );
};

const DocumentVaultView: React.FC<{
  user: User;
  addToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}> = ({ user, addToast }) => {
  const [docs, setDocs] = useState<UserDocument[]>([]);

  useEffect(() => {
    const fetchDocs = async () => {
      const data = await getUserDocuments(user.username);
      setDocs(Array.isArray(data) ? (data as UserDocument[]) : []);
    };
    fetchDocs();
  }, [user.username]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newDoc = await addUserDocument(user.username, file);
      setDocs((prev) => [newDoc, ...prev]);
      addToast(`Uploaded "${file.name}" to your private vault.`, 'success');
    }
  };

  const handleDeleteDoc = async (id: string) => {
    await deleteUserDocument(user.username, id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Document &amp; KYC Vault
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Securely organize ID documents, proof of funds, and pre-approval letters.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          Store supporting files privately for one-click rental applications or offer submissions.
        </p>
        <label
          htmlFor="doc-upload"
          className="bg-[#0F2D25] hover:bg-[#173f34] text-white text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
        >
          <ArrowUpTrayIcon className="w-4 h-4 text-[#C9A35D]" />
          Upload Document
        </label>
        <input type="file" id="doc-upload" className="hidden" onChange={handleFileChange} />
      </div>

      {docs.length > 0 ? (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <DocumentDuplicateIcon className="w-5 h-5 text-slate-400 shrink-0" />
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
                  {doc.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteDoc(doc.id)}
                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-2 rounded-lg shrink-0"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={DocumentDuplicateIcon}
          title="Document Vault is Empty"
          message="Upload proof of income, ID verification, or bank pre-approval documents when ready."
        />
      )}
    </div>
  );
};

const PaymentsView: React.FC<{
  addToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}> = ({ addToast }) => {
  const [savedCards, setSavedCards] = useState<{ id: string; brand: string; last4: string; expiry: string }[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [cardLabel, setCardLabel] = useState('Visa Corporate');
  const [last4, setLast4] = useState('');
  const [expiry, setExpiry] = useState('08/29');

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = last4.replace(/\D/g, '').slice(-4);
    if (digits.length !== 4) {
      addToast('Enter the last 4 digits of your payment card.', 'error');
      return;
    }
    setSavedCards((prev) => [
      ...prev,
      { id: `card_${Date.now()}`, brand: cardLabel, last4: digits, expiry },
    ]);
    setLast4('');
    setShowAddForm(false);
    addToast('Payment method added to your seeker profile.', 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Payments &amp; Escrow Readiness
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage booking deposit methods and view holding deposit activity.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Payment Methods</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Used for verified short-stay reservations and refundable viewing holds
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="bg-[#0F2D25] hover:bg-[#173f34] text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors"
          >
            {showAddForm ? 'Cancel' : 'Add Payment Method'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSaveCard} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <select
              value={cardLabel}
              onChange={(e) => setCardLabel(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <option value="Visa">Visa</option>
              <option value="Mastercard">Mastercard</option>
              <option value="EFT Reference">Instant EFT Account</option>
            </select>
            <input
              type="text"
              maxLength={4}
              value={last4}
              onChange={(e) => setLast4(e.target.value)}
              placeholder="Last 4 digits (e.g. 4242)"
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
            />
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="MM/YY"
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
            >
              Save Method
            </button>
          </form>
        )}

        {savedCards.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {savedCards.map((card) => (
              <div key={card.id} className="py-3 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {card.brand} ending in <span className="font-mono tabular-nums">{card.last4}</span> · Exp {card.expiry}
                </span>
                <button
                  type="button"
                  onClick={() => setSavedCards((prev) => prev.filter((c) => c.id !== card.id))}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">No payment methods saved yet.</p>
        )}

        <hr className="border-slate-200 dark:border-slate-800" />
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Transaction &amp; Escrow History
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Completed booking settlements and refundable deposit records will appear here.
          </p>
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{
  icon: React.ElementType;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon: Icon, title, message, actionLabel, onAction }) => (
  <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6">
    <Icon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mt-4">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">{message}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0F2D25] text-white hover:bg-[#173f34] transition-colors"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default UserDashboard;