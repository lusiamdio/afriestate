import React from 'react';

const DashboardHomeSkeleton: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-56" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-72" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-lg w-28" />
          <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-lg w-28" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="p-5 space-y-3">
            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-4" />
        <div className="aspect-[2/1] bg-slate-100 dark:bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
};

export default DashboardHomeSkeleton;
