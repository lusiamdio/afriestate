import type { Notification, Property } from '../types';
import { ListingType, NotificationType, PropertyStatus } from '../types';

export type InvestmentRegionScope =
  | 'All Regions'
  | 'Southern Africa'
  | 'West Africa'
  | 'East Africa'
  | 'North Africa'
  | 'Central Africa';

export type InvestmentListingScope = 'All' | 'For Investment' | 'For Sale' | 'For Rent';

export interface InvestmentAlertRule {
  id: string;
  subscriberUsername: string;
  label: string;
  region: InvestmentRegionScope;
  minRoiPct: number;
  listingScope: InvestmentListingScope;
  isActive: boolean;
  createdAt: number;
  lastTriggeredAt?: number;
  matchCount: number;
}

export interface InvestmentAlertTriggerEvent {
  id: string;
  ruleId: string;
  ruleLabel: string;
  propertyId: string;
  propertyTitle: string;
  city: string;
  region: string;
  effectiveRoi: number;
  price: number;
  triggeredAt: number;
}

const ALERT_RULES_KEY = 'afriestate_investment_alert_rules_v1';
const ALERT_TRIGGERS_KEY = 'afriestate_investment_alert_triggers_v1';
const ALERT_NOTIFICATIONS_KEY = 'afriestate_investment_alert_notifications_v1';
const ALERT_READ_IDS_KEY = 'afriestate_investment_alert_read_ids_v1';

const COUNTRY_REGION_MAP: Record<string, Exclude<InvestmentRegionScope, 'All Regions'>> = {
  'south africa': 'Southern Africa',
  'botswana': 'Southern Africa',
  'namibia': 'Southern Africa',
  'zimbabwe': 'Southern Africa',
  'zambia': 'Southern Africa',
  'mozambique': 'Southern Africa',
  'mauritius': 'Southern Africa',
  'madagascar': 'Southern Africa',
  'malawi': 'Southern Africa',
  'lesotho': 'Southern Africa',
  'eswatini': 'Southern Africa',
  'angola': 'Southern Africa',
  'nigeria': 'West Africa',
  'ghana': 'West Africa',
  'senegal': 'West Africa',
  "cote d'ivoire": 'West Africa',
  'ivory coast': 'West Africa',
  'benin': 'West Africa',
  'togo': 'West Africa',
  'cabo verde': 'West Africa',
  'cape verde': 'West Africa',
  'gambia': 'West Africa',
  'mali': 'West Africa',
  'niger': 'West Africa',
  'burkina faso': 'West Africa',
  'sierra leone': 'West Africa',
  'liberia': 'West Africa',
  'guinea': 'West Africa',
  'kenya': 'East Africa',
  'tanzania': 'East Africa',
  'rwanda': 'East Africa',
  'uganda': 'East Africa',
  'ethiopia': 'East Africa',
  'seychelles': 'East Africa',
  'burundi': 'East Africa',
  'djibouti': 'East Africa',
  'somalia': 'East Africa',
  'south sudan': 'East Africa',
  'comoros': 'East Africa',
  'egypt': 'North Africa',
  'morocco': 'North Africa',
  'tunisia': 'North Africa',
  'algeria': 'North Africa',
  'libya': 'North Africa',
  'mauritania': 'North Africa',
  'sudan': 'North Africa',
  'cameroon': 'Central Africa',
  'gabon': 'Central Africa',
  'congo': 'Central Africa',
  'dr congo': 'Central Africa',
  'drc': 'Central Africa',
  'democratic republic of the congo': 'Central Africa',
  'equatorial guinea': 'Central Africa',
  'chad': 'Central Africa',
  'central african republic': 'Central Africa',
  'sao tome and principe': 'Central Africa',
};

