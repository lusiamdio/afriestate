export type AfricanSubRegion =
  | 'Southern Africa'
  | 'East Africa'
  | 'West Africa'
  | 'North Africa'
  | 'Central Africa';

export type AfricanBloc = 'ECOWAS' | 'EAC' | 'SADC' | 'CEMAC' | 'COMESA' | 'AMU' | 'AU Open';

export type VisaRegime =
  | 'Visa-Free / Open Access'
  | 'eVisa / eTA Required'
  | 'Visa on Arrival'
  | 'Embassy / Consular Visa';

export type VisaTravelPurpose =
  | 'tourism'
  | 'property'
  | 'investment'
  | 'residency';

export interface AfricanCountryVisaProfile {
  iso2: string;
  name: string;
  capital: string;
  region: AfricanSubRegion;
  blocs: AfricanBloc[];
  defaultInternationalRegime: VisaRegime;
  africanAuPolicy:
    | 'Visa-Free All Africa'
    | 'eTA / eVisa All Africa'
    | 'Bloc Visa-Free + VoA'
    | 'Reciprocal / Consular';
  stayLimitDays: number;
  processingWindow: string;
  feeBandUsd: string;
  passportValidity: string;
  yellowFeverRule: string;
  officialPortal: string;
  bureaucraticSteps: string[];
  requiredDocuments: string[];
  propertyInvestorAdvisory: string;
}

export interface PassportOption {
  value: string;
  label: string;
  isAfrican: boolean;
  blocs: AfricanBloc[];
}

export const PASSPORT_OPTIONS: PassportOption[] = [
  { value: 'South Africa', label: 'South Africa (SADC)', isAfrican: true, blocs: ['SADC'] },
  { value: 'Nigeria', label: 'Nigeria (ECOWAS)', isAfrican: true, blocs: ['ECOWAS'] },
  { value: 'Kenya', label: 'Kenya (EAC / COMESA)', isAfrican: true, blocs: ['EAC', 'COMESA'] },
  { value: 'Ghana', label: 'Ghana (ECOWAS)', isAfrican: true, blocs: ['ECOWAS'] },
  { value: 'Morocco', label: 'Morocco (AMU)', isAfrican: true, blocs: ['AMU'] },
  { value: 'Egypt', label: 'Egypt (COMESA)', isAfrican: true, blocs: ['COMESA'] },
  { value: 'Rwanda', label: 'Rwanda (EAC / AU Open)', isAfrican: true, blocs: ['EAC', 'COMESA', 'AU Open'] },
  { value: 'Botswana', label: 'Botswana (SADC)', isAfrican: true, blocs: ['SADC'] },
  { value: 'Senegal', label: 'Senegal (ECOWAS)', isAfrican: true, blocs: ['ECOWAS'] },
  { value: 'Cameroon', label: 'Cameroon (CEMAC)', isAfrican: true, blocs: ['CEMAC'] },
  { value: 'Ethiopia', label: 'Ethiopia (COMESA)', isAfrican: true, blocs: ['COMESA'] },
  { value: 'Tanzania', label: 'Tanzania (EAC / SADC)', isAfrican: true, blocs: ['EAC', 'SADC'] },
  { value: 'United Kingdom', label: 'United Kingdom (UK)', isAfrican: false, blocs: [] },
  { value: 'United States', label: 'United States (USA)', isAfrican: false, blocs: [] },
  { value: 'European Union', label: 'EU / Schengen Passport', isAfrican: false, blocs: [] },
  { value: 'United Arab Emirates', label: 'United Arab Emirates (UAE)', isAfrican: false, blocs: [] },
  { value: 'India', label: 'India', isAfrican: false, blocs: [] },
  { value: 'China', label: 'China', isAfrican: false, blocs: [] },
];

const c = (
  iso2: string,
  name: string,
  capital: string,
  region: AfricanSubRegion,
  blocs: AfricanBloc[],
  defaultInternationalRegime: VisaRegime,
  africanAuPolicy: AfricanCountryVisaProfile['africanAuPolicy'],
  stayLimitDays: number,
  processingWindow: string,
  feeBandUsd: string,
  yellowFeverRule: string,
  officialPortal: string,
  propertyInvestorAdvisory: string,
  customSteps?: string[]
): AfricanCountryVisaProfile => ({
  iso2,
  name,
  capital,
  region,
  blocs,
  defaultInternationalRegime,
  africanAuPolicy,
  stayLimitDays,
  processingWindow,
  feeBandUsd,
  passportValidity: '6 months beyond intended exit · 2 blank consecutive pages',
  yellowFeverRule,
  officialPortal,
  bureaucraticSteps: customSteps || [
    `Verify passport eligibility on ${officialPortal} and select correct entry category (Tourist, Business/Investor, or Residency).`,
    defaultInternationalRegime === 'Embassy / Consular Visa'
      ? `Book biometric appointment at the nearest diplomatic mission or VFS centre with notarized invitation or hotel confirmation.`
      : defaultInternationalRegime === 'eVisa / eTA Required'
      ? `Submit digital application via ${officialPortal}, upload passport bio-page & accommodation proof, and settle portal fees online.`
      : `Present valid return/onward ticket, confirmed accommodation voucher, and proof of funds at primary port of entry.`,
    `Complete customs & foreign currency declaration on arrival; keep entry stamp or eTA QR slip accessible for hotel & bank KYC.`,
    `For property viewings or corporate filings exceeding ${stayLimitDays} days, lodge an immigration extension prior to expiry.`,
  ],
  requiredDocuments: [
    'Machine-readable passport (min. 6 months validity, 2+ blank pages)',
    'Confirmed return or onward flight itinerary',
    'Verified hotel reservation or local host invitation letter',
    'Proof of sufficient funds (recent 3-month bank statement)',
  ],
  propertyInvestorAdvisory,
});

