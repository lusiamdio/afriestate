import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Ban,
  BarChart3,
  Building2,
  Car,
  Check,
  CheckCircle2,
  Compass,
  DollarSign,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileCheck2,
  Globe2,
  Hotel,
  KeyRound,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Unlock,
  Users,
  X,
} from 'lucide-react';
import {
  Currency,
  Language,
  ListingType,
  PropertyStatus,
  PropertyType,
  type Message,
  type Property,
  type TourRequest,
  type User,
} from '../../types';
import type { StayPropertyProfile } from '../../data/stayDetailData';
import { STAY_CATALOG_PROPERTIES } from '../../data/stayDetailData';
import { COUNTRY_MARKET_GUIDES } from '../../data/africanNeighborhoodDatabase';
import {
  useAdminState,
  type CountryGovernanceConfig,
  type SovereignRoleKey,
} from '../../contexts/AdminStateContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useTranslations } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import {
  SEED_COMPLIANCE_CASES,
  SEED_MODERATION_REPORTS,
  SEED_TICKETS,
  SEED_TRANSACTIONS,
  SEED_USERS,
  type ComplianceCase,
  type EscrowTransaction,
  type ModerationReport,
  type SovereignUser,
  type SupportTicket,
} from './superadmin/SuperAdminData';

interface SuperAdminDashboardProps {
  onClose?: () => void;
  allProperties?: Property[];
  publishedStays?: StayPropertyProfile[];
  tourRequests?: TourRequest[];
  messages?: Message[];
  currentUser?: User | null;
  onUpdateProperty?: (property: Property) => void;
  onDeleteProperty?: (propertyId: string) => void;
  onNavigatePublicPage?: (page: string) => void;
}

type AdminSection =
  | 'overview'
  | 'users'
  | 'listings'
  | 'countries'
  | 'financials'
  | 'directory'
  | 'compliance'
  | 'settings';

type SettingsSubTab = 'general' | 'pricing' | 'features' | 'security' | 'localization';

interface ManagedAccount extends SovereignUser {
  roleKey: SovereignRoleKey;
  country: string;
  canPublish: boolean;
}

interface UnifiedListingRow {
  id: string;
  title: string;
  city: string;
  country: string;
  vertical: 'Residential Sale' | 'Long-Term Rental' | 'Short Stay & Hotel' | 'Transport Fleet' | 'Wellness Retreat' | 'Investment';
  propertyType: PropertyType | string;
  listingType: ListingType | string;
  price: number;
  status: PropertyStatus | string;
  verified: boolean;
  featured: boolean;
  hidden: boolean;
  ownerName: string;
  sourceRef?: Property;
}

const ROLE_FILTER_TABS: { key: 'all' | SovereignRoleKey; label: string }[] = [
  { key: 'all', label: 'All Roles' },
  { key: 'user', label: 'Seekers & Hosts' },
  { key: 'agent', label: 'Agents' },
  { key: 'investor', label: 'Investors' },
  { key: 'hotel_manager', label: 'Hotel Managers' },
  { key: 'transport', label: 'Transport Fleet' },
  { key: 'wellness', label: 'Wellness' },
  { key: 'developer', label: 'Developers' },
  { key: 'agency', label: 'Agencies' },
];

const EXTRA_PARTNER_USERS: Omit<ManagedAccount, 'id'>[] = [
  {
    name: 'Cape Grand Hospitality Group',
    role: 'Agency',
    roleKey: 'hotel_manager',
    agency: 'The African Grand Hotel',
    email: 'reservations@africangrand.co.za',
    phone: '+27 21 438 9920',
    location: 'Camps Bay, Cape Town, South Africa',
    country: 'South Africa',
    status: 'Active',
    riskScore: 6,
    walletBalance: 482000,
    investments: 0,
    listings: 6,
    kycStatus: 'Approved',
    fingerprint: 'htl_cpt_8901',
    lastActive: '4 mins ago',
    geoHistory: ['Cape Town Atlantic Seaboard'],
    isWalletFrozen: false,
    canPublish: true,
    notesHistory: ['Hospitality enterprise partner verified under 5% hotel agreement.'],
  },
  {
    name: 'Kigali Executive Fleet Ltd',
    role: 'Agency',
    roleKey: 'transport',
    agency: 'Kigali Executive Mobility',
    email: 'dispatch@kigalifleet.rw',
    phone: '+250 788 301 440',
    location: 'Nyarutarama, Kigali, Rwanda',
    country: 'Rwanda',
    status: 'Active',
    riskScore: 11,
    walletBalance: 145000,
    investments: 0,
    listings: 8,
    kycStatus: 'Approved',
    fingerprint: 'trn_kgl_4402',
    lastActive: '18 mins ago',
    geoHistory: ['Kigali Airport Desk', 'Nyarutarama Depot'],
    isWalletFrozen: false,
    canPublish: true,
    notesHistory: ['Commercial fleet insurance & driver vetting approved for 2026.'],
  },
  {
    name: 'Dr. Wanjiku Wellness Sanctuary',
    role: 'Agency',
    roleKey: 'wellness',
    agency: 'Rift Valley Longevity Retreat',
    email: 'care@riftvalleywellness.ke',
    phone: '+254 722 814 900',
    location: 'Karen, Nairobi, Kenya',
    country: 'Kenya',
    status: 'Active',
    riskScore: 9,
    walletBalance: 218000,
    investments: 0,
    listings: 4,
    kycStatus: 'Approved',
    fingerprint: 'wln_nbo_7120',
    lastActive: '27 mins ago',
    geoHistory: ['Nairobi Karen Node'],
    isWalletFrozen: false,
    canPublish: true,
    notesHistory: ['Medical & holistic sanctuary accreditation verified.'],
  },
];

function inferCountryFromLocation(locationText?: string, explicitCountry?: string): string {
  if (explicitCountry && explicitCountry.trim()) return explicitCountry.trim();
  const hay = (locationText || '').toLowerCase();
  if (hay.includes('cape town') || hay.includes('johannesburg') || hay.includes('sandton') || hay.includes('pretoria') || hay.includes('durban') || hay.includes('soweto') || hay.includes('south africa') || hay.includes('durbanville') || hay.includes('gqeberha')) {
    return 'South Africa';
  }
  if (hay.includes('lagos') || hay.includes('lekki') || hay.includes('abuja') || hay.includes('ibadan') || hay.includes('nigeria')) {
    return 'Nigeria';
  }
  if (hay.includes('nairobi') || hay.includes('mombasa') || hay.includes('kilimani') || hay.includes('westlands') || hay.includes('kenya')) {
    return 'Kenya';
  }
  if (hay.includes('accra') || hay.includes('kumasi') || hay.includes('osu') || hay.includes('ghana')) {
    return 'Ghana';
  }
  if (hay.includes('kigali') || hay.includes('nyarutarama') || hay.includes('rwanda')) {
    return 'Rwanda';
  }
  if (hay.includes('cairo') || hay.includes('alexandria') || hay.includes('egypt')) {
    return 'Egypt';
  }
  if (hay.includes('casablanca') || hay.includes('marrakech') || hay.includes('rabat') || hay.includes('morocco')) {
    return 'Morocco';
  }
  if (hay.includes('serengeti') || hay.includes('dar es salaam') || hay.includes('zanzibar') || hay.includes('tanzania')) {
    return 'Tanzania';
  }
  if (hay.includes('luanda') || hay.includes('kilamba') || hay.includes('angola')) {
    return 'Angola';
  }
  if (hay.includes('dakar') || hay.includes('senegal')) {
    return 'Senegal';
  }
  if (hay.includes('gaborone') || hay.includes('botswana')) {
    return 'Botswana';
  }
  if (hay.includes('windhoek') || hay.includes('namibia')) {
    return 'Namibia';
  }
  return 'South Africa';
}

function mapRoleLabelToKey(role: SovereignUser['role']): SovereignRoleKey {
  switch (role) {
    case 'Agent':
      return 'agent';
    case 'Investor':
      return 'investor';
    case 'Developer':
      return 'developer';
    case 'Agency':
      return 'agency';
    case 'Normal User':
    default:
      return 'user';
  }
}

function mapKeyToSovereignRoleLabel(roleKey: SovereignRoleKey): SovereignUser['role'] {
  switch (roleKey) {
    case 'agent':
      return 'Agent';
    case 'investor':
      return 'Investor';
    case 'developer':
      return 'Developer';
    case 'hotel_manager':
    case 'transport':
    case 'wellness':
    case 'agency':
      return 'Agency';
    case 'user':
    default:
      return 'Normal User';
  }
}

export default function SuperAdminDashboard({
  onClose,
  allProperties = [],
  publishedStays = [],
  tourRequests = [],
  messages = [],
  currentUser,
  onUpdateProperty,
  onDeleteProperty,
  onNavigatePublicPage,
}: SuperAdminDashboardProps) {
  const {
    settings,
    roleControls,
    countryConfigs,
    userOverrides,
    listingOverrides,
    auditFeed,
    updateSettings,
    resetAllGovernance,
    updateRolePermission,
    updateCountryConfig,
    upsertUserOverride,
    upsertListingOverride,
    recordAuditEvent,
    broadcastAdminAction,
  } = useAdminState();

  const { setCurrency: setAppCurrency } = useCurrency();
  const { setLanguage: setAppLanguage } = useTranslations();
  const { addToast } = useToast();

  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('general');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Local display currency multiplier (1 ZAR baseline)
  const [displayCurrency, setDisplayCurrency] = useState<'ZAR' | 'USD' | 'NGN' | 'KES' | 'GHS'>('ZAR');

  // Users workspace state
  const [customUsers, setCustomUsers] = useState<ManagedAccount[]>([]);
  const [roleFilter, setRoleFilter] = useState<'all' | SovereignRoleKey>('all');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('USR-0941');
  const [newAccountForm, setNewAccountForm] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'South Africa',
    roleKey: 'agent' as SovereignRoleKey,
    agency: '',
  });
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Listings workspace state
  const [listingSearch, setListingSearch] = useState('');
  const [verticalFilter, setVerticalFilter] = useState<string>('All');
  const [listingStatusFilter, setListingStatusFilter] = useState<string>('All');
  const [listingCountryFilter, setListingCountryFilter] = useState<string>('All');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('');

  // Country governance state
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('ZA');

  // Financials & Escrow state
  const [transactions, setTransactions] = useState<EscrowTransaction[]>(SEED_TRANSACTIONS);

  // Compliance & Support state
  const [complianceCases, setComplianceCases] = useState<ComplianceCase[]>(SEED_COMPLIANCE_CASES);
  const [moderationReports, setModerationReports] = useState<ModerationReport[]>(SEED_MODERATION_REPORTS);
  const [tickets, setTickets] = useState<SupportTicket[]>(SEED_TICKETS);
  const [ticketReplyDraft, setTicketReplyDraft] = useState<Record<string, string>>({});

  // Settings draft form (syncs cleanly + persists via updateSettings)
  const [draftSettings, setDraftSettings] = useState(settings);
  React.useEffect(() => {
    setDraftSettings(settings);
  }, [settings]);

  const formatMoney = (amountInZar: number) => {
    const safe = Number(amountInZar) || 0;
    const rateMap: Record<typeof displayCurrency, { rate: number; symbol: string }> = {
      ZAR: { rate: 1, symbol: 'R' },
      USD: { rate: 0.055, symbol: '$' },
      NGN: { rate: 84.5, symbol: '₦' },
      KES: { rate: 7.1, symbol: 'KSh ' },
      GHS: { rate: 0.84, symbol: 'GH₵' },
    };
    const cfg = rateMap[displayCurrency];
    const converted = safe * cfg.rate;
    if (converted >= 1_000_000_000) {
      return `${cfg.symbol}${(converted / 1_000_000_000).toFixed(2)}B`;
    }
    if (converted >= 1_000_000) {
      return `${cfg.symbol}${(converted / 1_000_000).toFixed(2)}M`;
    }
    return `${cfg.symbol}${Math.round(converted).toLocaleString()}`;
  };

  // Unified Managed Accounts list (Seed + Partner Roles + Currently signed-in user if any + Custom added + Admin overrides)
  const managedAccounts = useMemo<ManagedAccount[]>(() => {
    const baseSeed: ManagedAccount[] = SEED_USERS.map((u) => ({
      ...u,
      roleKey: mapRoleLabelToKey(u.role),
      country: inferCountryFromLocation(u.location),
      canPublish: u.status !== 'Suspended',
    }));

    const partnerSeed: ManagedAccount[] = EXTRA_PARTNER_USERS.map((p, idx) => ({
      ...p,
      id: `PRT-${301 + idx}`,
    }));

    const liveUserList: ManagedAccount[] = currentUser
      ? [
          {
            id: currentUser.id || currentUser.username,
            name: currentUser.fullName || currentUser.username,
            role: mapKeyToSovereignRoleLabel(currentUser.role as SovereignRoleKey),
            roleKey: (currentUser.role as SovereignRoleKey) || 'user',
            agency: currentUser.agencyName || currentUser.companyName || '',
            email: currentUser.email || currentUser.username,
            phone: currentUser.phone || 'Not provided',
            location: currentUser.officeAddress || currentUser.country || 'South Africa',
            country: inferCountryFromLocation(currentUser.officeAddress, currentUser.country),
            status: (currentUser.status as SovereignUser['status']) || 'Active',
            riskScore: 5,
            walletBalance: 0,
            investments: 0,
            listings: allProperties.filter((p) => p.agent?.name === currentUser.username).length,
            kycStatus: currentUser.kycStatus === 'Approved' ? 'Approved' : currentUser.isVerified ? 'Approved' : 'Pending',
            fingerprint: 'live_session_user',
            lastActive: 'Online now',
            geoHistory: [currentUser.country || 'Verified Web Session'],
            isWalletFrozen: Boolean(currentUser.isWalletFrozen),
            canPublish: true,
            notesHistory: ['Active signed-in session user'],
          },
        ]
      : [];

    const combined = [...liveUserList, ...customUsers, ...partnerSeed, ...baseSeed];
    const dedupedMap = new Map<string, ManagedAccount>();
    combined.forEach((acc) => {
      const key = (acc.email || acc.id).toLowerCase();
      if (!dedupedMap.has(key)) dedupedMap.set(key, acc);
    });

    return Array.from(dedupedMap.values()).map((acc) => {
      const ov =
        userOverrides[acc.id.toLowerCase()] ||
        (acc.email ? userOverrides[acc.email.toLowerCase()] : undefined);
      if (!ov) return acc;
      const effectiveRoleKey = ov.role || acc.roleKey;
      const rolePolicy = roleControls[effectiveRoleKey];
      return {
        ...acc,
        roleKey: effectiveRoleKey,
        role: mapKeyToSovereignRoleLabel(effectiveRoleKey),
        status: ov.status || acc.status,
        kycStatus: ov.kycStatus || acc.kycStatus,
        isWalletFrozen: ov.isWalletFrozen !== undefined ? ov.isWalletFrozen : acc.isWalletFrozen,
        canPublish:
          ov.canPublish !== undefined
            ? ov.canPublish
            : rolePolicy
              ? rolePolicy.canPublishListings
              : acc.canPublish,
        notesHistory: ov.adminNote ? [ov.adminNote, ...acc.notesHistory] : acc.notesHistory,
      };
    });
  }, [currentUser, customUsers, userOverrides, roleControls, allProperties]);

  const filteredAccounts = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return managedAccounts.filter((acc) => {
      if (roleFilter !== 'all' && acc.roleKey !== roleFilter) return false;
      if (!q) return true;
      return (
        acc.name.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        acc.id.toLowerCase().includes(q) ||
        acc.country.toLowerCase().includes(q) ||
        (acc.agency || '').toLowerCase().includes(q)
      );
    });
  }, [managedAccounts, roleFilter, userSearch]);

  const selectedAccount = useMemo(
    () => managedAccounts.find((a) => a.id === selectedUserId) || filteredAccounts[0] || managedAccounts[0],
    [managedAccounts, filteredAccounts, selectedUserId]
  );

  // Unified Listings combining live properties + published hotels/stays
  const unifiedListings = useMemo<UnifiedListingRow[]>(() => {
    const propRows: UnifiedListingRow[] = allProperties.map((p) => {
      const ov = listingOverrides[p.id];
      let vertical: UnifiedListingRow['vertical'] = 'Residential Sale';
      if (p.propertyType === PropertyType.TRANSPORT) vertical = 'Transport Fleet';
      else if (p.propertyType === PropertyType.WELLNESS) vertical = 'Wellness Retreat';
      else if (p.propertyType === PropertyType.HOTEL || p.propertyType === PropertyType.SHORT_TERM_RENTAL || p.perNightPrice) {
        vertical = 'Short Stay & Hotel';
      } else if (p.listingType === ListingType.FOR_INVESTMENT) {
        vertical = 'Investment';
      } else if (p.listingType === ListingType.RENT) {
        vertical = 'Long-Term Rental';
      }

      const city = p.address?.city || 'Cape Town';
      const country = inferCountryFromLocation(`${city} ${p.address?.street || ''}`, p.country);

      return {
        id: p.id,
        title: p.title,
        city,
        country,
        vertical,
        propertyType: p.propertyType,
        listingType: p.listingType,
        price: ov?.priceOverride !== undefined ? ov.priceOverride : p.price,
        status: ov?.status !== undefined ? ov.status : p.status,
        verified: ov?.verified !== undefined ? ov.verified : p.verified,
        featured: ov?.featured !== undefined ? ov.featured : p.featured,
        hidden: Boolean(ov?.hidden),
        ownerName: p.agent?.name || 'Partner',
        sourceRef: p,
      };
    });

    const stayMap = new Map<string, StayPropertyProfile>();
    [...publishedStays, ...STAY_CATALOG_PROPERTIES].forEach((s) => {
      if (!propRows.some((p) => p.id === s.id) && !stayMap.has(s.id)) {
        stayMap.set(s.id, s);
      }
    });

    const stayRows: UnifiedListingRow[] = Array.from(stayMap.values()).map((s) => {
      const ov = listingOverrides[s.id];
      return {
        id: s.id,
        title: s.name,
        city: s.city,
        country: inferCountryFromLocation(s.city, s.country),
        vertical: s.category === 'Serviced Apartments' ? 'Long-Term Rental' : 'Short Stay & Hotel',
        propertyType: s.propertyType,
        listingType: 'Stay / Hospitality',
        price: ov?.priceOverride !== undefined ? ov.priceOverride : s.monthlyFromZar || s.nightlyFromZar * 20,
        status: ov?.status !== undefined ? ov.status : PropertyStatus.ACTIVE,
        verified: ov?.verified !== undefined ? ov.verified : true,
        featured: ov?.featured !== undefined ? ov.featured : true,
        hidden: Boolean(ov?.hidden),
        ownerName: `${s.propertyType} Partner · ${s.suburb}`,
      };
    });

    return [...propRows, ...stayRows];
  }, [allProperties, publishedStays, listingOverrides]);

  const filteredListings = useMemo(() => {
    const q = listingSearch.trim().toLowerCase();
    return unifiedListings.filter((item) => {
      if (verticalFilter !== 'All' && item.vertical !== verticalFilter) return false;
      if (listingCountryFilter !== 'All' && item.country !== listingCountryFilter) return false;
      if (listingStatusFilter === 'Hidden' && !item.hidden) return false;
      if (listingStatusFilter === 'Featured' && !item.featured) return false;
      if (listingStatusFilter === 'Pending Approval' && item.status !== PropertyStatus.PENDING) return false;
      if (listingStatusFilter === 'Active' && (item.status !== PropertyStatus.ACTIVE || item.hidden)) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.ownerName.toLowerCase().includes(q)
      );
    });
  }, [unifiedListings, listingSearch, verticalFilter, listingCountryFilter, listingStatusFilter]);

  const selectedListing = useMemo(
    () => unifiedListings.find((l) => l.id === selectedListingId) || filteredListings[0] || unifiedListings[0],
    [unifiedListings, filteredListings, selectedListingId]
  );

  // Country-level aggregation & revenue math synced to live commissionRates
  const countryMetrics = useMemo(() => {
    const {
      shortStayPercent,
      longTermPlacementPercent,
      salesBoostZar,
      propertyManagerMonthlyZar,
      hotelCommissionPercent,
    } = settings.commissionRates;

    return countryConfigs.map((cfg) => {
      const countryListings = unifiedListings.filter((l) => l.country.toLowerCase() === cfg.name.toLowerCase() && !l.hidden);
      const countryUsers = managedAccounts.filter((u) => u.country.toLowerCase() === cfg.name.toLowerCase());

      const shortStays = countryListings.filter((l) => l.vertical === 'Short Stay & Hotel');
      const longTerms = countryListings.filter((l) => l.vertical === 'Long-Term Rental');
      const sales = countryListings.filter((l) => l.vertical === 'Residential Sale' || l.vertical === 'Investment');
      const transport = countryListings.filter((l) => l.vertical === 'Transport Fleet');
      const wellness = countryListings.filter((l) => l.vertical === 'Wellness Retreat');

      const grossAssetValue = countryListings.reduce((sum, l) => sum + (l.price || 0), 0);

      // Compute realistic monthly platform commission revenue in ZAR driven directly by current Admin commissionRates
      const stayBookingRev = shortStays.reduce((sum, s) => sum + Math.max(12000, s.price * 0.45) * (shortStayPercent / 100), 0);
      const hotelPartnerRev = shortStays.length * 42000 * (hotelCommissionPercent / 100);
      const rentalPlacementRev = longTerms.reduce((sum, r) => sum + Math.max(8500, r.price) * (longTermPlacementPercent / 100), 0);
      const salesBoostRev = Math.max(sales.filter((s) => s.featured).length, 1) * salesBoostZar;
      const managerSaaSRev = Math.max(longTerms.length + sales.length, 2) * propertyManagerMonthlyZar;
      const serviceRev = (transport.length + wellness.length) * 680;

      const monthlyCommissionZar = Math.round(
        stayBookingRev + hotelPartnerRev + rentalPlacementRev + salesBoostRev + managerSaaSRev + serviceRev
      );
      const estimatedVatZar = Math.round(monthlyCommissionZar * (cfg.vatRatePct / 100));

      return {
        ...cfg,
        listingCount: countryListings.length,
        verifiedCount: countryListings.filter((l) => l.verified).length,
        userCount: countryUsers.length,
        shortStayCount: shortStays.length,
        longTermCount: longTerms.length,
        saleCount: sales.length,
        serviceCount: transport.length + wellness.length,
        grossAssetValue,
        monthlyCommissionZar,
        estimatedVatZar,
      };
    });
  }, [countryConfigs, unifiedListings, managedAccounts, settings.commissionRates]);

  const activeCountryDetail = useMemo(
    () => countryMetrics.find((c) => c.code === selectedCountryCode) || countryMetrics[0],
    [countryMetrics, selectedCountryCode]
  );

  // Executive KPIs computed dynamically
  const executiveStats = useMemo(() => {
    const visibleListings = unifiedListings.filter((l) => !l.hidden);
    const totalValuationZar = visibleListings.reduce((sum, l) => sum + (l.price || 0), 0);
    const totalCommissionRunRate = countryMetrics.reduce((sum, c) => sum + (c.enabled ? c.monthlyCommissionZar : 0), 0);
    const pendingVerifications =
      visibleListings.filter((l) => l.status === PropertyStatus.PENDING || !l.verified).length +
      managedAccounts.filter((u) => u.status === 'Pending Verification' || u.kycStatus === 'Pending').length;
    const enabledCountriesCount = countryConfigs.filter((c) => c.enabled).length;

    const verticalCounts = [
      { label: 'Residential Sales', count: visibleListings.filter((l) => l.vertical === 'Residential Sale').length, color: 'bg-emerald-600' },
      { label: 'Long-Term Rentals', count: visibleListings.filter((l) => l.vertical === 'Long-Term Rental').length, color: 'bg-teal-600' },
      { label: 'Short Stays & Hotels', count: visibleListings.filter((l) => l.vertical === 'Short Stay & Hotel').length, color: 'bg-amber-500' },
      { label: 'Investment Offerings', count: visibleListings.filter((l) => l.vertical === 'Investment').length, color: 'bg-indigo-600' },
      { label: 'Transport Fleet', count: visibleListings.filter((l) => l.vertical === 'Transport Fleet').length, color: 'bg-slate-700' },
      { label: 'Wellness Sanctuaries', count: visibleListings.filter((l) => l.vertical === 'Wellness Retreat').length, color: 'bg-rose-500' },
    ];

    return {
      totalListings: visibleListings.length,
      totalValuationZar,
      totalCommissionRunRate,
      pendingVerifications,
      enabledCountriesCount,
      totalCountries: countryConfigs.length,
      totalAccounts: managedAccounts.length,
      verticalCounts,
    };
  }, [unifiedListings, countryMetrics, managedAccounts, countryConfigs]);

  // --- MUTATION HANDLERS (ALL PERSIST TO AdminStateContext + SYNC LIVE) ---
  const handleUserMutation = (
    account: ManagedAccount,
    action: 'approve_kyc' | 'suspend' | 'reinstate' | 'freeze_wallet' | 'unfreeze_wallet' | 'toggle_publish',
    newRole?: SovereignRoleKey
  ) => {
    if (action === 'approve_kyc') {
      upsertUserOverride(
        { id: account.id, email: account.email, status: 'Active', kycStatus: 'Approved', adminNote: 'KYC approved by Super Admin.' },
        `Approved KYC & verification for ${account.name} (${account.roleKey}).`
      );
      broadcastAdminAction('approve_verification', { id: account.id, email: account.email, name: account.name });
      addToast(`Approved KYC for ${account.name}. Role workspace synced.`, 'success');
    } else if (action === 'suspend') {
      upsertUserOverride(
        { id: account.id, email: account.email, status: 'Suspended', canPublish: false, adminNote: 'Suspended by Super Admin.' },
        `Suspended account access for ${account.name}.`
      );
      broadcastAdminAction('suspend', { id: account.id, email: account.email, name: account.name });
      addToast(`Suspended ${account.name}. Access locked immediately.`, 'info');
    } else if (action === 'reinstate') {
      upsertUserOverride(
        { id: account.id, email: account.email, status: 'Active', canPublish: true, adminNote: 'Reinstated by Super Admin.' },
        `Reinstated active status for ${account.name}.`
      );
      broadcastAdminAction('approve_verification', { id: account.id, email: account.email, name: account.name });
      addToast(`Reinstated ${account.name}.`, 'success');
    } else if (action === 'freeze_wallet') {
      upsertUserOverride(
        { id: account.id, email: account.email, isWalletFrozen: true, adminNote: 'Wallet frozen pending payout audit.' },
        `Froze payouts & wallet for ${account.name}.`
      );
      broadcastAdminAction('freeze_wallet', { id: account.id, email: account.email, name: account.name });
      addToast(`Wallet frozen for ${account.name}.`, 'info');
    } else if (action === 'unfreeze_wallet') {
      upsertUserOverride(
        { id: account.id, email: account.email, isWalletFrozen: false, adminNote: 'Wallet cleared by Super Admin.' },
        `Unfroze wallet for ${account.name}.`
      );
      addToast(`Wallet unlocked for ${account.name}.`, 'success');
    } else if (action === 'toggle_publish') {
      const nextCanPublish = !account.canPublish;
      upsertUserOverride(
        { id: account.id, email: account.email, canPublish: nextCanPublish, adminNote: nextCanPublish ? 'Publishing enabled.' : 'Publishing disabled.' },
        `${nextCanPublish ? 'Enabled' : 'Restricted'} publishing privileges for ${account.name}.`
      );
      addToast(`Publishing ${nextCanPublish ? 'enabled' : 'paused'} for ${account.name}.`, 'success');
    }
    if (newRole) {
      upsertUserOverride(
        { id: account.id, email: account.email, role: newRole, adminNote: `Role reassigned to ${newRole}.` },
        `Reassigned role for ${account.name} to ${newRole}.`
      );
      broadcastAdminAction('role_changed', { id: account.id, email: account.email, name: account.name, role: newRole });
      addToast(`${account.name} role updated to ${roleControls[newRole]?.label || newRole}.`, 'success');
    }
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountForm.name.trim() || !newAccountForm.email.trim()) {
      addToast('Name and email are required to provision an account.', 'error');
      return;
    }
    const id = `USR-${Date.now().toString().slice(-4)}`;
    const created: ManagedAccount = {
      id,
      name: newAccountForm.name.trim(),
      email: newAccountForm.email.trim(),
      phone: newAccountForm.phone.trim() || '+27 10 000 0000',
      location: `${newAccountForm.country}`,
      country: newAccountForm.country,
      role: mapKeyToSovereignRoleLabel(newAccountForm.roleKey),
      roleKey: newAccountForm.roleKey,
      agency: newAccountForm.agency.trim(),
      status: 'Active',
      riskScore: 4,
      walletBalance: 0,
      investments: 0,
      listings: 0,
      kycStatus: 'Approved',
      fingerprint: `prov_${Date.now().toString(36)}`,
      lastActive: 'Provisioned now',
      geoHistory: [newAccountForm.country],
      isWalletFrozen: false,
      canPublish: true,
      notesHistory: ['Provisioned directly by Super Admin.'],
    };
    setCustomUsers((prev) => [created, ...prev]);
    setSelectedUserId(id);
    setIsAddUserOpen(false);
    recordAuditEvent('User Provisioning', `Provisioned ${created.name} (${created.roleKey}) in ${created.country}.`);
    addToast(`Account created for ${created.name}.`, 'success');
    setNewAccountForm({ name: '', email: '', phone: '', country: 'South Africa', roleKey: 'agent', agency: '' });
  };

  const handleListingAction = (
    item: UnifiedListingRow,
    action: 'approve' | 'verify' | 'feature' | 'flag' | 'hide' | 'restore' | 'delete'
  ) => {
    if (action === 'approve') {
      upsertListingOverride(
        { id: item.id, status: PropertyStatus.ACTIVE, verified: true, hidden: false },
        `Approved and published "${item.title}" (${item.country}).`
      );
      if (item.sourceRef && onUpdateProperty) {
        onUpdateProperty({ ...item.sourceRef, status: PropertyStatus.ACTIVE, verified: true });
      }
      broadcastAdminAction('approve_listing_asset', { id: item.id, title: item.title });
      addToast(`Approved "${item.title}" on live marketplace.`, 'success');
    } else if (action === 'verify') {
      const nextVerified = !item.verified;
      upsertListingOverride(
        { id: item.id, verified: nextVerified },
        `${nextVerified ? 'Verified' : 'Removed verification badge from'} "${item.title}".`
      );
      if (item.sourceRef && onUpdateProperty) {
        onUpdateProperty({ ...item.sourceRef, verified: nextVerified });
      }
      addToast(`Verification badge ${nextVerified ? 'granted' : 'revoked'} for "${item.title}".`, 'success');
    } else if (action === 'feature') {
      const nextFeatured = !item.featured;
      upsertListingOverride(
        { id: item.id, featured: nextFeatured },
        `${nextFeatured ? 'Featured' : 'Unfeatured'} "${item.title}" in homepage spotlight.`
      );
      if (item.sourceRef && onUpdateProperty) {
        onUpdateProperty({ ...item.sourceRef, featured: nextFeatured });
      }
      addToast(`Homepage feature ${nextFeatured ? 'enabled' : 'disabled'} for "${item.title}".`, 'success');
    } else if (action === 'flag') {
      upsertListingOverride(
        { id: item.id, status: PropertyStatus.PENDING, verified: false },
        `Flagged "${item.title}" for compliance review.`
      );
      if (item.sourceRef && onUpdateProperty) {
        onUpdateProperty({ ...item.sourceRef, status: PropertyStatus.PENDING, verified: false });
      }
      broadcastAdminAction('send_listing_warning', { id: item.id, title: item.title });
      addToast(`"${item.title}" moved to Pending Review.`, 'info');
    } else if (action === 'hide') {
      upsertListingOverride({ id: item.id, hidden: true }, `Unpublished "${item.title}" from public feeds.`);
      addToast(`"${item.title}" hidden from public pages.`, 'info');
    } else if (action === 'restore') {
      upsertListingOverride({ id: item.id, hidden: false, status: PropertyStatus.ACTIVE }, `Restored "${item.title}" to public feeds.`);
      addToast(`"${item.title}" restored to public feeds.`, 'success');
    } else if (action === 'delete') {
      upsertListingOverride({ id: item.id, hidden: true }, `Removed "${item.title}" permanently.`);
      if (item.sourceRef && onDeleteProperty) {
        onDeleteProperty(item.id);
      }
      addToast(`"${item.title}" removed.`, 'info');
    }
  };

  const handleSaveListingPrice = (item: UnifiedListingRow) => {
    const numeric = Number(editingPriceValue);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      addToast('Enter a valid positive price value.', 'error');
      return;
    }
    upsertListingOverride(
      { id: item.id, priceOverride: numeric },
      `Updated price of "${item.title}" to ${formatMoney(numeric)}.`
    );
    if (item.sourceRef && onUpdateProperty) {
      onUpdateProperty({ ...item.sourceRef, price: numeric });
    }
    setEditingPriceValue('');
    addToast(`Price updated across platform for "${item.title}".`, 'success');
  };

  const handleTransactionAction = (tx: EscrowTransaction, status: EscrowTransaction['status']) => {
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? { ...t, status } : t)));
    recordAuditEvent('Escrow & Settlement', `Updated ${tx.id} (${tx.senderName || 'Account'}) to ${status}.`);
    addToast(`Transaction ${tx.id} marked ${status}.`, 'success');
  };

  const handleExportCountryCsv = () => {
    const escapeCell = (val: unknown) => {
      let str = val === null || val === undefined ? '' : String(val);
      if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
      return `"${str.replace(/"/g, '""')}"`;
    };
    const header = ['Code', 'Country', 'Region', 'Currency', 'Enabled', 'Listings', 'Verified', 'Gross Asset Value (ZAR)', 'Monthly Commission (ZAR)', 'VAT %', 'Est VAT (ZAR)'];
    const rows = countryMetrics.map((c) => [
      escapeCell(c.code),
      escapeCell(c.name),
      escapeCell(c.region),
      escapeCell(c.currency),
      escapeCell(c.enabled ? 'Active' : 'Paused'),
      escapeCell(c.listingCount),
      escapeCell(c.verifiedCount),
      escapeCell(Math.round(c.grossAssetValue)),
      escapeCell(c.monthlyCommissionZar),
      escapeCell(c.vatRatePct),
      escapeCell(c.estimatedVatZar),
    ]);
    const csv = [header.map(escapeCell).join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `afriestate-country-revenue-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    recordAuditEvent('Financial Export', 'Exported Pan-African Country Revenue & VAT CSV.');
    addToast('Country revenue & tax ledger exported.', 'success');
  };

  const handleSaveSettingsSection = (summary: string) => {
    updateSettings(draftSettings, summary);
    if (draftSettings.defaultCurrency !== settings.defaultCurrency) {
      setAppCurrency(draftSettings.defaultCurrency);
    }
    if (draftSettings.defaultLanguage !== settings.defaultLanguage) {
      setAppLanguage(draftSettings.defaultLanguage);
    }
    addToast('Platform settings saved and applied live.', 'success');
  };

  const NAV_ITEMS: { id: AdminSection; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Roles & Users', icon: Users, badge: managedAccounts.length },
    { id: 'listings', label: 'Listings & Verticals', icon: Layers, badge: executiveStats.totalListings },
    { id: 'countries', label: 'Countries & Revenue', icon: Globe2, badge: executiveStats.enabledCountriesCount },
    { id: 'financials', label: 'Financials & Pricing', icon: DollarSign },
    { id: 'directory', label: 'Neighborhoods & Pros', icon: Compass },
    { id: 'compliance', label: 'Compliance & Support', icon: ShieldCheck, badge: executiveStats.pendingVerifications },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  const sectionTitle = NAV_ITEMS.find((n) => n.id === activeSection)?.label || 'Command Centre';

  return (
    <div className="fixed inset-0 z-[100000] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex overflow-hidden font-sans">
      {/* Mobile Sidebar Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Left Fixed Navigation Sidebar (264px) */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 shrink-0 bg-[#0B1F1A] text-white flex flex-col border-r border-emerald-950 transition-transform duration-200 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <p className="font-heading text-base font-bold tracking-tight text-white truncate">
              {settings.siteName} Admin
            </p>
            <p className="text-[11px] text-amber-300 font-medium truncate">
              Platform Command Centre
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:bg-white/10"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-200/50">
            Control Workspaces
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  active
                    ? 'bg-white/15 text-amber-300 font-semibold'
                    : 'text-emerald-100/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-300' : 'text-emerald-300/70'}`} />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.badge === 'number' && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums ${
                      active ? 'bg-amber-400/20 text-amber-200' : 'bg-white/10 text-emerald-100'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Governance Quick Status */}
        <div className="p-4 border-t border-white/10 space-y-3 text-xs">
          <div className="flex items-center justify-between text-emerald-100/80">
            <span>Public Access</span>
            <span className={`font-semibold ${settings.maintenanceMode ? 'text-amber-300' : 'text-emerald-300'}`}>
              {settings.maintenanceMode ? 'Maintenance' : 'Live'}
            </span>
          </div>
          <div className="flex items-center justify-between text-emerald-100/80">
            <span>KYC Publish Gate</span>
            <span className="font-semibold text-white">
              {settings.securityPolicies.requireKycToPublish ? 'Enforced' : 'Flexible'}
            </span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Return to Live Site</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar Contract */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{settings.siteName}</span>
                <span>/</span>
                <span className="font-semibold text-slate-900 dark:text-white truncate">{sectionTitle}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                Real-time synchronization across Marketplace, Role Consoles, Pricing, and Country Rules
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <select
              aria-label="Display currency"
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value as any)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100"
            >
              <option value="ZAR">ZAR (R)</option>
              <option value="USD">USD ($)</option>
              <option value="NGN">NGN (₦)</option>
              <option value="KES">KES (KSh)</option>
              <option value="GHS">GHS (GH₵)</option>
            </select>

            <button
              type="button"
              onClick={() => setActiveSection('settings')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={handleExportCountryCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0B1F1A] hover:bg-emerald-900 text-white text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Export Ledger</span>
            </button>
          </div>
        </header>

        {/* Scrollable Workspace Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ============================================================== */}
          {/* 1. EXECUTIVE OVERVIEW                                          */}
          {/* ============================================================== */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Top KPI Grid (Flat 1px borders, Tabular Numerals) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Live Listings Across Verticals</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5">
                    {executiveStats.totalListings}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    Synced to public &amp; role pages
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tracked Asset Valuation</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5">
                    {formatMoney(executiveStats.totalValuationZar)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Across {executiveStats.enabledCountriesCount} active African markets
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Commission Run-Rate</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1.5">
                    {formatMoney(executiveStats.totalCommissionRunRate)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                    {settings.commissionRates.shortStayPercent}% Stay · {settings.commissionRates.longTermPlacementPercent}% Rent · {settings.commissionRates.hotelCommissionPercent}% Hotel
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Reviews &amp; Queue</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1.5">
                    {executiveStats.pendingVerifications}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {tourRequests.length} active tours · {messages.length} client msgs
                  </p>
                </div>
              </div>

              {/* Vertical Distribution + Live Quick Platform Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                        Marketplace Vertical Distribution
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Live inventory count across every AfriEstate front-page destination
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection('listings')}
                      className="text-xs font-semibold text-emerald-700 dark:text-amber-300 hover:underline"
                    >
                      Manage all listings
                    </button>
                  </div>

                  <div className="space-y-3">
                    {executiveStats.verticalCounts.map((v) => {
                      const pct = executiveStats.totalListings > 0 ? Math.round((v.count / executiveStats.totalListings) * 100) : 0;
                      return (
                        <div key={v.label} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700 dark:text-slate-200">{v.label}</span>
                            <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                              {v.count} listings ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className={`h-full rounded-full ${v.color}`} style={{ width: `${Math.max(4, pct)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                      Instant Platform Switches
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Changes take effect immediately across all visitor &amp; partner pages
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <label className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Public Announcement Banner</p>
                        <p className="text-slate-500 dark:text-slate-400">Display notice ribbon above site header</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.announcementBanner.enabled}
                        onChange={(e) =>
                          updateSettings(
                            {
                              announcementBanner: {
                                ...settings.announcementBanner,
                                enabled: e.target.checked,
                              },
                            },
                            `Turned public announcement banner ${e.target.checked ? 'ON' : 'OFF'}.`
                          )
                        }
                        className="w-4 h-4 accent-emerald-700"
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Require KYC Before Publishing</p>
                        <p className="text-slate-500 dark:text-slate-400">Block unverified accounts from new listings</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.securityPolicies.requireKycToPublish}
                        onChange={(e) =>
                          updateSettings(
                            {
                              securityPolicies: {
                                ...settings.securityPolicies,
                                requireKycToPublish: e.target.checked,
                              },
                            },
                            `Set KYC-before-publish gate to ${e.target.checked ? 'REQUIRED' : 'OPTIONAL'}.`
                          )
                        }
                        className="w-4 h-4 accent-emerald-700"
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Maintenance Mode Lock</p>
                        <p className="text-slate-500 dark:text-slate-400">Show scheduled maintenance page to visitors</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.maintenanceMode}
                        onChange={(e) =>
                          updateSettings(
                            { maintenanceMode: e.target.checked },
                            `Set Maintenance Mode to ${e.target.checked ? 'ENABLED' : 'LIVE'}.`
                          )
                        }
                        className="w-4 h-4 accent-rose-600"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Top Countries Table + Recent Audit Trail */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                      Top Countries by Inventory &amp; Revenue
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveSection('countries')}
                      className="text-xs font-semibold text-emerald-700 dark:text-amber-300 hover:underline"
                    >
                      Open Country Console
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Country</th>
                          <th className="px-4 py-3 text-right">Listings</th>
                          <th className="px-4 py-3 text-right">Monthly Commission</th>
                          <th className="px-4 py-3 text-right">VAT</th>
                          <th className="px-4 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {countryMetrics.slice(0, 6).map((c) => (
                          <tr
                            key={c.code}
                            onClick={() => {
                              setSelectedCountryCode(c.code);
                              setActiveSection('countries');
                            }}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                              <span className="font-mono text-[11px] text-slate-500 mr-2">{c.code}</span>
                              {c.name}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums">{c.listingCount}</td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                              {formatMoney(c.monthlyCommissionZar)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums">{c.vatRatePct}%</td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  c.enabled
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {c.enabled ? 'Active' : 'Paused'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                      Governance Audit Trail
                    </h2>
                    <span className="text-[11px] font-mono tabular-nums text-slate-500">{auditFeed.length} events</span>
                  </div>
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {auditFeed.slice(0, 8).map((entry) => (
                      <div key={entry.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-emerald-700 dark:text-amber-300">{entry.category}</span>
                          <span className="font-mono tabular-nums">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 mt-1">{entry.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. ROLES & USERS MANAGEMENT                                    */}
          {/* ============================================================== */}
          {activeSection === 'users' && (
            <div className="space-y-6">
              {/* Role Filter Bar + Provision Button */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_FILTER_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setRoleFilter(tab.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        roleFilter === tab.key
                          ? 'bg-[#0B1F1A] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Filter name, email, country..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1F1A] text-white text-xs font-semibold hover:bg-emerald-900 whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4 text-amber-300" />
                    <span>Add Account</span>
                  </button>
                </div>
              </div>

              {/* Add Account Inline Form */}
              {isAddUserOpen && (
                <form
                  onSubmit={handleAddAccount}
                  className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
                >
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newAccountForm.name}
                      onChange={(e) => setNewAccountForm({ ...newAccountForm, name: e.target.value })}
                      placeholder="e.g. Nomsa Dlamini"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={newAccountForm.email}
                      onChange={(e) => setNewAccountForm({ ...newAccountForm, email: e.target.value })}
                      placeholder="name@company.com"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Role</label>
                    <select
                      value={newAccountForm.roleKey}
                      onChange={(e) => setNewAccountForm({ ...newAccountForm, roleKey: e.target.value as SovereignRoleKey })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    >
                      {Object.values(roleControls).map((r) => (
                        <option key={r.roleKey} value={r.roleKey}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Country</label>
                    <select
                      value={newAccountForm.country}
                      onChange={(e) => setNewAccountForm({ ...newAccountForm, country: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    >
                      {countryConfigs.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Organization</label>
                    <input
                      type="text"
                      value={newAccountForm.agency}
                      onChange={(e) => setNewAccountForm({ ...newAccountForm, agency: e.target.value })}
                      placeholder="Agency / Hotel"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold">
                      Provision
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddUserOpen(false)}
                      className="py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Role Permission Matrix */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-sm font-bold text-slate-900 dark:text-white">
                      Global Role Access &amp; Publishing Matrix
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Toggling permissions immediately applies to every account in that role across AfriEstate
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">Role Profile</th>
                        <th className="px-4 py-2.5 text-center">Sign-In Enabled</th>
                        <th className="px-4 py-2.5 text-center">Can Publish</th>
                        <th className="px-4 py-2.5 text-center">KYC Required</th>
                        <th className="px-4 py-2.5 text-center">Invest Desk</th>
                        <th className="px-4 py-2.5 text-right">Max Active Listings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {Object.values(roleControls).map((rc) => (
                        <tr key={rc.roleKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">{rc.label}</td>
                          <td className="px-4 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={rc.canLogin}
                              onChange={(e) => updateRolePermission(rc.roleKey, { canLogin: e.target.checked })}
                              className="w-4 h-4 accent-emerald-700"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={rc.canPublishListings}
                              onChange={(e) => updateRolePermission(rc.roleKey, { canPublishListings: e.target.checked })}
                              className="w-4 h-4 accent-emerald-700"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={rc.requiresKycApproval}
                              onChange={(e) => updateRolePermission(rc.roleKey, { requiresKycApproval: e.target.checked })}
                              className="w-4 h-4 accent-emerald-700"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={rc.canAccessInvestmentDesk}
                              onChange={(e) => updateRolePermission(rc.roleKey, { canAccessInvestmentDesk: e.target.checked })}
                              className="w-4 h-4 accent-emerald-700"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <input
                              type="number"
                              min={0}
                              max={2000}
                              value={rc.maxActiveListings}
                              onChange={(e) => updateRolePermission(rc.roleKey, { maxActiveListings: Number(e.target.value) || 0 })}
                              className="w-20 px-2 py-1 text-right rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Accounts Table + Inspector Drawer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Account</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Country</th>
                          <th className="px-4 py-3">KYC</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Wallet / Capital</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredAccounts.map((acc) => {
                          const isSelected = selectedAccount?.id === acc.id;
                          return (
                            <tr
                              key={acc.id}
                              onClick={() => setSelectedUserId(acc.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                              }`}
                            >
                              <td className="px-4 py-3">
                                <p className="font-semibold text-slate-900 dark:text-white">{acc.name}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">{acc.email}</p>
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                                {roleControls[acc.roleKey]?.label || acc.role}
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{acc.country}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                    acc.kycStatus === 'Approved'
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : acc.kycStatus === 'Flagged'
                                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                  }`}
                                >
                                  {acc.kycStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                    acc.status === 'Active'
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : acc.status === 'Suspended'
                                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                  }`}
                                >
                                  {acc.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold">
                                {formatMoney(acc.walletBalance + acc.investments)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Account Control Inspector */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                  {selectedAccount ? (
                    <>
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <p className="text-[11px] font-mono text-slate-500">{selectedAccount.id}</p>
                        <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                          {selectedAccount.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {selectedAccount.agency || selectedAccount.location}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                        <div>
                          <span className="text-slate-500 block">Status</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{selectedAccount.status}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Wallet</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {selectedAccount.isWalletFrozen ? 'Frozen' : 'Active'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Publishing</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {selectedAccount.canPublish ? 'Allowed' : 'Restricted'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Risk Score</span>
                          <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                            {selectedAccount.riskScore}/100
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Reassign Platform Role
                        </label>
                        <select
                          value={selectedAccount.roleKey}
                          onChange={(e) =>
                            handleUserMutation(selectedAccount, 'reinstate', e.target.value as SovereignRoleKey)
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                        >
                          {Object.values(roleControls).map((rc) => (
                            <option key={rc.roleKey} value={rc.roleKey}>
                              {rc.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleUserMutation(selectedAccount, 'approve_kyc')}
                          className="py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                        >
                          Approve KYC
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUserMutation(selectedAccount, 'toggle_publish')}
                          className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                        >
                          {selectedAccount.canPublish ? 'Disable Publish' : 'Enable Publish'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUserMutation(
                              selectedAccount,
                              selectedAccount.isWalletFrozen ? 'unfreeze_wallet' : 'freeze_wallet'
                            )
                          }
                          className="py-2 px-3 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold"
                        >
                          {selectedAccount.isWalletFrozen ? 'Unfreeze Wallet' : 'Freeze Wallet'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUserMutation(
                              selectedAccount,
                              selectedAccount.status === 'Suspended' ? 'reinstate' : 'suspend'
                            )
                          }
                          className={`py-2 px-3 rounded-lg font-semibold ${
                            selectedAccount.status === 'Suspended'
                              ? 'bg-slate-900 text-white hover:bg-slate-800'
                              : 'bg-rose-600 hover:bg-rose-700 text-white'
                          }`}
                        >
                          {selectedAccount.status === 'Suspended' ? 'Reinstate User' : 'Suspend Account'}
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Account Notes</p>
                        {selectedAccount.notesHistory.slice(0, 3).map((note, idx) => (
                          <p key={idx} className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                            {note}
                          </p>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">Select an account to inspect controls.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 3. LISTINGS & VERTICALS MANAGER                                */}
          {/* ============================================================== */}
          {activeSection === 'listings' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <select
                    value={verticalFilter}
                    onChange={(e) => setVerticalFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="All">All Verticals</option>
                    <option value="Residential Sale">Residential Sales</option>
                    <option value="Long-Term Rental">Long-Term Rentals</option>
                    <option value="Short Stay & Hotel">Short Stays &amp; Hotels</option>
                    <option value="Investment">Investment Offerings</option>
                    <option value="Transport Fleet">Transport Fleet</option>
                    <option value="Wellness Retreat">Wellness Retreats</option>
                  </select>

                  <select
                    value={listingCountryFilter}
                    onChange={(e) => setListingCountryFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="All">All Countries</option>
                    {countryConfigs.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={listingStatusFilter}
                    onChange={(e) => setListingStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active Public</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Featured">Featured Spotlight</option>
                    <option value="Hidden">Hidden / Unpublished</option>
                  </select>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                    placeholder="Search title, city, owner..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Property / Listing</th>
                          <th className="px-4 py-3">Vertical</th>
                          <th className="px-4 py-3">Location</th>
                          <th className="px-4 py-3 text-right">Price</th>
                          <th className="px-4 py-3 text-right">State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredListings.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => {
                              setSelectedListingId(item.id);
                              setEditingPriceValue(String(item.price));
                            }}
                            className={`cursor-pointer ${
                              selectedListing?.id === item.id
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">{item.title}</p>
                              <p className="text-[11px] text-slate-500">
                                {item.ownerName} {item.featured ? '· Featured' : ''}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{item.vertical}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                              {item.city}, {item.country}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                              {formatMoney(item.price)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  item.hidden
                                    ? 'bg-slate-100 text-slate-500'
                                    : item.status === PropertyStatus.ACTIVE
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {item.hidden ? 'Hidden' : item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Selected Listing Controls */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                  {selectedListing ? (
                    <>
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <p className="text-[11px] font-mono text-slate-500">
                          {selectedListing.id} · {selectedListing.vertical}
                        </p>
                        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {selectedListing.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {selectedListing.city}, {selectedListing.country} · Listed by {selectedListing.ownerName}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          Override Price (ZAR Baseline)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={editingPriceValue || selectedListing.price}
                            onChange={(e) => setEditingPriceValue(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono tabular-nums"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveListingPrice(selectedListing)}
                            className="px-3 py-2 rounded-lg bg-[#0B1F1A] text-white text-xs font-semibold hover:bg-emerald-900"
                          >
                            Apply
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleListingAction(selectedListing, 'approve')}
                          className="py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                        >
                          Approve Live
                        </button>
                        <button
                          type="button"
                          onClick={() => handleListingAction(selectedListing, 'verify')}
                          className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                        >
                          {selectedListing.verified ? 'Revoke Badge' : 'Verify Deed'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleListingAction(selectedListing, 'feature')}
                          className="py-2 px-3 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold"
                        >
                          {selectedListing.featured ? 'Remove Feature' : 'Feature on Home'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleListingAction(selectedListing, 'flag')}
                          className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 font-semibold"
                        >
                          Hold for Review
                        </button>
                        <button
                          type="button"
                          onClick={() => handleListingAction(selectedListing, selectedListing.hidden ? 'restore' : 'hide')}
                          className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 font-semibold"
                        >
                          {selectedListing.hidden ? 'Restore Public' : 'Unpublish'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleListingAction(selectedListing, 'delete')}
                          className="py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                        >
                          Delete Listing
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">Select a listing to moderate or update pricing.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 4. COUNTRIES & REVENUE COMMAND                                 */}
          {/* ============================================================== */}
          {activeSection === 'countries' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                        Country-Based Performance, Tax &amp; Marketplace Rules
                      </h2>
                      <p className="text-xs text-slate-500">
                        Pausing a country immediately hides its inventory across public search and category pages
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Market</th>
                          <th className="px-4 py-3 text-right">Listings</th>
                          <th className="px-4 py-3 text-right">Roles</th>
                          <th className="px-4 py-3 text-right">Monthly Commission</th>
                          <th className="px-4 py-3 text-right">VAT</th>
                          <th className="px-4 py-3 text-right">Market State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {countryMetrics.map((c) => (
                          <tr
                            key={c.code}
                            onClick={() => setSelectedCountryCode(c.code)}
                            className={`cursor-pointer ${
                              activeCountryDetail?.code === c.code
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                <span className="font-mono text-[11px] text-slate-500 mr-2">{c.code}</span>
                                {c.name}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {c.region} · {c.currency}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums">{c.listingCount}</td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums">{c.userCount}</td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                              {formatMoney(c.monthlyCommissionZar)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums">{c.vatRatePct}%</td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  c.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {c.enabled ? 'Active' : 'Paused'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Selected Country Policy Editor */}
                {activeCountryDetail && (
                  <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-mono text-slate-500">
                          {activeCountryDetail.code} · {activeCountryDetail.region}
                        </p>
                        <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                          {activeCountryDetail.name} Controls
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateCountryConfig(
                            activeCountryDetail.code,
                            { enabled: !activeCountryDetail.enabled },
                            `${activeCountryDetail.enabled ? 'Paused' : 'Enabled'} ${activeCountryDetail.name} market.`
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          activeCountryDetail.enabled
                            ? 'bg-emerald-700 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {activeCountryDetail.enabled ? 'Market Active' : 'Market Paused'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                      <div>
                        <span className="text-slate-500 block">Stays &amp; Hotels</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">{activeCountryDetail.shortStayCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Long-Term Rentals</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">{activeCountryDetail.longTermCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Sales &amp; Invest</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">{activeCountryDetail.saleCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Transport &amp; Wellness</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">{activeCountryDetail.serviceCount}</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Featured Hub Spotlight</label>
                        <input
                          type="checkbox"
                          checked={activeCountryDetail.featuredHub}
                          onChange={(e) =>
                            updateCountryConfig(activeCountryDetail.code, { featuredHub: e.target.checked })
                          }
                          className="w-4 h-4 accent-emerald-700"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">VAT / GST Rate (%)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={activeCountryDetail.vatRatePct}
                          onChange={(e) =>
                            updateCountryConfig(activeCountryDetail.code, { vatRatePct: Number(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Transfer / Stamp Duty (%)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={activeCountryDetail.stampDutyPct}
                          onChange={(e) =>
                            updateCountryConfig(activeCountryDetail.code, { stampDutyPct: Number(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Gross Rental Yield (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={activeCountryDetail.targetRentalYieldPct}
                          onChange={(e) =>
                            updateCountryConfig(activeCountryDetail.code, { targetRentalYieldPct: Number(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Est. Tax Withholding</span>
                      <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {formatMoney(activeCountryDetail.estimatedVatZar)} / mo
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 5. FINANCIALS, COMMISSIONS & ESCROW                            */}
          {/* ============================================================== */}
          {activeSection === 'financials' && (
            <div className="space-y-6">
              {/* Live Fee Schedule Synced with PricingPage */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                      Active Marketplace Commission &amp; Subscription Schedule
                    </h2>
                    <p className="text-xs text-slate-500">
                      Synchronized in real time with the public Pricing page and payout calculator
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection('settings');
                      setSettingsSubTab('pricing');
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0B1F1A] text-white text-xs font-semibold hover:bg-emerald-900"
                  >
                    Edit Rates in Settings
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500">Accommodation Providers</p>
                    <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                      {settings.commissionRates.shortStayPercent}% / stay
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500">Long-Term Rentals</p>
                    <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                      {settings.commissionRates.longTermPlacementPercent}% placement
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500">Property Sales Boost</p>
                    <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                      R{settings.commissionRates.salesBoostZar}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500">Property Managers</p>
                    <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                      R{settings.commissionRates.propertyManagerMonthlyZar}/unit/mo
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500">Hotels &amp; Enterprise</p>
                    <p className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
                      From {settings.commissionRates.hotelCommissionPercent}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Escrow & Payout Ledger */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                    Escrow Settlements &amp; Commission Payouts
                  </h2>
                  <button
                    type="button"
                    onClick={handleExportCountryCsv}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Ref ID</th>
                        <th className="px-4 py-3">Parties</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-right">Status</th>
                        <th className="px-4 py-3 text-right">Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-mono text-slate-500">{tx.id}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900 dark:text-white">{tx.senderName}</p>
                            <p className="text-[11px] text-slate-500">To: {tx.receiverName}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{tx.type}</td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold">
                            {formatMoney(tx.amount)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                tx.status.includes('Completed')
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : tx.status.includes('Frozen')
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                            {tx.status !== 'Completed' && (
                              <button
                                type="button"
                                onClick={() => handleTransactionAction(tx, 'Completed')}
                                className="px-2.5 py-1 rounded bg-emerald-700 text-white text-[11px] font-semibold"
                              >
                                Release
                              </button>
                            )}
                            {tx.status !== 'Frozen Locked' && (
                              <button
                                type="button"
                                onClick={() => handleTransactionAction(tx, 'Frozen Locked')}
                                className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold"
                              >
                                Hold
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 6. NEIGHBORHOODS & SERVICE PROFESSIONALS                       */}
          {/* ============================================================== */}
          {activeSection === 'directory' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                      Neighborhood Explorer Benchmarks (8 Launch Countries)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Synchronized with Neighborhood Explorer cities, launch hubs, and live property density
                    </p>
                  </div>
                  {onNavigatePublicPage && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigatePublicPage('neighborhood-explorer');
                        if (onClose) onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#0B1F1A] text-white text-xs font-semibold"
                    >
                      Open Neighborhood Explorer
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {COUNTRY_MARKET_GUIDES.map((guide) => {
                    const totalAreas = guide.cities.reduce((sum, c) => sum + c.neighborhoods.length, 0);
                    return (
                      <div
                        key={guide.code}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                            {guide.name}
                          </span>
                          <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-amber-300">
                            {guide.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{guide.overview}</p>
                        <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-[11px] font-mono">
                          <span>{guide.cities.length} city tiers</span>
                          <span>{totalAreas} neighborhoods</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 7. COMPLIANCE, MODERATION & SUPPORT                            */}
          {/* ============================================================== */}
          {activeSection === 'compliance' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Compliance & Moderation Queue */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                  <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                    KYC &amp; Compliance Review Cases
                  </h2>
                  {complianceCases.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {c.subjectName || c.userName} · <span className="font-mono text-slate-500">{c.id}</span>
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5">{c.details || c.flagReason}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-semibold">{c.status}</span>
                        {c.status !== 'Approved Secure' && (
                          <button
                            type="button"
                            onClick={() => {
                              setComplianceCases((prev) =>
                                prev.map((x) => (x.id === c.id ? { ...x, status: 'Approved Secure' } : x))
                              );
                              recordAuditEvent('Compliance', `Cleared compliance case ${c.id}.`);
                              addToast(`Case ${c.id} cleared.`, 'success');
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-700 text-white font-semibold"
                          >
                            Clear Case
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                  <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                    Content &amp; Listing Moderation Reports
                  </h2>
                  {moderationReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {rep.contentType} · <span className="font-mono text-slate-500">{rep.id}</span>
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5">{rep.issue || rep.reason}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {rep.status === 'Pending Investigation' || rep.status === 'Unresolved Alert' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setModerationReports((prev) =>
                                prev.map((r) => (r.id === rep.id ? { ...r, status: 'Content Removed' } : r))
                              );
                              recordAuditEvent('Moderation', `Resolved report ${rep.id} and removed flagged content.`);
                              addToast(`Moderation report ${rep.id} resolved.`, 'success');
                            }}
                            className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold"
                          >
                            Resolve &amp; Remove
                          </button>
                        ) : (
                          <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold">{rep.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Support Desk */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  Partner &amp; Seeker Support Tickets
                </h2>
                <div className="space-y-4">
                  {tickets.map((t) => (
                    <div key={t.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-slate-500">{t.id}</span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold">{t.status}</span>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white">{t.subject}</p>
                      <p className="text-slate-600 dark:text-slate-300">{t.message}</p>
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={ticketReplyDraft[t.id] || ''}
                          onChange={(e) => setTicketReplyDraft({ ...ticketReplyDraft, [t.id]: e.target.value })}
                          placeholder="Write resolution response..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setTickets((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: 'Resolved' } : x)));
                            setTicketReplyDraft({ ...ticketReplyDraft, [t.id]: '' });
                            recordAuditEvent('Support', `Resolved ticket ${t.id}.`);
                            addToast(`Ticket ${t.id} resolved and user notified.`, 'success');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#0B1F1A] text-white font-semibold"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 8. FULLY FUNCTIONAL PLATFORM SETTINGS                          */}
          {/* ============================================================== */}
          {activeSection === 'settings' && (
            <div className="space-y-6">
              {/* Settings Sub-Navigation */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex flex-wrap gap-1.5">
                {[
                  { id: 'general' as SettingsSubTab, label: 'General & Public Banner' },
                  { id: 'pricing' as SettingsSubTab, label: 'Commission & Plan Pricing' },
                  { id: 'features' as SettingsSubTab, label: 'Vertical & Feature Switches' },
                  { id: 'security' as SettingsSubTab, label: 'Security & Verification Policies' },
                  { id: 'localization' as SettingsSubTab, label: 'Currency, Language & AI' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSettingsSubTab(tab.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      settingsSubTab === tab.id
                        ? 'bg-[#0B1F1A] text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: General & Public Banner */}
              {settingsSubTab === 'general' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                      Brand Identity, Announcement Banner &amp; Maintenance Control
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Updates propagate immediately to the website Header, Footer, and public landing route
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Platform Name</label>
                      <input
                        type="text"
                        value={draftSettings.siteName}
                        onChange={(e) => setDraftSettings({ ...draftSettings, siteName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Platform Tagline</label>
                      <input
                        type="text"
                        value={draftSettings.tagline}
                        onChange={(e) => setDraftSettings({ ...draftSettings, tagline: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Global Public Announcement Banner</p>
                        <p className="text-slate-500">Displays a pinned notification strip above navigation</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={draftSettings.announcementBanner.enabled}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            announcementBanner: { ...draftSettings.announcementBanner, enabled: e.target.checked },
                          })
                        }
                        className="w-4 h-4 accent-emerald-700"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block font-semibold mb-1">Banner Message</label>
                        <input
                          type="text"
                          value={draftSettings.announcementBanner.text}
                          onChange={(e) =>
                            setDraftSettings({
                              ...draftSettings,
                              announcementBanner: { ...draftSettings.announcementBanner, text: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Target Page Route</label>
                        <select
                          value={draftSettings.announcementBanner.targetPage}
                          onChange={(e) =>
                            setDraftSettings({
                              ...draftSettings,
                              announcementBanner: { ...draftSettings.announcementBanner, targetPage: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        >
                          <option value="pricing">Pricing Plans</option>
                          <option value="book-a-stay">Short-Term Stays</option>
                          <option value="long-term-stays">Long-Term Accommodation</option>
                          <option value="neighborhood-explorer">Neighborhood Explorer</option>
                          <option value="hotel-registration">Hotel Registration</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Maintenance Mode Lock</p>
                        <p className="text-slate-600 dark:text-slate-300">Pauses public marketplace routes with scheduled notice</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={draftSettings.maintenanceMode}
                        onChange={(e) => setDraftSettings({ ...draftSettings, maintenanceMode: e.target.checked })}
                        className="w-4 h-4 accent-rose-600"
                      />
                    </div>
                    <input
                      type="text"
                      value={draftSettings.maintenanceMessage}
                      onChange={(e) => setDraftSettings({ ...draftSettings, maintenanceMessage: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => handleSaveSettingsSection('Saved general brand identity, banner, and maintenance settings.')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B1F1A] hover:bg-emerald-900 text-white text-xs font-semibold"
                    >
                      <Save className="w-4 h-4 text-amber-300" />
                      <span>Save &amp; Publish General Settings</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Commission & Plan Pricing */}
              {settingsSubTab === 'pricing' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                      Marketplace Fee &amp; Partner Pricing Rates
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Directly updates the Pricing page plans, comparison matrix, and live net payout calculator
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold mb-1.5">Accommodation Booking Commission (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={draftSettings.commissionRates.shortStayPercent}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            commissionRates: { ...draftSettings.commissionRates, shortStayPercent: Number(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1.5">Long-Term Tenant Placement Fee (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={draftSettings.commissionRates.longTermPlacementPercent}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            commissionRates: { ...draftSettings.commissionRates, longTermPlacementPercent: Number(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1.5">Property Sales Premium Boost (ZAR)</label>
                      <input
                        type="number"
                        step="10"
                        value={draftSettings.commissionRates.salesBoostZar}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            commissionRates: { ...draftSettings.commissionRates, salesBoostZar: Number(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1.5">Property Manager Fee (ZAR / property / mo)</label>
                      <input
                        type="number"
                        step="10"
                        value={draftSettings.commissionRates.propertyManagerMonthlyZar}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            commissionRates: { ...draftSettings.commissionRates, propertyManagerMonthlyZar: Number(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1.5">Hotels &amp; Enterprise Floor (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={draftSettings.commissionRates.hotelCommissionPercent}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            commissionRates: { ...draftSettings.commissionRates, hotelCommissionPercent: Number(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => handleSaveSettingsSection('Updated global partner commission rates and synced Pricing page.')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B1F1A] hover:bg-emerald-900 text-white text-xs font-semibold"
                    >
                      <Save className="w-4 h-4 text-amber-300" />
                      <span>Apply Commission Schedule</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Feature & Vertical Switches */}
              {settingsSubTab === 'features' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                      Platform Modules &amp; Vertical Availability
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enable or disable public navigation sections and platform capabilities instantaneously
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    {[
                      { key: 'shortStays', label: 'Short-Term Stays & Hotels' },
                      { key: 'longTerm', label: 'Long-Term Accommodation' },
                      { key: 'transport', label: 'Transport & Fleet Rentals' },
                      { key: 'wellness', label: 'Wellness Retreats & Clinics' },
                      { key: 'neighborhoods', label: 'Neighborhood Explorer' },
                      { key: 'professionals', label: 'Find a Professional' },
                      { key: 'hotelRegistration', label: '9-Stage Hotel Registration Flow' },
                      { key: 'aiConcierge', label: 'AI Marketplace Concierge' },
                      { key: 'aiValuation', label: 'AI Valuation & Listing Assistant' },
                    ].map((flag) => {
                      const k = flag.key as keyof typeof draftSettings.featureFlags;
                      return (
                        <label
                          key={flag.key}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer"
                        >
                          <span className="font-semibold text-slate-900 dark:text-white">{flag.label}</span>
                          <input
                            type="checkbox"
                            checked={draftSettings.featureFlags[k]}
                            onChange={(e) =>
                              setDraftSettings({
                                ...draftSettings,
                                featureFlags: { ...draftSettings.featureFlags, [k]: e.target.checked },
                              })
                            }
                            className="w-4 h-4 accent-emerald-700"
                          />
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveSettingsSection('Updated platform module & vertical feature flags.')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B1F1A] hover:bg-emerald-900 text-white text-xs font-semibold"
                    >
                      <Save className="w-4 h-4 text-amber-300" />
                      <span>Save Feature Toggles</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 4: Security Policies */}
              {settingsSubTab === 'security' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                      Publishing Gates, Moderation &amp; Session Security
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Controls KYC enforcement during listing submission, moderation state, and session timeouts
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Require KYC Approval Before Publishing</p>
                        <p className="text-slate-500">Prevents unverified accounts from submitting live listings or services</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={draftSettings.securityPolicies.requireKycToPublish}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            securityPolicies: { ...draftSettings.securityPolicies, requireKycToPublish: e.target.checked },
                          })
                        }
                        className="w-4 h-4 accent-emerald-700"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Hold New Listings in Pending Approval Queue</p>
                        <p className="text-slate-500">Routes newly submitted properties into Super Admin moderation before public release</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={draftSettings.securityPolicies.autoModerateListings}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            securityPolicies: { ...draftSettings.securityPolicies, autoModerateListings: e.target.checked },
                          })
                        }
                        className="w-4 h-4 accent-emerald-700"
                      />
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block font-semibold mb-1.5">Session Inactivity Timeout (Minutes)</label>
                        <input
                          type="number"
                          min={5}
                          max={120}
                          value={draftSettings.securityPolicies.sessionTimeoutMinutes}
                          onChange={(e) =>
                            setDraftSettings({
                              ...draftSettings,
                              securityPolicies: {
                                ...draftSettings.securityPolicies,
                                sessionTimeoutMinutes: Number(e.target.value) || 15,
                              },
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1.5">Form Anti-Spam Cooldown (Seconds)</label>
                        <input
                          type="number"
                          min={5}
                          max={120}
                          value={draftSettings.securityPolicies.autoThrottleCooldownSeconds}
                          onChange={(e) =>
                            setDraftSettings({
                              ...draftSettings,
                              securityPolicies: {
                                ...draftSettings.securityPolicies,
                                autoThrottleCooldownSeconds: Number(e.target.value) || 15,
                              },
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveSettingsSection('Updated global publishing gates, moderation queue, and session security policies.')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B1F1A] hover:bg-emerald-900 text-white text-xs font-semibold"
                    >
                      <Save className="w-4 h-4 text-amber-300" />
                      <span>Enforce Security Policies</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 5: Localization, Currency & AI */}
              {settingsSubTab === 'localization' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                      Localization, Currency Baseline &amp; AI Configuration
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Controls live currency &amp; language defaults across AfriEstate plus Reset Controls
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold mb-1.5">Active Platform Currency</label>
                      <select
                        value={draftSettings.defaultCurrency}
                        onChange={(e) => setDraftSettings({ ...draftSettings, defaultCurrency: e.target.value as Currency })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                      >
                        {Object.values(Currency).map((cur) => (
                          <option key={cur} value={cur}>
                            {cur}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1.5">Active Platform Language</label>
                      <select
                        value={draftSettings.defaultLanguage}
                        onChange={(e) => setDraftSettings({ ...draftSettings, defaultLanguage: e.target.value as Language })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                      >
                        {Object.values(Language).map((lng) => (
                          <option key={lng} value={lng}>
                            {lng.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1.5">AI Routing Model</label>
                      <select
                        value={draftSettings.securityPolicies.aiModel}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            securityPolicies: {
                              ...draftSettings.securityPolicies,
                              aiModel: e.target.value as 'gemini-4-hydrogen' | 'gemini-4-argon',
                            },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                      >
                        <option value="gemini-4-hydrogen">gemini-4-hydrogen (Fast Marketplace)</option>
                        <option value="gemini-4-argon">gemini-4-argon (Deep Valuation)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        resetAllGovernance();
                        addToast('All platform settings, rates, and overrides restored to defaults.', 'info');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset All Governance Defaults</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveSettingsSection('Updated global currency, language, and AI configuration.')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B1F1A] hover:bg-emerald-900 text-white text-xs font-semibold"
                    >
                      <Save className="w-4 h-4 text-amber-300" />
                      <span>Save Localization &amp; AI Settings</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