const CITY_REGION_HINTS: Array<{ keywords: string[]; region: Exclude<InvestmentRegionScope, 'All Regions'> }> = [
  { keywords: ['cape town', 'johannesburg', 'sandton', 'durban', 'pretoria', 'gaborone', 'windhoek', 'lusaka', 'harare', 'maputo', 'port louis'], region: 'Southern Africa' },
  { keywords: ['lagos', 'ikoyi', 'lekki', 'victoria island', 'abuja', 'accra', 'dakar', 'abidjan', 'cotonou', 'lome'], region: 'West Africa' },
  { keywords: ['nairobi', 'mombasa', 'kigali', 'dar es salaam', 'zanzibar', 'kampala', 'addis ababa', 'arusha'], region: 'East Africa' },
  { keywords: ['cairo', 'alexandria', 'marrakech', 'casablanca', 'rabat', 'tangier', 'tunis', 'algiers'], region: 'North Africa' },
  { keywords: ['kinshasa', 'douala', 'yaounde', 'libreville', 'brazzaville', 'malabo'], region: 'Central Africa' },
];

const DEFAULT_ALERT_RULES: InvestmentAlertRule[] = [
  {
    id: 'inv-rule-east-high-yield',
    subscriberUsername: 'investor',
    label: 'East Africa · High-Yield Developments (>= 12% ROI)',
    region: 'East Africa',
    minRoiPct: 12,
    listingScope: 'For Investment',
    isActive: true,
    createdAt: Date.now() - 86400000 * 6,
    lastTriggeredAt: Date.now() - 86400000 * 2,
    matchCount: 2,
  },
  {
    id: 'inv-rule-southern-core',
    subscriberUsername: 'investor',
    label: 'Southern Africa · Core Income Assets (>= 9% ROI)',
    region: 'Southern Africa',
    minRoiPct: 9,
    listingScope: 'All',
    isActive: true,
    createdAt: Date.now() - 86400000 * 4,
    lastTriggeredAt: Date.now() - 86400000,
    matchCount: 1,
  },
];

const safeReadJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const safeWriteJson = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
};

export const inferPropertyRegion = (property: Property): Exclude<InvestmentRegionScope, 'All Regions'> => {
  if (
    property.region &&
    ['Southern Africa', 'West Africa', 'East Africa', 'North Africa', 'Central Africa'].includes(property.region)
  ) {
    return property.region as Exclude<InvestmentRegionScope, 'All Regions'>;
  }

  const countryKey = (property.country || '').trim().toLowerCase();
  if (countryKey && COUNTRY_REGION_MAP[countryKey]) {
    return COUNTRY_REGION_MAP[countryKey];
  }

  const haystack = `${property.address?.city || ''} ${property.address?.street || ''} ${property.title || ''}`.toLowerCase();
  for (const hint of CITY_REGION_HINTS) {
    if (hint.keywords.some((kw) => haystack.includes(kw))) {
      return hint.region;
    }
  }

  return 'Southern Africa';
};

export const getEffectivePropertyRoi = (property: Property): number => {
  const candidates = [
    property.targetReturn,
    property.projectedROI,
    property.rentalYield,
    property.marketROI,
  ].filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0);

  if (candidates.length > 0) {
    return Number(Math.max(...candidates).toFixed(1));
  }

  // Compute an annualised yield estimate when explicit ROI fields are absent
  if (property.listingType === ListingType.FOR_INVESTMENT) {
    return 13.5;
  }
  if (property.listingType === ListingType.RENT && property.price > 0) {
    return 8.5;
  }
  return 7.8;
};

export const doesPropertyMatchAlertRule = (property: Property, rule: InvestmentAlertRule): boolean => {
  if (!rule.isActive) return false;
  if (property.status === PropertyStatus.DRAFT || property.status === PropertyStatus.PENDING) {
    return false;
  }

  if (rule.listingScope !== 'All' && property.listingType !== rule.listingScope) {
    return false;
  }

  const propRegion = inferPropertyRegion(property);
  if (rule.region !== 'All Regions' && propRegion !== rule.region) {
    return false;
  }

  const effectiveRoi = getEffectivePropertyRoi(property);
  return effectiveRoi >= rule.minRoiPct;
};

export const getInvestmentAlertRules = (username?: string): InvestmentAlertRule[] => {
  const stored = safeReadJson<InvestmentAlertRule[]>(ALERT_RULES_KEY, []);
  if (!Array.isArray(stored) || stored.length === 0) {
    const seeded = DEFAULT_ALERT_RULES.map((rule) => ({
      ...rule,
      subscriberUsername: username || rule.subscriberUsername,
    }));
    safeWriteJson(ALERT_RULES_KEY, seeded);
    return seeded;
  }
  return stored;
};

export const saveInvestmentAlertRules = (rules: InvestmentAlertRule[]): void => {
  safeWriteJson(ALERT_RULES_KEY, rules);
};

export const getInvestmentAlertTriggers = (): InvestmentAlertTriggerEvent[] => {
  const stored = safeReadJson<InvestmentAlertTriggerEvent[]>(ALERT_TRIGGERS_KEY, []);
  return Array.isArray(stored) ? stored : [];
};

export const getLocalAlertNotifications = (): Notification[] => {
  const stored = safeReadJson<Notification[]>(ALERT_NOTIFICATIONS_KEY, []);
  return Array.isArray(stored) ? stored : [];
};

export const getLocalReadAlertNotificationIds = (): Set<string> => {
  const ids = safeReadJson<string[]>(ALERT_READ_IDS_KEY, []);
  return new Set(Array.isArray(ids) ? ids : []);
};

export const markLocalAlertNotificationsRead = (ids: string[]): Set<string> => {
  const existing = getLocalReadAlertNotificationIds();
  ids.forEach((id) => existing.add(id));
  safeWriteJson(ALERT_READ_IDS_KEY, Array.from(existing));
  return existing;
};

export interface AlertEvaluationResult {
  matchedRules: InvestmentAlertRule[];
  notifications: Notification[];
  triggerEvents: InvestmentAlertTriggerEvent[];
}

export const evaluatePropertyAgainstInvestmentAlerts = (
  property: Property,
  options?: { allowDuplicateProperty?: boolean }
): AlertEvaluationResult => {
  if (property.status === PropertyStatus.DRAFT || property.status === PropertyStatus.PENDING) {
    return { matchedRules: [], notifications: [], triggerEvents: [] };
  }

  const rules = getInvestmentAlertRules();
  const existingTriggers = getInvestmentAlertTriggers();
  const existingNotifications = getLocalAlertNotifications();

  const propRegion = inferPropertyRegion(property);
  const effectiveRoi = getEffectivePropertyRoi(property);

  const matchedRules: InvestmentAlertRule[] = [];
  const newNotifications: Notification[] = [];
  const newTriggers: InvestmentAlertTriggerEvent[] = [];
  const now = Date.now();

  const updatedRules = rules.map((rule) => {
    if (!doesPropertyMatchAlertRule(property, rule)) {
      return rule;
    }

    const alreadyTriggered =
      !options?.allowDuplicateProperty &&
      existingTriggers.some((t) => t.ruleId === rule.id && t.propertyId === property.id);

    if (alreadyTriggered) {
      return rule;
    }

    matchedRules.push(rule);
    const eventId = `inv-trg-${rule.id}-${property.id}-${now}`;
    const notiId = `inv-alert-${rule.id}-${property.id}-${now}`;

    newTriggers.push({
      id: eventId,
      ruleId: rule.id,
      ruleLabel: rule.label,
      propertyId: property.id,
      propertyTitle: property.title,
      city: property.address?.city || propRegion,
      region: propRegion,
      effectiveRoi,
      price: property.price,
      triggeredAt: now,
    });

    newNotifications.push({
      id: notiId,
      type: NotificationType.NEW_LISTING,
      title: `Investment Alert Match: ${effectiveRoi}% ROI in ${propRegion}`,
      message: `"${property.title}" (${property.address?.city || propRegion}) meets your "${rule.label}" threshold (>= ${rule.minRoiPct}% ROI).`,
      timestamp: now,
      isRead: false,
      propertyId: property.id,
    });

    return {
      ...rule,
      lastTriggeredAt: now,
      matchCount: (rule.matchCount || 0) + 1,
    };
  });

  if (matchedRules.length > 0) {
    saveInvestmentAlertRules(updatedRules);
    safeWriteJson(ALERT_TRIGGERS_KEY, [...newTriggers, ...existingTriggers].slice(0, 60));
    safeWriteJson(ALERT_NOTIFICATIONS_KEY, [...newNotifications, ...existingNotifications].slice(0, 60));
  }

  return {
    matchedRules,
    notifications: newNotifications,
    triggerEvents: newTriggers,
  };
};
