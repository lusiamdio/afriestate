import React, { useMemo } from 'react';
import type { Achievement, Property, Currency } from '../../../types';
import { ListingType } from '../../../types';
import { CURRENCY_SYMBOLS, CURRENCY_CONVERSION_RATES } from '../../../constants';

interface InvestorGamificationProps {
  investorAchievements: Achievement[];
  userProperties: Property[];
  onUpdateInvestorAchievements?: (achievements: Achievement[]) => void;
  currency: Currency;
}

const InvestorGamification: React.FC<InvestorGamificationProps> = ({
  investorAchievements,
  userProperties,
  currency,
}) => {
  const progress = useMemo(() => {
    const investmentCount = userProperties.length;
    const cityCount = new Set(userProperties.map((p) => p.address.city)).size;
    const monthlyIncome = userProperties
      .filter((p) => p.listingType === ListingType.RENT)
      .reduce((sum, p) => sum + p.price, 0);

    return {
      'First Investment': investmentCount,
      Diversified: cityCount,
      'Cashflow King': monthlyIncome,
    };
  }, [userProperties]);

  const formatGoal = (title: string, goal: number) => {
    if (title === 'Cashflow King') {
      const rate = CURRENCY_CONVERSION_RATES[currency] || 1;
      const symbol = CURRENCY_SYMBOLS[currency] || '$';
      return `${symbol}${Math.round(goal * rate).toLocaleString()}`;
    }
    return goal.toLocaleString();
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white font-sans">Portfolio Milestones</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Capital deployment &amp; diversification targets</p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {investorAchievements.map((ach) => {
          const currentProgress = progress[ach.title as keyof typeof progress] || 0;
          const isCompleted = currentProgress >= ach.goal;
          const percentage = Math.min((currentProgress / ach.goal) * 100, 100);

          return (
            <div key={ach.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-lg shrink-0 ${
                  isCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <ach.badge className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{ach.title}</p>
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                    {formatGoal(ach.title, currentProgress)} / {formatGoal(ach.title, ach.goal)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ach.description}</p>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isCompleted ? 'bg-emerald-600' : 'bg-[#0F2D25] dark:bg-emerald-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InvestorGamification;
