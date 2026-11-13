import React, { useMemo } from 'react';
import type { Property, TourRequest, User, Achievement, Review } from '../../../types';
import { PropertyStatus } from '../../../types';
import { ChartBarIcon, EyeIcon, BellIcon, ArrowUpIcon, CalendarIcon, ChatBubbleLeftRightIcon } from '../../icons/ActionIcons';
import { PlusIcon } from '@heroicons/react/24/outline';
import { ListingsIcon } from '../../icons/AgentDashboardIcons';
import AgentGamification from './AgentGamification';
import type { AgentView } from '../AgentDashboard';

interface AgentDashboardHomeProps {
  user: User;
  allProperties: Property[];
  receivedInquiries: TourRequest[];
  onListPropertyClick: () => void;
  achievements: Achievement[];
  agentReviews: Review[];
  onUpdateAchievements: (achievements: Achievement[]) => void;
  onNavigate?: (view: AgentView) => void;
}

const PerformanceChart: React.FC<{ data: { label: string; views: number; inquiries: number }[] }> = ({ data }) => {
  const maxViews = Math.max(...data.map((d) => d.views), 1);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white font-sans">Weekly Listing Traffic</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Daily impressions vs. qualified buyer inquiries</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#0F2D25] dark:bg-emerald-500 inline-block" />
            Views
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#C9A35D] inline-block" />
            Inquiries
          </span>
        </div>
      </div>

      <div className="h-56 flex items-end gap-2 sm:gap-4 border-b border-slate-200 dark:border-slate-800 pb-3 pt-4">
        {data.map((d, i) => {
          const viewHeight = Math.max(12, Math.round((d.views / maxViews) * 100));
          const inqHeight = Math.max(8, Math.round(((d.inquiries * 4) / maxViews) * 100));
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group relative">
              <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute -top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-mono tabular-nums px-2 py-1 rounded shadow-md whitespace-nowrap z-10">
                {d.views} views · {d.inquiries} inq
              </div>
              <div className="flex items-end justify-center h-full w-full gap-1.5">
                <div
                  className="w-3 sm:w-4 bg-[#0F2D25] dark:bg-emerald-500 rounded-t transition-all group-hover:opacity-85"
                  style={{ height: `${viewHeight}%` }}
                />
                <div
                  className="w-3 sm:w-4 bg-[#C9A35D] rounded-t transition-all group-hover:opacity-85"
                  style={{ height: `${inqHeight}%` }}
                />
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AgentDashboardHome: React.FC<AgentDashboardHomeProps> = ({
  user,
  allProperties,
  receivedInquiries,
  onListPropertyClick,
  achievements,
  agentReviews,
  onNavigate,
}) => {
  const userProperties = useMemo(() => {
    return allProperties.filter((p) => p.agent.name === user.username);
  }, [allProperties, user.username]);

  const stats = useMemo(() => {
    const activeListings = userProperties.filter((p) => p.status === PropertyStatus.ACTIVE).length;
    const pendingApprovals = userProperties.filter((p) => p.status === PropertyStatus.PENDING).length;
    const totalViews = userProperties.reduce((sum, p) => sum + (p.views || 0), 0);
    const viewsThisWeek = Math.floor(totalViews / 4);
    const leadsThisWeek = receivedInquiries.length;
    return { activeListings, pendingApprovals, viewsThisWeek, leadsThisWeek };
  }, [userProperties, receivedInquiries]);

  const chartData = [
    { label: 'Mon', views: 34, inquiries: 2 },
    { label: 'Tue', views: 45, inquiries: 3 },
    { label: 'Wed', views: 52, inquiries: 5 },
    { label: 'Thu', views: 48, inquiries: 4 },
    { label: 'Fri', views: 68, inquiries: 7 },
    { label: 'Sat', views: 85, inquiries: 10 },
    { label: 'Sun', views: 76, inquiries: 8 },
  ];

  const notifications = [
    { type: 'Urgent', text: 'New tour inquiry on Waterfront Penthouse awaits reply.', time: '5m ago' },
    { type: 'Pending', text: `${stats.pendingApprovals || 1} listing(s) queued for verification review.`, time: '2h ago' },
    { type: 'Info', text: 'Weekly portfolio impressions increased by 12.5%.', time: '4h ago' },
  ];

  const kpis = [
    {
      label: 'Active Listings',
      value: stats.activeListings.toString(),
      delta: 'Live on marketplace',
      up: true,
      icon: ListingsIcon,
    },
    {
      label: 'Pending Approval',
      value: stats.pendingApprovals.toString(),
      delta: 'Awaiting compliance',
      up: false,
      icon: BellIcon,
    },
    {
      label: 'Weekly Views',
      value: stats.viewsThisWeek.toLocaleString(),
      delta: '+12.5% vs last wk',
      up: true,
      icon: EyeIcon,
    },
    {
      label: 'Qualified Leads',
      value: stats.leadsThisWeek.toString(),
      delta: '+8.2% conversion',
      up: true,
      icon: ChartBarIcon,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user.username.split(' ')[0]}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time brokerage activity, inquiries, and inventory health.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate?.('leads')}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            Review Leads ({receivedInquiries.length})
          </button>
          <button
            onClick={onListPropertyClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0F2D25] text-white hover:bg-[#173f34] transition-colors whitespace-nowrap"
          >
            <PlusIcon className="w-4 h-4 text-[#C9A35D]" />
            Add Property
          </button>
        </div>
      </div>

      {/* Unified KPI Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="p-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {kpi.label}
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums tracking-tight">
                {kpi.value}
              </p>
              <p className={`text-xs mt-1.5 flex items-center gap-1 font-medium ${kpi.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {kpi.up && <ArrowUpIcon className="w-3 h-3" />}
                <span>{kpi.delta}</span>
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
              <kpi.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Analytics + Action Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PerformanceChart data={chartData} />
          <AgentGamification
            achievements={achievements}
            userProperties={userProperties}
            agentReviews={agentReviews}
          />
        </div>

        <div className="space-y-6">
          {/* Quick Workflows */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3 font-sans">
              Quick Workflows
            </h3>
            <div className="space-y-2">
              <button
                onClick={onListPropertyClick}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <PlusIcon className="w-4 h-4 text-emerald-600" />
                  Create New Property Listing
                </span>
                <span className="text-slate-400">&rarr;</span>
              </button>
              <button
                onClick={() => onNavigate?.('calendar')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <CalendarIcon className="w-4 h-4 text-amber-600" />
                  Schedule Private Viewing
                </span>
                <span className="text-slate-400">&rarr;</span>
              </button>
              <button
                onClick={() => onNavigate?.('leads')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-600" />
                  Respond to Open Leads
                </span>
                <span className="text-slate-400">&rarr;</span>
              </button>
            </div>
          </div>

          {/* Activity Alerts */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3 font-sans">
              Activity Feed
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((n, i) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      n.type === 'Urgent'
                        ? 'bg-red-500'
                        : n.type === 'Pending'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {n.type}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {n.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboardHome;
