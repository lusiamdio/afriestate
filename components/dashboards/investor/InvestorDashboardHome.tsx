import React, { useMemo } from 'react';
import type { Property, User, InvestorSettings, Achievement, Currency } from '../../../types';
import { ListingType } from '../../../types';
import PortfolioMap from './PortfolioMap';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { useToast } from '../../../contexts/ToastContext';
import AIPortfolioSummary from './AIPortfolioSummary';
import InvestorGamification from './InvestorGamification';
import type { InvestorView } from '../InvestorDashboard';
import {
  ArrowUpIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface InvestorDashboardHomeProps {
  user: User;
  allProperties: Property[];
  savedProperties: Property[];
  propertiesToCompare: Property[];
  investorSettings: InvestorSettings | null;
  currency: Currency;
  investorAchievements: Achievement[];
  onCompareClick: () => void;
  onClose: () => void;
  onUpdateInvestorAchievements: (achievements: Achievement[]) => void;
  onNavigate?: (view: InvestorView) => void;
}

const InvestorDashboardHome: React.FC<InvestorDashboardHomeProps> = ({
  allProperties,
  savedProperties,
  propertiesToCompare,
  onCompareClick,
  onClose,
  investorSettings,
  currency,
  investorAchievements,
  onUpdateInvestorAchievements,
  onNavigate,
}) => {
  const { formatCurrency } = useCurrency();
  const { addToast } = useToast();

  const userProperties = useMemo(() => {
    const owned = allProperties.filter((p) => p.agent.name === 'Peter Van der Merwe');
    return owned.length > 0 ? owned : allProperties.slice(0, 4);
  }, [allProperties]);

  const portfolioAnalytics = useMemo(() => {
    const totalInvestment = userProperties.reduce((sum, p) => sum + (p.purchasePrice || p.price * 0.86), 0);
    const currentValue = userProperties.reduce((sum, p) => sum + p.price, 0);
    const appreciation = totalInvestment > 0 ? ((currentValue - totalInvestment) / totalInvestment) * 100 : 0;
    const monthlyIncome = userProperties
      .filter((p) => p.listingType === ListingType.RENT)
      .reduce((sum, p) => sum + p.price, 0);

    return { totalInvestment, currentValue, appreciation, monthlyIncome };
  }, [userProperties]);

  const handleFindInvestments = () => {
    if (onNavigate) {
      onNavigate('discovery');
      return;
    }
    onClose();
    setTimeout(() => {
      document.getElementById('all-listings')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleExportReport = () => {
    const rows = [
      ['Title', 'City', 'Type', 'Acquisition Basis', 'Current Valuation', 'Status'],
      ...userProperties.map((p) => [
        `"${p.title.replace(/"/g, '""')}"`,
        `"${p.address.city}"`,
        p.propertyType,
        String(Math.round(p.purchasePrice || p.price * 0.86)),
        String(p.price),
        p.status,
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `afriestate-portfolio-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('Portfolio valuation CSV exported.', 'success');
  };

  const isWidgetVisible = (id: string) => {
    return investorSettings?.widgets.find((w) => w.id === id)?.isVisible ?? true;
  };

  const kpis = [
    isWidgetVisible('total_investment') && {
      label: 'Invested Capital',
      value: formatCurrency(portfolioAnalytics.totalInvestment, { notation: 'compact' }),
      sub: `${userProperties.length} active holdings`,
      positive: true,
      icon: BanknotesIcon,
    },
    isWidgetVisible('portfolio_value') && {
      label: 'Current Valuation',
      value: formatCurrency(portfolioAnalytics.currentValue, { notation: 'compact' }),
      sub: 'Mark-to-market basis',
      positive: true,
      icon: BuildingOffice2Icon,
    },
    isWidgetVisible('asset_appreciation') && {
      label: 'Capital Appreciation',
      value: `${portfolioAnalytics.appreciation >= 0 ? '+' : ''}${portfolioAnalytics.appreciation.toFixed(1)}%`,
      sub: portfolioAnalytics.appreciation >= 0 ? 'Net portfolio gain' : 'Market pullback',
      positive: portfolioAnalytics.appreciation >= 0,
      icon: ChartBarIcon,
    },
    isWidgetVisible('monthly_income') && {
      label: 'Monthly Rental Yield',
      value: formatCurrency(portfolioAnalytics.monthlyIncome),
      sub: `${savedProperties.length} properties on watchlist`,
      positive: true,
      icon: EyeIcon,
    },
  ].filter(Boolean) as {
    label: string;
    value: string;
    sub: string;
    positive: boolean;
    icon: React.ElementType;
  }[];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Portfolio Snapshot
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time capital allocation, net yield, and geographic asset exposure.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onCompareClick}
            disabled={propertiesToCompare.length < 2}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            Compare ({propertiesToCompare.length})
          </button>
          <button
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleFindInvestments}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0F2D25] text-white hover:bg-[#173f34] transition-colors whitespace-nowrap"
          >
            Find Investments
          </button>
        </div>
      </div>

      {/* Unified KPI Metric Bar */}
      {kpis.length > 0 && (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            kpis.length >= 4 ? 'lg:grid-cols-4' : kpis.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
          } bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden`}
        >
          {kpis.map((kpi) => (
            <div key={kpi.label} className="p-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {kpi.label}
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums tracking-tight">
                  {kpi.value}
                </p>
                <p
                  className={`text-xs mt-1.5 flex items-center gap-1 font-medium ${
                    kpi.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {kpi.positive && <ArrowUpIcon className="w-3 h-3" />}
                  <span>{kpi.sub}</span>
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {isWidgetVisible('global_map') && (
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white font-sans">
                    Geographic Asset Allocation
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select any node to inspect property location
                  </p>
                </div>
                <button
                  onClick={() => onNavigate?.('portfolio')}
                  className="text-xs font-semibold text-[#0F2D25] dark:text-emerald-400 hover:underline whitespace-nowrap"
                >
                  Open Ledger &rarr;
                </button>
              </div>
              <PortfolioMap ownedProperties={userProperties} watchlistProperties={savedProperties} />
            </div>
          )}
          <AIPortfolioSummary userProperties={userProperties} />
        </div>

        <div className="lg:col-span-1">
          <InvestorGamification
            investorAchievements={investorAchievements}
            userProperties={userProperties}
            onUpdateInvestorAchievements={onUpdateInvestorAchievements}
            currency={currency}
          />
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboardHome;