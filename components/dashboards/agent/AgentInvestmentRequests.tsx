import React from 'react';
import type { InvestmentRequest } from '../../../types';
import { HandshakeIcon } from '../../icons/AgentDashboardIcons';
import { EnvelopeIcon } from '../../icons/ActionIcons';
import { useToast } from '../../../contexts/ToastContext';

interface AgentInvestmentRequestsProps {
  investmentRequests: InvestmentRequest[];
}

const AgentInvestmentRequests: React.FC<AgentInvestmentRequestsProps> = ({ investmentRequests }) => {
  const { addToast } = useToast();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Investor Acquisition Briefs
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Mandates submitted by verified institutional and private real estate investors.
        </p>
      </div>

      <div className="space-y-4">
        {investmentRequests.length > 0 ? (
          investmentRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-base text-slate-900 dark:text-white">
                      {req.investorUsername}
                    </span>
                    <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60 px-2 py-0.5 rounded">
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    {new Date(req.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() =>
                    addToast(
                      `Proposal draft opened for ${req.investorUsername}. Check Client Messages to follow up.`,
                      'success'
                    )
                  }
                  className="bg-[#0F2D25] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#173f34] inline-flex items-center gap-2 whitespace-nowrap self-start sm:self-auto transition-colors"
                >
                  <EnvelopeIcon className="w-4 h-4 text-[#C9A35D]" />
                  Submit Property Pitch
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
                {req.requestDetails}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6">
            <HandshakeIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mt-3">
              No Investor Briefs Yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Verified investor mandates matching your regional coverage will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentInvestmentRequests;