// Complete directory of all 54 sovereign African nations
export const AFRICA_54_VISA_DIRECTORY: AfricanCountryVisaProfile[] = [
  // NORTH AFRICA (7)
  c(
    'DZ',
    'Algeria',
    'Algiers',
    'North Africa',
    ['AMU'],
    'Embassy / Consular Visa',
    'Reciprocal / Consular',
    30,
    '10–15 business days',
    '$60 – $110',
    'Required if arriving from Yellow Fever endemic countries',
    'Ministry of Foreign Affairs & Consular Portal',
    'Foreign property acquisitions require prior notarized Wilaya authorization; request a formal Business/Investor Visa backed by local legal counsel.'
  ),
  c(
    'EG',
    'Egypt',
    'Cairo',
    'North Africa',
    ['COMESA'],
    'eVisa / eTA Required',
    'eTA / eVisa All Africa',
    30,
    '5–7 business days (eVisa)',
    '$25 single · $60 multi',
    'Required if arriving from Yellow Fever endemic regions within 6 days',
    'visa2egypt.gov.eg',
    'Foreigners may own up to two residential properties (max 4,000 sqm each) via Law 230/1996; property deeds over $100k support multi-year residency.',
    [
      'Apply online at visa2egypt.gov.eg at least 7 days prior to departure (or use diplomatic mission if nationality requires pre-clearance).',
      'Print e-Visa approval PDF and present alongside passport and hotel/host address at Cairo or Hurghada passport control.',
      'Register residential address with local Mugamma / immigration police within 7 days if staying in private leased accommodation.',
      'If buying property, obtain foreign exchange bank transfer certificates for future capital repatriation.'
    ]
  ),
  c(
    'LY',
    'Libya',
    'Tripoli',
    'North Africa',
    ['AMU', 'COMESA'],
    'Embassy / Consular Visa',
    'Reciprocal / Consular',
    30,
    '10–21 business days',
    '$75 – $150',
    'Mandatory if traveling from endemic zones',
    'Libyan e-Visa Portal (evisa.gov.ly)',
    'Commercial entry requires a licensed local sponsor registered with the Libyan Immigration Authority and certified Arabic translation of credentials.'
  ),
  c(
    'MR',
    'Mauritania',
    'Nouakchott',
    'North Africa',
    ['AMU'],
    'eVisa / eTA Required',
    'eTA / eVisa All Africa',
    30,
    '3–5 business days (eVisa)',
    '$55 – $65',
    'Mandatory if arriving from Yellow Fever risk zones',
    'anrpts.gov.mr (Mauritania eVisa)',
    'Pre-approved online eVisa is mandatory prior to boarding as of January 2025; commercial land deeds require Chamber of Commerce attestation.'
  ),
  c(
    'MA',
    'Morocco',
    'Rabat',
    'North Africa',
    ['AMU'],
    'eVisa / eTA Required',
    'Bloc Visa-Free + VoA',
    90,
    '24–72 hours (Acces Maroc)',
    '$0 (Exempt) – $77 eVisa',
    'Not required unless transiting high-risk zones',
    'acces-maroc.ma',
    'Foreigners enjoy full freehold property ownership (Titre Foncier) except agricultural land; bring convertible dirham bank proof for repatriation.',
    [
      'Check if passport is visa-exempt (90 days) or qualifies for 24–72h Acces Maroc eVisa (supports holders of valid UK/US/Schengen visas).',
      'Carry printed accommodation booking and return ticket for Tangier, Casablanca (CMN), or Marrakech immigration inspection.',
      'Request an Entry Stamp check at desk before exiting; missing entry stamps block hotel registration and notary deed signings.',
      'To acquire titled real estate, open a convertible Dirham bank account before signing the Compromis de Vente.'
    ]
  ),
  c(
    'SD',
    'Sudan',
    'Khartoum',
    'North Africa',
    ['COMESA'],
    'Embassy / Consular Visa',
    'Reciprocal / Consular',
    30,
    '10–15 business days',
    '$50 – $150',
    'Mandatory for arrivals from Yellow Fever endemic zones',
    'Sudanese Diplomatic Missions & Port Sudan Consular Desk',
    'All foreign real estate and infrastructure visits require advance Ministry of Interior travel clearance and registered local legal representation.'
  ),
  c(
    'TN',
    'Tunisia',
    'Tunis',
    'North Africa',
    ['AMU', 'COMESA'],
    'Visa-Free / Open Access',
    'Bloc Visa-Free + VoA',
    90,
    'Instant / 5–10 days consular',
    '$0 – $65',
    'Required from Yellow Fever endemic areas',
    'diplomatie.gov.tn',
    'Non-resident property buyers require Governor (Wali) authorization plus Central Bank investment sheet (Fiche d\'Investissement) for full transfer rights.'
  ),

  // WEST AFRICA (16)
  c(
    'BJ',
    'Benin',
    'Porto-Novo',
    'West Africa',
    ['ECOWAS', 'AU Open'],
    'Visa-Free / Open Access',
    'Visa-Free All Africa',
    90,
    'Visa-free Africans · 48h eVisa',
    '$0 African · $50–$100 Intl',
    'Mandatory Yellow Fever ICVP certificate for all travelers > 9 months',
    'evisa.bj',
    'All African passport holders enjoy visa-free entry (up to 90 days); urban freehold titles (Titre Foncier) in Cotonou are registered via ANDF.'
  ),
  c(
    'BF',
    'Burkina Faso',
    'Ouagadougou',
    'West Africa',
    ['ECOWAS'],
    'eVisa / eTA Required',
    'Bloc Visa-Free + VoA',
    90,
    '3–5 business days (eVisa)',
    '$0 ECOWAS · $90 Intl',
    'Mandatory Yellow Fever vaccination certificate for all arrivals',
    'visaburkina.bf',
    'ECOWAS citizens enter visa-free with national ID or passport; commercial land leases require Ministry of Urbanism cadastral registration.'
  ),
  c(
    'CV',
    'Cabo Verde',
    'Praia',
    'West Africa',
    ['ECOWAS'],
    'eVisa / eTA Required',
    'Bloc Visa-Free + VoA',
    30,
    'Pre-registration 5 days before arrival (EASE)',
    '$35 Airport Security Tax (TSA)',
    'Required if arriving from endemic countries',
    'ease.gov.cv',
    'Strong tourism villa & Green Card residency track for retirees and foreign resort buyers; complete EASE pre-travel tax clearance online.'
  ),
  c(
    'CI',
    "Côte d'Ivoire",
    'Yamoussoukro',
    'West Africa',
    ['ECOWAS'],
    'eVisa / eTA Required',
    'Bloc Visa-Free + VoA',
    90,
    '48 hours (SNEDAI eVisa)',
    '$0 ECOWAS · $78 Intl',
    'Mandatory Yellow Fever ICVP for all arrivals > 9 months',
    'snedai.com/e-visa',
    'Abidjan Zone 4 & Riviera allow foreign commercial & residential title acquisition (ACD); ECOWAS citizens enter visa-free for 90 days.'
  ),
  c(
    'GM',
    'Gambia',
    'Banjul',
    'West Africa',
    ['ECOWAS', 'AU Open'],
    'Visa-Free / Open Access',
    'Visa-Free All Africa',
    90,
    'Visa-free AU & Commonwealth · 5 days consular',
    '$0 AU · $50–$75 others',
    'Mandatory from Yellow Fever endemic zones',
    'gid.gov.gm',
    'African Union and Commonwealth travelers generally enter visa-free or receive Airport Immigration Clearance on arrival; beachfront leases run 50–99 years.'
  ),
  c(
    'GH',
    'Ghana',
    'Accra',
    'West Africa',
    ['ECOWAS', 'AU Open'],
    'Visa on Arrival',
    'Visa-Free All Africa',
    60,
    'Instant ECOWAS & AU policy · 5–10d eVisa/Embassy',
    '$0 ECOWAS · $75–$150 Intl',
    'Strict mandatory Yellow Fever ICVP check at Kotoka Airport before immigration',
    'gis.gov.gh',
    'Foreigners qualify for 50-year renewable leases under the Lands Commission; Airport Residential, Cantonments & East Legon require lawyer title search.',
    [
      'Present Yellow Fever International Certificate (ICVP) at Port Health desk immediately on arrival at Kotoka International Airport (ACC).',
      'ECOWAS citizens enter visa-free (90 days); AU nationals utilize visa-free / pre-arranged VoA under Ghana AU Open Skies reciprocity.',
      'International passports complete embassy visa or pre-approved GIS Visa-on-Arrival prior to boarding.',
      'For property closings, obtain Non-Citizen Ghana Card before executing Lands Commission lease stamping.'
    ]
  ),
  c(
    'GN',
    'Guinea',
    'Conakry',
    'West Africa',
    ['ECOWAS'],
    'eVisa / eTA Required',
    'Bloc Visa-Free + VoA',
    90,
    '3–5 business days (eVisa)',
    '$0 ECOWAS · $80 Intl',
    'Mandatory Yellow Fever vaccination certificate for all arrivals',
    'paf.gov.gn',
    'ECOWAS citizens enjoy 90-day visa-free entry; corporate mining and Conakry real estate ventures require APIP investment registration.'
  ),
  c(
    'GW',
    'Guinea-Bissau',
    'Bissau',
    'West Africa',
    ['ECOWAS'],
    'Visa on Arrival',
    'Bloc Visa-Free + VoA',
    90,
    'Instant VoA / ECOWAS free',
    '$0 ECOWAS · $95 VoA',
    'Mandatory Yellow Fever certificate for all travelers',
    'Guinea-Bissau Consular & Border Service',
    'ECOWAS nationals enter visa-free; foreign land concessions require Ministry of Territorial Administration verification.'
  ),
  c(
    'LR',
    'Liberia',
    'Monrovia',
    'West Africa',
    ['ECOWAS'],
    'Visa on Arrival',
    'Bloc Visa-Free + VoA',
    30,
    '3–7 business days (VoA pre-clearance / Embassy)',
    '$0 ECOWAS · $75–$160 Intl',
    'Mandatory Yellow Fever ICVP check at Roberts International Airport',
    'lis.gov.lr',
    'Under Liberia’s Constitution, freehold land ownership is restricted to Liberian citizens; foreign investors structure long-term leases via NIC.'
  ),
  c(
    'ML',
    'Mali',
    'Bamako',
    'West Africa',
    ['ECOWAS'],
    'Embassy / Consular Visa',
    'Bloc Visa-Free + VoA',
    30,
    '5–10 business days',
    '$0 ECOWAS · $80–$120 Intl',
    'Mandatory Yellow Fever certificate for all entrants',
    'diplomatiemali.ml',
    'ECOWAS citizens enter visa-free; non-ECOWAS visitors need advance consular visas and hotel police registration in Bamako.'
  ),
  c(
    'NE',
    'Niger',
    'Niamey',
    'West Africa',
    ['ECOWAS'],
    'Embassy / Consular Visa',
    'Bloc Visa-Free + VoA',
    30,
    '5–10 business days',
    '$0 ECOWAS · $80–$130 Intl',
    'Mandatory Yellow Fever certificate for all travelers',
    'Niger Consular Missions',
    'ECOWAS free-movement rules apply; commercial real estate and energy contractors must register local sponsor invitations ahead of travel.'
  ),
  c(
    'NG',
    'Nigeria',
    'Abuja',
    'West Africa',
    ['ECOWAS'],
    'eVisa / eTA Required',
    'Bloc Visa-Free + VoA',
    30,
    '48–72 hours (NIS VoA Pre-Approval)',
    '$0 ECOWAS · $110–$210 Intl',
    'Mandatory Yellow Fever Yellow Card checked strictly at LOS & ABV',
    'immigration.gov.ng',
    'ECOWAS citizens enter visa-free; non-ECOWAS investors obtain NIS Visa-on-Arrival pre-approval letter or STR Visa before acquiring Governor’s Consent.',
    [
      'Determine pathway: ECOWAS passport holders enter visa-free for 90 days; business investors secure NIS VoA Approval Letter via immigration.gov.ng.',
      'Upload Nigerian host company/agent invitation, CAC registration, and passport scan to receive biometric VoA approval PDF.',
      'Carry original Yellow Fever vaccination card (valid 10 days after vaccination) for Port Health clearance at Lagos (LOS) or Abuja (ABV).',
      'Ensure property due diligence covers Certificate of Occupancy (C of O) and State Governor’s Consent.'
    ]
  ),
  c(
    'SN',
    'Senegal',
    'Dakar',
    'West Africa',
    ['ECOWAS'],
    'Visa-Free / Open Access',
    'Bloc Visa-Free + VoA',
    90,
    'Visa-free many passports · 5d consular',
    '$0 (Visa-Free Tiers)',
    'Mandatory from Yellow Fever endemic zones',
    'ambassadesenegal.org',
    'Foreigners may hold full Titre Foncier freehold in Dakar, Almadies & Saly; ECOWAS, EU, UK, US & several African states enjoy 90-day visa-free entry.'
  ),
  c(
    'SL',
    'Sierra Leone',
    'Freetown',
    'West Africa',
    ['ECOWAS'],
    'eVisa / eTA Required',
    'Bloc Visa-Free + VoA',
    30,
    '48 hours (eVisa / VoA)',
    '$0 ECOWAS · $80 Intl',
    'Mandatory Yellow Fever ICVP certificate for all travelers',
    'evisa.sl',
    'ECOWAS citizens enter visa-free; in Freetown Western Area, non-citizens generally structure long-term 21–99 year leases with Land Registry filing.'
  ),
  c(
    'TG',
    'Togo',
    'Lomé',
    'West Africa',
    ['ECOWAS'],
    'eVisa / eTA Required',
    'Bloc Visa-Free + VoA',
    90,
    '2–5 business days (Voyage Togo)',
    '$0 ECOWAS · $45–$100 Intl',
    'Mandatory Yellow Fever certificate for all travelers > 9 months',
    'voyage.gouv.tg',
    'All travelers complete the Voyage Togo digital declaration pre-arrival; ECOWAS citizens enter visa-free and enjoy full commercial lease mobility.'
  ),

  // EAST AFRICA (13)
  c(
    'BI',
    'Burundi',
    'Gitega',
    'East Africa',
    ['EAC', 'COMESA'],
    'Visa on Arrival',
    'Bloc Visa-Free + VoA',
    30,
    'Instant at Bujumbura Airport / EAC free',
    '$0 EAC · $90 VoA (30d)',
    'Mandatory Yellow Fever ICVP for all visitors',
    'migration.gov.bi',
    'EAC member citizens enter visa-free with national ID/passport; international visitors obtain a 30-day Visa on Arrival at Bujumbura Airport.'
  ),
  c(
    'KM',
    'Comoros',
    'Moroni',
    'East Africa',
    ['COMESA', 'SADC'],
    'Visa on Arrival',
    'eTA / eVisa All Africa',
    45,
    'Instant upon arrival at Moroni (HAH)',
    '$35 – $55 VoA',
    'Required if arriving from endemic areas',
    'Comoros Immigration Border Desk',
    'Universal Visa on Arrival granted to all nationalities for up to 45 days; foreign hospitality leases require Investment Agency clearance.'
  ),
  c(
    'DJ',
    'Djibouti',
    'Djibouti City',
    'East Africa',
    ['COMESA'],
    'eVisa / eTA Required',
    'eTA / eVisa All Africa',
    90,
    '72 hours (eVisa)',
    '$23 (14d) · $35 (90d)',
    'Required if arriving from Yellow Fever endemic zones',
    'evisa.gouv.dj',
    'Apply strictly through official evisa.gouv.dj prior to departure; strategic port & logistics free-zone leases governed by Djibouti Free Zone Authority.'
  ),
  c(
    'ER',
    'Eritrea',
    'Asmara',
    'East Africa',
    ['COMESA'],
    'Embassy / Consular Visa',
    'Reciprocal / Consular',
    30,
    '10–20 business days',
    '$70 – $100',
    'Required if traveling from Yellow Fever endemic areas',
    'Eritrean Diplomatic Missions',
    'Advance embassy visa and Ministry travel permits outside Asmara are mandatory; foreign commercial joint ventures require local ministry approval.'
  ),
  c(
    'ET',
    'Ethiopia',
    'Addis Ababa',
    'East Africa',
    ['COMESA'],
    'eVisa / eTA Required',
    'eTA / eVisa All Africa',
    30,
    '2–3 business days (eVisa)',
    '$62 (30d) · $152 (90d)',
    'Mandatory if arriving from Yellow Fever risk zones',
    'evisa.gov.et',
    'All African Union passport holders receive eVisa or Visa on Arrival at Bole International (ADD); Ethiopian Diaspora Yellow Card grants long-term residency rights.'
  ),
  c(
    'KE',
    'Kenya',
    'Nairobi',
    'East Africa',
    ['EAC', 'COMESA', 'AU Open'],
    'eVisa / eTA Required',
    'eTA / eVisa All Africa',
    90,
    '48–72 hours (etakenya.go.ke)',
    '$0 EAC · $34 eTA',
    'Mandatory if arriving from or transiting >12h through endemic zones',
    'etakenya.go.ke',
    'Non-citizens can hold urban leasehold real estate up to 99 years (Constitution Art. 65); EAC nationals enter visa-free while global visitors apply via eTA.',
    [
      'Complete Kenya Electronic Travel Authorisation (eTA) on etakenya.go.ke at least 72 hours before flight (EAC citizens are fee-exempt).',
      'Upload passport scan, selfie, return itinerary, and hotel booking or real estate agent invitation letter.',
      'Download QR-coded eTA authorization PDF and present on arrival at JKIA (Nairobi) or Moi (Mombasa).',
      'For property closing, obtain KRA PIN (Non-Resident) via iTax portal before Land Registry transfer.'
    ]
  ),
  c(
    'MG',
    'Madagascar',
    'Antananarivo',
    'East Africa',
    ['SADC', 'COMESA'],
    'Visa on Arrival',
    'eTA / eVisa All Africa',
    60,
    'Instant VoA or 72h eVisa',
    '$10 (15d) · $37 (30d)',
    'Required if arriving from Yellow Fever endemic countries',
    'evisamada-mg.com',
    'Foreigners acquire property through a 99-year Emphyteutic Lease or Madagascar-incorporated company; Investor Visa paths require EDBM approval.'
  ),
  c(
    'MW',
    'Malawi',
    'Lilongwe',
    'East Africa',
    ['SADC', 'COMESA'],
    'Visa-Free / Open Access',
    'Bloc Visa-Free + VoA',
    90,
    'Visa-free SADC/Key Markets · 5d eVisa',
    '$0 (Exempt Tiers) · $50 eVisa',
    'Required if arriving from endemic zones',
    'evisa.gov.mw',
    'SADC, UK, US, EU & Commonwealth citizens now enjoy broad visa-free entry; foreign buyers obtain Ministry of Lands consent for leases.'
  ),
  c(
    'MU',
    'Mauritius',
    'Port Louis',
    'East Africa',
    ['SADC', 'COMESA', 'AU Open'],
    'Visa-Free / Open Access',
    'Visa-Free All Africa',
    90,
    'Instant upon arrival (60–90 days)',
    '$0 (Visa-Free)',
    'Required only if arriving from Yellow Fever risk zones',
    'passport.govmu.org',
    'Purchasing a qualifying PDS, Smart City, or G+2 apartment worth >= USD $375,000 grants direct Mauritius Permanent Residence for buyer & family.',
    [
      'Verify passport qualifies for instant 60–90 day visa-free / Visa on Arrival entry at SSR International Airport (MRU).',
      'Complete the Mauritius All-in-One Digital Travel Form prior to boarding for automated immigration e-gates.',
      'Present confirmed resort/accommodation address and return ticket upon inspection.',
      'For PDS / Smart City property purchases >= $375k, submit EDB Residency-by-Investment dossier alongside notary deed.'
    ]
  ),
  c(
    'RW',
    'Rwanda',
    'Kigali',
    'East Africa',
    ['EAC', 'COMESA', 'AU Open'],
    'Visa-Free / Open Access',
    'Visa-Free All Africa',
    30,
    'Instant visa-free Africa · 3d eVisa',
    '$0 African/EAC · $50 Intl VoA',
    'Required if arriving from Yellow Fever endemic nations',
    'irembo.gov.rw',
    'All African Union, Francophonie & Commonwealth citizens enter Kigali visa-free; foreign buyers enjoy equal freehold/emphyteutic rights via RDB Land Registry.'
  ),
  c(
    'SC',
    'Seychelles',
    'Victoria',
    'East Africa',
    ['SADC', 'COMESA', 'AU Open'],
    'Visa-Free / Open Access',
    'Visa-Free All Africa',
    90,
    '24 hours (Seychelles Electronic Border System)',
    '$0 Visa · EUR 10–30 Border TA',
    'Mandatory if arriving from Yellow Fever endemic countries',
    'seychelles.govtas.com',
    'Visa-free for all nationalities worldwide (mandatory SEBS digital travel authorization before boarding); Eden Island & resort villa purchases require Government Sanction.'
  ),
  c(
    'SO',
    'Somalia',
    'Mogadishu',
    'East Africa',
    ['EAC'],
    'eVisa / eTA Required',
    'eTA / eVisa All Africa',
    30,
    '3–5 business days (eTAS)',
    '$60 eTAS',
    'Mandatory if arriving from endemic zones',
    'etas.gov.so',
    'Mandatory Electronic Travel Authorization System (eTAS) before departure; property & commercial deployments require local municipal notarization.'
  ),
  c(
    'SS',
    'South Sudan',
    'Juba',
    'East Africa',
    ['EAC'],
    'eVisa / eTA Required',
    'Bloc Visa-Free + VoA',
    30,
    '3–5 business days (eVisa)',
    '$0 EAC · $100 Intl',
    'Mandatory Yellow Fever certificate for all travelers',
    'evisa.gov.ss',
    'EAC partners enjoy reciprocal arrangements; non-EAC travelers apply via official evisa.gov.ss and register with Alien Immigration within 3 days of arrival.'
  ),
  c(
    'TZ',
    'Tanzania',
    'Dodoma',
    'East Africa',
    ['EAC', 'SADC'],
    'eVisa / eTA Required',
    'Bloc Visa-Free + VoA',
    90,
    '5–10 business days (eVisa) · VoA available',
    '$0 EAC/SADC · $50–$100 Intl',
    'Mandatory if arriving from or transiting >12h in Yellow Fever zone',
    'visa.immigration.go.tz',
    'Foreigners acquire land via Tanzania Investment Centre (TIC) Derivative Rights or Zanzibar ZIPA 99-year condominium titles (grants Residence Permit).'
  ),
  c(
    'UG',
    'Uganda',
    'Kampala',
    'East Africa',
    ['EAC', 'COMESA'],
    'eVisa / eTA Required',
    'Bloc Visa-Free + VoA',
    90,
    '2–4 business days (visas.immigration.go.ug)',
    '$0 EAC/COMESA tiers · $50 Intl',
    'Strict mandatory Yellow Fever ICVP for all arrivals > 1 year',
    'visas.immigration.go.ug',
    'EAC citizens enter visa-free; all other visitors must obtain pre-approved Uganda eVisa (or East Africa Tourist Visa $100 for KE+UG+RW) before boarding.'
  ),

  // CENTRAL AFRICA (9)
  c(
    'AO',
    'Angola',
    'Luanda',
    'Central Africa',
    ['SADC'],
    'Visa-Free / Open Access',
    'Bloc Visa-Free + VoA',
    30,
    'Instant (Exempt Tiers) · 5d eVisa',
    '$0 (98+ exempt nations) · $120 eVisa',
    'Strict mandatory Yellow Fever certificate for all travelers',
    'smevisa.gov.ao',
    'Angola allows 30-day visa-free tourist entry (up to 90 days/yr) for 98+ countries including SADC, EU, UK & US; commercial property purchases use AIPEX.'
  ),
  c(
    'CM',
    'Cameroon',
    'Yaoundé',
    'Central Africa',
    ['CEMAC'],
    'eVisa / eTA Required',
    'Bloc Visa-Free + VoA',
    90,
    '3–5 business days (evisacam.cm)',
    '$0 CEMAC · $170 eVisa',
    'Strict mandatory Yellow Fever ICVP for all arrivals > 1 year',
    'evisacam.cm',
    'CEMAC nationals enter visa-free; all other travelers apply online at evisacam.cm for biometric QR pre-enrollment before embassy/airport issuance.'
  ),
  c(
    'CF',
    'Central African Republic',
    'Bangui',
    'Central Africa',
    ['CEMAC'],
    'Embassy / Consular Visa',
    'Bloc Visa-Free + VoA',
    30,
    '7–14 business days',
    '$0 CEMAC · $100–$150 Intl',
    'Mandatory Yellow Fever certificate for all entrants',
    'CAR Diplomatic Missions',
    'CEMAC free-movement applies; international visitors require advance embassy visa backed by legalized host/corporate invitation.'
  ),
  c(
    'TD',
    'Chad',
    "N'Djamena",
    'Central Africa',
    ['CEMAC'],
    'eVisa / eTA Required',
    'Bloc Visa-Free + VoA',
    30,
    '5–7 business days (eVisa)',
    '$0 CEMAC · $120 Intl',
    'Mandatory Yellow Fever vaccination card for all arrivals',
    'evisa.td',
    'CEMAC citizens travel visa-free; non-CEMAC entrants require pre-approved eVisa or consular visa plus mandatory police registration within 72 hours.'
  ),
  c(
    'CG',
    'Congo Republic',
    'Brazzaville',
    'Central Africa',
    ['CEMAC'],
    'Embassy / Consular Visa',
    'Bloc Visa-Free + VoA',
    30,
    '7–10 business days',
    '$0 CEMAC · $110–$160 Intl',
    'Mandatory Yellow Fever certificate for all arrivals',
    'Congo Consular & Immigration Service',
    'CEMAC citizens enjoy visa-free mobility; foreign commercial property leases in Brazzaville & Pointe-Noire require Ministry of Justice legalization.'
  ),
  c(
    'CD',
    'DR Congo',
    'Kinshasa',
    'Central Africa',
    ['SADC', 'EAC', 'COMESA'],
    'eVisa / eTA Required',
    'Bloc Visa-Free + VoA',
    30,
    '5–7 business days (eVisa)',
    '$0 EAC/SADC tiers · $150–$250 Intl',
    'Strict mandatory Yellow Fever ICVP certificate for all travelers > 9 months',
    'evisa.gouv.cd',
    'Dual EAC & SADC member; non-exempt visitors apply via evisa.gouv.cd with Direction Générale de Migration (DGM) sponsor invitation for Kinshasa/Lubumbashi.'
  ),
  c(
    'GQ',
    'Equatorial Guinea',
    'Malabo',
    'Central Africa',
    ['CEMAC'],
    'eVisa / eTA Required',
    'Bloc Visa-Free + VoA',
    30,
    '5–7 business days (eVisa)',
    '$0 CEMAC · $75 eVisa',
    'Mandatory Yellow Fever vaccination certificate for all entrants',
    'equatorialguinea-evisa.com',
    'CEMAC citizens enter visa-free; foreign buyers in Malabo & Bata file corporate/property sponsorships through official eVisa clearance.'
  ),
  c(
    'GA',
    'Gabon',
    'Libreville',
    'Central Africa',
    ['CEMAC'],
    'eVisa / eTA Required',
    'Bloc Visa-Free + VoA',
    30,
    '72 hours (DGDI e-Visa)',
    '$0 CEMAC · EUR 70 + EUR 15 fee',
    'Mandatory Yellow Fever certificate for all visitors > 1 year',
    'evisa.dgdi.ga',
    'CEMAC citizens enter visa-free; G20 & partner nationals apply online at evisa.dgdi.ga with arrival exclusively via Libreville (LBV) airport.'
  ),
  c(
    'ST',
    'São Tomé and Príncipe',
    'São Tomé',
    'Central Africa',
    ['AU Open'],
    'eVisa / eTA Required',
    'Visa-Free All Africa',
    15,
    'Instant exempt tiers · 3–5d eVisaSTA',
    '$0 Exempt · EUR 20–60',
    'Mandatory if arriving from Yellow Fever risk zones',
    'smf.st/evisa',
    'Streamlined eVisaSTA portal for international tourists; eco-hospitality & coastal plantation concessions managed with APCI Investment Agency.'
  ),

  // SOUTHERN AFRICA (10 — note total across 5 regions = 7 + 15 + 15 + 9 + 8? Let's verify exact count = 54!)
  // Wait: North = 7 (DZ, EG, LY, MR, MA, SD, TN)
  // West = 15 (BJ, BF, CV, CI, GM, GH, GN, GW, LR, ML, NE, NG, SN, SL, TG) -> Benin..Togo = 15 (Cape Verde included)
  // East = 15 (BI, KM, DJ, ER, ET, KE, MG, MW, MU, RW, SC, SO, SS, TZ, UG) = 15
  // Central = 9 (AO, CM, CF, TD, CG, CD, GQ, GA, ST) = 9
  // Remaining Southern = 8 (BW, SZ, LS, MZ, NA, ZA, ZM, ZW) -> 7 + 15 + 15 + 9 + 8 = 54!
  c(
    'BW',
    'Botswana',
    'Gaborone',
    'Southern Africa',
    ['SADC'],
    'Visa-Free / Open Access',
    'Bloc Visa-Free + VoA',
    90,
    'Instant visa-free · 5–7d eVisa',
    '$0 (Exempt Tiers) · $30–$50 eVisa',
    'Required if arriving from Yellow Fever endemic countries',
    'evisa.gov.bw',
    'SADC, UK, US, EU & Commonwealth travelers enter visa-free up to 90 days/yr; Freehold land is open to foreign buyers while Tribal Land grants 50–99yr leases.'
  ),
  c(
    'SZ',
    'Eswatini',
    'Mbabane',
    'Southern Africa',
    ['SADC', 'COMESA'],
    'Visa-Free / Open Access',
    'Bloc Visa-Free + VoA',
    30,
    'Instant visa-free · 7d consular',
    '$0 Exempt · $30–$50',
    'Required if arriving from endemic areas',
    'gov.sz (Immigration Dept)',
    'SADC, UK, US & EU citizens enter visa-free for 30 days; non-citizens acquire urban Title Deed land after obtaining Land Speculation Control Board consent.'
  ),
  c(
    'LS',
    'Lesotho',
    'Maseru',
    'Southern Africa',
    ['SADC'],
    'Visa-Free / Open Access',
    'Bloc Visa-Free + VoA',
    90,
    'Instant SADC/Exempt · 3–5d eVisa',
    '$0 Exempt · $150 eVisa',
    'Required if arriving from Yellow Fever endemic zones',
    'evisalesotho.com',
    'SADC and many global passports enjoy visa-free access; non-citizens lease commercial & urban estates via Lesotho-registered companies (up to 90 years).'
  ),
  c(
    'MZ',
    'Mozambique',
    'Maputo',
    'Southern Africa',
    ['SADC'],
    'eVisa / eTA Required',
    'Bloc Visa-Free + VoA',
    30,
    'Instant SADC/Exempt · 3–5d eVisa',
    '$0 Exempt · $11 eTA / $80 eVisa',
    'Required if arriving from Yellow Fever endemic regions',
    'evisa.gov.mz',
    'Expanded visa-free regime + $11 eTA for 29 countries (incl. UK/US/EU); all land belongs to the State via 50-year renewable DUAT usage titles.'
  ),
  c(
    'NA',
    'Namibia',
    'Windhoek',
    'Southern Africa',
    ['SADC'],
    'Visa on Arrival',
    'Bloc Visa-Free + VoA',
    90,
    'Instant SADC · 24–72h eVisa / VoA',
    '$0 SADC/Reciprocal · $90 VoA/eVisa',
    'Required if arriving from Yellow Fever endemic countries',
    'eservices.mhaiss.gov.na',
    'Starting April 2025, 33 non-reciprocal nations require online eVisa/VoA ($90); foreign buyers enjoy strong urban freehold title rights (Agricultural land restricted).'
  ),
  c(
    'ZA',
    'South Africa',
    'Pretoria',
    'Southern Africa',
    ['SADC'],
    'Visa-Free / Open Access',
    'Bloc Visa-Free + VoA',
    90,
    'Instant SADC/Exempt · 5–10d eVisa/VFS',
    '$0 Exempt · $35–$60 eVisa',
    'Strict Yellow Fever certificate required from WHO endemic zones & >12h transits',
    'ehome.dha.gov.za',
    'Full non-resident freehold ownership permitted; foreign buyers open a Non-Resident Bank Account for Deeds Office transfers & SARS exchange control clearance.',
    [
      'Verify exemption: SADC passports (up to 90 days/yr), UK, US, EU, Mauritius & Kenya enjoy visa-free entry; others apply via DHA eVisa or VFS Global.',
      'Ensure at least TWO completely blank facing visa pages remain in passport — airlines deny boarding if fewer than 2 blank pages.',
      'Present Yellow Fever ICVP if arriving from or transiting >12 hours through an endemic African or South American country.',
      'For property closings, register funds via Authorized Dealer (South African bank) so future sale proceeds remain freely repatriable.'
    ]
  ),
  c(
    'ZM',
    'Zambia',
    'Lusaka',
    'Southern Africa',
    ['SADC', 'COMESA'],
    'Visa-Free / Open Access',
    'Bloc Visa-Free + VoA',
    90,
    'Instant (Exempt Tiers) · 3–5d eVisa',
    '$0 Exempt · $25–$50 eVisa',
    'Required if arriving from Yellow Fever risk zones',
    'eservices.zambiaimmigration.gov.zm',
    'Visa-free entry extended to 50+ nationalities incl. SADC, UK, US, EU & China; foreign property investors acquire 99-year Crown/State leases via ZDA.'
  ),
  c(
    'ZW',
    'Zimbabwe',
    'Harare',
    'Southern Africa',
    ['SADC', 'COMESA'],
    'Visa on Arrival',
    'Bloc Visa-Free + VoA',
    90,
    'Instant SADC/VoA · 3–5d eVisa',
    '$0 SADC · $30–$45 VoA ($50 KAZA)',
    'Required if arriving from Yellow Fever endemic countries',
    'evisa.gov.zw',
    'SADC citizens enter visa-free; travelers visiting Zambia & Zimbabwe can opt for the $50 KAZA UniVisa. Urban freehold deeds are open to foreign investors.'
  ),
];

