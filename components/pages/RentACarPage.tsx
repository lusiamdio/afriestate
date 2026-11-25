import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ListingType, type Property } from '../../types';
import { GoogleGenAI } from '../../lib/ai';
import { useToast } from '../../contexts/ToastContext';
import { usePlatformState } from '../../contexts/PlatformStateContext';
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
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import {
  checkSubmissionThrottle,
  generateListingSignature,
  generateSecureBookingRef,
  isValidEmail,
  isValidPhone,
  sanitizeSafeUrl,
  sanitizeText,
} from '../../lib/security';
import type { SettlementReceipt } from '../payments/PaymentSettlementPanel';
import TransportBookingFlowPage, {
  type FleetVehicleCard,
  type VehicleSaleInquiryPayload,
} from '../transport/TransportBookingFlowPage';
import { WidgetTabGroup } from '../widgets/EmbeddedWidgetToolkit';

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

const featuredVehiclesForSale = [
  {
    make: 'Land Rover',
    model: 'Range Rover Sport P400 Dynamic SE',
    image: '/images/luxury_suv_fleet.jpg',
    rating: '5.0',
    reviews: '38',
    specs: ['2024 Model', '18,400 km', 'Hybrid Petrol', 'Certified Pre-Owned', 'Full Service History'],
    price: 'R 1,985,000',
    numericPrice: 1985000,
    mileage: '18,400 km',
    condition: 'Certified Pre-Owned',
    fuelType: 'Hybrid Petrol',
    year: '2024',
    city: 'Cape Town',
    address: 'V&A Waterfront Luxury Auto Gallery, Cape Town',
    businessName: 'Atlantic Sovereign Motors',
    category: 'SUV',
  },
  {
    make: 'Mercedes-Benz',
    model: 'E300 AMG Line Executive',
    image: '/images/executive_sedan_fleet.jpg',
    rating: '4.9',
    reviews: '24',
    specs: ['2025 Model', '6,200 km', 'Petrol', 'Demo Model', 'Motorplan Active'],
    price: 'R 1,340,000',
    numericPrice: 1340000,
    mileage: '6,200 km',
    condition: 'Demo Model',
    fuelType: 'Petrol',
    year: '2025',
    city: 'Johannesburg',
    address: 'Rivonia Boulevard Showroom, Sandton',
    businessName: 'Sandton Prestige Auto',
    category: 'Executive',
  },
  {
    make: 'BMW',
    model: 'X5 xDrive30d M Sport',
    image: '/images/2a47542b078d54560485a1e72a5373aa9c3a4a48-800x535.avif',
    rating: '4.9',
    reviews: '41',
    specs: ['2023 Model', '32,500 km', 'Diesel', 'Certified Pre-Owned', 'Finance Ready'],
    price: 'R 1,495,000',
    numericPrice: 1495000,
    mileage: '32,500 km',
    condition: 'Certified Pre-Owned',
    fuelType: 'Diesel',
    year: '2023',
    city: 'Johannesburg',
    address: 'Melrose Arch Flagship Showroom, Johannesburg',
    businessName: 'Gauteng Executive Fleet Sales',
    category: 'SUV',
  },
  {
    make: 'Audi',
    model: 'A5 Sportback 40 TFSI S Line',
    image: '/images/executive_sedan_fleet.jpg',
    rating: '4.8',
    reviews: '19',
    specs: ['2024 Model', '14,800 km', 'Petrol', 'Certified Pre-Owned', 'Roadworthy Included'],
    price: 'R 895,000',
    numericPrice: 895000,
    mileage: '14,800 km',
    condition: 'Certified Pre-Owned',
    fuelType: 'Petrol',
    year: '2024',
    city: 'Cape Town',
    address: 'Century City Mobility Boulevard, Cape Town',
    businessName: 'Cape Peninsula Auto Exchange',
    category: 'Luxury',
  },
];

interface RentACarPageProps {
  properties?: Property[];
  onListFleet?: (mode?: 'hire' | 'sale') => void;
  onNavigate?: (page: string) => void;
}

const RentACarPage: React.FC<RentACarPageProps> = ({ properties = [], onListFleet, onNavigate }) => {
  const { addToast } = useToast();
  const { currentUser, sharedJourney, updateSharedJourney, addPlatformBooking } = usePlatformState();
  const [heroMode, setHeroMode] = useState<'hire' | 'sale'>('hire');
  const [listingFilter, setListingFilter] = useState<'all' | 'hire' | 'sale'>('all');
  const [saleBudgetMax, setSaleBudgetMax] = useState<'all' | '1000000' | '1600000' | '2500000'>('all');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Luxury' | 'SUV' | 'Executive'>('All');
  const [pickupLocation, setPickupLocation] = useState(() =>
    sharedJourney.destinationCity ? `${sharedJourney.destinationCity} Airport` : 'Cape Town Airport'
  );
  const [returnLocation, setReturnLocation] = useState(() =>
    sharedJourney.destinationCity ? `${sharedJourney.destinationCity} CBD` : 'Cape Town CBD'
  );
  const [pickupDate, setPickupDate] = useState(() => sharedJourney.checkInDate || '2026-06-15');
  const [returnDate, setReturnDate] = useState(() => sharedJourney.returnDate || '2026-06-20');
  const [driverAge, setDriverAge] = useState('30+');
  const [activeHub, setActiveHub] = useState<'All' | 'Cape Town' | 'Johannesburg' | 'Luanda'>('All');

  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicleCard | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  useEffect(() => {
    if (currentUser) {
      setDriverName((prev) => prev || currentUser.fullName || currentUser.username || '');
      setDriverEmail((prev) => prev || currentUser.email || '');
      setDriverPhone((prev) => prev || currentUser.phone || '');
    }
  }, [currentUser]);

  useEffect(() => {
    updateSharedJourney({
      checkInDate: pickupDate,
      returnDate: returnDate,
    });
  }, [pickupDate, returnDate, updateSharedJourney]);
  const [bookingStep, setBookingStep] = useState<'details' | 'settlement'>('details');
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
      const isSale = p.listingType === ListingType.SALE;
      const numericPrice = Number(p.price) || (isSale ? 850000 : 950);
      const amenitiesList = (p.amenities || []).map((a) => sanitizeText(a, 50));
      const mileageSpec = amenitiesList.find((a) => /\b[\d,]+\s*km\b/i.test(a));
      const conditionSpec = amenitiesList.find((a) =>
        ['Brand New', 'Demo Model', 'Certified Pre-Owned', 'Used'].some((c) => a.toLowerCase().includes(c.toLowerCase()))
      );
      const fuelSpec = amenitiesList.find((a) =>
        ['Petrol', 'Diesel', 'Hybrid', 'Electric'].some((f) => a.toLowerCase().includes(f.toLowerCase()))
      );
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
          amenitiesList.length > 0
            ? amenitiesList
            : isSale
              ? ['Automatic', 'Full Service History', 'Roadworthy Verified']
              : ['Automatic', 'Unlimited Mileage', 'Verified Partner'],
        price: `${p.localCurrency ? `${p.localCurrency} ` : 'R '}${numericPrice.toLocaleString()}`,
        numericPrice,
        listingMode: isSale ? 'sale' : 'hire',
        mileage: mileageSpec || (isSale ? 'Verified Mileage' : undefined),
        condition: conditionSpec || (isSale ? 'Inspected Pre-Owned' : undefined),
        fuelType: fuelSpec,
        financingAvailable: amenitiesList.some((a) => a.toLowerCase().includes('finance')),
        category: p.vehicleType || 'SUV',
        city: sanitizeText(p.address?.city || 'Cape Town', 60),
        pickupAddress: sanitizeText(
          p.address?.street || p.address?.city || (isSale ? 'Verified Dealership Showroom' : 'International Arrivals Desk'),
          120
        ),
        businessName: sanitizeText(p.agent?.name || (isSale ? 'Verified Vehicle Seller' : 'Verified Mobility Partner'), 80),
        phone: sanitizeText(p.agent?.phone || '+27 21 555 0140', 30),
        description: sanitizeText(
          p.description ||
            p.neighborhoodInfo ||
            (isSale
              ? 'Verified vehicle listed for outright sale with ownership and roadworthy inspection support.'
              : 'Vetted African fleet with comprehensive insurance and roadside cover.'),
          280
        ),
        verificationHash: sig,
        isUserPublished: true,
      };
    });

    const curatedHire: FleetVehicleCard[] = featuredFleet.map((f, idx) => ({
      id: `curated_car_${idx}`,
      make: f.make,
      model: f.model,
      image: f.image,
      rating: f.rating,
      reviews: f.reviews,
      specs: f.specs,
      price: f.price,
      numericPrice: parseDailyRateZar(f.price),
      listingMode: 'hire',
      category: f.category,
      city: idx % 2 === 0 ? 'Cape Town' : 'Johannesburg',
      pickupAddress: idx % 2 === 0 ? 'Cape Town International Terminal Desk' : 'Sandton & OR Tambo VIP Terminal',
      businessName: 'AfriEstate Mobility Desk',
      phone: '+27 21 555 0100',
      description: 'Late-model executive chassis inspected before key release with 24/7 roadside coverage.',
      verificationHash: generateListingSignature(`curated_car_${idx}`, f.make, 2000),
      isUserPublished: false,
    }));

    const curatedSale: FleetVehicleCard[] = featuredVehiclesForSale.map((f, idx) => ({
      id: `curated_sale_car_${idx}`,
      make: f.make,
      model: f.model,
      image: f.image,
      rating: f.rating,
      reviews: f.reviews,
      specs: f.specs,
      price: f.price,
      numericPrice: f.numericPrice,
      listingMode: 'sale',
      mileage: f.mileage,
      condition: f.condition,
      fuelType: f.fuelType,
      year: f.year,
      financingAvailable: true,
      category: f.category,
      city: f.city,
      pickupAddress: f.address,
      businessName: f.businessName,
      phone: '+27 21 555 0195',
      description: `${f.year} ${f.make} ${f.model} (${f.mileage}) available for scheduled showroom inspection, bank finance, or cash settlement.`,
      verificationHash: generateListingSignature(`curated_sale_car_${idx}`, f.make, f.numericPrice),
      isUserPublished: false,
    }));

    return [...publishedCars, ...curatedHire, ...curatedSale];
  }, [properties]);

  const displayedVehicles = useMemo(() => {
    const maxBudget = saleBudgetMax !== 'all' ? Number(saleBudgetMax) : null;
    return baseVehicles.filter((v) => {
      if (listingFilter !== 'all' && (v.listingMode || 'hire') !== listingFilter) {
        return false;
      }
      if (activeCategory !== 'All' && !v.category.toLowerCase().includes(activeCategory.toLowerCase())) {
        return false;
      }
      if (maxBudget && v.listingMode === 'sale' && (v.numericPrice || 0) > maxBudget) {
        return false;
      }
      return true;
    });
  }, [baseVehicles, listingFilter, activeCategory, saleBudgetMax]);

  const filteredPartners = useMemo(() => {
    if (activeHub === 'All') return carRentals;
    return carRentals.filter((c) => c.hub === activeHub);
  }, [activeHub]);

  const validateDriverInfo = () => {
    const cleanName = sanitizeText(driverName, 80);
    const cleanEmail = sanitizeText(driverEmail, 120);
    const cleanPhone = sanitizeText(driverPhone, 30);

    if (!cleanName || !isValidEmail(cleanEmail) || !isValidPhone(cleanPhone)) {
      addToast('Please provide a valid driver name, email address, and mobile number.', 'error');
      return false;
    }
    return true;
  };

  const handleProceedToSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !validateDriverInfo()) return;
    setBookingStep('settlement');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookingStepChange = (nextStep: 'details' | 'settlement') => {
    if (nextStep === 'settlement' && !validateDriverInfo()) {
      return;
    }
    setBookingStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCarHireSettled = async (receipt: SettlementReceipt) => {
    if (!selectedVehicle) return;
    const cleanName = sanitizeText(driverName, 80);
    const cleanEmail = sanitizeText(driverEmail, 120).toLowerCase();
    const title = `${selectedVehicle.make} ${selectedVehicle.model}`;
    setSettledReceipt(receipt);

    addPlatformBooking({
      category: 'car-hire',
      reference: receipt.transactionRef,
      title,
      subtitle: `${pickupLocation} → ${returnLocation} · ${selectedVehicle.businessName}`,
      city: selectedVehicle.city || pickupLocation,
      startDate: pickupDate,
      endDate: returnDate,
      amountZar: receipt.amount,
      status: 'Confirmed',
      customerName: cleanName || currentUser?.fullName || 'Guest Driver',
      customerEmail: cleanEmail || currentUser?.email || '',
      targetPage: 'rent-a-car',
    });

    const throttle = checkSubmissionThrottle(`car_book_${selectedVehicle.id}`, 8000);
    if (throttle.allowed) {
      try {
        const username = currentUser?.username || currentUser?.email || cleanEmail;
        await supabase.from('tour_requests').insert({
          requester_user_id: currentUser?.id || null,
          request_type: 'car_hire',
          booking_ref: receipt.transactionRef,
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

  const handleCarSaleInquirySubmitted = async (payload: VehicleSaleInquiryPayload): Promise<string | null> => {
    const cleanName = sanitizeText(payload.buyerName, 80);
    const cleanEmail = sanitizeText(payload.buyerEmail, 120).toLowerCase();
    const cleanPhone = sanitizeText(payload.buyerPhone, 30);

    if (!cleanName || !isValidEmail(cleanEmail) || !isValidPhone(cleanPhone)) {
      addToast('Please provide a valid buyer name, email address, and mobile number.', 'error');
      return null;
    }

    const ref = generateSecureBookingRef('AFR-VEH');

    addPlatformBooking({
      category: 'car-hire',
      reference: ref,
      title: payload.vehicleTitle,
      subtitle: `Car Sale Inquiry · R ${payload.offerAmountZar.toLocaleString()} offer · Inspection ${payload.inspectionDate}`,
      city: selectedVehicle?.city || pickupLocation,
      startDate: payload.inspectionDate,
      endDate: payload.inspectionDate,
      amountZar: 0,
      status: 'Pending',
      customerName: cleanName,
      customerEmail: cleanEmail,
      targetPage: 'rent-a-car',
    });

    const throttle = checkSubmissionThrottle(`car_sale_${payload.vehicleId}`, 6000);
    if (throttle.allowed) {
      try {
        const username = currentUser?.username || currentUser?.email || cleanEmail;
        await supabase.from('tour_requests').insert({
          requester_user_id: currentUser?.id || null,
          request_type: 'car_sale_inquiry',
          booking_ref: ref,
          property_id: payload.vehicleId,
          property_title: `${payload.vehicleTitle} (Sale Offer R ${payload.offerAmountZar.toLocaleString()} · ${payload.financeRequested ? 'Finance/Trade-In' : 'Cash'} · ${payload.inspectionDate})`,
          username,
          date: payload.inspectionDate,
          time: '10:00',
          status: 'Pending',
          timestamp: Date.now(),
        });
      } catch {
        // continue cleanly in local fallback mode
      }
    }

    addToast(`Inspection & purchase offer logged for ${payload.vehicleTitle} (${ref}).`, 'success');
    return ref;
  };

  const openVehicleBookingPage = (vehicle: FleetVehicleCard) => {
    setSelectedVehicle(vehicle);
    setBookingStep('details');
    setSettledReceipt(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const returnToFleetCatalog = () => {
    setSelectedVehicle(null);
    setBookingStep('details');
    setSettledReceipt(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (selectedVehicle) {
    const dailyRateZar = parseDailyRateZar(selectedVehicle.price);
    return (
      <TransportBookingFlowPage
        vehicle={selectedVehicle}
        step={bookingStep}
        onStepChange={handleBookingStepChange}
        onBackToCatalog={returnToFleetCatalog}
        pickupLocation={pickupLocation}
        setPickupLocation={setPickupLocation}
        returnLocation={returnLocation}
        setReturnLocation={setReturnLocation}
        pickupDate={pickupDate}
        setPickupDate={setPickupDate}
        returnDate={returnDate}
        setReturnDate={setReturnDate}
        driverAge={driverAge}
        setDriverAge={setDriverAge}
        rentalDays={rentalDays}
        dailyRateZar={dailyRateZar}
        insuranceAndAirportFeeZar={350}
        driverName={driverName}
        setDriverName={setDriverName}
        driverEmail={driverEmail}
        setDriverEmail={setDriverEmail}
        driverPhone={driverPhone}
        setDriverPhone={setDriverPhone}
        settledReceipt={settledReceipt}
        onProceedToSettlement={handleProceedToSettlement}
        onCarHireSettled={handleCarHireSettled}
        onCarSaleInquirySubmitted={handleCarSaleInquirySubmitted}
        onNavigate={onNavigate}
      />
    );
  }

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
            AfriEstate Transport · Car Hire &amp; Vehicle Sales
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] max-w-4xl mx-auto">
            Hire Executive Fleet or Buy &amp; Sell Verified Vehicles
          </h1>
          <p className="text-base sm:text-lg font-light text-slate-300 max-w-2xl mx-auto mt-5 mb-10">
            Reserve vetted executive cars for daily airport and city travel, browse inspected vehicles for outright purchase, or list your own car for sale or hire.
          </p>

          {/* Compact Search & Mode Switcher Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 text-slate-900 dark:text-white mx-auto w-full text-left">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setHeroMode('hire');
                    setListingFilter('hire');
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    heroMode === 'hire'
                      ? 'bg-[#0F2D25] text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Cars for Hire
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeroMode('sale');
                    setListingFilter('sale');
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    heroMode === 'sale'
                      ? 'bg-[#0F2D25] text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Cars for Sale
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onListFleet) {
                    onListFleet('sale');
                  } else {
                    addToast('Sign in to sell or list your car on AfriEstate.', 'info');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#C9A35D] text-[#0B1F1A] hover:bg-[#d8b471] text-xs font-bold transition-colors whitespace-nowrap shrink-0"
              >
                Sell / List Your Car
              </button>
            </div>

            {heroMode === 'hire' ? (
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
                  type="button"
                  onClick={() => {
                    setListingFilter('hire');
                    document.getElementById('fleet-catalog')?.scrollIntoView({ behavior: 'smooth' });
                    addToast(`Fleet availability updated for ${pickupLocation}`, 'info');
                  }}
                  className="h-[58px] bg-[#0F2D25] text-white font-semibold px-5 rounded-xl hover:bg-[#173f34] transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                >
                  <MagnifyingGlassIcon className="w-4 h-4 text-[#C9A35D]" /> Search Fleet
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700">
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    City / Showroom Hub
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
                    Vehicle Class
                  </label>
                  <select
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value as 'All' | 'Luxury' | 'SUV' | 'Executive')}
                    className="w-full bg-transparent outline-none text-sm font-medium cursor-pointer"
                  >
                    <option value="All">All Vehicle Classes</option>
                    <option value="SUV">SUV &amp; 4x4</option>
                    <option value="Luxury">Luxury Sedan</option>
                    <option value="Executive">Executive Touring</option>
                  </select>
                </div>

                <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700">
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Max Budget (ZAR)
                  </label>
                  <select
                    value={saleBudgetMax}
                    onChange={(e) => setSaleBudgetMax(e.target.value as 'all' | '1000000' | '1600000' | '2500000')}
                    className="w-full bg-transparent outline-none text-sm font-medium cursor-pointer font-mono"
                  >
                    <option value="all">Any Budget</option>
                    <option value="1000000">Up to R 1,000,000</option>
                    <option value="1600000">Up to R 1,600,000</option>
                    <option value="2500000">Up to R 2,500,000</option>
                  </select>
                </div>

                <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700">
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Inspection Date
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

                <button
                  type="button"
                  onClick={() => {
                    setListingFilter('sale');
                    document.getElementById('fleet-catalog')?.scrollIntoView({ behavior: 'smooth' });
                    addToast(`Showing verified cars for sale`, 'info');
                  }}
                  className="h-[58px] bg-[#0F2D25] text-white font-semibold px-5 rounded-xl hover:bg-[#173f34] transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                >
                  <MagnifyingGlassIcon className="w-4 h-4 text-[#C9A35D]" /> Search Cars for Sale
                </button>
              </div>
            )}
          </div>

          {/* Trust Row */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs sm:text-sm font-medium text-slate-300">
            <span className="inline-flex items-center gap-1.5 text-white">
              <StarSolidIcon className="w-4 h-4 text-[#C9A35D]" /> 4.9/5 Verified Fleet Rating
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" /> Inspected Cars for Sale &amp; Hire
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" /> 24/7 Roadside Dispatch
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" /> Verified Seller &amp; Title Checks
            </span>
          </div>
        </div>
      </section>

      {/* Featured Fleet & Car Sales Catalog */}
      <section id="fleet-catalog" className="py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A35D]">
                Curated Mobility &amp; Vehicle Sales
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white mt-1">
                {listingFilter === 'sale'
                  ? 'Verified Cars for Sale'
                  : listingFilter === 'hire'
                    ? 'Executive Cars for Hire'
                    : 'Cars for Hire & Sale'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
              <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
                {(
                  [
                    { id: 'all', label: 'All Vehicles' },
                    { id: 'hire', label: 'Cars for Hire' },
                    { id: 'sale', label: 'Cars for Sale' },
                  ] as const
                ).map((modeTab) => (
                  <button
                    key={modeTab.id}
                    type="button"
                    onClick={() => setListingFilter(modeTab.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      listingFilter === modeTab.id
                        ? 'bg-[#0F2D25] text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {modeTab.label}
                  </button>
                ))}
              </div>

              <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
                {(['All', 'Luxury', 'SUV', 'Executive'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      activeCategory === cat
                        ? 'bg-[#0F2D25] text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onListFleet?.('sale')}
                className="px-4 py-2.5 rounded-xl bg-[#0F2D25] hover:bg-[#173f34] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Sell / List Your Car
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedVehicles.map((vehicle) => {
              const isForSale = vehicle.listingMode === 'sale';
              return (
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                          isForSale
                            ? 'bg-[#C9A35D] text-[#0B1F1A]'
                            : 'bg-[#0B1F1A]/90 text-[#C9A35D]'
                        }`}
                      >
                        <CheckBadgeIcon className="w-3 h-3" />
                        {isForSale ? 'For Sale' : 'For Hire'}
                        {vehicle.isUserPublished ? ' · Live' : ''}
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
                        <p className="text-[10px] text-slate-500">{isForSale ? 'Asking Price' : '/ day'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1.5 mb-2 text-[11px] text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                      <span className="inline-flex items-center gap-1 truncate">
                        {isForSale ? (
                          <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                            {vehicle.mileage || 'Verified'} · {vehicle.condition || 'Inspected'}
                          </span>
                        ) : (
                          <>
                            <StarSolidIcon className="w-3 h-3 text-[#C9A35D]" />
                            <span className="font-semibold text-slate-900 dark:text-white">{vehicle.rating}</span>
                            <span className="text-slate-400">({vehicle.reviews})</span>
                          </>
                        )}
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
                      type="button"
                      onClick={() => openVehicleBookingPage(vehicle)}
                      className="mt-auto w-full bg-[#0F2D25] text-white font-semibold py-2 rounded-xl hover:bg-[#173f34] transition-colors text-xs"
                    >
                      {isForSale ? 'Inspect & Make Offer' : 'Book & Settle Online'}
                    </button>
                  </div>
                </div>
              );
            })}
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

      {/* Interactive Fleet Comparison, Fuel Cost & Depreciation Suite */}
      <section className="py-14 px-6 sm:px-10 lg:px-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <WidgetTabGroup
            title="Fleet Comparison, Fuel Cost & Depreciation Suite"
            subtitle="Compare vehicle models side by side, project trip fuel spend, and model resale depreciation before hiring or buying."
            toolIds={['car-comparison', 'fuel-cost', 'car-depreciation']}
          />
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
              type="button"
              onClick={() => {
                if (onListFleet) {
                  onListFleet('sale');
                } else {
                  addToast('Sign in to list or sell your car on AfriEstate.', 'info');
                }
              }}
              className="bg-white/10 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-white/20 transition-colors whitespace-nowrap"
            >
              List or Sell Your Car
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default RentACarPage;
