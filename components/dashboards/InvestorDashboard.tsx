import React, { useState } from 'react';
import type { User, Property, Achievement, InvestorSettings, Currency, Message } from '../../types';
import {
  DashboardIcon,
  PortfolioIcon,
  DiscoveryIcon,
  ToolsIcon,
  MarketplaceIcon,
  CommunityIcon,
  SettingsIcon,
  Bars3Icon,
  XMarkIcon,
} from '../icons/InvestorDashboardIcons';
import InvestorDashboardHome from './investor/InvestorDashboardHome';
import InvestorPortfolio from './investor/InvestorPortfolio';
import InvestorPropertyDiscovery from './investor/InvestorPropertyDiscovery';
import InvestorFinancialTools from './investor/InvestorFinancialTools';
import InvestorGlobalMarketplace from './investor/InvestorGlobalMarketplace';
import { InvestorCommunity } from './investor/InvestorCommunity';
import InvestorSettingsPage from './investor/InvestorSettings';
import { ChartBarIcon, DocumentTextIcon, ChatBubbleLeftRightIcon } from '../icons/ActionIcons';
import InvestorReturns from './investor/InvestorReturns';
import InvestorDocuments from './investor/InvestorDocuments';
import InvestorMessages from './investor/InvestorMessages';

interface InvestorDashboardProps {
  user: User;
  allProperties: Property[];
  investmentProperties: Property[];
  savedProperties: Property[];
  propertiesToCompare: Property[];
  investorSettings: InvestorSettings | null;
  investorAchievements: Achievement[];
  currency: Currency;
  messages: Message[];
  onCompareClick: () => void;
  onClose: () => void;
  onUpdateInvestorSettings: (settings: InvestorSettings) => void;
  onUpdateInvestorAchievements: (achievements: Achievement[]) => void;
  onSaveToggle: (propertyId: string) => void;
  savedPropertyIds: Set<string>;
  onOpenCalculator: (property: Property) => void;
  onOpenTourModal: (property: Property) => void;
  onFindSimilar: (property: Property) => void;
  onOpenDetailModal: (property: Property) => void;
  onOpenVRTour: (url: string) => void;
  onToggleCompare: (property: Property) => void;
}

export type InvestorView =
  | 'dashboard'
  | 'portfolio'
  | 'discovery'
  | 'tools'
  | 'marketplace'
  | 'community'
  | 'settings'
  | 'returns'
  | 'documents'
  | 'messages';

const viewMeta: Record<InvestorView, { label: string; group: string }> = {
  dashboard: { label: 'Portfolio Snapshot', group: 'Portfolio' },
  portfolio: { label: 'My Investments', group: 'Portfolio' },
  returns: { label: 'Returns & Dividends', group: 'Portfolio' },
  documents: { label: 'Contracts & Statements', group: 'Portfolio' },
  discovery: { label: 'Deal Marketplace', group: 'Acquisition' },
  tools: { label: 'Financial & ROI Lab', group: 'Acquisition' },
  marketplace: { label: 'Global Hotspots', group: 'Acquisition' },
  messages: { label: 'Developer Messages', group: 'Network' },
  community: { label: 'Investor Network', group: 'Network' },
  settings: { label: 'Preferences & API', group: 'Network' },
};

const Sidebar: React.FC<{
  activeView: InvestorView;
  setActiveView: (view: InvestorView) => void;
  closeSidebar: () => void;
  investmentCount: number;
}> = ({ activeView, setActiveView, closeSidebar, investmentCount }) => {
  const portfolioItems: { id: InvestorView; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Portfolio Snapshot', icon: DashboardIcon },
    { id: 'portfolio', label: 'My Investments', icon: PortfolioIcon },
    { id: 'returns', label: 'Returns & Dividends', icon: ChartBarIcon },
    { id: 'documents', label: 'Contracts & Vault', icon: DocumentTextIcon },
  ];

  const discoveryItems: { id: InvestorView; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'discovery', label: 'Deal Marketplace', icon: DiscoveryIcon, badge: investmentCount },
    { id: 'tools', label: 'Financial & ROI Lab', icon: ToolsIcon },
    { id: 'marketplace', label: 'Global Markets', icon: MarketplaceIcon },
  ];

  const networkItems: { id: InvestorView; label: string; icon: React.ElementType }[] = [
    { id: 'messages', label: 'Developer Messages', icon: ChatBubbleLeftRightIcon },
    { id: 'community', label: 'Investor Network', icon: CommunityIcon },
    { id: 'settings', label: 'Settings & API', icon: SettingsIcon },
  ];

  const handleItemClick = (view: InvestorView) => {
    setActiveView(view);
    closeSidebar();
  };

  const renderGroup = (title: string, items: { id: InvestorView; label: string; icon: React.ElementType; badge?: number }[]) => (
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
              onClick={() => handleItemClick(item.id)}
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
          <p className="text-[11px] uppercase tracking-widest text-amber-300/80 font-semibold">Capital Suite</p>
          <p className="text-sm font-semibold text-white mt-0.5">Investor Terminal</p>
        </div>
        <button
          onClick={closeSidebar}
          className="lg:hidden p-1.5 rounded-md text-emerald-200 hover:bg-white/10"
          aria-label="Close sidebar"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {renderGroup('Portfolio', portfolioItems)}
        {renderGroup('Acquisition & Tools', discoveryItems)}
        {renderGroup('Network & Config', networkItems)}
      </div>
    </aside>
  );
};

const InvestorDashboard: React.FC<InvestorDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<InvestorView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const currentMeta = viewMeta[activeView];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <InvestorDashboardHome {...props} onNavigate={setActiveView} />;
      case 'portfolio':
        return <InvestorPortfolio {...props} />;
      case 'returns':
        return <InvestorReturns {...props} />;
      case 'documents':
        return <InvestorDocuments {...props} />;
      case 'discovery':
        return <InvestorPropertyDiscovery {...props} />;
      case 'tools':
        return <InvestorFinancialTools currency={props.currency} />;
      case 'marketplace':
        return <InvestorGlobalMarketplace onOpenDetailModal={props.onOpenDetailModal} />;
      case 'messages':
        return <InvestorMessages {...props} />;
      case 'community':
        return <InvestorCommunity {...props} />;
      case 'settings':
        return (
          <InvestorSettingsPage
            settings={props.investorSettings}
            onUpdateSettings={props.onUpdateInvestorSettings}
            user={props.user}
          />
        );
      default:
        return <InvestorDashboardHome {...props} onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="flex h-full font-sans text-slate-800 dark:text-slate-200 relative bg-slate-50 dark:bg-slate-950">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-30 transform transition-transform duration-200 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 flex-shrink-0 h-full`}
      >
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          closeSidebar={() => setIsSidebarOpen(false)}
          investmentCount={props.investmentProperties.length}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
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
              onClick={() => setActiveView('discovery')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0F2D25] text-white hover:bg-[#173f34] transition-colors whitespace-nowrap shrink-0"
            >
              Browse Deals
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
};

export default InvestorDashboard;