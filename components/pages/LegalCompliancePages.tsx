import React, { useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon,
  LockClosedIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';
import { usePlatformState } from '../../contexts/PlatformStateContext';
import { supabase } from '../../lib/supabase';
import { sanitizeText } from '../../lib/security';
import { WidgetTabGroup } from '../widgets/EmbeddedWidgetToolkit';

export type CompliancePageSlug = 'privacy-policy' | 'data-protection' | 'popia';

interface ComplianceNavProps {
  activeSlug: CompliancePageSlug;
  onNavigateCompliance: (slug: CompliancePageSlug) => void;
  onBackHome: () => void;
  onOpenContact?: () => void;
  onOpenDashboard?: () => void;
}

interface ComplianceSection {
  id: string;
  index: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  callout?: {
    title: string;
    body: string;
  };
}

interface ComplianceDocumentConfig {
  slug: CompliancePageSlug;
  eyebrow: string;
  title: string;
  subtitle: string;
  effectiveDate: string;
  jurisdiction: string;
  referenceCode: string;
  officerTitle: string;
  officerEmail: string;
  highlights: Array<{ label: string; value: string }>;
  sections: ComplianceSection[];
}

const PRIVACY_DOCUMENT: ComplianceDocumentConfig = {
  slug: 'privacy-policy',
  eyebrow: 'Global Privacy Charter',
  title: 'Privacy Policy',
  subtitle:
    'How AfriEstate collects, processes, protects, and governs personal information across property discovery, residential leasing, investment workflows, hospitality stays, flights, executive transport, and wellness sanctuaries.',
  effectiveDate: '24 November 2026',
  jurisdiction: 'Pan-African & Cross-Border Operations',
  referenceCode: 'AE-PRV-2026.4',
  officerTitle: 'Privacy & Trust Office',
  officerEmail: 'privacy@afriestate.co.za',
  highlights: [
    { label: 'Core Principle', value: 'Minimum Data Necessary' },
    { label: 'Zero Ad Brokerage', value: 'Never Sold to Third Parties' },
    { label: 'Direct Control', value: 'Export & Erasure Available' },
  ],
  sections: [
    {
      id: 'scope',
      index: '01',
      title: 'Scope Across the AfriEstate Platform',
      paragraphs: [
        'This Privacy Policy applies to all personal information processed through the AfriEstate digital marketplace and connected mobility, hospitality, and investment workspaces. Whether you browse verified residences, schedule viewing tours, apply for agency or investor accreditation, reserve short-term accommodation, book continental flights, hire executive vehicles, or book wellness retreats, your data is handled under one unified governance framework.',
        'All connected verticals share only the minimum session and itinerary details you deliberately provide—such as your verified account profile, preferred currency, and active trip dates—so you never need to re-enter contact details repeatedly while moving between properties, flights, stays, and transport.',
      ],
    },
    {
      id: 'categories',
      index: '02',
      title: 'Information We Collect & Why',
      paragraphs: [
        'We collect information strictly aligned with the service vertical you engage with:',
      ],
      bullets: [
        'Account & Authentication Data: Full name, normalized email address, mobile contact number, chosen role (Property Seeker, Agent/Agency, Hotel Partner, or Investor), and encrypted session identifiers.',
        'Identity & Accreditation Verification (KYC): Business registration numbers, estate agency credentials, corporate fund documentation, and identification documents uploaded voluntarily during accredited Agent or Investor onboarding.',
        'Booking & Itinerary Records: Check-in/check-out windows, passenger names for aviation itineraries, driver contact records for car hire, wellness consultation notes, and short-term stay settlement references.',
        'Property & Service Listings: Cadastre metadata, title deed verification references, municipal/location coordinates, and verified provider contact details submitted by property professionals.',
      ],
    },
    {
      id: 'usage',
      index: '03',
      title: 'Permitted Processing Purposes',
      paragraphs: [
        'Your personal information is used exclusively to deliver platform services reliably, verify marketplace authenticity, coordinate enquiries with landlords or travel operators you select, process authorized short-term travel or vehicle settlements, and enforce anti-fraud safeguards.',
        'Long-term residential leases, property sales, and capital investment deals are settled strictly off-platform between vetted counterparties; AfriEstate never captures or retains escrow card instruments for long-term property purchases or leases.',
      ],
    },
    {
      id: 'sharing',
      index: '04',
      title: 'Trusted Counterparties & Data Minimization',
      paragraphs: [
        'When you submit a property viewing request, long-term tenancy enquiry, hotel booking, car reservation, or wellness consultation, only the contact fields required to fulfill your request are transmitted to the verified listing owner, airline/hospitality desk, or licensed operator.',
        'We utilize institutional infrastructure providers for encrypted database storage, authentication, mapping coordinates, and real-time travel availability queries. Upstream technical service providers receive strictly scoped operational parameters (such as city codes, dates, or flight numbers) without exposing private user identity dossiers.',
      ],
    },
    {
      id: 'retention',
      index: '05',
      title: 'Retention Windows & Local Workspace Preferences',
      paragraphs: [
        'Active account profiles, saved properties, and verified enquiries remain stored while your account is active or as mandated by statutory commercial and tax statutes across applicable jurisdictions.',
        'Browser local storage is used solely for functional continuity—such as language selection, currency preference, saved shortlists, and active travel itineraries scoped to your session—and is cleared cleanly or isolated upon account sign-out.',
      ],
      callout: {
        title: 'Exercise Your Privacy Rights Anytime',
        body: 'Request a copy of your stored records, update your profile metadata, revoke marketing preferences, or request permanent account deletion directly via privacy@afriestate.co.za.',
      },
    },
  ],
};

const DATA_PROTECTION_DOCUMENT: ComplianceDocumentConfig = {
  slug: 'data-protection',
  eyebrow: 'Security & Governance Architecture',
  title: 'Data Protection Standards',
  subtitle:
    'Technical, cryptographic, and organizational controls protecting identity records, verified title dossiers, and transactional integrity across 54 African property and travel corridors.',
  effectiveDate: '24 November 2026',
  jurisdiction: 'ISO-Aligned Technical Controls',
  referenceCode: 'AE-SEC-2026.9',
  officerTitle: 'Security Governance Desk',
  officerEmail: 'security@afriestate.co.za',
  highlights: [
    { label: 'Transport Layer', value: 'TLS 1.3 Enforced' },
    { label: 'Database Isolation', value: 'Row-Level Security (RLS)' },
    { label: 'Incident Response SLA', value: '72-Hour Regulatory Notice' },
  ],
  sections: [
    {
      id: 'cryptographic-controls',
      index: '01',
      title: 'Encryption in Transit & at Rest',
      paragraphs: [
        'All traffic between user browsers, AfriEstate application services, authentication gateways, and backend settlement routes is protected by HTTPS/TLS encryption. Sensitive identity, KYC, and property listing payloads stored in cloud persistence layers are encrypted at rest under AES-256 managed storage keys.',
        'Authentication secrets and session tokens are handled exclusively through hardened OAuth 2.0 and token-based session mechanisms with automated inactivity timeout protection.',
      ],
    },
    {
      id: 'access-rbac',
      index: '02',
      title: 'Role-Based Access Control (RBAC) & Row-Level Isolation',
      paragraphs: [
        'AfriEstate enforces strict separation of duties across Property Seekers, Agents, Hotel Managers, Institutional Investors, and Platform Governance administrators:',
      ],
      bullets: [
        'Row-Level Security (RLS): Database queries validate the authenticated subject identity before returning private enquiries, saved searches, alerts, or portfolio messages.',
        'KYC Document Compartmentalization: Identification files uploaded during Agent and Investor verification are placed in restricted object storage paths accessible only for compliance review.',
        'Wallet & Account Governance: Automated suspension and sovereign freeze controls immediately terminate active privileges if anomalous activity is detected.',
      ],
    },
    {
      id: 'payment-boundary',
      index: '03',
      title: 'Payment Boundary & Financial Non-Persistence',
      paragraphs: [
        'AfriEstate applies strict financial boundary separation. Short-term stays, flights, and executive car hire generate verified settlement references through server-side settlement endpoints without persisting raw primary account numbers (PAN) or security codes in application tables.',
        'Long-term residential leases, residential sales, and commercial investment syndications are explicitly excluded from online card capture on the platform to protect buyers, tenants, and institutional counterparties.',
      ],
    },
    {
      id: 'vendor-proxy',
      index: '04',
      title: 'Server-Side API Isolation & Sanitization',
      paragraphs: [
        'External market, aviation, hospitality, and security intelligence feeds are routed strictly through authenticated server-side proxy endpoints so platform credentials never execute inside client browser bundles.',
        'All user-submitted forms across booking drawers, enquiries, listings, and reviews pass through strict input validation, character limits, URL protocol sanitization, and submission throttling prior to persistence.',
      ],
    },
    {
      id: 'breach-continuity',
      index: '05',
      title: 'Incident Response & Business Continuity',
      paragraphs: [
        'AfriEstate maintains continuous monitoring, encrypted automated backups, and a structured security incident response protocol. In the event of any confirmed unauthorized access impacting personal records, affected data subjects and relevant supervisory authorities—including South Africa’s Information Regulator—are notified within 72 hours with full remediation guidance.',
      ],
      callout: {
        title: 'Responsible Vulnerability Disclosure',
        body: 'Security researchers and institutional partners may report suspected vulnerabilities or request security architecture documentation directly via security@afriestate.co.za.',
      },
    },
  ],
};

const POPIA_DOCUMENT: ComplianceDocumentConfig = {
  slug: 'popia',
  eyebrow: 'Republic of South Africa Statutory Compliance',
  title: 'POPIA Compliance Notice',
  subtitle:
    'Protection of Personal Information Act 4 of 2013 ("POPIA") disclosures, lawful processing conditions, Information Officer designation, and statutory data subject rights across AfriEstate South Africa & Continental Operations.',
  effectiveDate: '24 November 2026',
  jurisdiction: 'Act 4 of 2013 (Republic of South Africa)',
  referenceCode: 'AE-POPIA-2026.4',
  officerTitle: 'Designated Information Officer',
  officerEmail: 'popia@afriestate.co.za',
  highlights: [
    { label: 'Statutory Authority', value: 'Act 4 of 2013 (RSA)' },
    { label: 'Conditions Enforced', value: '8 Lawful Processing Pillars' },
    { label: 'Supervisory Body', value: 'Information Regulator (SA)' },
  ],
  sections: [
    {
      id: 'responsible-party',
      index: '01',
      title: 'Responsible Party & Information Officer (Section 1 & Section 55)',
      paragraphs: [
        'AfriEstate acts as the Responsible Party under the Protection of Personal Information Act 4 of 2013 ("POPIA") when determining the purpose and means of processing personal information for users interacting with our South African and pan-African marketplace, booking infrastructure, and compliance tools.',
        'Our designated Information Officer and Deputy Information Officer oversee internal POPIA governance, Promotion of Access to Information Act (PAIA) manual requests, KYC document handling, and data subject access requests.',
      ],
    },
    {
      id: 'eight-conditions',
      index: '02',
      title: 'Eight Conditions for Lawful Processing',
      paragraphs: [
        'Every workflow across AfriEstate is engineered to adhere strictly to Chapter 3 of POPIA:',
      ],
      bullets: [
        '1. Accountability: Governance policies audited across Marketplace, Stays, Flights, Transport, and Wellness modules.',
        '2. Processing Limitation: Personal data is processed lawfully, minimally, and with explicit user consent or contractual necessity.',
        '3. Purpose Specification (Section 13): Data collected for property enquiries, flight ticketing, car hire, or KYC verification is never repurposed into unrelated cold marketing lists.',
        '4. Further Processing Limitation: Downstream notifications or property alerts strictly align with original opt-in criteria.',
        '5. Information Quality: Authenticated users can inspect and update profile, phone, and agency details directly.',
        '6. Openness (Section 18): Full transparency regarding collection purpose, recipients, and statutory rights before submission.',
        '7. Security Safeguards (Section 19): Appropriate technical encryption, RLS isolation, and breach notification protocols.',
        '8. Data Subject Participation (Sections 23–25): Right to access, correct, or request deletion of stored personal information.',
      ],
    },
    {
      id: 'data-subject-rights',
      index: '03',
      title: 'Your Rights Under POPIA (Form 1 & Form 2 Requests)',
      paragraphs: [
        'As a data subject under POPIA, you hold enforceable statutory rights regarding your personal information held by AfriEstate:',
      ],
      bullets: [
        'Right of Access (Section 23): Request confirmation of whether AfriEstate holds personal information about you and obtain a structured record of that data.',
        'Right to Correction or Deletion (Section 24 / Form 2): Demand correction of inaccurate records or deletion/destruction of personal information that is excessive, outdated, or no longer required.',
        'Right to Object (Section 11(3) / Form 1): Object on reasonable grounds to processing based on legitimate interest, or withdraw consent for direct marketing communications immediately.',
        'Automated Decision Review (Section 71): Request human review where an automated underwriting, affordability, or matching insight impacts access to services.',
      ],
    },
    {
      id: 'cross-border',
      index: '04',
      title: 'Cross-Border Information Transfers (Section 72)',
      paragraphs: [
        'Because AfriEstate connects South African travelers, landlords, and investors with verified listings, airlines, hotels, and mobility partners across 54 African jurisdictions and international cloud infrastructure, personal information may be transferred outside the Republic of South Africa strictly where:',
      ],
      bullets: [
        'The recipient country or infrastructure partner provides an adequate level of data protection substantially similar to Chapter 3 of POPIA; or',
        'The transfer is strictly necessary for executing a booking, flight reservation, hotel stay, or property enquiry initiated directly by you.',
      ],
    },
    {
      id: 'regulator',
      index: '05',
      title: 'Escalation & Information Regulator (South Africa)',
      paragraphs: [
        'We resolve privacy and POPIA requests promptly through our Information Officer desk. If you remain unsatisfied after contacting popia@afriestate.co.za, you have the statutory right to lodge a formal complaint with the Information Regulator (South Africa): JD House, 27 Stiemens Street, Braamfontein, Johannesburg, 2001 · Website: inforegulator.org.za · Email: POPIAComplaints@inforegulator.org.za.',
      ],
      callout: {
        title: 'Direct POPIA & PAIA Request Channel',
        body: 'To submit a Section 23 access request, Form 1 objection, or Form 2 erasure/correction request, email our Information Officer at popia@afriestate.co.za with your registered account email.',
      },
    },
  ],
};

const BrandedComplianceShell: React.FC<{
  doc: ComplianceDocumentConfig;
  nav: ComplianceNavProps;
}> = ({ doc, nav }) => {
  const { addToast } = useToast();
  const { currentUser } = usePlatformState();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [reqName, setReqName] = useState(currentUser?.fullName || '');
  const [reqEmail, setReqEmail] = useState(currentUser?.email || '');
  const [reqType, setReqType] = useState<'access_export' | 'rectification' | 'erasure' | 'objection' | 'consent_withdrawal'>('access_export');
  const [reqDetails, setReqDetails] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [reqReference, setReqReference] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.fullName && !reqName) setReqName(currentUser.fullName);
    if (currentUser?.email && !reqEmail) setReqEmail(currentUser.email);
  }, [currentUser?.fullName, currentUser?.email]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(doc.officerEmail);
      setCopiedEmail(true);
      addToast(`Copied ${doc.officerEmail} to clipboard.`, 'success');
      window.setTimeout(() => setCopiedEmail(false), 2500);
    } catch {
      addToast(`Contact: ${doc.officerEmail}`, 'info');
    }
  };

  const handleSubmitComplianceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (reqEmail || currentUser?.email || '').trim().toLowerCase();
    const cleanName = sanitizeText(reqName || currentUser?.fullName || '', 120);
    const cleanDetails = sanitizeText(reqDetails, 1200);
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      addToast('Please enter a valid email address for compliance correspondence.', 'error');
      return;
    }

    const framework =
      doc.slug === 'popia' ? 'POPIA' : doc.slug === 'data-protection' ? 'DataProtection' : 'Privacy';

    setIsSubmittingReq(true);
    try {
      const { error } = await supabase.from('compliance_requests').insert({
        user_id: currentUser?.id || null,
        requester_email: cleanEmail,
        requester_name: cleanName || null,
        framework,
        request_type: reqType,
        details: cleanDetails || `${framework} formal ${reqType} request`,
        status: 'Submitted',
      });
      if (error) throw error;
      const refCode = `AE-${framework.toUpperCase().slice(0, 4)}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      setReqReference(refCode);
      setReqDetails('');
      addToast(`Compliance request submitted (${refCode}).`, 'success');
    } catch (err: any) {
      addToast(err?.message || 'Unable to submit compliance request right now.', 'error');
    } finally {
      setIsSubmittingReq(false);
    }
  };

  const navItems: Array<{ slug: CompliancePageSlug; label: string; icon: React.ElementType }> = [
    { slug: 'privacy-policy', label: 'Privacy Policy', icon: DocumentTextIcon },
    { slug: 'data-protection', label: 'Data Protection', icon: LockClosedIcon },
    { slug: 'popia', label: 'POPIA Compliance', icon: ScaleIcon },
  ];

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Top Contextual Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={nav.onBackHome}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0F2D25] dark:hover:text-[#C9A35D] transition-colors whitespace-nowrap"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to AfriEstate Marketplace</span>
          </button>

          <div className="flex flex-wrap items-center gap-1.5">
            {navItems.map((item) => {
              const active = item.slug === doc.slug;
              const Icon = item.icon;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => nav.onNavigateCompliance(item.slug)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#0F2D25] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#C9A35D]' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Branded Hero Header */}
      <section className="bg-[#0B1F1A] text-white py-14 sm:py-20 px-6 sm:px-10 lg:px-16 border-b border-emerald-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C9A35D]">
              {doc.eyebrow}
            </p>
            <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-white">
              {doc.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
              {doc.subtitle}
            </p>
          </div>

          <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2.5">
              <span className="text-slate-400">Document Reference</span>
              <span className="font-mono font-semibold text-[#C9A35D] tabular-nums">{doc.referenceCode}</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2.5">
              <span className="text-slate-400">Effective Date</span>
              <span className="font-mono text-white tabular-nums">{doc.effectiveDate}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Framework</span>
              <span className="text-emerald-200 font-medium text-right">{doc.jurisdiction}</span>
            </div>
          </div>
        </div>

        {/* Highlights Strip */}
        <div className="max-w-7xl mx-auto mt-10 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {doc.highlights.map((h) => (
            <div key={h.label}>
              <p className="text-xs uppercase tracking-wider text-slate-400">{h.label}</p>
              <p className="text-base sm:text-lg font-semibold text-white mt-1">{h.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial Body + Sticky Index */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Sticky Navigation Index */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                Document Contents
              </p>
              <nav className="space-y-1.5">
                {doc.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="flex items-baseline gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#0F2D25] dark:hover:text-[#C9A35D] transition-colors"
                  >
                    <span className="font-mono text-[11px] font-bold text-[#C9A35D] tabular-nums shrink-0">
                      {section.index}
                    </span>
                    <span>{section.title}</span>
                  </a>
                ))}
              </nav>
            </div>

            {/* Officer Desk Card */}
            <div className="bg-[#0B1F1A] text-white rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheckIcon className="w-5 h-5 text-[#C9A35D] shrink-0" />
                <h2 className="text-sm font-semibold">{doc.officerTitle}</h2>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                For formal data subject requests, verification governance enquiries, or statutory compliance correspondence:
              </p>
              <div className="flex items-center justify-between gap-2 bg-white/10 rounded-lg px-3 py-2.5">
                <span className="font-mono text-xs text-white truncate">{doc.officerEmail}</span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#C9A35D] hover:text-amber-200 shrink-0"
                >
                  {copiedEmail ? (
                    <>
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="pt-1 flex flex-wrap gap-2">
                {nav.onOpenContact && (
                  <button
                    type="button"
                    onClick={nav.onOpenContact}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#C9A35D] hover:bg-amber-300 text-[#0B1F1A] text-xs font-semibold transition-colors"
                  >
                    Contact Support
                  </button>
                )}
                {nav.onOpenDashboard && (
                  <button
                    type="button"
                    onClick={nav.onOpenDashboard}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                  >
                    My Workspace
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Articles */}
        <article className="lg:col-span-8 space-y-10">
          {doc.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-4 scroll-mt-24"
            >
              <div className="flex items-baseline gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="font-mono text-sm font-bold text-[#C9A35D] tabular-nums">
                  {section.index}
                </span>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {section.title}
                </h2>
              </div>

              <div className="space-y-3.5 text-sm sm:text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {section.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              {section.bullets && section.bullets.length > 0 && (
                <ul className="space-y-2.5 pt-2">
                  {section.bullets.map((b, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-4 py-3"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0F2D25] dark:bg-[#C9A35D] mt-2 shrink-0" />
                      <span className="leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.callout && (
                <div className="mt-4 rounded-xl bg-[#0B1F1A] text-white p-5 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A35D]">
                    {section.callout.title}
                  </p>
                  <p className="text-sm text-slate-200 leading-relaxed">{section.callout.body}</p>
                </div>
              )}
            </section>
          ))}

          {/* Interactive Data Subject & POPIA Request Desk */}
          <section
            id="submit-compliance-request"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-5"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A35D]">
                  Direct Statutory Portal
                </p>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  Submit a {doc.slug === 'popia' ? 'POPIA' : doc.slug === 'data-protection' ? 'Data Protection' : 'Privacy'} Request
                </h2>
              </div>
              <ShieldCheckIcon className="w-6 h-6 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
            </div>

            {reqReference ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-5 space-y-2">
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Request Logged &amp; Queued ({reqReference})
                </p>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Your statutory request has been recorded in AfriEstate&apos;s compliance ledger and routed to the {doc.officerTitle}.
                </p>
                <button
                  type="button"
                  onClick={() => setReqReference(null)}
                  className="text-xs font-semibold text-[#0F2D25] dark:text-[#C9A35D] underline pt-1"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitComplianceRequest} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={reqName}
                      onChange={(e) => setReqName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-[#0F2D25]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={reqEmail}
                      onChange={(e) => setReqEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-[#0F2D25]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Request Classification
                  </label>
                  <select
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-[#0F2D25]"
                  >
                    <option value="access_export">Access &amp; Export My Data (POPIA Sec 23)</option>
                    <option value="rectification">Rectify / Correct Personal Records (Sec 24 / Form 2)</option>
                    <option value="erasure">Delete / Destroy Personal Data (Sec 24 / Form 2)</option>
                    <option value="objection">Object to Processing (Sec 11(3) / Form 1)</option>
                    <option value="consent_withdrawal">Withdraw Direct Marketing Consent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Request Scope &amp; Details
                  </label>
                  <textarea
                    rows={3}
                    value={reqDetails}
                    onChange={(e) => setReqDetails(e.target.value)}
                    placeholder="Describe the account email, booking reference, or specific records covered by this request..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-[#0F2D25]"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Handled by {doc.officerTitle}
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmittingReq}
                    className="px-5 py-2.5 rounded-lg bg-[#0F2D25] hover:bg-[#173f34] disabled:opacity-60 text-white text-xs font-semibold transition-colors"
                  >
                    {isSubmittingReq ? 'Submitting...' : 'Submit Statutory Request'}
                  </button>
                </div>
              </form>
            )}
          </section>

          <WidgetTabGroup
            title="Self-Service Security, Privacy &amp; Cookie Consent Toolkit"
            subtitle="Generate compliant cookie consent banners, verify contact emails or policy URLs, screen breach exposure, and check document hashes under POPIA Section 19 controls."
            toolIds={['cookie-consent', 'breach-checker', 'password-strength', 'hash-compare', 'validate-email', 'validate-url']}
          />
        </article>
      </div>
    </div>
  );
};

export const PrivacyPolicyPage: React.FC<Omit<ComplianceNavProps, 'activeSlug'>> = (props) => (
  <BrandedComplianceShell doc={PRIVACY_DOCUMENT} nav={{ ...props, activeSlug: 'privacy-policy' }} />
);

export const DataProtectionPage: React.FC<Omit<ComplianceNavProps, 'activeSlug'>> = (props) => (
  <BrandedComplianceShell doc={DATA_PROTECTION_DOCUMENT} nav={{ ...props, activeSlug: 'data-protection' }} />
);

export const PopiaCompliancePage: React.FC<Omit<ComplianceNavProps, 'activeSlug'>> = (props) => (
  <BrandedComplianceShell doc={POPIA_DOCUMENT} nav={{ ...props, activeSlug: 'popia' }} />
);
