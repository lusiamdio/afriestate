import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { ServiceProvider } from '../../types';
import { SERVICE_PROVIDERS } from '../../constants';
import { useToast } from '../../contexts/ToastContext';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShareIcon,
  LinkIcon,
  CheckIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon,
  XMarkIcon,
  BuildingOffice2Icon,
  ScaleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { FacebookIcon, TwitterIcon, WhatsAppIcon } from '../icons/SocialIcons';

interface FindProfessionalPageProps {
  initialServiceFilter?: string;
  initialNeighborhoodFilter?: string;
  onBack: () => void;
  onContactProvider: (name: string) => void;
  onExploreNeighborhood?: (neighborhoodId?: string) => void;
}

interface EnrichedProvider extends ServiceProvider {
  firm: string;
  city: string;
  country: string;
  primaryNeighborhood: string;
  neighborhoodId?: string;
  neighborhoodsServed: string[];
  neighborhoodExpertise: string;
  licenseNumber: string;
  yearsExperience: number;
  responseTime: string;
  languages: string[];
  completedDealsInArea: number;
  feeStructure: string;
  verified: boolean;
}

interface NeighborhoodServiceInsight {
  neighborhood: string;
  neighborhoodId?: string;
  city: string;
  registryOffice: string;
  avgConveyancingDays: number;
  inspectionTurnaround: string;
  localNuance: string;
  keyRegulatoryCheck: string;
}

const NEIGHBORHOOD_INSIGHTS: NeighborhoodServiceInsight[] = [
  {
    neighborhood: 'All Neighborhoods',
    city: 'Pan-African Desk',
    registryOffice: '54 National Deeds Registries',
    avgConveyancingDays: 28,
    inspectionTurnaround: '24 - 48 Hours',
    localNuance: 'Compare vetted legal, inspection, mortgage, utility, and relocation specialists with verified neighborhood track records.',
    keyRegulatoryCheck: 'FICA / KYC anti-fraud clearance & municipal arrears certificate verification',
  },
  {
    neighborhood: 'Durbanville Arts District',
    neighborhoodId: 'Durbanville_arts_district',
    city: 'Cape Town, South Africa',
    registryOffice: 'Cape Town Deeds Office (Western Cape)',
    avgConveyancingDays: 32,
    inspectionTurnaround: '24 Hours',
    localNuance: 'Heritage overlay approvals and sectional title solar inverter compliance are mandatory across boutique conversions.',
    keyRegulatoryCheck: 'COCT Electrical Compliance (COC), Solar CoCT Registration & Heritage Approval',
  },
  {
    neighborhood: 'Suburbia Green Valley',
    neighborhoodId: 'suburbia_green_valley',
    city: 'Rustenburg / Gauteng Corridor, SA',
    registryOffice: 'Pretoria & Johannesburg Deeds Registry',
    avgConveyancingDays: 26,
    inspectionTurnaround: '24 Hours',
    localNuance: 'Homeowners Association (HOA) architectural levies and borehole water quality certificates govern transfers.',
    keyRegulatoryCheck: 'HOA Consent Certificate, Dolomite Soil Stability & Borehole SABS Lab Test',
  },
  {
    neighborhood: 'Stellenbosch Winelands',
    neighborhoodId: 'stellenbosch_winelands',
    city: 'Stellenbosch, South Africa',
    registryOffice: 'Cape Town Deeds Office',
    avgConveyancingDays: 35,
    inspectionTurnaround: '36 Hours',
    localNuance: 'Agricultural sub-division consents and historic wine-estate servitude rights require specialist conveyancers.',
    keyRegulatoryCheck: 'Act 70 of 1970 Subdivision Consent, Water Rights & Conservation Servitudes',
  },
  {
    neighborhood: 'Soweto Cultural Hub',
    neighborhoodId: 'soweto_cultural_hub',
    city: 'Johannesburg, South Africa',
    registryOffice: 'Johannesburg Deeds Registry',
    avgConveyancingDays: 24,
    inspectionTurnaround: '24 Hours',
    localNuance: 'Mixed-use rezoning certificates and Title Deed upgrading verifications unlock high commercial rental yields.',
    keyRegulatoryCheck: 'SPLUMA Municipal Zoning Certificate & Clearance Rates Settlement',
  },
  {
    neighborhood: 'Sandton CBD & Rosebank',
    neighborhoodId: 'sandton_cbd_rosebank',
    city: 'Johannesburg, South Africa',
    registryOffice: 'Johannesburg Deeds Registry',
    avgConveyancingDays: 22,
    inspectionTurnaround: '12 - 24 Hours',
    localNuance: 'High-rise sectional title audits, reserve-fund solvency checks, and foreign-exchange SARB clearances are critical.',
    keyRegulatoryCheck: 'Body Corporate 10-Year Maintenance Reserve Audit & SARB Non-Resident Stamp',
  },
  {
    neighborhood: 'Kilimani & Westlands, Nairobi',
    neighborhoodId: 'kilimani_westlands_nairobi',
    city: 'Nairobi, Kenya',
    registryOffice: 'Nairobi Ardhi House Registry',
    avgConveyancingDays: 29,
    inspectionTurnaround: '24 Hours',
    localNuance: 'Sectional Properties Act 2020 title conversions and NEMA environmental compliance audits safeguard diaspora capital.',
    keyRegulatoryCheck: 'Ardhisasa Digital Title Search, Land Rent Clearance & NCA Occupation Cert',
  },
  {
    neighborhood: 'Ikoyi & Victoria Island, Lagos',
    neighborhoodId: 'victoria_island_ikoyi_lagos',
    city: 'Lagos, Nigeria',
    registryOffice: 'Lagos State Land Registry (Alausa)',
    avgConveyancingDays: 38,
    inspectionTurnaround: '24 - 48 Hours',
    localNuance: 'Confirming Governor’s Consent, charting survey beacons, and piling/structural marine checks prevent encumbrance risk.',
    keyRegulatoryCheck: 'Governor’s Consent Search, Office of the Surveyor General Charting & LASBCA Cert',
  },
];

