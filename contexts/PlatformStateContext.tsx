import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '../types';
import { sanitizeText } from '../lib/security';

export interface SharedJourneyState {
  destinationCity: string;
  originAirport: string;
  destinationAirport: string;
  checkInDate: string;
  returnDate: string;
  guestsLabel: string;
  travelerCount: number;
}

export type PlatformBookingCategory =
  | 'flight'
  | 'short-stay'
  | 'lease-inquiry'
  | 'car-hire'
  | 'wellness';

export type PlatformVerticalTarget =
  | 'book-flights'
  | 'book-a-stay'
  | 'long-term-stays'
  | 'rent-a-car'
  | 'find-wellness';

export interface PlatformBookingRecord {
  id: string;
  category: PlatformBookingCategory;
  reference: string;
  title: string;
  subtitle: string;
  city: string;
  startDate: string;
  endDate?: string;
  amountZar: number;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
  customerName: string;
  customerEmail: string;
  createdAt: string;
  targetPage: PlatformVerticalTarget;
}

const AIRPORT_TO_CITY: Record<string, string> = {
  CPT: 'Cape Town',
  JNB: 'Johannesburg',
  DUR: 'Durban',
  LOS: 'Lagos',
  ABV: 'Abuja',
  NBO: 'Nairobi',
  ACC: 'Accra',
  ADD: 'Addis Ababa',
  CAI: 'Cairo',
  CMN: 'Casablanca',
  DAR: 'Dar es Salaam',
  KGL: 'Kigali',
  LAD: 'Luanda',
  EBB: 'Entebbe',
  MPM: 'Maputo',
  WDH: 'Windhoek',
  GBE: 'Gaborone',
  HRE: 'Harare',
  LUN: 'Lusaka',
  MRU: 'Port Louis',
  LHR: 'London',
  DXB: 'Dubai',
};

const CITY_TO_AIRPORT: Record<string, string> = Object.entries(AIRPORT_TO_CITY).reduce(
  (acc, [code, city]) => {
    acc[city.toLowerCase()] = code;
    return acc;
  },
  {} as Record<string, string>
);

export function resolveCityFromAirport(code?: string): string {
  if (!code) return '';
  return AIRPORT_TO_CITY[code.trim().toUpperCase()] || '';
}

export function resolveAirportFromCity(city?: string): string {
  if (!city) return '';
  const clean = city.trim().toLowerCase();
  if (CITY_TO_AIRPORT[clean]) return CITY_TO_AIRPORT[clean];
  for (const [cityKey, code] of Object.entries(CITY_TO_AIRPORT)) {
    if (clean.includes(cityKey) || cityKey.includes(clean)) {
      return code;
    }
  }
  return '';
}

const DEFAULT_JOURNEY: SharedJourneyState = {
  destinationCity: 'Cape Town',
  originAirport: 'CPT',
  destinationAirport: 'LOS',
  checkInDate: '2026-12-12',
  returnDate: '2026-12-15',
  guestsLabel: '2 guests · 1 room',
  travelerCount: 2,
};

const JOURNEY_STORAGE_KEY = 'afriestate_shared_journey_v1';
const BOOKINGS_STORAGE_PREFIX = 'afriestate_unified_bookings_v1_';
const SAVED_STAYS_PREFIX = 'afriestate_saved_stays_v1_';

interface PlatformStateContextValue {
  currentUser: User | null;
  isAuthLoading: boolean;
  setSessionUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  sharedJourney: SharedJourneyState;
  updateSharedJourney: (patch: Partial<SharedJourneyState>) => void;
  unifiedBookings: PlatformBookingRecord[];
  addPlatformBooking: (
    booking: Omit<PlatformBookingRecord, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
  ) => void;
  updatePlatformBookingStatus: (
    reference: string,
    status: PlatformBookingRecord['status']
  ) => void;
  savedStayIds: string[];
  toggleSavedStay: (stayId: string) => boolean;
  compareStayIds: string[];
  toggleCompareStay: (stayId: string) => void;
}

const PlatformStateContext = createContext<PlatformStateContextValue | undefined>(undefined);

function readStorageJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorageJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota issues
  }
}

