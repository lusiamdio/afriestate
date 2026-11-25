import React, { useState } from 'react';
import {
  Maximize2,
  Minimize2,
  RotateCw,
  MapPin,
  Plane,
  FileSignature,
  FileCheck2,
  Calculator,
  Compass,
  Scale,
  Zap,
  ShieldCheck,
  Droplets,
  Users,
  TrendingUp,
  ArrowLeftRight,
  Hammer,
  KeyRound,
  ShieldAlert,
  Fingerprint,
  MailCheck,
  CreditCard,
  Landmark,
  BadgeCheck,
  Phone,
  Receipt,
  Link2,
  Car,
  TrendingDown,
  Fuel,
  Hash,
  Cookie,
  X,
} from 'lucide-react';

export type EmbeddedWidgetId =
  | 'map-distance'
  | 'flight-time'
  | 'signature'
  | 'sign-pdf'
  | 'mortgage'
  | 'property-decider'
  | 'rent-vs-buy'
  | 'energy-cost'
  | 'home-insurance'
  | 'water-usage'
  | 'rent-splitter'
  | 'cash-flow'
  | 'property-comparison'
  | 'renovation-roi'
  | 'password-strength'
  | 'breach-checker'
  | 'hash-compare'
  | 'validate-email'
  | 'cc-type'
  | 'validate-iban'
  | 'validate-cc'
  | 'validate-phone'
  | 'validate-vat'
  | 'validate-url'
  | 'car-comparison'
  | 'car-depreciation'
  | 'fuel-cost'
  | 'license-plate'
  | 'cookie-consent';

export interface EmbeddedWidgetSpec {
  id: EmbeddedWidgetId;
  shortLabel: string;
  title: string;
  src: string;
  height: 420 | 520 | 560 | 600 | 620 | 640 | 660 | 680 | 700 | 720 | 760;
  description: string;
  category:
    | 'Mobility & Location'
    | 'Transport & Fleet'
    | 'Signatures & Integrity'
    | 'Buying & Financial'
    | 'Utilities & Ownership'
    | 'Account & Data Security'
    | 'Payments & Banking'
    | 'Contact & Partner Validation'
    | 'Privacy & Cookie Compliance';
}

