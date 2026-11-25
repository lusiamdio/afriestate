import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  LockClosedIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  TruckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import PaymentSettlementPanel, { type SettlementReceipt } from '../payments/PaymentSettlementPanel';

export interface FleetVehicleCard {
  id: string;
  make: string;
  model: string;
  image: string;
  rating: string;
  reviews: string;
  specs: string[];
  price: string;
  category: string;
  city: string;
  pickupAddress: string;
  businessName: string;
  phone: string;
  description: string;
  verificationHash: string;
  isUserPublished?: boolean;
  listingMode?: 'hire' | 'sale';
  numericPrice?: number;
  mileage?: string;
  condition?: string;
  fuelType?: string;
  year?: string;
  financingAvailable?: boolean;
}

export interface VehicleSaleInquiryPayload {
  vehicleId: string;
  vehicleTitle: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  inspectionDate: string;
  offerAmountZar: number;
  financeRequested: boolean;
  notes: string;
}

interface TransportBookingFlowPageProps {
  vehicle: FleetVehicleCard;
  step: 'details' | 'settlement';
  onStepChange: (nextStep: 'details' | 'settlement') => void;
  onBackToCatalog: () => void;
  pickupLocation: string;
  setPickupLocation: (val: string) => void;
  returnLocation: string;
  setReturnLocation: (val: string) => void;
  pickupDate: string;
  setPickupDate: (val: string) => void;
  returnDate: string;
  setReturnDate: (val: string) => void;
  driverAge: string;
  setDriverAge: (val: string) => void;
  rentalDays: number;
  dailyRateZar: number;
  insuranceAndAirportFeeZar: number;
  driverName: string;
  setDriverName: (val: string) => void;
  driverEmail: string;
  setDriverEmail: (val: string) => void;
  driverPhone: string;
  setDriverPhone: (val: string) => void;
  settledReceipt: SettlementReceipt | null;
  onProceedToSettlement: (e: React.FormEvent) => void;
  onCarHireSettled: (receipt: SettlementReceipt) => void | Promise<void>;
  onCarSaleInquirySubmitted?: (payload: VehicleSaleInquiryPayload) => Promise<string | null> | string | null;
  onNavigate?: (page: string) => void;
}