export const PlatformStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setSessionUser] = useState<User | null>(null);
  const [isAuthLoading, setAuthLoading] = useState<boolean>(true);

  const [sharedJourney, setSharedJourney] = useState<SharedJourneyState>(() => {
    const stored = readStorageJson<Partial<SharedJourneyState>>(JOURNEY_STORAGE_KEY, {});
    return {
      ...DEFAULT_JOURNEY,
      ...stored,
    };
  });

  const userScope = currentUser?.id || currentUser?.username || 'guest';

  const [unifiedBookings, setUnifiedBookings] = useState<PlatformBookingRecord[]>(() =>
    readStorageJson<PlatformBookingRecord[]>(`${BOOKINGS_STORAGE_PREFIX}guest`, [])
  );

  const [savedStayIds, setSavedStayIds] = useState<string[]>(() =>
    readStorageJson<string[]>(`${SAVED_STAYS_PREFIX}guest`, ['african-grand-hotel'])
  );

  const [compareStayIds, setCompareStayIds] = useState<string[]>([]);

  // Synchronize user-scoped bookings & saved stays cleanly whenever auth scope changes,
  // merging guest-session actions into the signed-in user scope once authenticated.
  useEffect(() => {
    const scopedBookingsKey = `${BOOKINGS_STORAGE_PREFIX}${userScope}`;
    const scopedStaysKey = `${SAVED_STAYS_PREFIX}${userScope}`;

    const scopedBookings = readStorageJson<PlatformBookingRecord[]>(scopedBookingsKey, []);
    const scopedStays = readStorageJson<string[]>(
      scopedStaysKey,
      userScope === 'guest' ? ['african-grand-hotel'] : []
    );

    if (userScope !== 'guest') {
      const guestBookings = readStorageJson<PlatformBookingRecord[]>(`${BOOKINGS_STORAGE_PREFIX}guest`, []);
      const seenRefs = new Set(scopedBookings.map((b) => b.reference));
      const mergedBookings = [
        ...scopedBookings,
        ...guestBookings.filter((g) => !seenRefs.has(g.reference)),
      ];
      if (mergedBookings.length !== scopedBookings.length) {
        writeStorageJson(scopedBookingsKey, mergedBookings);
        writeStorageJson(`${BOOKINGS_STORAGE_PREFIX}guest`, []);
      }
      setUnifiedBookings(mergedBookings);

      const guestStays = readStorageJson<string[]>(`${SAVED_STAYS_PREFIX}guest`, []);
      const mergedStays = Array.from(new Set([...scopedStays, ...guestStays]));
      if (mergedStays.length === 0) {
        mergedStays.push('african-grand-hotel');
      }
      setSavedStayIds(mergedStays);
      writeStorageJson(scopedStaysKey, mergedStays);
    } else {
      setUnifiedBookings(scopedBookings);
      setSavedStayIds(scopedStays.length > 0 ? scopedStays : ['african-grand-hotel']);
    }
  }, [userScope]);

  const updateSharedJourney = useCallback((patch: Partial<SharedJourneyState>) => {
    setSharedJourney((prev) => {
      const next: SharedJourneyState = { ...prev, ...patch };
      // Auto-resolve city <-> airport when only one side is updated
      if (patch.destinationAirport && !patch.destinationCity) {
        const mappedCity = resolveCityFromAirport(patch.destinationAirport);
        if (mappedCity) next.destinationCity = mappedCity;
      } else if (patch.destinationCity && !patch.destinationAirport) {
        const mappedCode = resolveAirportFromCity(patch.destinationCity);
        if (mappedCode) next.destinationAirport = mappedCode;
      }
      writeStorageJson(JOURNEY_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const addPlatformBooking = useCallback(
    (
      booking: Omit<PlatformBookingRecord, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
    ) => {
      const entry: PlatformBookingRecord = {
        id: booking.id || `pb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: booking.createdAt || new Date().toISOString(),
        category: booking.category,
        reference: sanitizeText(booking.reference, 60),
        title: sanitizeText(booking.title, 160),
        subtitle: sanitizeText(booking.subtitle, 220),
        city: sanitizeText(booking.city, 80),
        startDate: sanitizeText(booking.startDate, 40),
        endDate: booking.endDate ? sanitizeText(booking.endDate, 40) : undefined,
        amountZar: Number.isFinite(booking.amountZar) ? Math.max(0, Math.round(booking.amountZar)) : 0,
        status: booking.status,
        customerName: sanitizeText(booking.customerName, 120),
        customerEmail: sanitizeText(booking.customerEmail, 120).toLowerCase(),
        targetPage: booking.targetPage,
      };

      setUnifiedBookings((prev) => {
        const deduped = prev.filter((item) => item.reference !== entry.reference);
        const next = [entry, ...deduped].slice(0, 60);
        writeStorageJson(`${BOOKINGS_STORAGE_PREFIX}${userScope}`, next);
        return next;
      });
    },
    [userScope]
  );

  const updatePlatformBookingStatus = useCallback(
    (reference: string, status: PlatformBookingRecord['status']) => {
      setUnifiedBookings((prev) => {
        const next = prev.map((b) => (b.reference === reference ? { ...b, status } : b));
        writeStorageJson(`${BOOKINGS_STORAGE_PREFIX}${userScope}`, next);
        return next;
      });
    },
    [userScope]
  );

  const toggleSavedStay = useCallback(
    (stayId: string): boolean => {
      let added = false;
      setSavedStayIds((prev) => {
        const exists = prev.includes(stayId);
        added = !exists;
        const next = exists ? prev.filter((id) => id !== stayId) : [...prev, stayId];
        writeStorageJson(`${SAVED_STAYS_PREFIX}${userScope}`, next);
        return next;
      });
      return added;
    },
    [userScope]
  );

  const toggleCompareStay = useCallback((stayId: string) => {
    setCompareStayIds((prev) => {
      if (prev.includes(stayId)) return prev.filter((id) => id !== stayId);
      if (prev.length >= 3) return prev;
      return [...prev, stayId];
    });
  }, []);

  const value = useMemo<PlatformStateContextValue>(
    () => ({
      currentUser,
      isAuthLoading,
      setSessionUser,
      setAuthLoading,
      sharedJourney,
      updateSharedJourney,
      unifiedBookings,
      addPlatformBooking,
      updatePlatformBookingStatus,
      savedStayIds,
      toggleSavedStay,
      compareStayIds,
      toggleCompareStay,
    }),
    [
      currentUser,
      isAuthLoading,
      sharedJourney,
      updateSharedJourney,
      unifiedBookings,
      addPlatformBooking,
      updatePlatformBookingStatus,
      savedStayIds,
      toggleSavedStay,
      compareStayIds,
      toggleCompareStay,
    ]
  );

  return <PlatformStateContext.Provider value={value}>{children}</PlatformStateContext.Provider>;
};

export function usePlatformState(): PlatformStateContextValue {
  const ctx = useContext(PlatformStateContext);
  if (!ctx) {
    throw new Error('usePlatformState must be used within PlatformStateProvider');
  }
  return ctx;
}
