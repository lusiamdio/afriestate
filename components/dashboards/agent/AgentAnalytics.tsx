import React, { useMemo } from 'react';
import type { Property, TourRequest, User } from '../../../types';
import { ListingType } from '../../../types';
import { DownloadIcon } from '../../icons/AgentDashboardIcons';
import { ArrowUpIcon, ArrowDownIcon, CpuChipIcon } from '../../icons/ActionIcons';
import { useToast } from '../../../contexts/ToastContext';

interface AgentAnalyticsProps {
  user: User;
  allProperties: Property[];
  receivedInquiries: TourRequest[];
  onOpenAIImprovementModal: (property: Property) => void;
}

const PerformanceChart: React.FC = () => {
  const data = useMemo(
    () => [
      { day: 'Mon', views: 120, inquiries: 5 },
      { day: 'Tue', views: 150, inquiries: 8 },
      { day: 'Wed', views: 130, inquiries: 7 },
      { day: 'Thu', views: 180, inquiries: 10 },
      { day: 'Fri', views: 220, inquiries: 15 },
      { day: 'Sat', views: 300, inquiries: 20 },
      { day: 'Sun', views: 250, inquiries: 18 },
    ],
    []
  );

  const maxViews = Math.max(...data.map((d) => d.views), 1);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white font-sans">Performance Over Time</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">7-day traffic & lead velocity</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#0F2D25] dark:bg-emerald-500 inline-block" /> Views
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#C9A35D] inline-block" /> Inquiries
          </span>
        </div>
      </div>

      <div className="h-56 flex items-end gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 pt-4">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-mono tabular-nums px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {d.views} views · {d.inquiries} inq
            </div>
            <div className="flex items-end justify-center h-full w-full gap-1.5">
              <div
                className="w-3.5 sm:w-4 bg-[#0F2D25] dark:bg-emerald-500 rounded-t transition-opacity group-hover:opacity-85"
                style={{ height: `${Math.max(10, (d.views / maxViews) * 100)}%` }}
              />
              <div
                className="w-3.5 sm:w-4 bg-[#C9A35D] rounded-t transition-opacity group-hover:opacity-85"
                style={{ height: `${Math.max(8, ((d.inquiries * 6) / maxViews) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AgentAnalytics: React.FC<AgentAnalyticsProps> = ({
  user,
  allProperties,
  receivedInquiries,
  onOpenAIImprovementModal,
}) => {
  const { addToast } = useToast();
  const userProperties = useMemo(
    () => allProperties.filter((p) => p.agent.name === user.username),
    [allProperties, user.username]
  );

  const analytics = useMemo(() => {
    const totalViews = userProperties.reduce((sum, p) => sum + p.views, 0);
    const totalInquiries = receivedInquiries.length;
    const conversionRate = totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0;
    const sales = Math.floor(totalInquiries * 0.1);

    const leadDemographics = {
      byLocation: receivedInquiries.reduce((acc: Record<string, number>, inquiry) => {
        const prop = allProperties.find((p) => p.id === inquiry.propertyId);
        if (prop) {
          const city = prop.address.city;
          acc[city] = (acc[city] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      byBudget: receivedInquiries.reduce((acc: Record<string, number>, inquiry) => {
        const prop = allProperties.find((p) => p.id === inquiry.propertyId);
        if (prop) {
          const price = prop.listingType === ListingType.SALE ? prop.price : prop.price * 40;
          let bracket = '1M+';
          if (price < 150000) bracket = '<150k';
          else if (price < 500000) bracket = '150k-500k';
          else if (price < 1000000) bracket = '500k-1M';
          acc[bracket] = (acc[bracket] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
    };

    const listingPerformance = userProperties
      .map((p) => {
        const inquiryCount = receivedInquiries.filter((i) => i.propertyId === p.id).length;
        return {
          ...p,
          inquiryCount,
          score: p.views + inquiryCount * 10 + p.saves * 2,
        };
      })
      .sort((a, b) => b.score - a.score);

    return {
      totalViews,
      totalInquiries,
      conversionRate,
      sales,
      leadDemographics,
      topPerforming: listingPerformance.slice(0, 3),
      underperforming: listingPerformance.length > 3 ? listingPerformance.slice(-3).reverse() : [],
    };
  }, [userProperties, receivedInquiries, allProperties]);

  const budgetBrackets = Object.keys(analytics.leadDemographics.byBudget).sort();

  const handleExportReport = () => {
    const rows = [
      ['Property', 'City', 'Views', 'Saves', 'Status'],
      ...userProperties.map((p) => [
        `"${p.title.replace(/"/g, '""')}"`,
        `"${p.address.city}"`,
        String(p.views),
        String(p.saves),
        p.status,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `afriestate-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('Analytics report exported (CSV).', 'success');
  };

  const kpis = [
    { title: 'Total Views', value: analytics.totalViews.toLocaleString(), trend: '+15%', up: true },
    { title: 'Total Inquiries', value: analytics.totalInquiries.toLocaleString(), trend: '+8%', up: true },
    { title: 'Conversion Rate', value: `${analytics.conversionRate.toFixed(1)}%`, trend: '-0.5%', up: false },
    { title: 'Est. Closings', value: analytics.sales.toLocaleString(), trend: '+2', up: true },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Analytics & Funnel
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor listing velocity, buyer demographics, and optimization opportunities.
          </p>
        </div>
        <button
          onClick={handleExportReport}
          className="px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
        >
          <DownloadIcon className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Unified KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
        {kpis.map((item) => (
          <div key={item.title} className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {item.title}
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
              {item.value}
            </p>
            <p
              className={`text-xs mt-1.5 inline-flex items-center gap-1 font-medium ${
                item.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
              }`}
            >
              {item.up ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
              {item.trend} vs prior period
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PerformanceChart />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-5 font-sans">Conversion Funnel</h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-600 dark:text-slate-300">Listing Views</span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                  {analytics.totalViews.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-[#0F2D25] dark:bg-emerald-500 h-2 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-600 dark:text-slate-300">Buyer Inquiries</span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                  {analytics.totalInquiries.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-[#C9A35D] h-2 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(8, analytics.conversionRate))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-600 dark:text-slate-300">Estimated Sales</span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                  {analytics.sales.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{
                    width: `${analytics.totalViews > 0 ? Math.min(100, Math.max(4, (analytics.sales / analytics.totalViews) * 100)) : 4}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 font-sans">Leads by City</h3>
          {Object.entries(analytics.leadDemographics.byLocation).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(analytics.leadDemographics.byLocation).map(([city, count]) => (
                <div key={city} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">{count}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{city}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">No geographic inquiry data recorded yet.</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 font-sans">Leads by Budget Bracket</h3>
          {budgetBrackets.length > 0 ? (
            <div className="flex items-end gap-3 h-28 pt-2">
              {budgetBrackets.map((bracket) => {
                const count = analytics.leadDemographics.byBudget[bracket] || 0;
                const maxVal = Math.max(1, ...Object.values(analytics.leadDemographics.byBudget).map(Number));
                return (
                  <div key={bracket} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                    <span className="text-[11px] font-mono tabular-nums text-slate-500">{count}</span>
                    <div
                      className="w-full bg-[#0F2D25] dark:bg-emerald-500 rounded-t transition-all"
                      style={{ height: `${Math.max(10, (count / maxVal) * 100)}%` }}
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{bracket}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">Budget data appears as inquiries arrive.</p>
          )}
        </div>
      </div>

      {/* Listing Optimization Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 font-sans">Top Performing Listings</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {analytics.topPerforming.map((p) => (
              <div key={p.id} className="py-2.5 flex justify-between items-center gap-3 text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{p.title}</span>
                <span className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                  Index {p.score.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 font-sans">Optimization Candidates</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {analytics.underperforming.length > 0 ? (
              analytics.underperforming.map((p) => (
                <div key={p.id} className="py-2.5 flex justify-between items-center gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{p.title}</p>
                    <p className="text-[11px] font-mono tabular-nums text-slate-400">Index {p.score.toFixed(0)}</p>
                  </div>
                  <button
                    onClick={() => onOpenAIImprovementModal(p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0F2D25] text-white hover:bg-[#173f34] inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                  >
                    <CpuChipIcon className="w-3.5 h-3.5 text-[#C9A35D]" />
                    Optimize
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">All active listings are performing within target bounds.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
