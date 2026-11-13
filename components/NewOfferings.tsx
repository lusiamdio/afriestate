import React from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface OfferingItem {
  index: string;
  title: string;
  category: string;
  meta: string;
  description: string;
  ctaLabel: string;
  image: string;
  spanClass: string;
  onClick: () => void;
}

const NewOfferings: React.FC<{
  onRentCarClick?: () => void;
  onBookStayClick?: () => void;
  onFindWellnessClick?: () => void;
}> = ({ onRentCarClick, onBookStayClick, onFindWellnessClick }) => {
  const offerings: OfferingItem[] = [
    {
      index: '01',
      title: 'Book a Stay',
      category: 'Short-Term & Serviced',
      meta: 'Cape Town · Nairobi · Zanzibar',
      description: 'Vetted penthouses, beachfront villas, and business-ready apartments with verified power backup and high-speed fibre.',
      ctaLabel: 'Explore Stays',
      image: '/images/loft_interior_1779978697203.png',
      spanClass: 'lg:col-span-6',
      onClick: onBookStayClick || (() => {}),
    },
    {
      index: '02',
      title: 'Rent a Car',
      category: 'Executive Mobility',
      meta: 'Airport Transfers · Chauffeur · 4x4',
      description: 'Seamless continental mobility with insured SUVs, executive sedans, and vetted drivers matched to your arrival hub.',
      ctaLabel: 'Browse Fleet',
      image: '/images/harbour_house_1779978766107.png',
      spanClass: 'lg:col-span-3',
      onClick: onRentCarClick || (() => {}),
    },
    {
      index: '03',
      title: 'Find Wellness',
      category: 'Hospitality & Retreats',
      meta: 'Winelands · Coastal Spas · Eco-Lodges',
      description: 'Architectural wellness sanctuaries, hydrotherapy resorts, and restorative nature escapes curated across Africa.',
      ctaLabel: 'View Retreats',
      image: '/images/spa_wellness_1779978823248.png',
      spanClass: 'lg:col-span-3',
      onClick: onFindWellnessClick || (() => {}),
    },
  ];

  return (
    <section className="py-20 lg:py-24 bg-[#FAF8F5] dark:bg-slate-950">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-widest uppercase text-emerald-700 dark:text-emerald-400 mb-2">
              Curated Ecosystem
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight font-heading" style={{ textWrap: 'balance' }}>
              Beyond the Home
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
            Every chapter of living or investing across Africa—short-term stays, executive transport, and wellness sanctuaries—unified in one verified marketplace.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {offerings.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={item.onClick}
              className={`${item.spanClass} group relative text-left rounded-2xl overflow-hidden bg-slate-900 min-h-[380px] lg:min-h-[430px] flex flex-col justify-end transition-all duration-300 shadow-lg hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500`}
            >
              <img
                src={item.image}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/15" />

              <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between text-xs text-slate-200/90">
                  <span className="font-mono tracking-wider text-amber-300">{item.index}. {item.category}</span>
                  <span className="text-slate-300 hidden sm:inline">{item.meta}</span>
                </div>

                <div className="mt-auto pt-12">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white font-heading tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm text-slate-200 leading-relaxed max-w-md">
                    {item.description}
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-amber-300 group-hover:text-white transition-colors">
                    <span className="whitespace-nowrap">{item.ctaLabel}</span>
                    <ArrowRightIcon className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewOfferings;