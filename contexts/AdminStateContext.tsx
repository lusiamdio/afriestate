import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Currency, Language, PropertyStatus, type Property } from '../types';

export interface AdminActionPayload {
  type: string;
  data: any;
  timestamp: string;
  sender?: string;
}

export type SovereignRoleKey =
  | 'user'
  | 'agent'
  | 'investor'
  | 'hotel_manager'
  | 'transport'
  | 'wellness'
  | 'developer'
  | 'agency';

export interface CommissionRatesConfig {
  shortStayPercent: number;
  longTermPlacementPercent: number;
  salesBoostZar: number;
  propertyManagerMonthlyZar: number;
  hotelCommissionPercent: number;
}

export interface FeatureFlagsConfig {
  shortStays: boolean;
  longTerm: boolean;
  transport: boolean;
  wellness: boolean;
  neighborhoods: boolean;
  professionals: boolean;
  hotelRegistration: boolean;
  aiConcierge: boolean;
  aiValuation: boolean;
}

export interface SecurityPoliciesConfig {
  requireKycToPublish: boolean;
  autoModerateListings: boolean;
  strictTitleDeedVerification: boolean;
  sessionTimeoutMinutes: number;
  autoThrottleCooldownSeconds: number;
  aiModel: 'gemini-2.5-flash' | 'gemini-2.5-pro';
}

export interface AnnouncementBannerConfig {
  enabled: boolean;
  text: string;
  ctaLabel: string;
  targetPage: string;
}

export interface PlatformSettings {
  siteName: string;
  tagline: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcementBanner: AnnouncementBannerConfig;
  defaultCurrency: Currency;
  defaultLanguage: Language;
  commissionRates: CommissionRatesConfig;
  featureFlags: FeatureFlagsConfig;
  securityPolicies: SecurityPoliciesConfig;
  updatedAt: number;
}

export interface RoleGovernanceConfig {
  roleKey: SovereignRoleKey;
  label: string;
  canLogin: boolean;
  canPublishListings: boolean;
  canAccessInvestmentDesk: boolean;
  requiresKycApproval: boolean;
  maxActiveListings: number;
  verificationBadgeRequired: boolean;
}

export interface CountryGovernanceConfig {
  code: string;
  name: string;
  region: 'Southern Africa' | 'West Africa' | 'East Africa' | 'North Africa' | 'Central Africa';
  currency: string;
  enabled: boolean;
  featuredHub: boolean;
  vatRatePct: number;
  stampDutyPct: number;
  targetRentalYieldPct: number;
  monthlyRevenueTargetZar: number;
}

export interface UserOverrideRecord {
  id: string;
  email?: string;
  role?: SovereignRoleKey;
  status?: 'Active' | 'Suspended' | 'Pending Verification' | 'Restricted';
  kycStatus?: 'Approved' | 'Pending' | 'Flagged' | 'Not Submitted';
  isWalletFrozen?: boolean;
  canPublish?: boolean;
  adminNote?: string;
  updatedAt: number;
}

export interface ListingOverrideRecord {
  id: string;
  status?: PropertyStatus;
  verified?: boolean;
  featured?: boolean;
  priceOverride?: number;
  hidden?: boolean;
  adminFlagReason?: string;
  updatedAt: number;
}

export interface GovernanceAuditEntry {
  id: string;
  timestamp: string;
  category: string;
  action: string;
  actor: string;
}

export interface PlatformGovernanceState {
  settings: PlatformSettings;
  roleControls: Record<SovereignRoleKey, RoleGovernanceConfig>;
  countryConfigs: CountryGovernanceConfig[];
  userOverrides: Record<string, UserOverrideRecord>;
  listingOverrides: Record<string, ListingOverrideRecord>;
  auditFeed: GovernanceAuditEntry[];
}

