import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  BellAlertIcon,
  ClockIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import type { User } from '../../types';
import {
  ANYWHERE_DESTINATIONS,
  getHubByCode,
  zarToUsd,
  type BookedTripRecord,
  type FlightItinerary,
  type PriceAlertRecord,
} from '../flights/flightData';
import FlightSearchWidget, { type FlightSearchParams } from '../flights/FlightSearchWidget';
import FlightResultsView from '../flights/FlightResultsView';
import FlightBookingFlow from '../flights/FlightBookingFlow';
import {
  FlightStatusPanel,
  MyTripsPanel,
  PriceAlertsModal,
} from '../flights/FlightOperationsPanels';
import PanAfricanVisaHub from '../flights/PanAfricanVisaHub';
import { useCurrency } from '../../contexts/CurrencyContext';
import { usePlatformState, resolveCityFromAirport } from '../../contexts/PlatformStateContext';
import { fetchJsonStrict } from '../../lib/http';

interface BookFlightsPageProps {
  currentUser: User | null;
  onBack: () => void;
  onNavigate?: (target: 'book-a-stay' | 'long-term-stays' | 'rent-a-car' | 'find-wellness') => void;
}

type FlightHubSection = 'flights' | 'explore' | 'trips' | 'status' | 'visa';

const TRIPS_STORAGE_KEY = 'afriestate_flight_trips_v2';
const ALERTS_STORAGE_KEY = 'afriestate_flight_alerts_v2';

const DEFAULT_SEARCH: FlightSearchParams = {
  tripType: 'round-trip',
  origin: 'CPT',
  destination: 'LOS',
  departDate: '2027-06-12',
  returnDate: '2027-06-19',
  flexibleMode: 'exact',
  adults: 1,
  children: 0,
  infants: 0,
  cabin: 'Economy',
  multiCityLegs: [
    { id: 'leg-default', origin: 'LOS', destination: 'NBO', date: '2027-06-16' },
  ],
};

const QUICK_EXPLORE_DESTINATIONS = [
  { code: 'JNB', city: 'Johannesburg', fromZar: 1199 },
  { code: 'ACC', city: 'Accra', fromZar: 2250 },
  { code: 'NBO', city: 'Nairobi', fromZar: 2699 },
  { code: 'ABV', city: 'Abuja', fromZar: 2399 },
  { code: 'LHR', city: 'London', fromZar: 6299 },
];

