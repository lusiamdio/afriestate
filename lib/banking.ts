import { fetchJsonStrict } from './http';
import { supabase } from './supabase';
import type { User } from '../types';

export type PayoutRailType = 'local_eft_visa' | 'bank_iban_visa' | 'visa_direct_card';

export type AcceptedRevenueCategory = 'short-stay' | 'car-hire' | 'commissions' | 'distributions';

export interface ConnectedPayoutAccount {
  id: string;
  username: string;
  accountHolderName: string;
  bankName: string;
  country: string;
  settlementCurrency: string;
  payoutRail: PayoutRailType;
  accountLast4: string;
  ibanMasked?: string;
  swiftBic?: string;
  routingCodeMasked?: string;
  visaCardBrand: string;
  visaDirectSupported: boolean;
  verificationRef: string;
  verificationStatus: 'Pending' | 'Verified' | 'Paused';
  isDefault: boolean;
  acceptedCategories: AcceptedRevenueCategory[];
  createdAt: string;
  storageMode: 'supabase' | 'local-masked';
}

export interface ConnectPayoutAccountInput {
  accountHolderName: string;
  bankName: string;
  country: string;
  settlementCurrency: string;
  payoutRail: PayoutRailType;
  localAccountNumber?: string;
  routingCode?: string;
  iban?: string;
  swiftBic?: string;
  visaCardNumber?: string;
  acceptedCategories: AcceptedRevenueCategory[];
}

export interface VisaBankingCapabilities {
  visaSupported: boolean;
  settlementMode: 'live-gateway' | 'sandbox-verified';
  liveVisaGatewayConfigured: boolean;
  visaRails: Array<{
    id: string;
    label: string;
    description: string;
    status: string;
  }>;
  supportedCorridors: Array<{
    country: string;
    currency: string;
    rails: string;
  }>;
  checkedAt: string;
}

interface ValidatedConnectionPayload {
  ok: true;
  accountHolderName: string;
  bankName: string;
  country: string;
  settlementCurrency: string;
  payoutRail: PayoutRailType;
  accountLast4: string;
  ibanMasked?: string;
  swiftBic?: string;
  routingCodeMasked?: string;
  visaCardBrand: string;
  visaDirectSupported: boolean;
  verificationRef: string;
  acceptedCategories: AcceptedRevenueCategory[];
}

const storageKeyForUser = (username: string) =>
  `afriestate_payout_accounts_${username.toLowerCase().trim()}`;