export const EMBEDDED_WIDGETS: Record<EmbeddedWidgetId, EmbeddedWidgetSpec> = {
  'map-distance': {
    id: 'map-distance',
    shortLabel: 'Distance Map',
    title: 'Distance Calculator (Map)',
    src: 'https://map-distance.utils.com?embed=1',
    height: 660,
    description: 'Measure point-to-point distance, commute corridors, and pickup routes across cities.',
    category: 'Mobility & Location',
  },
  'flight-time': {
    id: 'flight-time',
    shortLabel: 'Flight Time',
    title: 'Flight Time Calculator',
    src: 'https://flight-time.utils.com?embed=1',
    height: 560,
    description: 'Estimate direct and connecting flight durations between African and global hubs.',
    category: 'Mobility & Location',
  },
  signature: {
    id: 'signature',
    shortLabel: 'Signature Verifier',
    title: 'Digital Signature Verifier',
    src: 'https://signature.utils.com?embed=1',
    height: 640,
    description: 'Validate cryptographic signatures on mandates, title deeds, and transfer agreements.',
    category: 'Signatures & Integrity',
  },
  'sign-pdf': {
    id: 'sign-pdf',
    shortLabel: 'Sign PDF',
    title: 'Sign PDF',
    src: 'https://sign-pdf.utils.com?embed=1',
    height: 680,
    description: 'Execute leases, offers to purchase, and agency mandates directly inside PDFs.',
    category: 'Signatures & Integrity',
  },
  mortgage: {
    id: 'mortgage',
    shortLabel: 'Mortgage',
    title: 'Mortgage Calculator',
    src: 'https://mortgage.utils.com?embed=1',
    height: 700,
    description: 'Model principal, interest rates, deposit ratios, and monthly bond schedules.',
    category: 'Buying & Financial',
  },
  'property-decider': {
    id: 'property-decider',
    shortLabel: 'Property Decider',
    title: 'Property Decider',
    src: 'https://property-decider.utils.com?embed=1',
    height: 640,
    description: 'Score shortlisted properties systematically against budget, yield, and lifestyle criteria.',
    category: 'Buying & Financial',
  },
  'rent-vs-buy': {
    id: 'rent-vs-buy',
    shortLabel: 'Rent vs Buy',
    title: 'Rent vs Buy Calculator',
    src: 'https://rent-vs-buy.utils.com?embed=1',
    height: 760,
    description: 'Compare long-term equity buildup against renting across holding horizons.',
    category: 'Buying & Financial',
  },
  'energy-cost': {
    id: 'energy-cost',
    shortLabel: 'Energy Cost',
    title: 'Energy Cost Estimator',
    src: 'https://energy-cost.utils.com?embed=1',
    height: 620,
    description: 'Project monthly grid electricity, solar offset, and backup power operating expenditure.',
    category: 'Utilities & Ownership',
  },
  'home-insurance': {
    id: 'home-insurance',
    shortLabel: 'Home Insurance',
    title: 'Home Insurance Estimator',
    src: 'https://home-insurance.utils.com?embed=1',
    height: 620,
    description: 'Estimate building structure, contents, and landlord protection coverage premiums.',
    category: 'Utilities & Ownership',
  },
  'water-usage': {
    id: 'water-usage',
    shortLabel: 'Water Usage',
    title: 'Water Usage Calculator',
    src: 'https://water-usage.utils.com?embed=1',
    height: 620,
    description: 'Forecast household or multi-unit water consumption and municipal utility spend.',
    category: 'Utilities & Ownership',
  },
  'rent-splitter': {
    id: 'rent-splitter',
    shortLabel: 'Rent Splitter',
    title: 'Rent Splitter',
    src: 'https://rent-splitter.utils.com?embed=1',
    height: 620,
    description: 'Allocate shared lease rent and utility contributions fairly by room or square metre.',
    category: 'Utilities & Ownership',
  },
  'cash-flow': {
    id: 'cash-flow',
    shortLabel: 'Cash Flow',
    title: 'Cash Flow Analyzer',
    src: 'https://cash-flow.utils.com?embed=1',
    height: 720,
    description: 'Underwrite net operating income, debt service coverage, vacancy, and cap rate yield.',
    category: 'Buying & Financial',
  },
  'property-comparison': {
    id: 'property-comparison',
    shortLabel: 'Compare Properties',
    title: 'Property Comparison',
    src: 'https://property-comparison.utils.com?embed=1',
    height: 640,
    description: 'Benchmark side-by-side purchase metrics, closing costs, and expected returns.',
    category: 'Buying & Financial',
  },
  'renovation-roi': {
    id: 'renovation-roi',
    shortLabel: 'Renovation ROI',
    title: 'Renovation ROI Calculator',
    src: 'https://renovation-roi.utils.com?embed=1',
    height: 620,
    description: 'Evaluate value-add CapEx upgrades against post-renovation valuation uplift and rent growth.',
    category: 'Buying & Financial',
  },
  'password-strength': {
    id: 'password-strength',
    shortLabel: 'Password Strength',
    title: 'Password Strength Checker',
    src: 'https://password-strength.utils.com?embed=1',
    height: 560,
    description: 'Audit credential entropy and crack-resistance before securing client or portfolio accounts.',
    category: 'Account & Data Security',
  },
  'breach-checker': {
    id: 'breach-checker',
    shortLabel: 'Breach Checker',
    title: 'Data Breach Checker',
    src: 'https://breach-checker.utils.com?embed=1',
    height: 520,
    description: 'Screen credentials and contact identifiers against known historical exposure sets.',
    category: 'Account & Data Security',
  },
  'hash-compare': {
    id: 'hash-compare',
    shortLabel: 'Hash Compare',
    title: 'Hash Comparison Tool',
    src: 'https://hash-compare.utils.com?embed=1',
    height: 520,
    description: 'Verify SHA/MD5 checksums to confirm contracts, deeds, and exports are unaltered.',
    category: 'Signatures & Integrity',
  },
  'validate-email': {
    id: 'validate-email',
    shortLabel: 'Email Validator',
    title: 'Email Validator',
    src: 'https://validate-email.utils.com?embed=1',
    height: 420,
    description: 'Validate syntax, domain MX structure, and deliverability of client or billing email addresses.',
    category: 'Contact & Partner Validation',
  },
  'cc-type': {
    id: 'cc-type',
    shortLabel: 'Card Type',
    title: 'Credit Card Type Detector',
    src: 'https://cc-type.utils.com?embed=1',
    height: 560,
    description: 'Identify issuing card network, BIN prefix format, and expected security code length.',
    category: 'Payments & Banking',
  },
  'validate-iban': {
    id: 'validate-iban',
    shortLabel: 'IBAN Validator',
    title: 'IBAN Validator',
    src: 'https://validate-iban.utils.com?embed=1',
    height: 560,
    description: 'Verify international bank account numbers (IBAN) and country check digits before payouts.',
    category: 'Payments & Banking',
  },
  'validate-cc': {
    id: 'validate-cc',
    shortLabel: 'Card Validator',
    title: 'Credit Card Validator',
    src: 'https://validate-cc.utils.com?embed=1',
    height: 560,
    description: 'Run Luhn checksum and card number formatting verification prior to settlement authorization.',
    category: 'Payments & Banking',
  },
  'validate-phone': {
    id: 'validate-phone',
    shortLabel: 'Phone Validator',
    title: 'Phone Number Validator',
    src: 'https://validate-phone.utils.com?embed=1',
    height: 560,
    description: 'Check international calling codes, E.164 formatting, and regional telephone validity.',
    category: 'Contact & Partner Validation',
  },
  'validate-vat': {
    id: 'validate-vat',
    shortLabel: 'VAT Validator',
    title: 'VAT Number Validator (EU)',
    src: 'https://validate-vat.utils.com?embed=1',
    height: 560,
    description: 'Validate cross-border corporate VAT registration prefixes and structure for invoicing.',
    category: 'Payments & Banking',
  },
  'validate-url': {
    id: 'validate-url',
    shortLabel: 'URL Validator',
    title: 'URL Validator',
    src: 'https://validate-url.utils.com?embed=1',
    height: 600,
    description: 'Inspect partner websites, webhook endpoints, and shared links for valid protocol structure.',
    category: 'Contact & Partner Validation',
  },
  'car-comparison': {
    id: 'car-comparison',
    shortLabel: 'Compare Cars',
    title: 'Car Comparison Tool',
    src: 'https://car-comparison.utils.com?embed=1',
    height: 640,
    description: 'Compare executive vehicles side-by-side on fuel economy, seating capacity, and running costs.',
    category: 'Transport & Fleet',
  },
  'car-depreciation': {
    id: 'car-depreciation',
    shortLabel: 'Depreciation',
    title: 'Car Depreciation Estimator',
    src: 'https://car-depreciation.utils.com?embed=1',
    height: 680,
    description: 'Project annual residual value curves and lease write-down schedules for fleet vehicles.',
    category: 'Transport & Fleet',
  },
  'fuel-cost': {
    id: 'fuel-cost',
    shortLabel: 'Fuel Cost',
    title: 'Fuel Cost Calculator',
    src: 'https://fuel-cost.utils.com?embed=1',
    height: 620,
    description: 'Estimate trip fuel consumption and intercity corridor fuel spend before dispatching vehicles.',
    category: 'Transport & Fleet',
  },
  'license-plate': {
    id: 'license-plate',
    shortLabel: 'License Plate',
    title: 'License Plate Validator',
    src: 'https://license-plate.utils.com?embed=1',
    height: 560,
    description: 'Verify vehicle registration plate formatting and regional jurisdiction patterns.',
    category: 'Transport & Fleet',
  },
  'cookie-consent': {
    id: 'cookie-consent',
    shortLabel: 'Cookie Consent',
    title: 'Cookie Consent Banner Generator',
    src: 'https://cookie-consent.utils.com?embed=1',
    height: 660,
    description: 'Configure and preview POPIA/GDPR-compliant consent banners and privacy preference notices.',
    category: 'Privacy & Cookie Compliance',
  },
};

