import React, { useMemo, useState } from 'react';
import {
  StarIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  CalendarIcon,
  UsersIcon,
  XMarkIcon,
  CheckIcon,
  CheckCircleIcon,
  KeyIcon,
  WifiIcon,
  BeakerIcon,
  MapIcon,
  FireIcon,
  ArrowLeftIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowUpIcon,
  SparklesIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

const faqs = [
  {
    question: 'What are the check-in and check-out times?',
    answer:
      'Check-in opens from 3:00 PM with private concierge reception, and check-out extends until 11:00 AM. Early arrival or late departure can be arranged upon confirmation.',
  },
  {
    question: 'Is private parking or airport transfer available?',
    answer:
      'Complimentary gated parking is included on site, and chauffeur transfers can be added directly during booking step 1.',
  },
  {
    question: 'What is the cancellation policy?',
    answer:
      'Reservations may be modified or cancelled at zero charge up to 48 hours prior to scheduled check-in.',
  },
];

const rooms = [
  {
    id: 1,
    name: 'Deluxe Ocean View Suite',
    size: '45m²',
    occupancy: 2,
    bed: '1 King Bed',
    priceNum: 4500,
    price: 'R 4,500',
    images: ['/images/coastal_mansion_1779978805301.png', '/images/loft_interior_1779978697203.png'],
    amenities: ['Ocean Terrace', 'Private Balcony', 'Artisan Bar', 'Fiber WiFi'],
    left: 2,
  },
  {
    id: 2,
    name: 'Garden Courtyard Villa',
    size: '68m²',
    occupancy: 4,
    bed: '2 Queen Beds',
    priceNum: 6200,
    price: 'R 6,200',
    images: ['/images/house_pool_1779978750296.png', '/images/apartment_dining_1779978782850.png'],
    amenities: ['Plunge Pool', 'Courtyard Deck', 'Full Kitchenette', 'Fiber WiFi'],
    left: 5,
  },
  {
    id: 3,
    name: 'Presidential Sky Penthouse',
    size: '125m²',
    occupancy: 4,
    bed: '1 King, 1 Queen',
    priceNum: 15000,
    price: 'R 15,000',
    images: ['/images/luxury_kitchen_living_1779978720358.png', '/images/harbour_house_1779978766107.png'],
    amenities: ['Panoramic Horizon', 'Dedicated Butler', 'Private Jacuzzi', 'Chauffeur Access'],
    left: 1,
  },
];

const reviews = [
  {
    name: 'Sarah M.',
    date: 'February 2026',
    rating: 5,
    text: 'Seamless digital arrival and extraordinary coastal views. Every detail inside the residence felt thoughtfully curated.',
  },
  {
    name: 'James L.',
    date: 'January 2026',
    rating: 5,
    text: 'Private pool maintenance, security, and local dining recommendations exceeded five-star hotel expectations.',
  },
];

interface StayDetailsPageProps {
  property: any;
  onBack: () => void;
  initialDates?: { checkIn: string; checkOut: string };
}

const StayDetailsPage: React.FC<StayDetailsPageProps> = ({ property, onBack, initialDates }) => {
  const { addToast } = useToast();
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [sortOrder, setSortOrder] = useState<'rec' | 'asc' | 'desc'>('rec');
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);

  const [bookingDates, setBookingDates] = useState({
    checkIn: initialDates?.checkIn || '2026-06-15',
    checkOut: initialDates?.checkOut || '2026-06-18',
  });
  const [guestCount, setGuestCount] = useState('2 Guests, 1 Room');
  const [paymentTiming, setPaymentTiming] = useState<'now' | 'property'>('now');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [guestForm, setGuestForm] = useState({ firstName: '', lastName: '', email: '', arrival: "2:00 PM - 4:00 PM", notes: '' });
  const [addons, setAddons] = useState({
    breakfast: false,
    transfer: false,
    spa: false,
    upgrade: false,
    occasion: false,
    insurance: false,
  });

  const sortedRooms = useMemo(() => {
    const copy = [...rooms];
    if (sortOrder === 'asc') return copy.sort((a, b) => a.priceNum - b.priceNum);
    if (sortOrder === 'desc') return copy.sort((a, b) => b.priceNum - a.priceNum);
    return copy;
  }, [sortOrder]);

  const addonTotal = useMemo(() => {
    let total = 0;
    if (addons.breakfast) total += 350;
    if (addons.transfer) total += 1200;
    if (addons.spa) total += 2500;
    if (addons.occasion) total += 850;
    if (addons.insurance) total += 250;
    return total;
  }, [addons]);

  const startBooking = (room: any) => {
    if (!bookingDates.checkIn || !bookingDates.checkOut) {
      addToast('Please select check-in and check-out dates first.', 'info');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSelectedRoom(room);
    setBookingStep(1);
  };

  const handleConfirmBooking = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const username = user?.email || guestForm.email || 'guest';

      const newBooking = {
        property_id: property.id || 'stay-booking',
        property_title: `${property.name} — ${selectedRoom?.name || 'Suite'}`,
        username,
        date: bookingDates.checkIn,
        time: '14:00',
        status: 'Confirmed',
        timestamp: Date.now(),
      };
      await supabase.from('tour_requests').insert(newBooking);
    } catch {
      // fallback gracefully
    } finally {
      setBookingStep(4);
      addToast(`Reservation confirmed at ${property.name}!`, 'success');
    }
  };

  return (
    <div className="w-full bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen relative font-sans">
      {/* Floating Return Button */}
      <div className="fixed top-20 left-6 z-40">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-lg hover:bg-white transition-colors text-xs font-semibold"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to Stays
        </button>
      </div>

      {/* Full-Bleed Architectural Hero */}
      <div className="relative w-full h-[65vh] min-h-[460px]">
        <img
          src={property.image}
          alt={property.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F1A] via-[#0B1F1A]/45 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 lg:px-16 pb-20 text-white">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A35D] mb-2">
              {property.badge || 'Verified Residence'} · {property.type || 'Boutique Stay'}
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.08]">
              {property.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs sm:text-sm text-slate-200">
              <span className="flex items-center gap-1 font-mono tabular-nums font-semibold">
                <StarIconSolid className="w-4 h-4 text-[#C9A35D]" />
                {property.rating} (128 reviews)
              </span>
              <span aria-hidden="true">&middot;</span>
              <span className="flex items-center gap-1">
                <MapPinIcon className="w-4 h-4 text-[#C9A35D]" /> {property.location}
              </span>
              <span aria-hidden="true">&middot;</span>
              <span className="flex items-center gap-1 text-emerald-300 font-medium">
                <ShieldCheckIcon className="w-4 h-4" /> Title &amp; Host Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Availability Control Strip */}
      <div className="relative z-30 -mt-12 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-3 sm:p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Check In
              </label>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D]" />
                <input
                  type="date"
                  value={bookingDates.checkIn}
                  onChange={(e) => setBookingDates({ ...bookingDates, checkIn: e.target.value })}
                  className="w-full bg-transparent outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Check Out
              </label>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D]" />
                <input
                  type="date"
                  value={bookingDates.checkOut}
                  onChange={(e) => setBookingDates({ ...bookingDates, checkOut: e.target.value })}
                  className="w-full bg-transparent outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700 relative">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Guests &amp; Suites
              </label>
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D]" />
                <select
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm font-medium appearance-none cursor-pointer"
                >
                  <option>2 Guests, 1 Room</option>
                  <option>1 Guest, 1 Room</option>
                  <option>4 Guests, 2 Rooms</option>
                </select>
                <ChevronDownIcon className="w-4 h-4 text-slate-400 absolute right-3 bottom-3 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={() => {
                document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' });
                addToast(`Showing available suites for ${bookingDates.checkIn} to ${bookingDates.checkOut}`, 'info');
              }}
              className="h-[58px] bg-[#0F2D25] text-white rounded-xl text-sm font-semibold hover:bg-[#173f34] transition-colors"
            >
              Check Availability
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">
          {/* Overview */}
          <section>
            <h2 className="font-heading text-3xl font-semibold text-slate-900 dark:text-white mb-4">
              Residence Overview
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base mb-8">
              Positioned in {property.location}, {property.name} blends contemporary African architecture with hotel-grade service. Enjoy sunlit living volumes, dedicated concierge arrival, and curated amenities engineered for restorative stays.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {[
                { icon: WifiIcon, label: 'Fiber Connectivity' },
                { icon: BeakerIcon, label: 'Wellness & Spa' },
                { icon: FireIcon, label: 'Private Dining' },
                { icon: KeyIcon, label: 'Digital Access' },
              ].map((facility) => (
                <div
                  key={facility.label}
                  className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3"
                >
                  <facility.icon className="w-5 h-5 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{facility.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Demand Notice */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl flex items-center gap-3.5">
            <FireIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
              <strong className="font-semibold">Seasonal Availability:</strong> Several dates this month are nearly fully booked across prime suites.
            </p>
          </div>

          {/* Suites Selection */}
          <section id="rooms">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="font-heading text-3xl font-semibold text-slate-900 dark:text-white">
                Available Suites &amp; Villas
              </h2>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Sort:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'rec' | 'asc' | 'desc')}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none"
                >
                  <option value="rec">Recommended</option>
                  <option value="asc">Price: Low to High</option>
                  <option value="desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            <div className="space-y-5">
              {sortedRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row"
                >
                  <div className="relative w-full md:w-2/5 h-56 md:h-auto overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={room.images[0]}
                      alt={room.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-3 left-3 bg-white/90 text-slate-900 px-2.5 py-1 rounded-md text-[11px] font-semibold">
                      {room.left} remaining
                    </span>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-heading text-2xl font-semibold text-slate-900 dark:text-white">
                        {room.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        {room.size} · Up to {room.occupancy} guests · {room.bed}
                      </p>
                      <p className="text-xs font-medium text-[#0F2D25] dark:text-emerald-400 mt-3">
                        {room.amenities.join(' · ')}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-2xl font-bold font-mono tabular-nums text-[#0F2D25] dark:text-emerald-400">
                          {room.price}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">per night, incl. taxes</p>
                      </div>
                      <button
                        onClick={() => startBooking(room)}
                        className="bg-[#0F2D25] text-white px-6 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#173f34] transition-colors whitespace-nowrap"
                      >
                        Select Suite
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Verified Reviews */}
          <section className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-3xl font-semibold text-slate-900 dark:text-white">Guest Reviews</h2>
              <span className="inline-flex items-center gap-1.5 text-sm font-mono tabular-nums font-bold">
                <StarIconSolid className="w-4 h-4 text-[#C9A35D]" /> {property.rating} / 5.0
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {reviews.map((review) => (
                <div
                  key={review.name}
                  className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-0.5 mb-2.5">
                    {[...Array(5)].map((_, idx) => (
                      <StarIconSolid
                        key={idx}
                        className={`w-4 h-4 ${idx < review.rating ? 'text-[#C9A35D]' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed mb-4">
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">{review.name}</span>
                    <span>{review.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="h-48 relative bg-slate-200 dark:bg-slate-800">
              <img
                src="/images/getlstd-property-photo.jpg"
                alt="Neighborhood aerial view"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
                <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                  <MapIcon className="w-4 h-4 text-[#C9A35D]" /> {property.location}
                </span>
              </div>
            </div>
            <div className="p-5 space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">International Airport</span>
                <span className="font-mono tabular-nums font-semibold">25 mins</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 dark:text-slate-400">Financial &amp; Dining District</span>
                <span className="font-mono tabular-nums font-semibold">10 mins</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 text-[#0F2D25] dark:text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-3">
              <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Dedicated Concierge Host</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              100% verified response rate · 24/7 local team
            </p>
            <button
              onClick={() => setIsConciergeOpen(true)}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs"
            >
              Message Concierge
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-heading text-xl font-semibold text-slate-900 dark:text-white mb-4">Good to Know</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {faqs.map((faq, index) => (
                <div key={faq.question} className="py-3 first:pt-0 last:pb-0">
                  <button
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                    className="w-full flex justify-between items-center text-left text-xs font-semibold text-slate-900 dark:text-white gap-2"
                  >
                    <span>{faq.question}</span>
                    <ChevronDownIcon
                      className={`w-4 h-4 shrink-0 transition-transform ${activeFaq === index ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {activeFaq === index && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{faq.answer}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Concierge Trigger */}
      <button
        onClick={() => setIsConciergeOpen((v) => !v)}
        aria-label="Toggle host concierge"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-[#0F2D25] text-white rounded-full flex items-center justify-center shadow-xl hover:bg-[#173f34] transition-colors"
      >
        <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-[#C9A35D]" />
      </button>

      {isConciergeOpen && (
        <div className="fixed bottom-20 right-6 z-40 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-900 dark:text-white">Direct Host Desk</p>
            <button onClick={() => setIsConciergeOpen(false)} className="text-slate-400 hover:text-slate-600">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Have a question about early check-in, private chefs, or airport transfers at {property.name}?
          </p>
          <button
            onClick={() => {
              setIsConciergeOpen(false);
              addToast(`Direct concierge request sent to ${property.name} team.`, 'success');
            }}
            className="w-full py-2 bg-[#0F2D25] text-white rounded-lg text-xs font-semibold hover:bg-[#173f34]"
          >
            Request Instant Callback
          </button>
        </div>
      )}

      {/* Multi-Step Booking Drawer / Overlay */}
      {bookingStep > 0 && selectedRoom && (
        <div className="fixed inset-0 z-[100] bg-[#FAF8F5] dark:bg-slate-950 flex flex-col">
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setBookingStep(0)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-10 sm:w-20 h-1.5 rounded-full ${
                    step <= bookingStep ? 'bg-[#0F2D25] dark:bg-[#C9A35D]' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">Step {bookingStep}/4</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                {bookingStep === 1 && (
                  <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <h2 className="font-heading text-2xl font-semibold mb-1">Tailor Your Stay</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                      Optional curated additions guaranteed upon check-in.
                    </p>
                    <div className="space-y-3">
                      {[
                        { id: 'breakfast', label: 'Artisan Breakfast Service', price: 'R 350 / day', desc: 'Chef-prepared breakfast delivered daily.', icon: BeakerIcon },
                        { id: 'transfer', label: 'Private Airport Transfer', price: 'R 1,200', desc: 'Executive sedan meet-and-greet pickup.', icon: MapPinIcon },
                        { id: 'spa', label: 'In-Residence Wellness Ritual', price: 'R 2,500', desc: '90-minute signature therapeutic massage.', icon: SparklesIcon },
                        { id: 'upgrade', label: 'Priority Suite Upgrade', price: 'Included', desc: 'Guaranteed priority review at arrival.', icon: ArrowUpIcon },
                        { id: 'occasion', label: 'Celebration Amenity Set', price: 'R 850', desc: 'Cape vintage bottle and floral styling.', icon: HeartIcon },
                        { id: 'insurance', label: 'Flexible Cancellation Protection', price: 'R 250', desc: 'Instant refund protection for travel changes.', icon: ShieldCheckIcon },
                      ].map((addon) => {
                        const Icon = addon.icon;
                        const active = addons[addon.id as keyof typeof addons];
                        return (
                          <button
                            key={addon.id}
                            type="button"
                            onClick={() => setAddons({ ...addons, [addon.id]: !active })}
                            className={`w-full text-left p-4 rounded-xl border transition-colors flex items-start gap-3.5 ${
                              active
                                ? 'border-[#0F2D25] bg-emerald-50/40 dark:bg-emerald-950/30 dark:border-emerald-500'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                active ? 'bg-[#0F2D25] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              {active ? <CheckIcon className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{addon.label}</span>
                                <span className="text-xs font-mono tabular-nums font-bold text-[#0F2D25] dark:text-[#C9A35D] shrink-0">
                                  {addon.price}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{addon.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <button
                        onClick={() => setBookingStep(2)}
                        className="bg-[#0F2D25] text-white px-6 py-3 rounded-xl text-xs font-semibold hover:bg-[#173f34]"
                      >
                        Continue to Guest Details
                      </button>
                    </div>
                  </div>
                )}

                {bookingStep === 2 && (
                  <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
                    <h2 className="font-heading text-2xl font-semibold">Primary Guest Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">First Name</label>
                        <input
                          type="text"
                          value={guestForm.firstName}
                          onChange={(e) => setGuestForm({ ...guestForm, firstName: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                          placeholder="Amara"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={guestForm.lastName}
                          onChange={(e) => setGuestForm({ ...guestForm, lastName: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                          placeholder="Okafor"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={guestForm.email}
                          onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                          placeholder="amara@domain.com"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Estimated Arrival</label>
                        <select
                          value={guestForm.arrival}
                          onChange={(e) => setGuestForm({ ...guestForm, arrival: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                        >
                          <option>2:00 PM - 4:00 PM</option>
                          <option>4:00 PM - 6:00 PM</option>
                          <option>After 6:00 PM</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Concierge Notes</label>
                        <textarea
                          rows={3}
                          value={guestForm.notes}
                          onChange={(e) => setGuestForm({ ...guestForm, notes: e.target.value })}
                          placeholder="Dietary preferences, late check-in, or transfer flight details..."
                          className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none resize-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => setBookingStep(1)} className="text-xs font-semibold text-slate-500">
                        Back
                      </button>
                      <button
                        onClick={() => setBookingStep(3)}
                        className="bg-[#0F2D25] text-white px-6 py-3 rounded-xl text-xs font-semibold hover:bg-[#173f34]"
                      >
                        Continue to Settlement
                      </button>
                    </div>
                  </div>
                )}

                {bookingStep === 3 && (
                  <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
                    <div>
                      <h2 className="font-heading text-2xl font-semibold">Protected Reservation Settlement</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        256-bit TLS encryption · Escrow held until check-in
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentTiming('now')}
                        className={`text-left p-4 rounded-xl border ${
                          paymentTiming === 'now'
                            ? 'border-[#0F2D25] bg-emerald-50/40 dark:bg-emerald-950/30'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <p className="text-sm font-semibold">Pay Now</p>
                        <p className="text-xs text-slate-500 mt-0.5">Lock instant rate &amp; priority suite assignment.</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentTiming('property')}
                        className={`text-left p-4 rounded-xl border ${
                          paymentTiming === 'property'
                            ? 'border-[#0F2D25] bg-emerald-50/40 dark:bg-emerald-950/30'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <p className="text-sm font-semibold">Pay at Property</p>
                        <p className="text-xs text-slate-500 mt-0.5">Hold suite with arrival card settlement.</p>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {['Credit Card', 'Instant EFT', 'Apple Pay', 'Corporate Invoice'].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold border ${
                            paymentMethod === method
                              ? 'border-[#0F2D25] bg-[#0F2D25] text-white'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>

                    <div className="bg-[#FAF8F5] dark:bg-slate-800/70 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Card Number</label>
                        <input
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Expiry</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Security Code</label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => setBookingStep(2)} className="text-xs font-semibold text-slate-500">
                        Back
                      </button>
                      <button
                        onClick={handleConfirmBooking}
                        className="bg-[#0F2D25] text-white px-7 py-3 rounded-xl text-xs font-semibold hover:bg-[#173f34]"
                      >
                        Confirm Reservation
                      </button>
                    </div>
                  </div>
                )}

                {bookingStep === 4 && (
                  <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-5">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircleIcon className="w-9 h-9" />
                    </div>
                    <h2 className="font-heading text-3xl font-semibold">Reservation Confirmed</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                      Your suite at {property.name} is secured for {bookingDates.checkIn} to {bookingDates.checkOut}. Digital check-in credentials have been issued.
                    </p>
                    <div className="bg-[#FAF8F5] dark:bg-slate-800 px-6 py-4 rounded-xl inline-block border border-dashed border-slate-300 dark:border-slate-700">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">Confirmation Reference</p>
                      <p className="text-xl font-mono font-bold text-[#0F2D25] dark:text-[#C9A35D] mt-1">
                        AFR-{String(Date.now()).slice(-6)}
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setBookingStep(0);
                          onBack();
                        }}
                        className="bg-[#0F2D25] text-white px-8 py-3 rounded-xl text-xs font-semibold hover:bg-[#173f34]"
                      >
                        Return to Stays
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {bookingStep < 4 && (
                <div className="md:col-span-1">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 sticky top-6 space-y-4">
                    <h3 className="font-semibold text-sm pb-3 border-b border-slate-100 dark:border-slate-800">
                      Reservation Summary
                    </h3>
                    <div className="flex gap-3">
                      <img
                        src={selectedRoom.images[0]}
                        alt={selectedRoom.name}
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{property.name}</p>
                        <p className="text-xs text-[#0F2D25] dark:text-[#C9A35D] font-medium truncate">
                          {selectedRoom.name}
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#FAF8F5] dark:bg-slate-800/70 p-3 rounded-xl text-xs space-y-1.5 font-mono tabular-nums">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Check In</span>
                        <span className="font-semibold">{bookingDates.checkIn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Check Out</span>
                        <span className="font-semibold">{bookingDates.checkOut}</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800 font-mono tabular-nums">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Suite Rate (1 night)</span>
                        <span>{selectedRoom.price}</span>
                      </div>
                      {addonTotal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Curated Add-ons</span>
                          <span>R {addonTotal.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white">
                        <span>Estimated Total</span>
                        <span>R {(selectedRoom.priceNum + addonTotal).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StayDetailsPage;