const ENRICHED_PROVIDERS: EnrichedProvider[] = [
  {
    ...SERVICE_PROVIDERS[5], // The Legal Eagles
    firm: 'Mokoena & Legal Eagles Conveyancing',
    city: 'Cape Town & Johannesburg',
    country: 'South Africa',
    primaryNeighborhood: 'Sandton CBD & Rosebank',
    neighborhoodId: 'sandton_cbd_rosebank',
    neighborhoodsServed: ['Sandton CBD & Rosebank', 'Soweto Cultural Hub', 'Durbanville Arts District'],
    neighborhoodExpertise: 'Specialist in foreign buyer SARB approvals, sectional title body corporate audits, and accelerated Deeds Office lodgements.',
    licenseNumber: 'LPC-ZA-44819',
    yearsExperience: 14,
    responseTime: 'Under 2 hrs',
    languages: ['English', 'isiZulu', 'Afrikaans'],
    completedDealsInArea: 312,
    feeStructure: 'Fixed Conveyancing Tariff',
    verified: true,
  },
  {
    ...SERVICE_PROVIDERS[7], // FinSecure Mortgages
    firm: 'FinSecure Pan-African Mortgage Desk',
    city: 'Cape Town',
    country: 'South Africa',
    primaryNeighborhood: 'Durbanville Arts District',
    neighborhoodId: 'Durbanville_arts_district',
    neighborhoodsServed: ['Durbanville Arts District', 'Stellenbosch Winelands', 'Sandton CBD & Rosebank'],
    neighborhoodExpertise: 'Structures multi-bank bond pre-approvals, diaspora USD-backed mortgages, and boutique guest-house commercial finance.',
    licenseNumber: 'NCR-BF-9921',
    yearsExperience: 11,
    responseTime: 'Under 1 hr',
    languages: ['English', 'Afrikaans', 'French'],
    completedDealsInArea: 428,
    feeStructure: 'Zero Buyer Origination Fee',
    verified: true,
  },
  {
    ...SERVICE_PROVIDERS[4], // Eagle Eye Home Inspectors
    firm: 'Eagle Eye Structural & Grid Inspectors',
    city: 'Stellenbosch & Cape Metro',
    country: 'South Africa',
    primaryNeighborhood: 'Stellenbosch Winelands',
    neighborhoodId: 'stellenbosch_winelands',
    neighborhoodsServed: ['Stellenbosch Winelands', 'Durbanville Arts District', 'Suburbia Green Valley'],
    neighborhoodExpertise: 'Conducts 180-point heritage roof, thermal damp detection, hybrid solar battery load tests, and borehole yield assays.',
    licenseNumber: 'SAHITA-2041',
    yearsExperience: 16,
    responseTime: 'Same Day',
    languages: ['English', 'Afrikaans'],
    completedDealsInArea: 540,
    feeStructure: 'From $240 per Inspection',
    verified: true,
  },
  {
    ...SERVICE_PROVIDERS[9], // ProManage Rentals
    firm: 'ProManage Institutional Asset Care',
    city: 'Nairobi',
    country: 'Kenya',
    primaryNeighborhood: 'Kilimani & Westlands, Nairobi',
    neighborhoodId: 'kilimani_westlands_nairobi',
    neighborhoodsServed: ['Kilimani & Westlands, Nairobi', 'Sandton CBD & Rosebank'],
    neighborhoodExpertise: 'Full-cycle expatriate corporate tenant placement, furnished short-stay yield optimization, and automated escrow distributions.',
    licenseNumber: 'EARB-KE-782',
    yearsExperience: 9,
    responseTime: 'Under 3 hrs',
    languages: ['English', 'Swahili', 'French'],
    completedDealsInArea: 265,
    feeStructure: '7% Collected Rent',
    verified: true,
  },
  {
    ...SERVICE_PROVIDERS[1], // Sparky Electrical
    firm: 'Sparky Solar & Microgrid Engineering',
    city: 'Johannesburg & Rustenburg',
    country: 'South Africa',
    primaryNeighborhood: 'Suburbia Green Valley',
    neighborhoodId: 'suburbia_green_valley',
    neighborhoodsServed: ['Suburbia Green Valley', 'Sandton CBD & Rosebank', 'Soweto Cultural Hub'],
    neighborhoodExpertise: 'Certified SANS 10142 electrical compliance certificates, 10kVA-30kVA Sunsynk/Victron solar installs, and standby ATS generators.',
    licenseNumber: 'ECA-SA-31804',
    yearsExperience: 12,
    responseTime: 'Under 90 min',
    languages: ['English', 'Setswana', 'Afrikaans'],
    completedDealsInArea: 615,
    feeStructure: 'Transparent Itemized Quote',
    verified: true,
  },
  {
    ...SERVICE_PROVIDERS[0], // John's Plumbing
    firm: 'Vanguard Borehole & Plumbing Systems',
    city: 'Johannesburg',
    country: 'South Africa',
    primaryNeighborhood: 'Soweto Cultural Hub',
    neighborhoodId: 'soweto_cultural_hub',
    neighborhoodsServed: ['Soweto Cultural Hub', 'Sandton CBD & Rosebank', 'Suburbia Green Valley'],
    neighborhoodExpertise: 'Municipal pressure-booster backups, reverse osmosis filtration installations, and PIRB plumbing compliance certificates.',
    licenseNumber: 'PIRB-ZA-19402',
    yearsExperience: 15,
    responseTime: 'Under 1 hr',
    languages: ['English', 'Sesotho', 'isiZulu'],
    completedDealsInArea: 480,
    feeStructure: 'Fixed Callout + Warranty',
    verified: true,
  },
  {
    ...SERVICE_PROVIDERS[3], // Swift Movers
    firm: 'Swift Cross-Border White-Glove Movers',
    city: 'Lagos & West Coast',
    country: 'Nigeria',
    primaryNeighborhood: 'Ikoyi & Victoria Island, Lagos',
    neighborhoodId: 'victoria_island_ikoyi_lagos',
    neighborhoodsServed: ['Ikoyi & Victoria Island, Lagos', 'Kilimani & Westlands, Nairobi', 'Sandton CBD & Rosebank'],
    neighborhoodExpertise: 'Customs-cleared diplomatic relocation, fine-art crating, climate-controlled storage, and island estate gate logistics.',
    licenseNumber: 'FIDI-FAIM-619',
    yearsExperience: 13,
    responseTime: 'Under 2 hrs',
    languages: ['English', 'Yoruba', 'French'],
    completedDealsInArea: 390,
    feeStructure: 'Insured Volume Quote',
    verified: true,
  },
  {
    ...SERVICE_PROVIDERS[8], // CoverRight Insurance
    firm: 'CoverRight Title & Asset Underwriters',
    city: 'Lagos & Nairobi',
    country: 'Nigeria',
    primaryNeighborhood: 'Ikoyi & Victoria Island, Lagos',
    neighborhoodId: 'victoria_island_ikoyi_lagos',
    neighborhoodsServed: ['Ikoyi & Victoria Island, Lagos', 'Kilimani & Westlands, Nairobi', 'Stellenbosch Winelands'],
    neighborhoodExpertise: 'All-risk coastal storm, structural defect, title indemnity, and landlord rent-guarantee policies across 14 African jurisdictions.',
    licenseNumber: 'NAICOM-7712',
    yearsExperience: 10,
    responseTime: 'Under 2 hrs',
    languages: ['English', 'French', 'Portuguese'],
    completedDealsInArea: 720,
    feeStructure: 'Annual Competitive Premium',
    verified: true,
  },
  {
    ...SERVICE_PROVIDERS[2], // Green Leaf Landscaping
    firm: 'Green Leaf Indigenous Estates & Pools',
    city: 'Stellenbosch & Durbanville',
    country: 'South Africa',
    primaryNeighborhood: 'Durbanville Arts District',
    neighborhoodId: 'Durbanville_arts_district',
    neighborhoodsServed: ['Durbanville Arts District', 'Stellenbosch Winelands'],
    neighborhoodExpertise: 'Drought-tolerant fynbos landscape architecture, greywater borehole irrigation design, and rim-flow pool engineering.',
    licenseNumber: 'SALI-WC-518',
    yearsExperience: 9,
    responseTime: 'Same Day',
    languages: ['English', 'Afrikaans'],
    completedDealsInArea: 194,
    feeStructure: 'Per Project / Monthly Care',
    verified: true,
  },
  {
    ...SERVICE_PROVIDERS[6], // Prestige Painters
    firm: 'Prestige Coastal Restoration & Finishes',
    city: 'Cape Town',
    country: 'South Africa',
    primaryNeighborhood: 'Durbanville Arts District',
    neighborhoodId: 'Durbanville_arts_district',
    neighborhoodsServed: ['Durbanville Arts District', 'Stellenbosch Winelands', 'Suburbia Green Valley'],
    neighborhoodExpertise: 'Marine-grade elastomeric waterproofing, lime-wash heritage facade restoration, and pre-sale staging refresh.',
    licenseNumber: 'MBSA-WC-884',
    yearsExperience: 11,
    responseTime: 'Under 4 hrs',
    languages: ['English', 'Afrikaans'],
    completedDealsInArea: 276,
    feeStructure: 'Sqm Transparent Estimate',
    verified: true,
  },
];

