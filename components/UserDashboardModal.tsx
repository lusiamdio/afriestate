import React from 'react';
import type { Property, TourRequest, User, SearchFilters, Message, CalendarEvent, AgentProfile, Review, Lead, Achievement, InvestorSettings, Currency, InvestmentRequest } from '../types';
import { CloseIcon } from './icons/NavIcons';
import UserDashboard from './dashboards/UserDashboard';
import AgentDashboard from './dashboards/AgentDashboard';
import InvestorDashboard from './dashboards/InvestorDashboard';
import { MoonIcon, SunIcon } from './icons/AgentDashboardIcons';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { CURRENCY_SYMBOLS } from '../constants';

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

  if (!isOpen) return null;

  const meta = roleMeta[user.role] || roleMeta.user;

  const renderDashboard = () => {
    switch (user.role) {
      case 'agent':
        return (
          <AgentDashboard
            {...props}
            achievements={props.agentAchievements}
            onUpdateAchievements={props.onUpdateAgentAchievements}
          />
        );
      case 'investor':
        return <InvestorDashboard {...props} />;
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
                  {meta.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Signed in as <span className="font-semibold text-slate-700 dark:text-slate-200">{user.username}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {(user.role === 'investor' || user.role === 'agent') && (
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

        <div className="flex-grow overflow-hidden bg-slate-50 dark:bg-slate-950">
          {renderDashboard()}
        </div>
      </div>
    </div>
  );
};

export default UserDashboardModal;