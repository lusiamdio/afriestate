import React, { useMemo, useState } from 'react';
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  PaperAirplaneIcon,
  ShoppingBagIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  AIRLINE_BADGE_STYLES,
  DESTINATION_PHOTOS,
  FARE_TIER_CONFIG,
  formatMinutes,
  getHubByCode,
  zarToUsd,
  type BookedTripRecord,
  type FareTierId,
  type FlightItinerary,
} from './flightData';
import type { FlightSearchParams } from './FlightSearchWidget';
import type { User } from '../../types';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useToast } from '../../contexts/ToastContext';
import { isValidEmail, isValidPhone, sanitizeText } from '../../lib/security';

export type BookingStage = 'fare' | 'travellers' | 'payment' | 'confirmed';

interface FlightBookingFlowProps {
  flight: FlightItinerary;
  baseAdultZar: number;
  search: FlightSearchParams;
  currentUser: User | null;
  onCancelFlow: () => void;
  onExploreHotels: () => void;
  onBookingCompleted: (trip: BookedTripRecord) => void;
  onViewMyTrips: () => void;
}

const SEAT_ROWS = [12, 13, 14];
const SEAT_COLS = ['A', 'B', 'C', 'D', 'E', 'F'];

const PAYMENT_OPTIONS = [
  { id: 'Card', label: 'Card', badge: 'VISA / MC', markets: ['ZAR', 'NGN', 'KES', 'GHS', 'AOA', 'USD', 'EUR', 'GBP'] },
  { id: 'Ozow Instant EFT', label: 'Ozow Instant EFT', markets: ['ZAR'] },
  { id: 'Payflex (Pay in 4)', label: 'Payflex (Pay in 4)', markets: ['ZAR'] },
  { id: 'M-Pesa / Mobile Money', label: 'M-Pesa / Mobile Money', markets: ['KES', 'GHS', 'NGN', 'ZAR'] },
  { id: 'Pay later (mobicred)', label: 'Pay later (mobicred)', markets: ['ZAR', 'NGN'] },
];

const AirlineMiniBadge: React.FC<{ code: string; name: string }> = ({ code, name }) => {
  const style = AIRLINE_BADGE_STYLES[code] || { bg: '#008F45', accent: '#FFFFFF', short: code };
  return (
    <span
      aria-hidden="true"
      className="w-6 h-6 rounded-full inline-flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 bg-white overflow-hidden"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <circle cx="12" cy="12" r="11" fill={style.bg} />
        <path d="M6 14 L18 9 L14 15 L10 13 Z" fill={style.accent} />
      </svg>
      <span className="sr-only">{name}</span>
    </span>
  );
};

function formatDayDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCompactDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const FlightBookingFlow: React.FC<FlightBookingFlowProps> = ({
  flight,
  baseAdultZar,
  search,
  currentUser,
  onCancelFlow,
  onExploreHotels,
  onBookingCompleted,
  onViewMyTrips,
}) => {
  const { currency, formatCurrency } = useCurrency();
  const formatZar = (zar: number) => formatCurrency(zarToUsd(zar));
  const { addToast } = useToast();

  const [stage, setStage] = useState<BookingStage>('travellers');
  const [selectedTier, setSelectedTier] = useState<FareTierId>('standard');
  const [isFareRulesOpen, setIsFareRulesOpen] = useState(false);

  // Traveller Details
  const [title, setTitle] = useState<'Mr' | 'Mrs' | 'Miss'>('Mr');
  const [firstName, setFirstName] = useState(() => {
    const n = currentUser?.fullName?.trim().split(/\s+/)[0];
    return n || '';
  });
  const [lastName, setLastName] = useState(() => {
    const parts = currentUser?.fullName?.trim().split(/\s+/) || [];
    return parts.slice(1).join(' ') || '';
  });
  const [dob, setDob] = useState('1990-03-12');
  const [nationality, setNationality] = useState('South Africa');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('2030-03-12');
  const [showFreqFlyer, setShowFreqFlyer] = useState(false);
  const [freqFlyerNum, setFreqFlyerNum] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phoneCode, setPhoneCode] = useState('+27');
  const [phone, setPhone] = useState('');
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);

  // Extras (integrated smoothly via toggle inside Traveller / Summary so flow stays streamlined)
  const [showExtrasDrawer, setShowExtrasDrawer] = useState(false);
  const [extraBagKg, setExtraBagKg] = useState<0 | 10 | 23>(0);
  const [selectedSeat, setSelectedSeat] = useState<string>('12A');
  const [mealPref, setMealPref] = useState<'Standard meal' | 'Vegetarian' | 'Halal' | 'Kosher'>('Standard meal');
  const [addTransfer, setAddTransfer] = useState<boolean>(false);

  // Payment & Error Retry
  const [paymentMethod, setPaymentMethod] = useState<string>('Card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Confirmation
  const [confirmedTrip, setConfirmedTrip] = useState<BookedTripRecord | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const originHub = getHubByCode(flight.origin);
  const destHub = getHubByCode(flight.destination);
  const travellersCount = search.adults + search.children + search.infants;

  const tierConfig = FARE_TIER_CONFIG[selectedTier];
  const adultTierTotalZar = Math.round(baseAdultZar * tierConfig.multiplier);
  const flightBasePortionZar = Math.max(0, adultTierTotalZar - flight.taxesZar) * travellersCount;
  const taxesPortionZar = flight.taxesZar * travellersCount;
  const extrasTotalZar =
    (extraBagKg === 10 ? 450 : extraBagKg === 23 ? 780 : 0) + (addTransfer ? 450 : 0);
  const grandTotalZar = flightBasePortionZar + taxesPortionZar + extrasTotalZar;

  const prioritizedPayments = useMemo(() => {
    const activeCurr = String(currency);
    return [...PAYMENT_OPTIONS].sort((a, b) => {
      const aMatch = a.markets.includes(activeCurr) ? 0 : 1;
      const bMatch = b.markets.includes(activeCurr) ? 0 : 1;
      return aMatch - bMatch;
    });
  }, [currency]);

  const handleSmartAutofill = () => {
    const rawName = currentUser?.fullName || currentUser?.username || 'Sipho Dlamini';
    const parts = rawName.trim().split(/\s+/);
    setFirstName(parts[0] || 'Sipho');
    setLastName(parts.slice(1).join(' ') || 'Dlamini');
    if (currentUser?.email) setEmail(currentUser.email);
    setPassportNumber('A12345678');
    setPhone('82 123 4567');
    addToast('Saved traveller profile applied.', 'success');
  };

  const handleContinueTravellers = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFirst = sanitizeText(firstName, 60);
    const cleanLast = sanitizeText(lastName, 60);
    const cleanEmail = sanitizeText(email, 120);
    const fullPhone = `${phoneCode}${phone.replace(/\s+/g, '')}`;

    if (!cleanFirst || !cleanLast) {
      addToast('Please enter the lead traveller first and last name.', 'error');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      addToast('Please enter a valid email address for e-ticket delivery.', 'error');
      return;
    }
    if (!isValidPhone(fullPhone)) {
      addToast('Please enter a valid mobile number.', 'error');
      return;
    }
    setStage('payment');
  };

  const handleCompletePayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isProcessingPayment) return;
    setPaymentError(null);

    if (stage === 'travellers') {
      const cleanFirst = sanitizeText(firstName, 60);
      const cleanLast = sanitizeText(lastName, 60);
      const cleanEmail = sanitizeText(email, 120);
      const fullPhone = `${phoneCode}${phone.replace(/\s+/g, '')}`;
      if (!cleanFirst || !cleanLast || !isValidEmail(cleanEmail) || !isValidPhone(fullPhone)) {
        addToast('Complete your traveller name, email, and phone first.', 'error');
        return;
      }
      setStage('payment');
      return;
    }

    if (paymentMethod === 'Card') {
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length < 12 || !cardExpiry.trim() || cardCvv.trim().length < 3) {
        setPaymentError('Card details could not be verified. Your flight has not been charged.');
        return;
      }
    }
    if (paymentMethod.includes('Mobile Money') && mobileMoneyPhone.replace(/\D/g, '').length < 8) {
      setPaymentError('Mobile Money MSISDN appears incomplete. Please verify your number.');
      return;
    }

    const leadName = `${title} ${sanitizeText(firstName, 40)} ${sanitizeText(lastName, 40)}`.trim();
    const cleanEmail = sanitizeText(email, 120);

    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/payments/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingCategory: 'flight',
          itemId: flight.id,
          itemTitle: `${flight.airline} ${flight.flightNumber} (${flight.origin} -> ${flight.destination})`,
          amount: grandTotalZar,
          currency,
          paymentMethod,
          customerName: leadName,
          customerEmail: cleanEmail,
          paymentDetails: {
            cardNumber: paymentMethod === 'Card' ? cardNumber.replace(/\D/g, '').slice(-4).padStart(16, '4') : undefined,
            cardExpiry: paymentMethod === 'Card' ? cardExpiry.trim() : undefined,
            cardCvv: paymentMethod === 'Card' ? cardCvv.trim() : undefined,
            mobileMoneyPhone: paymentMethod.includes('Mobile Money') ? mobileMoneyPhone.trim() : undefined,
          },
          metadata: {
            flightNumber: flight.flightNumber,
            departureDate: search.departDate,
            cabin: search.cabin,
            fareTier: selectedTier,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Real-time payment settlement declined.');
      }

      const ref = data.transactionRef || `AFR${Math.floor(100000 + Math.random() * 899999)}`;
      const record: BookedTripRecord = {
        id: `trip-${Date.now()}`,
        reference: ref,
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        origin: flight.origin,
        originCity: originHub?.city || flight.origin,
        destination: flight.destination,
        destinationCity: destHub?.city || flight.destination,
        departureDate: search.departDate,
        returnDate: search.tripType === 'round-trip' ? search.returnDate : undefined,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        durationMinutes: flight.durationMinutes,
        stops: flight.stops,
        cabin: search.cabin,
        fareTier: selectedTier,
        travellersCount,
        leadTravellerName: leadName,
        contactEmail: cleanEmail,
        contactPhone: `${phoneCode} ${sanitizeText(phone, 24)}`,
        whatsappConfirmation: whatsappUpdates,
        whatsappUpdates,
        seatSelected: selectedSeat,
        extraBagKg,
        mealPreference: mealPref,
        airportTransferAdded: addTransfer,
        paymentMethod,
        totalZar: grandTotalZar,
        settlementId: data.settlementId,
        authorizationCode: data.authorizationCode,
        status: 'Confirmed',
        bookedAt: data.settledAt || new Date().toISOString(),
      };
      setConfirmedTrip(record);
      setStage('confirmed');
      onBookingCompleted(record);
      addToast(`Real-time settlement ${ref} confirmed!`, 'success');
    } catch (err: any) {
      setPaymentError(err?.message || 'Unable to authorize real-time payment. Please retry.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDownloadTicket = () => {
    if (!confirmedTrip) return;
    const text = [
      'AFRIESTATE FLIGHTS — ELECTRONIC TICKET RECEIPT',
      `Booking Reference: ${confirmedTrip.reference}`,
      `Passenger: ${confirmedTrip.leadTravellerName}`,
      `Airline & Flight: ${confirmedTrip.airline} (${confirmedTrip.flightNumber})`,
      `Route: ${confirmedTrip.originCity} (${confirmedTrip.origin}) -> ${confirmedTrip.destinationCity} (${confirmedTrip.destination})`,
      `Departure: ${confirmedTrip.departureDate} at ${confirmedTrip.departureTime}`,
      `Arrival: ${confirmedTrip.arrivalTime} (${formatMinutes(confirmedTrip.durationMinutes)})`,
      `Cabin & Fare: ${confirmedTrip.cabin} · ${FARE_TIER_CONFIG[confirmedTrip.fareTier].name}`,
      `Seat: ${confirmedTrip.seatSelected} · Extra Baggage: +${confirmedTrip.extraBagKg}kg · Meal: ${confirmedTrip.mealPreference}`,
      `Total Paid (${confirmedTrip.paymentMethod}): ${formatZar(confirmedTrip.totalZar)} (Taxes Included)`,
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AfriEstate-Eticket-${confirmedTrip.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('E-ticket downloaded.', 'success');
  };

  const handleAddToCalendar = () => {
    if (!confirmedTrip) return;
    const cleanDate = confirmedTrip.departureDate.replace(/-/g, '');
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AfriEstate Flights//EN',
      'BEGIN:VEVENT',
      `UID:${confirmedTrip.reference}@afriestate.africa`,
      `DTSTAMP:${cleanDate}T080000Z`,
      `DTSTART:${cleanDate}T${confirmedTrip.departureTime.replace(':', '')}00Z`,
      `SUMMARY:Flight ${confirmedTrip.flightNumber} ${confirmedTrip.origin} to ${confirmedTrip.destination}`,
      `DESCRIPTION:Booking Ref ${confirmedTrip.reference} · ${confirmedTrip.airline} · Seat ${confirmedTrip.seatSelected}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Flight-${confirmedTrip.reference}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Calendar invite (.ics) downloaded.', 'success');
  };

  const stepperSteps = [
    { num: 1, label: 'Search', done: true, active: false },
    { num: 2, label: 'Select', done: stage !== 'fare', active: stage === 'fare' },
    { num: 3, label: 'Traveller details', done: stage === 'payment' || stage === 'confirmed', active: stage === 'travellers' },
    { num: 4, label: 'Payment', done: stage === 'confirmed', active: stage === 'payment' },
    { num: 5, label: 'Confirmation', done: stage === 'confirmed', active: stage === 'confirmed' },
  ];

  // Left Card: "Your selected flight" matching reference screenshot
  const renderSelectedFlightCard = () => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your selected flight</h3>
        <button
          type="button"
          onClick={onCancelFlow}
          className="text-xs font-semibold text-[#008F45] hover:underline"
        >
          Change flight
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <AirlineMiniBadge code={flight.airlineCode} name={flight.airline} />
          <span className="text-sm font-bold text-slate-900 dark:text-white">{flight.airline}</span>
        </div>
        <button
          type="button"
          onClick={() => setStage(stage === 'fare' ? 'travellers' : 'fare')}
          className="text-[11px] font-semibold text-[#008F45] hover:underline"
        >
          {stage === 'fare' ? 'Close tiers' : `${tierConfig.name} fare ▾`}
        </button>
      </div>

      {/* Outbound Leg */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
          <PaperAirplaneIcon className="w-4 h-4 text-[#008F45]" />
          <span>Departure</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDayDate(search.departDate)}</p>
        <div className="grid grid-cols-12 items-center gap-2 pt-1">
          <div className="col-span-4">
            <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
              {flight.departureTime}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
              {originHub?.city || flight.origin}
            </p>
            <p className="text-[11px] text-slate-400">{flight.origin}</p>
          </div>
          <div className="col-span-4 text-center">
            <p className="text-[11px] text-slate-500 tabular-nums">
              {formatMinutes(flight.durationMinutes)}
            </p>
            <div className="h-px bg-slate-300 dark:bg-slate-600 my-1.5" />
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {flight.stops === 0 ? 'Direct' : `${flight.stops} stop ${flight.stopHub || ''}`}
            </p>
          </div>
          <div className="col-span-4 text-right">
            <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
              {flight.arrivalTime.split(' ')[0]}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
              {destHub?.city || flight.destination}
            </p>
            <p className="text-[11px] text-slate-400">{flight.destination}</p>
          </div>
        </div>
      </div>

      {/* Return Leg (if round trip) */}
      {search.tripType === 'round-trip' && (
        <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <PaperAirplaneIcon className="w-4 h-4 text-[#008F45] rotate-180" />
            <span>Return</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formatDayDate(search.returnDate)}</p>
          <div className="grid grid-cols-12 items-center gap-2 pt-1">
            <div className="col-span-4">
              <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums">08:30</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                {destHub?.city || flight.destination}
              </p>
              <p className="text-[11px] text-slate-400">{flight.destination}</p>
            </div>
            <div className="col-span-4 text-center">
              <p className="text-[11px] text-slate-500 tabular-nums">13h 10m</p>
              <div className="h-px bg-slate-300 dark:bg-slate-600 my-1.5" />
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {flight.stops === 0 ? 'Direct' : `${flight.stops} stop ${flight.stopHub || ''}`}
              </p>
            </div>
            <div className="col-span-4 text-right">
              <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums">21:40</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                {originHub?.city || flight.origin}
              </p>
              <p className="text-[11px] text-slate-400">{flight.origin}</p>
            </div>
          </div>
        </div>
      )}

      {/* Fare Features 4-Column Mini Bar */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white">Fare features</span>
          <button
            type="button"
            onClick={() => setIsFareRulesOpen(true)}
            className="text-xs font-semibold text-[#008F45] hover:underline"
          >
            Fare rules
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
          <div className="space-y-0.5">
            <ShoppingBagIcon className="w-4 h-4 mx-auto text-[#008F45]" />
            <p className="font-bold text-slate-900 dark:text-white">{flight.checkedBaggageKg}kg</p>
            <p className="text-[10px] text-slate-500 leading-tight">Checked baggage</p>
          </div>
          <div className="space-y-0.5">
            <ShoppingBagIcon className="w-4 h-4 mx-auto text-slate-600 dark:text-slate-300" />
            <p className="font-bold text-slate-900 dark:text-white">{flight.cabinBaggageKg}kg</p>
            <p className="text-[10px] text-slate-500 leading-tight">Cabin baggage</p>
          </div>
          <div className="space-y-0.5">
            <CheckCircleIcon className="w-4 h-4 mx-auto text-[#008F45]" />
            <p className="font-bold text-slate-900 dark:text-white">Change</p>
            <p className={`text-[10px] font-semibold leading-tight ${tierConfig.changesAllowed ? 'text-[#008F45]' : 'text-rose-500'}`}>
              {tierConfig.changesAllowed ? 'Allowed' : 'No change'}
            </p>
          </div>
          <div className="space-y-0.5">
            <XMarkIcon className={`w-4 h-4 mx-auto ${tierConfig.refundAllowed ? 'text-[#008F45]' : 'text-rose-500'}`} />
            <p className="font-bold text-slate-900 dark:text-white">Refund</p>
            <p className={`text-[10px] font-semibold leading-tight ${tierConfig.refundAllowed ? 'text-[#008F45]' : 'text-rose-500'}`}>
              {tierConfig.refundAllowed ? 'Allowed' : 'Not allowed'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Right Card: "Trip summary" + Embedded "Secure payment" matching reference screenshot
  const renderTripSummaryCard = () => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5 sticky top-20">
      <div className="space-y-1 pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Trip summary</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {travellersCount} {travellersCount === 1 ? 'Adult' : 'Travellers'} · {search.cabin}
        </p>
      </div>

      {/* Outbound & Return One-Line Summary */}
      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-bold text-slate-900 dark:text-white">Departure</p>
            <p className="text-[11px] text-slate-500">{formatCompactDate(search.departDate)}</p>
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {flight.origin} → {flight.destination}
          </span>
          <span className="font-mono text-slate-600 dark:text-slate-300 tabular-nums">
            {flight.departureTime} – {flight.arrivalTime.split(' ')[0]}
          </span>
        </div>

        {search.tripType === 'round-trip' && (
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Return</p>
              <p className="text-[11px] text-slate-500">{formatCompactDate(search.returnDate)}</p>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {flight.destination} → {flight.origin}
            </span>
            <span className="font-mono text-slate-600 dark:text-slate-300 tabular-nums">
              08:30 – 21:40
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{flight.airline}</span>
          <AirlineMiniBadge code={flight.airlineCode} name={flight.airline} />
        </div>
      </div>

      {/* Itemized Pricing */}
      <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex justify-between text-slate-600 dark:text-slate-300 tabular-nums">
          <span>Fare</span>
          <span className="font-medium text-slate-900 dark:text-white">{formatZar(flightBasePortionZar)}</span>
        </div>
        <div className="flex justify-between text-slate-600 dark:text-slate-300 tabular-nums">
          <span>Taxes &amp; fees</span>
          <span className="font-medium text-slate-900 dark:text-white">{formatZar(taxesPortionZar)}</span>
        </div>
        <div className="flex justify-between text-slate-600 dark:text-slate-300 tabular-nums">
          <span>Passenger service fee</span>
          <span className="font-medium text-slate-900 dark:text-white">{formatZar(0)}</span>
        </div>
        {extrasTotalZar > 0 && (
          <div className="flex justify-between text-slate-600 dark:text-slate-300 tabular-nums">
            <span>Selected extras</span>
            <span className="font-medium text-slate-900 dark:text-white">{formatZar(extrasTotalZar)}</span>
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-baseline justify-between">
          <span className="text-sm font-bold text-slate-900 dark:text-white">Total</span>
          <div className="text-right">
            <p className="text-xl font-bold text-[#008F45] tabular-nums leading-none">
              {formatZar(grandTotalZar)}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">{currency}</p>
          </div>
        </div>
      </div>

      {/* Embedded Secure Payment Radio Preview matching Reference Screenshot */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Secure payment</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            All transactions are encrypted
          </p>
        </div>

        <div className="space-y-2">
          {prioritizedPayments.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                paymentMethod === opt.id
                  ? 'border-[#008F45] bg-[#E8F7EF]/40 dark:bg-emerald-950/30 font-semibold text-slate-900 dark:text-white'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="summaryPaymentMethod"
                  checked={paymentMethod === opt.id}
                  onChange={() => setPaymentMethod(opt.id)}
                  className="text-[#008F45] focus:ring-[#008F45]"
                />
                <span>{opt.label}</span>
              </span>
              {opt.id === 'Card' && (
                <span className="flex items-center gap-1 text-[10px] font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-blue-900 text-white">VISA</span>
                  <span className="inline-flex w-4 h-4 rounded-full bg-amber-500 opacity-90" />
                </span>
              )}
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={() => handleCompletePayment()}
          disabled={isProcessingPayment}
          className="w-full py-3 rounded-xl bg-[#008F45] hover:bg-[#006B35] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-60"
        >
          <LockClosedIcon className="w-4 h-4" />
          <span>
            {isProcessingPayment ? 'Authorizing...' : `Pay ${formatZar(grandTotalZar)}`}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-16 lg:pb-8">
      {/* Horizontal 5-Step Progress Bar matching Reference Design */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-3 sm:gap-5 mx-auto">
          {stepperSteps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <button
                type="button"
                disabled={stage === 'confirmed'}
                onClick={() => {
                  if (s.num === 1) onCancelFlow();
                  else if (s.num === 2) setStage('fare');
                  else if (s.num === 3) setStage('travellers');
                  else if (s.num === 4) setStage('payment');
                }}
                className="inline-flex items-center gap-2 text-xs whitespace-nowrap shrink-0 focus:outline-none"
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    s.done
                      ? 'bg-[#E8F7EF] text-[#008F45]'
                      : s.active
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'border border-slate-300 dark:border-slate-600 text-slate-400'
                  }`}
                >
                  {s.done ? <CheckIcon className="w-3.5 h-3.5" /> : s.num}
                </span>
                <span
                  className={
                    s.active
                      ? 'font-bold text-slate-900 dark:text-white'
                      : s.done
                      ? 'font-semibold text-slate-800 dark:text-slate-200'
                      : 'font-medium text-slate-400'
                  }
                >
                  {s.label}
                </span>
              </button>
              {idx < stepperSteps.length - 1 && (
                <ArrowRightIcon className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Stage: Fare Selection */}
      {stage === 'fare' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4">{renderSelectedFlightCard()}</div>

          <div className="lg:col-span-8 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Choose your fare tier
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {flight.airline} · {flight.origin} → {flight.destination} · {search.cabin}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['basic', 'standard', 'flex'] as FareTierId[]).map((tierId) => {
                  const cfg = FARE_TIER_CONFIG[tierId];
                  const tierAdultZar = Math.round(baseAdultZar * cfg.multiplier);
                  const isSelected = selectedTier === tierId;

                  return (
                    <div
                      key={tierId}
                      className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                        cfg.recommended
                          ? 'border-[#008F45] ring-2 ring-[#008F45]/15'
                          : isSelected
                          ? 'border-slate-900 dark:border-white'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{cfg.name}</h3>
                          {cfg.recommended && (
                            <span className="px-2 py-0.5 rounded bg-[#E8F7EF] text-[#008F45] text-[10px] font-bold">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatZar(tierAdultZar)}
                          <span className="text-[11px] font-normal text-slate-500"> / adult</span>
                        </p>
                        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <li>✓ {cfg.baggageLabel}</li>
                          <li className={cfg.changesAllowed ? 'text-[#008F45] font-medium' : 'text-slate-400'}>
                            {cfg.changesAllowed ? '✓ Flight changes allowed' : '✕ No flight changes'}
                          </li>
                          <li className={cfg.refundAllowed ? 'text-[#008F45] font-medium' : 'text-slate-400'}>
                            {cfg.refundAllowed ? '✓ Refundable ticket' : '✕ Non-refundable'}
                          </li>
                        </ul>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTier(tierId);
                          setStage('travellers');
                        }}
                        className={`w-full mt-5 py-2.5 rounded-lg text-xs font-bold ${
                          cfg.recommended
                            ? 'bg-[#008F45] hover:bg-[#006B35] text-white'
                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        }`}
                      >
                        Choose {cfg.name}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage: Traveller Details (3-column matching screenshot) */}
      {stage === 'travellers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Your selected flight */}
          <div className="lg:col-span-4">{renderSelectedFlightCard()}</div>

          {/* Center: Traveller 1: Adult */}
          <form
            onSubmit={handleContinueTravellers}
            className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Traveller 1: Adult</h2>
              {currentUser && (
                <button
                  type="button"
                  onClick={handleSmartAutofill}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#008F45] hover:underline"
                >
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Autofill saved profile
                </button>
              )}
            </div>

            <div className="flex items-center gap-5 text-xs font-semibold">
              {(['Mr', 'Mrs', 'Miss'] as const).map((tOpt) => (
                <label key={tOpt} className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="travellerTitle"
                    checked={title === tOpt}
                    onChange={() => setTitle(tOpt)}
                    className="text-[#008F45] focus:ring-[#008F45]"
                  />
                  {tOpt}
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">First name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Sipho"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Last name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dlamini"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Date of birth</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Nationality</label>
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                >
                  <option value="South Africa">South Africa</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Angola">Angola</option>
                  <option value="Morocco">Morocco</option>
                  <option value="Rwanda">Rwanda</option>
                  <option value="United Kingdom">United Kingdom</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Passport number</label>
                <input
                  type="text"
                  required
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                  placeholder="A12345678"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Passport expiry</label>
                <input
                  type="date"
                  required
                  value={passportExpiry}
                  onChange={(e) => setPassportExpiry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFreqFlyer}
                  onChange={(e) => setShowFreqFlyer(e.target.checked)}
                  className="rounded border-slate-300 text-[#008F45] focus:ring-[#008F45]"
                />
                <span>Add frequent flyer number (optional)</span>
              </label>
              {showFreqFlyer && (
                <input
                  type="text"
                  value={freqFlyerNum}
                  onChange={(e) => setFreqFlyerNum(e.target.value)}
                  placeholder="Enter frequent flyer ID"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                />
              )}
            </div>

            {/* Optional Seat & Extra Bag Accordion */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowExtrasDrawer((v) => !v)}
                className="text-xs font-semibold text-[#008F45] hover:underline"
              >
                {showExtrasDrawer
                  ? 'Hide seat, extra bag & transfer options'
                  : `+ Customize seat (${selectedSeat}), extra bag or transfer`}
              </button>

              {showExtrasDrawer && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 space-y-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">Seat ({selectedSeat})</p>
                    <div className="grid grid-cols-6 gap-1">
                      {SEAT_ROWS.flatMap((row) =>
                        SEAT_COLS.map((col) => {
                          const code = `${row}${col}`;
                          return (
                            <button
                              key={code}
                              type="button"
                              onClick={() => setSelectedSeat(code)}
                              className={`py-1 rounded border text-[10px] font-mono font-bold ${
                                selectedSeat === code
                                  ? 'bg-[#008F45] text-white border-[#008F45]'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {code}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { kg: 0 as const, label: '0kg extra' },
                      { kg: 10 as const, label: `+10kg (${formatZar(450)})` },
                      { kg: 23 as const, label: `+23kg (${formatZar(780)})` },
                    ].map((b) => (
                      <button
                        key={b.kg}
                        type="button"
                        onClick={() => setExtraBagKg(b.kg)}
                        className={`px-2 py-1.5 rounded-lg border text-[10px] font-semibold ${
                          extraBagKg === b.kg
                            ? 'bg-[#008F45] text-white border-[#008F45]'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={mealPref}
                      onChange={(e) => setMealPref(e.target.value as any)}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px]"
                    >
                      <option value="Standard meal">Standard meal</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Halal">Halal</option>
                      <option value="Kosher">Kosher</option>
                    </select>
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addTransfer}
                        onChange={(e) => setAddTransfer(e.target.checked)}
                        className="rounded border-slate-300 text-[#008F45]"
                      />
                      Airport transfer (+{formatZar(450)})
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Contact details */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Contact details</h3>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sipho.dlamini@email.com"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Phone</label>
                <div className="flex gap-2">
                  <select
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    className="px-2 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  >
                    <option value="+27">🇿🇦 +27</option>
                    <option value="+234">🇳🇬 +234</option>
                    <option value="+254">🇰🇪 +254</option>
                    <option value="+233">🇬🇭 +233</option>
                    <option value="+244">🇦🇴 +244</option>
                  </select>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="82 123 4567"
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappUpdates}
                  onChange={(e) => setWhatsappUpdates(e.target.checked)}
                  className="rounded border-slate-300 text-[#008F45] focus:ring-[#008F45]"
                />
                <span>Receive flight updates on WhatsApp</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#008F45] hover:bg-[#006B35] text-white text-sm font-bold transition-colors"
            >
              Continue
            </button>
          </form>

          {/* Right: Trip summary + Secure payment preview */}
          <div className="lg:col-span-4">{renderTripSummaryCard()}</div>
        </div>
      )}

      {/* Stage: Payment */}
      {stage === 'payment' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4">{renderSelectedFlightCard()}</div>

          <form
            onSubmit={handleCompletePayment}
            className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Payment details</h2>
              <button
                type="button"
                onClick={() => setStage('travellers')}
                className="text-xs font-semibold text-[#008F45] hover:underline"
              >
                Edit traveller
              </button>
            </div>

            {paymentError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs space-y-2">
                <p className="font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                  <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                  Payment issue
                </p>
                <p className="text-rose-700 dark:text-rose-300">{paymentError}</p>
              </div>
            )}

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Paying via <strong className="text-slate-900 dark:text-white">{paymentMethod}</strong> for{' '}
              <strong className="text-slate-900 dark:text-white">{firstName} {lastName}</strong>
            </p>

            {paymentMethod === 'Card' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Card number</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 •••• •••• 1234"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Expiry</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">CVV</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod.includes('Mobile Money') && (
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Mobile Money Number (M-Pesa / MTN)
                </label>
                <input
                  type="tel"
                  required
                  value={mobileMoneyPhone}
                  onChange={(e) => setMobileMoneyPhone(e.target.value)}
                  placeholder="+254 712 345 678"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>
            )}

            {paymentMethod !== 'Card' && !paymentMethod.includes('Mobile Money') && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
                Complete secure settlement via <strong>{paymentMethod}</strong> in {currency}. Ticket issues immediately upon confirmation.
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessingPayment}
              className="w-full py-3 rounded-xl bg-[#008F45] hover:bg-[#006B35] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <LockClosedIcon className="w-4 h-4" />
              <span>{isProcessingPayment ? 'Authorizing...' : `Pay ${formatZar(grandTotalZar)}`}</span>
            </button>
          </form>

          <div className="lg:col-span-4">{renderTripSummaryCard()}</div>
        </div>
      )}

      {/* Stage: Confirmed — Matches Bottom-Right Confirmation & Hotel Cross-Sell Card */}
      {stage === 'confirmed' && confirmedTrip && (
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 text-center space-y-5 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#008F45] text-white flex items-center justify-center mx-auto shadow-md">
              <CheckIcon className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Booking confirmed!</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Your booking has been confirmed and e-ticket has been sent to{' '}
                <strong className="text-slate-900 dark:text-white">{confirmedTrip.contactEmail}</strong>
              </p>
            </div>

            <div className="space-y-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Booking reference</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 dark:text-white tracking-wider">
                    {confirmedTrip.reference}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(confirmedTrip.reference);
                      } catch {
                        // ignore
                      }
                      setCopiedRef(true);
                      window.setTimeout(() => setCopiedRef(false), 2000);
                    }}
                    aria-label="Copy booking reference"
                    className="text-slate-400 hover:text-[#008F45]"
                  >
                    {copiedRef ? (
                      <CheckBadgeIcon className="w-4 h-4 text-[#008F45]" />
                    ) : (
                      <ClipboardDocumentIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              {confirmedTrip.settlementId && (
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/70 dark:border-slate-700 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Real-Time Settlement</span>
                  <span className="font-mono font-semibold text-[#008F45]">
                    {confirmedTrip.settlementId} · {confirmedTrip.authorizationCode}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onViewMyTrips}
                className="w-full py-2.5 rounded-lg bg-[#008F45] hover:bg-[#006B35] text-white text-xs font-bold transition-colors"
              >
                View my trip
              </button>
              <button
                type="button"
                onClick={handleDownloadTicket}
                className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Download e-ticket
              </button>
              <button
                type="button"
                onClick={handleAddToCalendar}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#008F45] hover:underline pt-1"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Add to calendar</span>
              </button>
            </div>
          </div>

          {/* Hotel Cross-Sell Card matching bottom-right card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Need a hotel in {confirmedTrip.destinationCity}?
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Get up to 40% off on top stays.
                </p>
              </div>
              <button
                type="button"
                onClick={onExploreHotels}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#008F45] hover:text-[#008F45]"
              >
                View hotels
              </button>
            </div>
            <img
              src={DESTINATION_PHOTOS[confirmedTrip.destination] || DESTINATION_PHOTOS.LOS}
              alt={`${confirmedTrip.destinationCity} hotel district`}
              referrerPolicy="no-referrer"
              className="w-24 h-20 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>
      )}

      {/* Fare Rules Modal */}
      {isFareRulesOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {tierConfig.name} Fare Conditions
              </h3>
              <button
                type="button"
                onClick={() => setIsFareRulesOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li>• <strong>Baggage:</strong> {tierConfig.baggageLabel}</li>
              <li>• <strong>Changes:</strong> {tierConfig.changesAllowed ? 'Permitted up to 24h prior to departure' : 'Ticket changes not permitted'}</li>
              <li>• <strong>Refunds:</strong> {tierConfig.refundAllowed ? 'Full refund protection available' : 'Non-refundable after ticket issuance'}</li>
              <li>• <strong>Seats:</strong> {tierConfig.seatSelection ? 'Advance seat selection included' : 'Standard seat assigned at check-in'}</li>
            </ul>
            <button
              type="button"
              onClick={() => setIsFareRulesOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#008F45] text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightBookingFlow;
