/**
 * =========================================================================
 * AFRIESTATE — ENTERPRISE SUPER ADMIN SOVEREIGN DATA REGISTRIES
 * =========================================================================
 */

export interface SovereignUser {
  id: string;
  name: string;
  role: "Normal User" | "Agent" | "Investor" | "Agency" | "Developer";
  agency?: string;
  email: string;
  phone: string;
  location: string;
  status: "Active" | "Suspended" | "Pending Verification" | "Restricted";
  riskScore: number; // 0 to 100
  walletBalance: number; // in ZAR equivalent
  investments: number; // in ZAR equivalent
  listings: number;
  kycStatus: "Approved" | "Pending" | "Flagged" | "Not Submitted";
  fingerprint: string;
  lastActive: string;
  geoHistory: string[];
  isWalletFrozen: boolean;
  notesHistory: string[];
}

export interface PropertyListing {
  id: string;
  title: string;
  location: string;
  region: "Southern Africa" | "West Africa" | "East Africa" | "North Africa";
  price: number; // in ZAR equivalent
  status: "Verified Active" | "Pending Approval" | "Flagged Listings" | "Expired";
  authenticityScore: number; // 0 to 100
  occupancyPrediction: string; // e.g., "94%"
  reitEligible: boolean;
  investmentPotential: number; // 0 to 100
  size: string;
  type: "Luxury Portfolio" | "Commercial Retail" | "Fractional Hub" | "Affordable Housing";
  ownerId: string;
  valuationTrend: string; // "+14.2% YoY"
}

export interface EscrowTransaction {
  id: string;
  senderName: string;
  receiverName: string;
  amount: number; // ZAR
  fee: number; // ZAR
  region: "Southern Africa" | "West Africa" | "East Africa" | "North Africa";
  type: "Investor Payout" | "Escrow Deposit" | "Broker Commission" | "REIT Dividend";
  status: "Completed" | "Pending Escrow" | "Frozen Locked" | "Reversed";
  date: string;
  amlFlagged: boolean;
  currencyCodeUsed: string;
}

export interface ComplianceCase {
  id: string;
  subjectName: string;
  subjectRole: string;
  riskScore: number;
  details: string;
  dateCreated: string;
  status: "Approved Secure" | "Under EDD Review" | "Escalated to Counsel" | "Action Required";
  documentName: string;
  caselog: string[];
}

export interface ModerationReport {
  id: string;
  reportingUser: string;
  contentType: "Review" | "Forum Post" | "Property Listing" | "Chat Private Log";
  issue: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Pending Investigation" | "Content Removed" | "Warning Issued" | "Dismissed";
  reportedValue: string;
  dateCreated: string;
}

export interface HealthService {
  id: string;
  name: string;
  status: "ONLINE" | "DEGRADED" | "OUTAGE" | "SYNCING";
  latency: string;
  cpuLoad: string;
  uptime: string;
}

export interface CyberThreat {
  id: string;
  sourceIp: string;
  location: string;
  attackType: "Brute Force Auth" | "DDoS Velocity Spike" | "API Unauthorized Probing" | "Cross-Site Script Attempt";
  severity: "CRITICAL" | "ELEVATED" | "INFO";
  status: "Active Attack" | "Mitigated Isolate" | "Under Scrutiny";
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userEmail: string;
  subject: string;
  message: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "Open Tickets" | "In Progress" | "SLA Escalation" | "Resolved";
  assignedTeam: string;
  dateCreated: string;
}

