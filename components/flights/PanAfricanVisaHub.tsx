import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AFRICA_54_VISA_DIRECTORY,
  PASSPORT_OPTIONS,
  assessAfricanVisaRequirement,
  type AfricanCountryVisaProfile,
  type AfricanSubRegion,
  type VisaRegime,
  type VisaTravelPurpose,
} from '../../data/africaVisaDirectory';
import { fetchJsonStrict } from '../../lib/http';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export interface DossierItemSource {
  title: string;
  url: string;
}

export interface DossierVerificationItem {
  id: string;
  label: string;
  status: 'confirmed' | 'changed' | 'not found';
  summary: string;
  last_verified_date: string;
  sources: DossierItemSource[];
}

interface LiveVisaAdvisorResponse {
  passportCountry: string;
  destinationCountry: string;
  travelPurpose: string;
  checkedAt: string;
  providerUsed?: string;
  parsed: {
    entryCategory: string;
    stayLimit: string;
    estimatedFee: string;
    processingTime: string;
    officialPortal: string;
    bureaucraticSummary: string;
    propertyAdvisory: string;
  };
  items?: DossierVerificationItem[];
  reportText: string;
  sources: { title: string; uri?: string; url?: string }[];
}

interface ItemVerificationMetaProps {
  item?: DossierVerificationItem;
  isLoading: boolean;
  hasVerifiedResult: boolean;
  isFallbackError: boolean;
}

