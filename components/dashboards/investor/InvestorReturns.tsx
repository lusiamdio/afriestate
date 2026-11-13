import React, { useMemo } from 'react';
import type { User } from '../../../types';
import { getInvestorReturns } from '../../../lib/data';
import { BanknotesIcon, ChartBarIcon } from '../../icons/ActionIcons';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { useToast } from '../../../contexts/ToastContext';

interface InvestorReturnsProps {
  user: User;
}

const InvestorReturns: React.FC<InvestorReturnsProps> = () => {
  const { formatCurrency } = useCurrency();
  const { addToast } = useToast();
  const returnsData = useMemo(() => getInvestorReturns(), []);

  const totals = useMemo(() => {
    const total = returnsData.reduce((sum, item) => sum + item.amount, 0);
    const currentYear = new Date().getFullYear();
    const ytd = returnsData
      .filter((item) => new Date(item.date).getFullYear() === currentYear)
      .reduce((sum, item) => sum + item.amount, 0);
    return { total, ytd };
  }, [returnsData]);

  const handleExportLedger = () => {
    const rows = [
      ['Date', 'Property', 'Distribution Type', 'Amount'],
      ...returnsData.map((r) => [r.date, `"${r.propertyTitle}"`, r.type, String(r.amount)]),
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'afriestate-dividends-ledger.csv';
    link.click();
    URL.revokeObjectURL(url);
    addToast('Dividend ledger exported to CSV.', 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Returns &amp; Dividends
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Historical rental distributions, quarterly dividends, and settlement records.
          </p>
        </div>
        <button
          onClick={handleExportLedger}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto whitespace-nowrap"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Download Ledger
        </button>
      </div>

      {/* Unified 2-Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
        <div className="p-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Cumulative Distributions
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
              {formatCurrency(totals.total)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">All recorded payout periods</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#0F2D25] dark:text-emerald-400">
            <BanknotesIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Year-to-Date Payouts
            </p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono tabular-nums">
              {formatCurrency(totals.ytd)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Current fiscal year</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#0F2D25] dark:text-emerald-400">
            <ChartBarIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* High-Density Dividend Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-sans">Settlement Ledger</h3>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {returnsData.length} entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Settlement Date</th>
                <th className="px-5 py-3 text-left font-medium">Asset</th>
                <th className="px-5 py-3 text-left font-medium">Category</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {returnsData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{item.propertyTitle}</td>
                  <td className="px-5 py-3 text-xs font-medium text-slate-600 dark:text-slate-300">{item.type}</td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    +{formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {returnsData.length === 0 && (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-10">No dividend history recorded.</p>
        )}
      </div>
    </div>
  );
};

export default InvestorReturns;