// Seeded Datasets
export const SEED_USERS: SovereignUser[] = [
  {
    id: "USR-0941",
    name: "Tendai Chimuzu",
    role: "Agent",
    agency: "Afriland Sotheby's",
    email: "tendai@afrilandsothebys.co.za",
    phone: "+27 21 884-2104",
    location: "Cape Town, South Africa",
    status: "Active",
    riskScore: 14,
    walletBalance: 85240,
    investments: 0,
    listings: 18,
    kycStatus: "Approved",
    fingerprint: "sys_fp_f392a8e8b0a9c8b",
    lastActive: "2 mins ago",
    geoHistory: ["Cape Town High Precinct (GPS Verified)", "Stellenbosch Cell Tower", "Pretoria VPN"],
    isWalletFrozen: false,
    notesHistory: ["System verified FFC registration for 2026. Audit passed."]
  },
  {
    id: "USR-1102",
    name: "Chioma Adebayo",
    role: "Agent",
    agency: "Lekki Prime Properties Ltd",
    email: "chioma.adebayo@lekkiprime.com",
    phone: "+234 812 405 8812",
    location: "Lagos, Nigeria",
    status: "Active",
    riskScore: 48,
    walletBalance: 194200,
    investments: 500000,
    listings: 24,
    kycStatus: "Approved",
    fingerprint: "sys_fp_9ea410ff981249b",
    lastActive: "15 mins ago",
    geoHistory: ["Lekki Phase 1 Node", "Lagos Central Hub Router", "London Proxy (Suspicious Bypass)"],
    isWalletFrozen: false,
    notesHistory: ["Cross-border bypass detected. Investigated, resolved as business relocation travel."]
  },
  {
    id: "USR-3401",
    name: "Faraji Nyong'o",
    role: "Investor",
    agency: "Nairobi Westlands Co-Invest",
    email: "faraji.nyongo@westlandsreit.org",
    phone: "+254 711 990 412",
    location: "Nairobi, Kenya",
    status: "Active",
    riskScore: 8,
    walletBalance: 2450000,
    investments: 12500000,
    listings: 0,
    kycStatus: "Approved",
    fingerprint: "sys_fp_f492acfe12480bb",
    lastActive: "1 hour ago",
    geoHistory: ["Nairobi Westlands Hub GPS", "Kilimani Node"],
    isWalletFrozen: false,
    notesHistory: ["UHNW Accredited Investor. Completed full biometric verification."]
  },
  {
    id: "USR-4402",
    name: "Zenebech Selassie",
    role: "Agent",
    agency: "Sovereign Housing Africa",
    email: "zenebech.s@sovereignhousing.com",
    phone: "+27 11 392 7731",
    location: "Soweto, South Africa",
    status: "Pending Verification",
    riskScore: 88,
    walletBalance: 5120,
    investments: 0,
    listings: 9,
    kycStatus: "Flagged",
    fingerprint: "sys_fp_cd92491bfa982a3",
    lastActive: "1 day ago",
    geoHistory: ["Johannesburg Central Precinct", "Host Router Mismatch Flag"],
    isWalletFrozen: true,
    notesHistory: ["FFC Certificate license expired on 2025-12-31. System auto-flagged user and restricted asset withdrawals."]
  },
  {
    id: "USR-5110",
    name: "Kofi Mensah",
    role: "Developer",
    agency: "Accra Green-Belt Tech Developers",
    email: "k.mensah@accradev.io",
    phone: "+233 24 555 9011",
    location: "Accra, Ghana",
    status: "Active",
    riskScore: 32,
    walletBalance: 1245000,
    investments: 8400000,
    listings: 15,
    kycStatus: "Approved",
    fingerprint: "sys_fp_881cfd019ab7c31",
    lastActive: "4 mins ago",
    geoHistory: ["Accra Airport Residential Zone", "East Legon Mobile Tower"],
    isWalletFrozen: false,
    notesHistory: ["Accra Green-Belt construction partner. Validated local license F32-901."]
  },
  {
    id: "USR-6204",
    name: "Abdel El-Amin",
    role: "Investor",
    email: "abdel.amin@cairoventures.eg",
    phone: "+20 10 9411 0244",
    location: "Cairo, Egypt",
    status: "Active",
    riskScore: 5,
    walletBalance: 8190000,
    investments: 32400000,
    listings: 0,
    kycStatus: "Approved",
    fingerprint: "sys_fp_e04ae98d73b2241",
    lastActive: "3 mins ago",
    geoHistory: ["New Cairo Smart City Precinct", "Giza Gateway"],
    isWalletFrozen: false,
    notesHistory: ["Sovereign accredited co-investor since 2024. Clear profile score."]
  },
  {
    id: "USR-7705",
    name: "Amara Diallo",
    role: "Normal User",
    email: "amara.diallo@senegalweb.sn",
    phone: "+221 77 412 8090",
    location: "Dakar, Senegal",
    status: "Suspended",
    riskScore: 95,
    walletBalance: 0,
    investments: 0,
    listings: 2,
    kycStatus: "Not Submitted",
    fingerprint: "sys_fp_dc90192e4ba8201",
    lastActive: "3 days ago",
    geoHistory: ["Dakar Central Ingress IP VPN", "Netherlands Commercial TOR Node"],
    isWalletFrozen: true,
    notesHistory: ["Coordinated listing scraping detected. Suspicious connection sequence blocked under automatic anti-DDoS filter."]
  },
  {
    id: "USR-8819",
    name: "Zola Ndlovu",
    role: "Investor",
    email: "zola.ndlovu@gautengtrust.co.za",
    phone: "+27 12 704 0241",
    location: "Pretoria, South Africa",
    status: "Active",
    riskScore: 12,
    walletBalance: 420000,
    investments: 7100000,
    listings: 0,
    kycStatus: "Approved",
    fingerprint: "sys_fp_621ba89f029ac83",
    lastActive: "30 mins ago",
    geoHistory: ["Pretoria Sovereign Node (GPS Verified)"],
    isWalletFrozen: false,
    notesHistory: ["Completed regular bi-annual compliance verification."]
  }
];