const WIDGET_HEIGHT_CLASSES: Record<EmbeddedWidgetSpec['height'], string> = {
  420: 'h-[390px] sm:h-[420px]',
  520: 'h-[460px] sm:h-[520px]',
  560: 'h-[490px] sm:h-[560px]',
  600: 'h-[520px] sm:h-[600px]',
  620: 'h-[520px] sm:h-[620px]',
  640: 'h-[540px] sm:h-[640px]',
  660: 'h-[550px] sm:h-[660px]',
  680: 'h-[560px] sm:h-[680px]',
  700: 'h-[580px] sm:h-[700px]',
  720: 'h-[600px] sm:h-[720px]',
  760: 'h-[620px] sm:h-[760px]',
};

const WIDGET_ICON_MAP: Record<EmbeddedWidgetId, React.ComponentType<{ className?: string }>> = {
  'map-distance': MapPin,
  'flight-time': Plane,
  signature: FileCheck2,
  'sign-pdf': FileSignature,
  mortgage: Calculator,
  'property-decider': Compass,
  'rent-vs-buy': Scale,
  'energy-cost': Zap,
  'home-insurance': ShieldCheck,
  'water-usage': Droplets,
  'rent-splitter': Users,
  'cash-flow': TrendingUp,
  'property-comparison': ArrowLeftRight,
  'renovation-roi': Hammer,
  'password-strength': KeyRound,
  'breach-checker': ShieldAlert,
  'hash-compare': Fingerprint,
  'validate-email': MailCheck,
  'cc-type': CreditCard,
  'validate-iban': Landmark,
  'validate-cc': BadgeCheck,
  'validate-phone': Phone,
  'validate-vat': Receipt,
  'validate-url': Link2,
  'car-comparison': Car,
  'car-depreciation': TrendingDown,
  'fuel-cost': Fuel,
  'license-plate': Hash,
  'cookie-consent': Cookie,
};

