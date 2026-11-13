import React, { useState } from 'react';
import { CheckBadgeIcon, CpuChipIcon } from '../../icons/ActionIcons';
import { useToast } from '../../../contexts/ToastContext';

const plans = [
  {
    name: 'Essential',
    price: 'Free',
    priceDetail: 'First active listing',
    features: ['1 Active Listing', '30-day marketplace visibility', 'Up to 10 high-res photos', 'Standard inquiry routing'],
  },
  {
    name: 'Pay-per-Lead',
    price: 'R50',
    priceDetail: 'per verified buyer lead',
    features: ['Unlimited free listings', 'Zero monthly retainer', 'Unlimited gallery media', 'AI Description Generator'],
  },
  {
    name: 'Growth',
    price: '$149',
    priceDetail: 'per month',
    features: ['Unlimited active listings', '10 included qualified leads/mo', 'Featured search placement', 'Full AI Studio suite'],
  },
  {
    name: 'Brokerage',
    price: 'Custom',
    priceDetail: 'multi-seat enterprise plan',
    features: ['Everything in Growth', 'Multi-agent team permissions', 'Custom brokerage branding', 'Dedicated account partner'],
  },
];

const AgentBilling: React.FC = () => {
  const { addToast } = useToast();
  const [currentPlan, setCurrentPlan] = useState('Essential');
  const [credits, setCredits] = useState(1);

  const handleSelectPlan = (name: string) => {
    if (name === 'Brokerage') {
      addToast('Enterprise sales desk notified. Expect a response within 1 business day.', 'info');
      return;
    }
    setCurrentPlan(name);
    addToast(`Subscribed to the ${name} plan.`, 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Subscription & Billing
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your brokerage tier, listing credits, and renewal schedule.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Active Tier
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{currentPlan}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Auto-renews on the 1st of next billing cycle
          </p>
        </div>

        <div className="p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Listing Credits Available
            </p>
            <p className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
              {credits} / 10
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Current cycle allocation</p>
          </div>
          <button
            onClick={() => {
              setCredits((c) => Math.min(10, c + 3));
              addToast('+3 listing credits added to your account.', 'success');
            }}
            className="px-4 py-2 text-xs font-semibold bg-[#0F2D25] text-white rounded-lg hover:bg-[#173f34] whitespace-nowrap shrink-0"
          >
            + Add 3 Credits
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 font-sans">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.name;
            return (
              <div
                key={plan.name}
                className={`rounded-xl p-6 flex flex-col border transition-colors ${
                  isCurrent
                    ? 'border-[#0F2D25] dark:border-amber-400 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h4>
                  {isCurrent && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#0F2D25] text-[#C9A35D]">
                      Current
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                    {plan.price}
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{plan.priceDetail}</p>
                </div>

                <ul className="space-y-2.5 mb-6 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      {feature.includes('AI') ? (
                        <CpuChipIcon className="w-4 h-4 text-[#C9A35D] shrink-0 mt-0.5" />
                      ) : (
                        <CheckBadgeIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isCurrent}
                  onClick={() => handleSelectPlan(plan.name)}
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-[#0F2D25] text-white hover:bg-[#173f34]'
                  }`}
                >
                  {isCurrent ? 'Active Plan' : plan.name === 'Brokerage' ? 'Contact Sales' : `Switch to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AgentBilling;
