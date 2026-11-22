import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  ArrowsRightLeftIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GlobeAltIcon,
  HomeModernIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  MinusIcon,
  PaperAirplaneIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  HUBS,
  zarToUsd,
  type AirportHub,
  type CabinClass,
  type FlexibleMode,
  type MultiCityLeg,
  type TripType,
} from './flightData';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fetchJsonStrict } from '../../lib/http';

export interface FlightSearchParams {
  tripType: TripType;
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
  flexibleMode: FlexibleMode;
  adults: number;
  children: number;
  infants: number;
  cabin: CabinClass;
  multiCityLegs: MultiCityLeg[];
}

interface FlightSearchWidgetProps {
  value: FlightSearchParams;
  onChange: (next: FlightSearchParams) => void;
  onSearch: () => void;
  onSwitchVertical?: (vertical: 'hotels' | 'stays' | 'experiences') => void;
  compact?: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function getDaysMatrix(year: number, monthIndex: number): (number | null)[] {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const mondayOffset = (firstDay + 6) % 7;
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < mondayOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  return cells;
}

function toIsoDate(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function formatReadableDateParts(iso: string): { dateLabel: string; weekday: string } {
  if (!iso) return { dateLabel: 'Select date', weekday: '' };
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return { dateLabel: iso, weekday: '' };
  const dateObj = new Date(y, m - 1, d);
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  return {
    dateLabel: `${d} ${MONTH_NAMES[m - 1].slice(0, 3)} ${y}`,
    weekday,
  };
}

function getDailyEstimateZar(day: number, monthIndex: number): number {
  const base = 2399;
  const offsets = [180, -300, -149, 200, 400, -90, 50, -240, 120, -300, 90, 310];
  const offset = offsets[(day + monthIndex * 3) % offsets.length];
  return Math.max(1799, base + offset);
}

const RECENT_ROUTES = [
  { origin: 'CPT', destination: 'LOS', label: 'Cape Town (CPT) -> Lagos (LOS)', fareZar: 2399 },
  { origin: 'JNB', destination: 'NBO', label: 'Johannesburg (JNB) -> Nairobi (NBO)', fareZar: 3199 },
  { origin: 'CPT', destination: 'ACC', label: 'Cape Town (CPT) -> Accra (ACC)', fareZar: 2250 },
];

const FlightSearchWidget: React.FC<FlightSearchWidgetProps> = ({
  value,
  onChange,
  onSearch,
  onSwitchVertical,
  compact = false,
}) => {
  const { formatCurrency } = useCurrency();
  const formatZar = (zar: number) => formatCurrency(zarToUsd(zar));

  const [openPicker, setOpenPicker] = useState<
    'origin' | 'destination' | 'dates' | 'travellers' | 'recent' | null
  >(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [recentCodes, setRecentCodes] = useState<string[]>(['CPT', 'LOS', 'NBO', 'JNB']);
  const [swapRotated, setSwapRotated] = useState(false);
  const [calendarBaseMonth, setCalendarBaseMonth] = useState(() => ({ year: 2027, month: 5 }));
  const [selectingField, setSelectingField] = useState<'depart' | 'return'>('depart');
  const [remoteAirports, setRemoteAirports] = useState<AirportHub[]>([]);
  const [airportSearchLoading, setAirportSearchLoading] = useState(false);
  const [airportProviderLabel, setAirportProviderLabel] = useState<string | null>(null);
  const [externalHubCache, setExternalHubCache] = useState<Record<string, AirportHub>>({});

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenPicker(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    const q = locationQuery.trim();
    const isAirportPickerOpen = openPicker === 'origin' || openPicker === 'destination';
    if (!isAirportPickerOpen || q.length < 2) {
      setRemoteAirports([]);
      setAirportSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setAirportSearchLoading(true);
      try {
        const res = await fetchJsonStrict<{
          airports?: Array<{ code: string; city: string; country: string; airport: string }>;
          providerUsed?: string;
        }>(`/api/travel/airports/search?query=${encodeURIComponent(q)}`, {
          timeoutMs: 10000,
          retries: 0,
          signal: controller.signal,
        });
        const mapped: AirportHub[] = (res.airports || []).map((a) => ({
          code: a.code,
          city: a.city,
          country: a.country,
          countryCode: a.code.slice(0, 2),
          region: 'International',
          airport: a.airport,
          flag: '',
          popular: false,
          terminalNote: res.providerUsed || 'Global International Terminal',
          avgWeatherC: 21,
        }));
        setRemoteAirports(mapped);
        setAirportProviderLabel(res.providerUsed || 'TripAdvisor Flights Search API');
      } catch {
        setRemoteAirports([]);
      } finally {
        setAirportSearchLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [locationQuery, openPicker]);

  const originHub = useMemo(
    () => HUBS.find((h) => h.code === value.origin) || externalHubCache[value.origin],
    [value.origin, externalHubCache]
  );
  const destHub = useMemo(
    () => HUBS.find((h) => h.code === value.destination) || externalHubCache[value.destination],
    [value.destination, externalHubCache]
  );

  const filteredHubs = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q) return HUBS;
    const localMatches = HUBS.filter(
      (h) =>
        h.city.toLowerCase().includes(q) ||
        h.code.toLowerCase().includes(q) ||
        h.country.toLowerCase().includes(q) ||
        h.airport.toLowerCase().includes(q)
    );
    const localCodes = new Set(localMatches.map((h) => h.code));
    const remoteUnique = remoteAirports.filter((r) => !localCodes.has(r.code));
    return [...localMatches, ...remoteUnique];
  }, [locationQuery, remoteAirports]);

  const handleSelectLocation = (field: 'origin' | 'destination', code: string, hubObj?: AirportHub) => {
    if (hubObj && !HUBS.some((h) => h.code === hubObj.code)) {
      setExternalHubCache((prev) => ({ ...prev, [hubObj.code]: hubObj }));
    }
    if (field === 'origin') {
      onChange({ ...value, origin: code });
      setRecentCodes((prev) => [code, ...prev.filter((c) => c !== code)].slice(0, 4));
    } else {
      onChange({ ...value, destination: code });
      if (!code.startsWith('ANYWHERE')) {
        setRecentCodes((prev) => [code, ...prev.filter((c) => c !== code)].slice(0, 4));
      }
    }
    setLocationQuery('');
    setRemoteAirports([]);
    setOpenPicker(null);
  };

  const handleSwap = () => {
    if (value.destination.startsWith('ANYWHERE')) return;
    setSwapRotated((r) => !r);
    onChange({
      ...value,
      origin: value.destination,
      destination: value.origin,
    });
  };

  const handleDaySelect = (iso: string) => {
    if (value.tripType === 'one-way') {
      onChange({ ...value, departDate: iso });
      setOpenPicker(null);
      return;
    }

    if (selectingField === 'depart' || iso < value.departDate) {
      const nextReturn = value.returnDate && value.returnDate >= iso ? value.returnDate : iso;
      onChange({ ...value, departDate: iso, returnDate: nextReturn });
      setSelectingField('return');
    } else {
      onChange({ ...value, returnDate: iso });
      setSelectingField('depart');
    }
  };

  const secondMonth = useMemo(() => {
    const nextM = calendarBaseMonth.month + 1;
    return nextM > 11
      ? { year: calendarBaseMonth.year + 1, month: 0 }
      : { year: calendarBaseMonth.year, month: nextM };
  }, [calendarBaseMonth]);

  const departParts = formatReadableDateParts(value.departDate);
  const returnParts = formatReadableDateParts(value.returnDate);
  const totalTravellers = value.adults + value.children + value.infants;
  const travellerCountText = `${totalTravellers} ${totalTravellers === 1 ? 'Adult' : 'Travellers'}`;

  const renderLocationModal = (field: 'origin' | 'destination') => {
    const nearbyHubs = (originHub?.nearbyCodes || ['JNB', 'DUR'])
      .map((code) => HUBS.find((h) => h.code === code))
      .filter(Boolean) as AirportHub[];
    const popularHubs = HUBS.filter((h) => h.popular);

    return (
      <div
        role="dialog"
        aria-label={field === 'origin' ? 'Where are you flying from?' : 'Where are you flying to?'}
        className="absolute left-0 top-full mt-2 w-full sm:w-[390px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 p-4 text-left"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            {field === 'origin' ? 'Where are you flying from?' : 'Where are you flying to?'}
          </p>
          <button
            type="button"
            onClick={() => setOpenPicker(null)}
            aria-label="Close airport picker"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="relative mb-3">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            placeholder="Search city, airport or country..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#008F45]"
          />
        </div>

        <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
          {field === 'destination' && !locationQuery.trim() && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#008F45]">
                Explore Anywhere
              </p>
              <button
                type="button"
                onClick={() => handleSelectLocation('destination', 'ANYWHERE_AFRICA')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#E8F7EF] dark:bg-emerald-950/50 text-[#006B35] dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-semibold transition-colors"
              >
                <span className="flex items-center gap-2">
                  <GlobeAltIcon className="w-4 h-4 shrink-0" />
                  Anywhere in Africa
                </span>
                <span className="text-[11px] font-mono">Explore fares</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectLocation('destination', 'ANYWHERE_WORLD')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition-colors"
              >
                <span className="flex items-center gap-2">
                  <GlobeAltIcon className="w-4 h-4 shrink-0" />
                  Anywhere in the World
                </span>
                <span className="text-[11px] font-mono">Global routes</span>
              </button>
            </div>
          )}

          {locationQuery.trim() ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Matching Airports ({filteredHubs.length})
                </p>
                {airportSearchLoading ? (
                  <span className="text-[10px] text-[#008F45] font-medium">Searching global airports...</span>
                ) : remoteAirports.length > 0 && airportProviderLabel ? (
                  <span className="text-[10px] text-slate-400 truncate max-w-[170px]">{airportProviderLabel}</span>
                ) : null}
              </div>
              {filteredHubs.length > 0 ? (
                filteredHubs.map((hub) => (
                  <button
                    key={hub.code}
                    type="button"
                    onClick={() => handleSelectLocation(field, hub.code, hub)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {hub.city} · {hub.country}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {hub.airport}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#008F45] ml-2 shrink-0">
                      {hub.code}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">
                  {airportSearchLoading ? 'Querying global airports...' : 'No matching airports found.'}
                </p>
              )}
            </div>
          ) : (
            <>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Recent
                </p>
                <div className="space-y-0.5">
                  {recentCodes.map((code) => {
                    const hub = HUBS.find((h) => h.code === code);
                    if (!hub) return null;
                    return (
                      <button
                        key={`rec-${hub.code}`}
                        type="button"
                        onClick={() => handleSelectLocation(field, hub.code)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {hub.flag} {hub.city} · <span className="font-mono text-slate-500">{hub.code}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[140px]">{hub.country}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Popular African Hubs
                </p>
                <div className="grid grid-cols-1 gap-0.5">
                  {popularHubs.map((hub) => (
                    <button
                      key={`pop-${hub.code}`}
                      type="button"
                      onClick={() => handleSelectLocation(field, hub.code)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {hub.flag} {hub.city} · <span className="font-mono font-bold text-[#008F45]">{hub.code}</span>
                      </span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[140px]">{hub.country}</span>
                    </button>
                  ))}
                </div>
              </div>

              {nearbyHubs.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nearby Airports
                  </p>
                  {nearbyHubs.map((hub) => (
                    <button
                      key={`near-${hub.code}`}
                      type="button"
                      onClick={() => handleSelectLocation(field, hub.code)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
                    >
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {hub.airport} · <span className="font-mono font-semibold">{hub.code}</span>
                      </span>
                      <span className="text-[11px] text-slate-400">Alt.</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderCalendarMonth = (year: number, monthIndex: number) => {
    const cells = getDaysMatrix(year, monthIndex);
    const prices = cells.map((d) => (d ? getDailyEstimateZar(d, monthIndex) : 999999));
    const minMonthPrice = Math.min(...prices);

    return (
      <div className="flex-1 min-w-[260px]">
        <p className="text-xs font-bold uppercase tracking-wider text-center text-slate-800 dark:text-slate-100 mb-3">
          {MONTH_NAMES[monthIndex]} {year}
        </p>
        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
          {WEEKDAYS.map((w) => (
            <span key={w} className="text-[10px] font-semibold text-slate-400">
              {w}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="h-11" />;
            const iso = toIsoDate(year, monthIndex, day);
            const estZar = getDailyEstimateZar(day, monthIndex);
            const isCheapest = estZar === minMonthPrice;
            const isSelectedStart = value.departDate === iso;
            const isSelectedEnd = value.tripType === 'round-trip' && value.returnDate === iso;
            const isInRange =
              value.tripType === 'round-trip' &&
              value.departDate &&
              value.returnDate &&
              iso > value.departDate &&
              iso < value.returnDate;

            return (
              <button
                key={iso}
                type="button"
                onClick={() => handleDaySelect(iso)}
                className={`h-11 rounded-lg flex flex-col items-center justify-center transition-colors border ${
                  isSelectedStart || isSelectedEnd
                    ? 'bg-[#008F45] text-white border-[#008F45] font-bold'
                    : isInRange
                    ? 'bg-[#E8F7EF] dark:bg-emerald-950/60 text-[#006B35] dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent text-slate-800 dark:text-slate-200'
                }`}
              >
                <span className="text-xs font-semibold leading-none">{day}</span>
                <span
                  className={`text-[9px] font-mono tabular-nums mt-0.5 leading-none ${
                    isSelectedStart || isSelectedEnd
                      ? 'text-emerald-100'
                      : isCheapest
                      ? 'text-[#008F45] dark:text-emerald-400 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  {formatCurrency(zarToUsd(estZar)).replace(/\.\d+$/, '')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_14px_40px_-12px_rgba(15,23,42,0.14)] overflow-visible"
    >
      {/* Mobile Vertical Switcher matching the right-side Mobile Preview in design reference */}
      {!compact && onSwitchVertical && (
        <div className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-800 md:hidden">
          <button
            type="button"
            className="flex flex-col items-center justify-center py-2.5 text-[11px] font-semibold text-[#008F45] border-b-2 border-[#008F45] bg-[#E8F7EF]/40 dark:bg-emerald-950/30"
          >
            <PaperAirplaneIcon className="w-4 h-4 mb-0.5" />
            Flights
          </button>
          <button
            type="button"
            onClick={() => onSwitchVertical('hotels')}
            className="flex flex-col items-center justify-center py-2.5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
          >
            <BuildingOffice2Icon className="w-4 h-4 mb-0.5" />
            Hotels
          </button>
          <button
            type="button"
            onClick={() => onSwitchVertical('stays')}
            className="flex flex-col items-center justify-center py-2.5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
          >
            <HomeModernIcon className="w-4 h-4 mb-0.5" />
            Stays
          </button>
          <button
            type="button"
            onClick={() => onSwitchVertical('experiences')}
            className="flex flex-col items-center justify-center py-2.5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
          >
            <SparklesIcon className="w-4 h-4 mb-0.5" />
            Experiences
          </button>
        </div>
      )}

      <div className="p-4 sm:p-5 space-y-4">
        {/* Top Row: Clean Underline Trip Mode Tabs + Recent Searches */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-6">
            {(
              [
                { id: 'round-trip', label: 'Return' },
                { id: 'one-way', label: 'One way' },
                { id: 'multi-city', label: 'Multi-city' },
              ] as { id: TripType; label: string }[]
            ).map((mode) => {
              const isActive = value.tripType === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onChange({ ...value, tripType: mode.id })}
                  className={`pb-2 -mb-[11px] text-xs sm:text-sm transition-colors whitespace-nowrap border-b-2 ${
                    isActive
                      ? 'border-[#008F45] text-slate-900 dark:text-white font-semibold'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 relative">
            {value.flexibleMode !== 'exact' && (
              <span className="text-[11px] font-semibold text-[#008F45] hidden sm:inline">
                Flexible:{' '}
                {value.flexibleMode === 'plus-minus-1'
                  ? '±1 day'
                  : value.flexibleMode === 'plus-minus-3'
                  ? '±3 days'
                  : 'Cheapest month'}
              </span>
            )}
            <button
              type="button"
              onClick={() => setOpenPicker(openPicker === 'recent' ? null : 'recent')}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              <span>Recent searches</span>
              <ChevronDownIcon className="w-3.5 h-3.5" />
            </button>

            {openPicker === 'recent' && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 p-2 space-y-1">
                {RECENT_ROUTES.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      onChange({ ...value, origin: item.origin, destination: item.destination });
                      setOpenPicker(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {item.label}
                    </span>
                    <span className="font-mono font-semibold text-[#008F45] shrink-0 ml-2">
                      {formatZar(item.fareZar)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Joined Segmented Input Row + Green Search CTA */}
        <div className="flex flex-col xl:flex-row items-stretch gap-3 relative">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700 relative">
            {/* From */}
            <div className="md:col-span-3 relative">
              <button
                type="button"
                onClick={() => setOpenPicker(openPicker === 'origin' ? null : 'origin')}
                className="w-full h-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/60 rounded-t-xl md:rounded-l-xl md:rounded-tr-none transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#008F45]"
              >
                <PaperAirplaneIcon className="w-4 h-4 text-slate-400 shrink-0 -rotate-12" />
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-medium text-slate-400 leading-tight">
                    From
                  </span>
                  <span className="block text-[13px] font-bold text-slate-900 dark:text-white truncate">
                    {originHub ? `${originHub.city} (${originHub.code})` : value.origin}
                  </span>
                  <span className="block text-[11px] text-slate-400 truncate">
                    {originHub?.country || 'Select origin'}
                  </span>
                </div>
              </button>
              {openPicker === 'origin' && renderLocationModal('origin')}

              {/* Floating Swap Circle straddling divider */}
              <button
                type="button"
                onClick={handleSwap}
                aria-label="Swap origin and destination"
                disabled={value.destination.startsWith('ANYWHERE')}
                className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#008F45] text-slate-600 dark:text-slate-200 items-center justify-center shadow-xs transition-all disabled:opacity-40"
              >
                <ArrowsRightLeftIcon
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${swapRotated ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {/* To */}
            <div className="md:col-span-3 relative">
              <button
                type="button"
                onClick={() => setOpenPicker(openPicker === 'destination' ? null : 'destination')}
                className="w-full h-full flex items-center gap-2.5 pl-3.5 md:pl-5 pr-3.5 py-2.5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#008F45]"
              >
                <MapPinIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-medium text-slate-400 leading-tight">
                    To
                  </span>
                  <span className="block text-[13px] font-bold text-slate-900 dark:text-white truncate">
                    {value.destination === 'ANYWHERE_AFRICA'
                      ? 'Anywhere in Africa'
                      : value.destination === 'ANYWHERE_WORLD'
                      ? 'Anywhere in World'
                      : destHub
                      ? `${destHub.city} (${destHub.code})`
                      : value.destination}
                  </span>
                  <span className="block text-[11px] text-slate-400 truncate">
                    {value.destination.startsWith('ANYWHERE')
                      ? 'Explore lowest fares'
                      : destHub?.country || 'Select destination'}
                  </span>
                </div>
              </button>
              {openPicker === 'destination' && renderLocationModal('destination')}
            </div>

            {/* Depart & Return */}
            <div className="md:col-span-4 grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700 relative">
              <button
                type="button"
                onClick={() => {
                  setSelectingField('depart');
                  setOpenPicker(openPicker === 'dates' ? null : 'dates');
                }}
                className="flex items-center gap-2 px-3.5 py-2.5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#008F45]"
              >
                <CalendarDaysIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[10px] font-medium text-slate-400 leading-tight">
                    Depart
                  </span>
                  <span className="block text-[13px] font-bold text-slate-900 dark:text-white truncate tabular-nums">
                    {departParts.dateLabel}
                  </span>
                  <span className="block text-[11px] text-slate-400">{departParts.weekday || 'Flexible'}</span>
                </div>
              </button>

              <button
                type="button"
                disabled={value.tripType === 'one-way'}
                onClick={() => {
                  setSelectingField('return');
                  setOpenPicker(openPicker === 'dates' ? null : 'dates');
                }}
                className="flex items-center gap-2 px-3.5 py-2.5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors disabled:opacity-45 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#008F45]"
              >
                <CalendarDaysIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[10px] font-medium text-slate-400 leading-tight">
                    Return
                  </span>
                  <span className="block text-[13px] font-bold text-slate-900 dark:text-white truncate tabular-nums">
                    {value.tripType === 'one-way' ? 'One way' : returnParts.dateLabel}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    {value.tripType === 'one-way' ? 'No return leg' : returnParts.weekday || 'Return'}
                  </span>
                </div>
              </button>

              {openPicker === 'dates' && (
                <div
                  role="dialog"
                  aria-label="Select your flight dates"
                  className="absolute left-0 lg:-left-20 top-full mt-2 w-full sm:w-[600px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Select your dates
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Estimated lowest fares shown underneath each date
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarBaseMonth((prev) =>
                            prev.month === 0
                              ? { year: prev.year - 1, month: 11 }
                              : { year: prev.year, month: prev.month - 1 }
                          )
                        }
                        aria-label="Previous month"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <ChevronLeftIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarBaseMonth((prev) =>
                            prev.month === 11
                              ? { year: prev.year + 1, month: 0 }
                              : { year: prev.year, month: prev.month + 1 }
                          )
                        }
                        aria-label="Next month"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">
                    {renderCalendarMonth(calendarBaseMonth.year, calendarBaseMonth.month)}
                    {renderCalendarMonth(secondMonth.year, secondMonth.month)}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Flexible dates:
                      </span>
                      {(
                        [
                          { id: 'exact', label: 'Exact dates' },
                          { id: 'plus-minus-1', label: '±1 day' },
                          { id: 'plus-minus-3', label: '±3 days' },
                          { id: 'cheapest-month', label: 'Cheapest month' },
                        ] as { id: FlexibleMode; label: string }[]
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => onChange({ ...value, flexibleMode: opt.id })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                            value.flexibleMode === opt.id
                              ? 'bg-[#008F45] text-white border-[#008F45]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenPicker(null)}
                      className="px-4 py-2 rounded-xl bg-[#008F45] hover:bg-[#006B35] text-white text-xs font-bold"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Travellers & Class */}
            <div className="md:col-span-2 relative">
              <button
                type="button"
                onClick={() => setOpenPicker(openPicker === 'travellers' ? null : 'travellers')}
                className="w-full h-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/60 rounded-b-xl md:rounded-r-xl md:rounded-bl-none transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#008F45]"
              >
                <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[10px] font-medium text-slate-400 leading-tight whitespace-nowrap">
                    Travellers &amp; Class
                  </span>
                  <span className="block text-[13px] font-bold text-slate-900 dark:text-white truncate">
                    {travellerCountText}
                  </span>
                  <span className="block text-[11px] text-slate-400 truncate">{value.cabin}</span>
                </div>
              </button>

              {openPicker === 'travellers' && (
                <div
                  role="dialog"
                  aria-label="Travellers and cabin class"
                  className="absolute right-0 top-full mt-2 w-full sm:w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 p-4 space-y-4"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Travellers &amp; class
                  </p>

                  {[
                    { key: 'adults' as const, label: 'Adults', sub: '12+ years', min: 1, max: 9 },
                    { key: 'children' as const, label: 'Children', sub: '2–11 years', min: 0, max: 6 },
                    { key: 'infants' as const, label: 'Infants', sub: 'Under 2', min: 0, max: 4 },
                  ].map((row) => (
                    <div key={row.key} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{row.label}</p>
                        <p className="text-[11px] text-slate-500">{row.sub}</p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          disabled={value[row.key] <= row.min}
                          onClick={() =>
                            onChange({ ...value, [row.key]: Math.max(row.min, value[row.key] - 1) })
                          }
                          aria-label={`Decrease ${row.label}`}
                          className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <MinusIcon className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-xs font-mono font-bold tabular-nums">
                          {value[row.key]}
                        </span>
                        <button
                          type="button"
                          disabled={value[row.key] >= row.max}
                          onClick={() =>
                            onChange({ ...value, [row.key]: Math.min(row.max, value[row.key] + 1) })
                          }
                          aria-label={`Increase ${row.label}`}
                          className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cabin class</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['Economy', 'Premium Economy', 'Business', 'First'] as CabinClass[]).map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => onChange({ ...value, cabin: tier })}
                          className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                            value.cabin === tier
                              ? 'bg-[#008F45] text-white border-[#008F45]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenPicker(null)}
                    className="w-full py-2 rounded-xl bg-[#008F45] hover:bg-[#006B35] text-white text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search flights primary CTA */}
          <button
            type="button"
            onClick={onSearch}
            className="xl:w-44 min-h-[54px] px-5 py-3 rounded-xl bg-[#008F45] hover:bg-[#006B35] text-white text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#008F45]"
          >
            <MagnifyingGlassIcon className="w-4 h-4 shrink-0" />
            <span>Search flights</span>
          </button>
        </div>

        {/* Multi-City Connecting Legs */}
        {value.tripType === 'multi-city' && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <MapPinIcon className="w-4 h-4 text-[#008F45]" />
                Multi-City Connecting Legs
              </p>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    multiCityLegs: [
                      ...value.multiCityLegs,
                      {
                        id: `leg-${Date.now()}`,
                        origin: value.destination.startsWith('ANYWHERE') ? 'LOS' : value.destination,
                        destination: 'NBO',
                        date: value.returnDate || '2027-06-16',
                      },
                    ],
                  })
                }
                className="text-xs font-semibold text-[#008F45] hover:underline"
              >
                + Add flight leg
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {value.multiCityLegs.map((leg, idx) => (
                <div
                  key={leg.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2"
                >
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    Leg {idx + 2}
                  </span>
                  <select
                    value={leg.origin}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        multiCityLegs: value.multiCityLegs.map((l) =>
                          l.id === leg.id ? { ...l, origin: e.target.value } : l
                        ),
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    {[...HUBS, ...Object.values(externalHubCache)].map((h) => (
                      <option key={`leg-orig-${h.code}`} value={h.code}>
                        {h.city} ({h.code})
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-400">-&gt;</span>
                  <select
                    value={leg.destination}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        multiCityLegs: value.multiCityLegs.map((l) =>
                          l.id === leg.id ? { ...l, destination: e.target.value } : l
                        ),
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    {[...HUBS, ...Object.values(externalHubCache)].map((h) => (
                      <option key={`leg-dest-${h.code}`} value={h.code}>
                        {h.city} ({h.code})
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={leg.date}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        multiCityLegs: value.multiCityLegs.map((l) =>
                          l.id === leg.id ? { ...l, date: e.target.value } : l
                        ),
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        multiCityLegs: value.multiCityLegs.filter((l) => l.id !== leg.id),
                      })
                    }
                    aria-label="Remove leg"
                    className="ml-auto p-1 text-slate-400 hover:text-rose-500"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightSearchWidget;
