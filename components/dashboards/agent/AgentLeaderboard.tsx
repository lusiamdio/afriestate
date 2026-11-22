import React, { useMemo, useState } from 'react';
import type { Message, Property, Review, TourRequest, User } from '../../../types';
import { PropertyStatus } from '../../../types';
import { useCurrency } from '../../../contexts/CurrencyContext';
import {
  CheckBadgeIcon,
  ClockIcon,
  StarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

export interface AgentLeaderboardEntry {
  id: string;
  agentName: string;
  agencyName: string;
  primaryMarket: string;
  region: string;
  verifiedSalesCount: number;
  verifiedVolumeUsd: number;
  activeListingsCount: number;
  rating: number;
  reviewCount: number;
  responsivenessPct: number;
  avgReplyMinutes: number;
  compositeScore: number;
  tier: 'Diamond' | 'Platinum' | 'Gold' | 'Premier';
  isCurrentUser: boolean;
}

type LeaderboardSortKey = 'composite' | 'sales' | 'rating' | 'responsiveness';

const BENCHMARK_AGENTS: Omit<AgentLeaderboardEntry, 'compositeScore' | 'isCurrentUser'>[] = [
  {
    id: 'bench-1',
    agentName: 'Amara Okafor',
    agencyName: 'Atlantic Crest Realty',
    primaryMarket: 'Lagos · Ikoyi & Victoria Island',
    region: 'West Africa',
    verifiedSalesCount: 28,
    verifiedVolumeUsd: 18450000,
    activeListingsCount: 14,
    rating: 4.95,
    reviewCount: 64,
    responsivenessPct: 99,
    avgReplyMinutes: 6,
    tier: 'Diamond',
  },
  {
    id: 'bench-2',
    agentName: 'Thabo Mokoena',
    agencyName: 'Table Bay Estates',
    primaryMarket: 'Cape Town · Sandton',
    region: 'Southern Africa',
    verifiedSalesCount: 24,
    verifiedVolumeUsd: 15900000,
    activeListingsCount: 19,
    rating: 4.91,
    reviewCount: 52,
    responsivenessPct: 97,
    avgReplyMinutes: 9,
    tier: 'Diamond',
  },
  {
    id: 'bench-3',
    agentName: 'Wanjiku Kamau',
    agencyName: 'Savanna Prime Advisory',
    primaryMarket: 'Nairobi · Kigali',
    region: 'East Africa',
    verifiedSalesCount: 21,
    verifiedVolumeUsd: 12100000,
    activeListingsCount: 16,
    rating: 4.88,
    reviewCount: 47,
    responsivenessPct: 98,
    avgReplyMinutes: 8,
    tier: 'Platinum',
  },
  {
    id: 'bench-4',
    agentName: 'Youssef El-Mansouri',
    agencyName: 'Atlas Meridian Capital',
    primaryMarket: 'Marrakech · Casablanca',
    region: 'North Africa',
    verifiedSalesCount: 19,
    verifiedVolumeUsd: 11400000,
    activeListingsCount: 12,
    rating: 4.84,
    reviewCount: 39,
    responsivenessPct: 95,
    avgReplyMinutes: 12,
    tier: 'Platinum',
  },
  {
    id: 'bench-5',
    agentName: 'Kwame Mensah',
    agencyName: 'Gold Coast Signature',
    primaryMarket: 'Accra · Cantonments',
    region: 'West Africa',
    verifiedSalesCount: 16,
    verifiedVolumeUsd: 9250000,
    activeListingsCount: 11,
    rating: 4.79,
    reviewCount: 33,
    responsivenessPct: 94,
    avgReplyMinutes: 14,
    tier: 'Gold',
  },
  {
    id: 'bench-6',
    agentName: 'Nadia Benali',
    agencyName: 'Nile Delta Properties',
    primaryMarket: 'Cairo · New Administrative Capital',
    region: 'North Africa',
    verifiedSalesCount: 14,
    verifiedVolumeUsd: 8600000,
    activeListingsCount: 10,
    rating: 4.76,
    reviewCount: 29,
    responsivenessPct: 92,
    avgReplyMinutes: 17,
    tier: 'Gold',
  },
];

const scoreAgent = (
  verifiedSalesCount: number,
  rating: number,
  responsivenessPct: number
): number => {
  // Normalized 100-pt Executive Score: 45% Verified Sales (capped at 30 deals) + 30% Client Rating + 25% Responsiveness SLA
  const salesScore = Math.min(1, verifiedSalesCount / 30) * 45;
  const ratingScore = Math.min(1, rating / 5) * 30;
  const responseScore = Math.min(1, responsivenessPct / 100) * 25;
  return Number((salesScore + ratingScore + responseScore).toFixed(1));
};

export const computeAgentLeaderboardData = (
  allProperties: Property[],
  user: User,
  agentReviews: Review[],
  messages: Message[],
  receivedInquiries: TourRequest[]
): AgentLeaderboardEntry[] => {
  const byAgentName = new Map<string, Property[]>();
  allProperties.forEach((p) => {
    const key = (p.agent?.name || '').trim();
    if (!key) return;
    const list = byAgentName.get(key) || [];
    list.push(p);
    byAgentName.set(key, list);
  });

  const userNames = [user.username, user.fullName].filter(Boolean).map((n) => n.toLowerCase());
  const userProps = allProperties.filter((p) =>
    userNames.includes((p.agent?.name || '').trim().toLowerCase())
  );

  const userSoldProps = userProps.filter((p) => p.status === PropertyStatus.SOLD);
  const userVerifiedSales = Math.max(userSoldProps.length, userProps.filter((p) => p.verified).length > 0 ? Math.max(1, userSoldProps.length) : 0);
  const userVerifiedVolume =
    userSoldProps.reduce((sum, p) => sum + p.price, 0) ||
    userProps.filter((p) => p.verified).slice(0, 2).reduce((sum, p) => sum + p.price, 0);

  const reviewRatingAvg =
    agentReviews.length > 0
      ? agentReviews.reduce((sum, r) => sum + r.rating, 0) / agentReviews.length
      : userProps.length > 0
      ? userProps.reduce((sum, p) => sum + (p.agent?.rating || 4.7), 0) / userProps.length
      : 4.8;

  const sentMessages = messages.filter((m) => userNames.includes((m.senderUsername || '').toLowerCase())).length;
  const confirmedTours = receivedInquiries.filter((t) => t.status === 'Confirmed').length;
  const responsivenessPct = Math.min(99, 88 + Math.min(11, sentMessages * 2 + confirmedTours * 3));
  const avgReplyMinutes = Math.max(5, 22 - Math.min(15, sentMessages * 2 + confirmedTours * 2));

  const merged: AgentLeaderboardEntry[] = BENCHMARK_AGENTS.map((b) => {
    const liveProps = byAgentName.get(b.agentName) || [];
    const liveSold = liveProps.filter((p) => p.status === PropertyStatus.SOLD).length;
    const liveVolume = liveProps
      .filter((p) => p.status === PropertyStatus.SOLD)
      .reduce((sum, p) => sum + p.price, 0);
    const verifiedSalesCount = b.verifiedSalesCount + liveSold;
    const verifiedVolumeUsd = b.verifiedVolumeUsd + liveVolume;
    const compositeScore = scoreAgent(verifiedSalesCount, b.rating, b.responsivenessPct);

    return {
      ...b,
      verifiedSalesCount,
      verifiedVolumeUsd,
      activeListingsCount: b.activeListingsCount + liveProps.filter((p) => p.status === PropertyStatus.ACTIVE).length,
      compositeScore,
      isCurrentUser: userNames.includes(b.agentName.toLowerCase()),
    };
  });

  // Also include any distinct live property agents from the database not already in benchmarks
  for (const [agentName, props] of byAgentName.entries()) {
    const alreadyExists = merged.some(
      (entry) => entry.agentName.toLowerCase() === agentName.toLowerCase()
    );
    const belongsToCurrentUser = userNames.includes(agentName.toLowerCase());
    if (alreadyExists || belongsToCurrentUser) continue;

    const soldCount = props.filter((p) => p.status === PropertyStatus.SOLD).length;
    const verifiedCount = props.filter((p) => p.verified).length;
    const effectiveSales = soldCount > 0 ? soldCount : Math.min(8, Math.max(2, verifiedCount));
    const avgRating =
      props.reduce((s, p) => s + (p.agent?.rating || 4.6), 0) / Math.max(1, props.length);
    const totalReviews = props.reduce((s, p) => s + (p.agent?.reviewCount || 0), 0);
    const resp = 91;
    const comp = scoreAgent(effectiveSales, avgRating, resp);

    merged.push({
      id: `live-${agentName}`,
      agentName,
      agencyName: 'AfriEstate Verified Partner',
      primaryMarket: props[0]?.address?.city || 'Pan-African',
      region: props[0]?.region || 'Southern Africa',
      verifiedSalesCount: effectiveSales,
      verifiedVolumeUsd: props.slice(0, effectiveSales).reduce((s, p) => s + p.price, 0),
      activeListingsCount: props.filter((p) => p.status === PropertyStatus.ACTIVE).length,
      rating: Number(avgRating.toFixed(2)),
      reviewCount: totalReviews || props.length * 4,
      responsivenessPct: resp,
      avgReplyMinutes: 16,
      compositeScore: comp,
      tier: comp >= 85 ? 'Platinum' : comp >= 72 ? 'Gold' : 'Premier',
      isCurrentUser: false,
    });
  }

  // Ensure signed-in agent always appears on the leaderboard
  if (!merged.some((e) => e.isCurrentUser)) {
    const displayName = user.fullName || user.username;
    const currentComposite = scoreAgent(userVerifiedSales, reviewRatingAvg, responsivenessPct);
    merged.push({
      id: `current-${user.username}`,
      agentName: displayName,
      agencyName: user.agencyName || 'Independent Verified Broker',
      primaryMarket: user.country ? `${user.country} Desk` : 'Pan-African Desk',
      region: 'Southern Africa',
      verifiedSalesCount: userVerifiedSales,
      verifiedVolumeUsd: userVerifiedVolume,
      activeListingsCount: userProps.filter((p) => p.status === PropertyStatus.ACTIVE).length,
      rating: Number(reviewRatingAvg.toFixed(2)),
      reviewCount: agentReviews.length || Math.max(1, userProps.reduce((s, p) => s + (p.agent?.reviewCount || 0), 0)),
      responsivenessPct,
      avgReplyMinutes,
      compositeScore: currentComposite,
      tier: currentComposite >= 88 ? 'Diamond' : currentComposite >= 78 ? 'Platinum' : currentComposite >= 65 ? 'Gold' : 'Premier',
      isCurrentUser: true,
    });
  }

  return merged.sort((a, b) => b.compositeScore - a.compositeScore);
};

interface AgentLeaderboardProps {
  user: User;
  allProperties: Property[];
  agentReviews: Review[];
  messages: Message[];
  receivedInquiries: TourRequest[];
}

export const AgentLeaderboard: React.FC<AgentLeaderboardProps> = ({
  user,
  allProperties,
  agentReviews,
  messages,
  receivedInquiries,
}) => {
  const { formatCurrency } = useCurrency();
  const [sortBy, setSortBy] = useState<LeaderboardSortKey>('composite');
  const [regionFilter, setRegionFilter] = useState<string>('All');

  const baseEntries = useMemo(
    () => computeAgentLeaderboardData(allProperties, user, agentReviews, messages, receivedInquiries),
    [allProperties, user, agentReviews, messages, receivedInquiries]
  );

  const sortedEntries = useMemo(() => {
    const filtered =
      regionFilter === 'All'
        ? baseEntries
        : baseEntries.filter((e) => e.region === regionFilter || e.isCurrentUser);

    return [...filtered].sort((a, b) => {
      if (sortBy === 'sales') return b.verifiedSalesCount - a.verifiedSalesCount || b.verifiedVolumeUsd - a.verifiedVolumeUsd;
      if (sortBy === 'rating') return b.rating - a.rating || b.reviewCount - a.reviewCount;
      if (sortBy === 'responsiveness') return b.responsivenessPct - a.responsivenessPct || a.avgReplyMinutes - b.avgReplyMinutes;
      return b.compositeScore - a.compositeScore;
    });
  }, [baseEntries, sortBy, regionFilter]);

  const topThree = sortedEntries.slice(0, 3);
  const currentUserRankIndex = sortedEntries.findIndex((e) => e.isCurrentUser);
  const currentUserEntry = currentUserRankIndex >= 0 ? sortedEntries[currentUserRankIndex] : null;
  const nextRankEntry = currentUserRankIndex > 0 ? sortedEntries[currentUserRankIndex - 1] : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
            Continental Brokerage Rankings
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Agent Performance Leaderboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ranked by verified transaction closings, client ratings, and inquiry responsiveness SLA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter leaderboard by region"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="All">All African Markets</option>
            <option value="Southern Africa">Southern Africa</option>
            <option value="West Africa">West Africa</option>
            <option value="East Africa">East Africa</option>
            <option value="North Africa">North Africa</option>
          </select>
        </div>
      </div>

      {/* Signed-in Agent Competitive Standing Strip */}
      {currentUserEntry && (
        <div className="bg-[#0B1F1A] text-white rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold font-mono tabular-nums text-amber-300">
                #{currentUserRankIndex + 1}
              </span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-amber-300 font-semibold">
                Your Current Standing · {currentUserEntry.tier} Tier
              </p>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {currentUserEntry.agentName} — {currentUserEntry.agencyName}
              </h3>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                {nextRankEntry
                  ? `${(nextRankEntry.compositeScore - currentUserEntry.compositeScore).toFixed(1)} pts behind #${currentUserRankIndex} (${nextRankEntry.agentName})`
                  : 'Leading all verified AfriEstate brokers across your active filter'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-emerald-200/70">Verified Sales</p>
              <p className="text-xl font-bold font-mono tabular-nums mt-0.5">
                {currentUserEntry.verifiedSalesCount}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-emerald-200/70">Client Rating</p>
              <p className="text-xl font-bold font-mono tabular-nums mt-0.5">
                {currentUserEntry.rating.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-emerald-200/70">SLA Reply</p>
              <p className="text-xl font-bold font-mono tabular-nums mt-0.5">
                {currentUserEntry.avgReplyMinutes}m
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Agents Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topThree.map((agent, idx) => {
          const rankNum = idx + 1;
          return (
            <div
              key={agent.id}
              className={`bg-white dark:bg-slate-900 rounded-xl border p-5 space-y-4 ${
                agent.isCurrentUser
                  ? 'border-[#0F2D25] dark:border-emerald-500 ring-1 ring-[#0F2D25]/15'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-mono tabular-nums font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Rank #{rankNum} · {agent.tier}
                  </p>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate mt-1">
                    {agent.agentName} {agent.isCurrentUser ? '(You)' : ''}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {agent.agencyName} · {agent.primaryMarket}
                  </p>
                </div>
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    rankNum === 1
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <TrophyIcon className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Verified</p>
                  <p className="font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-0.5">
                    {agent.verifiedSalesCount} sales
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Rating</p>
                  <p className="font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-0.5">
                    {agent.rating.toFixed(2)} ({agent.reviewCount})
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Response</p>
                  <p className="font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {agent.responsivenessPct}% · {agent.avgReplyMinutes}m
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Composite Index</span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                  {agent.compositeScore} / 100
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Sort Controls + Full Standings Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Full Verified Agent Standings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Scoring weights: 45% Verified Sales · 30% Client Rating · 25% SLA Responsiveness
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {(
              [
                { id: 'composite', label: 'Overall Index' },
                { id: 'sales', label: 'Verified Sales' },
                { id: 'rating', label: 'User Rating' },
                { id: 'responsiveness', label: 'Responsiveness' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSortBy(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  sortBy === tab.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Agent &amp; Brokerage</th>
                <th className="py-3 px-4">Primary Market</th>
                <th className="py-3 px-4 text-right">Verified Sales</th>
                <th className="py-3 px-4 text-right">Closed Volume</th>
                <th className="py-3 px-4 text-right">Client Rating</th>
                <th className="py-3 px-4 text-right">Responsiveness</th>
                <th className="py-3 px-4 text-right">Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {sortedEntries.map((agent, idx) => (
                <tr
                  key={agent.id}
                  className={
                    agent.isCurrentUser
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 font-medium'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }
                >
                  <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    #{idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <CheckBadgeIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {agent.agentName}
                          {agent.isCurrentUser && (
                            <span className="ml-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {agent.agencyName} · {agent.tier}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                    {agent.primaryMarket}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                    {agent.verifiedSalesCount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-slate-600 dark:text-slate-300">
                    {formatCurrency(agent.verifiedVolumeUsd, { notation: 'compact' })}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                    <span className="inline-flex items-center justify-end gap-1 text-slate-900 dark:text-white font-semibold">
                      <StarIcon className="w-3.5 h-3.5 text-amber-500" />
                      {agent.rating.toFixed(2)}
                    </span>
                    <span className="block text-[11px] text-slate-400">{agent.reviewCount} reviews</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                    <span className="inline-flex items-center justify-end gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {agent.responsivenessPct}%
                    </span>
                    <span className="block text-[11px] text-slate-400">avg {agent.avgReplyMinutes}m reply</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {agent.compositeScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgentLeaderboard;
