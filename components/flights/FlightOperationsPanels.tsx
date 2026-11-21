import React, { useEffect, useState } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  BellAlertIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  TicketIcon,
  TrashIcon,
  TruckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  FARE_TIER_CONFIG,
  formatMinutes,
  getHubByCode,
  zarToUsd,
  type BookedTripRecord,
  type PriceAlertRecord,
} from './flightData';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useToast } from '../../contexts/ToastContext';

interface MyTripsPanelProps {
  trips: BookedTripRecord[];
  onUpdateTrip: (updated: BookedTripRecord) => void;
  onFindHotel: () => void;
  onBookTransport: () => void;
  onCheckStatus: (flightNumber: string) => void;
}

export const MyTripsPanel: React.FC<MyTripsPanelProps> = ({
  trips,
  onUpdateTrip,
  onFindHotel,
  onBookTransport,
  onCheckStatus,
}) => {
  const { formatCurrency } = useCurrency();
  const formatZar = (zar: number) => formatCurrency(zarToUsd(zar));
  const { addToast } = useToast();
  const [managingTripId, setManagingTripId] = useState<string | null>(null);
  const [newDepartDate, setNewDepartDate] = useState<string>('');
  const [newSeat, setNewSeat] = useState<string>('14C');

  const handleDownloadTripTicket = (trip: BookedTripRecord) => {
    const body = [
      'AFRIESTATE DIGITAL TRIP E-TICKET',
      `Reference: ${trip.reference} (${trip.status})`,
      `Passenger: ${trip.leadTravellerName}`,
      `Flight: ${trip.airline} ${trip.flightNumber}`,
      `Route: ${trip.originCity} (${trip.origin}) -> ${trip.destinationCity} (${trip.destination})`,
      `Date: ${trip.departureDate} · ${trip.departureTime} -> ${trip.arrivalTime}`,
      `Seat: ${trip.seatSelected} · Extra Baggage: +${trip.extraBagKg}kg · Meal: ${trip.mealPreference}`,
      `Paid: ${formatZar(trip.totalZar)} via ${trip.paymentMethod}`,
    ].join('\n');
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AfriEstate-Trip-${trip.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Downloaded e-ticket for ${trip.reference}.`, 'success');
  };

  if (trips.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
        <TicketIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No trips booked yet</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Once you complete a flight booking, your itinerary automatically becomes an interactive digital trip with visa notes, hotel pairing, and e-ticket management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {trips.map((trip) => {
        const destHub = getHubByCode(trip.destination);
        const isManaging = managingTripId === trip.id;

        return (
          <div
            key={trip.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#008F45]">
                  {trip.destinationCity.toUpperCase()} TRIP · {trip.departureDate}
                  {trip.returnDate ? ` -> ${trip.returnDate}` : ''}
                </p>
                <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                  Ref {trip.reference} · {trip.origin} -&gt; {trip.destination}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Lead Traveller: {trip.leadTravellerName} · {FARE_TIER_CONFIG[trip.fareTier].name} ({trip.cabin})
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                    trip.status === 'Cancelled' || trip.status === 'Refund Requested'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-[#E8F7EF] text-[#006B35] dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}
                >
                  {trip.status}
                </span>
                <p className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  {formatZar(trip.totalZar)}
                </p>
              </div>
            </div>

            {/* 3-Card Unified Digital Trip (§37) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Flight Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <PaperAirplaneIcon className="w-4 h-4 text-[#008F45]" />
                  Flights
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {trip.originCity} -&gt; {trip.destinationCity}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {trip.airline} ({trip.flightNumber}) · {trip.departureTime} -&gt; {trip.arrivalTime}
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  Seat {trip.seatSelected} · +{trip.extraBagKg}kg bag · {formatMinutes(trip.durationMinutes)}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDownloadTripTicket(trip)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold"
                  >
                    <DocumentArrowDownIcon className="w-3.5 h-3.5" />
                    E-Ticket
                  </button>
                  <button
                    type="button"
                    onClick={() => onCheckStatus(trip.flightNumber)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#008F45] text-white text-[11px] font-semibold"
                  >
                    Flight Status
                  </button>
                </div>
              </div>

              {/* Hotel & Transfer Pairing */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BuildingOfficeIcon className="w-4 h-4 text-amber-600" />
                  Hotel &amp; Arrival Transfer
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {trip.airportTransferAdded ? 'Chauffeur Transfer Reserved' : 'No hotel booked yet'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Pair verified {trip.destinationCity} hotels &amp; arrival transport directly with your ticket.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onFindHotel}
                    className="px-2.5 py-1.5 rounded-lg bg-[#008F45] text-white text-[11px] font-semibold"
                  >
                    Find a hotel
                  </button>
                  <button
                    type="button"
                    onClick={onBookTransport}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold"
                  >
                    <TruckIcon className="w-3.5 h-3.5" />
                    Add transfer
                  </button>
                </div>
              </div>

              {/* Travel Information */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Travel Information
                </p>
                <p className="text-slate-700 dark:text-slate-200">
                  <strong>Airport:</strong> {destHub?.airport || trip.destination}
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  {destHub?.terminalNote || 'Main international terminal'}
                </p>
                <p className="text-slate-700 dark:text-slate-200">
                  <strong>Avg Weather:</strong> {destHub?.avgWeatherC ?? 26}°C
                </p>
              </div>
            </div>

            {/* Manage Booking Drawer (§38) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setManagingTripId(isManaging ? null : trip.id);
                  setNewDepartDate(trip.departureDate);
                  setNewSeat(trip.seatSelected);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isManaging ? 'Close Manage Booking' : 'Manage Booking (Seat / Bags / Date / Cancel)'}
              </button>
              <button
                type="button"
                onClick={() => addToast(`Concierge support notified for trip ${trip.reference}.`, 'info')}
                className="text-xs font-semibold text-[#008F45] hover:underline"
              >
                Contact 24/7 Flight Support
              </button>
            </div>

            {isManaging && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white">Change Flight Date</p>
                  <input
                    type="date"
                    value={newDepartDate}
                    onChange={(e) => setNewDepartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateTrip({ ...trip, departureDate: newDepartDate, status: 'Date Changed' });
                      addToast(`Updated departure date to ${newDepartDate}.`, 'success');
                    }}
                    className="w-full py-1.5 rounded-lg bg-[#008F45] text-white font-semibold"
                  >
                    Save New Date
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white">Update Seat &amp; Add Baggage</p>
                  <select
                    value={newSeat}
                    onChange={(e) => setNewSeat(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                  >
                    {['12A', '12C', '13A', '13F', '14C', '14D'].map((s) => (
                      <option key={s} value={s}>
                        Seat {s}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateTrip({ ...trip, seatSelected: newSeat });
                        addToast(`Seat updated to ${newSeat}.`, 'success');
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold"
                    >
                      Save Seat
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateTrip({ ...trip, extraBagKg: trip.extraBagKg + 23 });
                        addToast('Added +23kg checked baggage to itinerary.', 'success');
                      }}
                      className="flex-1 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 font-semibold"
                    >
                      +23kg Bag
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white">Refund &amp; Cancellation</p>
                  <p className="text-[11px] text-slate-500">
                    Fare tier: {FARE_TIER_CONFIG[trip.fareTier].name} (
                    {FARE_TIER_CONFIG[trip.fareTier].refundAllowed ? 'Full refund eligible' : 'Credit voucher eligible'})
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateTrip({ ...trip, status: 'Refund Requested' });
                        addToast(`Refund request submitted for ${trip.reference}.`, 'info');
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-amber-500 text-white font-semibold"
                    >
                      Request Refund
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateTrip({ ...trip, status: 'Cancelled' });
                        addToast(`Booking ${trip.reference} cancelled.`, 'info');
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-rose-600 text-white font-semibold"
                    >
                      Cancel Trip
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface FlightTrackerResult {
  flightNumber: string;
  date: string;
  checkedAt: string;
  reportText: string;
  parsed: {
    airline: string;
    route: string;
    status: string;
    scheduledDeparture: string;
    estimatedDeparture: string;
    scheduledArrival: string;
    gateTerminal: string;
    aircraft: string;
    summary: string;
  };
  sources: { title: string; uri: string }[];
}

interface FlightStatusPanelProps {
  initialQuery?: string;
  initialDate?: string;
}

const POPULAR_FLIGHT_CODES = ['SA 317', 'ET 846', 'KQ 763', 'BA 055', 'WB 102', 'AT 550'];

export const FlightStatusPanel: React.FC<FlightStatusPanelProps> = ({
  initialQuery = 'SA 317',
  initialDate,
}) => {
  const defaultDate = initialDate || new Date().toISOString().split('T')[0];
  const [flightNumber, setFlightNumber] = useState(initialQuery);
  const [flightDate, setFlightDate] = useState(defaultDate);
  const [isTracking, setIsTracking] = useState(false);
  const [trackerError, setTrackerError] = useState<string | null>(null);
  const [liveResult, setLiveResult] = useState<FlightTrackerResult | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setFlightNumber(initialQuery);
    }
  }, [initialQuery]);

  const runLiveTrack = async (targetFlight: string, targetDate: string) => {
    const cleanNum = targetFlight.trim().toUpperCase();
    if (!cleanNum || !targetDate) {
      setTrackerError('Please enter both a flight number and a flight date.');
      return;
    }

    setIsTracking(true);
    setTrackerError(null);
    try {
      const response = await fetch('/api/gemini/flight-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightNumber: cleanNum,
          date: targetDate,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Live flight lookup failed.');
      }
      setLiveResult(data as FlightTrackerResult);
    } catch (err: any) {
      setTrackerError(err?.message || 'Unable to retrieve live search-grounded flight status.');
    } finally {
      setIsTracking(false);
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runLiveTrack(flightNumber, flightDate);
  };

  const statusBadgeColor = (statusText: string) => {
    const s = statusText.toLowerCase();
    if (s.includes('delay') || s.includes('cancel')) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
    }
    if (s.includes('land') || s.includes('on time') || s.includes('en route') || s.includes('scheduled')) {
      return 'bg-[#E8F7EF] text-[#006B35] dark:bg-emerald-950/60 dark:text-emerald-300';
    }
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#008F45] flex items-center gap-1.5">
            <GlobeAltIcon className="w-4 h-4" />
            <span>Live Search Grounded</span>
          </p>
          <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
            Real-Time Flight Tracker
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter a flight number and date to query live global aviation status, gates, and arrival estimates via real-time web search.
          </p>
        </div>

        <form onSubmit={handleTrackSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Flight Number
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                placeholder="e.g. SA 317, ET 846, KQ 763, BA 055"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold uppercase focus:outline-none focus:border-[#008F45]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Flight Date
            </label>
            <div className="relative">
              <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={flightDate}
                onChange={(e) => setFlightDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold focus:outline-none focus:border-[#008F45]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isTracking}
            className="w-full py-3 rounded-xl bg-[#008F45] hover:bg-[#006B35] text-white text-xs font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
            <span>{isTracking ? 'Searching Live Flight Status...' : 'Track Flight in Real Time'}</span>
          </button>
        </form>

        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Quick Track Popular African Flights
          </p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_FLIGHT_CODES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setFlightNumber(code);
                  runLiveTrack(code, flightDate);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200 hover:border-[#008F45] hover:text-[#008F45] transition-colors"
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xs">
        {isTracking ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#008F45]/30 border-t-[#008F45] rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Querying live schedules for {flightNumber} ({flightDate})...
            </p>
            <p className="text-xs text-slate-500">
              Aggregating grounded web updates from airline &amp; airport feeds
            </p>
          </div>
        ) : trackerError ? (
          <div className="p-5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-2">
            <p className="text-sm font-bold text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span>Flight Lookup Unavailable</span>
            </p>
            <p className="text-xs text-rose-700 dark:text-rose-300">{trackerError}</p>
            <button
              type="button"
              onClick={() => runLiveTrack(flightNumber, flightDate)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-semibold"
            >
              Retry Live Lookup
            </button>
          </div>
        ) : liveResult ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs font-mono font-bold text-[#008F45]">
                  {liveResult.flightNumber} · {liveResult.date}
                </p>
                <h3 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                  {liveResult.parsed.route}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {liveResult.parsed.airline} · {liveResult.parsed.aircraft}
                </p>
              </div>
              <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${statusBadgeColor(liveResult.parsed.status)}`}>
                Status: {liveResult.parsed.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="text-[11px] text-slate-500">Scheduled Dep.</p>
                <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {liveResult.parsed.scheduledDeparture}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="text-[11px] text-slate-500">Estimated / Live</p>
                <p className="text-sm font-mono font-bold text-[#008F45] mt-0.5">
                  {liveResult.parsed.estimatedDeparture}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="text-[11px] text-slate-500">Arrival Window</p>
                <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {liveResult.parsed.scheduledArrival}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="text-[11px] text-slate-500">Terminal / Gate</p>
                <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {liveResult.parsed.gateTerminal}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F7F3] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4 text-[#008F45]" />
                <span>Live Operational Briefing</span>
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {liveResult.parsed.summary}
              </p>
              <p className="text-[10px] text-slate-400">
                Checked live at {new Date(liveResult.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {liveResult.sources.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Live Search Grounding Sources ({liveResult.sources.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {liveResult.sources.map((src) => (
                    <a
                      key={src.uri}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#E8F7EF] dark:hover:bg-emerald-950/60 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#006B35] transition-colors max-w-full"
                    >
                      <span className="truncate max-w-[220px]">{src.title}</span>
                      <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-10 text-center space-y-3">
            <PaperAirplaneIcon className="w-10 h-10 mx-auto text-[#008F45]/60" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Ready to Track Your Flight Live
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Enter your airline flight number and departure date on the left, or select a popular African route code to pull real-time search-grounded flight updates and citations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface PriceAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  origin: string;
  destination: string;
  currentZar: number;
  alerts: PriceAlertRecord[];
  onCreateAlert: (alert: PriceAlertRecord) => void;
  onDeleteAlert: (id: string) => void;
}

export const PriceAlertsModal: React.FC<PriceAlertsModalProps> = ({
  isOpen,
  onClose,
  origin,
  destination,
  currentZar,
  alerts,
  onCreateAlert,
  onDeleteAlert,
}) => {
  const { formatCurrency } = useCurrency();
  const formatZar = (zar: number) => formatCurrency(zarToUsd(zar));
  const { addToast } = useToast();
  const [rule, setRule] = useState<'below-target' | 'drop-10' | 'drop-20'>('below-target');
  const [customTarget, setCustomTarget] = useState<number>(Math.max(1200, currentZar - 200));
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const computedTarget =
    rule === 'drop-10'
      ? Math.round(currentZar * 0.9)
      : rule === 'drop-20'
      ? Math.round(currentZar * 0.8)
      : customTarget;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      addToast('Enter a valid email address for fare drop alerts.', 'error');
      return;
    }
    const created: PriceAlertRecord = {
      id: `pa-${Date.now()}`,
      origin,
      destination: destination.startsWith('ANYWHERE') ? 'ANY' : destination,
      currentZar,
      rule,
      targetZar: computedTarget,
      email: email.trim(),
      active: true,
      createdAt: new Date().toISOString(),
    };
    onCreateAlert(created);
    addToast(`Price alert active for ${origin} -> ${created.destination}.`, 'success');
    setEmail('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#008F45] flex items-center gap-1.5">
              <BellAlertIcon className="w-4 h-4" />
              Price Alert
            </p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {origin} -&gt; {destination.startsWith('ANYWHERE') ? 'Africa Deals' : destination}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Current fare: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatZar(currentZar)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 text-xs">
            <p className="font-bold text-slate-700 dark:text-slate-300">Notify me when price:</p>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer">
              <span className="flex items-center gap-2 font-semibold">
                <input
                  type="radio"
                  checked={rule === 'below-target'}
                  onChange={() => setRule('below-target')}
                  className="text-[#008F45]"
                />
                Drops below {formatZar(customTarget)}
              </span>
              <input
                type="number"
                value={customTarget}
                onChange={(e) => setCustomTarget(Number(e.target.value))}
                className="w-24 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-right"
              />
            </label>
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer font-semibold">
              <input
                type="radio"
                checked={rule === 'drop-10'}
                onChange={() => setRule('drop-10')}
                className="text-[#008F45]"
              />
              Drops by 10% ({formatZar(Math.round(currentZar * 0.9))})
            </label>
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer font-semibold">
              <input
                type="radio"
                checked={rule === 'drop-20'}
                onChange={() => setRule('drop-20')}
                className="text-[#008F45]"
              />
              Drops by 20% ({formatZar(Math.round(currentZar * 0.8))})
            </label>
          </div>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email for fare alerts..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
          />

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#008F45] hover:bg-[#006B35] text-white text-xs font-bold"
          >
            Create Alert
          </button>
        </form>

        {alerts.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Route Alerts ({alerts.length})
            </p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800"
                >
                  <span className="font-mono font-semibold">
                    {a.origin} -&gt; {a.destination} ≤ {formatZar(a.targetZar)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteAlert(a.id)}
                    className="text-slate-400 hover:text-rose-500"
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
