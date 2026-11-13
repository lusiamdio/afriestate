import React from 'react';
import type { Lead, ActivityType } from '../../../types';
import { ActivityType as ActivityTypeEnum } from '../../../types';
import { ChatBubbleLeftRightIcon, CalendarIcon, EnvelopeIcon, PhoneIcon } from '../../icons/ActionIcons';
import { useToast } from '../../../contexts/ToastContext';

const activityIcons: Record<ActivityType, React.ElementType> = {
  [ActivityTypeEnum.MESSAGE_SENT]: ChatBubbleLeftRightIcon,
  [ActivityTypeEnum.TOUR_REQUESTED]: CalendarIcon,
};

const LeadDetailView: React.FC<{ lead: Lead }> = ({ lead }) => {
  const { addToast } = useToast();

  return (
    <div className="p-5 sm:p-8 max-w-4xl">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{lead.username}</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {lead.email} · {lead.phone}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Intent Score
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-[#0F2D25] dark:text-amber-300 font-mono tabular-nums">
              {lead.score}/100
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(lead.email);
              addToast(`Copied ${lead.email} to clipboard.`, 'info');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0F2D25] text-white hover:bg-[#173f34] transition-colors"
          >
            <EnvelopeIcon className="w-3.5 h-3.5 text-[#C9A35D]" />
            Copy Email
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(lead.phone);
              addToast(`Copied ${lead.phone} to clipboard.`, 'info');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <PhoneIcon className="w-3.5 h-3.5" />
            Copy Phone
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-5 font-sans">
          Engagement Timeline
        </h3>
        <div className="flow-root">
          <ul className="-mb-6">
            {lead.activity.map((item, itemIdx) => (
              <li key={item.timestamp}>
                <div className="relative pb-6">
                  {itemIdx !== lead.activity.length - 1 && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-px bg-slate-200 dark:bg-slate-800"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        {React.createElement(activityIcons[item.type], {
                          className: 'h-4 w-4 text-slate-600 dark:text-slate-300',
                        })}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1">
                      <div>
                        <p className="text-sm text-slate-700 dark:text-slate-200">
                          {item.type} · <span className="font-semibold">{item.propertyTitle}</span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.detail}</p>
                      </div>
                      <div className="whitespace-nowrap text-right text-xs font-mono text-slate-400">
                        <time dateTime={new Date(item.timestamp).toISOString()}>
                          {new Date(item.timestamp).toLocaleDateString()}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailView;