import React, { useState, useMemo } from 'react';
import { useToast } from '../../contexts/ToastContext';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ShieldCheckIcon,
  CalculatorIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

interface PricingPageProps {
  onPlanSelect: (role: 'user' | 'agent' | 'investor') => void;
  onBack?: () => void;
}

type PlanCategoryFilter = 'all' | 'pay_on_success' | 'portfolio_enterprise';
type CalculatorTrack = 'accommodation' | 'long_term' | 'sales' | 'managers' | 'hotels';

interface AfriEstatePlan {
  id: CalculatorTrack;
  index: string;
  title: string;
  audience: string;
  category: 'pay_on_success' | 'portfolio_enterprise';
  headlinePrice: string;
  rateLine: string;
  subNote: string;
  highlights: string[];
  exclusionsOrGuaranteeTitle?: string;
  exclusionsOrGuaranteeItems?: string[];
  ctaLabel: string;
  featuredDark?: boolean;
  role: 'user' | 'agent' | 'investor';
}

const AFRIESTATE_PLANS: AfriEstatePlan[] = [
  {
    id: 'accommodation',
    index: '01',
    title: 'For Accommodation Providers',
    audience: 'Short-Term Stays & Holiday Hosts',
    category: 'pay_on_success',
    headlinePrice: 'List Free',
    rateLine: '7% per completed short-term booking',
    subNote: 'Zero fixed overhead — AfriEstate only earns when your calendar converts a completed stay.',
    exclusionsOrGuaranteeTitle: 'No:',
    exclusionsOrGuaranteeItems: [
      'Setup fee',
      'Monthly fee',
      'Listing fee',
      'Contract commitment',
    ],
    highlights: [
      'Instant publishing for villas, apartments, and guesthouses',
      'Verified guest booking protection and calendar sync',
      'Direct payouts in local African or convertible currency',
    ],
    ctaLabel: 'List Accommodation Free',
    role: 'agent',
  },
  {
    id: 'long_term',
    index: '02',
    title: 'For Long-Term Rentals',
    audience: 'Residential Landlords & Letting Agents',
    category: 'pay_on_success',
    headlinePrice: 'List Free',
    rateLine: '2.5% successful tenant placement',
    subNote: 'Performance-aligned residential letting across apartments, townhouses, and family homes.',
    exclusionsOrGuaranteeTitle: 'Placement Guarantee',
    exclusionsOrGuaranteeItems: [
      'No payment if AfriEstate doesn\'t produce a tenant.',
    ],
    highlights: [
      'Unlimited rental photography, floorplans, and tour scheduling',
      'Pre-qualified tenant inquiries and lease readiness tracking',
      'Zero charge while your property is marketed or self-leased',
    ],
    ctaLabel: 'List Rental Property Free',
    role: 'agent',
  },
  {
    id: 'sales',
    index: '03',
    title: 'For Property Sales',
    audience: 'Homeowners, Developers & Agencies',
    category: 'pay_on_success',
    headlinePrice: 'List Free',
    rateLine: 'Optional premium visibility from: R299',
    subNote: 'Publish residential, land, or commercial sales inventory free, with optional spotlight boosts when you want priority reach.',
    exclusionsOrGuaranteeTitle: 'Transparent Seller Model',
    exclusionsOrGuaranteeItems: [
      'R0 core property listing with verified badge eligibility',
      'Optional R299 featured search & buyer alert promotion',
    ],
    highlights: [
      'Direct buyer & diaspora investor lead routing with zero sales commission',
      'AI listing description enhancement and valuation guidance',
      'Upgrade individual listings from R299 whenever extra exposure is needed',
    ],
    ctaLabel: 'List Property for Sale',
    role: 'agent',
  },
  {
    id: 'managers',
    index: '04',
    title: 'For Property Managers',
    audience: 'Multi-Unit Portfolios & Agencies',
    category: 'portfolio_enterprise',
    headlinePrice: 'From: R199',
    rateLine: 'R199/property/month',
    subNote: 'Structured per-door operational software built for agencies, estate managers, and growing rental portfolios.',
    highlights: [
      'Centralized portfolio ledger, rent roll tracking, and arrears alerts',
      'Lead-to-lease pipeline, automated showings, and tenant document vault',
      'Sub-agent permissions, performance analytics, and owner reporting',
      'Predictable per-property pricing that scales smoothly with your book',
    ],
    ctaLabel: 'Start Property Manager Plan',
    role: 'agent',
  },
  {
    id: 'hotels',
    index: '05',
    title: 'For Hotels & Large Operators',
    audience: 'Hospitality Groups, Lodges & Multi-Property Brands',
    category: 'portfolio_enterprise',
    headlinePrice: 'From: 5%',
    rateLine: '5% commission with negotiated enterprise pricing.',
    subNote: 'Tailored distribution agreements, volume commission tiers, and dedicated concierge infrastructure for established operators.',
    highlights: [
      'Reduced commission floor starting from 5% on high-volume room inventory',
      'Negotiated enterprise pricing and multi-property billing consolidation',
      'Dedicated corporate travel, wellness retreat, and group booking desk',
      'Custom channel/API availability feeds and priority account support',
    ],
    ctaLabel: 'Request Enterprise Pricing',
    featuredDark: true,
    role: 'investor',
  },
];

const COMPARISON_ROWS = [
  {
    metric: 'Upfront Listing Fee',
    accommodation: 'Free (R0)',
    longTerm: 'Free (R0)',
    sales: 'Free (R0)',
    managers: 'Included in plan',
    hotels: 'Negotiated',
  },
  {
    metric: 'Pricing Structure',
    accommodation: '7% / completed booking',
    longTerm: '2.5% tenant placement',
    sales: 'Free + optional R299 boost',
    managers: 'From R199 / property / mo',
    hotels: 'From 5% commission',
  },
  {
    metric: 'Setup & Monthly Fees',
    accommodation: 'None',
    longTerm: 'None',
    sales: 'None',
    managers: 'Per active unit only',
    hotels: 'Custom enterprise SLA',
  },
  {
    metric: 'Risk Protection',
    accommodation: 'Pay only on completed stays',
    longTerm: 'No tenant, no payment',
    sales: 'Pay R299 only if boosting',
    managers: 'Cancel or scale units anytime',
    hotels: 'Volume-tiered agreement',
  },
  {
    metric: 'Contract Commitment',
    accommodation: 'None',
    longTerm: 'None',
    sales: 'None',
    managers: 'Monthly flexible billing',
    hotels: 'Enterprise term options',
  },
  {
    metric: 'Dedicated Tools & Support',
    accommodation: 'Booking calendar & payouts',
    longTerm: 'Tenant screening & scheduling',
    sales: 'Direct buyer leads & AI copy',
    managers: 'Full portfolio & team suite',
    hotels: 'Account director & API sync',
  },
];

const PRICING_FAQS = [
  {
    question: 'Does listing a stay, rental, or home for sale really cost nothing upfront?',
    answer:
      'Yes. Accommodation Providers, Long-Term Rentals, and Property Sales all start with List Free (R0 setup, R0 monthly fee, and R0 listing fee). You can publish verified listings and receive inquiries without entering a paid subscription.',
  },
  {
    question: 'When is the 7% fee for Accommodation Providers charged?',
    answer:
      'The 7% fee applies strictly per completed short-term booking. There is no setup fee, no monthly fee, no listing fee, and no contract commitment — if an inquiry does not convert into a completed stay, you owe nothing.',
  },
  {
    question: 'How does the 2.5% Long-Term Rental guarantee work?',
    answer:
      'Listing a long-term rental is free. You only pay the 2.5% placement fee when AfriEstate successfully produces and places a verified tenant. If AfriEstate does not produce a tenant, no payment is due.',
  },
  {
    question: 'What is included in the optional R299 premium visibility for Property Sales?',
    answer:
      'Core property sale listings are completely free. Sellers or agencies who want accelerated reach can opt into R299 premium visibility to pin their listing higher in buyer searches, featured neighbourhood carousels, and diaspora investor alerts.',
  },
  {
    question: 'How does pricing work for Hotels & Large Operators?',
    answer:
      'Hotels, safari lodges, serviced residence groups, and large operators qualify for commission rates starting from 5% paired with negotiated enterprise pricing based on room inventory, seasonal volume, and API/PMS integration scope.',
  },
];