export const TransportBookingFlowPage: React.FC<TransportBookingFlowPageProps> = ({
  vehicle,
  step,
  onStepChange,
  onBackToCatalog,
  pickupLocation,
  setPickupLocation,
  returnLocation,
  setReturnLocation,
  pickupDate,
  setPickupDate,
  returnDate,
  setReturnDate,
  driverAge,
  setDriverAge,
  rentalDays,
  dailyRateZar,
  insuranceAndAirportFeeZar,
  driverName,
  setDriverName,
  driverEmail,
  setDriverEmail,
  driverPhone,
  setDriverPhone,
  settledReceipt,
  onProceedToSettlement,
  onCarHireSettled,
  onCarSaleInquirySubmitted,
  onNavigate,
}) => {
  const isForSale = vehicle.listingMode === 'sale';
  const [arrivalFlightNote, setArrivalFlightNote] = useState('');
  const [saleOfferAmount, setSaleOfferAmount] = useState<string>(() =>
    String(vehicle.numericPrice || dailyRateZar || 850000)
  );
  const [financeRequested, setFinanceRequested] = useState(false);
  const [saleInquiryRef, setSaleInquiryRef] = useState<string | null>(null);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  const askingPriceZar = vehicle.numericPrice || dailyRateZar;
  const rentalSubtotalZar = dailyRateZar * rentalDays;
  const grandTotalZar = isForSale ? askingPriceZar : rentalSubtotalZar + insuranceAndAirportFeeZar;

  const handleConfirmSaleInquiry = async () => {
    if (!onCarSaleInquirySubmitted || isSubmittingSale) return;
    setIsSubmittingSale(true);
    try {
      const ref = await onCarSaleInquirySubmitted({
        vehicleId: vehicle.id,
        vehicleTitle: `${vehicle.make} ${vehicle.model}`,
        buyerName: driverName,
        buyerEmail: driverEmail,
        buyerPhone: driverPhone,
        inspectionDate: pickupDate,
        offerAmountZar: Math.max(1000, Number(saleOfferAmount) || askingPriceZar),
        financeRequested,
        notes: arrivalFlightNote.trim(),
      });
      if (ref) setSaleInquiryRef(ref);
    } finally {
      setIsSubmittingSale(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Branded Sub-Page Navigation & Step Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={
                step === 'settlement' && !settledReceipt && !saleInquiryRef
                  ? () => onStepChange('details')
                  : onBackToCatalog
              }
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0F2D25] dark:hover:text-[#C9A35D] transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>
                {step === 'settlement' && !settledReceipt && !saleInquiryRef
                  ? isForSale
                    ? 'Back to Vehicle Inspection Dossier'
                    : 'Back to Driver & Itinerary'
                  : 'Back to Transport Marketplace'}
              </span>
            </button>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline" aria-hidden="true">
              /
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              AfriEstate Transport · {isForSale ? 'Vehicle Sale Dossier' : 'Book & Settle Online'} ·{' '}
              <span className="text-slate-900 dark:text-white font-semibold">
                {vehicle.make} {vehicle.model}
              </span>
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              disabled={Boolean(settledReceipt || saleInquiryRef)}
              onClick={() => onStepChange('details')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                step === 'details'
                  ? 'bg-[#0F2D25] text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-50'
              }`}
            >
              {isForSale ? '01. Inspection & Buyer Dossier' : '01. Driver & Vehicle Dossier'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (step === 'settlement') return;
                onStepChange('settlement');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                step === 'settlement'
                  ? 'bg-[#0F2D25] text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isForSale ? '02. Viewing & Purchase Offer' : '02. Real-Time Settlement'}
            </button>
          </div>
        </div>
      </div>

      {/* Branded Architectural Hero Banner */}
      <section className="relative w-full bg-[#0B1F1A] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={vehicle.image}
            alt={`${vehicle.make} ${vehicle.model}`}
            onError={(e) => {
              if (!e.currentTarget.dataset.fb) {
                e.currentTarget.dataset.fb = '1';
                e.currentTarget.src = '/images/luxury_suv_fleet.jpg';
              }
            }}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F1A] via-[#0B1F1A]/80 to-[#0B1F1A]/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-10 sm:py-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold uppercase tracking-[0.18em] text-[#C9A35D]">
                {isForSale
                  ? saleInquiryRef
                    ? 'Inspection & Offer Logged'
                    : 'Verified Vehicle For Sale'
                  : step === 'details'
                    ? 'Vehicle Inspection & Driver Briefing'
                    : settledReceipt
                      ? 'Digital Key Dispatch Confirmed'
                      : 'Real-Time Online Settlement'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{vehicle.category} Class</span>
              <span aria-hidden="true">·</span>
              <span>{vehicle.city}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-200 inline-flex items-center gap-1">
                <LockClosedIcon className="w-3.5 h-3.5 text-[#C9A35D]" />
                {vehicle.verificationHash}
              </span>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-white">
              {vehicle.make} {vehicle.model}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-300">
              <span className="inline-flex items-center gap-1.5 font-medium text-white">
                <CheckBadgeIcon className="w-4 h-4 text-[#C9A35D]" />
                {vehicle.businessName}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <StarSolidIcon className="w-3.5 h-3.5 text-[#C9A35D]" />
                {vehicle.rating} ({vehicle.reviews} {isForSale ? 'verified buyer reviews' : 'verified trips'})
              </span>
              <span aria-hidden="true">·</span>
              <span>{isForSale ? vehicle.pickupAddress : `${pickupLocation} → ${returnLocation}`}</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-5 py-4 shrink-0 text-left lg:text-right">
            <p className="text-[11px] uppercase tracking-widest text-slate-300 font-semibold">
              {isForSale ? 'Asking Sale Price' : `${rentalDays}-Day All-Inclusive Estimate`}
            </p>
            <p className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-[#C9A35D] mt-0.5">
              {isForSale ? vehicle.price : `R ${grandTotalZar.toLocaleString()}`}
            </p>
            <p className="text-xs text-slate-300 font-mono tabular-nums mt-0.5">
              {isForSale
                ? `${vehicle.mileage || 'Verified Mileage'} · ${vehicle.condition || 'Inspected'}`
                : `${vehicle.price} / day · Includes R ${insuranceAndAirportFeeZar} CDW & dispatch`}
            </p>
          </div>
        </div>
      </section>

      {/* Main Two-Column Branded Workspace */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-10 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Primary Column */}
          <div className="lg:col-span-7 space-y-8">
            {step === 'details' ? (
              <>
                {/* Vehicle Dossier & Showcase */}
                <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="aspect-[16/9] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={vehicle.image}
                      alt={`${vehicle.make} ${vehicle.model} gallery view`}
                      onError={(e) => {
                        if (!e.currentTarget.dataset.fb) {
                          e.currentTarget.dataset.fb = '1';
                          e.currentTarget.src = '/images/luxury_suv_fleet.jpg';
                        }
                      }}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 sm:p-8 space-y-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A35D]">
                        {isForSale ? 'Vehicle Ownership & Roadworthy Overview' : 'Executive Chassis Overview'}
                      </p>
                      <h2 className="font-heading text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                        Vehicle Briefing &amp; Specifications
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                        {vehicle.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {vehicle.specs.map((spec) => (
                        <div
                          key={spec}
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 text-xs font-medium text-slate-800 dark:text-slate-200"
                        >
                          <CheckCircleIcon className="w-4 h-4 text-[#008F45] dark:text-[#C9A35D] shrink-0" />
                          <span>{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Step 1 Form: Driver/Hire or Buyer/Inspection */}
                <form
                  onSubmit={onProceedToSettlement}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A35D]">
                      {isForSale ? 'Step 01 · Viewing & Buyer Verification' : 'Step 01 · Schedule & Identity'}
                    </p>
                    <h2 className="font-heading text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                      {isForSale ? 'Schedule Inspection & Enter Buyer Details' : 'Confirm Itinerary & Primary Driver'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {isForSale
                        ? 'Select your preferred viewing date, enter your verified contact details, and submit an outright purchase or finance inquiry directly to the seller.'
                        : 'Adjust your pickup hub or dates if required, then enter primary driver credentials to authorize real-time online settlement.'}
                    </p>
                  </div>

                  {!isForSale ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Pickup Hub
                        </label>
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                          <MapPinIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                          <input
                            type="text"
                            value={pickupLocation}
                            onChange={(e) => setPickupLocation(e.target.value)}
                            className="w-full bg-transparent outline-none text-xs font-medium text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Drop-Off Hub
                        </label>
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                          <MapPinIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                          <input
                            type="text"
                            value={returnLocation}
                            onChange={(e) => setReturnLocation(e.target.value)}
                            className="w-full bg-transparent outline-none text-xs font-medium text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Pickup Date
                        </label>
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                          <CalendarIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                          <input
                            type="date"
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            className="w-full bg-transparent outline-none text-xs font-mono font-medium text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Return Date
                        </label>
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                          <CalendarIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                          <input
                            type="date"
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            className="w-full bg-transparent outline-none text-xs font-mono font-medium text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Driver Age Bracket
                        </label>
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                          <UserIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                          <select
                            value={driverAge}
                            onChange={(e) => setDriverAge(e.target.value)}
                            className="w-full bg-transparent outline-none text-xs font-medium text-slate-900 dark:text-white cursor-pointer"
                          >
                            <option value="30+">30+ Years (Standard Executive Cover)</option>
                            <option value="25–29">25–29 Years</option>
                            <option value="21–24">21–24 Years</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Preferred Inspection Date
                        </label>
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                          <CalendarIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                          <input
                            type="date"
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            className="w-full bg-transparent outline-none text-xs font-mono font-medium text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Your Offer Amount (ZAR)
                        </label>
                        <input
                          type="number"
                          min={5000}
                          value={saleOfferAmount}
                          onChange={(e) => setSaleOfferAmount(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono tabular-nums font-semibold text-slate-900 dark:text-white outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={financeRequested}
                            onChange={(e) => setFinanceRequested(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-700"
                          />
                          <span>Request bank vehicle finance / trade-in valuation from seller</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Driver / Buyer Identity Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                        {isForSale ? 'Full Legal Name *' : 'Primary Driver Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="Full legal name"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0F2D25] dark:focus:border-[#C9A35D]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={driverEmail}
                        onChange={(e) => setDriverEmail(e.target.value)}
                        placeholder="buyer@domain.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0F2D25] dark:focus:border-[#C9A35D]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                        Mobile / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={driverPhone}
                        onChange={(e) => setDriverPhone(e.target.value)}
                        placeholder="+27 82 000 0000"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0F2D25] dark:focus:border-[#C9A35D]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                      {isForSale
                        ? 'Inspection Questions or Trade-In Vehicle Details (Optional)'
                        : 'Arrival Flight Code or Chauffeur Dispatch Note (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={arrivalFlightNote}
                      onChange={(e) => setArrivalFlightNote(e.target.value)}
                      placeholder={
                        isForSale
                          ? 'e.g. Would like full service book inspection and Dekra check'
                          : 'e.g. Arriving on SA 317 · Request terminal meet-and-greet'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0F2D25] dark:focus:border-[#C9A35D]"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={onBackToCatalog}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Return to Transport Marketplace
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#0F2D25] hover:bg-[#173f34] text-white text-xs sm:text-sm font-bold transition-colors whitespace-nowrap"
                    >
                      {isForSale
                        ? 'Review Viewing & Purchase Offer'
                        : `Continue to Real-Time Settlement · R ${grandTotalZar.toLocaleString()}`}
                    </button>
                  </div>
                </form>
              </>
            ) : isForSale ? (
              /* Step 2 Full Branded Webpage for Car Sale Inspection & Offer Submission */
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A35D]">
                      Step 02 · Dealership &amp; Purchase Dossier
                    </p>
                    <h2 className="font-heading text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                      {saleInquiryRef
                        ? 'Viewing & Purchase Offer Logged'
                        : 'Confirm Vehicle Inspection & Submit Offer'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {saleInquiryRef
                        ? `Reference ${saleInquiryRef} has been transmitted to ${vehicle.businessName}. Vehicle purchase settlement occurs offline with verified title transfer.`
                        : 'Review your inspection schedule and purchase offer below. Vehicle title purchases settle directly with the verified seller or financed bank.'}
                    </p>
                  </div>
                  {!saleInquiryRef && (
                    <button
                      type="button"
                      onClick={() => onStepChange('details')}
                      className="text-xs font-semibold text-[#0F2D25] dark:text-[#C9A35D] hover:underline whitespace-nowrap shrink-0"
                    >
                      Edit Buyer Details
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF8F5] dark:bg-slate-800/70 rounded-xl p-5 border border-slate-200 dark:border-slate-700 text-xs">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Seller / Showroom Desk
                    </p>
                    <p className="font-semibold text-slate-900 dark:text-white mt-1">{vehicle.businessName}</p>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">{vehicle.pickupAddress}</p>
                    <p className="font-mono text-slate-600 dark:text-slate-300 mt-1">{vehicle.phone}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Offer &amp; Viewing Window
                    </p>
                    <p className="font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1">
                      Offer: R {(Number(saleOfferAmount) || askingPriceZar).toLocaleString()}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                      Inspection Date: <span className="font-mono">{pickupDate}</span>
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                      {financeRequested ? 'Bank Finance / Trade-In Valuation Requested' : 'Cash / Direct Settlement Inquiry'}
                    </p>
                  </div>
                </div>

                {saleInquiryRef ? (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 text-xs text-emerald-900 dark:text-emerald-200">
                      Inquiry Reference <span className="font-mono font-bold">{saleInquiryRef}</span> recorded for{' '}
                      <span className="font-semibold">{driverName}</span> ({driverEmail}).
                    </div>
                    <button
                      type="button"
                      onClick={onBackToCatalog}
                      className="px-5 py-2.5 rounded-xl bg-[#0F2D25] hover:bg-[#173f34] text-white text-xs font-bold transition-colors"
                    >
                      Done · Return to Transport Marketplace
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmittingSale}
                    onClick={handleConfirmSaleInquiry}
                    className="w-full py-3.5 rounded-xl bg-[#0F2D25] hover:bg-[#173f34] text-white text-xs sm:text-sm font-bold transition-colors disabled:opacity-60"
                  >
                    {isSubmittingSale
                      ? 'Submitting Inspection & Offer...'
                      : `Confirm Inspection & Submit Purchase Offer · R ${(Number(saleOfferAmount) || askingPriceZar).toLocaleString()}`}
                  </button>
                )}
              </section>
            ) : (
              /* Step 2 Full Branded Webpage: Real-Time Online Settlement & Dispatch Confirmation for Car Hire */
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A35D]">
                      Step 02 · Secure Online Checkout
                    </p>
                    <h2 className="font-heading text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                      {settledReceipt ? 'Booking & Digital Key Dispatch Confirmed' : 'Authorize Real-Time Car Hire Settlement'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {settledReceipt
                        ? `Your vehicle dispatch voucher has been issued for ${driverName || settledReceipt.customerName}. Present your authorization reference at ${vehicle.pickupAddress}.`
                        : 'Select your preferred African or international payment rail below to issue an immediate confirmed dispatch voucher.'}
                    </p>
                  </div>
                  {!settledReceipt && (
                    <button
                      type="button"
                      onClick={() => onStepChange('details')}
                      className="text-xs font-semibold text-[#0F2D25] dark:text-[#C9A35D] hover:underline whitespace-nowrap shrink-0"
                    >
                      Edit Driver &amp; Dates
                    </button>
                  )}
                </div>

                <PaymentSettlementPanel
                  bookingCategory="car-hire"
                  itemId={vehicle.id}
                  itemTitle={`${vehicle.make} ${vehicle.model}`}
                  itemSubtitle={`${pickupLocation} → ${returnLocation} (${pickupDate} to ${returnDate} · ${rentalDays} days)`}
                  amountZar={grandTotalZar}
                  displayTotal={`R ${grandTotalZar.toLocaleString()}`}
                  currencyCode="ZAR"
                  lineItems={[
                    { label: `${rentalDays} day(s) × R ${dailyRateZar.toLocaleString()}/day`, amountText: `R ${rentalSubtotalZar.toLocaleString()}` },
                    { label: 'CDW Protection & Terminal Key Dispatch Fee', amountText: `R ${insuranceAndAirportFeeZar.toLocaleString()}` },
                  ]}
                  customerName={driverName}
                  customerEmail={driverEmail}
                  metadata={{
                    pickupLocation,
                    returnLocation,
                    pickupDate,
                    returnDate,
                    rentalDays,
                    driverPhone,
                    driverAge,
                    arrivalFlightNote: arrivalFlightNote.trim() || undefined,
                  }}
                  submitLabel={`Settle Car Hire · R ${grandTotalZar.toLocaleString()}`}
                  onSettled={onCarHireSettled}
                />

                {settledReceipt && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF8F5] dark:bg-slate-800/70 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-xs">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Pickup Terminal &amp; Operator Desk
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-white mt-1">{vehicle.businessName}</p>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5">{vehicle.pickupAddress}</p>
                        <p className="font-mono text-slate-600 dark:text-slate-300 mt-1">{vehicle.phone}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Dispatch Window &amp; Integrity Code
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-white mt-1">
                          {pickupDate} → {returnDate} ({rentalDays} days)
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                          {pickupLocation} → {returnLocation}
                        </p>
                        <p className="font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                          {vehicle.verificationHash}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={onBackToCatalog}
                        className="px-5 py-2.5 rounded-xl bg-[#0F2D25] hover:bg-[#173f34] text-white text-xs font-bold transition-colors"
                      >
                        Done · Return to Transport Marketplace
                      </button>
                      {onNavigate && (
                        <>
                          <button
                            type="button"
                            onClick={() => onNavigate('book-a-stay')}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            Book Short-Term Stay
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate('book-flights')}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            Coordinate African Flights
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right Sticky Dossier Column */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C9A35D]">
                    {isForSale ? 'Vehicle Sale Dossier' : 'Reservation Dossier'}
                  </p>
                  <h3 className="font-heading text-xl font-semibold text-slate-900 dark:text-white mt-0.5">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {vehicle.category} · {vehicle.city}
                  </p>
                </div>
                <TruckIcon className="w-6 h-6 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500 dark:text-slate-400">{isForSale ? 'Dealership / Seller' : 'Operator Desk'}</span>
                  <span className="font-semibold text-right text-slate-900 dark:text-white">{vehicle.businessName}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500 dark:text-slate-400">{isForSale ? 'Viewing Address' : 'Pickup Address'}</span>
                  <span className="font-medium text-right text-slate-700 dark:text-slate-300 max-w-[220px]">
                    {vehicle.pickupAddress}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 dark:text-slate-400">{isForSale ? 'Seller Hotline' : 'Dispatch Hotline'}</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 inline-flex items-center gap-1">
                    <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                    {vehicle.phone}
                  </span>
                </div>
                {isForSale ? (
                  <>
                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Condition &amp; Mileage</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        {vehicle.condition || 'Certified'} · {vehicle.mileage || 'Verified'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 dark:text-slate-400">Inspection Date</span>
                      <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">{pickupDate}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Route</span>
                      <span className="font-semibold text-right text-slate-900 dark:text-white">
                        {pickupLocation} → {returnLocation}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 dark:text-slate-400">Schedule</span>
                      <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {pickupDate} → {returnDate} ({rentalDays}d)
                      </span>
                    </div>
                  </>
                )}
                {driverName.trim() && (
                  <div className="flex items-start justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">{isForSale ? 'Verified Buyer' : 'Verified Driver'}</span>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 dark:text-white">{driverName}</p>
                      {driverEmail && <p className="text-[11px] text-slate-500 dark:text-slate-400">{driverEmail}</p>}
                      {driverPhone && <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{driverPhone}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              {isForSale ? (
                <div className="rounded-xl bg-[#FAF8F5] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Asking Sale Price</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      {vehicle.price}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm font-bold">
                    <span className="text-slate-900 dark:text-white">Your Submitted Offer</span>
                    <span className="font-mono tabular-nums text-[#0F2D25] dark:text-[#C9A35D]">
                      R {(Number(saleOfferAmount) || askingPriceZar).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-[#FAF8F5] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300">
                      {rentalDays} day(s) × R {dailyRateZar.toLocaleString()}
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      R {rentalSubtotalZar.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300">CDW Protection &amp; Key Dispatch</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      R {insuranceAndAirportFeeZar.toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm font-bold">
                    <span className="text-slate-900 dark:text-white">Total All-Inclusive</span>
                    <span className="font-mono tabular-nums text-[#0F2D25] dark:text-[#C9A35D]">
                      R {grandTotalZar.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
                <p className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4 text-[#008F45] dark:text-[#C9A35D] shrink-0" />
                  <span>
                    {isForSale
                      ? 'Roadworthy status & seller ownership dossier verified'
                      : 'Comprehensive insurance & 24/7 African roadside dispatch included'}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <LockClosedIcon className="w-4 h-4 text-[#008F45] dark:text-[#C9A35D] shrink-0" />
                  <span>
                    {isForSale
                      ? 'Direct off-platform purchase settlement with dealership or bank finance'
                      : 'Instant digital dispatch pass · Zero surprise counter fees'}
                  </span>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default TransportBookingFlowPage;
