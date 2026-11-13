import React from 'react';
import { BanknotesIcon, ShieldCheckIcon, TruckIcon, HomeIcon } from './icons/ActionIcons';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useTranslations } from '../contexts/LanguageContext';

interface FinancialServicesProps {
  onOpenMortgageCalculator?: () => void;
  onExploreRentals?: () => void;
  onOpenProviderServices?: (serviceFilter?: string) => void;
}

const FinancialServices: React.FC<FinancialServicesProps> = ({
  onOpenMortgageCalculator,
  onExploreRentals,
  onOpenProviderServices,
}) => {
  const { t } = useTranslations();

  const services = [
    {
      index: '01',
      title: t.financialServices.homeLoans,
      tag: 'Mortgage Desk · Pan-African Lenders',
      description: t.financialServices.homeLoansDesc,
      cta: 'Calculate Mortgage',
      Icon: BanknotesIcon,
      onClick: () => (onOpenMortgageCalculator ? onOpenMortgageCalculator() : onOpenProviderServices?.('Financial Services')),
    },
    {
      index: '02',
      title: t.financialServices.rentalServices,
      tag: 'Escrow Deposits · Tenant Checks',
      description: t.financialServices.rentalServicesDesc,
      cta: 'Browse Verified Rentals',
      Icon: HomeIcon,
      onClick: () => (onExploreRentals ? onExploreRentals() : onOpenProviderServices?.('Property Management')),
    },
    {
      index: '03',
      title: t.financialServices.insurance,
      tag: 'Title · Structural · Contents',
      description: t.financialServices.insuranceDesc,
      cta: 'Explore Cover',
      Icon: ShieldCheckIcon,
      onClick: () => onOpenProviderServices?.('Insurance'),
    },
    {
      index: '04',
      title: t.financialServices.movingServices,
      tag: 'Cross-Border · White-Glove Logistics',
      description: t.financialServices.movingServicesDesc,
      cta: 'Find Vetted Movers',
      Icon: TruckIcon,
      onClick: () => onOpenProviderServices?.('Moving Services'),
    },
  ];

  return (
    <section id="financial-services" className="py-20 lg:py-24 bg-white dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Editorial Thesis & Quantitative Proof */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <p className="text-xs font-semibold tracking-widest uppercase text-emerald-700 dark:text-emerald-400 mb-3">
              End-to-End Advisory
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white font-heading tracking-tight" style={{ textWrap: 'balance' }}>
              {t.financialServices.title}
            </h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.financialServices.subtitle}
            </p>

            <div className="mt-8 pt-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  24 hrs
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Indicative Bond & Mortgage Pre-Approval
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  100%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Deed Registry & Conveyancer Vetting
                </p>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => onOpenProviderServices?.('All')}
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-sm font-semibold hover:bg-emerald-900 dark:hover:bg-amber-400 transition-colors"
              >
                <span className="whitespace-nowrap">View All Accredited Partners</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: 2x2 Interactive Hairline Service Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {services.map((service) => (
              <button
                key={service.index}
                type="button"
                onClick={service.onClick}
                className="group text-left bg-[#FAF8F5] dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 p-6 sm:p-7 rounded-2xl transition-all duration-200 flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-amber-300 tabular-nums">
                      {service.index}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-xs flex items-center justify-center text-slate-800 dark:text-slate-200 group-hover:bg-emerald-900 group-hover:text-white dark:group-hover:bg-amber-400 dark:group-hover:text-slate-950 transition-colors duration-200">
                      <service.Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    {service.tag}
                  </p>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading tracking-tight">
                    {service.title}
                  </h3>
                  <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-amber-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  <span className="whitespace-nowrap">{service.cta}</span>
                  <ArrowRightIcon className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinancialServices;