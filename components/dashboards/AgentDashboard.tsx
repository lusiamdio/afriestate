import React, { useState } from 'react';
import type { Property, TourRequest, User, Message, CalendarEvent, AgentProfile, Review, Lead, Achievement, InvestmentRequest } from '../../types';
import AgentDashboardHome from './agent/AgentDashboardHome';
import AgentListingsManagement from './agent/AgentListingsManagement';
import AgentCalendar from './agent/AgentCalendar';
import { AgentAnalytics } from './agent/AgentAnalytics';
import AgentProfilePage from './agent/AgentProfilePage';
import AgentSupportPage from './agent/AgentSupportPage';
import AgentLeadsManagement from './agent/AgentLeadsManagement';
import AgentAITools from './agent/AgentAITools';
import AgentTeamHub from './agent/AgentTeamHub';
import {
  DashboardIcon,
  ListingsIcon,
  LeadsIcon,
  AnalyticsIcon,
  CalendarIcon as NavCalendarIcon,
  ProfileIcon,
  SupportIcon,
  SparklesIcon,
  HandshakeIcon,
  BanknotesIcon,
  CreditCardIcon,
} from '../icons/AgentDashboardIcons';
import { Bars3Icon, XMarkIcon } from '../icons/InvestorDashboardIcons';
import AgentInvestmentRequests from './agent/AgentInvestmentRequests';
import AgentEarnings from './agent/AgentEarnings';
import AgentBilling from './agent/AgentBilling';
import { ChatBubbleLeftRightIcon } from '../icons/ActionIcons';
import { PlusIcon } from '@heroicons/react/24/outline';
import AgentMessages from './agent/AgentMessages';

interface AgentDashboardProps {
  user: User;
  allProperties: Property[];
  receivedInquiries: TourRequest[];
  messages: Message[];
  calendarEvents: CalendarEvent[];
  agentProfile: AgentProfile | null;
  agentReviews: Review[];
  leads: Lead[];
  achievements: Achievement[];
  investmentRequests: InvestmentRequest[];
  onEditProperty: (property: Property) => void;
  onDeleteProperty: (propertyId: string) => void;
  onDraftReply: (inquiry: TourRequest) => void;
  onListPropertyClick: () => void;
  onAddEvent: (eventData: Omit<CalendarEvent, 'id'>) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onOpenAIImprovementModal: (property: Property) => void;
  onUpdateAgentProfile: (profile: AgentProfile) => void;
  onUpdateAchievements: (achievements: Achievement[]) => void;
}

export type AgentView =
  | 'dashboard'
  | 'listings'
  | 'leads'
  | 'analytics'
  | 'calendar'
  | 'profile'
  | 'support'
  | 'aiTools'
  | 'teamHub'
  | 'investmentRequests'
  | 'earnings'
  | 'billing'
  | 'messages';

const viewMeta: Record<AgentView, { label: string; group: string }> = {
  dashboard: { label: 'Overview', group: 'Workspace' },
  listings: { label: 'Listings Inventory', group: 'Workspace' },
  leads: { label: 'Leads & Inquiries', group: 'Workspace' },
  messages: { label: 'Client Messages', group: 'Workspace' },
  investmentRequests: { label: 'Investment Briefs', group: 'Workspace' },
  analytics: { label: 'Analytics & Funnel', group: 'Performance' },
  earnings: { label: 'Commissions & Payouts', group: 'Performance' },
  calendar: { label: 'Schedule & Tours', group: 'Performance' },
  aiTools: { label: 'AI Studio', group: 'Performance' },
  profile: { label: 'Agent Profile', group: 'Agency' },
  billing: { label: 'Plan & Billing', group: 'Agency' },
  teamHub: { label: 'Team Collaboration', group: 'Agency' },
  support: { label: 'Help & Knowledge Base', group: 'Agency' },
};

