import React, { useEffect, useMemo, useState } from 'react';
import type { Currency, Notification, Property, User } from '../../../types';
import {
  doesPropertyMatchAlertRule,
  evaluatePropertyAgainstInvestmentAlerts,
  getEffectivePropertyRoi,
  getInvestmentAlertRules,
  getInvestmentAlertTriggers,
  inferPropertyRegion,
  saveInvestmentAlertRules,
  type InvestmentAlertRule,
  type InvestmentAlertTriggerEvent,
  type InvestmentListingScope,
  type InvestmentRegionScope,
} from '../../../lib/investmentAlerts';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { useToast } from '../../../contexts/ToastContext';
import {
  BellAlertIcon,
  CheckCircleIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface InvestorAlertsPanelProps {
  user: User;
  allProperties: Property[];
  currency: Currency;
  onOpenDetailModal: (property: Property) => void;
  onNotificationsGenerated?: (notifications: Notification[]) => void;
}

const REGION_OPTIONS: InvestmentRegionScope[] = [
  'All Regions',
  'Southern Africa',
  'West Africa',
  'East Africa',
  'North Africa',
  'Central Africa',
];

const LISTING_SCOPE_OPTIONS: { value: InvestmentListingScope; label: string }[] = [
  { value: 'For Investment', label: 'Investment Deals Only' },
  { value: 'All', label: 'All Qualified Assets' },
  { value: 'For Sale', label: 'Direct Acquisitions (Sale)' },
  { value: 'For Rent', label: 'Yielding Rentals' },
];

export const InvestorAlertsPanel: React.FC<InvestorAlertsPanelProps> = ({
  user,
  allProperties,
  onOpenDetailModal,
  onNotificationsGenerated,
}) => {
  const { formatCurrency } = useCurrency();
  const { addToast } = useToast();

  const [rules, setRules] = useState<InvestmentAlertRule[]>(() => getInvestmentAlertRules(user.username));
  const [triggers, setTriggers] = useState<InvestmentAlertTriggerEvent[]>(() => getInvestmentAlertTriggers());

  // New Subscription Form State
  const [label, setLabel] = useState('');
  const [region, setRegion] = useState<InvestmentRegionScope>('East Africa');
  const [minRoiPct, setMinRoiPct] = useState<number>(12);
  const [listingScope, setListingScope] = useState<InvestmentListingScope>('For Investment');

  useEffect(() => {
    setRules(getInvestmentAlertRules(user.username));
    setTriggers(getInvestmentAlertTriggers());
  }, [user.username, allProperties.length]);

  const draftRulePreview: InvestmentAlertRule = useMemo(
    () => ({
      id: 'preview',
      subscriberUsername: user.username,
      label: label.trim() || `${region} · >= ${minRoiPct}% ROI`,
      region,
      minRoiPct,
      listingScope,
      isActive: true,
      createdAt: Date.now(),
      matchCount: 0,
    }),
    [user.username, label, region, minRoiPct, listingScope]
  );

  const liveInventoryMatchesForDraft = useMemo(() => {
    return allProperties.filter((p) => doesPropertyMatchAlertRule(p, draftRulePreview));
  }, [allProperties, draftRulePreview]);

  const activeRuleCount = useMemo(() => rules.filter((r) => r.isActive).length, [rules]);

  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedRoi = Math.max(1, Math.min(45, Number(minRoiPct) || 10));
    const computedLabel =
      label.trim() || `${region} · ${listingScope === 'All' ? 'All Assets' : listingScope} (>= ${normalizedRoi}% ROI)`;

    const newRule: InvestmentAlertRule = {
      id: `inv-rule-${Date.now()}`,
      subscriberUsername: user.username,
      label: computedLabel,
      region,
      minRoiPct: normalizedRoi,
      listingScope,
      isActive: true,
      createdAt: Date.now(),
      matchCount: 0,
    };

    const nextRules = [newRule, ...rules];
    saveInvestmentAlertRules(nextRules);
    setRules(nextRules);
    setLabel('');

    addToast(
      `Subscribed to real-time alerts for ${region} (>= ${normalizedRoi}% ROI). Automated dispatch active.`,
      'success'
    );
  };

  const handleToggleRule = (ruleId: string) => {
    const nextRules = rules.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r));
    saveInvestmentAlertRules(nextRules);
    setRules(nextRules);
    const updated = nextRules.find((r) => r.id === ruleId);
    if (updated) {
      addToast(`Alert "${updated.label}" ${updated.isActive ? 'activated' : 'paused'}.`, 'info');
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    const nextRules = rules.filter((r) => r.id !== ruleId);
    saveInvestmentAlertRules(nextRules);
    setRules(nextRules);
    addToast('Investment alert subscription removed.', 'info');
  };

  const handleScanExistingInventory = () => {
    let generatedNotifications: Notification[] = [];
    let matchedCount = 0;

    for (const property of allProperties) {
      const result = evaluatePropertyAgainstInvestmentAlerts(property);
      if (result.notifications.length > 0) {
        generatedNotifications = [...result.notifications, ...generatedNotifications];
        matchedCount += result.notifications.length;
      }
    }

    setRules(getInvestmentAlertRules(user.username));
    setTriggers(getInvestmentAlertTriggers());

    if (matchedCount > 0) {
      onNotificationsGenerated?.(generatedNotifications);
      addToast(
        `${matchedCount} new matching investment alert${matchedCount === 1 ? '' : 's'} dispatched to your Notification Bell.`,
        'success'
      );
    } else {
      addToast('All currently matching assets have already been dispatched. New qualifying listings will auto-notify.', 'info');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            Real-Time Deal Surveillance
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Investment Alerts &amp; Auto-Notifications
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Subscribe to ROI and regional criteria. Whenever a matching asset is published on AfriEstate, an automated notification fires instantly.
          </p>
        </div>

        <button
          type="button"
          onClick={handleScanExistingInventory}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F2D25] hover:bg-[#173f34] text-white text-xs font-semibold transition-colors shrink-0"
        >
          <SparklesIcon className="w-4 h-4 text-[#C9A35D]" />
          Scan Live Inventory Now
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
        <div className="p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Active Subscriptions
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-2">
            {activeRuleCount}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            Monitoring new marketplace publications
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Dispatched Notifications
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-2">
            {triggers.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Delivered via header bell &amp; toast feed
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Highest Rule ROI Target
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-2">
            {rules.length > 0 ? `${Math.max(...rules.map((r) => r.minRoiPct))}%` : '—'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Annualized yield / target return floor
          </p>
        </div>
      </div>

      {/* Main Split: Subscription Form + Active Rules & Trigger History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Rule Builder */}
        <form
          onSubmit={handleCreateSubscription}
          className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Create Real-Time Alert
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Auto-triggers when matching listings publish
              </p>
            </div>
            <BellAlertIcon className="w-5 h-5 text-[#C9A35D]" />
          </div>

          <div>
            <label htmlFor="alert-label" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Alert Label (Optional)
            </label>
            <input
              id="alert-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`${region} · >= ${minRoiPct}% ROI`}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0F2D25]"
            />
          </div>

          <div>
            <label htmlFor="alert-region" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Region
            </label>
            <select
              id="alert-region"
              value={region}
              onChange={(e) => setRegion(e.target.value as InvestmentRegionScope)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0F2D25]"
            >
              {REGION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="alert-roi" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Minimum Annual ROI / Yield Threshold
              </label>
              <span className="text-sm font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {minRoiPct}%+
              </span>
            </div>
            <input
              id="alert-roi"
              type="range"
              min={5}
              max={30}
              step={0.5}
              value={minRoiPct}
              onChange={(e) => setMinRoiPct(Number(e.target.value))}
              className="w-full accent-[#0F2D25]"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
              <span>5% Core</span>
              <span>12% Growth</span>
              <span>20%+ Opportunistic</span>
              <span>30%</span>
            </div>
          </div>

          <div>
            <label htmlFor="alert-scope" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Asset Category Scope
            </label>
            <select
              id="alert-scope"
              value={listingScope}
              onChange={(e) => setListingScope(e.target.value as InvestmentListingScope)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0F2D25]"
            >
              {LISTING_SCOPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-300">
              Existing live deals matching criteria
            </span>
            <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
              {liveInventoryMatchesForDraft.length} listings
            </span>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F2D25] hover:bg-[#173f34] text-white text-xs font-semibold transition-colors"
          >
            <PlusIcon className="w-4 h-4 text-[#C9A35D]" />
            Subscribe to Real-Time Alert
          </button>
        </form>

        {/* Active Rules + Automated Dispatch Log */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Subscribed Alert Rules ({rules.length})
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Real-time publish listener armed
              </span>
            </div>

            {rules.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                No active alert rules yet. Create a subscription on the left to automate deal monitoring.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {rules.map((rule) => (
                  <div key={rule.id} className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            rule.isActive
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {rule.isActive ? 'Active' : 'Paused'}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                          {rule.region} · &ge;{rule.minRoiPct}% ROI
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                        {rule.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Scope: {rule.listingScope} · {rule.matchCount} alert{rule.matchCount === 1 ? '' : 's'} triggered
                        {rule.lastTriggeredAt
                          ? ` · Last match ${new Date(rule.lastTriggeredAt).toLocaleDateString()}`
                          : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        {rule.isActive ? (
                          <>
                            <PauseCircleIcon className="w-4 h-4 text-amber-600" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <PlayCircleIcon className="w-4 h-4 text-emerald-600" />
                            <span>Resume</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900 transition-colors"
                        aria-label={`Delete alert ${rule.label}`}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dispatched Alert Feed */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Automated Alert Dispatch Log
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Properties automatically matched upon publication
                </p>
              </div>
              <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            {triggers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <p>No automated matches recorded yet in this session.</p>
                <p>
                  Click <strong>Scan Live Inventory Now</strong> above or publish a qualifying investment listing to trigger instant alerts.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-96 overflow-y-auto">
                {triggers.map((trg) => {
                  const matchedProp = allProperties.find((p) => p.id === trg.propertyId);
                  return (
                    <div key={trg.id} className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                          {trg.effectiveRoi}% ROI · {trg.region} · {formatCurrency(trg.price)}
                        </p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate mt-0.5">
                          {trg.propertyTitle}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Matched rule: {trg.ruleLabel} · {new Date(trg.triggeredAt).toLocaleString()}
                        </p>
                      </div>
                      {matchedProp && (
                        <button
                          type="button"
                          onClick={() => onOpenDetailModal(matchedProp)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#0F2D25] hover:text-[#0F2D25] dark:hover:text-emerald-400 transition-colors shrink-0"
                        >
                          <span>Inspect Asset</span>
                          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Preview of Currently Matching Properties */}
      {liveInventoryMatchesForDraft.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Current Market Matches for &ldquo;{region} &ge; {minRoiPct}% ROI&rdquo;
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Showing top qualifying assets already live on the AfriEstate directory
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {liveInventoryMatchesForDraft.slice(0, 3).map((prop) => (
              <button
                key={prop.id}
                type="button"
                onClick={() => onOpenDetailModal(prop)}
                className="text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#0F2D25] dark:hover:border-emerald-500 transition-colors space-y-2 bg-slate-50/50 dark:bg-slate-800/30"
              >
                <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {getEffectivePropertyRoi(prop)}% ROI
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {inferPropertyRegion(prop)}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                  {prop.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {prop.address.city} · {formatCurrency(prop.price)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestorAlertsPanel;
