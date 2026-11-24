import React from 'react';
import type {
  Property,
  TourRequest,
  User,
  SearchFilters,
  Message,
  CalendarEvent,
  AgentProfile,
  Review,
  Lead,
  Achievement,
  InvestorSettings,
  Currency,
  InvestmentRequest,
  Notification,
} from '../../types';
import UserDashboard from '../dashboards/UserDashboard';
import AgentDashboard from '../dashboards/AgentDashboard';
import InvestorDashboard from '../dashboards/InvestorDashboard';
import { MoonIcon, SunIcon } from '../icons/AgentDashboardIcons';
import {
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { CURRENCY_SYMBOLS } from '../../constants';
import { useAdminState, type SovereignRoleKey } from '../../contexts/AdminStateContext';

export type DashboardPortalMode = 'auto' | 'seeker' | 'agent' | 'investor';

interface DashboardPortalPageProps {
  portalMode?: DashboardPortalMode;
  user: User | null;
  allProperties: Property[];
  investmentProperties: Property[];
  tourRequests: TourRequest[];
  receivedInquiries: TourRequest[];
  savedSearches: SearchFilters[];
  savedProperties: Property[];
  propertiesToCompare: Property[];
  messages: Message[];
  calendarEvents: CalendarEvent[];
  agentProfile: AgentProfile | null;
  agentReviews: Review[];
  leads: Lead[];
  agentAchievements: Achievement[];
  investorAchievements: Achievement[];
  investmentRequests: InvestmentRequest[];
  investorSettings: InvestorSettings | null;
  currency: Currency;
  theme: 'light' | 'dark';
  onBackToMarketplace: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onEditProperty: (property: Property) => void;
  onDeleteProperty: (propertyId: string) => void;
  onDraftReply: (inquiry: TourRequest) => void;
  onRunSearch: (filters: SearchFilters) => void;
  onDeleteSearch: (filters: SearchFilters) => void;
  onListPropertyClick: () => void;
  onAddEvent: (eventData: Omit<CalendarEvent, 'id'>) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onOpenAIImprovementModal: (property: Property) => void;
  onUpdateAgentProfile: (profile: AgentProfile) => void;
  onUpdateAgentAchievements: (achievements: Achievement[]) => void;
  onUpdateInvestorAchievements: (achievements: Achievement[]) => void;
  onUpdateInvestorSettings: (settings: InvestorSettings) => void;
  onThemeToggle: () => void;
  onCompareClick: () => void;
  onCurrencyChange: (currency: Currency) => void;
  onUpgradeAccountRequest: () => void;
  onSaveToggle: (propertyId: string) => void;
  savedPropertyIds: Set<string>;
  onOpenCalculator: (property: Property) => void;
  onOpenTourModal: (property: Property) => void;
  onFindSimilar: (property: Property) => void;
  onOpenDetailModal: (property: Property) => void;
  onOpenVRTour: (url: string) => void;
  onToggleCompare: (property: Property) => void;
  onSendMessage?: (property: Property, text: string) => Promise<void> | void;
  onNotificationsDispatched?: (notifications: Notification[]) => void;
  isAuthLoading?: boolean;
  onNavigatePlatformPage?: (target: 'book-flights' | 'book-a-stay' | 'long-term-stays' | 'rent-a-car' | 'find-wellness') => void;
}

const roleMeta: Record<string, { title: string; badge: string }> = {
  agent: { title: 'Agent Platform', badge: 'Brokerage Workspace' },
  hotel_manager: { title: 'Hospitality & Agent Platform', badge: 'Partner Workspace' },
  developer: { title: 'Developer & Agent Platform', badge: 'Project Workspace' },
  agency: { title: 'Agency Platform', badge: 'Brokerage Workspace' },
  investor: { title: 'Investor Platform', badge: 'Capital & Portfolio Suite' },
  user: { title: 'Property Seeker Dashboard', badge: 'Buyer & Renter Hub' },
};

const DashboardPortalPage: React.FC<DashboardPortalPageProps> = (props) => {
  const {
    portalMode = 'auto',
    user,
    isAuthLoading = false,
    theme,
    onThemeToggle,
    currency,
    onCurrencyChange,
    onLogout,
    onBackToMarketplace,
    onOpenAuth,
  } = props;
  const { settings, roleControls, userOverrides } = useAdminState();

  if (isAuthLoading && !user) {
    return (
      <div className="min-h-[70vh] bg-[#FAF8F5] dark:bg-slate-950 flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#0F2D25] dark:border-[#C9A35D] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A35D]">
            AfriEstate Workspace
          </p>
          <h1 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
            Verifying your session…
          </h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] bg-[#FAF8F5] dark:bg-slate-950 flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A35D]">
            AfriEstate Workspace
          </p>
          <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
            Sign in to access your platform
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Access your saved homes, scheduled tours, agent brokerage tools, or investor portfolio analytics in full screen.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-5 py-2.5 rounded-xl bg-[#0F2D25] hover:bg-[#173f34] text-white text-xs font-semibold transition-colors"
            >
              Sign In / Register
            </button>
            <button
              type="button"
              onClick={onBackToMarketplace}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const userKey = user.username.toLowerCase();
  const emailKey = (user.email || '').toLowerCase();
  const override = userOverrides[userKey] || (emailKey ? userOverrides[emailKey] : undefined);
  const effectiveRoleKey = ((override?.role || user.role || 'user') as SovereignRoleKey);
  const rolePolicy = roleControls[effectiveRoleKey] || roleControls.user;

  const resolvedView: 'agent' | 'investor' | 'user' =
    portalMode === 'agent'
      ? 'agent'
      : portalMode === 'investor'
      ? 'investor'
      : portalMode === 'seeker'
      ? 'user'
      : effectiveRoleKey === 'investor'
      ? 'investor'
      : ['agent', 'hotel_manager', 'developer', 'agency'].includes(effectiveRoleKey)
      ? 'agent'
      : 'user';

  const effectiveKyc = override?.kycStatus || user.kycStatus || (user.isVerified ? 'Approved' : 'Pending');
  const isWalletFrozen = Boolean(override?.isWalletFrozen ?? user.isWalletFrozen);
  const canPublishByPolicy =
    override?.canPublish !== false &&
    rolePolicy.canPublishListings &&
    (!(settings.securityPolicies.requireKycToPublish || rolePolicy.requiresKycApproval) || effectiveKyc === 'Approved');

  const meta =
    resolvedView === 'agent'
      ? roleMeta[effectiveRoleKey] || roleMeta.agent
      : resolvedView === 'investor'
      ? roleMeta.investor
      : roleMeta.user;

  const renderPlatformBody = () => {
    if (resolvedView === 'agent') {
      return (
        <AgentDashboard
          {...props}
          user={{ ...user, role: effectiveRoleKey as any }}
          achievements={props.agentAchievements}
          onUpdateAchievements={props.onUpdateAgentAchievements}
        />
      );
    }

    if (resolvedView === 'investor') {
      return (
        <InvestorDashboard
          {...props}
          onClose={onBackToMarketplace}
          user={{ ...user, role: 'investor' }}
        />
      );
    }

    return (
      <UserDashboard
        user={user}
        allProperties={props.allProperties}
        savedProperties={props.savedProperties}
        savedPropertyIds={props.savedPropertyIds}
        tourRequests={props.tourRequests}
        savedSearches={props.savedSearches}
        messages={props.messages}
        propertiesToCompare={props.propertiesToCompare}
        onRunSearch={props.onRunSearch}
        onDeleteSearch={props.onDeleteSearch}
        onBrowseMarketplace={onBackToMarketplace}
        onOpenDetailModal={props.onOpenDetailModal}
        onOpenCalculator={props.onOpenCalculator}
        onOpenTourModal={props.onOpenTourModal}
        onSaveToggle={props.onSaveToggle}
        onToggleCompare={props.onToggleCompare}
        onCompareClick={props.onCompareClick}
        onUpgradeAccountRequest={props.onUpgradeAccountRequest}
        onListPropertyClick={props.onListPropertyClick}
        onSendMessage={props.onSendMessage}
        onNavigatePlatformPage={props.onNavigatePlatformPage}
      />
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Executive Full-Page Platform Header Strip */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={onBackToMarketplace}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              Marketplace
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate font-heading">
                {meta.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-200">{user.fullName || user.username}</span>
                <span aria-hidden="true">·</span>
                <span>{rolePolicy?.label || meta.badge}</span>
                <span aria-hidden="true" className="hidden sm:inline">·</span>
                <span
                  className={`hidden sm:inline-flex items-center gap-1 font-medium ${
                    effectiveKyc === 'Approved'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : effectiveKyc === 'Flagged'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  <ShieldCheckIcon className="w-3.5 h-3.5" />
                  KYC {effectiveKyc}
                </span>
                <span aria-hidden="true" className="hidden md:inline">·</span>
                <span className="hidden md:inline font-mono tabular-nums">
                  Quota: {rolePolicy.maxActiveListings} listings
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {resolvedView !== 'user' && (
              <select
                aria-label="Workspace Currency"
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value as Currency)}
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg py-2 px-3 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
              >
                {Object.keys(CURRENCY_SYMBOLS).map((c) => (
                  <option key={c} value={c}>
                    {c} ({CURRENCY_SYMBOLS[c as Currency]})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={onThemeToggle}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Super Admin Governance Strip (when applicable) */}
      {(isWalletFrozen || !canPublishByPolicy || override?.status === 'Restricted' || override?.adminNote) && (
        <div className="px-4 sm:px-6 lg:px-8 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60">
          <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 font-medium">
              {isWalletFrozen ? (
                <LockClosedIcon className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>
                {isWalletFrozen
                  ? 'Platform Governance Notice: Payout wallet temporarily locked by Super Admin.'
                  : !canPublishByPolicy
                  ? 'Publishing Restricted: Super Admin KYC or role publishing gate is active for this account.'
                  : override?.status === 'Restricted'
                  ? 'Account Under Compliance Review: Some actions require administrator clearance.'
                  : `Administration Note: ${override?.adminNote}`}
              </span>
            </div>
            {override?.adminNote && (isWalletFrozen || !canPublishByPolicy) && (
              <span className="text-[11px] font-mono text-amber-800 dark:text-amber-300">
                Note: {override.adminNote}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Full-Page Workspace */}
      <div className="flex-1 w-full flex flex-col">
        {renderPlatformBody()}
      </div>
    </div>
  );
};

export default DashboardPortalPage;