export const SEED_LISTINGS: PropertyListing[] = [
  {
    id: "PRP-2021",
    title: "Rust-en-Vrede Cultural Co-Investments",
    location: "Durbanville, Cape Town",
    region: "Southern Africa",
    price: 34500000,
    status: "Verified Active",
    authenticityScore: 98,
    occupancyPrediction: "96.4%",
    reitEligible: true,
    investmentPotential: 92,
    size: "4,200 m²",
    type: "REIT Commercial",
    ownerId: "USR-3401",
    valuationTrend: "+14.2% YoY"
  },
  {
    id: "PRP-3108",
    title: "Lekki Meridian Sovereign Ocean View",
    location: "Lekki Phase 1, Lagos",
    region: "West Africa",
    price: 85200000,
    status: "Verified Active",
    authenticityScore: 91,
    occupancyPrediction: "91.2%",
    reitEligible: true,
    investmentPotential: 95,
    size: "12,400 m²",
    type: "Luxury Portfolio",
    ownerId: "USR-1102",
    valuationTrend: "+18.7% YoY"
  },
  {
    id: "PRP-4091",
    title: "Nairobi Westlands Green Tech fractional",
    location: "Westlands, Nairobi",
    region: "East Africa",
    price: 8400000,
    status: "Verified Active",
    authenticityScore: 97,
    occupancyPrediction: "88.6%",
    reitEligible: true,
    investmentPotential: 89,
    size: "820 m²",
    type: "Fractional Hub",
    ownerId: "USR-5110",
    valuationTrend: "+11.5% YoY"
  },
  {
    id: "PRP-0112",
    title: "Durbanville Waterfront Luxury Duplex",
    location: "Durbanville, Cape Town",
    region: "Southern Africa",
    price: 18500000,
    status: "Pending Approval",
    authenticityScore: 74,
    occupancyPrediction: "94.0%",
    reitEligible: false,
    investmentPotential: 84,
    size: "340 m²",
    type: "Luxury Portfolio",
    ownerId: "USR-0941",
    valuationTrend: "+13.1% YoY"
  },
  {
    id: "PRP-5912",
    title: "Osu Commercial High-Street fractional Retail",
    location: "Osu, Accra",
    region: "West Africa",
    price: 11200000,
    status: "Verified Active",
    authenticityScore: 95,
    occupancyPrediction: "93.1%",
    reitEligible: true,
    investmentPotential: 86,
    size: "1,150 m²",
    type: "Fractional Hub",
    ownerId: "USR-5110",
    valuationTrend: "+12.9% YoY"
  },
  {
    id: "PRP-8812",
    title: "Eco-District Smart Residential Soweto",
    location: "Soweto, Johannesburg",
    region: "Southern Africa",
    price: 4900000,
    status: "Flagged Listings",
    authenticityScore: 32,
    occupancyPrediction: "42.0%",
    reitEligible: false,
    investmentPotential: 20,
    size: "520 m²",
    type: "Affordable Housing",
    ownerId: "USR-4402",
    valuationTrend: "+1.2% YoY"
  },
  {
    id: "PRP-9041",
    title: "The Sphinx Sovereign Administrative Plaza",
    location: "New Capital, Cairo",
    region: "North Africa",
    price: 145000000,
    status: "Verified Active",
    authenticityScore: 99,
    occupancyPrediction: "92.4%",
    reitEligible: true,
    investmentPotential: 97,
    size: "31,000 m²",
    type: "REIT Commercial",
    ownerId: "USR-6204",
    valuationTrend: "+15.6% YoY"
  },
  {
    id: "PRP-1011",
    title: "Pretoria Diplomatic Residential Estate",
    location: "Pretoria, South Africa",
    region: "Southern Africa",
    price: 24000000,
    status: "Expired",
    authenticityScore: 90,
    occupancyPrediction: "82.5%",
    reitEligible: true,
    investmentPotential: 78,
    size: "890 m²",
    type: "Luxury Portfolio",
    ownerId: "USR-8819",
    valuationTrend: "+8.5% YoY"
  }
];

