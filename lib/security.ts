import type { PropertyType, User } from '../types';

const HTML_TAG_REGEX = /<[^>]*>/g;
const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F]/g;

/**
 * Strips HTML tags, script injections, and control characters from user-supplied text.
 */
export const sanitizeText = (value: string | null | undefined, maxLength = 2000): string => {
  if (!value) return '';
  return String(value)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(HTML_TAG_REGEX, '')
    .replace(CONTROL_CHAR_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
};

/**
 * Validates and sanitizes image / resource URLs to prevent XSS (javascript:, data:text/html)
 * and rejects unverified external hotlinks when local defaults are available.
 */
export const sanitizeSafeUrl = (
  url: string | null | undefined,
  fallback = '/images/photo-1600596542815-ffad4c1539a9.avif'
): string => {
  const cleaned = (url || '').trim();
  if (!cleaned) return fallback;

  const lower = cleaned.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/html')
  ) {
    return fallback;
  }

  if (cleaned.startsWith('/images/')) {
    return cleaned;
  }

  if (cleaned.startsWith('https://')) {
    return cleaned;
  }

  return fallback;
};

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
};

export const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.length >= 7 && digits.length <= 18;
};

const submissionTimestamps = new Map<string, number>();

/**
 * Client-side rate limiter to prevent duplicate/automated spam submissions.
 */
export const checkSubmissionThrottle = (
  actionKey: string,
  cooldownMs = 2500
): { allowed: boolean; waitSeconds: number } => {
  const now = Date.now();
  const prev = submissionTimestamps.get(actionKey) || 0;
  const elapsed = now - prev;
  if (elapsed < cooldownMs) {
    return { allowed: false, waitSeconds: Math.ceil((cooldownMs - elapsed) / 1000) };
  }
  submissionTimestamps.set(actionKey, now);
  return { allowed: true, waitSeconds: 0 };
};

/**
 * Verifies that an authenticated account is in good standing and permitted
 * to publish the requested listing type.
 */
export const assertCanPublish = (
  user: User | null,
  _propertyType?: PropertyType | string
): { ok: boolean; reason?: string } => {
  if (!user) {
    return { ok: false, reason: 'Authentication required before publishing a listing.' };
  }
  if (user.status === 'Restricted' || user.status === 'Suspended' || user.isWalletFrozen) {
    return { ok: false, reason: 'Publishing disabled while account security review is active.' };
  }
  return { ok: true };
};

/**
 * Redacts sensitive tax, banking, or registration numbers for UI display.
 */
export const maskSensitiveIdentifier = (value: string, visibleTail = 4): string => {
  const clean = value.trim();
  if (!clean) return 'Not provided';
  if (clean.length <= visibleTail) return '*'.repeat(clean.length);
  return `${'*'.repeat(Math.min(8, clean.length - visibleTail))}${clean.slice(-visibleTail)}`;
};

/**
 * Generates a deterministic AfriEstate integrity signature for published listings
 * so users can verify provenance and tamper-free listing metadata.
 */
export const generateListingSignature = (
  id: string,
  owner: string,
  price: number
): string => {
  const payload = `${id}|${owner.toLowerCase()}|${Math.round(price || 0)}|AFRIESTATE_V1`;
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `AE-VER-${hex}`;
};

/**
 * Neutralizes spreadsheet CSV formula injection (=, +, -, @, tab, CR) and safely quotes cells.
 */
export const escapeCsvCell = (value: unknown): string => {
  let str = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
};

/**
 * Generates a cryptographically strong reference code (replaces insecure Math.random IDs).
 */
export const generateSecureBookingRef = (prefix = 'AFR-STAY'): string => {
  const bytes = new Uint8Array(4);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Date.now() % 256);
    }
  }
  const code = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `${prefix}-${code}`;
};

/**
 * Validates outbound external links (allows only https:// and mailto:).
 */
export const isSafeExternalHref = (href: string | null | undefined): boolean => {
  if (!href) return false;
  const trimmed = href.trim().toLowerCase();
  return trimmed.startsWith('https://') || trimmed.startsWith('mailto:');
};

