import React, { useState } from 'react';
import { UsersIcon } from '../../icons/AgentDashboardIcons';
import { PlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../../contexts/ToastContext';

interface TeamMember {
  name: string;
  role: string;
  listings: number;
  status: 'Active' | 'Pending';
}

const AgentTeamHub: React.FC = () => {
  const { addToast } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([
    { name: 'Thabo Mokoena', role: 'Lead Listing Partner', listings: 14, status: 'Active' },
    { name: 'Nadia van Wyk', role: 'Luxury Leasing Specialist', listings: 9, status: 'Active' },
  ]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setMembers((prev) => [
      ...prev,
      { name: inviteEmail.split('@')[0], role: 'Associate Agent', listings: 0, status: 'Pending' },
    ]);
    addToast(`Team invitation dispatched to ${inviteEmail}.`, 'success');
    setInviteEmail('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Team Collaboration Hub
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Coordinate co-listed mandates, lead routing, and associate permissions.
        </p>
      </div>

      <form
        onSubmit={handleInvite}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
      >
        <input
          type="email"
          required
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="colleague@brokerage.co.za"
          className="flex-1 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0F2D25] text-white hover:bg-[#173f34] whitespace-nowrap"
        >
          <PlusIcon className="w-4 h-4 text-[#C9A35D]" />
          Invite Team Member
        </button>
      </form>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <UsersIcon className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-sans">
            Roster ({members.length})
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {members.map((m, idx) => (
            <div key={idx} className="px-5 py-3.5 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">{m.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{m.role}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {m.listings} listings
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    m.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60'
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60'
                  }`}
                >
                  {m.status === 'Active' && <CheckCircleIcon className="w-3 h-3" />}
                  {m.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentTeamHub;
