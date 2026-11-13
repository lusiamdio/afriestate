import React, { useMemo } from 'react';
import type { Property, User } from '../../../types';
import { PropertyStatus } from '../../../types';
import { BanknotesIcon, ClockIcon } from '../../icons/ActionIcons';
import { useCurrency } from '../../../contexts/CurrencyContext';

interface AgentEarningsProps {
  user: User;
  allProperties: Property[];
}

const AgentEarnings: React.FC<AgentEarningsProps> = ({ user, allProperties }) => {
  const { formatCurrency } = useCurrency();
  const commissionRate = 0.025;

  const soldProperties = useMemo(() => {
    return allProperties
      .filter((p) => p.agent.name === user.username && p.status === PropertyStatus.SOLD)
      .map((p) => {
        const commission = p.price * commissionRate;
        const isPaid = p.id.includes('1') || p.id.includes('5');
        return { ...p, commission, isPaid };
      });
  }, [allProperties, user.username]);

  const earnings = useMemo(() => {
    const total = soldProperties.reduce((sum, p) => sum + p.commission, 0);
    const pending = soldProperties.filter((p) => !p.isPaid).reduce((sum, p) => sum + p.commission, 0);
    return { total, pending };
  }, [soldProperties]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Commissions & Payouts
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Standard brokerage rate: {(commissionRate * 100).toFixed(1)}% across closed transactions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
        <div className="p-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Earned Commissions
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
              {formatCurrency(earnings.total)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            <BanknotesIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="p-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Escrow Payouts
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
              {formatCurrency(earnings.pending)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
            <ClockIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
            Settlement Ledger
          </h3>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {soldProperties.length} transaction{soldProperties.length === 1 ? '' : 's'}
          </span>
        </div>

        {soldProperties.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold">Property</th>
                  <th className="py-3 px-4 text-right font-semibold">Closing Price</th>
                  <th className="py-3 px-4 text-right font-semibold">Commission (2.5%)</th>
                  <th className="py-3 px-4 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {soldProperties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{p.title}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.commission)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded border ${
                          p.isPaid
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {p.isPaid ? 'Settled' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-12">
            No completed sales recorded yet. Closed deals appear automatically.
          </p>
        )}
      </div>
    </div>
  );
};

export default AgentEarnings;