const PricingPage: React.FC<PricingPageProps> = ({ onPlanSelect, onBack }) => {
  const { addToast } = useToast();

  const [categoryFilter, setCategoryFilter] = useState<PlanCategoryFilter>('all');
  const [calcTrack, setCalcTrack] = useState<CalculatorTrack>('accommodation');

  // Calculator inputs
  const [nightlyRateZar, setNightlyRateZar] = useState<number>(1850);
  const [nightsBookedPerMonth, setNightsBookedPerMonth] = useState<number>(14);
  const [monthlyRentZar, setMonthlyRentZar] = useState<number>(14500);
  const [leaseMonths, setLeaseMonths] = useState<number>(12);
  const [salePriceZar, setSalePriceZar] = useState<number>(2250000);
  const [enableSaleBoost, setEnableSaleBoost] = useState<boolean>(true);
  const [managedUnitCount, setManagedUnitCount] = useState<number>(12);
  const [hotelMonthlyRevZar, setHotelMonthlyRevZar] = useState<number>(280000);

  // FAQ accordion state
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  // Enterprise inquiry form state
  const [inquiryForm, setInquiryForm] = useState({
    fullName: '',
    organization: '',
    email: '',
    phone: '',
    planFocus: 'Hotels & Large Operators (From 5%)',
    portfolioUnits: '25 - 100 units',
    notes: '',
  });
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  const visiblePlans = useMemo(() => {
    if (categoryFilter === 'all') return AFRIESTATE_PLANS;
    return AFRIESTATE_PLANS.filter((plan) => plan.category === categoryFilter);
  }, [categoryFilter]);

  const calcResult = useMemo(() => {
    switch (calcTrack) {
      case 'accommodation': {
        const gross = Math.max(0, nightlyRateZar) * Math.max(0, nightsBookedPerMonth);
        const fee = Math.round(gross * 0.07);
        const net = gross - fee;
        return {
          title: 'Accommodation Providers · 7% Completed Booking Model',
          grossLabel: 'Estimated Monthly Booking Revenue',
          grossValue: `R${gross.toLocaleString()}`,
          feeLabel: 'AfriEstate Fee (7% on completed bookings)',
          feeValue: `R${fee.toLocaleString()}`,
          upfrontValue: 'R0 (No setup, monthly, or listing fee)',
          netLabel: 'Estimated Host Payout',
          netValue: `R${net.toLocaleString()}`,
          footnote: 'No payment on unbooked nights or cancelled inquiries. Zero lock-in contract.',
        };
      }
      case 'long_term': {
        const annualContract = Math.max(0, monthlyRentZar) * Math.max(1, leaseMonths);
        const fee = Math.round(annualContract * 0.025);
        const net = annualContract - fee;
        return {
          title: 'Long-Term Rentals · 2.5% Successful Placement Model',
          grossLabel: `Total ${leaseMonths}-Month Lease Value`,
          grossValue: `R${annualContract.toLocaleString()}`,
          feeLabel: 'AfriEstate Fee (2.5% upon tenant placement)',
          feeValue: `R${fee.toLocaleString()}`,
          upfrontValue: 'R0 (No payment if no tenant is produced)',
          netLabel: 'Net Lease Value to Landlord',
          netValue: `R${net.toLocaleString()}`,
          footnote: '100% performance-based: if AfriEstate does not produce a tenant, you pay R0.',
        };
      }
      case 'sales': {
        const gross = Math.max(0, salePriceZar);
        const fee = enableSaleBoost ? 299 : 0;
        const net = Math.max(0, gross - fee);
        return {
          title: 'Property Sales · Free Listing + Optional R299 Visibility',
          grossLabel: 'Property Asking Price',
          grossValue: `R${gross.toLocaleString()}`,
          feeLabel: enableSaleBoost ? 'Optional Premium Visibility Boost' : 'Core Platform Listing Cost',
          feeValue: `R${fee.toLocaleString()}`,
          upfrontValue: 'R0 core listing fee · 0% platform sales commission',
          netLabel: 'Estimated Seller Proceeds (Excl. Optional Boost)',
          netValue: `R${net.toLocaleString()}`,
          footnote: 'Keep full sale equity. Upgrade with R299 visibility only if and when you want promoted reach.',
        };
      }
      case 'managers': {
        const units = Math.max(1, managedUnitCount);
        const fee = units * 199;
        return {
          title: 'Property Managers · R199 / Property / Month Software',
          grossLabel: 'Active Portfolio Size',
          grossValue: `${units} ${units === 1 ? 'property' : 'properties'}`,
          feeLabel: `Monthly Software Total (${units} x R199)`,
          feeValue: `R${fee.toLocaleString()}/mo`,
          upfrontValue: 'R199 base rate per active property',
          netLabel: 'Annual Predictable Platform Spend',
          netValue: `R${(fee * 12).toLocaleString()}/yr`,
          footnote: 'Covers automated rent rolls, tenant screening, agent team permissions, and maintenance tracking.',
        };
      }
      case 'hotels': {
        const gross = Math.max(0, hotelMonthlyRevZar);
        const enterpriseFee = Math.round(gross * 0.05);
        const standardFee = Math.round(gross * 0.07);
        const monthlySavings = Math.max(0, standardFee - enterpriseFee);
        return {
          title: 'Hotels & Large Operators · From 5% Negotiated Commission',
          grossLabel: 'Monthly Room & Package Revenue',
          grossValue: `R${gross.toLocaleString()}`,
          feeLabel: 'Enterprise Baseline Commission (5%)',
          feeValue: `R${enterpriseFee.toLocaleString()}/mo`,
          upfrontValue: `Saves R${monthlySavings.toLocaleString()}/mo vs standard 7% rate`,
          netLabel: 'Net Hospitality Revenue Retained',
          netValue: `R${(gross - enterpriseFee).toLocaleString()}/mo`,
          footnote: 'Eligible for further volume tier negotiations and custom channel/PMS onboarding.',
        };
      }
    }
  }, [
    calcTrack,
    nightlyRateZar,
    nightsBookedPerMonth,
    monthlyRentZar,
    leaseMonths,
    salePriceZar,
    enableSaleBoost,
    managedUnitCount,
    hotelMonthlyRevZar,
  ]);

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenEnterpriseForm = (planName?: string) => {
    if (planName) {
      setInquiryForm((prev) => ({ ...prev, planFocus: planName }));
    }
    scrollToElement('enterprise-desk');
  };

  const handleEnterpriseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!inquiryForm.fullName.trim() || !inquiryForm.organization.trim()) {
      addToast('Please enter your name and organization.', 'error');
      return;
    }
    if (!emailPattern.test(inquiryForm.email.trim())) {
      addToast('Please enter a valid business email address.', 'error');
      return;
    }
    setInquirySubmitted(true);
    addToast('Enterprise rate card request submitted — our hospitality & portfolio desk will respond within 1 business day.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sticky Architectural Sub-Nav */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                <ArrowLeftIcon className="w-4 h-4 shrink-0" />
                <span>Back to Marketplace</span>
              </button>
            )}
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap">
              AFRIESTATE · Transparent Partner Pricing
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => scrollToElement('plans-grid')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              All Plans
            </button>
            <button
              type="button"
              onClick={() => scrollToElement('calculator')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Payout Calculator
            </button>
            <button
              type="button"
              onClick={() => scrollToElement('comparison-matrix')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Compare Models
            </button>
            <button
              type="button"
              onClick={() => scrollToElement('enterprise-desk')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Enterprise Desk
            </button>
            <button
              type="button"
              onClick={() => scrollToElement('pricing-faq')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              FAQ
            </button>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-[#0B1F1A] text-white border-b border-emerald-950">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7 space-y-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-amber-300">
                AFRIESTATE · Performance-Aligned Marketplace Fees
              </p>
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading tracking-tight text-white leading-[1.06]"
                style={{ textWrap: 'balance' }}
              >
                Find the Perfect Plan
              </h1>
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                List short-term stays, long-term rentals, and properties for sale free with zero upfront setup or monthly charges — or scale multi-property portfolios and hospitality groups with transparent unit and volume pricing.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onPlanSelect('agent')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Start Listing Free</span>
                  <ArrowRightIcon className="w-4 h-4 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToElement('calculator')}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <CalculatorIcon className="w-4 h-4 shrink-0 text-amber-300" />
                  <span>Estimate Net Payout</span>
                </button>
              </div>
            </div>

            {/* Hero Snapshot Card */}
            <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Core Marketplace Standard
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-300">
                  5 Partner Models
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Upfront Listing Fee</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-white mt-0.5">List Free</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Short-Term Booking</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-amber-300 mt-0.5">7%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Tenant Placement</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-white mt-0.5">2.5%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Hotel Enterprise</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-emerald-300 mt-0.5">From 5%</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-white/10">
                Property managers scale from <strong className="text-white font-mono tabular-nums">R199/property/month</strong>; property sales list free with optional visibility from <strong className="text-white font-mono tabular-nums">R299</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Workspace */}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-14 space-y-16">
        {/* Section 1: AfriEstate 5-Plan Architecture */}
        <section id="plans-grid" className="space-y-8 scroll-mt-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                AFRIESTATE Fee Schedule
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white mt-1">
                Plans Built Around Every Property Business Model
              </h2>
            </div>

            {/* Interactive Category Filter Control */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start md:self-auto">
              {[
                { id: 'all' as PlanCategoryFilter, label: 'All 5 Plans' },
                { id: 'pay_on_success' as PlanCategoryFilter, label: 'List Free & Pay-on-Success' },
                { id: 'portfolio_enterprise' as PlanCategoryFilter, label: 'Managers & Hotels' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    categoryFilter === tab.id
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary 3 Pay-on-Success Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {visiblePlans
              .filter((p) => p.category === 'pay_on_success')
              .map((plan) => (
                <article
                  key={plan.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-7 flex flex-col justify-between transition-all duration-200 hover:border-emerald-700/50 dark:hover:border-amber-400/50 hover:shadow-lg"
                >
                  <div className="space-y-5">
                    {/* Clean unboxed metadata header */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono font-semibold text-emerald-700 dark:text-amber-300">
                        {plan.index}. {plan.audience}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white tracking-tight">
                        {plan.title}
                      </h3>
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-3xl sm:text-4xl font-bold font-heading text-emerald-800 dark:text-amber-300 tracking-tight">
                          {plan.headlinePrice}
                        </p>
                        <p className="text-base font-semibold text-slate-900 dark:text-white mt-1.5 font-mono tabular-nums">
                          {plan.rateLine}
                        </p>
                      </div>
                    </div>

                    {/* Explicit Exclusion / Guarantee Block */}
                    {plan.exclusionsOrGuaranteeItems && (
                      <div className="bg-[#FAF8F5] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                          {plan.exclusionsOrGuaranteeTitle}
                        </p>
                        <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-200">
                          {plan.exclusionsOrGuaranteeItems.map((item) => (
                            <li key={item} className="flex items-center gap-2">
                              <ShieldCheckIcon className="w-4 h-4 text-emerald-700 dark:text-amber-300 shrink-0" />
                              <span className="font-medium">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {plan.subNote}
                    </p>

                    <ul className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {plan.highlights.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <CheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onPlanSelect(plan.role)}
                      className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-emerald-900 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap"
                    >
                      {plan.ctaLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCalcTrack(plan.id);
                        scrollToElement('calculator');
                      }}
                      title="Simulate earnings"
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shrink-0"
                    >
                      <CalculatorIcon className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              ))}
          </div>

          {/* Portfolio & Enterprise Tier Row */}
          {visiblePlans.some((p) => p.category === 'portfolio_enterprise') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {visiblePlans
                .filter((p) => p.category === 'portfolio_enterprise')
                .map((plan) => {
                  const isDark = Boolean(plan.featuredDark);
                  return (
                    <article
                      key={plan.id}
                      className={`lg:col-span-6 rounded-2xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-200 ${
                        isDark
                          ? 'bg-[#0B1F1A] text-white border border-emerald-900 shadow-xl'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-700/50 dark:hover:border-amber-400/50'
                      }`}
                    >
                      <div className="space-y-5">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-mono font-semibold ${isDark ? 'text-amber-300' : 'text-emerald-700 dark:text-amber-300'}`}>
                            {plan.index}. {plan.audience}
                          </span>
                          <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                            {isDark ? 'Enterprise Hospitality Desk' : 'Per-Property SaaS'}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200/20">
                          <div>
                            <h3 className={`text-2xl font-bold font-heading tracking-tight ${isDark ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                              {plan.title}
                            </h3>
                            <p className={`text-sm mt-1.5 max-w-md ${isDark ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>
                              {plan.subNote}
                            </p>
                          </div>

                          <div className="sm:text-right shrink-0">
                            <p className={`text-xs font-medium ${isDark ? 'text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>
                              {plan.id === 'managers' ? 'From:' : 'From:'}
                            </p>
                            <p className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums mt-0.5 ${isDark ? 'text-amber-300' : 'text-slate-900 dark:text-amber-300'}`}>
                              {plan.id === 'managers' ? 'R199/property/month' : '5% commission'}
                            </p>
                            {plan.id === 'hotels' && (
                              <p className="text-xs font-medium text-emerald-200 mt-1">
                                with negotiated enterprise pricing.
                              </p>
                            )}
                          </div>
                        </div>

                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                          {plan.highlights.map((item) => (
                            <li key={item} className="flex items-start gap-2.5">
                              <CheckIcon
                                className={`w-4 h-4 shrink-0 mt-0.5 ${
                                  isDark ? 'text-amber-300' : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              />
                              <span className={isDark ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}>
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className={`pt-6 mt-6 border-t ${isDark ? 'border-white/10' : 'border-slate-100 dark:border-slate-800'} flex flex-wrap items-center gap-3`}>
                        <button
                          type="button"
                          onClick={() =>
                            isDark
                              ? handleOpenEnterpriseForm('Hotels & Large Operators (From 5%)')
                              : onPlanSelect('agent')
                          }
                          className={`flex-1 py-3 px-5 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                            isDark
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                              : 'bg-slate-900 hover:bg-emerald-900 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950'
                          }`}
                        >
                          {plan.ctaLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCalcTrack(plan.id);
                            scrollToElement('calculator');
                          }}
                          className={`py-3 px-4 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                            isDark
                              ? 'border-white/20 text-white hover:bg-white/10'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          Simulate Pricing
                        </button>
                      </div>
                    </article>
                  );
                })}
            </div>
          )}
        </section>

        {/* Quiet Seeker & Investor Access Strip */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                For Property Seekers & Renters · Always Free
              </p>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                Search, Compare, and Schedule Tours at R0 Cost
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Save homes, access 140+ African neighbourhood briefs, and contact verified owners directly.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onPlanSelect('user')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
            >
              Join Free as Seeker
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                For Institutional & Diaspora Investors
              </p>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                Access Yield Developments & Portfolio Co-Investment
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Underwrite gross yields, inspect title verification, and track continental cap-rate trends.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onPlanSelect('investor')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-900 dark:bg-white dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold transition-colors whitespace-nowrap shrink-0"
            >
              Open Investor Desk
            </button>
          </div>
        </section>

        {/* Section 2: Interactive Commission & Payout Estimator */}
        <section id="calculator" className="scroll-mt-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-amber-300">
                Interactive Fee & Payout Estimator
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                Calculate Exact AfriEstate Costs in Real Time
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              {[
                { id: 'accommodation' as CalculatorTrack, label: 'Accommodation (7%)' },
                { id: 'long_term' as CalculatorTrack, label: 'Rentals (2.5%)' },
                { id: 'sales' as CalculatorTrack, label: 'Sales (Free / R299)' },
                { id: 'managers' as CalculatorTrack, label: 'Managers (R199)' },
                { id: 'hotels' as CalculatorTrack, label: 'Hotels (From 5%)' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCalcTrack(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    calcTrack === t.id
                      ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Controls Column */}
            <div className="lg:col-span-6 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
              {calcTrack === 'accommodation' && (
                <>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-slate-700 dark:text-slate-300">Average Nightly Rate (ZAR)</span>
                      <span className="font-mono tabular-nums text-slate-900 dark:text-white">R{nightlyRateZar.toLocaleString()} / night</span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={12000}
                      step={50}
                      value={nightlyRateZar}
                      onChange={(e) => setNightlyRateZar(Number(e.target.value))}
                      className="w-full accent-emerald-700 dark:accent-amber-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-slate-700 dark:text-slate-300">Completed Booked Nights / Month</span>
                      <span className="font-mono tabular-nums text-slate-900 dark:text-white">{nightsBookedPerMonth} nights</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      step={1}
                      value={nightsBookedPerMonth}
                      onChange={(e) => setNightsBookedPerMonth(Number(e.target.value))}
                      className="w-full accent-emerald-700 dark:accent-amber-400"
                    />
                  </div>
                </>
              )}

              {calcTrack === 'long_term' && (
                <>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-slate-700 dark:text-slate-300">Monthly Rent (ZAR)</span>
                      <span className="font-mono tabular-nums text-slate-900 dark:text-white">R{monthlyRentZar.toLocaleString()} / month</span>
                    </div>
                    <input
                      type="range"
                      min={3500}
                      max={65000}
                      step={500}
                      value={monthlyRentZar}
                      onChange={(e) => setMonthlyRentZar(Number(e.target.value))}
                      className="w-full accent-emerald-700 dark:accent-amber-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-slate-700 dark:text-slate-300">Lease Duration</span>
                      <span className="font-mono tabular-nums text-slate-900 dark:text-white">{leaseMonths} months</span>
                    </div>
                    <div className="flex gap-2">
                      {[6, 12, 24].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setLeaseMonths(m)}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                            leaseMonths === m
                              ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 border-transparent'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {m} Months
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {calcTrack === 'sales' && (
                <>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-slate-700 dark:text-slate-300">Target Sale Price (ZAR)</span>
                      <span className="font-mono tabular-nums text-slate-900 dark:text-white">R{salePriceZar.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min={450000}
                      max={15000000}
                      step={50000}
                      value={salePriceZar}
                      onChange={(e) => setSalePriceZar(Number(e.target.value))}
                      className="w-full accent-emerald-700 dark:accent-amber-400"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Add Optional Premium Visibility (R299)
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Boosts listing priority above standard free listings
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableSaleBoost((v) => !v)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                        enableSaleBoost
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {enableSaleBoost ? 'Included (R299)' : 'Free Only (R0)'}
                    </button>
                  </div>
                </>
              )}

              {calcTrack === 'managers' && (
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-700 dark:text-slate-300">Managed Properties in Portfolio</span>
                    <span className="font-mono tabular-nums text-slate-900 dark:text-white">{managedUnitCount} units</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={150}
                    step={1}
                    value={managedUnitCount}
                    onChange={(e) => setManagedUnitCount(Number(e.target.value))}
                    className="w-full accent-emerald-700 dark:accent-amber-400"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                    Standard unit rate starts at <strong className="text-slate-800 dark:text-white font-mono">R199/property/month</strong>. Portfolios above 75 units also qualify for custom agency tiering.
                  </p>
                </div>
              )}

              {calcTrack === 'hotels' && (
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-700 dark:text-slate-300">Monthly Booking Revenue via AfriEstate (ZAR)</span>
                    <span className="font-mono tabular-nums text-slate-900 dark:text-white">R{hotelMonthlyRevZar.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={50000}
                    max={2500000}
                    step={10000}
                    value={hotelMonthlyRevZar}
                    onChange={(e) => setHotelMonthlyRevZar(Number(e.target.value))}
                    className="w-full accent-emerald-700 dark:accent-amber-400"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                    Hotels and multi-property groups start from a <strong className="text-slate-800 dark:text-white font-mono">5% commission</strong> baseline with negotiated enterprise terms.
                  </p>
                </div>
              )}
            </div>

            {/* Output Breakdown Column */}
            <div className="lg:col-span-6 p-6 sm:p-8 bg-[#FAF8F5] dark:bg-slate-950/60 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {calcResult.title}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{calcResult.grossLabel}</p>
                    <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                      {calcResult.grossValue}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{calcResult.feeLabel}</p>
                    <p className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-amber-300 mt-1">
                      {calcResult.feeValue}
                    </p>
                  </div>
                </div>

                <div className="bg-[#0B1F1A] text-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-emerald-200">{calcResult.netLabel}</p>
                    <p className="text-xs text-slate-300 mt-0.5">{calcResult.upfrontValue}</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-300">
                    {calcResult.netValue}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-600 dark:text-slate-400">{calcResult.footnote}</p>
                <button
                  type="button"
                  onClick={() =>
                    calcTrack === 'hotels'
                      ? handleOpenEnterpriseForm('Hotels & Large Operators (From 5%)')
                      : onPlanSelect('agent')
                  }
                  className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold whitespace-nowrap shrink-0"
                >
                  {calcTrack === 'hotels' ? 'Negotiate Rate' : 'Get Started Free'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Full Side-by-Side Comparison Matrix */}
        <section id="comparison-matrix" className="scroll-mt-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Plan Matrix
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white mt-0.5">
              Compare All Five AfriEstate Partner Models
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white">
                  <th className="py-3.5 pr-4">Feature / Terms</th>
                  <th className="py-3.5 px-4">Accommodation Providers</th>
                  <th className="py-3.5 px-4">Long-Term Rentals</th>
                  <th className="py-3.5 px-4">Property Sales</th>
                  <th className="py-3.5 px-4">Property Managers</th>
                  <th className="py-3.5 pl-4 text-emerald-800 dark:text-amber-300">Hotels & Large Operators</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.metric} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 pr-4 font-semibold text-slate-900 dark:text-white">{row.metric}</td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">{row.accommodation}</td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">{row.longTerm}</td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">{row.sales}</td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">{row.managers}</td>
                    <td className="py-3.5 pl-4 font-mono tabular-nums font-semibold text-emerald-800 dark:text-amber-300">{row.hotels}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Enterprise Desk & Expandable FAQ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Enterprise Pricing & Operator Request Form */}
          <div
            id="enterprise-desk"
            className="lg:col-span-6 scroll-mt-32 bg-[#0B1F1A] text-white rounded-2xl p-6 sm:p-8 space-y-6"
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Hotels, Lodges & Multi-Unit Operators
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-white">
                Negotiate Enterprise & Volume Pricing
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Operating a boutique hotel group, serviced residence portfolio, or agency managing 25+ properties? Request a tailored commission schedule starting from 5% or volume per-property pricing.
              </p>
            </div>

            {inquirySubmitted ? (
              <div className="rounded-xl bg-white/10 border border-emerald-400/30 p-6 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-base">
                  <CheckBadgeIcon className="w-5 h-5 shrink-0" />
                  <span>Proposal Request Received</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Thank you, <strong className="text-white">{inquiryForm.fullName}</strong>. Our AfriEstate Partner Desk is preparing a custom rate schedule for <strong className="text-white">{inquiryForm.organization}</strong> ({inquiryForm.planFocus}).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInquirySubmitted(false);
                    setInquiryForm({
                      fullName: '',
                      organization: '',
                      email: '',
                      phone: '',
                      planFocus: 'Hotels & Large Operators (From 5%)',
                      portfolioUnits: '25 - 100 units',
                      notes: '',
                    });
                  }}
                  className="px-4 py-2 rounded-lg bg-white text-slate-950 text-xs font-bold hover:bg-amber-300 transition-colors"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnterpriseSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={inquiryForm.fullName}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, fullName: e.target.value })}
                      placeholder="e.g. Thandiwe Khumalo"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hotel / Agency Name</label>
                    <input
                      type="text"
                      value={inquiryForm.organization}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, organization: e.target.value })}
                      placeholder="e.g. Savanna Hospitality Group"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
                    <input
                      type="email"
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                      placeholder="name@company.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Portfolio Scale</label>
                    <select
                      value={inquiryForm.portfolioUnits}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, portfolioUnits: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="10 - 24 units">10 - 24 properties / rooms</option>
                      <option value="25 - 100 units">25 - 100 properties / rooms</option>
                      <option value="100+ units">100+ properties / hotel keys</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Plan Track</label>
                  <select
                    value={inquiryForm.planFocus}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, planFocus: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="Hotels & Large Operators (From 5%)">Hotels & Large Operators (From 5% commission)</option>
                    <option value="Property Managers (From R199/property/month)">Property Managers (From R199/property/month)</option>
                    <option value="Developer Bulk Sales + Premium Visibility">Developer Bulk Sales + R299 Visibility</option>
                    <option value="Multi-Unit Short-Term Portfolio (7% model)">Multi-Unit Short-Term Portfolio</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold transition-colors"
                >
                  Request Custom Rate Card
                </button>
              </form>
            )}
          </div>

          {/* Expandable FAQ Accordion */}
          <div id="pricing-faq" className="lg:col-span-6 scroll-mt-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Billing & Guarantee Answers
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white mt-0.5">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {PRICING_FAQS.map((faq, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div key={faq.question} className="py-4">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 text-left"
                    >
                      <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                        {faq.question}
                      </span>
                      <ChevronDownIcon
                        className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-emerald-700 dark:text-amber-300' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pr-6">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PricingPage;