const Sidebar: React.FC<{
  activeView: AgentView;
  setActiveView: (view: AgentView) => void;
  onCloseMobile: () => void;
  leadCount: number;
  messageCount: number;
}> = ({ activeView, setActiveView, onCloseMobile, leadCount, messageCount }) => {
  const workspaceItems: { id: AgentView; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Overview', icon: DashboardIcon },
    { id: 'listings', label: 'Listings', icon: ListingsIcon },
    { id: 'leads', label: 'Leads & Inquiries', icon: LeadsIcon, badge: leadCount },
    { id: 'messages', label: 'Messages', icon: ChatBubbleLeftRightIcon, badge: messageCount },
    { id: 'investmentRequests', label: 'Investor Briefs', icon: HandshakeIcon },
  ];

  const opsItems: { id: AgentView; label: string; icon: React.ElementType }[] = [
    { id: 'analytics', label: 'Analytics', icon: AnalyticsIcon },
    { id: 'earnings', label: 'Earnings', icon: BanknotesIcon },
    { id: 'calendar', label: 'Calendar', icon: NavCalendarIcon },
    { id: 'aiTools', label: 'AI Studio', icon: SparklesIcon },
  ];

  const agencyItems: { id: AgentView; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile & Brand', icon: ProfileIcon },
    { id: 'billing', label: 'Plan & Billing', icon: CreditCardIcon },
    { id: 'teamHub', label: 'Team Hub', icon: LeadsIcon },
    { id: 'support', label: 'Support & Docs', icon: SupportIcon },
  ];

  const handleSelect = (view: AgentView) => {
    setActiveView(view);
    onCloseMobile();
  };

  const renderGroup = (title: string, items: { id: AgentView; label: string; icon: React.ElementType; badge?: number }[]) => (
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
              onClick={() => handleSelect(item.id)}
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
                <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums ${isActive ? 'bg-amber-400/20 text-amber-200' : 'bg-white/10 text-emerald-200'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <aside className="w-64 bg-[#0B1F1A] text-white flex flex-col h-full border-r border-emerald-950 select-none">
      <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-amber-300/80 font-semibold">Agent Console</p>
          <p className="text-sm font-semibold text-white mt-0.5">Brokerage CRM</p>
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-md text-emerald-200 hover:bg-white/10"
          aria-label="Close sidebar"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {renderGroup('Workspace', workspaceItems)}
        {renderGroup('Performance & Ops', opsItems)}
        {renderGroup('Agency', agencyItems)}
      </div>
    </aside>
  );
};

const AgentDashboard: React.FC<AgentDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<AgentView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const currentMeta = viewMeta[activeView];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <AgentDashboardHome {...props} onNavigate={setActiveView} />;
      case 'listings':
        return <AgentListingsManagement {...props} />;
      case 'analytics':
        return <AgentAnalytics {...props} />;
      case 'calendar':
        return <AgentCalendar {...props} />;
      case 'profile':
        return <AgentProfilePage {...props} />;
      case 'support':
        return <AgentSupportPage user={props.user} />;
      case 'leads':
        return <AgentLeadsManagement leads={props.leads} />;
      case 'messages':
        return <AgentMessages {...props} />;
      case 'aiTools':
        return <AgentAITools />;
      case 'teamHub':
        return <AgentTeamHub />;
      case 'investmentRequests':
        return <AgentInvestmentRequests investmentRequests={props.investmentRequests} />;
      case 'earnings':
        return <AgentEarnings {...props} />;
      case 'billing':
        return <AgentBilling />;
      default:
        return <AgentDashboardHome {...props} onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="flex h-full font-sans relative bg-slate-50 dark:bg-slate-950">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-30 transform transition-transform duration-200 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 flex-shrink-0 h-full`}
      >
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          onCloseMobile={() => setIsSidebarOpen(false)}
          leadCount={props.leads.length}
          messageCount={props.messages.length}
        />
      </div>

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Contextual Workspace Sub-Header */}
        <div className="h-14 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
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
            <button
              onClick={props.onListPropertyClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#0F2D25] text-white hover:bg-[#173f34] transition-colors whitespace-nowrap shrink-0"
            >
              <PlusIcon className="w-4 h-4 text-[#C9A35D]" />
              New Listing
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AgentDashboard;