export const SEED_TRANSACTIONS: EscrowTransaction[] = [
  {
    id: "TX-49121",
    senderName: "Faraji Nyong'o (Investor)",
    receiverName: "Pretoria Sovereign Escrow Vault",
    amount: 4900000,
    fee: 49000,
    region: "Southern Africa",
    type: "Escrow Deposit",
    status: "Completed",
    date: "2026-06-12 11:24",
    amlFlagged: false,
    currencyCodeUsed: "ZAR"
  },
  {
    id: "TX-38010",
    senderName: "Durbanville Fractional Custody Pool",
    receiverName: "Zola Ndlovu (Investor)",
    amount: 142050,
    fee: 0,
    region: "Southern Africa",
    type: "REIT Dividend",
    status: "Completed",
    date: "2026-06-12 09:44",
    amlFlagged: false,
    currencyCodeUsed: "ZAR"
  },
  {
    id: "TX-99042",
    senderName: "Alexandria Escrow Holding Node",
    receiverName: "Tendai Chimuzu (Broker)",
    amount: 51200,
    fee: 1024,
    region: "Southern Africa",
    type: "Broker Commission",
    status: "Completed",
    date: "2026-06-12 08:32",
    amlFlagged: false,
    currencyCodeUsed: "ZAR"
  },
  {
    id: "TX-08812",
    senderName: "Sovereign REIT Treasury Node",
    receiverName: "Abdel El-Amin (Investor)",
    amount: 12400000,
    fee: 124000,
    region: "North Africa",
    type: "Investor Payout",
    status: "Pending Escrow",
    date: "2026-06-12 12:49",
    amlFlagged: false,
    currencyCodeUsed: "ZAR"
  },
  {
    id: "TX-22194",
    senderName: "Lagos Hub Settlement Pool",
    receiverName: "Zenebech Selassie (Agent)",
    amount: 185000,
    fee: 3700,
    region: "West Africa",
    type: "Broker Commission",
    status: "Frozen Locked",
    date: "2026-06-11 14:15",
    amlFlagged: true,
    currencyCodeUsed: "ZAR"
  }
];

