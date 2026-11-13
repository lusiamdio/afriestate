import React, { useMemo } from 'react';
import type { Achievement, Property, Review } from '../../../types';
import { PropertyStatus } from '../../../types';

interface AgentGamificationProps {
  achievements: Achievement[];
  userProperties: Property[];
  agentReviews: Review[];
}

const AgentGamification: React.FC<AgentGamificationProps> = ({ achievements, userProperties, agentReviews }) => {
  const progress = useMemo(() => {
    const listingCount = userProperties.length;
    const soldCount = userProperties.filter((p) => p.status === PropertyStatus.SOLD).length;
    const reviewCount = agentReviews.length;

    return {
      'First Listing': listingCount,
      'Sales Pro': soldCount,
      'Review Star': reviewCount,
    };
  }, [userProperties, agentReviews]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white font-sans">Performance Milestones</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Track brokerage tier progression and review goals</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {achievements.map((ach) => {
          const currentProgress = progress[ach.title as keyof typeof progress] || 0;
          const isCompleted = currentProgress >= ach.goal;
          const percentage = Math.min((currentProgress / Math.max(ach.goal, 1)) * 100, 100);

          return (
            <div
              key={ach.id}
              className={`p-4 rounded-lg border transition-colors ${
                isCompleted
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <ach.badge className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{ach.title}</p>
                </div>
                <span className="text-xs font-mono tabular-nums font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                  {currentProgress}/{ach.goal}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{ach.description}</p>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-600' : 'bg-[#0F2D25] dark:bg-amber-400'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentGamification;
