import React, { useMemo, useState } from 'react';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PencilIcon,
  PhoneIcon,
  ShareIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  AIRLINE_BADGE_STYLES,
  ANYWHERE_DESTINATIONS,
  CABIN_MULTIPLIERS,
  DESTINATION_PHOTOS,
  FLIGHT_INVENTORY,
  HUBS,
  VISA_INTELLIGENCE,
  formatMinutes,
  getHubByCode,
  zarToUsd,
  type FlightItinerary,
  type ResultSortTab,
} from './flightData';
import type { FlightSearchParams } from './FlightSearchWidget';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useToast } from '../../contexts/ToastContext';

interface FlightResultsViewProps {
  search: FlightSearchParams;
  isSearching: boolean;
  hasActivePriceAlert?: boolean;
  onModifySearch: () => void;
  onSelectAnywhereDestination: (code: string) => void;
  onChangeDepartDate: (iso: string) => void;
  onSelectFlight: (flight: FlightItinerary, totalAdultZar: number) => void;
  onOpenPriceAlert: (suggestedZar: number) => void;
  onSubscribeDealsEmail?: (email: string) => void;
  onApplyAiRoute: (origin: string, destination: string, directOnly?: boolean) => void;
}

function formatShortDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

const AirlineMark: React.FC<{ code: string; name: string }> = ({ code, name }) => {
  const style = AIRLINE_BADGE_STYLES[code] || { bg: '#008F45', accent: '#FFFFFF', short: code };
  return (
    <div
      aria-hidden="true"
      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shadow-2xs"
    >
      <svg viewBox="0 0 32 32" className="w-6 h-6">
        <circle cx="16" cy="16" r="14" fill={style.bg} />
        <path
          d="M8 18 L24 12 L19 20 L14 18 Z"
          fill={style.accent}
          opacity="0.92"
        />
        <text
          x="16"
          y="25"
          textAnchor="middle"
          fontSize="6"
          fontWeight="700"
          fill="#FFFFFF"
        >
          {name.slice(0, 2).toUpperCase()}
        </text>
      </svg>
    </div>
  );
};

const ALL_AIRLINES = Array.from(new Set(FLIGHT_INVENTORY.map((f) => f.airline)));

