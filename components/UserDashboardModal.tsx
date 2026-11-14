import React from 'react';
import type { Property, TourRequest, User, SearchFilters, Message, CalendarEvent, AgentProfile, Review, Lead, Achievement, InvestorSettings, Currency, InvestmentRequest } from '../types';
import { CloseIcon } from './icons/NavIcons';
import UserDashboard from './dashboards/UserDashboard';
import AgentDashboard from './dashboards/AgentDashboard';
import InvestorDashboard from './dashboards/InvestorDashboard';
import { MoonIcon, SunIcon } from './icons/AgentDashboardIcons';
import { ArrowRightOnRectangleIcon, ShieldCheckIcon, ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { CURRENCY_SYMBOLS } from '../constants';
import { useAdminState, type SovereignRoleKey } from '../contexts/AdminStateContext';

interface UserDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
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
}

const roleMeta: Record<string, { title: string; badge: string }> = {
  agent: { title: 'Agent Studio', badge: 'Brokerage Workspace' },
  investor: { title: 'Investor Terminal', badge: 'Portfolio Suite' },
  user: { title: 'Member Hub', badge: 'Personal Account' },
};

const UserDashboardModal: React.FC<UserDashboardModalProps> = (props) => {
  const { isOpen, onClose, user, theme, onThemeToggle, currency, onCurrencyChange, onLogout } = props;
  const { settings, roleControls, userOverrides } = useAdminState();

  if (!isOpen) return null;

  const userKey = user.username.toLowerCase();
  const emailKey = (user.email || '').toLowerCase();
  const override = userOverrides[userKey] || (emailKey ? userOverrides[emailKey] : undefined);
  const effectiveRoleKey = ((override?.role || user.role || 'user') as SovereignRoleKey);
  const rolePolicy = roleControls[effectiveRoleKey] || roleControls.user;

  const effectiveKyc = override?.kycStatus || user.kycStatus || (user.isVerified ? 'Approved' : 'Pending');
  const isWalletFrozen = Boolean(override?.isWalletFrozen ?? user.isWalletFrozen);
  const canPublishByPolicy =
    override?.canPublish !== false &&
    rolePolicy.canPublishListings &&
    (!(settings.securityPolicies.requireKycToPublish || rolePolicy.requiresKycApproval) || effectiveKyc === 'Approved');

  const meta = roleMeta[effectiveRoleKey] || roleMeta[user.role] || roleMeta.user;

  const renderDashboard = () => {
    switch (effectiveRoleKey) {
      case 'agent':
      case 'hotel_manager':
      case 'developer':
      case 'agency':
        return (
          <AgentDashboard
            {...props}
            user={{ ...user, role: effectiveRoleKey as any }}
            achievements={props.agentAchievements}
            onUpdateAchievements={props.onUpdateAgentAchievements}
          />
        );
      case 'investor':
        return <InvestorDashboard {...props} user={{ ...user, role: 'investor' }} />;
      case 'user':
      default:
        return <UserDashboard {...props} />;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-[100] p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-950 sm:rounded-2xl shadow-2xl w-full max-w-[1440px] h-full sm:h-[92vh] flex flex-col overflow-hidden border border-slate-200/80 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#0F2D25] text-[#C9A35D] flex items-center justify-center font-heading font-bold text-base shrink-0">
              A
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate font-sans">
                  {meta.title}
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 whitespace-nowrap">
                  {rolePolicy?.label || meta.badge}
                </span>
                <span
                  className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                    effectiveKyc === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : effectiveKyc === 'Flagged'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  }`}
                >
                  <ShieldCheckIcon className="w-3.5 h-3.5" />
                  <span>KYC: {effectiveKyc}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Signed in as <span className="font-semibold text-slate-700 dark:text-slate-200">{user.username}</span> · Max {rolePolicy.maxActiveListings} listings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {(effectiveRoleKey === 'investor' || effectiveRoleKey === 'agent' || effectiveRoleKey === 'hotel_manager' || effectiveRoleKey === 'developer' || effectiveRoleKey === 'agency') && (
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
              onClick={onThemeToggle}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            </button>

            <button
              onClick={onLogout}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Sign Out
            </button>

            <button
              onClick={onClose}
              aria-label="Close dashboard"
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {(isWalletFrozen || !canPublishByPolicy || override?.status === 'Restricted' || override?.adminNote) && (
          <div className="px-4 sm:px-6 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
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
        )}

        <div className="flex-grow overflow-hidden bg-slate-50 dark:bg-slate-950">
          {renderDashboard()}
        </div>
      </div>
    </div>
  );
};

export default UserDashboardModal;