const STORAGE_KEY = 'afriestate_governance_v1';

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  siteName: 'AfriEstate',
  tagline: 'Real Estate for Real People',
  maintenanceMode: false,
  maintenanceMessage:
    'AfriEstate is undergoing scheduled infrastructure maintenance. Verified asset data remains protected.',
  announcementBanner: {
    enabled: false,
    text: 'List accommodation, rentals, and properties for sale free — pay only upon completed bookings or placement.',
    ctaLabel: 'View Partner Plans',
    targetPage: 'pricing',
  },
  defaultCurrency: Currency.ZAR,
  defaultLanguage: Language.EN,
  commissionRates: {
    shortStayPercent: 7,
    longTermPlacementPercent: 2.5,
    salesBoostZar: 299,
    propertyManagerMonthlyZar: 199,
    hotelCommissionPercent: 5,
  },
  featureFlags: {
    shortStays: true,
    longTerm: true,
    transport: true,
    wellness: true,
    neighborhoods: true,
    professionals: true,
    hotelRegistration: true,
    aiConcierge: true,
    aiValuation: true,
  },
  securityPolicies: {
    requireKycToPublish: false,
    autoModerateListings: true,
    strictTitleDeedVerification: true,
    sessionTimeoutMinutes: 15,
    autoThrottleCooldownSeconds: 15,
    aiModel: 'gemini-2.5-flash',
  },
  updatedAt: Date.now(),
};

export const DEFAULT_ROLE_CONTROLS: Record<SovereignRoleKey, RoleGovernanceConfig> = {
  user: {
    roleKey: 'user',
    label: 'Property Seeker & Host',
    canLogin: true,
    canPublishListings: true,
    canAccessInvestmentDesk: false,
    requiresKycApproval: false,
    maxActiveListings: 5,
    verificationBadgeRequired: false,
  },
  agent: {
    roleKey: 'agent',
    label: 'Real Estate Agent',
    canLogin: true,
    canPublishListings: true,
    canAccessInvestmentDesk: false,
    requiresKycApproval: false,
    maxActiveListings: 100,
    verificationBadgeRequired: true,
  },
  investor: {
    roleKey: 'investor',
    label: 'Investor',
    canLogin: true,
    canPublishListings: true,
    canAccessInvestmentDesk: true,
    requiresKycApproval: false,
    maxActiveListings: 25,
    verificationBadgeRequired: true,
  },
  hotel_manager: {
    roleKey: 'hotel_manager',
    label: 'Hotel Partner & Manager',
    canLogin: true,
    canPublishListings: true,
    canAccessInvestmentDesk: false,
    requiresKycApproval: false,
    maxActiveListings: 250,
    verificationBadgeRequired: true,
  },
  transport: {
    roleKey: 'transport',
    label: 'Transport Fleet Operator',
    canLogin: true,
    canPublishListings: true,
    canAccessInvestmentDesk: false,
    requiresKycApproval: false,
    maxActiveListings: 60,
    verificationBadgeRequired: true,
  },
  wellness: {
    roleKey: 'wellness',
    label: 'Wellness Sanctuary Partner',
    canLogin: true,
    canPublishListings: true,
    canAccessInvestmentDesk: false,
    requiresKycApproval: false,
    maxActiveListings: 40,
    verificationBadgeRequired: true,
  },
  developer: {
    roleKey: 'developer',
    label: 'Property Developer',
    canLogin: true,
    canPublishListings: true,
    canAccessInvestmentDesk: true,
    requiresKycApproval: true,
    maxActiveListings: 300,
    verificationBadgeRequired: true,
  },
  agency: {
    roleKey: 'agency',
    label: 'Brokerage Agency',
    canLogin: true,
    canPublishListings: true,
    canAccessInvestmentDesk: false,
    requiresKycApproval: true,
    maxActiveListings: 500,
    verificationBadgeRequired: true,
  },
};