export const SEED_COMPLIANCE_CASES: ComplianceCase[] = [
  {
    id: "CMP-0012",
    subjectName: "Zenebech Selassie",
    subjectRole: "Agent (Gauteng)",
    riskScore: 88,
    details: "Mismatched FFC Credential - Active listings under expired license hash.",
    dateCreated: "1 day ago",
    status: "Under EDD Review",
    documentName: "SA_Regulator_FFC_2026.pdf",
    caselog: [
      "[System Guard] Compliance Case initiated automatically.",
      "[Risk Analyzer] Sanction lists clear, but regulatory FFC mismatch.",
      "[SuperAdmin] Enhanced Due Diligence (EDD) triggered.",
      "[Agent Response] Acknowledged delay in renewal index."
    ]
  },
  {
    id: "CMP-0044",
    subjectName: "Kofi Mensah",
    subjectRole: "Developer (Accra)",
    riskScore: 32,
    details: "Accra Green-Belt construction license regular check-up.",
    dateCreated: "2 hours ago",
    status: "Approved Secure",
    documentName: "Ghana_Business_Registration.pdf",
    caselog: [
      "[System Guard] Regular regulatory scheduled audit.",
      "[Database Audit] Verification Match: Accra Municipal Council ID OK.",
      "[SuperAdmin] Compliance cleared."
    ]
  },
  {
    id: "CMP-0091",
    subjectName: "Amara Diallo",
    subjectRole: "Normal User (Dakar)",
    riskScore: 95,
    details: "TOR browser request velocity spike with multiple listing creation attempts.",
    dateCreated: "3 days ago",
    status: "Escalated to Counsel",
    documentName: "System_Heuristic_Fingerprint_Logs.txt",
    caselog: [
      "[Cyber Guard] Detected Tor Entry-Points bypassing territorial IP boundaries.",
      "[Auto Guard] Blocked access to escrow pools.",
      "[SuperAdmin] Escalated to legal counsel."
    ]
  }
];

export const SEED_MODERATION_REPORTS: ModerationReport[] = [
  {
    id: "MOD-492",
    reportingUser: "Xolani_CPT_8",
    contentType: "Property Listing",
    issue: "Duplicate listing Waterfront Durbanville - potential broker spoof",
    severity: "Critical",
    status: "Pending Investigation",
    reportedValue: "PRP-0112 (Waterfront Luxury Duplex)",
    dateCreated: "2 hours ago"
  },
  {
    id: "MOD-310",
    reportingUser: "AlphaTrust_Admin",
    contentType: "Review",
    issue: "Spam content and promotional URL payload in neighborhood guide review",
    severity: "Medium",
    status: "Content Removed",
    reportedValue: "User commented: 'BUY TOKENS HERE cheaprealestate.ru'",
    dateCreated: "4 hours ago"
  },
  {
    id: "MOD-290",
    reportingUser: "LagosNGR_Agent",
    contentType: "Chat Private Log",
    issue: "External cash-transfer bypass of platform escrow suggestion",
    severity: "High",
    status: "Warning Issued",
    reportedValue: "Broker message: 'Send the ₦50M directly to bank, not escrow.'",
    dateCreated: "1 day ago"
  }
];

export const SEED_SERVICES: HealthService[] = [
  { id: "SRV-01", name: "Sovereign Web App Core", status: "ONLINE", latency: "14ms", cpuLoad: "12%", uptime: "99.98%" },
  { id: "SRV-02", name: "Sovereign GopherML Cluster", status: "ONLINE", latency: "118ms", cpuLoad: "74%", uptime: "99.2%" },
  { id: "SRV-03", name: "Escrow Notary Contract Vault", status: "ONLINE", latency: "8ms", cpuLoad: "9%", uptime: "100%" },
  { id: "SRV-04", name: "Cape Town Notary Sync Core", status: "SYNCING", latency: "22ms", cpuLoad: "28%", uptime: "98.81%" },
  { id: "SRV-05", name: "Redis Anti-Fraud Risk Buffer", status: "ONLINE", latency: "2ms", cpuLoad: "5%", uptime: "99.99%" }
];