export interface VisaAssessmentResult {
  country: AfricanCountryVisaProfile;
  passportCountry: string;
  purpose: VisaTravelPurpose;
  resolvedRegime: VisaRegime;
  blocAdvantage: string | null;
  feeDisplay: string;
  processingDisplay: string;
  stayLimitDisplay: string;
  tailoredChecklist: string[];
  tailoredSteps: string[];
}

export const assessAfricanVisaRequirement = (
  country: AfricanCountryVisaProfile,
  passportCountry: string,
  purpose: VisaTravelPurpose
): VisaAssessmentResult => {
  const passport = PASSPORT_OPTIONS.find((p) => p.value === passportCountry);
  const sharedBloc = passport?.blocs.find((b) => country.blocs.includes(b));

  let resolvedRegime: VisaRegime = country.defaultInternationalRegime;
  let blocAdvantage: string | null = null;
  let feeDisplay = country.feeBandUsd;
  let processingDisplay = country.processingWindow;
  let stayLimitDisplay = `${country.stayLimitDays} days`;

  if (passport?.value === country.name) {
    resolvedRegime = 'Visa-Free / Open Access';
    blocAdvantage = 'Citizen Home Passport — Unrestricted Entry';
    feeDisplay = '$0 (Citizen)';
    processingDisplay = 'Immediate border clearance';
    stayLimitDisplay = 'Unlimited';
  } else if (sharedBloc) {
    resolvedRegime = 'Visa-Free / Open Access';
    blocAdvantage = `${sharedBloc} Regional Freedom-of-Movement Corridor`;
    feeDisplay = '$0 (Bloc Fee Waiver)';
    processingDisplay = 'Instant port-of-entry stamp';
  } else if (passport?.isAfrican && country.africanAuPolicy === 'Visa-Free All Africa') {
    resolvedRegime = 'Visa-Free / Open Access';
    blocAdvantage = 'African Union Open-Border Reciprocity';
    feeDisplay = '$0 (AU Continental Exemption)';
    processingDisplay = 'Instant port-of-entry stamp';
  } else if (passport?.isAfrican && country.africanAuPolicy === 'eTA / eVisa All Africa') {
    resolvedRegime = country.defaultInternationalRegime === 'Embassy / Consular Visa'
      ? 'eVisa / eTA Required'
      : country.defaultInternationalRegime;
    blocAdvantage = 'AU Priority Digital Pre-Clearance / VoA Lane';
  }

  const purposeExtras: Record<VisaTravelPurpose, { doc: string; step: string }> = {
    tourism: {
      doc: 'Confirmed hotel, lodge, or AfriEstate short-stay booking voucher',
      step: 'Keep digital & printed return itinerary accessible for departure and arrival gate checks.',
    },
    property: {
      doc: 'Signed Agency Viewing Schedule or Letter of Intent from licensed local broker/lawyer',
      step: 'Request a Business/Investor entry classification at immigration if executing powers of attorney or notary deeds.',
    },
    investment: {
      doc: 'Corporate incorporation extract, bank reference letter, & local sponsor/fund invitation',
      step: 'Verify foreign currency declaration thresholds at customs before wire-transferring earnest escrow deposits.',
    },
    residency: {
      doc: 'Police clearance certificate (apostilled), medical check, & property title or investment threshold proof',
      step: 'Apply for an Advance Long-Stay / Residency D-Visa or Investor Permit prior to converting tourist entry status.',
    },
  };

  const extra = purposeExtras[purpose];
  const tailoredChecklist = [...country.requiredDocuments, extra.doc];
  const tailoredSteps = [...country.bureaucraticSteps, extra.step];

  if (purpose === 'residency') {
    stayLimitDisplay = '1 – 5 Years (Renewable Permit)';
  }

  return {
    country,
    passportCountry,
    purpose,
    resolvedRegime,
    blocAdvantage,
    feeDisplay,
    processingDisplay,
    stayLimitDisplay,
    tailoredChecklist,
    tailoredSteps,
  };
};
