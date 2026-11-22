import React, { useMemo } from 'react';
import { ChartBarIcon, ArrowTrendingUpIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import type { Property } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';

interface MarketPriceInsightCardProps {
  properties: Property[];
  locationLabel?: string;
  enquiryCounts?: Record<string, number>;
}

const MarketPriceInsightCard: React.FC<MarketPriceInsightCardProps> = ({
  properties,
  locationLabel,
  enquiryCounts = {},
}) => {
  const { formatCurrency } = useCurrency();

  const stats = useMemo(() => {
    if (!properties || properties.length === 0) return null;

    const prices = properties.map((p) => p.price).filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
    if (prices.length === 0) return null;

    const count = prices.length;
    const min = prices[0];
    const max = prices[count - 1];
    const sum = prices.reduce((acc, val) => acc + val, 0);
    const average = sum / count;

    const mid = Math.floor(count / 2);
    const median = count % 2 !== 0 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;

    const p25 = prices[Math.floor((count - 1) * 0.25)];
    const p75 = prices[Math.floor((count - 1) * 0.75)];

    // Three dynamic brackets spanning the active distribution
    const span = Math.max(1, max - min);
    const cut1 = min + span / 3;
    const cut2 = min + (span * 2) / 3;

    let entryCount = 0;
    let midTierCount = 0;
    let primeCount = 0;

    if (span <= 1) {
      midTierCount = count;
    } else {
      for (const p of prices) {
        if (p <= cut1) entryCount++;
        else if (p <= cut2) midTierCount++;
        else primeCount++;
      }
    }

    const entryPct = Math.round((entryCount / count) * 100);
    const midPct = Math.round((midTierCount / count) * 100);
    const primePct = Math.max(0, 100 - entryPct - midPct);

    const verifiedCount = properties.filter((p) => p.verified).length;
    const verifiedPct = Math.round((verifiedCount / properties.length) * 100);

    const totalEnquiries = properties.reduce((acc, p) => acc + (enquiryCounts[p.id] || 0), 0);
    const avgEnquiries = (totalEnquiries / properties.length).toFixed(1);

    const skewDiffPct = median > 0 ? Math.round(((average - median) / median) * 100) : 0;
    let insightNote = '';
    if (count === 1) {
      insightNote = `Single matching property currently listed at ${formatCurrency(min)}.`;
    } else if (skewDiffPct >= 15) {
      insightNote = `Top-tier prime properties pull the mean ${skewDiffPct}% above the ${formatCurrency(median)} median, while ${entryPct}% of listings sit in the entry bracket.`;
    } else if (skewDiffPct <= -10) {
      insightNote = `Inventory skews toward the upper bracket, with ${primePct}% of listings priced in the prime tier.`;
    } else {
      insightNote = `Balanced price distribution around a ${formatCurrency(median)} median across ${count} active listings.`;
    }

    return {
      count,
      min,
      max,
      average,
      median,
      p25,
      p75,
      cut1,
      cut2,
      entryCount,
      midTierCount,
      primeCount,
      entryPct,
      midPct,
      primePct,
      verifiedPct,
      avgEnquiries,
      insightNote,
    };
  }, [properties, enquiryCounts, formatCurrency]);

  if (!stats) return null;

  const marketTitle = locationLabel?.trim()
    ? `${locationLabel.trim()} Market Price Insight`
    : 'Market Price Insight';

  return (
    <section
      aria-label="Market Price Insight"
      className="mb-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <ChartBarIcon className="w-4 h-4 shrink-0" />
            <span>Live Inventory Price Distribution</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold font-heading text-slate-900 dark:text-white">
            {marketTitle}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
            {stats.count} {stats.count === 1 ? 'listing' : 'listings'} analyzed
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {stats.verifiedPct}% verified
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            {stats.avgEnquiries} avg enquiries
          </span>
        </div>
      </div>

      {/* 4 Core Price Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Median Price
          </span>
          <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5 block">
            {formatCurrency(stats.median)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Mean Average
          </span>
          <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5 block">
            {formatCurrency(Math.round(stats.average))}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Full Price Range
          </span>
          <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1 block truncate">
            {formatCurrency(stats.min)} – {formatCurrency(stats.max)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Core Quartile Band (P25–P75)
          </span>
          <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1 block truncate">
            {formatCurrency(stats.p25)} – {formatCurrency(stats.p75)}
          </span>
        </div>
      </div>

      {/* Segmented Distribution Bar + Narrative Summary */}
      <div className="space-y-2.5">
        <div className="h-2.5 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex">
          {stats.entryPct > 0 && (
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${stats.entryPct}%` }}
              title={`Entry Tier: ${stats.entryCount} listings (${stats.entryPct}%)`}
            />
          )}
          {stats.midPct > 0 && (
            <div
              className="h-full bg-slate-800 dark:bg-slate-400 transition-all duration-300"
              style={{ width: `${stats.midPct}%` }}
              title={`Mid-Market Tier: ${stats.midTierCount} listings (${stats.midPct}%)`}
            />
          )}
          {stats.primePct > 0 && (
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${stats.primePct}%` }}
              title={`Prime Tier: ${stats.primeCount} listings (${stats.primePct}%)`}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex flex-wrap items-center gap-4 tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
              Entry ({stats.entryCount} · {stats.entryPct}%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-800 dark:bg-slate-400 inline-block" />
              Mid-Market ({stats.midTierCount} · {stats.midPct}%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
              Prime ({stats.primeCount} · {stats.primePct}%)
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400">{stats.insightNote}</p>
        </div>
      </div>
    </section>
  );
};

export default MarketPriceInsightCard;