export const DEFAULT_COUNTRY_CONFIGS: CountryGovernanceConfig[] = [
  {
    code: 'ZA',
    name: 'South Africa',
    region: 'Southern Africa',
    currency: 'ZAR',
    enabled: true,
    featuredHub: true,
    vatRatePct: 15,
    stampDutyPct: 3.5,
    targetRentalYieldPct: 9.8,
    monthlyRevenueTargetZar: 1850000,
  },
  {
    code: 'NG',
    name: 'Nigeria',
    region: 'West Africa',
    currency: 'NGN',
    enabled: true,
    featuredHub: true,
    vatRatePct: 7.5,
    stampDutyPct: 2.0,
    targetRentalYieldPct: 14.2,
    monthlyRevenueTargetZar: 1420000,
  },
  {
    code: 'KE',
    name: 'Kenya',
    region: 'East Africa',
    currency: 'KES',
    enabled: true,
    featuredHub: true,
    vatRatePct: 16,
    stampDutyPct: 4.0,
    targetRentalYieldPct: 11.4,
    monthlyRevenueTargetZar: 980000,
  },
  {
    code: 'GH',
    name: 'Ghana',
    region: 'West Africa',
    currency: 'GHS',
    enabled: true,
    featuredHub: true,
    vatRatePct: 15,
    stampDutyPct: 1.0,
    targetRentalYieldPct: 12.1,
    monthlyRevenueTargetZar: 640000,
  },
  {
    code: 'RW',
    name: 'Rwanda',
    region: 'East Africa',
    currency: 'RWF',
    enabled: true,
    featuredHub: true,
    vatRatePct: 18,
    stampDutyPct: 1.5,
    targetRentalYieldPct: 10.6,
    monthlyRevenueTargetZar: 520000,
  },
  {
    code: 'EG',
    name: 'Egypt',
    region: 'North Africa',
    currency: 'EGP',
    enabled: true,
    featuredHub: false,
    vatRatePct: 14,
    stampDutyPct: 2.5,
    targetRentalYieldPct: 9.4,
    monthlyRevenueTargetZar: 790000,
  },
  {
    code: 'MA',
    name: 'Morocco',
    region: 'North Africa',
    currency: 'MAD',
    enabled: true,
    featuredHub: false,
    vatRatePct: 20,
    stampDutyPct: 4.0,
    targetRentalYieldPct: 8.7,
    monthlyRevenueTargetZar: 610000,
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    region: 'East Africa',
    currency: 'TZS',
    enabled: true,
    featuredHub: false,
    vatRatePct: 18,
    stampDutyPct: 1.0,
    targetRentalYieldPct: 11.9,
    monthlyRevenueTargetZar: 440000,
  },
  {
    code: 'AO',
    name: 'Angola',
    region: 'Central Africa',
    currency: 'AOA',
    enabled: true,
    featuredHub: false,
    vatRatePct: 14,
    stampDutyPct: 2.0,
    targetRentalYieldPct: 12.8,
    monthlyRevenueTargetZar: 380000,
  },
  {
    code: 'BW',
    name: 'Botswana',
    region: 'Southern Africa',
    currency: 'BWP',
    enabled: true,
    featuredHub: false,
    vatRatePct: 14,
    stampDutyPct: 5.0,
    targetRentalYieldPct: 8.9,
    monthlyRevenueTargetZar: 310000,
  },
  {
    code: 'NA',
    name: 'Namibia',
    region: 'Southern Africa',
    currency: 'NAD',
    enabled: true,
    featuredHub: false,
    vatRatePct: 15,
    stampDutyPct: 3.0,
    targetRentalYieldPct: 8.5,
    monthlyRevenueTargetZar: 270000,
  },
  {
    code: 'SN',
    name: 'Senegal',
    region: 'West Africa',
    currency: 'XOF',
    enabled: true,
    featuredHub: false,
    vatRatePct: 18,
    stampDutyPct: 5.0,
    targetRentalYieldPct: 10.4,
    monthlyRevenueTargetZar: 295000,
  },
];

const DEFAULT_GOVERNANCE_STATE: PlatformGovernanceState = {
  settings: DEFAULT_PLATFORM_SETTINGS,
  roleControls: DEFAULT_ROLE_CONTROLS,
  countryConfigs: DEFAULT_COUNTRY_CONFIGS,
  userOverrides: {},
  listingOverrides: {},
  auditFeed: [
    {
      id: 'AUD-INIT',
      timestamp: new Date().toISOString(),
      category: 'Platform Governance',
      action: 'Platform control state initialized and synchronized across active verticals.',
      actor: 'Super Admin',
    },
  ],
};