const readLocalMaskedAccounts = (username: string): ConnectedPayoutAccount[] => {
  try {
    const raw = localStorage.getItem(storageKeyForUser(username));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalMaskedAccounts = (username: string, accounts: ConnectedPayoutAccount[]) => {
  try {
    localStorage.setItem(storageKeyForUser(username), JSON.stringify(accounts));
  } catch {
    // ignore storage quota errors
  }
};

const mapRowToAccount = (row: any): ConnectedPayoutAccount => ({
  id: String(row.id),
  username: String(row.username || ''),
  accountHolderName: String(row.account_holder_name || ''),
  bankName: String(row.bank_name || ''),
  country: String(row.country || 'South Africa'),
  settlementCurrency: String(row.settlement_currency || 'ZAR'),
  payoutRail: (row.payout_rail as PayoutRailType) || 'local_eft_visa',
  accountLast4: String(row.account_last4 || '0000'),
  ibanMasked: row.iban_masked || undefined,
  swiftBic: row.swift_bic || undefined,
  routingCodeMasked: row.routing_code_masked || undefined,
  visaCardBrand: String(row.visa_card_brand || 'Visa Direct Supported'),
  visaDirectSupported: row.visa_direct_supported !== false,
  verificationRef: String(row.verification_ref || ''),
  verificationStatus: row.verification_status || 'Verified',
  isDefault: Boolean(row.is_default),
  acceptedCategories: Array.isArray(row.accepted_categories)
    ? row.accepted_categories
    : ['short-stay', 'car-hire', 'commissions'],
  createdAt: String(row.created_at || new Date().toISOString()),
  storageMode: 'supabase',
});

export async function fetchVisaCapabilities(): Promise<VisaBankingCapabilities> {
  return fetchJsonStrict<VisaBankingCapabilities>('/api/banking/visa-capabilities', {
    timeoutMs: 8000,
  });
}

export async function fetchConnectedPayoutAccounts(
  user: User | null
): Promise<{ accounts: ConnectedPayoutAccount[]; supabaseSynced: boolean }> {
  if (!user) return { accounts: [], supabaseSynced: false };

  try {
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;
    if (authUser) {
      const { data, error } = await supabase
        .from('payout_bank_accounts')
        .select('*')
        .eq('user_id', authUser.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped = data.map(mapRowToAccount);
        writeLocalMaskedAccounts(user.username, mapped);
        return { accounts: mapped, supabaseSynced: true };
      }
    }
  } catch {
    // Graceful fallback if table migration has not been applied yet
  }

  return {
    accounts: readLocalMaskedAccounts(user.username),
    supabaseSynced: false,
  };
}

export async function connectPayoutAccount(
  user: User,
  input: ConnectPayoutAccountInput
): Promise<{ account: ConnectedPayoutAccount; supabaseSynced: boolean }> {
  const validated = await fetchJsonStrict<ValidatedConnectionPayload>(
    '/api/banking/validate-connection',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      timeoutMs: 12000,
    }
  );

  const existingLocal = readLocalMaskedAccounts(user.username);
  const shouldBeDefault = existingLocal.length === 0;

  try {
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;
    if (authUser) {
      const { count } = await supabase
        .from('payout_bank_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', authUser.id);

      const makeDefault = (count ?? 0) === 0;
      const { data, error } = await supabase
        .from('payout_bank_accounts')
        .insert({
          user_id: authUser.id,
          username: user.username,
          account_holder_name: validated.accountHolderName,
          bank_name: validated.bankName,
          country: validated.country,
          settlement_currency: validated.settlementCurrency,
          payout_rail: validated.payoutRail,
          account_last4: validated.accountLast4,
          iban_masked: validated.ibanMasked || null,
          swift_bic: validated.swiftBic || null,
          routing_code_masked: validated.routingCodeMasked || null,
          visa_card_brand: validated.visaCardBrand,
          visa_direct_supported: validated.visaDirectSupported,
          verification_ref: validated.verificationRef,
          verification_status: 'Verified',
          is_default: makeDefault,
          accepted_categories: validated.acceptedCategories,
        })
        .select('*')
        .single();

      if (!error && data) {
        const mapped = mapRowToAccount(data);
        writeLocalMaskedAccounts(user.username, [mapped, ...existingLocal.filter((a) => a.id !== mapped.id)]);
        return { account: mapped, supabaseSynced: true };
      }
    }
  } catch {
    // Fallback to masked user-scoped storage if SQL table is not yet created
  }

  const localRecord: ConnectedPayoutAccount = {
    id: `payout_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    username: user.username,
    accountHolderName: validated.accountHolderName,
    bankName: validated.bankName,
    country: validated.country,
    settlementCurrency: validated.settlementCurrency,
    payoutRail: validated.payoutRail,
    accountLast4: validated.accountLast4,
    ibanMasked: validated.ibanMasked,
    swiftBic: validated.swiftBic,
    routingCodeMasked: validated.routingCodeMasked,
    visaCardBrand: validated.visaCardBrand,
    visaDirectSupported: validated.visaDirectSupported,
    verificationRef: validated.verificationRef,
    verificationStatus: 'Verified',
    isDefault: shouldBeDefault,
    acceptedCategories: validated.acceptedCategories,
    createdAt: new Date().toISOString(),
    storageMode: 'local-masked',
  };
  writeLocalMaskedAccounts(user.username, [localRecord, ...existingLocal]);
  return { account: localRecord, supabaseSynced: false };
}

export async function setDefaultPayoutAccount(user: User, accountId: string): Promise<void> {
  const current = readLocalMaskedAccounts(user.username).map((acc) => ({
    ...acc,
    isDefault: acc.id === accountId,
  }));
  writeLocalMaskedAccounts(user.username, current);

  try {
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;
    if (authUser) {
      await supabase
        .from('payout_bank_accounts')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('user_id', authUser.id);
      await supabase
        .from('payout_bank_accounts')
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq('user_id', authUser.id)
        .eq('id', accountId);
    }
  } catch {
    // non-fatal fallback
  }
}

export async function disconnectPayoutAccount(user: User, accountId: string): Promise<void> {
  const remaining = readLocalMaskedAccounts(user.username).filter((acc) => acc.id !== accountId);
  if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
    remaining[0].isDefault = true;
  }
  writeLocalMaskedAccounts(user.username, remaining);

  try {
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;
    if (authUser) {
      await supabase
        .from('payout_bank_accounts')
        .delete()
        .eq('user_id', authUser.id)
        .eq('id', accountId);
    }
  } catch {
    // non-fatal fallback
  }
}
