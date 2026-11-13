import React from 'react';
import { NEIGHBORHOOD_GUIDES } from '../constants';
import { useTranslations } from '../contexts/LanguageContext';
import { ArrowRightIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface NeighborhoodSectionProps {
  onOpenExplorer: (neighborhoodId?: string) => void;
}

const NeighborhoodSection: React.FC<NeighborhoodSectionProps> = ({ onOpenExplorer }) => {
  const { t } = useTranslations();

  return (
    <section id="neighborhoods" className="py-20 lg:py-24 bg-[#FAF8F5] dark:bg-slate-950">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        {/* Editorial Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-widest uppercase text-emerald-700 dark:text-emerald-400 mb-2">
              District Intelligence
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white font-heading tracking-tight" style={{ textWrap: 'balance' }}>
              {t.neighborhoodGuides.title}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.neighborhoodGuides.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenExplorer()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs sm:text-sm font-semibold hover:bg-emerald-900 dark:hover:bg-amber-400 transition-colors self-start md:self-auto shrink-0"
          >
            <span className="whitespace-nowrap">Launch Neighborhood Explorer</span>
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Asymmetric Bento Showcase: Spotlight District + 3 Curated Districts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
          {NEIGHBORHOOD_GUIDES.map((guide, idx) => {
            const isSpotlight = idx === 0;
            return (
              <button
                key={guide.id}
                type="button"
                onClick={() => onOpenExplorer(guide.id)}
                className={`${
                  isSpotlight ? 'lg:col-span-6 md:col-span-2' : 'lg:col-span-2'
                } group relative text-left rounded-2xl overflow-hidden bg-slate-900 min-h-[340px] lg:min-h-[420px] flex flex-col justify-end transition-all duration-300 shadow-lg hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500`}
              >
                <img
                  src={guide.image}
                  alt={guide.name}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/15" />

                <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between text-xs text-slate-200/90">
                    <span className="inline-flex items-center gap-1 text-amber-300 font-medium">
                      <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>Guide 0{idx + 1}</span>
                    </span>
                    <span className="font-mono text-[11px] text-slate-300 tabular-nums">
                      Safety {guide.scores.safety}/10
                    </span>
                  </div>

                  <div className="mt-auto">
                    <h3 className={`${isSpotlight ? 'text-2xl sm:text-3xl' : 'text-xl'} font-bold text-white font-heading tracking-tight`}>
                      {guide.name}
                    </h3>
                    <p className={`mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed ${isSpotlight ? 'max-w-md' : 'line-clamp-3'}`}>
                      {guide.description}
                    </p>

                    <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-slate-300">
                      <span className="truncate">
                        Schools {guide.scores.schools}/10 · Family {guide.scores.familyFriendly}/10
                      </span>
                      <ArrowRightIcon className="w-3.5 h-3.5 text-amber-300 shrink-0 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default NeighborhoodSection;