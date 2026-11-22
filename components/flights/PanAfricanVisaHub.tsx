import React, { useMemo, useState } from 'react';
import {
  AFRICA_54_VISA_DIRECTORY,
  PASSPORT_OPTIONS,
  assessAfricanVisaRequirement,
  type AfricanCountryVisaProfile,
  type AfricanSubRegion,
  type VisaRegime,
  type VisaTravelPurpose,
} from '../../data/africaVisaDirectory';
import {
  BuildingOffice2Icon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface LiveVisaAdvisorResponse {
  passportCountry: string;
  destinationCountry: string;
  travelPurpose: string;
  checkedAt: string;
  parsed: {
    entryCategory: string;
    stayLimit: string;
    estimatedFee: string;
    processingTime: string;
    officialPortal: string;
    bureaucraticSummary: string;
    propertyAdvisory: string;
  };
  reportText: string;
  sources: { title: string; uri: string }[];
}

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

  const selectedCountry: AfricanCountryVisaProfile = useMemo(
    () => AFRICA_54_VISA_DIRECTORY.find((c) => c.iso2 === destinationIso) || AFRICA_54_VISA_DIRECTORY[0],
    [destinationIso]
  );

  const assessment = useMemo(
    () => assessAfricanVisaRequirement(selectedCountry, passportCountry, purpose),
    [selectedCountry, passportCountry, purpose]
  );

  const allCountriesAssessed = useMemo(() => {
    return AFRICA_54_VISA_DIRECTORY.map((country) => ({
      country,
      assessed: assessAfricanVisaRequirement(country, passportCountry, purpose),
    }));
  }, [passportCountry, purpose]);

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

  const handleSelectCountry = (iso2: string) => {
    setDestinationIso(iso2);
    setAdvisorResult(null);
    setAdvisorError(null);
    const el = document.getElementById('visa-corridor-assessor');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleRunLiveCheck = async () => {
    setIsAdvisorLoading(true);
    setAdvisorError(null);
    try {
      const res = await fetch('/api/gemini/visa-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passportCountry,
          destinationCountry: selectedCountry.name,
          travelPurpose: PURPOSE_OPTIONS.find((p) => p.id === purpose)?.label || 'Property & Business',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve live embassy & visa verification.');
      }
      setAdvisorResult(data);
    } catch (err: any) {
      setAdvisorError(err?.message || 'Unable to verify live border policy right now.');
    } finally {
      setIsAdvisorLoading(false);
    }
  };

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
                setAdvisorResult(null);
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
                setAdvisorResult(null);
                setAdvisorError(null);
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
                setAdvisorResult(null);
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
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
          </div>

          <button
            type="button"
            onClick={handleRunLiveCheck}
            disabled={isAdvisorLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F2D25] hover:bg-[#173f34] disabled:opacity-60 text-white text-xs font-semibold transition-colors shrink-0"
          >
            <SparklesIcon className="w-4 h-4 text-[#C9A35D]" />
            <span>{isAdvisorLoading ? 'Checking Official Portals...' : 'Run Live Embassy & Policy Check'}</span>
          </button>
        </div>

        {/* 4 Key Regulatory Figures */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
          <div className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Authorized Stay
            </p>
            <p className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
              {assessment.stayLimitDisplay}
            </p>
          </div>
          <div className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Processing Window
            </p>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
              {assessment.processingDisplay}
            </p>
          </div>
          <div className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Statutory Fee Band
            </p>
            <p className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
              {assessment.feeDisplay}
            </p>
          </div>
          <div className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Official Authority
            </p>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-1 break-words">
              {selectedCountry.officialPortal}
            </p>
          </div>
        </div>

        {/* Live Search-Grounded Verification Panel */}
        {advisorError && (
          <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/30 text-xs text-red-700 dark:text-red-300">
            <strong>Live Verification Unavailable:</strong> {advisorError} Showing curated Pan-African regulatory dossier below.
          </div>
        )}

        {advisorResult && (
          <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <GlobeAltIcon className="w-5 h-5 text-[#008F45]" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Live Search-Grounded Policy Update ({advisorResult.destinationCountry})
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Checked {new Date(advisorResult.checkedAt).toLocaleString()}
              </span>
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

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {advisorResult.parsed.bureaucraticSummary}
            </p>

            {advisorResult.sources.length > 0 && (
              <div className="pt-2 border-t border-emerald-200/70 dark:border-emerald-900/50">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Grounded Sources
                </p>
                <div className="flex flex-wrap gap-3 text-xs">
                  {advisorResult.sources.slice(0, 4).map((src) => (
                    <a
                      key={src.uri}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 dark:text-emerald-400 hover:underline truncate max-w-xs"
                    >
                      {src.title}
                    </a>
                  ))}
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
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                <p className="text-slate-600 dark:text-slate-300">
                  <strong>Passport Rule:</strong> {selectedCountry.passportValidity}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <strong>Yellow Fever / ICVP:</strong> {selectedCountry.yellowFeverRule}
                </p>
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
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
          {filteredDirectory.map(({ country, assessed }) => {
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
                  <span
                    className={`text-[11px] font-bold font-mono ${
                      assessed.resolvedRegime === 'Visa-Free / Open Access'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : assessed.resolvedRegime === 'Embassy / Consular Visa'
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {assessed.resolvedRegime}
                  </span>
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
