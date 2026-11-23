import React, { useState } from 'react';
import {
  MapPinIcon,
  GlobeAltIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { fetchJsonStrict } from '../../lib/http';

interface MapsPlaceResult {
  title: string;
  uri: string;
  placeId?: string;
  reviewSnippets: string[];
}

interface SearchSourceResult {
  title: string;
  uri: string;
}

interface GroundingIntelligencePanelProps {
  city: string;
  country?: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  title?: string;
}

const MAPS_PRESETS = [
  'Top schools, hospitals & transit stations',
  'Supermarkets, cafes, restaurants & coworking spaces',
  'International airport access & arterial highways',
];

const SEARCH_PRESETS = [
  '2026 residential rental demand, infrastructure upgrades & municipal zoning updates',
  'Average residential property appreciation, electricity/water utility resilience & buyer demand',
];

const GroundingIntelligencePanel: React.FC<GroundingIntelligencePanelProps> = ({
  city,
  country = 'South Africa',
  neighborhood,
  lat,
  lng,
  title = 'Live Location & Market Intelligence',
}) => {
  const [activeMode, setActiveMode] = useState<'maps' | 'search'>('maps');
  const [customQuery, setCustomQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [mapsResult, setMapsResult] = useState<{
    summary: string;
    places: MapsPlaceResult[];
    checkedAt: string;
  } | null>(null);

  const [searchResult, setSearchResult] = useState<{
    summary: string;
    sources: SearchSourceResult[];
    checkedAt: string;
  } | null>(null);

  const areaPrefix = neighborhood ? `${neighborhood}, ${city}` : city;

  const runMapsGrounding = async (queryText: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchJsonStrict('/api/gemini/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          lat,
          lng,
          city: areaPrefix,
          country,
        }),
        timeoutMs: 25000,
        retries: 1,
      });
      setMapsResult({
        summary: data.summary || '',
        places: Array.isArray(data.places) ? data.places : [],
        checkedAt: data.checkedAt || new Date().toISOString(),
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to retrieve Google Maps Grounding insights right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const runSearchGrounding = async (queryText: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchJsonStrict('/api/gemini/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          city: areaPrefix,
          country,
        }),
        timeoutMs: 25000,
        retries: 1,
      });
      setSearchResult({
        summary: data.summary || '',
        sources: Array.isArray(data.sources) ? data.sources : [],
        checkedAt: data.checkedAt || new Date().toISOString(),
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to retrieve live neighborhood insights right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fallbackPrompt = activeMode === 'maps' ? MAPS_PRESETS[0] : SEARCH_PRESETS[0];
    const query = customQuery.trim() || fallbackPrompt;
    if (activeMode === 'maps') {
      void runMapsGrounding(query);
    } else {
      void runSearchGrounding(query);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Grounded Area & Market Research
          </p>
          <h4 className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-white mt-0.5">
            {title} — {areaPrefix}, {country}
          </h4>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveMode('maps');
              setErrorMsg(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
              activeMode === 'maps'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <MapPinIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Maps Places</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('search');
              setErrorMsg(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
              activeMode === 'search'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <GlobeAltIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>Live Web Search</span>
          </button>
        </div>
      </div>

      {/* Quick preset prompts */}
      <div className="flex flex-wrap gap-1.5">
        {(activeMode === 'maps' ? MAPS_PRESETS : SEARCH_PRESETS).map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={isLoading}
            onClick={() => {
              setCustomQuery(preset);
              if (activeMode === 'maps') {
                void runMapsGrounding(preset);
              } else {
                void runSearchGrounding(preset);
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50 text-left"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Query bar */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          placeholder={
            activeMode === 'maps'
              ? `Ask about nearby schools, clinics, transit or dining in ${areaPrefix}...`
              : `Search live web market & infrastructure updates for ${areaPrefix}...`
          }
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-[#0B1F1A] hover:bg-emerald-950 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors"
        >
          <SparklesIcon className="w-4 h-4 text-amber-300" />
          <span>{isLoading ? 'Querying Live Data...' : activeMode === 'maps' ? 'Query Google Maps' : 'Search Live Web'}</span>
        </button>
      </form>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-200">
          <ExclamationCircleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Google Maps Grounding Results */}
      {activeMode === 'maps' && mapsResult && (
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          {mapsResult.summary && (
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {mapsResult.summary}
            </p>
          )}

          {mapsResult.places.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Verified Google Maps Places ({mapsResult.places.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {mapsResult.places.map((place, idx) => (
                  <a
                    key={`${place.uri}-${idx}`}
                    href={place.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/70 dark:bg-slate-800/70 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 transition-colors flex flex-col justify-between gap-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-amber-300">
                        {place.title}
                      </span>
                      <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 mt-0.5" />
                    </div>
                    {place.reviewSnippets.length > 0 && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                        "{place.reviewSnippets[0]}"
                      </p>
                    )}
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Open in Google Maps
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Google Search Grounding Results */}
      {activeMode === 'search' && searchResult && (
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          {searchResult.summary && (
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {searchResult.summary}
            </p>
          )}

          {searchResult.sources.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Verified Web Sources ({searchResult.sources.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {searchResult.sources.map((src, idx) => (
                  <a
                    key={`${src.uri}-${idx}`}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <span className="truncate max-w-[220px]">{src.title}</span>
                    <ArrowTopRightOnSquareIcon className="w-3 h-3 text-slate-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroundingIntelligencePanel;