export const SEED_THREATS: CyberThreat[] = [
  { id: "THR-004", sourceIp: "102.132.88.192", location: "Lagos Hub, Nigeria", attackType: "Brute Force Auth", severity: "ELEVATED", status: "Under Scrutiny", timestamp: "5 mins ago" },
  { id: "THR-009", sourceIp: "185.220.101.44", location: "TOR Exit Node", attackType: "DDoS Velocity Spike", severity: "CRITICAL", status: "Active Attack", timestamp: "1 min ago" },
  { id: "THR-012", sourceIp: "84.19.41.2", location: "Sofia, Bulgaria", attackType: "API Unauthorized Probing", severity: "INFO", status: "Mitigated Isolate", timestamp: "30 mins ago" }
];

export const SEED_TICKETS: SupportTicket[] = [
  { id: "TCK-491", userEmail: "faraji@westlands.ke", subject: "REIT dividend payout conversion latency", message: "Escrow release #08812 is pending for past 2 hours. Normal conversion holds?", priority: "HIGH", status: "SLA Escalation", assignedTeam: "Escrow Settlements", dateCreated: "2 hours ago" },
  { id: "TCK-321", userEmail: "tendai@sothebys.za", subject: "Listing duplication warning override request", message: "My listing was locked as an apparent duplicate but I hold valid mandating letters.", priority: "MEDIUM", status: "Open Tickets", assignedTeam: "Properties Vetting", dateCreated: "4 hours ago" }
];

export const MACRO_SCENARIOS = [
  {
    id: "scen_1",
    title: "12% Vacancy Rate Stress Test",
    description: "Evaluates immediate cash impact of macroeconomic housing supply overflow in Cape Town and Lagos.",
    impact: "Elevated Risk",
    revenueOutcome: "-R 8,420,000",
    confidence: "94%",
    remediation: "Deploy dynamic pricing floors, automate landlord concession overrides, and re-allocate REIT liquidity reserves."
  },
  {
    id: "scen_2",
    title: "150bps Sovereign Interest Rate Flux",
    description: "Evaluates credit tightening in South Africa and Nigeria affecting retail fractional buyer ratios.",
    impact: "Critical Stress",
    revenueOutcome: "-R 18,950,000",
    confidence: "89%",
    remediation: "Freeze high-leverage starts, shift projects to 100% cash yield fractionalization, and trigger hedging buffers."
  },
  {
    id: "scen_3",
    title: "R42M Escrow Liquidity Fund Pullout",
    description: "Models rapid cross-border capital repatriation rules causing institutional pool withdraws.",
    impact: "High Strain",
    revenueOutcome: "-R 4,800,000",
    confidence: "97%",
    remediation: "Activate the Continental Escrow Liquidity Guard, lock secondary transfers, and release reserve pools."
  },
  {
    id: "scen_4",
    title: "Lekki-Epe Corridor Smart Rezoning",
    description: "Models state rezoning of East Lagos agricultural assets into high-growth investment properties.",
    impact: "Low / Opportunity",
    revenueOutcome: "+R 32,400,000",
    confidence: "92%",
    remediation: "Authorize proactive fractional purchasing, emission green token bonds, and raise credit limits."
  }
];

export const PRESET_AI_ASSISTANCE = [
  { text: "Detect agents with suspicious transaction patterns.", response: "AI ADVISOR: Identifying agents with cross-border TOR access and bank-routing mismatch. Found USR-4402 (Zenebech Selassie) with active FFC expired license and transaction velocity exceeding R120k. Recommends: Locked User USR-4402, freeze balance PRP-8812." },
  { text: "Forecast next quarter revenue", response: "PREDICTIVE YIELD: Model projects 12% revenue appreciation (+R 1,510,000) for South African residential REIT portfolios. West African land appreciation provides an additional R 2,240,000 buffer." },
  { text: "Show regions with declining occupancy but increasing investor activity", response: "GEOGRAPHICAL INTEL: Durbanville / Northern Precinct exhibits declining short-stay occupancy (down 4.2% due to off-season), but institutional co-investment capital inflows have elevated land-price valuations by +14.8% YoY." }
];