function loadInitialGovernanceState(): PlatformGovernanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_GOVERNANCE_STATE;
    const parsed = JSON.parse(raw) as Partial<PlatformGovernanceState>;
    return {
      settings: {
        ...DEFAULT_PLATFORM_SETTINGS,
        ...(parsed.settings || {}),
        announcementBanner: {
          ...DEFAULT_PLATFORM_SETTINGS.announcementBanner,
          ...(parsed.settings?.announcementBanner || {}),
        },
        commissionRates: {
          ...DEFAULT_PLATFORM_SETTINGS.commissionRates,
          ...(parsed.settings?.commissionRates || {}),
        },
        featureFlags: {
          ...DEFAULT_PLATFORM_SETTINGS.featureFlags,
          ...(parsed.settings?.featureFlags || {}),
        },
        securityPolicies: {
          ...DEFAULT_PLATFORM_SETTINGS.securityPolicies,
          ...(parsed.settings?.securityPolicies || {}),
        },
      },
      roleControls: {
        ...DEFAULT_ROLE_CONTROLS,
        ...(parsed.roleControls || {}),
      },
      countryConfigs:
        Array.isArray(parsed.countryConfigs) && parsed.countryConfigs.length > 0
          ? parsed.countryConfigs
          : DEFAULT_COUNTRY_CONFIGS,
      userOverrides: parsed.userOverrides || {},
      listingOverrides: parsed.listingOverrides || {},
      auditFeed:
        Array.isArray(parsed.auditFeed) && parsed.auditFeed.length > 0
          ? parsed.auditFeed
          : DEFAULT_GOVERNANCE_STATE.auditFeed,
    };
  } catch {
    return DEFAULT_GOVERNANCE_STATE;
  }
}

interface AdminStateContextType {
  governance: PlatformGovernanceState;
  settings: PlatformSettings;
  roleControls: Record<SovereignRoleKey, RoleGovernanceConfig>;
  countryConfigs: CountryGovernanceConfig[];
  userOverrides: Record<string, UserOverrideRecord>;
  listingOverrides: Record<string, ListingOverrideRecord>;
  auditFeed: GovernanceAuditEntry[];
  broadcastAdminAction: (type: string, data: any) => Promise<void>;
  updateSettings: (partial: Partial<PlatformSettings>, auditSummary?: string) => void;
  resetAllGovernance: () => void;
  updateRolePermission: (
    roleKey: SovereignRoleKey,
    patch: Partial<RoleGovernanceConfig>,
    auditSummary?: string
  ) => void;
  updateCountryConfig: (
    code: string,
    patch: Partial<CountryGovernanceConfig>,
    auditSummary?: string
  ) => void;
  upsertUserOverride: (override: Omit<UserOverrideRecord, 'updatedAt'>, auditSummary?: string) => void;
  upsertListingOverride: (override: Omit<ListingOverrideRecord, 'updatedAt'>, auditSummary?: string) => void;
  recordAuditEvent: (category: string, action: string) => void;
  applyListingOverrides: (items: Property[]) => Property[];
  lastAction: AdminActionPayload | null;
}

const AdminStateContext = createContext<AdminStateContextType | undefined>(undefined);

export const useAdminState = () => {
  const context = useContext(AdminStateContext);
  if (!context) {
    throw new Error('useAdminState must be used within an AdminStateProvider');
  }
  return context;
};

export const AdminStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [governance, setGovernance] = useState<PlatformGovernanceState>(() => loadInitialGovernanceState());
  const [lastAction, setLastAction] = useState<AdminActionPayload | null>(null);
  const channelRef = useRef<any>(null);

  const persistGovernance = useCallback((next: PlatformGovernanceState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  useEffect(() => {
    const channel = supabase.channel('admin-state-broadcast', {
      config: {
        broadcast: { self: true },
      },
    });

    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'admin-action' }, ({ payload }) => {
        setLastAction(payload as AdminActionPayload);
      })
      .subscribe();

    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setGovernance(loadInitialGovernanceState());
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageSync);

    return () => {
      window.removeEventListener('storage', handleStorageSync);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const broadcastAdminAction = useCallback(async (type: string, data: any) => {
    const payload: AdminActionPayload = {
      type,
      data,
      timestamp: new Date().toISOString(),
      sender: 'SuperAdmin',
    };
    setLastAction(payload);
    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'admin-action',
          payload,
        });
      }
    } catch {
      // Offline / demo fallback relies cleanly on local setLastAction
    }
  }, []);

  const appendAudit = (
    prev: PlatformGovernanceState,
    category: string,
    action: string
  ): GovernanceAuditEntry[] => {
    const entry: GovernanceAuditEntry = {
      id: `AUD-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      category,
      action,
      actor: 'Super Admin',
    };
    return [entry, ...prev.auditFeed].slice(0, 60);
  };

  const recordAuditEvent = useCallback(
    (category: string, action: string) => {
      setGovernance((prev) => {
        const next: PlatformGovernanceState = {
          ...prev,
          auditFeed: appendAudit(prev, category, action),
        };
        persistGovernance(next);
        return next;
      });
    },
    [persistGovernance]
  );

  const updateSettings = useCallback(
    (partial: Partial<PlatformSettings>, auditSummary?: string) => {
      setGovernance((prev) => {
        const mergedSettings: PlatformSettings = {
          ...prev.settings,
          ...partial,
          announcementBanner: partial.announcementBanner
            ? { ...prev.settings.announcementBanner, ...partial.announcementBanner }
            : prev.settings.announcementBanner,
          commissionRates: partial.commissionRates
            ? { ...prev.settings.commissionRates, ...partial.commissionRates }
            : prev.settings.commissionRates,
          featureFlags: partial.featureFlags
            ? { ...prev.settings.featureFlags, ...partial.featureFlags }
            : prev.settings.featureFlags,
          securityPolicies: partial.securityPolicies
            ? { ...prev.settings.securityPolicies, ...partial.securityPolicies }
            : prev.settings.securityPolicies,
          updatedAt: Date.now(),
        };
        const next: PlatformGovernanceState = {
          ...prev,
          settings: mergedSettings,
          auditFeed: appendAudit(
            prev,
            'Platform Settings',
            auditSummary || 'Updated platform configuration and published changes across all modules.'
          ),
        };
        persistGovernance(next);
        return next;
      });
      broadcastAdminAction('settings_updated', partial);
    },
    [persistGovernance, broadcastAdminAction]
  );

  const resetAllGovernance = useCallback(() => {
    const resetState: PlatformGovernanceState = {
      ...DEFAULT_GOVERNANCE_STATE,
      settings: { ...DEFAULT_PLATFORM_SETTINGS, updatedAt: Date.now() },
      auditFeed: [
        {
          id: `AUD-${Date.now().toString(36).toUpperCase()}`,
          timestamp: new Date().toISOString(),
          category: 'Platform Settings',
          action: 'Restored platform settings, commission rates, roles, and country defaults.',
          actor: 'Super Admin',
        },
      ],
    };
    setGovernance(resetState);
    persistGovernance(resetState);
    broadcastAdminAction('settings_reset', {});
  }, [persistGovernance, broadcastAdminAction]);

  const updateRolePermission = useCallback(
    (roleKey: SovereignRoleKey, patch: Partial<RoleGovernanceConfig>, auditSummary?: string) => {
      setGovernance((prev) => {
        const currentRole = prev.roleControls[roleKey];
        if (!currentRole) return prev;
        const next: PlatformGovernanceState = {
          ...prev,
          roleControls: {
            ...prev.roleControls,
            [roleKey]: { ...currentRole, ...patch },
          },
          auditFeed: appendAudit(
            prev,
            'Role Governance',
            auditSummary || `Updated permissions for role: ${currentRole.label}.`
          ),
        };
        persistGovernance(next);
        return next;
      });
      broadcastAdminAction('role_policy_updated', { roleKey, patch });
    },
    [persistGovernance, broadcastAdminAction]
  );

  const updateCountryConfig = useCallback(
    (code: string, patch: Partial<CountryGovernanceConfig>, auditSummary?: string) => {
      setGovernance((prev) => {
        const nextCountries = prev.countryConfigs.map((c) => (c.code === code ? { ...c, ...patch } : c));
        const target = nextCountries.find((c) => c.code === code);
        const next: PlatformGovernanceState = {
          ...prev,
          countryConfigs: nextCountries,
          auditFeed: appendAudit(
            prev,
            'Country Governance',
            auditSummary || `Updated ${target?.name || code} market settings.`
          ),
        };
        persistGovernance(next);
        return next;
      });
      broadcastAdminAction('country_config_updated', { code, patch });
    },
    [persistGovernance, broadcastAdminAction]
  );

  const upsertUserOverride = useCallback(
    (override: Omit<UserOverrideRecord, 'updatedAt'>, auditSummary?: string) => {
      setGovernance((prev) => {
        const key = override.id.toLowerCase();
        const existing = prev.userOverrides[key] || { id: override.id, updatedAt: Date.now() };
        const merged: UserOverrideRecord = {
          ...existing,
          ...override,
          updatedAt: Date.now(),
        };
        const nextMap: Record<string, UserOverrideRecord> = {
          ...prev.userOverrides,
          [key]: merged,
        };
        if (override.email) {
          nextMap[override.email.toLowerCase()] = merged;
        }
        const next: PlatformGovernanceState = {
          ...prev,
          userOverrides: nextMap,
          auditFeed: appendAudit(
            prev,
            'User Access',
            auditSummary || `Updated account governance for ${override.email || override.id}.`
          ),
        };
        persistGovernance(next);
        return next;
      });
      broadcastAdminAction('user_override_updated', override);
    },
    [persistGovernance, broadcastAdminAction]
  );

  const upsertListingOverride = useCallback(
    (override: Omit<ListingOverrideRecord, 'updatedAt'>, auditSummary?: string) => {
      setGovernance((prev) => {
        const existing = prev.listingOverrides[override.id] || { id: override.id, updatedAt: Date.now() };
        const merged: ListingOverrideRecord = {
          ...existing,
          ...override,
          updatedAt: Date.now(),
        };
        const next: PlatformGovernanceState = {
          ...prev,
          listingOverrides: {
            ...prev.listingOverrides,
            [override.id]: merged,
          },
          auditFeed: appendAudit(
            prev,
            'Listing Moderation',
            auditSummary || `Updated listing state for ${override.id}.`
          ),
        };
        persistGovernance(next);
        return next;
      });
      broadcastAdminAction('listing_override_updated', override);
    },
    [persistGovernance, broadcastAdminAction]
  );

  const applyListingOverrides = useCallback(
    (items: Property[]): Property[] => {
      const disabledCountryNames = new Set(
        governance.countryConfigs.filter((c) => !c.enabled).map((c) => c.name.toLowerCase())
      );

      return items
        .filter((item) => {
          const ov = governance.listingOverrides[item.id];
          if (ov?.hidden) return false;
          if (item.country && disabledCountryNames.has(item.country.toLowerCase())) return false;
          return true;
        })
        .map((item) => {
          const ov = governance.listingOverrides[item.id];
          if (!ov) return item;
          return {
            ...item,
            status: ov.status !== undefined ? ov.status : item.status,
            verified: ov.verified !== undefined ? ov.verified : item.verified,
            featured: ov.featured !== undefined ? ov.featured : item.featured,
            price: ov.priceOverride !== undefined ? ov.priceOverride : item.price,
          };
        });
    },
    [governance.listingOverrides, governance.countryConfigs]
  );

  return (
    <AdminStateContext.Provider
      value={{
        governance,
        settings: governance.settings,
        roleControls: governance.roleControls,
        countryConfigs: governance.countryConfigs,
        userOverrides: governance.userOverrides,
        listingOverrides: governance.listingOverrides,
        auditFeed: governance.auditFeed,
        broadcastAdminAction,
        updateSettings,
        resetAllGovernance,
        updateRolePermission,
        updateCountryConfig,
        upsertUserOverride,
        upsertListingOverride,
        recordAuditEvent,
        applyListingOverrides,
        lastAction,
      }}
    >
      {children}
    </AdminStateContext.Provider>
  );
};
