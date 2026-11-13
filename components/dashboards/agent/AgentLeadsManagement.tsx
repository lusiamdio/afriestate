import React, { useState, useMemo } from 'react';
import type { Lead } from '../../../types';
import LeadDetailView from './LeadDetailView';
import { LeadsIcon } from '../../icons/AgentDashboardIcons';
import { SearchIcon } from '../../icons/SearchIcons';

interface AgentLeadsManagementProps {
  leads: Lead[];
}

const AgentLeadsManagement: React.FC<AgentLeadsManagementProps> = ({ leads }) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(leads[0] || null);
  const [query, setQuery] = useState('');

  const filteredLeads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) => l.username.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
    );
  }, [leads, query]);

  if (leads.length === 0) {
    return (
      <div className="p-8 h-full flex items-center justify-center text-center">
        <div>
          <LeadsIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-4">No Leads Yet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            Prospective buyers and tenants who inquire or book tours appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-white dark:bg-slate-900">
      {/* Master list */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white font-sans">
              Active Leads ({filteredLeads.length})
            </h3>
          </div>
          <div className="relative">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lead name or email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 max-h-64 md:max-h-none flex-1">
          {filteredLeads.map((lead) => {
            const active = selectedLead?.id === lead.id;
            return (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`w-full text-left px-4 py-3 transition-colors ${
                  active
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-l-2 border-[#0F2D25] dark:border-amber-400'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex justify-between items-center gap-2">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{lead.username}</p>
                  <span className="text-[11px] font-mono tabular-nums font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/50 shrink-0">
                    {lead.score} pts
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                  Last contact: {new Date(lead.lastContact).toLocaleDateString()}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        {selectedLead ? (
          <LeadDetailView lead={selectedLead} />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-slate-500 dark:text-slate-400 p-8 text-center">
            Select a lead from the directory to review their activity timeline.
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentLeadsManagement;