import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from '../../lib/ai';
import { useToast } from '../../contexts/ToastContext';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  CloudArrowUpIcon,
  CurrencyDollarIcon,
  HomeModernIcon,
  KeyIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrashIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  MegaphoneIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon, StarIcon } from '@heroicons/react/24/solid';

interface HotelRegistrationPageProps {
  onBack: () => void;
  onSignInClick: () => void;
}

type ViewMode = 'landing' | 'wizard' | 'submitted' | 'command-center';
type CommandTab =
  | 'Overview'
  | 'Bookings'
  | 'Calendar'
  | 'Rooms'
  | 'Rates'
  | 'Guests'
  | 'Messages'
  | 'Reviews'
  | 'Analytics'
  | 'Marketing'
  | 'Payments'
  | 'Property'
  | 'Team'
  | 'Settings';

interface RoomTypeDraft {
  id: string;
  name: string;
  category: string;
  bedConfig: string;
  maxAdults: number;
  maxChildren: number;
  sizeSqm: number;
  hasBalcony: boolean;
  viewType: string;
  availableCount: number;
  baseRate: number;
  amenities: string[];
  photoCount: number;
}

interface ArrivalBooking {
  id: string;
  guest: string;
  room: string;
  checkIn: string;
  channel: string;
  status: 'Confirmed' | 'Checked In' | 'Modified' | 'Cancelled';
}

interface CopilotCard {
  id: string;
  message: string;
  impact: string;
  status: 'active' | 'applied' | 'dismissed';
}

const DRAFT_STORAGE_KEY = 'afriestate_hotel_reg_draft_v1';

const STAGES = [
  { num: 1, key: 'Account', label: 'Account Creation' },
  { num: 2, key: 'Business', label: 'Business Verification' },
  { num: 3, key: 'Hotel', label: 'Hotel Identity' },
  { num: 4, key: 'Location', label: 'Location & Property' },
  { num: 5, key: 'Rooms', label: 'Rooms & Inventory' },
  { num: 6, key: 'Amenities', label: 'Amenities & Services' },
  { num: 7, key: 'Rates', label: 'Rates & Policies' },
  { num: 8, key: 'Payments', label: 'Payments & Taxes' },
  { num: 9, key: 'Verification', label: 'Verification & Preview' },
] as const;

const HOTEL_TYPES = [
  'Hotel',
  'Resort',
  'Boutique Hotel',
  'Business Hotel',
  'Apartment Hotel',
  'Lodge',
  'Guesthouse',
  'Villa Hotel',
  'Eco Lodge',
  'Beach Resort',
  'Safari Lodge',
  'Aparthotel',
  'Hostel',
  'Bed & Breakfast',
];

const OPERATOR_TYPES = [
  {
    id: 'Individual Owner',
    title: 'Individual Owner',
    desc: 'I personally own and operate this property.',
  },
  {
    id: 'Company',
    title: 'Company',
    desc: 'The property is owned or operated by a registered company.',
  },
  {
    id: 'Hotel Management Company',
    title: 'Hotel Management Company',
    desc: 'I manage properties on behalf of owners.',
  },
  {
    id: 'Property Group',
    title: 'Property Group',
    desc: 'I represent multiple hotels or hospitality properties.',
  },
];

const AMENITY_CATEGORIES: Record<string, string[]> = {
  General: ['Wi-Fi', 'Parking', '24-hour reception', 'Concierge', 'Luggage storage', 'Laundry', 'Room service'],
  Wellness: ['Gym', 'Spa', 'Sauna', 'Steam room', 'Massage', 'Swimming pool'],
  Dining: ['Restaurant', 'Bar', 'Breakfast', 'Room service', 'Café', 'Conference catering'],
  Business: ['Meeting rooms', 'Conference center', 'Business center', 'Printing', 'High-speed internet'],
  Family: ['Kids club', "Children's pool", 'Babysitting', 'Family rooms'],
};

const ACCESSIBILITY_OPTIONS = [
  'Wheelchair accessible entrance',
  'Accessible rooms',
  'Accessible bathrooms',
  'Elevator',
  'Accessible parking',
  'Braille signage',
  'Hearing assistance',
  'Service animal friendly',
];

const ROOM_AMENITY_OPTIONS = [
  'Air conditioning',
  'Heating',
  'Smart TV',
  'Mini bar',
  'Safe',
  'Coffee machine',
  'Hairdryer',
  'Iron',
  'Desk',
  'Wardrobe',
  'Bathtub',
  'Shower',
  'Kitchenette',
  'Refrigerator',
];

const CURRENCY_CODES = ['ZAR', 'USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'AOA', 'RWF', 'MAD', 'EGP'];

const COUNTRY_PHONE_CODES = [
  { country: 'South Africa', code: '+27' },
  { country: 'Nigeria', code: '+234' },
  { country: 'Kenya', code: '+254' },
  { country: 'Ghana', code: '+233' },
  { country: 'Rwanda', code: '+250' },
  { country: 'Egypt', code: '+20' },
  { country: 'Morocco', code: '+212' },
  { country: 'Angola', code: '+244' },
];

const GALLERY_CATEGORIES = [
  'Exterior',
  'Lobby',
  'Rooms',
  'Bathrooms',
  'Restaurant',
  'Pool',
  'Gym',
  'Spa',
  'Conference',
  'Views',
  'Surroundings',
];

const COMMAND_NAV_ITEMS: { id: CommandTab; icon: React.ElementType }[] = [
  { id: 'Overview', icon: HomeModernIcon },
  { id: 'Bookings', icon: CheckBadgeIcon },
  { id: 'Calendar', icon: CalendarDaysIcon },
  { id: 'Rooms', icon: KeyIcon },
  { id: 'Rates', icon: BanknotesIcon },
  { id: 'Guests', icon: UserGroupIcon },
  { id: 'Messages', icon: ChatBubbleLeftRightIcon },
  { id: 'Reviews', icon: StarIcon },
  { id: 'Analytics', icon: ChartBarIcon },
  { id: 'Marketing', icon: MegaphoneIcon },
  { id: 'Payments', icon: CurrencyDollarIcon },
  { id: 'Property', icon: BuildingOffice2Icon },
  { id: 'Team', icon: ShieldCheckIcon },
  { id: 'Settings', icon: Cog6ToothIcon },
];

const HotelRegistrationPage: React.FC<HotelRegistrationPageProps> = ({ onBack, onSignInClick }) => {
  const { addToast } = useToast();

  // Check if a draft already exists for Save & Resume banner
  const savedDraftRaw = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_STORAGE_KEY) : null;
  const savedDraft = useMemo(() => {
    if (!savedDraftRaw) return null;
    try {
      return JSON.parse(savedDraftRaw);
    } catch {
      return null;
    }
  }, [savedDraftRaw]);

  const [mode, setMode] = useState<ViewMode>('landing');
  const [stage, setStage] = useState<number>(savedDraft?.stage || 1);

  // Stage 1 State
  const [firstName, setFirstName] = useState<string>(savedDraft?.firstName || '');
  const [middleName, setMiddleName] = useState<string>(savedDraft?.middleName || '');
  const [lastName, setLastName] = useState<string>(savedDraft?.lastName || '');
  const [businessEmail, setBusinessEmail] = useState<string>(savedDraft?.businessEmail || '');
  const [phoneCountry, setPhoneCountry] = useState<string>(savedDraft?.phoneCountry || 'South Africa');
  const [phoneCode, setPhoneCode] = useState<string>(savedDraft?.phoneCode || '+27');
  const [phoneNumber, setPhoneNumber] = useState<string>(savedDraft?.phoneNumber || '');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [consentTerms, setConsentTerms] = useState<boolean>(Boolean(savedDraft?.consentTerms));
  const [consentPrivacy, setConsentPrivacy] = useState<boolean>(Boolean(savedDraft?.consentPrivacy));
  const [consentUpdates, setConsentUpdates] = useState<boolean>(Boolean(savedDraft?.consentUpdates));
  const [awaitingOtp, setAwaitingOtp] = useState<boolean>(false);
  const [emailOtp, setEmailOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [phoneOtp, setPhoneOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [accountVerified, setAccountVerified] = useState<boolean>(Boolean(savedDraft?.accountVerified));

  // Stage 2 State
  const [operatorType, setOperatorType] = useState<string>(savedDraft?.operatorType || 'Company');
  const [companyName, setCompanyName] = useState<string>(savedDraft?.companyName || 'Meridian Hospitality Group (Pty) Ltd');
  const [tradingName, setTradingName] = useState<string>(savedDraft?.tradingName || 'The Cape Meridian Hotel');
  const [regNumber, setRegNumber] = useState<string>(savedDraft?.regNumber || '2018/442190/07');
  const [regCountry, setRegCountry] = useState<string>(savedDraft?.regCountry || 'South Africa');
  const [taxNumber, setTaxNumber] = useState<string>(savedDraft?.taxNumber || '4490281912');
  const [businessType, setBusinessType] = useState<string>(savedDraft?.businessType || 'Private Company');
  const [regProvince, setRegProvince] = useState<string>(savedDraft?.regProvince || 'Western Cape');
  const [regCity, setRegCity] = useState<string>(savedDraft?.regCity || 'Cape Town');
  const [regStreet, setRegStreet] = useState<string>(savedDraft?.regStreet || '128 Beach Road, Sea Point');
  const [regPostal, setRegPostal] = useState<string>(savedDraft?.regPostal || '8005');
  const [relationship, setRelationship] = useState<string>(savedDraft?.relationship || 'General Manager');
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>(
    savedDraft?.uploadedDocs || {
      'Certificate of incorporation': true,
      'Tax certificate': true,
      'Business registration': true,
      'Operating license': false,
      'Authorization evidence': true,
    }
  );

  // Stage 3 State
  const [hotelName, setHotelName] = useState<string>(savedDraft?.hotelName || 'The Cape Meridian Hotel');
  const [hotelType, setHotelType] = useState<string>(savedDraft?.hotelType || 'Hotel');
  const [starRating, setStarRating] = useState<string>(savedDraft?.starRating || '5 Star');
  const [officiallyAccredited, setOfficiallyAccredited] = useState<'Yes' | 'No'>(savedDraft?.officiallyAccredited || 'Yes');
  const [accreditingAuthority, setAccreditingAuthority] = useState<string>(
    savedDraft?.accreditingAuthority || 'Tourism Grading Council of South Africa (TGCSA)'
  );
  const [certificateNumber, setCertificateNumber] = useState<string>(savedDraft?.certificateNumber || 'TGCSA-WC-88412');
  const [certificateExpiry, setCertificateExpiry] = useState<string>(savedDraft?.certificateExpiry || '2027-12-31');
  const [shortDesc, setShortDesc] = useState<string>(
    savedDraft?.shortDesc ||
      'Coastal five-star retreat overlooking the Atlantic Seaboard in Cape Town with conference suites, spa wellness floor, and 24-hour concierge.'
  );
  const [fullDesc, setFullDesc] = useState<string>(
    savedDraft?.fullDesc ||
      `About the Hotel\nPositioned along Cape Town’s scenic Atlantic corridor, The Cape Meridian Hotel blends coastal architecture with executive hospitality.\n\nRooms & Accommodation\n• 142 sunlit suites & rooms with private balconies and soundproofed glazing\n• High-speed fibre connectivity and smart workspace desks\n\nDining & Wellness\n• Signature ocean-view restaurant, rooftop terrace bar, heated lap pool, and full spa\n\nBusiness Facilities\n• 400-seat conference center and private boardrooms minutes from the CBD`
  );
  const [aiCopyLoading, setAiCopyLoading] = useState<boolean>(false);
  const [selectedGalleryCats, setSelectedGalleryCats] = useState<string[]>(['Exterior', 'Lobby', 'Rooms', 'Pool', 'Restaurant']);
  const [galleryImages, setGalleryImages] = useState<string[]>([
    '/images/coastal_mansion_1779978805301.png',
    '/images/house_pool_1779978750296.png',
    '/images/loft_interior_1779978697203.png',
    '/images/apartment_block_1779978678706.png',
    '/images/living_room_1779978722558.png',
  ]);

  // Stage 4 State
  const [hotelCountry, setHotelCountry] = useState<string>(savedDraft?.hotelCountry || 'South Africa');
  const [hotelProvince, setHotelProvince] = useState<string>(savedDraft?.hotelProvince || 'Western Cape');
  const [hotelCity, setHotelCity] = useState<string>(savedDraft?.hotelCity || 'Cape Town');
  const [hotelDistrict, setHotelDistrict] = useState<string>(savedDraft?.hotelDistrict || 'Sea Point / Atlantic Seaboard');
  const [hotelStreet, setHotelStreet] = useState<string>(savedDraft?.hotelStreet || '128 Beach Road');
  const [hotelPostal, setHotelPostal] = useState<string>(savedDraft?.hotelPostal || '8005');
  const [locationConfirmed, setLocationConfirmed] = useState<boolean>(savedDraft?.locationConfirmed ?? true);
  const [publicAddress, setPublicAddress] = useState<string>('128 Beach Road, Sea Point, Cape Town');
  const [operationalAddress, setOperationalAddress] = useState<string>('Service Entrance, 42 Regent Lane, Sea Point');
  const [billingAddress, setBillingAddress] = useState<string>('128 Beach Road, Cape Town, 8005');
  const [emergencyAddress, setEmergencyAddress] = useState<string>('24h Security Desk, Gate B, 128 Beach Road');

  // Stage 5 State (Property Physical + Rooms)
  const [buildingsCount, setBuildingsCount] = useState<number>(1);
  const [floorsCount, setFloorsCount] = useState<number>(8);
  const [totalRoomsCount, setTotalRoomsCount] = useState<number>(142);
  const [yearOpened, setYearOpened] = useState<number>(2018);
  const [lastRenovation, setLastRenovation] = useState<number>(2025);
  const [totalCapacity, setTotalCapacity] = useState<number>(284);
  const [roomTypes, setRoomTypes] = useState<RoomTypeDraft[]>(
    savedDraft?.roomTypes || [
      {
        id: 'room-1',
        name: 'Deluxe King Room',
        category: 'Deluxe',
        bedConfig: 'King',
        maxAdults: 2,
        maxChildren: 1,
        sizeSqm: 42,
        hasBalcony: true,
        viewType: 'Ocean',
        availableCount: 24,
        baseRate: 2450,
        amenities: ['Air conditioning', 'Smart TV', 'Mini bar', 'Safe', 'Coffee machine', 'Desk', 'Shower'],
        photoCount: 6,
      },
      {
        id: 'room-2',
        name: 'Executive Ocean Suite',
        category: 'Executive',
        bedConfig: 'Super King',
        maxAdults: 2,
        maxChildren: 2,
        sizeSqm: 68,
        hasBalcony: true,
        viewType: 'Ocean',
        availableCount: 12,
        baseRate: 3890,
        amenities: ['Air conditioning', 'Smart TV', 'Mini bar', 'Safe', 'Coffee machine', 'Bathtub', 'Shower', 'Kitchenette'],
        photoCount: 8,
      },
    ]
  );

  // Stage 6 State (Accessibility & Amenities)
  const [selectedAccessibility, setSelectedAccessibility] = useState<string[]>([
    'Wheelchair accessible entrance',
    'Accessible rooms',
    'Elevator',
    'Accessible parking',
  ]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Wi-Fi',
    'Parking',
    '24-hour reception',
    'Concierge',
    'Gym',
    'Spa',
    'Swimming pool',
    'Restaurant',
    'Bar',
    'Breakfast',
    'Meeting rooms',
    'Conference center',
    'High-speed internet',
  ]);

  // Stage 7 State (Rates, Dynamic Pricing, Availability & Policies)
  const [baseCurrency, setBaseCurrency] = useState<string>('ZAR');
  const [flexibleRate, setFlexibleRate] = useState<number>(2450);
  const [nonRefundableRate, setNonRefundableRate] = useState<number>(2150);
  const [breakfastRate, setBreakfastRate] = useState<number>(2650);
  const [halfBoardRate, setHalfBoardRate] = useState<number>(2950);
  const [smartPricingEnabled, setSmartPricingEnabled] = useState<boolean>(true);
  const [selectedCalendarAction, setSelectedCalendarAction] = useState<'Open' | 'Close' | 'Block'>('Open');
  const [closedDates, setClosedDates] = useState<number[]>([14, 15]);
  const [blockedDates, setBlockedDates] = useState<number[]>([28]);
  const [checkInTime, setCheckInTime] = useState<string>('14:00');
  const [checkOutTime, setCheckOutTime] = useState<string>('11:00');
  const [earlyCheckIn, setEarlyCheckIn] = useState<'Available' | 'Unavailable'>('Available');
  const [lateCheckOut, setLateCheckOut] = useState<'Available' | 'Unavailable'>('Available');
  const [minStay, setMinStay] = useState<number>(1);
  const [maxStay, setMaxStay] = useState<number>(30);
  const [cancellationPolicy, setCancellationPolicy] = useState<string>('Flexible');
  const [childrenAllowed, setChildrenAllowed] = useState<'Yes' | 'No'>('Yes');
  const [petsAllowed, setPetsAllowed] = useState<'Yes' | 'No'>('No');
  const [smokingPolicy, setSmokingPolicy] = useState<string>('Non-smoking');
  const [partiesAllowed, setPartiesAllowed] = useState<'Allowed' | 'Not allowed'>('Not allowed');
  const [minGuestAge, setMinGuestAge] = useState<number>(18);

  // Stage 8 State (Payments & Taxes)
  const [accountHolder, setAccountHolder] = useState<string>('Meridian Hospitality Group (Pty) Ltd');
  const [bankName, setBankName] = useState<string>('First National Bank (FNB)');
  const [accountNumber, setAccountNumber] = useState<string>('62891044312');
  const [branchCode, setBranchCode] = useState<string>('250655');
  const [swiftBic, setSwiftBic] = useState<string>('FIRNZAJJ');
  const [bankAccountType, setBankAccountType] = useState<'Business' | 'Personal'>('Business');
  const [simGuestUsd, setSimGuestUsd] = useState<number>(180);
  const [chargesTaxes, setChargesTaxes] = useState<'Yes' | 'No'>('Yes');
  const [vatRate, setVatRate] = useState<number>(15);
  const [tourismLevyPct, setTourismLevyPct] = useState<number>(1);
  const [taxDisplayMode, setTaxDisplayMode] = useState<'Included in displayed price' | 'Added at checkout'>('Included in displayed price');

  // Stage 9 State (Compliance & Preview)
  const [legalChecks, setLegalChecks] = useState<boolean[]>([true, true, true, true, false]);
  const [previewTab, setPreviewTab] = useState<'Photos' | 'Rooms' | 'Amenities' | 'Location' | 'Reviews'>('Photos');

  // Hotel Command Center State (Post-Submission)
  const [commandTab, setCommandTab] = useState<CommandTab>('Overview');
  const [arrivals, setArrivals] = useState<ArrivalBooking[]>([
    { id: 'BK-901', guest: 'John Smith', room: 'Deluxe King', checkIn: '14:00', channel: 'AfriEstate', status: 'Confirmed' },
    { id: 'BK-902', guest: 'Maria Silva', room: 'Suite', checkIn: '15:00', channel: 'Website', status: 'Confirmed' },
    { id: 'BK-903', guest: 'Kofi Mensah', room: 'Executive Ocean Suite', checkIn: '16:30', channel: 'Corporate', status: 'Confirmed' },
  ]);
  const [copilotItems, setCopilotItems] = useState<CopilotCard[]>([
    {
      id: 'cp-1',
      message: 'Occupancy is 18% lower than expected next weekend.',
      impact: '+11 projected room nights',
      status: 'active',
    },
    {
      id: 'cp-2',
      message: 'Three competing hotels reduced their rates by 8%.',
      impact: 'Protect conversion on Flexible Rate',
      status: 'active',
    },
    {
      id: 'cp-3',
      message: "I recommend increasing Friday's rate by 6%.",
      impact: '+R18,400 incremental weekend RevPAR',
      status: 'active',
    },
    {
      id: 'cp-4',
      message: 'You have 14 unbooked rooms for the conference period.',
      impact: 'Activate corporate block rate',
      status: 'active',
    },
  ]);
  const [autoMessages, setAutoMessages] = useState<Record<string, boolean>>({
    'Booking confirmation': true,
    'Payment confirmation': true,
    'Pre-arrival reminder': true,
    'Check-in instructions': true,
    'Welcome message': true,
    'Check-out reminder': true,
    'Review request': false,
  });
  const [managedProperties, setManagedProperties] = useState([
    { name: 'The Cape Meridian Hotel', city: 'Cape Town', status: 'Verified', rooms: 142 },
    { name: 'Lusaka Grand Hotel', city: 'Lusaka', status: 'Verification', rooms: 118 },
    { name: 'Luanda Business Hotel', city: 'Luanda', status: 'Verified', rooms: 96 },
  ]);

  // Real-time password strength checks
  const passwordChecks = useMemo(() => {
    const len = password.length >= 8;
    const upper = /[A-Z]/.test(password);
    const lower = /[a-z]/.test(password);
    const num = /[0-9]/.test(password);
    const spec = /[^A-Za-z0-9]/.test(password);
    const count = [len, upper, lower, num, spec].filter(Boolean).length;
    const strength =
      count <= 1 ? 'Weak' : count <= 3 ? 'Fair' : count === 4 ? 'Good' : 'Strong';
    return { len, upper, lower, num, spec, count, strength };
  }, [password]);

  // Persistent Completion Calculation
  const checklistItems = useMemo(() => {
    return [
      { label: 'Account', done: accountVerified || (Boolean(firstName && businessEmail)) },
      { label: 'Business', done: Boolean(operatorType && companyName) },
      { label: 'Hotel profile', done: Boolean(hotelName && shortDesc.length > 20) },
      { label: 'Photos', done: galleryImages.length >= 5 },
      { label: 'Rooms', done: roomTypes.length > 0 },
      { label: 'Amenities', done: selectedAmenities.length >= 4 },
      { label: 'Rates', done: flexibleRate > 0 },
      { label: 'Policies', done: Boolean(cancellationPolicy && checkInTime) },
      { label: 'Payments', done: Boolean(bankName && accountNumber) },
      { label: 'Verification', done: legalChecks.every(Boolean) || mode === 'submitted' || mode === 'command-center' },
    ];
  }, [
    accountVerified,
    firstName,
    businessEmail,
    operatorType,
    companyName,
    hotelName,
    shortDesc,
    galleryImages.length,
    roomTypes.length,
    selectedAmenities.length,
    flexibleRate,
    cancellationPolicy,
    checkInTime,
    bankName,
    accountNumber,
    legalChecks,
    mode,
  ]);

  const completionPct = useMemo(() => {
    const baseDone = checklistItems.filter((c) => c.done).length;
    return Math.round((baseDone / checklistItems.length) * 100);
  }, [checklistItems]);

  const qualityScore = useMemo(() => {
    let score = 74;
    if (shortDesc.length >= 80) score += 5;
    if (galleryImages.length >= 5) score += 6;
    if (roomTypes.length >= 2) score += 5;
    if (selectedAmenities.length >= 10) score += 4;
    if (smartPricingEnabled) score += 3;
    if (legalChecks.every(Boolean)) score += 3;
    return Math.min(100, score);
  }, [shortDesc.length, galleryImages.length, roomTypes.length, selectedAmenities.length, smartPricingEnabled, legalChecks]);

  // Save draft helper
  const saveDraft = (nextStage = stage) => {
    try {
      const payload = {
        stage: nextStage,
        completionPct,
        firstName,
        middleName,
        lastName,
        businessEmail,
        phoneCountry,
        phoneCode,
        phoneNumber,
        consentTerms,
        consentPrivacy,
        consentUpdates,
        accountVerified,
        operatorType,
        companyName,
        tradingName,
        regNumber,
        regCountry,
        taxNumber,
        businessType,
        regProvince,
        regCity,
        regStreet,
        regPostal,
        relationship,
        uploadedDocs,
        hotelName,
        hotelType,
        starRating,
        officiallyAccredited,
        accreditingAuthority,
        certificateNumber,
        certificateExpiry,
        shortDesc,
        fullDesc,
        hotelCountry,
        hotelProvince,
        hotelCity,
        hotelDistrict,
        hotelStreet,
        hotelPostal,
        locationConfirmed,
        roomTypes,
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage quota failures
    }
  };

  useEffect(() => {
    if (mode === 'wizard') {
      saveDraft(stage);
    }
  }, [stage, mode]);

  const handleSaveAndExit = () => {
    saveDraft(stage);
    addToast(`Hotel registration progress (${completionPct}%) saved. You can resume anytime.`, 'success');
    setMode('landing');
  };

  const handleNextStage = () => {
    if (stage < 9) {
      const next = stage + 1;
      setStage(next);
      saveDraft(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setMode('submitted');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStage = () => {
    if (stage > 1) {
      setStage(stage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setMode('landing');
    }
  };

  const handleCreateAccountStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !businessEmail.trim()) {
      addToast('Please fill in your full name and business email.', 'error');
      return;
    }
    if (password && password !== confirmPassword) {
      addToast('Passwords do not match.', 'error');
      return;
    }
    if (!consentTerms || !consentPrivacy) {
      addToast('Please agree to the Terms of Service and Privacy Policy.', 'error');
      return;
    }
    setAwaitingOtp(true);
    addToast(`Verification codes sent to ${businessEmail} and ${phoneCode} ${phoneNumber || '82 555 1234'}.`, 'success');
  };

  const handleVerifyCodes = () => {
    setAccountVerified(true);
    setAwaitingOtp(false);
    addToast('Email and mobile verification confirmed.', 'success');
    setStage(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateAiCopy = async () => {
    setAiCopyLoading(true);
    try {
      const ai = new GoogleGenAI();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Write structured hotel listing copy for ${hotelName || 'The Cape Meridian Hotel'} (${hotelType}, ${starRating}) located in ${hotelCity}, ${hotelCountry}. Include these exact headings: About the Hotel, Rooms & Accommodation, Dining, Business Facilities, Wellness & Recreation, Nearby Attractions.`,
      });
      if (response.text && response.text.trim().length > 40) {
        setFullDesc(response.text.trim());
        addToast('AI hotel listing copy generated.', 'success');
        return;
      }
      throw new Error('Empty output');
    } catch {
      setFullDesc(
        `About the Hotel\n${hotelName || 'The Cape Meridian Hotel'} is a premier ${starRating.toLowerCase()} ${hotelType.toLowerCase()} in ${hotelDistrict}, ${hotelCity}, delivering refined coastal and executive hospitality.\n\nRooms & Accommodation\n• ${totalRoomsCount} thoughtfully appointed guest rooms and suites starting from ${baseCurrency} ${flexibleRate.toLocaleString()} per night\n• Soundproofed architecture, high-speed fibre, and bespoke African design accents\n\nDining\n• Signature all-day restaurant, curated cellar & sunset terrace bar, and 24-hour in-room dining\n\nBusiness Facilities\n• Executive boardrooms, high-capacity conference halls, and dedicated event concierge\n\nWellness & Recreation\n• Heated pool deck, private treatment spa, steam room, and panoramic fitness studio\n\nNearby Attractions\n• Immediate access to ${hotelCity} CBD, waterfront retail, and international airport transit`
      );
      addToast('Structured luxury hotel listing copy prepared.', 'success');
    } finally {
      setAiCopyLoading(false);
    }
  };

  const handleAddRoomType = () => {
    const idx = roomTypes.length + 1;
    const newRoom: RoomTypeDraft = {
      id: `room-${Date.now()}`,
      name: `Superior Twin Suite ${idx}`,
      category: 'Superior',
      bedConfig: 'Twin',
      maxAdults: 2,
      maxChildren: 1,
      sizeSqm: 38,
      hasBalcony: false,
      viewType: 'City',
      availableCount: 16,
      baseRate: 2150,
      amenities: ['Air conditioning', 'Smart TV', 'Safe', 'Desk', 'Shower'],
      photoCount: 5,
    };
    setRoomTypes((prev) => [...prev, newRoom]);
    addToast('Added new room configuration.', 'success');
  };

  const handleSubmitRegistration = () => {
    if (!legalChecks.slice(0, 4).every(Boolean)) {
      addToast('Please confirm all mandatory legal and compliance declarations.', 'error');
      return;
    }
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setMode('submitted');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const maskedEmail = useMemo(() => {
    const email = businessEmail.trim() || 'lusimadio@hotel.com';
    const [local, domain] = email.split('@');
    return `${local[0] || 'l'}***@${domain || 'hotel.com'}`;
  }, [businessEmail]);

  const maskedPhone = useMemo(() => {
    const tail = (phoneNumber || '825551234').slice(-4);
    return `${phoneCode} *** *** ${tail}`;
  }, [phoneCode, phoneNumber]);

  // Multi-currency settlement math (Section 33)
  const zarGross = Math.round(simGuestUsd * 18);
  const afriFee = Math.round(zarGross * 0.08);
  const payFee = Math.round(zarGross * 0.025);
  const hotelPayout = zarGross - afriFee - payFee;

  // ---------------------------------------------------------------------------
  // VIEW 1: LANDING ENTRY POINT
  // ---------------------------------------------------------------------------
  if (mode === 'landing') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {/* Top Breadcrumb Bar */}
        <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="w-full px-4 sm:px-6 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                <ArrowLeftIcon className="w-4 h-4 shrink-0" />
                <span>Back</span>
              </button>
              <nav className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>AfriEstate</span>
                <span aria-hidden="true">→</span>
                <span>List Your Property</span>
                <span aria-hidden="true">→</span>
                <span className="font-semibold text-slate-900 dark:text-white">Hotel</span>
              </nav>
            </div>
            <button
              type="button"
              onClick={() => setMode('command-center')}
              className="text-xs font-semibold text-emerald-800 dark:text-amber-300 hover:underline whitespace-nowrap"
            >
              Preview Hotel Command Center
            </button>
          </div>
        </div>

        {/* Hero Entry Point */}
        <section className="relative bg-[#0B1F1A] text-white">
          <div className="w-full px-4 sm:px-6 lg:px-10 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                AfriEstate Hospitality Partner Onboarding
              </p>
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading tracking-tight text-white leading-[1.06]"
                style={{ textWrap: 'balance' }}
              >
                List Your Hotel on Africa&apos;s Smart Property Network
              </h1>
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Reach guests across Africa and globally, manage reservations, showcase your property, and grow your occupancy with AfriEstate.
              </p>

              {/* Save & Resume Prompt if incomplete draft exists */}
              {savedDraft && (
                <div className="rounded-xl bg-white/10 border border-amber-300/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Saved Draft Detected</p>
                    <p className="text-sm text-white mt-0.5">
                      Your hotel registration is <strong className="font-mono">{savedDraft.completionPct || 62}%</strong> complete.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode('wizard')}
                    className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold whitespace-nowrap shrink-0"
                  >
                    Continue Registration →
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStage(1);
                    setMode('wizard');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold transition-colors whitespace-nowrap"
                >
                  <span>Start Hotel Registration</span>
                  <ArrowRightIcon className="w-4 h-4 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={onSignInClick}
                  className="inline-flex items-center gap-2 px-5 py-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Already registered? Sign In
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5 pt-4 border-t border-white/10 text-xs sm:text-sm text-slate-200">
                {[
                  'Verified hotel profiles',
                  'Secure payments',
                  'Smart booking management',
                  'Africa-wide distribution',
                  'AI-powered property visibility',
                  'Multi-currency support',
                  'Professional hotel dashboard',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Right Visual Preview */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl">
                <div className="relative h-64 sm:h-72">
                  <img
                    src="/images/coastal_mansion_1779978805301.png"
                    alt="The Cape Meridian Hotel"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                    <div>
                      <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Verified Partner Preview</p>
                      <h3 className="text-xl font-bold font-heading text-white mt-0.5">The Cape Meridian Hotel</h3>
                      <p className="text-xs text-slate-200">Cape Town, South Africa · 142 rooms</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-300">From</p>
                      <p className="text-xl font-bold font-mono tabular-nums text-amber-300">R2,450</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-3 gap-4 border-t border-white/10 text-center bg-[#081713]">
                  <div>
                    <p className="text-lg font-bold font-mono tabular-nums text-white">9 Stages</p>
                    <p className="text-[11px] text-slate-400">Guided Setup</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold font-mono tabular-nums text-amber-300">AI Copilot</p>
                    <p className="text-[11px] text-slate-400">Dynamic Rates</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold font-mono tabular-nums text-emerald-300">5% Base</p>
                    <p className="text-[11px] text-slate-400">Enterprise Desk</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9-Stage Architecture Blueprint */}
        <section className="w-full px-4 sm:px-6 lg:px-10 py-14 space-y-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Hotel Marketplace · Guided Onboarding · Hospitality Operating System
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white mt-1">
              Nine Concierge Stages from Account to Live Reservations
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STAGES.map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => {
                  setStage(st.num);
                  setMode('wizard');
                }}
                className="text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:border-emerald-700/60 dark:hover:border-amber-400/60 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-700 dark:text-amber-300">
                    0{st.num} · {st.key}
                  </span>
                  <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mt-2">
                  {st.label}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Click to jump directly to Stage 0{st.num} inside the concierge workflow.
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 3: SUBMISSION & VERIFICATION DASHBOARD (Sections 40 & 41)
  // ---------------------------------------------------------------------------
  if (mode === 'submitted') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="bg-[#0B1F1A] text-white rounded-2xl p-8 sm:p-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                  Owner Confirmation
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold font-heading text-white mt-1">
                  Your hotel is ready for review
                </h1>
                <p className="text-sm text-slate-300 mt-2">
                  Your registration for <strong className="text-white">{hotelName}</strong> has been successfully submitted to AfriEstate.
                </p>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/15 px-5 py-3.5 text-right">
                <p className="text-[11px] uppercase tracking-wider text-slate-300">Registration ID</p>
                <p className="text-lg font-bold font-mono tabular-nums text-amber-300">AFR-HOT-004827</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-sm">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <p className="text-xs text-slate-300">Status</p>
                  <p className="font-semibold text-white">Verification in progress · UNDER REVIEW</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="w-5 h-5 text-emerald-300 shrink-0" />
                <div>
                  <p className="text-xs text-slate-300">Estimated review window</p>
                  <p className="font-semibold font-mono text-white">24–72 hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 37: Verification Center + Section 41: What Happens Next */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                  PROPERTY VERIFICATION
                </h2>
                <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-300">
                  UNDER REVIEW
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {[
                  { label: 'Account', done: true },
                  { label: 'Business', done: true },
                  { label: 'Hotel information', done: true },
                  { label: 'Location', done: true },
                  { label: 'Rooms', done: true },
                  { label: 'Rates', done: true },
                  { label: 'Banking', done: true },
                  { label: 'Identity verification', done: false },
                  { label: 'Property verification', done: false },
                ].map((item) => (
                  <div key={item.label} className="py-2.5 flex items-center justify-between">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.label}</span>
                    {item.done ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                        <ClockIcon className="w-4 h-4" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                  What Happens Next?
                </h2>
                {[
                  { num: '01', title: 'Verification', desc: 'AfriEstate verifies your hotel and submitted documents.' },
                  { num: '02', title: 'Quality Review', desc: 'Our system checks your listing, photos, pricing and information.' },
                  { num: '03', title: 'Approval', desc: 'Your property becomes an AfriEstate Verified Hotel.' },
                  { num: '04', title: 'Go Live', desc: 'Your hotel becomes searchable and bookable.' },
                ].map((step) => (
                  <div key={step.num} className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                    <span className="font-mono text-xs font-bold text-emerald-700 dark:text-amber-300 pt-0.5">
                      {step.num}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{step.title}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setMode('command-center')}
                  className="flex-1 py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-emerald-900 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap"
                >
                  Open Hotel Command Center →
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="py-3.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Back to Marketplace
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 4: HOTEL COMMAND CENTER & MULTI-PROPERTY OS (Sections 42 - 51)
  // ---------------------------------------------------------------------------
  if (mode === 'command-center') {
    const channelTotal = 42 + 18 + 31 + 12;

    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row">
        {/* Left Navigation Sidebar */}
        <aside className="lg:w-64 shrink-0 bg-[#0B1F1A] text-white p-5 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-300">AFRIESTATE</p>
              <h2 className="text-base font-bold font-heading text-white mt-0.5">Hotel Command Center</h2>
            </div>

            <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1">
              {COMMAND_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = commandTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCommandTab(item.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-amber-400 text-slate-950'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.id}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 mt-6 border-t border-white/10 space-y-2">
            <button
              type="button"
              onClick={() => {
                setStage(1);
                setMode('wizard');
              }}
              className="w-full py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-amber-300 transition-colors"
            >
              + Add Another Property
            </button>
            <button
              type="button"
              onClick={() => setMode('landing')}
              className="w-full py-2 px-3 rounded-lg text-xs text-slate-300 hover:text-white"
            >
              Exit Command Center
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-5 sm:p-8 lg:p-10 space-y-8 overflow-x-hidden">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-amber-300">
                GOOD MORNING, {hotelName.toUpperCase()}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                Your hotel is live. · {commandTab}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setStage(9);
                  setMode('wizard');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Edit Listing Details
              </button>
              <button
                type="button"
                onClick={() => addToast('Live rate sync pushed across all connected channels.', 'success')}
                className="px-4 py-2 rounded-xl bg-[#0B1F1A] hover:bg-emerald-900 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 text-xs font-bold"
              >
                Sync Channels
              </button>
            </div>
          </div>

          {/* Persistent 5-KPI Command Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
            {[
              { label: 'Occupancy', value: '78%' },
              { label: 'Bookings', value: '126' },
              { label: 'Revenue', value: 'R428,600' },
              { label: 'ADR', value: 'R2,380' },
              { label: 'RevPAR', value: 'R1,856' },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400">{kpi.label}</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* Section 43 + Section 46: Today's Arrivals & AI Hotel Copilot */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Today's Arrivals Booking Management */}
            <div className="xl:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                  Today&apos;s Arrivals
                </h3>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {arrivals.length} reservations
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[540px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500">
                      <th className="py-2.5 pr-3">Guest</th>
                      <th className="py-2.5 px-3">Room</th>
                      <th className="py-2.5 px-3">Check-in</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 pl-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                    {arrivals.map((bk) => (
                      <tr key={bk.id}>
                        <td className="py-3 pr-3 font-semibold text-slate-900 dark:text-white">{bk.guest}</td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{bk.room}</td>
                        <td className="py-3 px-3 font-mono tabular-nums text-slate-700 dark:text-slate-300">{bk.checkIn}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-xs font-semibold ${
                              bk.status === 'Checked In'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : bk.status === 'Cancelled'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {bk.status}
                          </span>
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <div className="inline-flex flex-wrap gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setArrivals((prev) =>
                                  prev.map((item) =>
                                    item.id === bk.id ? { ...item, status: 'Checked In' } : item
                                  )
                                );
                                addToast(`${bk.guest} checked into ${bk.room}.`, 'success');
                              }}
                              className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold"
                            >
                              Check in
                            </button>
                            <button
                              type="button"
                              onClick={() => addToast(`Direct pre-arrival welcome message dispatched to ${bk.guest}.`, 'success')}
                              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-semibold"
                            >
                              Message
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setArrivals((prev) =>
                                  prev.map((item) =>
                                    item.id === bk.id ? { ...item, status: 'Cancelled' } : item
                                  )
                                );
                              }}
                              className="px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 46: AI Hotel Copilot */}
            <div className="xl:col-span-5 bg-[#0B1F1A] text-white rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-amber-300" />
                  <h3 className="text-lg font-bold font-heading text-white">AI Hotel Copilot</h3>
                </div>
                <span className="text-xs font-mono text-emerald-300">Live Revenue Advisor</span>
              </div>

              <div className="space-y-3">
                {copilotItems
                  .filter((c) => c.status !== 'dismissed')
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2.5"
                    >
                      <p className="text-sm text-white font-medium">&ldquo;{item.message}&rdquo;</p>
                      <p className="text-xs text-amber-300 font-mono">{item.impact}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCopilotItems((prev) =>
                              prev.map((c) => (c.id === item.id ? { ...c, status: 'applied' } : c))
                            );
                            addToast(`Copilot action applied: ${item.impact}`, 'success');
                          }}
                          disabled={item.status === 'applied'}
                          className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold disabled:opacity-60"
                        >
                          {item.status === 'applied' ? 'Applied' : 'Apply recommendation'}
                        </button>
                        <button
                          type="button"
                          onClick={() => addToast(`Analyzing demand elasticity for: ${item.message}`, 'info')}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
                        >
                          Analyze
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCopilotItems((prev) =>
                              prev.map((c) => (c.id === item.id ? { ...c, status: 'dismissed' } : c))
                            )
                          }
                          className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Section 44 + 45 + 51: Omnichannel Central Inventory, Automated Messaging & My Properties */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Omnichannel Inventory */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                Omnichannel Central Inventory
              </h3>
              <div className="space-y-2.5 text-sm">
                {[
                  { channel: 'AfriEstate', rooms: 42 },
                  { channel: 'Hotel Website', rooms: 18 },
                  { channel: 'Partner OTA', rooms: 31 },
                  { channel: 'Corporate', rooms: 12 },
                ].map((ch) => (
                  <div key={ch.channel} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">{ch.channel}</span>
                    <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {ch.rooms} rooms
                    </span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-[#FAF8F5] dark:bg-slate-800 p-4 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-amber-300">
                  CENTRAL INVENTORY
                </span>
                <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {channelTotal} total rooms
                </span>
              </div>
            </div>

            {/* Automated Guest Communication */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                Automated Guest Messaging
              </h3>
              <div className="rounded-xl bg-[#FAF8F5] dark:bg-slate-800 p-3.5 text-xs text-slate-700 dark:text-slate-200">
                &ldquo;Welcome to {hotelName}. We look forward to welcoming you.&rdquo;
              </div>
              <div className="space-y-2">
                {Object.entries(autoMessages).map(([msgKey, enabled]) => (
                  <label key={msgKey} className="flex items-center justify-between text-xs sm:text-sm cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-300">{msgKey}</span>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() =>
                        setAutoMessages((prev) => ({ ...prev, [msgKey]: !prev[msgKey] }))
                      }
                      className="h-4 w-4 rounded text-emerald-700"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Multiple Hotel Management (Section 51) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                  My Properties
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setManagedProperties((prev) => [
                      ...prev,
                      { name: 'Zanzibar Cove Resort', city: 'Zanzibar', status: 'Verification', rooms: 64 },
                    ]);
                    addToast('New property added to portfolio.', 'success');
                  }}
                  className="text-xs font-bold text-emerald-700 dark:text-amber-300 hover:underline"
                >
                  + Add Another Property
                </button>
              </div>
              <div className="space-y-3">
                {managedProperties.map((prop) => (
                  <div
                    key={prop.name}
                    className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{prop.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {prop.city} · {prop.rooms} rooms
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        prop.status === 'Verified'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {prop.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 2: CONCIERGE 9-STAGE WIZARD
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
      {/* Persistent Concierge Top Bar */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black tracking-widest uppercase text-slate-900 dark:text-white">
              AFRIESTATE · HOTEL REGISTRATION
            </span>
            <span className="hidden md:inline text-xs text-slate-400">
              Stage 0{stage} of 09 · {STAGES[stage - 1].label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => addToast('Concierge onboarding desk notified — call +27 21 555 0140 for live help.', 'info')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Help
            </button>
            <button
              type="button"
              onClick={handleSaveAndExit}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              Save &amp; Exit
            </button>
          </div>
        </div>

        {/* Persistent 9-Stage Step Indicator */}
        <div className="w-full px-4 sm:px-6 lg:px-10 pb-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {STAGES.map((st, idx) => {
              const active = st.num === stage;
              const completed = st.num < stage;
              return (
                <React.Fragment key={st.key}>
                  <button
                    type="button"
                    onClick={() => setStage(st.num)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                      active
                        ? 'bg-[#0B1F1A] dark:bg-amber-400 text-white dark:text-slate-950'
                        : completed
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="font-mono">{completed ? '✓' : `0${st.num}`}</span>
                    <span>{st.key}</span>
                  </button>
                  {idx < STAGES.length - 1 && (
                    <span className="text-slate-300 dark:text-slate-700 text-xs" aria-hidden="true">
                      →
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Split Workspace: Left Form + Right Registration Summary */}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* MAIN FORM COLUMN */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
            {/* ================= STAGE 1: ACCOUNT CREATION & OTP ================= */}
            {stage === 1 && !awaitingOtp && (
              <form onSubmit={handleCreateAccountStep} className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-amber-300">
                    Stage 01 · Account Creation
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white mt-1">
                    Create your AfriEstate Hotel Partner Account
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Your account gives you access to hotel management, bookings, analytics, payments and guest communication.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">First name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Lusimadio"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Middle name <span className="text-slate-400 font-normal">— optional</span>
                    </label>
                    <input
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Last name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Ndlovu"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Business Email</label>
                    <input
                      type="email"
                      required
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      placeholder="reservations@capemeridian.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mobile Number</label>
                    <div className="flex gap-2">
                      <select
                        value={phoneCountry}
                        onChange={(e) => {
                          const selected = COUNTRY_PHONE_CODES.find((c) => c.country === e.target.value);
                          setPhoneCountry(e.target.value);
                          if (selected) setPhoneCode(selected.code);
                        }}
                        className="px-2.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      >
                        {COUNTRY_PHONE_CODES.map((c) => (
                          <option key={c.country} value={c.country}>
                            {c.country} ({c.code})
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="82 555 1234"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create strong password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>
                </div>

                {/* Real-Time Password Validation & Strength Meter */}
                <div className="rounded-xl bg-[#FAF8F5] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Password strength: {passwordChecks.strength}
                    </span>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      {(['Weak', 'Fair', 'Good', 'Strong'] as const).map((level) => (
                        <span
                          key={level}
                          className={
                            passwordChecks.strength === level
                              ? level === 'Strong'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : level === 'Good'
                                ? 'text-amber-600 dark:text-amber-300'
                                : 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-400'
                          }
                        >
                          {level}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    {[
                      { label: '8+ characters', ok: passwordChecks.len },
                      { label: 'One uppercase letter', ok: passwordChecks.upper },
                      { label: 'One lowercase letter', ok: passwordChecks.lower },
                      { label: 'One number', ok: passwordChecks.num },
                      { label: 'One special character', ok: passwordChecks.spec },
                    ].map((req) => (
                      <div key={req.label} className={`flex items-center gap-1.5 ${req.ok ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                        <CheckIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Consent Checkboxes */}
                <div className="space-y-2.5 text-xs sm:text-sm">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentTerms}
                      onChange={(e) => setConsentTerms(e.target.checked)}
                      className="h-4 w-4 rounded text-emerald-700"
                    />
                    <span>I agree to AfriEstate Terms of Service</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentPrivacy}
                      onChange={(e) => setConsentPrivacy(e.target.checked)}
                      className="h-4 w-4 rounded text-emerald-700"
                    />
                    <span>I agree to the Privacy Policy</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentUpdates}
                      onChange={(e) => setConsentUpdates(e.target.checked)}
                      className="h-4 w-4 rounded text-emerald-700"
                    />
                    <span>I consent to receiving hotel partner updates</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#0B1F1A] hover:bg-emerald-900 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 text-sm font-bold transition-colors"
                >
                  Create Hotel Account →
                </button>
              </form>
            )}

            {/* ================= STAGE 1B: EMAIL & PHONE VERIFICATION ================= */}
            {stage === 1 && awaitingOtp && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-amber-300">
                    Email &amp; Phone Verification
                  </p>
                  <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mt-1">
                    Verify your account
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    We&apos;ve sent a verification code to your email and phone.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-slate-500">Email</span>
                      <button
                        type="button"
                        onClick={() => setAwaitingOtp(false)}
                        className="text-xs font-semibold text-emerald-700 dark:text-amber-300 hover:underline"
                      >
                        Change email
                      </button>
                    </div>
                    <p className="text-sm font-mono font-semibold text-slate-900 dark:text-white">{maskedEmail}</p>
                    <p className="text-xs text-slate-500">Enter 6-digit code</p>
                    <div className="grid grid-cols-6 gap-2">
                      {emailOtp.map((val, i) => (
                        <input
                          key={i}
                          type="text"
                          maxLength={1}
                          value={val}
                          onChange={(e) => {
                            const next = [...emailOtp];
                            next[i] = e.target.value;
                            setEmailOtp(next);
                          }}
                          className="h-11 text-center font-mono text-lg font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-slate-500">Phone</span>
                      <button
                        type="button"
                        onClick={() => setAwaitingOtp(false)}
                        className="text-xs font-semibold text-emerald-700 dark:text-amber-300 hover:underline"
                      >
                        Change phone
                      </button>
                    </div>
                    <p className="text-sm font-mono font-semibold text-slate-900 dark:text-white">{maskedPhone}</p>
                    <p className="text-xs text-slate-500">Enter 6-digit code</p>
                    <div className="grid grid-cols-6 gap-2">
                      {phoneOtp.map((val, i) => (
                        <input
                          key={i}
                          type="text"
                          maxLength={1}
                          value={val}
                          onChange={(e) => {
                            const next = [...phoneOtp];
                            next[i] = e.target.value;
                            setPhoneOtp(next);
                          }}
                          className="h-11 text-center font-mono text-lg font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <ShieldCheckIcon className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>For your security, additional verification may be required if suspicious activity is detected.</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleVerifyCodes}
                    className="px-6 py-3 rounded-xl bg-[#0B1F1A] hover:bg-emerald-900 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 text-sm font-bold"
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => addToast('New 6-digit verification codes dispatched.', 'success')}
                    className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Resend code
                  </button>
                </div>
              </div>
            )}

            {/* ================= STAGE 2: BUSINESS & OWNERSHIP VERIFICATION ================= */}
            {stage === 2 && (
              <div className="space-y-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-amber-300">
                    Stage 02 · Business &amp; Operator Verification
                  </p>
                  <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mt-1">
                    What type of hotel operator are you?
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {OPERATOR_TYPES.map((op) => {
                    const selected = operatorType === op.id;
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setOperatorType(op.id)}
                        className={`text-left p-5 rounded-xl border transition-all ${
                          selected
                            ? 'border-emerald-700 dark:border-amber-400 bg-emerald-50/60 dark:bg-emerald-950/30'
                            : 'border-slate-200 dark:border-slate-800 bg-[#FAF8F5] dark:bg-slate-800/40 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{op.title}</h3>
                          {selected && <CheckCircleIcon className="w-5 h-5 text-emerald-700 dark:text-amber-300 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{op.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Company / Corporate Details */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                    Business Details ({operatorType})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Registered Business Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Trading Name</label>
                      <input
                        type="text"
                        value={tradingName}
                        onChange={(e) => setTradingName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Registration Number</label>
                      <input
                        type="text"
                        value={regNumber}
                        onChange={(e) => setRegNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Country of Registration</label>
                      <input
                        type="text"
                        value={regCountry}
                        onChange={(e) => setRegCountry(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Tax / VAT Number</label>
                      <input
                        type="text"
                        value={taxNumber}
                        onChange={(e) => setTaxNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Business Type</label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                      >
                        {['Private Company', 'Public Company', 'Partnership', 'Sole Proprietorship', 'Nonprofit', 'Other'].map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Registered Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                    <input
                      type="text"
                      value={regProvince}
                      onChange={(e) => setRegProvince(e.target.value)}
                      placeholder="Province/State"
                      className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                    <input
                      type="text"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      placeholder="City"
                      className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                    <input
                      type="text"
                      value={regStreet}
                      onChange={(e) => setRegStreet(e.target.value)}
                      placeholder="Street address"
                      className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                    <input
                      type="text"
                      value={regPostal}
                      onChange={(e) => setRegPostal(e.target.value)}
                      placeholder="Postal code"
                      className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Ownership / Property Relationship (Section 7) */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <div>
                    <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                      Ownership &amp; Management Verification
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">What is your relationship to this hotel?</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {['Owner', 'General Manager', 'Authorized Representative', 'Management Company', 'Franchise Operator', 'Leasing Operator'].map(
                      (rel) => (
                        <button
                          key={rel}
                          type="button"
                          onClick={() => setRelationship(rel)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-semibold border text-left transition-colors ${
                            relationship === rel
                              ? 'bg-[#0B1F1A] dark:bg-amber-400 text-white dark:text-slate-950 border-transparent'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {rel}
                        </button>
                      )
                    )}
                  </div>

                  {/* Business & Authorization Documents Upload */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      'Certificate of incorporation',
                      'Tax certificate',
                      'Business registration',
                      'Operating license',
                      ...(relationship !== 'Owner' ? ['Authorization evidence'] : []),
                    ].map((docName) => {
                      const isUp = Boolean(uploadedDocs[docName]);
                      return (
                        <div
                          key={docName}
                          className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{docName}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {isUp ? 'Uploaded · Readable · Verification pending' : 'PDF or image required'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedDocs((prev) => ({ ...prev, [docName]: true }));
                              addToast(`${docName} uploaded & scanned readable.`, 'success');
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                              isUp
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950'
                            }`}
                          >
                            {isUp ? 'Uploaded' : 'Upload'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================= STAGE 3: HOTEL IDENTITY, CLASSIFICATION, COPY & AI PHOTOS ================= */}
            {stage === 3 && (
              <div className="space-y-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-amber-300">
                    Stage 03 · Hotel Identity &amp; Branding
                  </p>
                  <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mt-1">
                    Public-Facing Hotel Profile &amp; Media Quality
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Hotel Name</label>
                    <input
                      type="text"
                      value={hotelName}
                      onChange={(e) => setHotelName(e.target.value)}
                      placeholder="The Cape Meridian Hotel"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Hotel Type</label>
                    <select
                      value={hotelType}
                      onChange={(e) => setHotelType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    >
                      {HOTEL_TYPES.map((ht) => (
                        <option key={ht} value={ht}>
                          {ht}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Classification & Accreditation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Star Rating</label>
                    <select
                      value={starRating}
                      onChange={(e) => setStarRating(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    >
                      {['1 Star', '2 Star', '3 Star', '4 Star', '5 Star', 'Luxury / Unrated'].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Is this rating officially accredited?</label>
                    <div className="flex gap-2">
                      {(['Yes', 'No'] as const).map((ans) => (
                        <button
                          key={ans}
                          type="button"
                          onClick={() => setOfficiallyAccredited(ans)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${
                            officiallyAccredited === ans
                              ? 'bg-[#0B1F1A] dark:bg-amber-400 text-white dark:text-slate-950 border-transparent'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {ans}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {officiallyAccredited === 'Yes' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Accrediting Authority</label>
                      <input
                        type="text"
                        value={accreditingAuthority}
                        onChange={(e) => setAccreditingAuthority(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Certificate Number</label>
                      <input
                        type="text"
                        value={certificateNumber}
                        onChange={(e) => setCertificateNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={certificateExpiry}
                        onChange={(e) => setCertificateExpiry(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Descriptions + AI Assistant */}
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span>Short Description (Used in search results)</span>
                      <span className="font-mono text-slate-500">{shortDesc.length} / 250</span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={250}
                      value={shortDesc}
                      onChange={(e) => setShortDesc(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold">Full Structured Description</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleGenerateAiCopy}
                          disabled={aiCopyLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1F1A] hover:bg-emerald-900 dark:bg-amber-400 dark:text-slate-950 text-white text-xs font-bold"
                        >
                          <SparklesIcon className="w-3.5 h-3.5" />
                          <span>{aiCopyLoading ? 'Generating...' : 'Generate with AI'}</span>
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={8}
                      value={fullDesc}
                      onChange={(e) => setFullDesc(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-sans leading-relaxed"
                    />
                  </div>
                </div>

                {/* Hotel Gallery & AI Image Quality Check (Sections 11 & 12) */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                        Hotel Branding, Gallery &amp; AI Image Quality Check
                      </h3>
                      <p className="text-xs text-slate-500">Minimum 5 images (Recommended 15–30) · Cover recommended 2400 × 1200</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGalleryImages((prev) => [...prev, '/images/modern_house_tan_1779978632706.png']);
                        addToast('Image uploaded and passed AI quality inspection (93%).', 'success');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold"
                    >
                      <CloudArrowUpIcon className="w-4 h-4" />
                      <span>Upload Photo ({galleryImages.length})</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {GALLERY_CATEGORIES.map((cat) => {
                      const active = selectedGalleryCats.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() =>
                            setSelectedGalleryCats((prev) =>
                              prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            active
                              ? 'bg-[#0B1F1A] dark:bg-amber-400 text-white dark:text-slate-950 border-transparent'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center rounded-xl bg-[#0B1F1A] text-white p-5">
                    <div className="md:col-span-7 space-y-2.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        AI Image Quality Check (Resolution · Watermarks · Lighting)
                      </p>
                      {[
                        { label: 'Exterior', score: 96 },
                        { label: 'Lobby', score: 94 },
                        { label: 'Deluxe Room', score: 91 },
                        { label: 'Pool', score: 88 },
                      ].map((row) => (
                        <div key={row.label} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{row.label}</span>
                            <span className="font-mono text-amber-300">{row.score}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-amber-400" style={{ width: `${row.score}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="md:col-span-5 text-center border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-4">
                      <p className="text-xs text-slate-300 uppercase tracking-wider">Overall Listing Quality</p>
                      <p className="text-4xl font-bold font-mono tabular-nums text-amber-300 mt-1">92 / 100</p>
                      <p className="text-xs text-emerald-300 mt-1">Zero duplicates or watermarks detected</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STAGE 4: LOCATION, MAP & ADDRESS SEPARATION ================= */}
            {stage === 4 && (
              <div className="space-y-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-amber-300">
                    Stage 04 · Location &amp; Property Context
                  </p>
                  <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mt-1">
                    Where is your hotel located?
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Country</label>
                    <input
                      type="text"
                      value={hotelCountry}
                      onChange={(e) => setHotelCountry(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Province / State</label>
                    <input
                      type="text"
                      value={hotelProvince}
                      onChange={(e) => setHotelProvince(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">City</label>
                    <input
                      type="text"
                      value={hotelCity}
                      onChange={(e) => setHotelCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">District</label>
                    <input
                      type="text"
                      value={hotelDistrict}
                      onChange={(e) => setHotelDistrict(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Street Address</label>
                    <input
                      type="text"
                      value={hotelStreet}
                      onChange={(e) => setHotelStreet(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Postal Code</label>
                    <input
                      type="text"
                      value={hotelPostal}
                      onChange={(e) => setHotelPostal(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Map Pin Confirmation + Location Intelligence */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
                    <iframe
                      title={`${hotelName} Map`}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(`${hotelStreet}, ${hotelCity}, ${hotelCountry}`)}&z=13&output=embed`}
                      className="w-full h-56 border-0"
                      loading="lazy"
                    />
                    <div className="p-4 bg-[#FAF8F5] dark:bg-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Is this the exact location of your hotel?
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setLocationConfirmed(true);
                            addToast('Hotel GPS pin confirmed.', 'success');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            locationConfirmed ? 'bg-emerald-700 text-white' : 'bg-white dark:bg-slate-900 border border-slate-300'
                          }`}
                        >
                          Yes, confirm location
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLocationConfirmed(false);
                            addToast('Pin unlocked — update street coordinates above.', 'info');
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-600"
                        >
                          Adjust location
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 rounded-2xl bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-amber-300">
                      AfriEstate Location Intelligence
                    </p>
                    {[
                      { place: `${hotelCity} International Airport`, dist: '18.4 km' },
                      { place: 'V&A Waterfront / Harbour District', dist: '3.2 km' },
                      { place: `${hotelCity} CBD`, dist: '2.8 km' },
                      { place: 'Major Hospital & Medical Center', dist: '2.1 km' },
                      { place: 'Convention & Conference Precinct', dist: '3.6 km' },
                    ].map((loc) => (
                      <div key={loc.place} className="flex items-center justify-between text-xs sm:text-sm py-1.5 border-b border-slate-200/70 dark:border-slate-700 last:border-b-0">
                        <span className="text-slate-800 dark:text-slate-200">{loc.place}</span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-amber-300">{loc.dist}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location Privacy Separation */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Address Classification (Public vs Operational)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Public address</label>
                      <input
                        type="text"
                        value={publicAddress}
                        onChange={(e) => setPublicAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Operational address</label>
                      <input
                        type="text"
                        value={operationalAddress}
                        onChange={(e) => setOperationalAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Billing address</label>
                      <input
                        type="text"
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Emergency contact address</label>
                      <input
                        type="text"
                        value={emergencyAddress}
                        onChange={(e) => setEmergencyAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STAGE 5: PROPERTY SPECS & ROOM TYPES INVENTORY ================= */}
            {stage === 5 && (
              <div className="space-y-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-amber-300">
                    Stage 05 · Physical Property &amp; Room Configuration
                  </p>
                  <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mt-1">
                    Property Scale &amp; Room Categories
                  </h2>
                </div>

                {/* Section 17: Physical Property Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'Buildings', val: buildingsCount, set: setBuildingsCount },
                    { label: 'Floors', val: floorsCount, set: setFloorsCount },
                    { label: 'Total Rooms', val: totalRoomsCount, set: setTotalRoomsCount },
                    { label: 'Year Opened', val: yearOpened, set: setYearOpened },
                    { label: 'Last Renovation', val: lastRenovation, set: setLastRenovation },
                    { label: 'Total Capacity', val: totalCapacity, set: setTotalCapacity },
                  ].map((field) => (
                    <div key={field.label} className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <label className="block text-[11px] font-semibold text-slate-500">{field.label}</label>
                      <input
                        type="number"
                        value={field.val}
                        onChange={(e) => field.set(Number(e.target.value))}
                        className="w-full mt-1 bg-transparent text-base font-bold font-mono text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Section 20-24: Room Type Builder */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                      Room Types &amp; Inventory ({roomTypes.length} configured)
                    </h3>
                    <p className="text-xs text-slate-500">Define bed layout, m² size, occupancy, amenities, and room counts.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRoomType}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B1F1A] dark:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Room Type</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {roomTypes.map((room, rIdx) => (
                    <div
                      key={room.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800/50 p-5 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-700 dark:text-amber-300">
                          Room Type #{rIdx + 1} · {room.availableCount} rooms available · {room.maxAdults} adults + {room.maxChildren} child
                        </span>
                        {roomTypes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setRoomTypes((prev) => prev.filter((r) => r.id !== room.id))}
                            className="text-rose-600 text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block font-semibold mb-1">Room Name</label>
                          <input
                            type="text"
                            value={room.name}
                            onChange={(e) =>
                              setRoomTypes((prev) =>
                                prev.map((r) => (r.id === room.id ? { ...r, name: e.target.value } : r))
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Category</label>
                          <select
                            value={room.category}
                            onChange={(e) =>
                              setRoomTypes((prev) =>
                                prev.map((r) => (r.id === room.id ? { ...r, category: e.target.value } : r))
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          >
                            {['Standard', 'Superior', 'Deluxe', 'Executive', 'Suite', 'Presidential', 'Family', 'Accessible'].map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Bed Configuration</label>
                          <select
                            value={room.bedConfig}
                            onChange={(e) =>
                              setRoomTypes((prev) =>
                                prev.map((r) => (r.id === room.id ? { ...r, bedConfig: e.target.value } : r))
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          >
                            {['Single', 'Twin', 'Double', 'Queen', 'King', 'Super King'].map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">View Type</label>
                          <select
                            value={room.viewType}
                            onChange={(e) =>
                              setRoomTypes((prev) =>
                                prev.map((r) => (r.id === room.id ? { ...r, viewType: e.target.value } : r))
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          >
                            {['City', 'Ocean', 'Mountain', 'Garden', 'Pool', 'Courtyard'].map((v) => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                        <div>
                          <label className="block font-semibold mb-1">Size (m²)</label>
                          <input
                            type="number"
                            value={room.sizeSqm}
                            onChange={(e) =>
                              setRoomTypes((prev) =>
                                prev.map((r) => (r.id === room.id ? { ...r, sizeSqm: Number(e.target.value) } : r))
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Rooms Available</label>
                          <input
                            type="number"
                            value={room.availableCount}
                            onChange={(e) =>
                              setRoomTypes((prev) =>
                                prev.map((r) => (r.id === room.id ? { ...r, availableCount: Number(e.target.value) } : r))
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Max Adults</label>
                          <input
                            type="number"
                            value={room.maxAdults}
                            onChange={(e) =>
                              setRoomTypes((prev) =>
                                prev.map((r) => (r.id === room.id ? { ...r, maxAdults: Number(e.target.value) } : r))
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Max Children</label>
                          <input
                            type="number"
                            value={room.maxChildren}
                            onChange={(e) =>
                              setRoomTypes((prev) =>
                                prev.map((r) => (r.id === room.id ? { ...r, maxChildren: Number(e.target.value) } : r))
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                          />
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 py-2 cursor-pointer font-semibold">
                            <input
                              type="checkbox"
                              checked={room.hasBalcony}
                              onChange={(e) =>
                                setRoomTypes((prev) =>
                                  prev.map((r) => (r.id === room.id ? { ...r, hasBalcony: e.target.checked } : r))
                                )
                              }
                            />
                            <span>Balcony Included</span>
                          </label>
                        </div>
                      </div>

                      {/* Room Amenities */}
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                        {ROOM_AMENITY_OPTIONS.map((am) => {
                          const has = room.amenities.includes(am);
                          return (
                            <button
                              key={am}
                              type="button"
                              onClick={() =>
                                setRoomTypes((prev) =>
                                  prev.map((r) =>
                                    r.id === room.id
                                      ? {
                                          ...r,
                                          amenities: has
                                            ? r.amenities.filter((x) => x !== am)
                                            : [...r.amenities, am],
                                        }
                                      : r
                                  )
                                )
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                                has
                                  ? 'bg-[#0B1F1A] dark:bg-amber-400 text-white dark:text-slate-950 border-transparent'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {am}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= STAGE 6: ACCESSIBILITY & HOTEL AMENITIES ================= */}
            {stage === 6 && (
              <div className="space-y-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-amber-300">
                    Stage 06 · Amenities &amp; Accessibility
                  </p>
                  <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mt-1">
                    Property Amenities &amp; Accessibility Standards
                  </h2>
                </div>

                {/* Section 18: Accessibility */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Accessibility Features</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ACCESSIBILITY_OPTIONS.map((opt) => {
                      const checked = selectedAccessibility.includes(opt);
                      return (
                        <label
                          key={opt}
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelectedAccessibility((prev) =>
                                prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                              )
                            }
                            className="h-4 w-4 rounded text-emerald-700"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Section 19: Hotel Amenities Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {Object.entries(AMENITY_CATEGORIES).map(([catName, items]) => (
                    <div
                      key={catName}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800/50 p-5 space-y-3"
                    >
                      <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">
                        {catName}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {items.map((item) => {
                          const active = selectedAmenities.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() =>
                                setSelectedAmenities((prev) =>
                                  prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
                                )
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                active
                                  ? 'bg-[#0B1F1A] dark:bg-amber-400 text-white dark:text-slate-950 border-transparent'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= STAGE 7: RATES, SMART PRICING, AVAILABILITY & POLICIES ================= */}
            {stage === 7 && (
              <div className="space-y-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-amber-300">
                    Stage 07 · Rates, Availability &amp; Guest Policies
                  </p>
                  <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mt-1">
                    Rate Plans, Dynamic AI Pricing &amp; November 2026 Calendar
                  </h2>
                </div>

                {/* Base Rate & Currency + 4 Rate Plans */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Currency</label>
                    <select
                      value={baseCurrency}
                      onChange={(e) => setBaseCurrency(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold"
                    >
                      {CURRENCY_CODES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Flexible Rate</label>
                    <input
                      type="number"
                      value={flexibleRate}
                      onChange={(e) => setFlexibleRate(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Non-Refundable</label>
                    <input
                      type="number"
                      value={nonRefundableRate}
                      onChange={(e) => setNonRefundableRate(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Breakfast Included</label>
                    <input
                      type="number"
                      value={breakfastRate}
                      onChange={(e) => setBreakfastRate(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Half Board</label>
                    <input
                      type="number"
                      value={halfBoardRate}
                      onChange={(e) => setHalfBoardRate(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Section 27: AI Smart Pricing */}
                <div className="rounded-xl bg-[#0B1F1A] text-white p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        AI Smart Pricing
                      </p>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Recommended nightly rates based on demand, seasonality, events &amp; local market conditions. You keep final control.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSmartPricingEnabled((v) => !v)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold ${
                        smartPricingEnabled ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-white'
                      }`}
                    >
                      {smartPricingEnabled ? 'Smart Pricing Enabled' : 'Enable Smart Pricing'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    {[
                      { label: 'Low demand', rate: Math.round(flexibleRate * 0.8) },
                      { label: 'Normal demand', rate: flexibleRate },
                      { label: 'High demand', rate: Math.round(flexibleRate * 1.26) },
                      { label: 'Peak demand', rate: Math.round(flexibleRate * 1.53) },
                    ].map((tier) => (
                      <div key={tier.label} className="rounded-lg bg-white/10 p-3">
                        <p className="text-[11px] text-slate-300">{tier.label}</p>
                        <p className="text-base font-bold font-mono tabular-nums text-amber-300 mt-0.5">
                          {baseCurrency} {tier.rate.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 28: Interactive Availability Calendar NOVEMBER 2026 */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Availability Calendar</p>
                      <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">NOVEMBER 2026</h3>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                      {(['Open', 'Close', 'Block'] as const).map((act) => (
                        <button
                          key={act}
                          type="button"
                          onClick={() => setSelectedCalendarAction(act)}
                          className={`px-3 py-1 rounded text-xs font-semibold ${
                            selectedCalendarAction === act
                              ? 'bg-[#0B1F1A] dark:bg-amber-400 text-white dark:text-slate-950'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {act}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                      <div key={d} className="font-bold text-slate-500 py-1">{d}</div>
                    ))}
                    {Array.from({ length: 6 }).map((_, emptyIdx) => (
                      <div key={`empty-${emptyIdx}`} />
                    ))}
                    {Array.from({ length: 30 }).map((_, i) => {
                      const day = i + 1;
                      const isClosed = closedDates.includes(day);
                      const isBlocked = blockedDates.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (selectedCalendarAction === 'Open') {
                              setClosedDates((prev) => prev.filter((d) => d !== day));
                              setBlockedDates((prev) => prev.filter((d) => d !== day));
                            } else if (selectedCalendarAction === 'Close') {
                              setBlockedDates((prev) => prev.filter((d) => d !== day));
                              setClosedDates((prev) => (prev.includes(day) ? prev : [...prev, day]));
                            } else {
                              setClosedDates((prev) => prev.filter((d) => d !== day));
                              setBlockedDates((prev) => (prev.includes(day) ? prev : [...prev, day]));
                            }
                          }}
                          className={`py-2 rounded-lg font-mono font-semibold text-xs border transition-colors ${
                            isBlocked
                              ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-300 text-rose-800 dark:text-rose-200'
                              : isClosed
                              ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 text-amber-900 dark:text-amber-200'
                              : 'bg-emerald-50/70 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 29, 30 & 31: Booking Rules, Cancellation & Guest Policies */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Booking Rules</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Check-in</label>
                        <input
                          type="text"
                          value={checkInTime}
                          onChange={(e) => setCheckInTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Check-out</label>
                        <input
                          type="text"
                          value={checkOutTime}
                          onChange={(e) => setCheckOutTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Minimum stay (nights)</label>
                        <input
                          type="number"
                          value={minStay}
                          onChange={(e) => setMinStay(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Maximum stay (nights)</label>
                        <input
                          type="number"
                          value={maxStay}
                          onChange={(e) => setMaxStay(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Early check-in</label>
                        <select
                          value={earlyCheckIn}
                          onChange={(e) => setEarlyCheckIn(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                          <option value="Available">Available</option>
                          <option value="Unavailable">Unavailable</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Late checkout</label>
                        <select
                          value={lateCheckOut}
                          onChange={(e) => setLateCheckOut(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                          <option value="Available">Available</option>
                          <option value="Unavailable">Unavailable</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cancellation &amp; Guest Policies</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {['Flexible', 'Moderate', 'Strict', 'Non-refundable'].map((pol) => (
                        <button
                          key={pol}
                          type="button"
                          onClick={() => setCancellationPolicy(pol)}
                          className={`py-2 px-3 rounded-lg font-semibold border ${
                            cancellationPolicy === pol
                              ? 'bg-[#0B1F1A] dark:bg-amber-400 text-white dark:text-slate-950 border-transparent'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {pol}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block font-semibold mb-1">Children allowed</label>
                        <select
                          value={childrenAllowed}
                          onChange={(e) => setChildrenAllowed(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Pets allowed</label>
                        <select
                          value={petsAllowed}
                          onChange={(e) => setPetsAllowed(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Smoking</label>
                        <select
                          value={smokingPolicy}
                          onChange={(e) => setSmokingPolicy(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                          <option value="Non-smoking">Non-smoking</option>
                          <option value="Designated areas">Designated areas</option>
                          <option value="Smoking rooms available">Smoking rooms available</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Age requirement (Parties: {partiesAllowed})</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={minGuestAge}
                            onChange={(e) => setMinGuestAge(Number(e.target.value))}
                            className="w-16 px-2 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setPartiesAllowed((p) => (p === 'Allowed' ? 'Not allowed' : 'Allowed'))}
                            className="flex-1 px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold"
                          >
                            Parties: {partiesAllowed}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STAGE 8: PAYMENTS, MULTI-CURRENCY & TAXES ================= */}
            {stage === 8 && (
              <div className="space-y-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-amber-300">
                    Stage 08 · Payment &amp; Financial Setup (Confidential)
                  </p>
                  <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mt-1">
                    Payout Account, Multi-Currency Settlement &amp; Taxes
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Account holder</label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Bank name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Account number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Branch code</label>
                    <input
                      type="text"
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">SWIFT / BIC</label>
                    <input
                      type="text"
                      value={swiftBic}
                      onChange={(e) => setSwiftBic(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Account type</label>
                    <select
                      value={bankAccountType}
                      onChange={(e) => setBankAccountType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    >
                      <option value="Business">Business</option>
                      <option value="Personal">Personal</option>
                    </select>
                  </div>
                </div>

                {/* Section 33: Multi-Currency Payments Breakdown */}
                <div className="rounded-xl bg-[#0B1F1A] text-white p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        Multi-Currency Payout Simulator
                      </p>
                      <p className="text-xs text-slate-300">Guest pays in USD · Hotel settles in ZAR equivalent</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span>Guest pays USD:</span>
                      <input
                        type="number"
                        value={simGuestUsd}
                        onChange={(e) => setSimGuestUsd(Math.max(1, Number(e.target.value)))}
                        className="w-20 px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/15 font-mono font-bold text-amber-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pt-2 border-t border-white/10">
                    <div>
                      <p className="text-xs text-slate-300">Booking value</p>
                      <p className="font-mono font-bold text-white mt-0.5">R{zarGross.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-300">AfriEstate fee</p>
                      <p className="font-mono font-bold text-rose-300 mt-0.5">-R{afriFee.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-300">Payment fee</p>
                      <p className="font-mono font-bold text-rose-300 mt-0.5">-R{payFee.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-300">Hotel payout</p>
                      <p className="font-mono font-bold text-lg text-amber-300 mt-0.5">R{hotelPayout.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Section 34: Tax Configuration */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Does your hotel charge taxes?
                    </h3>
                    <div className="flex gap-2">
                      {(['Yes', 'No'] as const).map((ans) => (
                        <button
                          key={ans}
                          type="button"
                          onClick={() => setChargesTaxes(ans)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold border ${
                            chargesTaxes === ans
                              ? 'bg-[#0B1F1A] dark:bg-amber-400 text-white dark:text-slate-950 border-transparent'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {ans}
                        </button>
                      ))}
                    </div>
                  </div>

                  {chargesTaxes === 'Yes' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold mb-1">VAT (%)</label>
                        <input
                          type="number"
                          value={vatRate}
                          onChange={(e) => setVatRate(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Tourism / City Levy (%)</label>
                        <input
                          type="number"
                          value={tourismLevyPct}
                          onChange={(e) => setTourismLevyPct(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Checkout Display Rule</label>
                        <select
                          value={taxDisplayMode}
                          onChange={(e) => setTaxDisplayMode(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                          <option value="Included in displayed price">Included in displayed price</option>
                          <option value="Added at checkout">Added at checkout</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= STAGE 9: COMPLIANCE, AI SCORE & GUEST PREVIEW ================= */}
            {stage === 9 && (
              <div className="space-y-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-amber-300">
                    Stage 09 · Legal Compliance, Quality Audit &amp; Guest Preview
                  </p>
                  <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mt-1">
                    Final Review &amp; Guest Listing Preview
                  </h2>
                </div>

                {/* Section 38: AI Listing Quality Score */}
                <div className="rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  <div className="md:col-span-4 text-center md:text-left">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Your hotel profile</p>
                    <p className="text-4xl font-bold font-mono tabular-nums text-emerald-700 dark:text-amber-300 mt-1">
                      {qualityScore} / 100
                    </p>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Excellent</p>
                  </div>
                  <div className="md:col-span-8 space-y-2 text-xs">
                    <div className="flex flex-wrap gap-3 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <span>✓ Property information</span>
                      <span>✓ Room information</span>
                      <span>✓ Location</span>
                      <span>✓ Amenities</span>
                      <span>✓ Pricing</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-amber-700 dark:text-amber-300 font-medium">
                        Add 5+ additional room photos or confirm final declarations to reach 100/100.
                      </span>
                      <button
                        type="button"
                        onClick={() => setStage(3)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 font-bold"
                      >
                        Improve Listing
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 39: Live Guest-Facing Preview */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-950">
                  <div className="relative h-56">
                    <img
                      src={galleryImages[0]}
                      alt={hotelName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-4 text-white">
                      <div>
                        <p className="text-xs font-semibold text-amber-300">{starRating} · {hotelType}</p>
                        <h3 className="text-2xl font-bold font-heading">{hotelName}</h3>
                        <p className="text-xs text-slate-200">
                          {hotelCity}, {hotelCountry} · 4.8 ★ (326 reviews)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-300">From</p>
                        <p className="text-2xl font-bold font-mono tabular-nums text-amber-300">
                          {baseCurrency === 'ZAR' ? 'R' : `${baseCurrency} `}
                          {flexibleRate.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-slate-300">per night</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-2">
                      {(['Photos', 'Rooms', 'Amenities', 'Location', 'Reviews'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setPreviewTab(tab)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            previewTab === tab
                              ? 'bg-[#0B1F1A] dark:bg-amber-400 text-white dark:text-slate-950'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewTab('Rooms')}
                        className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold"
                      >
                        View Rooms
                      </button>
                      <button
                        type="button"
                        onClick={() => addToast('Guest booking modal preview verified.', 'info')}
                        className="px-4 py-2 rounded-lg bg-[#0B1F1A] dark:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>

                  <div className="p-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {previewTab === 'Photos' && (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {galleryImages.slice(0, 5).map((img, i) => (
                          <img key={i} src={img} alt="Gallery" referrerPolicy="no-referrer" className="h-20 w-full object-cover rounded-lg" />
                        ))}
                      </div>
                    )}
                    {previewTab === 'Rooms' && (
                      <div className="space-y-2">
                        {roomTypes.map((r) => (
                          <div key={r.id} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span>{r.name} ({r.sizeSqm} m² · {r.bedConfig})</span>
                            <span className="font-mono font-bold">{baseCurrency} {r.baseRate.toLocaleString()}/night</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {previewTab === 'Amenities' && <p>{selectedAmenities.join(' · ')}</p>}
                    {previewTab === 'Location' && <p>{publicAddress} · Confirmed GPS Map Pin</p>}
                    {previewTab === 'Reviews' && <p>4.8 ★ across 326 verified guest stays — &ldquo;Outstanding seafront service and conference amenities.&rdquo;</p>}
                  </div>
                </div>

                {/* Section 35: Required Legal Declarations */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white">Required Legal &amp; Compliance Declarations</h3>
                  {[
                    'I confirm that I am authorized to list this property.',
                    'The information provided is accurate.',
                    "I agree to AfriEstate's Partner Agreement.",
                    "I agree to AfriEstate's Booking & Cancellation Terms.",
                    'I understand AfriEstate may verify this property.',
                  ].map((text, idx) => (
                    <label key={text} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={legalChecks[idx]}
                        onChange={() =>
                          setLegalChecks((prev) => prev.map((v, i) => (i === idx ? !v : v)))
                        }
                        className="h-4 w-4 rounded text-emerald-700"
                      />
                      <span>{text}</span>
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSubmitRegistration}
                  className="w-full py-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold transition-colors"
                >
                  Submit Hotel Registration for Review →
                </button>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: PERSISTENT REGISTRATION SUMMARY (Section 47 & 48) */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-40">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  REGISTRATION SUMMARY
                </h3>
                <span className="font-mono text-sm font-bold text-emerald-700 dark:text-amber-300">
                  {completionPct}% Complete
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-700 dark:bg-amber-400 transition-all duration-300"
                  style={{ width: `${completionPct}%` }}
                />
              </div>

              <div className="space-y-2 text-xs sm:text-sm">
                {checklistItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1">
                    <span className={item.done ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400'}>
                      {item.label}
                    </span>
                    <span className={`font-mono font-bold ${item.done ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                      {item.done ? '✓' : '○'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0B1F1A] text-white rounded-2xl p-6 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Active Property Snapshot
              </p>
              <h4 className="text-lg font-bold font-heading text-white">{hotelName || 'New Hotel Listing'}</h4>
              <p className="text-xs text-slate-300">
                {hotelCity}, {hotelCountry} · {hotelType} · {starRating}
              </p>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
                <div>
                  <p className="text-slate-400">Room Types</p>
                  <p className="font-mono font-bold text-white mt-0.5">{roomTypes.length} active</p>
                </div>
                <div>
                  <p className="text-slate-400">Base Nightly</p>
                  <p className="font-mono font-bold text-amber-300 mt-0.5">
                    {baseCurrency} {flexibleRate.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Persistent Mobile & Desktop Bottom Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrevStage}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back</span>
          </button>

          <span className="hidden sm:inline text-xs font-mono text-slate-500">
            Stage 0{stage} / 09 · {completionPct}% Complete
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                saveDraft(stage);
                addToast('Draft saved locally.', 'success');
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleNextStage}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1F1A] hover:bg-emerald-900 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 text-xs sm:text-sm font-bold"
            >
              <span>{stage === 9 ? 'Submit Registration' : 'Save & Continue'}</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelRegistrationPage;