const FlightResultsView: React.FC<FlightResultsViewProps> = ({
  search,
  isSearching,
  hasActivePriceAlert = false,
  onModifySearch,
  onSelectAnywhereDestination,
  onChangeDepartDate,
  onSelectFlight,
  onOpenPriceAlert,
  onSubscribeDealsEmail,
  onApplyAiRoute,
}) => {
  const { formatCurrency } = useCurrency();
  const formatZar = (zar: number) => formatCurrency(zarToUsd(zar));
  const { addToast } = useToast();

  const [sortTab, setSortTab] = useState<ResultSortTab>('recommended');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter sections collapse state
  const [openStops, setOpenStops] = useState(true);
  const [openAirlines, setOpenAirlines] = useState(true);
  const [showAllAirlines, setShowAllAirlines] = useState(false);
  const [openPrice, setOpenPrice] = useState(true);
  const [openTime, setOpenTime] = useState(true);
  const [openDuration, setOpenDuration] = useState(true);
  const [openMoreFilters, setOpenMoreFilters] = useState(false);

  // Standard Filters
  const [stopsFilter, setStopsFilter] = useState<Set<number>>(new Set());
  const [airlineSearch, setAirlineSearch] = useState('');
  const [selectedAirlines, setSelectedAirlines] = useState<Set<string>>(new Set());
  const [maxPriceZar, setMaxPriceZar] = useState<number>(15000);
  const [maxDurationHours, setMaxDurationHours] = useState<number>(30);
  const [maxDepartHour, setMaxDepartHour] = useState<number>(23);

  // Advanced African Filters
  const [connectivityFilter, setConnectivityFilter] = useState<string>('');
  const [visaFilter, setVisaFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');

  // Anywhere budget filter
  const [anywhereBudgetZar, setAnywhereBudgetZar] = useState<number>(5000);

  // Visa Intelligence state
  const [passportNationality, setPassportNationality] = useState<string>('South Africa');
  const [isVisaModalOpen, setIsVisaModalOpen] = useState(false);

  // Top Deals email subscription
  const [dealsEmail, setDealsEmail] = useState('');

  // Interactive AI Advisor
  const [isAiExpanded, setIsAiExpanded] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiRecommendationNote, setAiRecommendationNote] = useState<string | null>(null);

  const originHub = getHubByCode(search.origin);
  const destHub = getHubByCode(search.destination);
  const isAnywhere = search.destination.startsWith('ANYWHERE');

  const computeAdultZar = (flight: FlightItinerary) => {
    const tripFactor = search.tripType === 'round-trip' ? 1.0 : 0.62;
    return Math.round(flight.baseZarFare * CABIN_MULTIPLIERS[search.cabin] * tripFactor);
  };

  // Match route flights; synthesize clean schedules when a custom hub pair has no static seed
  const baseMatchedFlights = useMemo(() => {
    let matches = FLIGHT_INVENTORY.filter((f) => {
      if (isAnywhere) return f.origin === search.origin || search.origin === 'CPT';
      return f.origin === search.origin && f.destination === search.destination;
    });

    if (matches.length === 0 && !isAnywhere) {
      const oHub = originHub || HUBS[0];
      const dHub = destHub || HUBS[3];
      matches = [
        {
          id: `dyn-${oHub.code}-${dHub.code}-et`,
          flightNumber: 'ET 854',
          airline: 'Ethiopian Airlines',
          airlineCode: 'ET',
          alliance: 'Star Alliance',
          origin: oHub.code,
          destination: dHub.code,
          departureTime: '09:10',
          arrivalTime: '20:45',
          durationMinutes: 495,
          stops: 1,
          stopHub: 'ADD',
          aircraft: 'Airbus A350-900',
          baseZarFare: 2399,
          taxesZar: 299,
          cabinBaggageKg: 7,
          checkedBaggageKg: 23,
          changeAvailable: true,
          refundable: false,
          cabinAvailability: ['Economy', 'Premium Economy', 'Business'],
          connectivity: 'cross-border',
          supportedPayments: ['card', 'local-currency', 'bank-transfer'],
          visaConvenienceHint: 'evisa',
          seatsRemaining: 6,
          segments: [
            {
              from: oHub.code,
              fromAirport: oHub.airport,
              to: 'ADD',
              toAirport: 'Addis Ababa Bole International',
              departTime: '09:10',
              arriveTime: '14:40',
              durationMinutes: 270,
              carrier: 'Ethiopian Airlines',
              flightNumber: 'ET 854',
              aircraft: 'Airbus A350-900',
              layoverMinutes: 75,
              layoverCity: 'Addis Ababa',
            },
            {
              from: 'ADD',
              fromAirport: 'Addis Ababa Bole International',
              to: dHub.code,
              toAirport: dHub.airport,
              departTime: '15:55',
              arriveTime: '20:45',
              durationMinutes: 150,
              carrier: 'Ethiopian Airlines',
              flightNumber: 'ET 912',
              aircraft: 'Boeing 787-8',
            },
          ],
        },
        {
          id: `dyn-${oHub.code}-${dHub.code}-kq`,
          flightNumber: 'KQ 740',
          airline: 'Kenya Airways',
          airlineCode: 'KQ',
          alliance: 'SkyTeam',
          origin: oHub.code,
          destination: dHub.code,
          departureTime: '12:20',
          arrivalTime: '17:50',
          durationMinutes: 330,
          stops: 0,
          aircraft: 'Boeing 787-8 Dreamliner',
          baseZarFare: 3490,
          taxesZar: 390,
          cabinBaggageKg: 7,
          checkedBaggageKg: 23,
          changeAvailable: true,
          refundable: true,
          cabinAvailability: ['Economy', 'Business', 'First'],
          connectivity: 'direct-africa',
          supportedPayments: ['card', 'local-currency', 'mobile-money'],
          visaConvenienceHint: 'visa-on-arrival',
          seatsRemaining: 4,
          segments: [
            {
              from: oHub.code,
              fromAirport: oHub.airport,
              to: dHub.code,
              toAirport: dHub.airport,
              departTime: '12:20',
              arriveTime: '17:50',
              durationMinutes: 330,
              carrier: 'Kenya Airways',
              flightNumber: 'KQ 740',
              aircraft: 'Boeing 787-8 Dreamliner',
            },
          ],
        },
        {
          id: `dyn-${oHub.code}-${dHub.code}-wb`,
          flightNumber: 'WB 114',
          airline: 'RwandAir',
          airlineCode: 'WB',
          alliance: 'Pan-African Network',
          origin: oHub.code,
          destination: dHub.code,
          departureTime: '07:45',
          arrivalTime: '17:20',
          durationMinutes: 455,
          stops: 1,
          stopHub: 'KGL',
          aircraft: 'Airbus A330-300',
          baseZarFare: 2699,
          taxesZar: 300,
          cabinBaggageKg: 10,
          checkedBaggageKg: 23,
          changeAvailable: true,
          refundable: true,
          cabinAvailability: ['Economy', 'Business'],
          connectivity: 'cross-border',
          supportedPayments: ['card', 'local-currency', 'mobile-money'],
          visaConvenienceHint: 'visa-free',
          seatsRemaining: 8,
          segments: [
            {
              from: oHub.code,
              fromAirport: oHub.airport,
              to: 'KGL',
              toAirport: 'Kigali International',
              departTime: '07:45',
              arriveTime: '12:30',
              durationMinutes: 225,
              carrier: 'RwandAir',
              flightNumber: 'WB 114',
              aircraft: 'Airbus A330-300',
              layoverMinutes: 60,
              layoverCity: 'Kigali',
            },
            {
              from: 'KGL',
              fromAirport: 'Kigali International',
              to: dHub.code,
              toAirport: dHub.airport,
              departTime: '13:30',
              arriveTime: '17:20',
              durationMinutes: 170,
              carrier: 'RwandAir',
              flightNumber: 'WB 218',
              aircraft: 'Boeing 737-800',
            },
          ],
        },
      ];
    }

    return matches;
  }, [search.origin, search.destination, isAnywhere, originHub, destHub]);

  const airlineFareMap = useMemo(() => {
    const map: Record<string, number> = {};
    FLIGHT_INVENTORY.forEach((f) => {
      const p = computeAdultZar(f);
      if (!map[f.airline] || p < map[f.airline]) {
        map[f.airline] = p;
      }
    });
    return map;
  }, [search.cabin, search.tripType]);

  const filteredFlights = useMemo(() => {
    const list = baseMatchedFlights.filter((f) => {
      const adultPrice = computeAdultZar(f);
      if (adultPrice > maxPriceZar) return false;
      if (f.durationMinutes > maxDurationHours * 60) return false;
      if (stopsFilter.size > 0) {
        const stopBucket = f.stops >= 2 ? 2 : f.stops;
        if (!stopsFilter.has(stopBucket)) return false;
      }
      if (selectedAirlines.size > 0 && !selectedAirlines.has(f.airline)) return false;
      const departHour = Number(f.departureTime.split(':')[0] || 0);
      if (departHour > maxDepartHour) return false;
      if (connectivityFilter && f.connectivity !== connectivityFilter) return false;
      if (visaFilter && f.visaConvenienceHint !== visaFilter) return false;
      if (paymentFilter && !f.supportedPayments.includes(paymentFilter as any)) return false;
      return true;
    });

    const sorted = [...list];
    if (sortTab === 'cheapest') {
      sorted.sort((a, b) => computeAdultZar(a) - computeAdultZar(b));
    } else if (sortTab === 'fastest') {
      sorted.sort((a, b) => a.durationMinutes - b.durationMinutes);
    } else {
      sorted.sort(
        (a, b) =>
          computeAdultZar(a) + a.durationMinutes * 1.4 - (computeAdultZar(b) + b.durationMinutes * 1.4)
      );
    }
    return sorted;
  }, [
    baseMatchedFlights,
    sortTab,
    stopsFilter,
    selectedAirlines,
    maxPriceZar,
    maxDurationHours,
    maxDepartHour,
    connectivityFilter,
    visaFilter,
    paymentFilter,
    search.cabin,
    search.tripType,
  ]);

  const tabStats = useMemo(() => {
    if (filteredFlights.length === 0) {
      return { recommendedZar: 2399, cheapestZar: 2399, fastestZar: 4299 };
    }
    const prices = filteredFlights.map(computeAdultZar);
    const fastest = [...filteredFlights].sort((a, b) => a.durationMinutes - b.durationMinutes)[0];
    return {
      recommendedZar: computeAdultZar(filteredFlights[0]),
      cheapestZar: Math.min(...prices),
      fastestZar: computeAdultZar(fastest),
    };
  }, [filteredFlights, search.cabin, search.tripType]);

  const topThreeAdvisor = useMemo(() => {
    if (baseMatchedFlights.length === 0) return null;
    const byRecommended = [...baseMatchedFlights].sort(
      (a, b) =>
        computeAdultZar(a) + a.durationMinutes * 1.4 - (computeAdultZar(b) + b.durationMinutes * 1.4)
    );
    const byCheapest = [...baseMatchedFlights].sort((a, b) => computeAdultZar(a) - computeAdultZar(b));
    const byFastest = [...baseMatchedFlights].sort((a, b) => a.durationMinutes - b.durationMinutes);
    return {
      bestOverall: byRecommended[0],
      cheapest: byCheapest[0],
      fastest: byFastest[0],
    };
  }, [baseMatchedFlights, search.cabin, search.tripType]);

  const visaInfo = useMemo(() => {
    const code = destHub?.countryCode || 'NG';
    return VISA_INTELLIGENCE[code] || VISA_INTELLIGENCE.NG;
  }, [destHub]);

  const visaRule = visaInfo.statusByPassport[passportNationality] || visaInfo.statusByPassport.Default;

  const toggleStopFilter = (stopVal: number) => {
    setStopsFilter((prev) => {
      const next = new Set(prev);
      if (next.has(stopVal)) next.delete(stopVal);
      else next.add(stopVal);
      return next;
    });
  };

  const toggleAirlineFilter = (airline: string) => {
    setSelectedAirlines((prev) => {
      const next = new Set(prev);
      if (next.has(airline)) next.delete(airline);
      else next.add(airline);
      return next;
    });
  };

  const resetAllFilters = () => {
    setStopsFilter(new Set());
    setSelectedAirlines(new Set());
    setMaxPriceZar(15000);
    setMaxDurationHours(30);
    setMaxDepartHour(23);
    setConnectivityFilter('');
    setVisaFilter('');
    setPaymentFilter('');
  };

  const handleAiPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = aiPrompt.trim().toLowerCase();
    if (!q) return;

    const directRequested = q.includes('direct') || q.includes('non-stop') || q.includes('nonstop');
    const matchedHubs = HUBS.filter(
      (h) => q.includes(h.city.toLowerCase()) || q.includes(h.code.toLowerCase())
    );

    if (matchedHubs.length >= 2) {
      onApplyAiRoute(matchedHubs[0].code, matchedHubs[1].code, directRequested);
      setAiRecommendationNote(
        `Matched ${matchedHubs[0].city} (${matchedHubs[0].code}) -> ${matchedHubs[1].city} (${matchedHubs[1].code})${directRequested ? ' · Direct prioritized' : ''}.`
      );
      if (directRequested) setStopsFilter(new Set([0]));
      setAiPrompt('');
      return;
    }

    if (directRequested) {
      setStopsFilter(new Set([0]));
      setSortTab('fastest');
      setAiRecommendationNote('Filtered for direct non-stop routes ordered by fastest travel time.');
    } else if (q.includes('cheap') || q.includes('budget') || q.includes('lowest')) {
      setSortTab('cheapest');
      setAiRecommendationNote('Sorted departures by lowest transparent total fare.');
    } else {
      setSortTab('recommended');
      setAiRecommendationNote('Ranked flights balancing fare, duration, and checked baggage.');
    }
    setAiPrompt('');
  };

  const handleShareItinerary = async () => {
    const shareText = `AfriEstate Flights: ${originHub?.city || search.origin} (${search.origin}) -> ${destHub?.city || search.destination} on ${search.departDate} from ${formatZar(tabStats.cheapestZar)}`;
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // ignore clipboard restriction
    }
    addToast('Flight search link and fare summary copied.', 'success');
  };

  const handleDealsEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealsEmail.includes('@')) {
      addToast('Please enter a valid email address.', 'error');
      return;
    }
    onSubscribeDealsEmail?.(dealsEmail.trim());
    addToast(`Subscribed ${dealsEmail.trim()} to AfriEstate flight deal alerts.`, 'success');
    setDealsEmail('');
  };

  if (isSearching) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 max-w-2xl mx-auto text-center space-y-6 my-8 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-[#E8F7EF] dark:bg-emerald-950/60 text-[#008F45] flex items-center justify-center mx-auto">
          <PaperAirplaneIcon className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
            Searching Africa&apos;s best fares...
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comparing {originHub?.city || search.origin} to{' '}
            {isAnywhere ? 'All Africa Destinations' : destHub?.city || search.destination}
          </p>
        </div>
        <div className="max-w-xs mx-auto space-y-2.5 text-left text-xs font-semibold">
          <p className="flex items-center gap-2 text-[#008F45]">
            <CheckCircleIcon className="w-4 h-4 shrink-0" /> Airlines &amp; alliances
          </p>
          <p className="flex items-center gap-2 text-[#008F45]">
            <CheckCircleIcon className="w-4 h-4 shrink-0" /> Local fares &amp; airport taxes
          </p>
          <p className="flex items-center gap-2 text-[#008F45]">
            <CheckCircleIcon className="w-4 h-4 shrink-0" /> Visa &amp; transit rules
          </p>
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="w-4 h-4 rounded-full border-2 border-[#008F45] border-t-transparent animate-spin inline-block shrink-0" />
            Comparing total prices...
          </p>
        </div>
      </div>
    );
  }

  const displayedAirlines = ALL_AIRLINES.filter((a) =>
    a.toLowerCase().includes(airlineSearch.toLowerCase())
  );
  const visibleAirlines = showAllAirlines ? displayedAirlines : displayedAirlines.slice(0, 5);

  const renderFiltersBody = () => (
    <div className="space-y-5 text-xs">
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Filters</h3>
        <button
          type="button"
          onClick={resetAllFilters}
          className="text-xs font-semibold text-[#008F45] hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Stops */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
        <button
          type="button"
          onClick={() => setOpenStops((v) => !v)}
          className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-white"
        >
          <span>Stops</span>
          {openStops ? <ChevronUpIcon className="w-4 h-4 text-slate-400" /> : <ChevronDownIcon className="w-4 h-4 text-slate-400" />}
        </button>
        {openStops && (
          <div className="space-y-2">
            {[
              { val: 0, label: 'Direct', fromZar: 4299 },
              { val: 1, label: '1 Stop', fromZar: 2399 },
              { val: 2, label: '2+ Stops', fromZar: 2199 },
            ].map((item) => (
              <label
                key={item.val}
                className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={stopsFilter.has(item.val)}
                    onChange={() => toggleStopFilter(item.val)}
                    className="rounded border-slate-300 text-[#008F45] focus:ring-[#008F45] w-4 h-4"
                  />
                  <span>{item.label}</span>
                </span>
                <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                  {formatZar(item.fromZar)}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Airlines */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
        <button
          type="button"
          onClick={() => setOpenAirlines((v) => !v)}
          className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-white"
        >
          <span>Airlines</span>
          {openAirlines ? <ChevronUpIcon className="w-4 h-4 text-slate-400" /> : <ChevronDownIcon className="w-4 h-4 text-slate-400" />}
        </button>
        {openAirlines && (
          <div className="space-y-2.5">
            <div className="relative">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={airlineSearch}
                onChange={(e) => setAirlineSearch(e.target.value)}
                placeholder="Search airlines"
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div className="space-y-2">
              {visibleAirlines.map((airline) => (
                <label
                  key={airline}
                  className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedAirlines.has(airline)}
                      onChange={() => toggleAirlineFilter(airline)}
                      className="rounded border-slate-300 text-[#008F45] focus:ring-[#008F45] w-4 h-4 shrink-0"
                    />
                    <span className="truncate">{airline}</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums shrink-0 ml-2">
                    {formatZar(airlineFareMap[airline] || 2399)}
                  </span>
                </label>
              ))}
            </div>
            {displayedAirlines.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllAirlines((v) => !v)}
                className="text-xs font-semibold text-[#008F45] hover:underline"
              >
                {showAllAirlines ? 'View less' : 'View more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
        <button
          type="button"
          onClick={() => setOpenPrice((v) => !v)}
          className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-white"
        >
          <span>Price range</span>
          {openPrice ? <ChevronUpIcon className="w-4 h-4 text-slate-400" /> : <ChevronDownIcon className="w-4 h-4 text-slate-400" />}
        </button>
        {openPrice && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300 tabular-nums">
                {formatZar(2000)}
              </div>
              <div className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px] text-right font-semibold text-slate-900 dark:text-white tabular-nums">
                {formatZar(maxPriceZar)}
              </div>
            </div>
            <input
              type="range"
              min={2000}
              max={15000}
              step={250}
              value={maxPriceZar}
              onChange={(e) => setMaxPriceZar(Number(e.target.value))}
              className="w-full accent-[#008F45]"
            />
          </div>
        )}
      </div>

      {/* Departure time */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
        <button
          type="button"
          onClick={() => setOpenTime((v) => !v)}
          className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-white"
        >
          <span>Departure time</span>
          {openTime ? <ChevronUpIcon className="w-4 h-4 text-slate-400" /> : <ChevronDownIcon className="w-4 h-4 text-slate-400" />}
        </button>
        {openTime && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                00:00
              </span>
              <span className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px] text-slate-900 dark:text-white font-semibold">
                {String(maxDepartHour).padStart(2, '0')}:59
              </span>
            </div>
            <input
              type="range"
              min={6}
              max={23}
              step={1}
              value={maxDepartHour}
              onChange={(e) => setMaxDepartHour(Number(e.target.value))}
              className="w-full accent-[#008F45]"
            />
          </div>
        )}
      </div>

      {/* Duration */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
        <button
          type="button"
          onClick={() => setOpenDuration((v) => !v)}
          className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-white"
        >
          <span>Duration</span>
          {openDuration ? <ChevronUpIcon className="w-4 h-4 text-slate-400" /> : <ChevronDownIcon className="w-4 h-4 text-slate-400" />}
        </button>
        {openDuration && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                2h
              </span>
              <span className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px] text-slate-900 dark:text-white font-semibold">
                {maxDurationHours}h{maxDurationHours === 30 ? '+' : ''}
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={30}
              step={1}
              value={maxDurationHours}
              onChange={(e) => setMaxDurationHours(Number(e.target.value))}
              className="w-full accent-[#008F45]"
            />
          </div>
        )}
      </div>

      {/* More filters (Africa-first connectivity, visa & payments) */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
        <button
          type="button"
          onClick={() => setOpenMoreFilters((v) => !v)}
          className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-white"
        >
          <span>More filters</span>
          {openMoreFilters ? <ChevronUpIcon className="w-4 h-4 text-slate-400" /> : <ChevronDownIcon className="w-4 h-4 text-slate-400" />}
        </button>

        {openMoreFilters && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Regional connectivity
              </label>
              <select
                value={connectivityFilter}
                onChange={(e) => setConnectivityFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value="">All connections</option>
                <option value="direct-africa">Direct Africa route</option>
                <option value="same-country">Same-country connection</option>
                <option value="cross-border">Cross-border connection</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Visa policy
              </label>
              <select
                value={visaFilter}
                onChange={(e) => setVisaFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value="">Any visa policy</option>
                <option value="visa-free">Visa-free</option>
                <option value="visa-on-arrival">Visa on arrival</option>
                <option value="evisa">eVisa available</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Payment method
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value="">Any payment method</option>
                <option value="local-currency">Local currency</option>
                <option value="mobile-money">M-Pesa / Mobile Money</option>
                <option value="bank-transfer">Instant EFT / Bank transfer</option>
                <option value="card">Visa / Mastercard</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Route Summary Header Bar matching Reference Design */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex flex-wrap items-center gap-2">
            <span>
              {originHub?.city || search.origin} ({search.origin})
            </span>
            <ArrowRightIcon className="w-5 h-5 text-slate-500 shrink-0" />
            <span>
              {isAnywhere
                ? search.destination === 'ANYWHERE_AFRICA'
                  ? 'Anywhere in Africa'
                  : 'Anywhere in the World'
                : `${destHub?.city || search.destination} (${search.destination})`}
            </span>
          </h2>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span className="tabular-nums">
              {formatShortDate(search.departDate)}
              {search.tripType === 'round-trip' && search.returnDate
                ? ` – ${formatShortDate(search.returnDate)}`
                : ''}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {search.adults + search.children + search.infants}{' '}
              {search.adults + search.children + search.infants === 1 ? 'Adult' : 'Travellers'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{search.cabin}</span>
            <span aria-hidden="true">|</span>
            <button
              type="button"
              onClick={onModifySearch}
              className="inline-flex items-center gap-1 font-semibold text-[#008F45] hover:underline"
            >
              <span>Modify search</span>
              <PencilIcon className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenPriceAlert(tabStats.cheapestZar)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#008F45] transition-colors"
          >
            <BellAlertIcon className="w-4 h-4 text-slate-500" />
            <span>Track prices</span>
            <span
              className={`w-8 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                hasActivePriceAlert ? 'bg-[#008F45] justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-white shadow-2xs" />
            </span>
          </button>

          <button
            type="button"
            onClick={handleShareItinerary}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ShareIcon className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Anywhere Budget Discovery Mode */}
      {isAnywhere && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#008F45]">
                Explore Flights Across Africa
              </p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Where can {formatZar(anywhereBudgetZar)} take you from {originHub?.city || search.origin}?
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">Budget cap:</span>
              <input
                type="range"
                min={2000}
                max={8000}
                step={500}
                value={anywhereBudgetZar}
                onChange={(e) => setAnywhereBudgetZar(Number(e.target.value))}
                className="w-36 accent-[#008F45]"
              />
              <span className="text-xs font-mono font-bold text-[#008F45] tabular-nums">
                {formatZar(anywhereBudgetZar)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ANYWHERE_DESTINATIONS.filter((d) => d.fromZar <= anywhereBudgetZar).map((dest) => (
              <button
                key={dest.code}
                type="button"
                onClick={() => onSelectAnywhereDestination(dest.code)}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-[#008F45] text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#008F45]">
                    {dest.city}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#008F45]">
                    {formatZar(dest.fromZar)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{dest.country}</p>
                <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 mt-2">
                  {dest.tag} · {dest.badge}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Action Bar */}
      <div className="flex lg:hidden items-center justify-between gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
        >
          <AdjustmentsHorizontalIcon className="w-4 h-4 text-[#008F45]" />
          Filters
        </button>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {(['recommended', 'cheapest', 'fastest'] as ResultSortTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSortTab(tab)}
              className={`px-2.5 py-1.5 rounded-lg capitalize ${
                sortTab === tab
                  ? 'bg-[#008F45] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Column Results Grid matching Reference Design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Filters Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sticky top-20">
          {renderFiltersBody()}
        </aside>

        {/* Center Results Column */}
        <div className="lg:col-span-6 space-y-3.5">
          {/* 3-Tab Sort Bar with Crisp Green Active Underline */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
            {(
              [
                {
                  id: 'recommended',
                  title: 'Recommended',
                  sub: 'Best balance of price & duration',
                },
                {
                  id: 'cheapest',
                  title: 'Cheapest',
                  sub: `From ${formatZar(tabStats.cheapestZar)}`,
                },
                {
                  id: 'fastest',
                  title: 'Fastest',
                  sub: `From ${formatZar(tabStats.fastestZar)}`,
                },
              ] as const
            ).map((tab) => {
              const active = sortTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSortTab(tab.id)}
                  className={`px-4 py-3 text-left transition-colors border-b-2 ${
                    active
                      ? 'border-[#008F45] bg-white dark:bg-slate-900'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <p
                    className={`text-xs sm:text-sm font-bold ${
                      active ? 'text-[#008F45]' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {tab.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 tabular-nums">
                    {tab.sub}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Count + Sort By Row */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-600 dark:text-slate-400 font-medium tabular-nums">
              {filteredFlights.length} flights found
            </span>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span>Sort by:</span>
              <select
                value={sortTab}
                onChange={(e) => setSortTab(e.target.value as ResultSortTab)}
                className="font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="cheapest">Cheapest</option>
                <option value="fastest">Fastest</option>
              </select>
            </div>
          </div>

          {/* Flight Result Cards */}
          {filteredFlights.length > 0 ? (
            <div className="space-y-3">
              {filteredFlights.map((flight, idx) => {
                const adultPrice = computeAdultZar(flight);
                const isExpanded = expandedCardId === flight.id;
                const badgeLabel =
                  idx === 0 && sortTab === 'recommended'
                    ? 'Best value'
                    : idx === 0 && sortTab === 'cheapest'
                    ? 'Cheapest'
                    : null;

                const [arrivalClock, arrivalDayShift] = flight.arrivalTime.split(' ');

                return (
                  <div
                    key={flight.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-[#008F45]/60 transition-colors"
                  >
                    <div className="p-4 sm:p-5 space-y-4">
                      {badgeLabel && (
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded bg-[#E8F7EF] dark:bg-emerald-950/70 text-[#008F45] dark:text-emerald-300 text-[11px] font-semibold">
                            {badgeLabel}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        {/* Airline Mark + Name */}
                        <div className="sm:col-span-4 flex items-center gap-2.5 min-w-0">
                          <AirlineMark code={flight.airlineCode} name={flight.airline} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {flight.airline}
                            </p>
                          </div>
                        </div>

                        {/* Route Times Timeline */}
                        <div className="sm:col-span-5 grid grid-cols-12 items-center gap-2">
                          <div className="col-span-4">
                            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums leading-tight">
                              {flight.departureTime}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              {flight.origin}
                            </p>
                          </div>

                          <div className="col-span-4 text-center">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                              {formatMinutes(flight.durationMinutes)}
                            </p>
                            <div className="relative h-px bg-slate-300 dark:bg-slate-600 my-1.5 flex items-center justify-center">
                              {flight.stops > 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                              )}
                            </div>
                            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                              {flight.stops === 0
                                ? 'Direct'
                                : `${flight.stops} stop ${flight.stopHub || ''}`}
                            </p>
                          </div>

                          <div className="col-span-4 text-right">
                            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums leading-tight">
                              {arrivalClock}
                              {arrivalDayShift && (
                                <sup className="text-[10px] font-bold text-[#008F45] ml-0.5">
                                  {arrivalDayShift}
                                </sup>
                              )}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              {flight.destination}
                            </p>
                          </div>
                        </div>

                        {/* Fare Total */}
                        <div className="sm:col-span-3 text-left sm:text-right">
                          <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums leading-tight">
                            {formatZar(adultPrice)}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">per adult</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            Total price incl. taxes
                          </p>
                        </div>
                      </div>

                      {/* Footer Row: Details & baggage + Select -> */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => setExpandedCardId(isExpanded ? null : flight.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#008F45] hover:underline"
                        >
                          <span>Details &amp; baggage</span>
                          {isExpanded ? (
                            <ChevronUpIcon className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDownIcon className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectFlight(flight, adultPrice)}
                          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#008F45] hover:bg-[#006B35] text-white text-xs font-bold transition-colors whitespace-nowrap"
                        >
                          <span>Select</span>
                          <ArrowRightIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Flight Details & Baggage Drawer */}
                    {isExpanded && (
                      <div className="bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 p-5 space-y-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Flight Details &amp; Layover Breakdown
                        </p>

                        <div className="space-y-3">
                          {flight.segments.map((seg, sIdx) => (
                            <div key={`${flight.id}-seg-${sIdx}`} className="space-y-2">
                              <div className="flex items-start gap-3">
                                <div className="flex flex-col items-center pt-1">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#008F45]" />
                                  <span className="w-px h-10 bg-slate-300 dark:bg-slate-700 my-1" />
                                  <span className="w-2.5 h-2.5 rounded-full border-2 border-[#008F45]" />
                                </div>
                                <div className="flex-1 text-xs space-y-1">
                                  <p className="font-bold text-slate-900 dark:text-white">
                                    {seg.from} {seg.departTime}{' '}
                                    <span className="font-normal text-slate-500">· {seg.fromAirport}</span>
                                  </p>
                                  <p className="text-[11px] font-mono text-slate-500">
                                    <ClockIcon className="w-3.5 h-3.5 inline mr-1" />
                                    {formatMinutes(seg.durationMinutes)} · {seg.carrier} {seg.flightNumber} ({seg.aircraft})
                                  </p>
                                  <p className="font-bold text-slate-900 dark:text-white">
                                    {seg.to} {seg.arriveTime}{' '}
                                    <span className="font-normal text-slate-500">· {seg.toAirport}</span>
                                  </p>
                                </div>
                              </div>

                              {seg.layoverMinutes && (
                                <div className="ml-6 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] font-semibold text-amber-800 dark:text-amber-300 inline-block">
                                  Connection in {seg.layoverCity}: {formatMinutes(seg.layoverMinutes)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                          <div>
                            <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">BAGGAGE</p>
                            <p className="text-slate-600 dark:text-slate-400">
                              ✓ Cabin: {flight.cabinBaggageKg}kg · ✓ Checked: {flight.checkedBaggageKg}kg
                            </p>
                          </div>
                          <div>
                            <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">FARE CONDITIONS</p>
                            <p className="text-slate-600 dark:text-slate-400">
                              {flight.changeAvailable ? '✓ Changes available' : '✕ No changes'} ·{' '}
                              {flight.refundable ? '✓ Refundable option' : '✕ Non-refundable on Basic'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
              <p className="text-base font-bold text-slate-900 dark:text-white">
                No flights match your active filters
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Try clearing stops or airline filters to reveal available routes.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-4 py-2 rounded-xl bg-[#008F45] text-white text-xs font-bold"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Right Rail matching Reference Image */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Card 1: Travel with confidence */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Travel with confidence
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E8F7EF] dark:bg-emerald-950/60 text-[#008F45] flex items-center justify-center shrink-0">
                  <LockClosedIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">All prices are final</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">No hidden fees</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E8F7EF] dark:bg-emerald-950/60 text-[#008F45] flex items-center justify-center shrink-0">
                  <ArrowPathIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Flexible booking</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Change or cancel easily
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E8F7EF] dark:bg-emerald-950/60 text-[#008F45] flex items-center justify-center shrink-0">
                  <PhoneIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">24/7 support</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    We&apos;re here anytime
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Visa & travel info */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                Visa &amp; travel info for {visaInfo.country}
              </h3>
              <span className="text-lg leading-none shrink-0">{visaInfo.flag}</span>
            </div>

            <div className="space-y-1.5">
              <select
                value={passportNationality}
                onChange={(e) => setPassportNationality(e.target.value)}
                aria-label="Select passport nationality"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
              >
                <option value="South Africa">South African passport holders</option>
                <option value="Nigeria">Nigerian passport holders</option>
                <option value="Kenya">Kenyan passport holders</option>
                <option value="Ghana">Ghanaian passport holders</option>
                <option value="Default">Other / International passport</option>
              </select>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {visaRule.requirement}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsVisaModalOpen(true)}
              className="w-full py-2.5 rounded-lg bg-[#008F45] hover:bg-[#006B35] text-white text-xs font-bold transition-colors"
            >
              View visa requirements
            </button>

            <button
              type="button"
              onClick={() => setIsVisaModalOpen(true)}
              className="block text-xs font-semibold text-[#008F45] hover:underline"
            >
              See entry rules &amp; health info
            </button>
          </div>

          {/* Card 3: Explore top deals Dark Navy Banner */}
          <div className="bg-[#0D1E31] text-white rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold">Explore top deals</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Be the first to know about exclusive flight deals.
            </p>
            <form onSubmit={handleDealsEmailSubmit} className="flex items-stretch">
              <input
                type="email"
                required
                value={dealsEmail}
                onChange={(e) => setDealsEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 min-w-0 px-3 py-2 rounded-l-lg bg-white text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Subscribe to flight deals"
                className="px-3.5 py-2 rounded-r-lg bg-[#008F45] hover:bg-[#006B35] text-white flex items-center justify-center transition-colors shrink-0"
              >
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Card 4: Compact AfriEstate AI Flight Advisor Toggle */}
          {topThreeAdvisor && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <button
                type="button"
                onClick={() => setIsAiExpanded((v) => !v)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white"
              >
                <span className="inline-flex items-center gap-1.5">
                  <SparklesIcon className="w-4 h-4 text-[#008F45]" />
                  AfriEstate AI Route Advisor
                </span>
                {isAiExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
              </button>

              {isAiExpanded && (
                <div className="space-y-3 pt-1 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#E8F7EF] dark:bg-emerald-950/50 text-[#006B35] dark:text-emerald-300">
                    <p className="font-bold">
                      Best overall: {topThreeAdvisor.bestOverall.airline} ·{' '}
                      {formatZar(computeAdultZar(topThreeAdvisor.bestOverall))}
                    </p>
                  </div>
                  <form onSubmit={handleAiPromptSubmit} className="flex gap-1.5">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. Cheapest direct JNB to NBO"
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-[#008F45] text-white font-bold shrink-0"
                    >
                      Ask
                    </button>
                  </form>
                  {aiRecommendationNote && (
                    <p className="text-[11px] text-[#008F45] font-medium">{aiRecommendationNote}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Popular & Recommended Visual Destinations Strip (matches mobile preview & adds photo depth) */}
      <section className="pt-2 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Popular from {originHub?.city || search.origin}
              </h3>
              <button
                type="button"
                onClick={() => onSelectAnywhereDestination('ANYWHERE_AFRICA')}
                className="text-xs font-semibold text-[#008F45] hover:underline"
              >
                View all
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { code: 'JNB', city: 'Johannesburg', fromZar: 1199, img: DESTINATION_PHOTOS.JNB },
                { code: 'NBO', city: 'Nairobi', fromZar: 2699, img: DESTINATION_PHOTOS.NBO },
                { code: 'ACC', city: 'Accra', fromZar: 2250, img: DESTINATION_PHOTOS.ACC },
              ].map((card) => (
                <button
                  key={card.code}
                  type="button"
                  onClick={() => onSelectAnywhereDestination(card.code)}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left hover:border-[#008F45] transition-colors group"
                >
                  <div className="h-28 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={card.img}
                      alt={`${card.city} skyline`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{card.city}</p>
                    <p className="text-[11px] font-semibold text-[#008F45] mt-0.5 tabular-nums">
                      From {formatZar(card.fromZar)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recommended for you
              </h3>
              <button
                type="button"
                onClick={() => onSelectAnywhereDestination('LOS')}
                className="text-xs font-semibold text-[#008F45] hover:underline"
              >
                View all
              </button>
            </div>
            <button
              type="button"
              onClick={() => onSelectAnywhereDestination('LOS')}
              className="relative flex-1 min-h-[164px] rounded-xl overflow-hidden text-left group border border-slate-200 dark:border-slate-800"
            >
              <img
                src={DESTINATION_PHOTOS.LOS}
                alt="Lagos lagoon skyline at sunset"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4 flex flex-col justify-between">
                <span className="inline-flex w-7 h-5 rounded bg-white/90 items-center justify-center text-xs shadow-xs">
                  🇳🇬
                </span>
                <div className="flex items-end justify-between gap-2 text-white">
                  <div>
                    <p className="text-lg font-bold leading-tight">Lagos</p>
                    <p className="text-xs text-slate-200 tabular-nums">
                      From {formatZar(2199)}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-200">
                    <p className="font-semibold">Return</p>
                    <p>Flexible fare</p>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Mobile Bottom-Sheet Filters Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:hidden">
          <div className="bg-white dark:bg-slate-900 w-full max-h-[85vh] rounded-t-2xl p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold">Filter Departures</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            {renderFiltersBody()}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full py-3 rounded-xl bg-[#008F45] text-white text-xs font-bold"
            >
              Show {filteredFlights.length} Flights
            </button>
          </div>
        </div>
      )}

      {/* Visa Details Modal */}
      {isVisaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#008F45]">
                  Visa &amp; Entry Intelligence
                </p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {visaInfo.flag} {visaInfo.country} ({passportNationality} Passport)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVisaModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <p>
                <strong className="text-slate-900 dark:text-white">Entry Rule:</strong>{' '}
                {visaRule.requirement}
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">Permitted Stay:</strong>{' '}
                {visaRule.stayLimit}
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">Processing Window:</strong>{' '}
                {visaRule.processingTime}
              </p>
              <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 leading-relaxed">
                {visaRule.notes}
              </p>
              <p className="text-[11px] text-slate-400 pt-1">
                <InformationCircleIcon className="w-3.5 h-3.5 inline mr-1" />
                Source: {visaInfo.source} · Last updated {visaInfo.lastUpdated}. Guidance only.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsVisaModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#008F45] text-white text-xs font-bold"
            >
              Close Entry Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightResultsView;