const BookFlightsPage: React.FC<BookFlightsPageProps> = ({ currentUser, onBack, onNavigate }) => {
  const { currency, formatCurrency } = useCurrency();
  const { sharedJourney, updateSharedJourney, addPlatformBooking } = usePlatformState();
  const formatZar = (zar: number) => formatCurrency(zarToUsd(zar));

  const userScopeSuffix = currentUser?.id || currentUser?.username || 'guest';
  const scopedTripsKey = `${TRIPS_STORAGE_KEY}_${userScopeSuffix}`;
  const scopedAlertsKey = `${ALERTS_STORAGE_KEY}_${userScopeSuffix}`;

  const [section, setSection] = useState<FlightHubSection>('flights');
  const [search, setSearch] = useState<FlightSearchParams>(() => ({
    ...DEFAULT_SEARCH,
    origin: sharedJourney.originAirport || DEFAULT_SEARCH.origin,
    destination: sharedJourney.destinationAirport || DEFAULT_SEARCH.destination,
    departDate: sharedJourney.checkInDate || DEFAULT_SEARCH.departDate,
    returnDate: sharedJourney.returnDate || DEFAULT_SEARCH.returnDate,
  }));
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [selectedBookingFlight, setSelectedBookingFlight] = useState<{
    flight: FlightItinerary;
    adultZar: number;
  } | null>(null);

  const [trips, setTrips] = useState<BookedTripRecord[]>(() => {
    try {
      const scoped = localStorage.getItem(scopedTripsKey);
      const legacy = localStorage.getItem(TRIPS_STORAGE_KEY);
      const raw = scoped || legacy;
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [alerts, setAlerts] = useState<PriceAlertRecord[]>(() => {
    try {
      const scoped = localStorage.getItem(scopedAlertsKey);
      const legacy = localStorage.getItem(ALERTS_STORAGE_KEY);
      const raw = scoped || legacy;
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const scoped = localStorage.getItem(scopedTripsKey);
      const parsed = scoped ? JSON.parse(scoped) : [];
      if (Array.isArray(parsed)) setTrips(parsed);
    } catch {
      // ignore
    }
    try {
      const scopedA = localStorage.getItem(scopedAlertsKey);
      const parsedA = scopedA ? JSON.parse(scopedA) : [];
      if (Array.isArray(parsedA)) setAlerts(parsedA);
    } catch {
      // ignore
    }
  }, [scopedTripsKey, scopedAlertsKey]);

  useEffect(() => {
    const destCity = resolveCityFromAirport(search.destination);
    updateSharedJourney({
      originAirport: search.origin,
      ...(search.destination && !search.destination.startsWith('ANYWHERE')
        ? { destinationAirport: search.destination }
        : {}),
      ...(destCity ? { destinationCity: destCity } : {}),
      checkInDate: search.departDate,
      returnDate: search.returnDate,
    });
  }, [search.origin, search.destination, search.departDate, search.returnDate, updateSharedJourney]);

  const [priceAlertModal, setPriceAlertModal] = useState<{ open: boolean; zar: number }>({
    open: false,
    zar: 2399,
  });

  const [statusQuery, setStatusQuery] = useState<string>('SA 317');
  const [statusDate, setStatusDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [travelLanguages, setTravelLanguages] = useState<Array<{ code: string; name: string }>>([
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'pt', name: 'Português' },
    { code: 'ar', name: 'العربية' },
  ]);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState('en');
  const [isRotatingLanguages, setIsRotatingLanguages] = useState(false);

  const loadTravelLanguages = async (vertical: 'flights' | 'rotate') => {
    setIsRotatingLanguages(true);
    try {
      const res = await fetchJsonStrict<{
        languages?: Array<{ code: string; name: string }>;
      }>(`/api/travel/languages?vertical=${vertical}`, {
        timeoutMs: 12000,
        retries: 0,
      });
      if (Array.isArray(res.languages) && res.languages.length > 0) {
        setTravelLanguages(res.languages.slice(0, 60));
      }
    } catch {
      // Keep default multilingual fallback if RapidAPI is unconfigured
    } finally {
      setIsRotatingLanguages(false);
    }
  };

  useEffect(() => {
    loadTravelLanguages('flights');
  }, []);

  const persistTrips = (next: BookedTripRecord[]) => {
    setTrips(next);
    try {
      localStorage.setItem(scopedTripsKey, JSON.stringify(next));
      localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota
    }
  };

  const persistAlerts = (next: PriceAlertRecord[]) => {
    setAlerts(next);
    try {
      localStorage.setItem(scopedAlertsKey, JSON.stringify(next));
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota
    }
  };

  const triggerSearch = (override?: Partial<FlightSearchParams>) => {
    if (override) {
      setSearch((prev) => ({ ...prev, ...override }));
    }
    setSelectedBookingFlight(null);
    setSection('flights');
    setIsSearching(true);
    window.setTimeout(() => {
      setIsSearching(false);
    }, 450);
  };

  const handleSwitchVertical = (vertical: 'hotels' | 'stays' | 'experiences') => {
    if (!onNavigate) return;
    if (vertical === 'hotels') onNavigate('book-a-stay');
    else if (vertical === 'stays') onNavigate('long-term-stays');
    else onNavigate('find-wellness');
  };

  const originHub = getHubByCode(search.origin);

  const hasAlertForRoute = alerts.some(
    (a) => a.origin === search.origin && a.destination === search.destination
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-slate-950 text-slate-900 dark:text-white">
      {/* Bright Sunlit Aviation Hero Section matching Reference Design */}
      {section === 'flights' && !selectedBookingFlight && (
        <>
          <section className="relative bg-[#F9F9F6] dark:bg-slate-900 overflow-visible">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img
                src="/images/flights_hero_sky_wing.jpg"
                alt="Airplane wing flying high above sunlit African clouds"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-right opacity-90 dark:opacity-25"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#F9F9F6] via-[#F9F9F6]/85 to-transparent dark:from-slate-950 dark:via-slate-950/90 dark:to-slate-950/40" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#FAF8F4] dark:from-slate-950 to-transparent" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-8 space-y-6">
              {/* Compact Inline Flights Workspace Bar (replaces duplicate header) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/85 dark:bg-slate-800/85 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#008F45]"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5" />
                  <span>Marketplace</span>
                </button>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSection('status')}
                    className="px-3 py-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-[#008F45] hover:border-[#008F45]"
                  >
                    Live Flight Tracker
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection('explore')}
                    className="px-3 py-1.5 rounded-lg bg-white/85 dark:bg-slate-800/85 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#008F45]"
                  >
                    Explore
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection('trips')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/85 dark:bg-slate-800/85 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#008F45]"
                  >
                    <span>My Trips</span>
                    {trips.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-[#E8F7EF] text-[#008F45] text-[10px] font-mono font-bold">
                        {trips.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection('visa')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/85 dark:bg-slate-800/85 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#008F45]"
                    title="Visa & Passport Requirements Across Africa"
                  >
                    <GlobeAltIcon className="w-4 h-4 text-[#008F45]" />
                    <span>Visa &amp; Entry (54)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceAlertModal({ open: true, zar: 2399 })}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/85 dark:bg-slate-800/85 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#008F45]"
                  >
                    <BellAlertIcon className="w-4 h-4 text-[#008F45]" />
                    <span>{alerts.length}</span>
                  </button>
                  <div className="inline-flex items-center gap-1 bg-white/85 dark:bg-slate-800/85 border border-slate-200/80 dark:border-slate-700 rounded-lg px-2 py-1">
                    <select
                      aria-label="Flight locale language"
                      value={selectedLanguageCode}
                      onChange={(e) => setSelectedLanguageCode(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none max-w-[115px]"
                      title="Flight Localization"
                    >
                      {travelLanguages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => loadTravelLanguages('rotate')}
                      disabled={isRotatingLanguages}
                      title="Refresh localization"
                      className="p-0.5 rounded text-slate-500 hover:text-[#008F45] disabled:opacity-50"
                    >
                      <ArrowPathIcon className={`w-3.5 h-3.5 ${isRotatingLanguages ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="max-w-xl space-y-4">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                  Where will Africa{' '}
                  <span className="block text-[#008F45]">take you?</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed max-w-md">
                  Search hundreds of airlines and travel sites for the best fares across Africa and the world.
                </p>

                {/* 4 Trust Badges Row matching Reference Screenshot */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-6 gap-y-3 pt-1">
                  {[
                    { icon: TagIcon, title: 'All prices', sub: 'included' },
                    { icon: LockClosedIcon, title: 'Secure', sub: 'payments' },
                    { icon: ClockIcon, title: '24/7', sub: 'support' },
                    { icon: ShieldCheckIcon, title: 'Trusted by', sub: 'millions' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center gap-2.5 text-xs">
                      <span className="w-8 h-8 rounded-lg bg-[#E8F7EF] dark:bg-emerald-950/70 text-[#008F45] flex items-center justify-center shrink-0">
                        <item.icon className="w-4 h-4" />
                      </span>
                      <div className="leading-tight">
                        <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating White Search Card */}
              <div id="flight-search-anchor">
                <FlightSearchWidget
                  value={search}
                  onChange={setSearch}
                  onSearch={() => triggerSearch()}
                  onSwitchVertical={handleSwitchVertical}
                />
              </div>
            </div>
          </section>

          {/* Explore from [Origin] Horizontal Quick-Fare Strip */}
          <div className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white shrink-0">
                Explore from {originHub?.city || search.origin}
              </span>

              <div className="flex-1 flex items-center gap-2.5 overflow-x-auto py-0.5">
                {QUICK_EXPLORE_DESTINATIONS.map((dest) => (
                  <button
                    key={dest.code}
                    type="button"
                    onClick={() => triggerSearch({ destination: dest.code })}
                    className={`px-3.5 py-2 rounded-lg border text-left transition-colors shrink-0 ${
                      search.destination === dest.code
                        ? 'border-[#008F45] bg-[#E8F7EF]/50 dark:bg-emerald-950/40'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#008F45]'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{dest.city}</p>
                    <p className="text-[11px] font-semibold text-[#008F45] tabular-nums">
                      From {formatZar(dest.fromZar)}
                    </p>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setSection('explore')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#008F45] hover:underline shrink-0"
              >
                <span>More destinations</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-8">
        {(section !== 'flights' || selectedBookingFlight) && (
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setSelectedBookingFlight(null);
                setSection('flights');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#008F45]"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Back to Flights</span>
            </button>
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'flights', label: 'Flights' },
                  { id: 'status', label: 'Flight Tracker' },
                  { id: 'explore', label: 'Explore' },
                  { id: 'trips', label: `My Trips (${trips.length})` },
                  { id: 'visa', label: 'Visa & Entry' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedBookingFlight(null);
                    setSection(tab.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    section === tab.id && !selectedBookingFlight
                      ? 'bg-[#008F45] text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {section === 'flights' && !selectedBookingFlight && (
          <>
            <FlightResultsView
            search={search}
            isSearching={isSearching}
            hasActivePriceAlert={hasAlertForRoute}
            onModifySearch={() => {
              const el = document.getElementById('flight-search-anchor');
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onSelectAnywhereDestination={(code) => triggerSearch({ destination: code })}
            onChangeDepartDate={(iso) => triggerSearch({ departDate: iso })}
            onSelectFlight={(flight, adultZar) => {
              setSelectedBookingFlight({ flight, adultZar });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenPriceAlert={(suggestedZar) => setPriceAlertModal({ open: true, zar: suggestedZar })}
            onSubscribeDealsEmail={(email) => {
              persistAlerts([
                {
                  id: `pa-${Date.now()}`,
                  origin: search.origin,
                  destination: search.destination.startsWith('ANYWHERE') ? 'LOS' : search.destination,
                  currentZar: 2399,
                  rule: 'drop-10',
                  targetZar: 2159,
                  email,
                  active: true,
                  createdAt: new Date().toISOString(),
                },
                ...alerts,
              ]);
            }}
              onApplyAiRoute={(orig, dest) => triggerSearch({ origin: orig, destination: dest })}
              onOpenFullVisaHub={() => {
                setSection('visa');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
            {/* Embedded Real-Time Flight Tracker Section */}
            <section className="pt-2">
              <FlightStatusPanel initialQuery={statusQuery} initialDate={statusDate} />
            </section>
          </>
        )}

        {section === 'flights' && selectedBookingFlight && (
          <FlightBookingFlow
            flight={selectedBookingFlight.flight}
            baseAdultZar={selectedBookingFlight.adultZar}
            search={search}
            currentUser={currentUser}
            onCancelFlow={() => setSelectedBookingFlight(null)}
            onExploreHotels={() => onNavigate?.('book-a-stay')}
            onBookingCompleted={(trip) => {
              persistTrips([trip, ...trips]);
              const destCity =
                trip.destinationCity ||
                resolveCityFromAirport(trip.destination) ||
                trip.destination;
              addPlatformBooking({
                category: 'flight',
                reference: trip.reference,
                title: `${trip.airline} · ${trip.origin} → ${trip.destination}`,
                subtitle: `${trip.cabin} · ${trip.travellersCount} passenger(s)`,
                city: destCity,
                startDate: trip.departureDate,
                endDate: trip.returnDate,
                amountZar: trip.totalZar,
                status: trip.status === 'Cancelled' ? 'Cancelled' : 'Confirmed',
                customerName:
                  trip.leadTravellerName ||
                  currentUser?.fullName ||
                  'Traveler',
                customerEmail: trip.contactEmail || currentUser?.email || '',
                targetPage: 'book-flights',
              });
            }}
            onViewMyTrips={() => {
              setSelectedBookingFlight(null);
              setSection('trips');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Explore Anywhere View */}
        {section === 'explore' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#008F45]">
                  Anywhere in Africa Discovery
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold mt-1">
                  Explore destinations from {originHub?.city || search.origin}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Compare all-in direct and connecting fares across Africa with instant visa guidance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => triggerSearch({ destination: 'ANYWHERE_AFRICA' })}
                className="px-4 py-2.5 rounded-xl bg-[#008F45] hover:bg-[#006B35] text-white text-xs font-bold"
              >
                Interactive Budget Map
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ANYWHERE_DESTINATIONS.map((dest) => (
                <button
                  key={dest.code}
                  type="button"
                  onClick={() => triggerSearch({ destination: dest.code })}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-left hover:border-[#008F45] transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {dest.city} ({dest.code})
                    </span>
                    <span className="text-sm font-mono font-bold text-[#008F45]">
                      {formatZar(dest.fromZar)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{dest.country}</p>
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {dest.tag} · {dest.badge}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Flight Status */}
        {section === 'status' && <FlightStatusPanel initialQuery={statusQuery} initialDate={statusDate} />}

        {/* Visa & Entry Hub (All 54 African Nations + Gemini Policy Check) */}
        {section === 'visa' && <PanAfricanVisaHub />}

        {/* My Trips */}
        {section === 'trips' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#008F45]">
                Digital Travel Wallet
              </p>
              <h2 className="text-2xl font-bold mt-0.5">
                My Trips &amp; Manage Booking ({trips.length})
              </h2>
            </div>

            <MyTripsPanel
              trips={trips}
              onUpdateTrip={(updated) =>
                persistTrips(trips.map((t) => (t.id === updated.id ? updated : t)))
              }
              onFindHotel={() => onNavigate?.('book-a-stay')}
              onBookTransport={() => onNavigate?.('rent-a-car')}
              onCheckStatus={(flightNum) => {
                setStatusQuery(flightNum);
                setStatusDate(new Date().toISOString().split('T')[0]);
                setSection('status');
              }}
            />
          </div>
        )}
      </main>

      {/* Price Alert Modal */}
      <PriceAlertsModal
        isOpen={priceAlertModal.open}
        onClose={() => setPriceAlertModal((p) => ({ ...p, open: false }))}
        origin={search.origin}
        destination={search.destination}
        currentZar={priceAlertModal.zar}
        alerts={alerts}
        onCreateAlert={(alert) => persistAlerts([alert, ...alerts])}
        onDeleteAlert={(id) => persistAlerts(alerts.filter((a) => a.id !== id))}
      />
    </div>
  );
};

export default BookFlightsPage;