const ItemVerificationMeta: React.FC<ItemVerificationMetaProps> = ({
  item,
  isLoading,
  hasVerifiedResult,
  isFallbackError,
}) => {
  if (isLoading) {
    return (
      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
        Verifying against official sources...
      </p>
    );
  }

  if (!hasVerifiedResult || !item) {
    return (
      <div className="mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2 text-[11px]">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold ${
            isFallbackError
              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
              : 'bg-slate-200/70 text-slate-600 dark:bg-slate-700/70 dark:text-slate-300'
          }`}
        >
          Not verified live
        </span>
        <span className="text-slate-400 dark:text-slate-500">Curated dossier</span>
      </div>
    );
  }

  const badgeClass =
    item.status === 'confirmed'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
      : item.status === 'changed'
      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';

  const statusLabel =
    item.status === 'confirmed'
      ? 'Confirmed'
      : item.status === 'changed'
      ? 'Changed'
      : 'Not found';

  return (
    <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-700/70 space-y-1.5 text-[11px]">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold ${badgeClass}`}>
          {statusLabel}
        </span>
        <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
          Verified: {item.last_verified_date}
        </span>
      </div>

      {item.summary && (
        <p className="text-slate-600 dark:text-slate-300 leading-snug">{item.summary}</p>
      )}

      {item.sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-0.5">
          {item.sources.slice(0, 3).map((src, idx) => (
            <a
              key={`${src.url}-${idx}`}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400 hover:underline max-w-[200px]"
              title={src.title}
            >
              <span className="truncate">{src.title}</span>
              <ArrowTopRightOnSquareIcon className="w-3 h-3 shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

const REGION_FILTERS: ('All 54 Nations' | AfricanSubRegion)[] = [
  'All 54 Nations',
  'Southern Africa',
  'East Africa',
  'West Africa',
  'North Africa',
  'Central Africa',
];

const PURPOSE_OPTIONS: { id: VisaTravelPurpose; label: string; hint: string }[] = [
  { id: 'tourism', label: 'Tourism & Short Stay', hint: 'Standard leisure entry & hospitality' },
  { id: 'property', label: 'Property Inspection & Acquisition', hint: 'Site tours, notary signing & buyer KYC' },
  { id: 'investment', label: 'Investment & Corporate', hint: 'Due diligence, meetings & FX registration' },
  { id: 'residency', label: 'Residency / Long-Term Stay', hint: 'Golden visa, work or extended stay permits' },
];

export const PanAfricanVisaHub: React.FC = () => {
  const [passportCountry, setPassportCountry] = useState<string>('South Africa');
  const [destinationIso, setDestinationIso] = useState<string>('KE');
  const [purpose, setPurpose] = useState<VisaTravelPurpose>('property');
  const [regionFilter, setRegionFilter] = useState<'All 54 Nations' | AfricanSubRegion>('All 54 Nations');
  const [regimeFilter, setRegimeFilter] = useState<'All' | VisaRegime>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState<string | null>(null);
  const [advisorResult, setAdvisorResult] = useState<LiveVisaAdvisorResponse | null>(null);
  const [liveVisaMap, setLiveVisaMap] = useState<Record<string, { regime: VisaRegime; colorTier: string }>>({});
  const [visaMapProvider, setVisaMapProvider] = useState<string | null>(null);
  const [visaMapIsLive, setVisaMapIsLive] = useState(false);
  const [visaMapWarning, setVisaMapWarning] = useState<string | null>(null);
  const [visaMapNonce, setVisaMapNonce] = useState(0);
  const [isSyncingVisaMap, setIsSyncingVisaMap] = useState(false);
  const activeRequestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      activeRequestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setIsSyncingVisaMap(true);
    setVisaMapWarning(null);
    fetchJsonStrict<{
      regimeByIso2?: Record<string, { regime: VisaRegime; colorTier: string }>;
      isLive?: boolean;
      upstreamWarning?: string;
      providerUsed?: string;
    }>('/api/visa/map', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passport: passportCountry }),
      timeoutMs: 12000,
      retries: 0,
      signal: controller.signal,
    })
      .then((data) => {
        setLiveVisaMap(data?.regimeByIso2 || {});
        setVisaMapProvider(data?.providerUsed || null);
        setVisaMapIsLive(Boolean(data?.isLive));
        setVisaMapWarning(data?.upstreamWarning || null);
      })
      .catch((err: any) => {
        if (!String(err?.message || '').includes('was cancelled')) {
          setLiveVisaMap({});
          setVisaMapIsLive(false);
          setVisaMapProvider(null);
          setVisaMapWarning(err?.message || 'Visa Requirement Map API unavailable.');
        }
      })
      .finally(() => {
        setIsSyncingVisaMap(false);
      });

    return () => controller.abort();
  }, [passportCountry, visaMapNonce]);

  const selectedCountry: AfricanCountryVisaProfile = useMemo(
    () => AFRICA_54_VISA_DIRECTORY.find((c) => c.iso2 === destinationIso) || AFRICA_54_VISA_DIRECTORY[0],
    [destinationIso]
  );

  const assessment = useMemo(
    () => assessAfricanVisaRequirement(selectedCountry, passportCountry, purpose),
    [selectedCountry, passportCountry, purpose]
  );

  const dossierBaselineItems = useMemo(
    () => [
      { id: 'entry_regime', label: 'Entry Regime', currentValue: assessment.resolvedRegime },
      { id: 'stay_limit', label: 'Authorized Stay', currentValue: assessment.stayLimitDisplay },
      { id: 'processing_window', label: 'Processing Window', currentValue: assessment.processingDisplay },
      { id: 'fee_band', label: 'Statutory Fee Band', currentValue: assessment.feeDisplay },
      { id: 'official_portal', label: 'Official Authority', currentValue: selectedCountry.officialPortal },
      { id: 'passport_validity', label: 'Passport Rule', currentValue: selectedCountry.passportValidity },
      { id: 'yellow_fever_rule', label: 'Yellow Fever / ICVP', currentValue: selectedCountry.yellowFeverRule },
      {
        id: 'property_investor_advisory',
        label: 'Real Estate & Investor Border Advisory',
        currentValue: selectedCountry.propertyInvestorAdvisory,
      },
    ],
    [assessment, selectedCountry]
  );

  const verifiedItemsById = useMemo(() => {
    const map = new Map<string, DossierVerificationItem>();
    if (advisorResult?.items) {
      for (const item of advisorResult.items) {
        map.set(item.id, item);
      }
    }
    return map;
  }, [advisorResult]);

  const allCountriesAssessed = useMemo(() => {
    return AFRICA_54_VISA_DIRECTORY.map((country) => {
      const assessed = assessAfricanVisaRequirement(country, passportCountry, purpose);
      const mapEntry = liveVisaMap[country.iso2];
      return {
        country,
        assessed:
          purpose === 'tourism' && mapEntry?.regime
            ? { ...assessed, resolvedRegime: mapEntry.regime }
            : assessed,
        liveMapRegime: mapEntry?.regime || null,
      };
    });
  }, [passportCountry, purpose, liveVisaMap]);

  const regimeCounts = useMemo(() => {
    const counts: Record<VisaRegime, number> = {
      'Visa-Free / Open Access': 0,
      'eVisa / eTA Required': 0,
      'Visa on Arrival': 0,
      'Embassy / Consular Visa': 0,
    };
    allCountriesAssessed.forEach((item) => {
      counts[item.assessed.resolvedRegime] += 1;
    });
    return counts;
  }, [allCountriesAssessed]);

  const filteredDirectory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allCountriesAssessed.filter(({ country, assessed }) => {
      const matchesRegion = regionFilter === 'All 54 Nations' || country.region === regionFilter;
      const matchesRegime = regimeFilter === 'All' || assessed.resolvedRegime === regimeFilter;
      const matchesQuery =
        !q ||
        country.name.toLowerCase().includes(q) ||
        country.capital.toLowerCase().includes(q) ||
        country.blocs.some((b) => b.toLowerCase().includes(q));
      return matchesRegion && matchesRegime && matchesQuery;
    });
  }, [allCountriesAssessed, regionFilter, regimeFilter, searchQuery]);

  const resetLiveState = () => {
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
    setIsAdvisorLoading(false);
    setAdvisorResult(null);
    setAdvisorError(null);
  };

  const handleSelectCountry = (iso2: string) => {
    setDestinationIso(iso2);
    resetLiveState();
    const el = document.getElementById('visa-corridor-assessor');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelLiveCheck = () => {
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
    setIsAdvisorLoading(false);
  };

  const handleRunLiveCheck = async () => {
    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;

    setIsAdvisorLoading(true);
    setAdvisorError(null);

    try {
      const data = await fetchJsonStrict<LiveVisaAdvisorResponse>('/api/gemini/visa-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passportCountry,
          destinationCountry: selectedCountry.name,
          travelPurpose: PURPOSE_OPTIONS.find((p) => p.id === purpose)?.label || 'Property & Business',
          dossierItems: dossierBaselineItems,
        }),
        timeoutMs: 28000,
        retries: 1,
        signal: controller.signal,
      });

      if (activeRequestRef.current === controller) {
        setAdvisorResult(data);
      }
    } catch (err: any) {
      if (err?.message?.includes('was cancelled')) {
        return;
      }
      setAdvisorResult(null);
      setAdvisorError(err?.message || 'Unable to verify live border policy right now.');
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        setIsAdvisorLoading(false);
      }
    }
  };

  const hasVerifiedResult = Boolean(advisorResult);
  const isFallbackError = Boolean(advisorError && !advisorResult);

  return (
    <div className="space-y-8">
      {/* Executive Header Strip */}
      <div className="bg-[#0B1F1A] text-white rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
              Pan-African Mobility &amp; Consular Intelligence
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight text-white">
              Visa, Passport &amp; Border Requirements Across All 54 African Nations
            </h2>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              Evaluate regional bloc exemptions (ECOWAS, EAC, SADC, CEMAC, COMESA, AMU), Yellow Fever &amp; passport validity mandates, step-by-step bureaucratic portals, and property acquisition entry pathways.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/10">
              <p className="text-[11px] uppercase tracking-wider text-emerald-200/75">Coverage</p>
              <p className="text-xl font-bold font-mono tabular-nums mt-0.5">{AFRICA_54_VISA_DIRECTORY.length} States</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/10">
              <p className="text-[11px] uppercase tracking-wider text-emerald-200/75">Visa-Free</p>
              <p className="text-xl font-bold font-mono tabular-nums text-amber-300 mt-0.5">
                {regimeCounts['Visa-Free / Open Access']}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/10">
              <p className="text-[11px] uppercase tracking-wider text-emerald-200/75">eVisa / eTA</p>
              <p className="text-xl font-bold font-mono tabular-nums mt-0.5">
                {regimeCounts['eVisa / eTA Required']}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/10">
              <p className="text-[11px] uppercase tracking-wider text-emerald-200/75">VoA / Embassy</p>
              <p className="text-xl font-bold font-mono tabular-nums mt-0.5">
                {regimeCounts['Visa on Arrival'] + regimeCounts['Embassy / Consular Visa']}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligent Corridor Assessor */}
      <section
        id="visa-corridor-assessor"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <label htmlFor="visa-passport-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              1. Your Passport Nationality
            </label>
            <select
              id="visa-passport-select"
              value={passportCountry}
              onChange={(e) => {
                setPassportCountry(e.target.value);
                resetLiveState();
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
            >
              {PASSPORT_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="visa-dest-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              2. Destination Country (54 States)
            </label>
            <select
              id="visa-dest-select"
              value={destinationIso}
              onChange={(e) => {
                setDestinationIso(e.target.value);
                resetLiveState();
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
            >
              {AFRICA_54_VISA_DIRECTORY.map((c) => (
                <option key={c.iso2} value={c.iso2}>
                  {c.name} ({c.region})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="visa-purpose-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              3. Travel &amp; Regulatory Purpose
            </label>
            <select
              id="visa-purpose-select"
              value={purpose}
              onChange={(e) => {
                setPurpose(e.target.value as VisaTravelPurpose);
                resetLiveState();
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
            >
              {PURPOSE_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Corridor Assessment Summary Header */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                {selectedCountry.iso2}
              </span>
              <span>·</span>
              <span>Capital: {selectedCountry.capital}</span>
              <span>·</span>
              <span>{selectedCountry.region}</span>
              {selectedCountry.blocs.length > 0 && (
                <>
                  <span>·</span>
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                    {selectedCountry.blocs.join(' / ')}
                  </span>
                </>
              )}
              <span>·</span>
              {hasVerifiedResult ? (
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Live Verified ({new Date(advisorResult!.checkedAt).toLocaleDateString()})
                </span>
              ) : (
                <span className="font-semibold text-amber-700 dark:text-amber-300">
                  Curated Dossier (Not verified live)
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {passportCountry} Passport &rarr; {selectedCountry.name}:{' '}
              <span className="text-[#008F45] dark:text-emerald-400">{assessment.resolvedRegime}</span>
            </h3>
            {assessment.blocAdvantage && (
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                Protocol Advantage Applied: {assessment.blocAdvantage}
              </p>
            )}
            <ItemVerificationMeta
              item={verifiedItemsById.get('entry_regime')}
              isLoading={isAdvisorLoading}
              hasVerifiedResult={hasVerifiedResult}
              isFallbackError={isFallbackError}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRunLiveCheck}
              disabled={isAdvisorLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F2D25] hover:bg-[#173f34] disabled:opacity-60 text-white text-xs font-semibold transition-colors"
            >
              {isAdvisorLoading ? (
                <ArrowPathIcon className="w-4 h-4 text-[#C9A35D] animate-spin" />
              ) : (
                <SparklesIcon className="w-4 h-4 text-[#C9A35D]" />
              )}
              <span>
                {isAdvisorLoading
                  ? 'Verifying Official Portals...'
                  : hasVerifiedResult
                  ? 'Re-Verify Live Sources'
                  : 'Run Live Verification'}
              </span>
            </button>
            {isAdvisorLoading && (
              <button
                type="button"
                onClick={handleCancelLiveCheck}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* 4 Key Regulatory Figures + Per-Item Verification */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
          <div className="p-4 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Authorized Stay
              </p>
              <p className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {assessment.stayLimitDisplay}
              </p>
            </div>
            <ItemVerificationMeta
              item={verifiedItemsById.get('stay_limit')}
              isLoading={isAdvisorLoading}
              hasVerifiedResult={hasVerifiedResult}
              isFallbackError={isFallbackError}
            />
          </div>

          <div className="p-4 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Processing Window
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {assessment.processingDisplay}
              </p>
            </div>
            <ItemVerificationMeta
              item={verifiedItemsById.get('processing_window')}
              isLoading={isAdvisorLoading}
              hasVerifiedResult={hasVerifiedResult}
              isFallbackError={isFallbackError}
            />
          </div>

          <div className="p-4 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Statutory Fee Band
              </p>
              <p className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {assessment.feeDisplay}
              </p>
            </div>
            <ItemVerificationMeta
              item={verifiedItemsById.get('fee_band')}
              isLoading={isAdvisorLoading}
              hasVerifiedResult={hasVerifiedResult}
              isFallbackError={isFallbackError}
            />
          </div>

          <div className="p-4 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Official Authority
              </p>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-1 break-words">
                {selectedCountry.officialPortal}
              </p>
            </div>
            <ItemVerificationMeta
              item={verifiedItemsById.get('official_portal')}
              isLoading={isAdvisorLoading}
              hasVerifiedResult={hasVerifiedResult}
              isFallbackError={isFallbackError}
            />
          </div>
        </div>

        {/* Loading Banner */}
        {isAdvisorLoading && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-3 text-xs text-slate-700 dark:text-slate-200">
            <div className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin shrink-0" />
            <span>
              Querying Gemini Google Search grounding across official immigration portals for{' '}
              <strong>{passportCountry}</strong> &rarr; <strong>{selectedCountry.name}</strong> (28s timeout, auto-retry on transient errors)...
            </span>
          </div>
        )}

        {/* Fallback Banner Showing Real Error Reason + Retry Button */}
        {advisorError && (
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/70 bg-rose-50/70 dark:bg-rose-950/30 space-y-2.5 text-xs text-rose-900 dark:text-rose-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold">
                <ExclamationTriangleIcon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Fallback Active — Curated Dossier (Not verified live)</span>
              </div>
              <button
                type="button"
                onClick={handleRunLiveCheck}
                disabled={isAdvisorLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold transition-colors"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" />
                <span>Retry Live Verification</span>
              </button>
            </div>
            <p className="leading-relaxed">
              <strong>Real Error Reason:</strong> {advisorError}
            </p>
            <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80">
              All regulatory fields below remain marked as &ldquo;Not verified live&rdquo; from our curated Pan-African regulatory baseline until live verification succeeds.
            </p>
          </div>
        )}

        {/* Live Search-Grounded Executive Summary Panel */}
        {advisorResult && (
          <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <GlobeAltIcon className="w-5 h-5 text-[#008F45]" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Live Search-Grounded Policy Update ({advisorResult.destinationCountry})
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums block">
                  Verified {new Date(advisorResult.checkedAt).toLocaleString()}
                </span>
                {advisorResult.providerUsed && (
                  <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                    {advisorResult.providerUsed}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500">Live Entry Status</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{advisorResult.parsed.entryCategory}</p>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500">Current Official Fee / Stay</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {advisorResult.parsed.estimatedFee} · {advisorResult.parsed.stayLimit}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500">Verified Portal</p>
                <p className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 break-all">
                  {advisorResult.parsed.officialPortal}
                </p>
              </div>
            </div>

            {advisorResult.parsed.bureaucraticSummary && (
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {advisorResult.parsed.bureaucraticSummary}
              </p>
            )}

            {advisorResult.sources.length > 0 && (
              <div className="pt-2 border-t border-emerald-200/70 dark:border-emerald-900/50">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Grounded Sources ({advisorResult.sources.length})
                </p>
                <div className="flex flex-wrap gap-3 text-xs">
                  {advisorResult.sources.slice(0, 6).map((src, idx) => {
                    const href = src.url || src.uri || '#';
                    return (
                      <a
                        key={`${href}-${idx}`}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline truncate max-w-xs"
                      >
                        <span className="truncate">{src.title}</span>
                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bureaucratic Process & Compliance Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="w-4 h-4 text-[#008F45]" />
              <span>Step-by-Step Bureaucratic Filing Process</span>
              {!hasVerifiedResult && (
                <span className="ml-auto text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Not verified live
                </span>
              )}
            </h4>
            <ol className="space-y-2.5">
              {assessment.tailoredSteps.map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                >
                  <span className="w-6 h-6 rounded-md bg-[#0F2D25] text-amber-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-[#008F45]" />
                <span>Mandatory Document &amp; Health Checklist</span>
              </h4>
              <ul className="space-y-2">
                {assessment.tailoredChecklist.map((doc, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                <div>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>Passport Rule:</strong> {selectedCountry.passportValidity}
                  </p>
                  <ItemVerificationMeta
                    item={verifiedItemsById.get('passport_validity')}
                    isLoading={isAdvisorLoading}
                    hasVerifiedResult={hasVerifiedResult}
                    isFallbackError={isFallbackError}
                  />
                </div>

                <div>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>Yellow Fever / ICVP:</strong> {selectedCountry.yellowFeverRule}
                  </p>
                  <ItemVerificationMeta
                    item={verifiedItemsById.get('yellow_fever_rule')}
                    isLoading={isAdvisorLoading}
                    hasVerifiedResult={hasVerifiedResult}
                    isFallbackError={isFallbackError}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BuildingOffice2Icon className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>Real Estate &amp; Investor Border Advisory</span>
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedCountry.propertyInvestorAdvisory}
              </p>
              <ItemVerificationMeta
                item={verifiedItemsById.get('property_investor_advisory')}
                isLoading={isAdvisorLoading}
                hasVerifiedResult={hasVerifiedResult}
                isFallbackError={isFallbackError}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Complete 54-Country Interactive Continental Directory */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Pan-African 54-Nation Directory ({filteredDirectory.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select any nation to inspect full consular workflows tailored to your {passportCountry} passport.
              {isSyncingVisaMap
                ? ' Syncing global visa map...'
                : visaMapIsLive && visaMapProvider
                ? ` Live map synced via ${visaMapProvider}.`
                : visaMapWarning
                ? ` Not verified live via Visa Map API (${visaMapWarning}).`
                : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setVisaMapNonce((n) => n + 1)}
              disabled={isSyncingVisaMap}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#008F45] disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${isSyncingVisaMap ? 'animate-spin' : ''}`} />
              <span>{visaMapIsLive ? 'Refresh Visa Map' : 'Retry Visa Map'}</span>
            </button>
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country, capital, bloc..."
                className="pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white w-56 focus:outline-none focus:border-[#008F45]"
              />
            </div>

            <select
              aria-label="Filter by entry regime"
              value={regimeFilter}
              onChange={(e) => setRegimeFilter(e.target.value as 'All' | VisaRegime)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="All">All Entry Regimes</option>
              <option value="Visa-Free / Open Access">Visa-Free / Open Access</option>
              <option value="eVisa / eTA Required">eVisa / eTA Required</option>
              <option value="Visa on Arrival">Visa on Arrival</option>
              <option value="Embassy / Consular Visa">Embassy / Consular Visa</option>
            </select>
          </div>
        </div>

        {/* Regional Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {REGION_FILTERS.map((reg) => (
            <button
              key={reg}
              type="button"
              onClick={() => setRegionFilter(reg)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                regionFilter === reg
                  ? 'bg-[#0F2D25] text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#008F45]'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>

        {/* Country Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDirectory.map(({ country, assessed, liveMapRegime }) => {
            const isSelected = country.iso2 === destinationIso;
            return (
              <button
                key={country.iso2}
                type="button"
                onClick={() => handleSelectCountry(country.iso2)}
                className={`text-left p-5 rounded-xl border transition-colors space-y-3 bg-white dark:bg-slate-900 ${
                  isSelected
                    ? 'border-[#008F45] ring-1 ring-[#008F45]/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-[#008F45]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {country.iso2} · {country.region}
                    </p>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {country.name}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[11px] font-bold font-mono block ${
                        assessed.resolvedRegime === 'Visa-Free / Open Access'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : assessed.resolvedRegime === 'Embassy / Consular Visa'
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {assessed.resolvedRegime}
                    </span>
                    {liveMapRegime && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        Map: {liveMapRegime.split('/')[0].trim()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>Stay: {assessed.stayLimitDisplay}</span>
                  <span>·</span>
                  <span className="font-mono">{assessed.feeDisplay}</span>
                  {country.blocs.length > 0 && (
                    <>
                      <span>·</span>
                      <span>{country.blocs[0]}</span>
                    </>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {country.propertyInvestorAdvisory}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default PanAfricanVisaHub;
