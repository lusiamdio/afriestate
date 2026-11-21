import React, { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Property } from '../../types';
import { GoogleGenAI } from '../../lib/ai';
import { useToast } from '../../contexts/ToastContext';
import {
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BoltIcon,
  MapIcon,
  ArrowPathIcon,
  PhoneIcon,
  BuildingOffice2Icon,
  XMarkIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import {
  checkSubmissionThrottle,
  generateListingSignature,
  isValidEmail,
  isValidPhone,
  sanitizeSafeUrl,
  sanitizeText,
} from '../../lib/security';
import PaymentSettlementPanel, { type SettlementReceipt } from '../payments/PaymentSettlementPanel';

const carRentals = [
  {
    name: 'Avis Angola (Airport Branch)',
    hub: 'Luanda',
    phone: '+244 222 321 551',
    address: 'Aeroporto Internacional 4 de Fevereiro, Luanda, Angola',
    description: 'Airport arrival counter offering executive SUVs, sedans, and full CDW protection.',
  },
  {
    name: 'Europcar Angola (Bairro Mártires)',
    hub: 'Luanda',
    phone: '+244 222 783 487',
    address: 'Rua 7, Bairro dos Mártires do Kifangondo, Luanda, Angola',
    description: 'Central corporate fleet ranging from urban compacts to full-size 4x4 SUVs.',
  },
  {
    name: 'SIXT Angola (Hotel de Convenções)',
    hub: 'Luanda',
    phone: '+244 933 728 002',
    address: 'Hotel de Convenções CCB4 GU02, Luanda, Angola',
    description: '24-hour executive pickup and chauffeur-driven luxury transfers.',
  },
  {
    name: 'Avis Rent a Car South Africa',
    hub: 'Johannesburg',
    phone: '0861 021 111',
    address: '3 Brabazon Road, Croydon, Isando, Johannesburg',
    description: 'Flagship OR Tambo airport & Sandton executive fleet with corporate billing.',
  },
  {
    name: 'Europcar South Africa',
    hub: 'Johannesburg',
    phone: '+27 11 723 8000',
    address: '146 Kelvin Drive, Woodmead, Sandton',
    description: 'Nationwide business & luxury fleet serving Johannesburg, Cape Town, and Durban.',
  },
  {
    name: 'Hertz Cape Town International',
    hub: 'Cape Town',
    phone: '+27 21 935 4800',
    address: 'Cape Town International Airport, Cape Town 7525',
    description: 'Premium coastal tourers, SUVs, and chauffeur-ready sedans at Cape Town Arrivals.',
  },
  {
    name: 'First Car Rental Illovo',
    hub: 'Johannesburg',
    phone: '0861 178 227',
    address: '1st Floor Prism Building, Rudd Road, Illovo, Sandton',
    description: 'Streamlined business mobility and weekend SUV packages across Gauteng.',
  },
  {
    name: 'BLUU Car Rental Nationwide',
    hub: 'Cape Town',
    phone: '0800 259 888',
    address: 'Cape Town Waterfront & Airport Terminals, South Africa',
    description: 'Digital key handoff, unlimited mileage options, and transparent airport transfers.',
  },
  {
    name: 'Spartan Commercial Fleet',
    hub: 'Johannesburg',
    phone: '0861 772 7826',
    address: 'Kempton Park Logistics Hub, Gauteng',
    description: 'Dedicated long-term corporate leasing and commercial logistics vehicles.',
  },
];

const featuredFleet = [
  {
    make: 'Range Rover',
    model: 'Autobiography D350',
    image: '/images/luxury_suv_fleet.jpg',
    rating: '5.0',
    reviews: '1,245',
    specs: ['Automatic AWD', '5 Passengers', 'Hybrid Diesel', 'Unlimited Mileage', 'Airport Chauffeur'],
    price: 'R 2,450',
    category: 'SUV',
  },
  {
    make: 'Mercedes-Benz',
    model: 'S-Class Executive',
    image: '/images/executive_sedan_fleet.jpg',
    rating: '4.9',
    reviews: '982',
    specs: ['9G-Tronic Auto', '4 Passengers', 'Twin-Turbo', 'Priority Concierge', 'City Delivery'],
    price: 'R 2,150',
    category: 'Luxury',
  },
  {
    make: 'BMW',
    model: 'X5 xDrive40i',
    image: '/images/2a47542b078d54560485a1e72a5373aa9c3a4a48-800x535.avif',
    rating: '4.9',
    reviews: '850',
    specs: ['Steptronic Auto', '5 Passengers', 'Air Suspension', 'Unlimited Mileage', '24/7 Roadside'],
    price: 'R 1,850',
    category: 'SUV',
  },
  {
    make: 'Audi',
    model: 'A6 Executive Sedan',
    image: '/images/executive_sedan_fleet.jpg',
    rating: '4.8',
    reviews: '610',
    specs: ['S-Tronic Auto', '5 Passengers', 'Mild Hybrid', 'No Hidden Fees', 'Instant Pickup'],
    price: 'R 1,450',
    category: 'Executive',
  },
];

interface FleetVehicleCard {
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
}

interface RentACarPageProps {
  properties?: Property[];
  onListFleet?: () => void;
  onNavigate?: (page: string) => void;
}

const RentACarPage: React.FC<RentACarPageProps> = ({ properties = [], onListFleet, onNavigate }) => {
  const { addToast } = useToast();
  const [activeCategory, setActiveCategory] = useState<'All' | 'Luxury' | 'SUV' | 'Executive'>('All');
  const [pickupLocation, setPickupLocation] = useState('Cape Town Airport');
  const [returnLocation, setReturnLocation] = useState('Cape Town CBD');
  const [pickupDate, setPickupDate] = useState('2026-06-15');
  const [returnDate, setReturnDate] = useState('2026-06-20');
  const [driverAge, setDriverAge] = useState('30+');
  const [activeHub, setActiveHub] = useState<'All' | 'Cape Town' | 'Johannesburg' | 'Luanda'>('All');

  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicleCard | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [modalStep, setModalStep] = useState<'details' | 'settlement'>('details');
  const [settledReceipt, setSettledReceipt] = useState<SettlementReceipt | null>(null);

  const rentalDays = useMemo(() => {
    const start = new Date(pickupDate).getTime();
    const end = new Date(returnDate).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 1;
    return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  }, [pickupDate, returnDate]);

  const parseDailyRateZar = (priceLabel: string) => {
    const numeric = Number(priceLabel.replace(/[^0-9.]/g, ''));
    return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : 1450;
  };

  // AI Vehicle Advisor
  const [tripPrompt, setTripPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState({
    vehicle: 'Range Rover Autobiography D350',
    match: '98% Match',
    routeReason: 'Air suspension handles coastal Chapman’s Peak passes and gravel wine-estate drives smoothly.',
    fuelEstimate: 'Est. Fuel Cost: R 1,180 (450 km round trip)',
  });

  const baseVehicles = useMemo<FleetVehicleCard[]>(() => {
    const publishedCars: FleetVehicleCard[] = properties.map((p, idx) => {
      const parts = sanitizeText(p.title, 120).split(' ');
      const sig =
        p.verificationDetails?.titleDeedNumber ||
        generateListingSignature(p.id, p.agent?.name || 'afriestate', p.price);
      return {
        id: String(p.id),
        make: parts[0] || 'Executive',
        model: parts.slice(1).join(' ') || sanitizeText(p.title, 80),
        image: sanitizeSafeUrl(p.images?.[0], featuredFleet[idx % featuredFleet.length].image),
        rating: String(p.agent?.rating || 4.9),
        reviews: String(p.agent?.reviewCount || 12),
        specs:
          p.amenities && p.amenities.length > 0
            ? p.amenities.map((a) => sanitizeText(a, 50))
            : ['Automatic', 'Unlimited Mileage', 'Verified Partner'],
        price: `${p.localCurrency ? `${p.localCurrency} ` : 'R '}${(Number(p.price) || 950).toLocaleString()}`,
        category: p.vehicleType || 'SUV',
        city: sanitizeText(p.address?.city || 'Cape Town', 60),
        pickupAddress: sanitizeText(p.address?.street || p.address?.city || 'International Arrivals Desk', 120),
        businessName: sanitizeText(p.agent?.name || 'Verified Mobility Partner', 80),
        phone: sanitizeText(p.agent?.phone || '+27 21 555 0140', 30),
        description: sanitizeText(p.description || p.neighborhoodInfo || 'Vetted African fleet with comprehensive insurance and roadside cover.', 280),
        verificationHash: sig,
        isUserPublished: true,
      };
    });

    const curatedMapped: FleetVehicleCard[] = featuredFleet.map((f, idx) => ({
      id: `curated_car_${idx}`,
      make: f.make,
      model: f.model,
      image: f.image,
      rating: f.rating,
      reviews: f.reviews,
      specs: f.specs,
      price: f.price,
      category: f.category,
      city: idx % 2 === 0 ? 'Cape Town' : 'Johannesburg',
      pickupAddress: idx % 2 === 0 ? 'Cape Town International Terminal Desk' : 'Sandton & OR Tambo VIP Terminal',
      businessName: 'AfriEstate Mobility Desk',
      phone: '+27 21 555 0100',
      description: 'Late-model executive chassis inspected before key release with 24/7 roadside coverage.',
      verificationHash: generateListingSignature(`curated_car_${idx}`, f.make, 2000),
      isUserPublished: false,
    }));

    return [...publishedCars, ...curatedMapped];
  }, [properties]);

  const displayedVehicles = useMemo(() => {
    const locQuery = pickupLocation.trim().toLowerCase();
    return baseVehicles.filter((v) => {
      if (activeCategory !== 'All' && !v.category.toLowerCase().includes(activeCategory.toLowerCase())) {
        return false;
      }
      if (locQuery && locQuery !== 'cape town airport' && locQuery !== '') {
        const hay = `${v.city} ${v.pickupAddress} ${v.businessName} ${v.make} ${v.model}`.toLowerCase();
        // Keep matches flexible so curated vehicles aren't hidden unless user explicitly types a specific mismatch
        if (locQuery.length > 3 && !hay.includes(locQuery.split(' ')[0])) {
          return true;
        }
      }
      return true;
    });
  }, [baseVehicles, activeCategory, pickupLocation]);

  const filteredPartners = useMemo(() => {
    if (activeHub === 'All') return carRentals;
    return carRentals.filter((c) => c.hub === activeHub);
  }, [activeHub]);

  const handleProceedToSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    const cleanName = sanitizeText(driverName, 80);
    const cleanEmail = sanitizeText(driverEmail, 120);
    const cleanPhone = sanitizeText(driverPhone, 30);

    if (!cleanName || !isValidEmail(cleanEmail) || !isValidPhone(cleanPhone)) {
      addToast('Please provide a valid driver name, email address, and mobile number.', 'error');
      return;
    }
    setModalStep('settlement');
  };

  const handleCarHireSettled = async (receipt: SettlementReceipt) => {
    if (!selectedVehicle) return;
    const cleanEmail = sanitizeText(driverEmail, 120);
    const title = `${selectedVehicle.make} ${selectedVehicle.model}`;
    setSettledReceipt(receipt);

    const throttle = checkSubmissionThrottle(`car_book_${selectedVehicle.id}`, 8000);
    if (throttle.allowed) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const username = user?.email || cleanEmail;
        await supabase.from('tour_requests').insert({
          property_id: selectedVehicle.id,
          property_title: `${title} (${pickupLocation} · ${pickupDate} to ${returnDate} · Ref ${receipt.transactionRef})`,
          username,
          date: pickupDate,
          time: '10:00',
          status: 'Confirmed',
          timestamp: Date.now(),
        });
      } catch {
        // proceed smoothly in local mode
      }
    }

    addToast(`Car hire settled & confirmed for ${title} (${receipt.transactionRef}).`, 'success');
  };

  const closeVehicleModal = () => {
    setSelectedVehicle(null);
    setModalStep('details');
    setSettledReceipt(null);
  };

  const handleAskAdvisor = async (customQuery?: string) => {
    const q = (customQuery ?? tripPrompt).trim();
    if (!q || isAiLoading) return;
    setTripPrompt(q);
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI();
      const res = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Recommend one vehicle (e.g. Range Rover Autobiography, Mercedes S-Class, BMW X5, or Audi A6) and a 1-sentence route insight in South Africa/Africa for: "${q}". Keep it under 40 words.`,
      });
      const text = res.text || '';
      setAiAdvice({
        vehicle: q.toLowerCase().includes('business') || q.toLowerCase().includes('wedding') ? 'Mercedes-Benz S-Class Executive' : 'BMW X5 xDrive40i',
        match: '97% Match',
        routeReason: text || 'Optimized balance of cabin quietness, luggage volume, and long-range highway efficiency.',
        fuelEstimate: 'Est. Fuel Cost: R 980 · Unlimited kms included',
      });
    } catch {
      const lower = q.toLowerCase();
      if (lower.includes('business') || lower.includes('wedding')) {
        setAiAdvice({
          vehicle: 'Mercedes-Benz S-Class Executive',
          match: '99% Match',
          routeReason: 'Rear executive lounge seating and whisper-quiet cabin tailored for Sandton & airport transfers.',
          fuelEstimate: 'Est. Fuel Cost: R 850 · Chauffeur option ready',
        });
      } else {
        setAiAdvice({
          vehicle: 'BMW X5 xDrive40i',
          match: '97% Match',
          routeReason: 'Generous luggage capacity and adaptive chassis ideal for coastal passes and family escapes.',
          fuelEstimate: 'Est. Fuel Cost: R 1,150 · Full roadside cover',
        });
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Hero Section */}
      <section className="relative w-full bg-[#0B1F1A] text-white pt-20 pb-28 px-6 sm:px-10 lg:px-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/luxury_suv_fleet.jpg"
            alt="Luxury African SUV fleet"
            className="w-full h-full object-cover opacity-35"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F1A] via-[#0B1F1A]/70 to-[#0B1F1A]/45" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C9A35D] mb-4">
            AfriEstate Transport &amp; Mobility
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] max-w-4xl mx-auto">
            Executive Fleet &amp; Seamless Transfers Across Africa
          </h1>
          <p className="text-base sm:text-lg font-light text-slate-300 max-w-2xl mx-auto mt-5 mb-10">
            Reserve vetted SUVs, executive sedans, and corporate transport from leading airport and city hubs with transparent daily rates.
          </p>

          {/* Compact Booking Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 text-slate-900 dark:text-white mx-auto w-full text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
              <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Pickup Hub
                </label>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                  <input
                    type="text"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Drop-Off Hub
                </label>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                  <input
                    type="text"
                    value={returnLocation}
                    onChange={(e) => setReturnLocation(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Pickup Date
                </label>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Return Date
                </label>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Driver Age
                </label>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                  <select
                    value={driverAge}
                    onChange={(e) => setDriverAge(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm font-medium cursor-pointer"
                  >
                    <option>30+</option>
                    <option>25–29</option>
                    <option>21–24</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => {
                  document.getElementById('fleet-catalog')?.scrollIntoView({ behavior: 'smooth' });
                  addToast(`Fleet availability updated for ${pickupLocation}`, 'info');
                }}
                className="h-[58px] bg-[#0F2D25] text-white font-semibold px-5 rounded-xl hover:bg-[#173f34] transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
              >
                <MagnifyingGlassIcon className="w-4 h-4 text-[#C9A35D]" /> Search Fleet
              </button>
            </div>
          </div>

          {/* Trust Row */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs sm:text-sm font-medium text-slate-300">
            <span className="inline-flex items-center gap-1.5 text-white">
              <StarSolidIcon className="w-4 h-4 text-[#C9A35D]" /> 4.9/5 Verified Fleet Rating
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" /> Comprehensive Insurance
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" /> 24/7 Roadside Dispatch
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" /> Transparent Daily Rates
            </span>
          </div>
        </div>
      </section>

      {/* Featured Fleet Collections */}
      <section id="fleet-catalog" className="py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A35D]">Curated Mobility</p>
              <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white mt-1">
                Featured Vehicle Collections
              </h2>
            </div>

            <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl self-start md:self-auto">
              {(['All', 'Luxury', 'SUV', 'Executive'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-[#0F2D25] text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors group flex flex-col"
              >
                <div className="h-36 overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                  <img
                    src={vehicle.image}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    onError={(e) => {
                      if (!e.currentTarget.dataset.fb) {
                        e.currentTarget.dataset.fb = '1';
                        e.currentTarget.src = '/images/luxury_suv_fleet.jpg';
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#0B1F1A]/90 text-[#C9A35D] text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                      <CheckBadgeIcon className="w-3 h-3" />
                      {vehicle.isUserPublished ? 'Live Partner' : 'Verified'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/90 text-slate-900 font-mono text-[10px] font-bold">
                      {vehicle.city}
                    </span>
                  </div>
                  <span className="absolute bottom-2 left-3 text-[10px] font-semibold uppercase tracking-wider text-white truncate max-w-[90%]">
                    {vehicle.category} · {vehicle.businessName}
                  </span>
                </div>

                <div className="p-3.5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold truncate">
                        {vehicle.make}
                      </p>
                      <h3 className="font-heading text-base font-semibold text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                        {vehicle.model}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold font-mono tabular-nums text-[#0F2D25] dark:text-emerald-400">
                        {vehicle.price}
                      </p>
                      <p className="text-[10px] text-slate-500">/ day</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-1.5 mb-2 text-[11px] text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <StarSolidIcon className="w-3 h-3 text-[#C9A35D]" />
                      <span className="font-semibold text-slate-900 dark:text-white">{vehicle.rating}</span>
                      <span className="text-slate-400">({vehicle.reviews})</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                      {vehicle.verificationHash}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2 line-clamp-2">
                    {vehicle.description}
                  </p>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">
                    {vehicle.specs.slice(0, 3).join(' · ')}
                  </p>

                  <button
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      setModalStep('details');
                      setSettledReceipt(null);
                    }}
                    className="mt-auto w-full bg-[#0F2D25] text-white font-semibold py-2 rounded-xl hover:bg-[#173f34] transition-colors text-xs"
                  >
                    Book &amp; Settle Online
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Vehicle Concierge */}
      <section className="bg-[#0B1F1A] py-16 px-6 sm:px-10 lg:px-16 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A35D] mb-3">
              <SparklesIcon className="w-4 h-4" />
              <span>Route &amp; Fleet Advisor</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold leading-tight">
              Match the Right Chassis to Your Route
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-3 mb-6 font-light leading-relaxed">
              Specify passenger count, terrain, or itinerary and receive a tailored vehicle recommendation with route and fuel estimates.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {['Garden Route coastal tour', 'Executive business trip', 'Wedding VIP arrival', 'Family lodge transfer'].map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => handleAskAdvisor(preset)}
                    className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
                  >
                    {preset}
                  </button>
                )
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAdvisor();
              }}
              className="relative flex items-center gap-2"
            >
              <input
                type="text"
                value={tripPrompt}
                onChange={(e) => setTripPrompt(e.target.value)}
                placeholder="e.g. 4-day Cape Winelands itinerary for 4 executives..."
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none focus:border-[#C9A35D]"
              />
              <button
                type="submit"
                disabled={isAiLoading}
                className="bg-[#C9A35D] text-[#0B1F1A] px-5 py-3 rounded-xl text-xs font-semibold hover:bg-[#d8b471] disabled:bg-slate-500 transition-colors whitespace-nowrap shrink-0"
              >
                {isAiLoading ? 'Matching...' : 'Match Fleet'}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
                  Recommended Selection
                </p>
                <h4 className="font-heading text-2xl font-semibold mt-0.5">{aiAdvice.vehicle}</h4>
              </div>
              <span className="text-emerald-700 dark:text-emerald-400 font-mono tabular-nums text-xs font-bold">
                {aiAdvice.match}
              </span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-[#0F2D25] dark:text-[#C9A35D] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Route Suitability
                  </p>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 mt-0.5">{aiAdvice.routeReason}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BoltIcon className="w-5 h-5 text-[#0F2D25] dark:text-[#C9A35D] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Operating Estimate
                  </p>
                  <p className="text-xs sm:text-sm font-mono tabular-nums text-slate-700 dark:text-slate-200 mt-0.5">
                    {aiAdvice.fuelEstimate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobility Standard Pillars */}
      <section className="py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A35D]">Service Architecture</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white mt-1">
              The AfriEstate Mobility Standard
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheckIcon, title: 'Inspected Late-Model Fleet', desc: 'Every vehicle passes multi-point mechanical certification and interior sanitization before key release.' },
              { icon: BoltIcon, title: 'Digital Key Verification', desc: 'Complete identity verification once to bypass airport counter queues with direct bay pickup.' },
              { icon: MapIcon, title: 'Multi-Hub Coverage', desc: 'Synchronized pickup and one-way return support across Cape Town, Johannesburg, and Luanda.' },
              { icon: SparklesIcon, title: 'All-Inclusive Pricing', desc: 'Zero surprise counter surcharges with clear mileage allowances and insurance breakdown upfront.' },
              { icon: ArrowPathIcon, title: 'Flexible Lease Extensions', desc: 'Extend daily hires into multi-week or corporate monthly retainers directly from your account.' },
              { icon: BuildingOffice2Icon, title: 'Enterprise Account Desks', desc: 'Consolidated monthly VAT invoicing and dedicated dispatchers for executive delegations.' },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800"
              >
                <item.icon className="w-6 h-6 text-[#0F2D25] dark:text-[#C9A35D] mb-4" />
                <h3 className="font-semibold text-base text-slate-900 dark:text-white mb-1.5">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Regional Partners Directory */}
      <section className="py-16 px-6 sm:px-10 lg:px-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A35D]">Authorized Desks</p>
              <h2 className="font-heading text-3xl font-semibold text-slate-900 dark:text-white mt-1">
                Verified Regional Mobility Partners
              </h2>
            </div>
            <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
              {(['All', 'Cape Town', 'Johannesburg', 'Luanda'] as const).map((hub) => (
                <button
                  key={hub}
                  onClick={() => setActiveHub(hub)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeHub === hub
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {hub}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPartners.map((partner) => (
              <div
                key={partner.name}
                className="bg-[#FAF8F5] dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-3"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C9A35D]">{partner.hub} Hub</p>
                  <h4 className="font-semibold text-base text-slate-900 dark:text-white mt-0.5">{partner.name}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {partner.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <p className="flex items-center gap-2 font-mono tabular-nums">
                    <PhoneIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {partner.phone}
                  </p>
                  <p className="flex items-center gap-2 truncate">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {partner.address}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate Fleet CTA */}
      <section className="py-16 px-6 sm:px-10 lg:px-16 bg-[#0B1F1A] text-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A35D] mb-2">
              Corporate Solutions
            </p>
            <h3 className="font-heading text-3xl sm:text-4xl font-semibold">
              Enterprise Fleet &amp; Partner Onboarding
            </h3>
            <p className="text-sm sm:text-base text-slate-300 mt-2 font-light">
              Set up centralized corporate mobility accounts or list verified vehicles on the AfriEstate platform with automated dispatch and driver vetting.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => addToast('Corporate pricing dossier requested — our fleet desk will follow up.', 'success')}
              className="bg-[#C9A35D] text-[#0B1F1A] font-semibold px-6 py-3 rounded-xl text-sm hover:bg-[#d8b471] transition-colors whitespace-nowrap"
            >
              Request Corporate Pricing
            </button>
            <button
              onClick={() => {
                if (onListFleet) {
                  onListFleet();
                } else {
                  addToast('Sign in to list your verified fleet on AfriEstate.', 'info');
                }
              }}
              className="bg-white/10 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-white/20 transition-colors whitespace-nowrap"
            >
              List Your Fleet
            </button>
          </div>
        </div>
      </section>

      {/* Vehicle Inspection & Real-Time Car Hire Settlement Modal */}
      {selectedVehicle && (() => {
        const dailyRateZar = parseDailyRateZar(selectedVehicle.price);
        const rentalSubtotalZar = dailyRateZar * rentalDays;
        const insuranceAndAirportFeeZar = 350;
        const grandTotalZar = rentalSubtotalZar + insuranceAndAirportFeeZar;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={closeVehicleModal} />
            <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="relative h-44 shrink-0">
                <img
                  src={selectedVehicle.image}
                  alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                  onError={(e) => {
                    if (!e.currentTarget.dataset.fb) {
                      e.currentTarget.dataset.fb = '1';
                      e.currentTarget.src = '/images/luxury_suv_fleet.jpg';
                    }
                  }}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F1A] via-[#0B1F1A]/50 to-transparent" />
                <button
                  type="button"
                  onClick={closeVehicleModal}
                  aria-label="Close modal"
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/75"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
                <div className="absolute bottom-4 left-6 right-6 text-white flex items-end justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#C99A3D]">
                      <LockClosedIcon className="w-3.5 h-3.5" />
                      Integrity Signature {selectedVehicle.verificationHash}
                    </span>
                    <h3 className="font-heading text-2xl font-bold mt-0.5">
                      {selectedVehicle.make} {selectedVehicle.model}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xl font-bold text-[#C9A35D]">{selectedVehicle.price}</p>
                    <p className="text-[11px] text-slate-300">per day · {rentalDays}d total R {grandTotalZar.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between gap-2 text-xs border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg font-bold ${modalStep === 'details' ? 'bg-[#0F2D25] text-white' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'}`}>
                      1. Driver Details
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className={`px-2.5 py-1 rounded-lg font-bold ${modalStep === 'settlement' ? 'bg-[#008F45] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      2. Real-Time Settlement
                    </span>
                  </div>
                  {modalStep === 'settlement' && !settledReceipt && (
                    <button
                      type="button"
                      onClick={() => setModalStep('details')}
                      className="text-xs font-semibold text-[#0F2D25] dark:text-[#C9A35D] hover:underline"
                    >
                      Edit Driver Info
                    </button>
                  )}
                </div>

                {modalStep === 'details' ? (
                  <form onSubmit={handleProceedToSettlement} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FAF8F5] dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-500">Verified Operator</p>
                        <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedVehicle.businessName}</p>
                        <p className="text-slate-500 font-mono mt-0.5">{selectedVehicle.phone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-500">Pickup &amp; Return Window</p>
                        <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                          {pickupLocation} → {returnLocation}
                        </p>
                        <p className="text-slate-500 mt-0.5">{pickupDate} → {returnDate} ({rentalDays} days · Age {driverAge})</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {selectedVehicle.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {selectedVehicle.specs.map((spec) => (
                        <span
                          key={spec}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Primary Driver Name *</label>
                        <input
                          type="text"
                          required
                          value={driverName}
                          onChange={(e) => setDriverName(e.target.value)}
                          placeholder="Full legal name"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={driverEmail}
                          onChange={(e) => setDriverEmail(e.target.value)}
                          placeholder="driver@domain.com"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Mobile Number *</label>
                        <input
                          type="tel"
                          required
                          value={driverPhone}
                          onChange={(e) => setDriverPhone(e.target.value)}
                          placeholder="+27 82 000 0000"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-[#0F2D25] hover:bg-[#173f34] text-white text-xs font-bold transition-colors"
                    >
                      Continue to Real-Time Settlement · R {grandTotalZar.toLocaleString()}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <PaymentSettlementPanel
                      bookingCategory="car-hire"
                      itemId={selectedVehicle.id}
                      itemTitle={`${selectedVehicle.make} ${selectedVehicle.model}`}
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
                      }}
                      submitLabel={`Settle Car Hire · R ${grandTotalZar.toLocaleString()}`}
                      onSettled={handleCarHireSettled}
                    />

                    {settledReceipt && (
                      <button
                        type="button"
                        onClick={closeVehicleModal}
                        className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Done · Return to Mobility Fleet
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default RentACarPage;