const ShareProviderMenu: React.FC<{ provider: EnrichedProvider }> = ({ provider }) => {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.href.split('?')[0]}?pro=${provider.id}`;
  const text = `Connect with ${provider.firm} (${provider.service}) in ${provider.primaryNeighborhood} on AfriEstate.`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-2xl py-2 z-40"
    >
      <a
        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
      >
        <WhatsAppIcon className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>WhatsApp</span>
      </a>
      <a
        href={`mailto:?subject=${encodeURIComponent(`${provider.firm} - ${provider.service}`)}&body=${encodeURIComponent(`${text}\nPhone: ${provider.phone}\nEmail: ${provider.email}\n${url}`)}`}
        className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
      >
        <EnvelopeIcon className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Email Contact</span>
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
      >
        <TwitterIcon className="w-4 h-4 text-slate-800 dark:text-white shrink-0" />
        <span>Share on X</span>
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
      >
        <FacebookIcon className="w-4 h-4 text-blue-600 shrink-0" />
        <span>Facebook</span>
      </a>
      <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
      <button
        type="button"
        onClick={handleCopy}
        className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
      >
        {copied ? (
          <>
            <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Link Copied</span>
          </>
        ) : (
          <>
            <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Copy Profile Link</span>
          </>
        )}
      </button>
    </div>
  );
};

const FindProfessionalPage: React.FC<FindProfessionalPageProps> = ({
  initialServiceFilter,
  initialNeighborhoodFilter,
  onBack,
  onContactProvider,
  onExploreNeighborhood,
}) => {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState(initialServiceFilter || 'All');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(
    initialNeighborhoodFilter || 'All Neighborhoods'
  );
  const [minRating, setMinRating] = useState<number>(0);
  const [openShareId, setOpenShareId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<EnrichedProvider | null>(null);
  const [consultNote, setConsultNote] = useState('');
  const [consultEmail, setConsultEmail] = useState('');

  const shareContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedService(initialServiceFilter || 'All');
  }, [initialServiceFilter]);

  useEffect(() => {
    if (initialNeighborhoodFilter) {
      setSelectedNeighborhood(initialNeighborhoodFilter);
    }
  }, [initialNeighborhoodFilter]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (shareContainerRef.current && !shareContainerRef.current.contains(e.target as Node)) {
        setOpenShareId(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const allServices = useMemo(
    () => ['All', ...Array.from(new Set(ENRICHED_PROVIDERS.map((p) => p.service)))],
    []
  );

  const neighborhoodOptions = useMemo(
    () => NEIGHBORHOOD_INSIGHTS.map((n) => n.neighborhood),
    []
  );

  const activeNeighborhoodInsight = useMemo(() => {
    return (
      NEIGHBORHOOD_INSIGHTS.find((n) => n.neighborhood === selectedNeighborhood) ||
      NEIGHBORHOOD_INSIGHTS[0]
    );
  }, [selectedNeighborhood]);

  const filteredProviders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return ENRICHED_PROVIDERS.filter((provider) => {
      const matchesService = selectedService === 'All' || provider.service === selectedService;
      const matchesNeighborhood =
        selectedNeighborhood === 'All Neighborhoods' ||
        provider.neighborhoodsServed.includes(selectedNeighborhood) ||
        provider.primaryNeighborhood === selectedNeighborhood;
      const matchesRating = provider.rating >= minRating;
      const matchesSearch =
        !q ||
        provider.name.toLowerCase().includes(q) ||
        provider.firm.toLowerCase().includes(q) ||
        provider.service.toLowerCase().includes(q) ||
        provider.city.toLowerCase().includes(q) ||
        provider.neighborhoodsServed.some((n) => n.toLowerCase().includes(q)) ||
        provider.neighborhoodExpertise.toLowerCase().includes(q);
      return matchesService && matchesNeighborhood && matchesRating && matchesSearch;
    });
  }, [searchTerm, selectedService, selectedNeighborhood, minRating]);

  const handleBookConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    addToast(
      `Consultation brief dispatched to ${selectedProvider.firm} (${selectedProvider.primaryNeighborhood}). Expect a reply within ${selectedProvider.responseTime}.`,
      'success'
    );
    setConsultNote('');
    setConsultEmail('');
    setSelectedProvider(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-white pb-20">
      {/* Sticky Top Control Bar */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors shrink-0"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back to Marketplace</span>
            </button>
            <nav className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span>Advisory Directory</span>
              <span>/</span>
              <span>Find a Professional</span>
              <span>/</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {selectedNeighborhood}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
              <ShieldCheckIcon className="w-4 h-4" />
              100% Credential & License Audited
            </span>
            {onExploreNeighborhood && (
              <button
                type="button"
                onClick={() => onExploreNeighborhood(activeNeighborhoodInsight.neighborhoodId)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B1F1A] hover:bg-emerald-950 text-amber-300 font-semibold transition-colors"
              >
                <MapPinIcon className="w-4 h-4" />
                <span>Open Neighborhood Explorer</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Header Banner */}
      <section className="w-full bg-[#0B1F1A] text-white">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-300">
                <BriefcaseIcon className="w-4 h-4" />
                <span>Accredited Pan-African Specialist Network</span>
              </div>
              <h1
                className="text-3xl sm:text-5xl lg:text-6xl font-bold font-heading tracking-tight text-white"
                style={{ textWrap: 'balance' }}
              >
                Find a Verified Professional
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Engage conveyancing attorneys, structural & solar inspectors, mortgage desks, property managers, and relocation specialists who hold active neighborhood track records across South Africa, Kenya, Nigeria, and beyond.
              </p>
            </div>

            <div className="lg:col-span-5 grid grid-cols-3 gap-4 bg-white/5 rounded-2xl p-5">
              <div>
                <p className="text-2xl font-bold font-mono tabular-nums text-amber-300">
                  {ENRICHED_PROVIDERS.length}
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">Featured Specialists</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono tabular-nums text-white">
                  {activeNeighborhoodInsight.avgConveyancingDays}d
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">Avg Transfer Turnaround</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono tabular-nums text-emerald-300">
                  4.85
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">Mean Client Rating</p>
              </div>
            </div>
          </div>

          {/* Search & District Filter Bar */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search specialist, firm, license, or neighborhood..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="md:col-span-4">
              <select
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
                aria-label="Filter by neighborhood"
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {neighborhoodOptions.map((nb) => (
                  <option key={nb} value={nb} className="bg-slate-900 text-white">
                    {nb === 'All Neighborhoods' ? 'Neighborhood Coverage: All Districts' : nb}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                aria-label="Minimum rating"
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value={0} className="bg-slate-900 text-white">All Client Ratings</option>
                <option value={4.8} className="bg-slate-900 text-white">4.8+ Top Rated</option>
                <option value={4.9} className="bg-slate-900 text-white">4.9+ Premier Tier</option>
              </select>
            </div>
          </div>

          {/* Service Category Filter Row */}
          <div className="mt-4 flex flex-wrap gap-2">
            {allServices.map((service) => (
              <button
                key={service}
                type="button"
                onClick={() => setSelectedService(service)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedService === service
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-white/10 text-slate-200 hover:bg-white/15'
                }`}
              >
                {service}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-6 lg:px-10 pt-10 space-y-10" ref={shareContainerRef}>
        {/* Selected Neighborhood Service & Regulatory Brief */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-amber-300">
                <BuildingOffice2Icon className="w-4 h-4" />
                <span>Neighborhood Service Intelligence · {activeNeighborhoodInsight.city}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white">
                {activeNeighborhoodInsight.neighborhood} Compliance & Advisory Brief
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeNeighborhoodInsight.localNuance}
              </p>
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Governing Deeds Registry
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {activeNeighborhoodInsight.registryOffice}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Inspection Turnaround
                </span>
                <span className="text-xs font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 block">
                  {activeNeighborhoodInsight.inspectionTurnaround}
                </span>
              </div>
              <div className="sm:col-span-2 p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 flex items-start gap-2.5">
                <ScaleIcon className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 block">
                    Priority Local Compliance Check
                  </span>
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    {activeNeighborhoodInsight.keyRegulatoryCheck}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Results Count */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white">
              Verified Professionals ({filteredProviders.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Direct Email, Call, WhatsApp, Share, and Live Consultation enabled for every vetted firm.
            </p>
          </div>
          {(selectedService !== 'All' || selectedNeighborhood !== 'All Neighborhoods' || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setSelectedService('All');
                setSelectedNeighborhood('All Neighborhoods');
                setSearchTerm('');
                setMinRating(0);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
            >
              Reset All Filters
            </button>
          )}
        </div>

        {/* Provider Grid */}
        {filteredProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => {
              const whatsappNumber = provider.phone.replace(/\D/g, '');
              return (
                <article
                  key={provider.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-4">
                    {/* Header Identity */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-2xl bg-[#0B1F1A] text-amber-300 font-bold text-lg flex items-center justify-center shrink-0">
                          {provider.firm
                            .split(' ')
                            .slice(0, 2)
                            .map((w) => w.charAt(0))
                            .join('')}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                              {provider.firm}
                            </h4>
                            {provider.verified && (
                              <CheckBadgeIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs font-semibold text-emerald-700 dark:text-amber-300">
                            {provider.service} · Lead: {provider.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                            <StarIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {provider.rating.toFixed(1)}
                            </span>
                            <span>({provider.reviewCount} reviews)</span>
                            <span>·</span>
                            <span className="font-mono text-[11px]">{provider.licenseNumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Neighborhood Coverage Strip */}
                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPinIcon className="w-3.5 h-3.5 text-emerald-700 dark:text-amber-300" />
                          Neighborhood Specialization
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                          {provider.completedDealsInArea} local briefs
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {provider.neighborhoodExpertise}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {provider.neighborhoodsServed.map((nb) => (
                          <button
                            key={nb}
                            type="button"
                            onClick={() => setSelectedNeighborhood(nb)}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                              selectedNeighborhood === nb
                                ? 'bg-emerald-900 text-white dark:bg-amber-400 dark:text-slate-950'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {nb}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Operational Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                        <span className="text-[10px] text-slate-500 block">Experience</span>
                        <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                          {provider.yearsExperience} yrs
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                        <span className="text-[10px] text-slate-500 block">Response</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate block">
                          {provider.responseTime}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                        <span className="text-[10px] text-slate-500 block">Fee Model</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate block">
                          {provider.feeStructure}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Languages: {provider.languages.join(' · ')}
                    </p>
                  </div>

                  {/* Direct Contact & Share Toolbar + Primary CTA */}
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-4 gap-2">
                      <a
                        href={`mailto:${provider.email}`}
                        title={`Email ${provider.email}`}
                        className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
                      >
                        <EnvelopeIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Email</span>
                      </a>
                      <a
                        href={`tel:${provider.phone}`}
                        title={`Call ${provider.phone}`}
                        className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
                      >
                        <PhoneIcon className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <span>Call</span>
                      </a>
                      <a
                        href={`https://wa.me/${whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Chat on WhatsApp"
                        className="py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
                      >
                        <WhatsAppIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>WhatsApp</span>
                      </a>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenShareId(openShareId === provider.id ? null : provider.id);
                          }}
                          title="Share specialist profile"
                          className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
                        >
                          <ShareIcon className="w-4 h-4 shrink-0" />
                          <span>Share</span>
                        </button>
                        {openShareId === provider.id && <ShareProviderMenu provider={provider} />}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onContactProvider(provider.firm)}
                        className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        <span>Live Desk</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedProvider(provider)}
                        className="py-2.5 px-3 rounded-xl bg-[#0B1F1A] hover:bg-emerald-950 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>Book Consultation</span>
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-16 text-center space-y-3 shadow-sm">
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              No specialists matched those exact filters
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Try widening your neighborhood selection or clearing the service filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedService('All');
                setSelectedNeighborhood('All Neighborhoods');
                setSearchTerm('');
              }}
              className="px-5 py-2.5 rounded-xl bg-[#0B1F1A] text-white text-xs font-semibold"
            >
              Show All Verified Professionals
            </button>
          </div>
        )}
      </div>

      {/* Consultation Booking Modal Drawer */}
      {selectedProvider && (
        <div
          className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedProvider(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-amber-300">
                  Direct Consultation Brief
                </p>
                <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mt-1">
                  {selectedProvider.firm}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedProvider.service} · Primary District: {selectedProvider.primaryNeighborhood}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <ClockIcon className="w-4 h-4 text-emerald-700 dark:text-amber-300" />
                Typical Response: <strong>{selectedProvider.responseTime}</strong>
              </span>
              <span className="font-mono text-slate-600 dark:text-slate-300">
                License: {selectedProvider.licenseNumber}
              </span>
            </div>

            <form onSubmit={handleBookConsultation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Your Email Address
                </label>
                <input
                  type="email"
                  required
                  value={consultEmail}
                  onChange={(e) => setConsultEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Property / Neighborhood Scope
                </label>
                <textarea
                  required
                  rows={4}
                  value={consultNote}
                  onChange={(e) => setConsultNote(e.target.value)}
                  placeholder={`Describe your transaction, inspection, or advisory timeline in ${selectedProvider.primaryNeighborhood}...`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700 resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedProvider(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0B1F1A] hover:bg-emerald-950 text-white text-xs font-semibold"
                >
                  Send Consultation Brief
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindProfessionalPage;