interface EmbeddedToolFrameProps {
  toolId: EmbeddedWidgetId;
  compactHeader?: boolean;
  className?: string;
}

export const EmbeddedToolFrame: React.FC<EmbeddedToolFrameProps> = ({
  toolId,
  compactHeader = false,
  className = '',
}) => {
  const spec = EMBEDDED_WIDGETS[toolId];
  const Icon = WIDGET_ICON_MAP[toolId];
  const [reloadNonce, setReloadNonce] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const heightClass = WIDGET_HEIGHT_CLASSES[spec.height];

  const handleReload = () => {
    setIsLoading(true);
    setReloadNonce((prev) => prev + 1);
  };

  return (
    <>
      <div
        className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0C1D18] overflow-hidden ${className}`}
      >
        <div
          className={`flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-[#FAF8F5] dark:bg-[#081713] ${
            compactHeader ? 'px-4 py-2.5' : 'px-5 py-3.5'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0F2D25]/10 dark:bg-[#C9A35D]/15 text-[#0F2D25] dark:text-[#C9A35D] flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {spec.title}
                </h4>
                <span className="hidden sm:inline text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {spec.height}px
                </span>
              </div>
              {!compactHeader && (
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {spec.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleReload}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              title={`Reload ${spec.title}`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#0F2D25] text-white hover:bg-[#173f34] dark:bg-[#C9A35D] dark:text-[#0B1F1A] dark:hover:bg-[#d8b46e] transition-colors whitespace-nowrap shrink-0"
              title={`Expand ${spec.title}`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Full View</span>
            </button>
          </div>
        </div>

        <div className="relative p-2 sm:p-3 bg-slate-50/70 dark:bg-[#071410]">
          {isLoading && (
            <div className="absolute inset-3 rounded-[8px] bg-slate-100 dark:bg-slate-900/90 flex flex-col items-center justify-center gap-2 z-10 pointer-events-none">
              <div className="w-7 h-7 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-[#0F2D25] dark:border-t-[#C9A35D] animate-spin" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Loading {spec.title}...
              </span>
            </div>
          )}

          <iframe
            key={`${spec.id}-${reloadNonce}`}
            src={spec.src}
            title={spec.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
            onLoad={() => setIsLoading(false)}
            className={`w-full ${heightClass} border border-[#ccc] dark:border-slate-700 rounded-[8px] bg-white transition-opacity duration-200 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </div>
      </div>

      {isExpanded && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={spec.title}
        >
          <div className="w-full max-w-6xl bg-white dark:bg-[#0C1D18] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-[#FAF8F5] dark:bg-[#081713]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#0F2D25]/10 dark:bg-[#C9A35D]/15 text-[#0F2D25] dark:text-[#C9A35D] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {spec.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {spec.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Close</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 sm:p-4 overflow-y-auto bg-slate-50 dark:bg-[#071410]">
              <iframe
                src={spec.src}
                title={spec.title}
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
                className="w-full h-[78vh] border border-[#ccc] dark:border-slate-700 rounded-[8px] bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface WidgetTabGroupProps {
  title: string;
  subtitle?: string;
  toolIds: EmbeddedWidgetId[];
  defaultToolId?: EmbeddedWidgetId;
  className?: string;
}

export const WidgetTabGroup: React.FC<WidgetTabGroupProps> = ({
  title,
  subtitle,
  toolIds,
  defaultToolId,
  className = '',
}) => {
  const [activeId, setActiveId] = useState<EmbeddedWidgetId>(
    defaultToolId && toolIds.includes(defaultToolId) ? defaultToolId : toolIds[0]
  );

  const safeActiveId = toolIds.includes(activeId) ? activeId : toolIds[0];

  return (
    <section
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1F1A] p-4 sm:p-6 ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h3>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {toolIds.length} {toolIds.length === 1 ? 'tool' : 'tools'}
            </span>
          </div>
          {subtitle && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {toolIds.length > 1 && (
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 border-b border-slate-200 dark:border-slate-800"
          role="tablist"
          aria-label={title}
        >
          {toolIds.map((id) => {
            const spec = EMBEDDED_WIDGETS[id];
            const Icon = WIDGET_ICON_MAP[id];
            const isSelected = safeActiveId === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveId(id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[#0F2D25] text-white dark:bg-[#C9A35D] dark:text-[#0B1F1A]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{spec.shortLabel}</span>
              </button>
            );
          })}
        </div>
      )}

      <EmbeddedToolFrame toolId={safeActiveId} />
    </section>
  );
};
