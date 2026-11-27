import React, { useEffect, useState } from 'react';
import {
  BuildingLibraryIcon,
  CheckCircleIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import type { User } from '../../types';
import {
  connectPayoutAccount,
  disconnectPayoutAccount,
  fetchConnectedPayoutAccounts,
  fetchVisaCapabilities,
  setDefaultPayoutAccount,
  type AcceptedRevenueCategory,
  type ConnectedPayoutAccount,
  type PayoutRailType,
  type VisaBankingCapabilities,
} from '../../lib/banking';

interface VisaBankingConnectPanelProps {
  user: User;
  roleLabel?: string;
  defaultCategories?: AcceptedRevenueCategory[];
  onNotify?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const COUNTRY_CURRENCIES: Array<{ country: string; currency: string; sampleBank: string }> = [
  { country: 'South Africa', currency: 'ZAR', sampleBank: 'First National Bank (FNB)' },
  { country: 'Kenya', currency: 'KES', sampleBank: 'Equity Bank Kenya' },
  { country: 'Nigeria', currency: 'NGN', sampleBank: 'Zenith Bank' },
  { country: 'Ghana', currency: 'GHS', sampleBank: 'Ecobank Ghana' },
  { country: 'Morocco', currency: 'MAD', sampleBank: 'Attijariwafa Bank' },
  { country: 'Egypt', currency: 'EGP', sampleBank: 'Commercial International Bank (CIB)' },
  { country: 'Mauritius', currency: 'MUR', sampleBank: 'MCB Mauritius' },
  { country: 'United Kingdom / Diaspora', currency: 'GBP', sampleBank: 'Barclays UK' },
  { country: 'Eurozone / Diaspora', currency: 'EUR', sampleBank: 'Deutsche Bank' },
  { country: 'United States / Diaspora', currency: 'USD', sampleBank: 'JPMorgan Chase' },
];

const CATEGORY_OPTIONS: Array<{ id: AcceptedRevenueCategory; label: string }> = [
  { id: 'short-stay', label: 'Short-Stay Bookings' },
  { id: 'car-hire', label: 'Car Hire & Vehicle Deposits' },
  { id: 'commissions', label: 'Agent Commissions & Fees' },
  { id: 'distributions', label: 'Investor Distributions' },
];

const VisaBadgeSvg: React.FC = () => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1434CB] text-white text-[11px] font-bold tracking-wider uppercase shadow-xs">
    <svg viewBox="0 0 48 16" className="w-8 h-3 fill-current" aria-hidden="true">
      <text x="0" y="13" fontFamily="Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="14">
        VISA
      </text>
    </svg>
    <span>Supported</span>
  </span>
);

export const VisaBankingConnectPanel: React.FC<VisaBankingConnectPanelProps> = ({
  user,
  roleLabel = 'AfriEstate Account',
  defaultCategories = ['short-stay', 'car-hire', 'commissions'],
  onNotify,
}) => {
  const [accounts, setAccounts] = useState<ConnectedPayoutAccount[]>([]);
  const [supabaseSynced, setSupabaseSynced] = useState<boolean>(false);
  const [capabilities, setCapabilities] = useState<VisaBankingCapabilities | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [payoutRail, setPayoutRail] = useState<PayoutRailType>('local_eft_visa');
  const [accountHolderName, setAccountHolderName] = useState<string>(user.fullName || user.username || '');
  const [country, setCountry] = useState<string>(user.country || 'South Africa');
  const [settlementCurrency, setSettlementCurrency] = useState<string>('ZAR');
  const [bankName, setBankName] = useState<string>('');
  const [localAccountNumber, setLocalAccountNumber] = useState<string>('');
  const [routingCode, setRoutingCode] = useState<string>('');
  const [iban, setIban] = useState<string>('');
  const [swiftBic, setSwiftBic] = useState<string>('');
  const [visaCardNumber, setVisaCardNumber] = useState<string>('');
  const [acceptedCategories, setAcceptedCategories] = useState<AcceptedRevenueCategory[]>(defaultCategories);

  useEffect(() => {
    let active = true;
    const loadAll = async () => {
      setLoading(true);
      try {
        const [{ accounts: loaded, supabaseSynced: synced }, caps] = await Promise.all([
          fetchConnectedPayoutAccounts(user),
          fetchVisaCapabilities().catch(() => null),
        ]);
        if (!active) return;
        setAccounts(loaded);
        setSupabaseSynced(synced);
        if (caps) setCapabilities(caps);
        if (loaded.length === 0) {
          setShowForm(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadAll();
    return () => {
      active = false;
    };
  }, [user]);

  const handleCountryChange = (nextCountry: string) => {
    setCountry(nextCountry);
    const matched = COUNTRY_CURRENCIES.find((c) => c.country === nextCountry);
    if (matched) {
      setSettlementCurrency(matched.currency);
    }
  };

  const toggleCategory = (cat: AcceptedRevenueCategory) => {
    setAcceptedCategories((prev) =>
      prev.includes(cat) ? (prev.length > 1 ? prev.filter((c) => c !== cat) : prev) : [...prev, cat]
    );
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);

    if (user.isWalletFrozen) {
      setErrorMsg('Your payout wallet is currently frozen by governance review.');
      return;
    }

    setSubmitting(true);
    try {
      const { account, supabaseSynced: synced } = await connectPayoutAccount(user, {
        accountHolderName,
        bankName:
          payoutRail === 'visa_direct_card' && !bankName.trim()
            ? 'Visa Direct Card Issuer'
            : bankName,
        country,
        settlementCurrency,
        payoutRail,
        localAccountNumber: payoutRail === 'local_eft_visa' ? localAccountNumber : undefined,
        routingCode: payoutRail === 'local_eft_visa' ? routingCode : undefined,
        iban: payoutRail === 'bank_iban_visa' ? iban : undefined,
        swiftBic: payoutRail !== 'visa_direct_card' ? swiftBic : undefined,
        visaCardNumber: visaCardNumber.trim() ? visaCardNumber : undefined,
        acceptedCategories,
      });

      setAccounts((prev) => [account, ...prev.filter((a) => a.id !== account.id)]);
      setSupabaseSynced(synced);
      setLocalAccountNumber('');
      setRoutingCode('');
      setIban('');
      setVisaCardNumber('');
      setShowForm(false);
      onNotify?.(
        `Connected ${account.bankName} (•••• ${account.accountLast4}) with Visa payment acceptance.`,
        'success'
      );
    } catch (err: any) {
      const msg = err?.message || 'Could not validate banking details.';
      setErrorMsg(msg);
      onNotify?.(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMakeDefault = async (accountId: string) => {
    await setDefaultPayoutAccount(user, accountId);
    setAccounts((prev) => prev.map((a) => ({ ...a, isDefault: a.id === accountId })));
    onNotify?.('Default Visa payout destination updated.', 'success');
  };

  const handleDisconnect = async (accountId: string) => {
    await disconnectPayoutAccount(user, accountId);
    setAccounts((prev) => {
      const next = prev.filter((a) => a.id !== accountId);
      if (next.length > 0 && !next.some((a) => a.isDefault)) {
        next[0] = { ...next[0], isDefault: true };
      }
      return next;
    });
    onNotify?.('Bank / Visa payout account disconnected.', 'info');
  };

  const railBadgeLabel = (rail: PayoutRailType) =>
    rail === 'visa_direct_card'
      ? 'Visa Direct Push-to-Card'
      : rail === 'bank_iban_visa'
      ? 'IBAN + Visa Settlement'
      : 'Bank EFT + Visa Settlement';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-start justify-between gap-4 bg-gradient-to-r from-[#0F2D25]/5 via-transparent to-[#1434CB]/5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BuildingLibraryIcon className="w-5 h-5 text-[#0F2D25] dark:text-[#C9A35D]" />
              <span>Bank &amp; Visa Payout Connection</span>
            </h3>
            <VisaBadgeSvg />
            {capabilities && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60">
                {capabilities.settlementMode === 'live-gateway'
                  ? 'Live Visa Gateway Connected'
                  : 'Visa-Supported Escrow & Payout Ready'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            Connect your {roleLabel} to your bank account, international IBAN, or Visa card to receive payouts from verified Visa card payments, short stays, car hire, and commissions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setShowForm((prev) => !prev);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F2D25] hover:bg-[#173f34] text-white text-xs font-semibold transition-colors shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          <span>{showForm ? 'Close Form' : 'Connect Bank / Visa'}</span>
        </button>
      </div>

      {/* Visa Capabilities Strip */}
      <div className="px-5 sm:px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <CreditCardIcon className="w-4 h-4 text-[#1434CB] dark:text-blue-400" />
            Visa Checkout Acceptance
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Visa Direct Push-to-Card
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <GlobeAltIcon className="w-4 h-4 text-[#C9A35D]" />
            Cross-Border IBAN &amp; SWIFT
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          {supabaseSynced ? 'Synced to Supabase Vault' : 'Masked Account Protection Active'}
        </span>
      </div>

      {/* Connected Accounts List */}
      <div className="p-5 sm:p-6 space-y-5">
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Checking connected banking &amp; Visa payout channels...
          </div>
        ) : accounts.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Connected Receiving Accounts ({accounts.length})
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    acc.isDefault
                      ? 'border-[#0F2D25] dark:border-[#C9A35D] bg-[#0F2D25]/[0.03] dark:bg-[#C9A35D]/[0.05]'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {acc.bankName}
                        </span>
                        {acc.isDefault && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0F2D25] text-white dark:bg-[#C9A35D] dark:text-slate-950">
                            Default Payout
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {acc.accountHolderName} · <span className="font-mono font-semibold">•••• {acc.accountLast4}</span> ({acc.settlementCurrency})
                      </p>
                      {acc.ibanMasked && (
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          IBAN: {acc.ibanMasked}
                        </p>
                      )}
                      {acc.swiftBic && (
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          SWIFT/BIC: {acc.swiftBic}
                        </p>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                      <CheckCircleIcon className="w-4 h-4" />
                      {acc.verificationStatus}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-[#1434CB] dark:text-blue-400">
                        {acc.visaCardBrand}
                      </span>
                      <span>·</span>
                      <span>{railBadgeLabel(acc.payoutRail)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {!acc.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleMakeDefault(acc.id)}
                          className="font-semibold text-[#0F2D25] dark:text-[#C9A35D] hover:underline"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDisconnect(acc.id)}
                        className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/30 text-xs text-slate-600 dark:text-slate-300">
            No receiving bank or Visa payout account connected yet. Add your banking details below to accept Visa-supported payouts.
          </div>
        )}

        {/* Connect Form */}
        {showForm && (
          <form
            onSubmit={handleConnectSubmit}
            className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Link Banking &amp; Visa Receiving Details
              </h4>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <LockClosedIcon className="w-3.5 h-3.5" />
                Only masked last-4 digits are stored after server checksum validation
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Rail Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'local_eft_visa' as PayoutRailType,
                  title: 'Local Bank + Visa Settlement',
                  hint: 'Account # + Branch/SWIFT + optional Visa card',
                },
                {
                  id: 'bank_iban_visa' as PayoutRailType,
                  title: 'International IBAN + Visa',
                  hint: 'MOD-97 verified IBAN & SWIFT/BIC',
                },
                {
                  id: 'visa_direct_card' as PayoutRailType,
                  title: 'Visa Direct Push-to-Card',
                  hint: 'Receive payouts directly onto Visa card',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPayoutRail(opt.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    payoutRail === opt.id
                      ? 'border-[#0F2D25] dark:border-[#C9A35D] bg-white dark:bg-slate-900 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{opt.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{opt.hint}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Account Holder / Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Full legal or company name"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Country &amp; Currency
                </label>
                <div className="flex gap-2">
                  <select
                    value={country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {COUNTRY_CURRENCIES.map((c) => (
                      <option key={c.country} value={c.country}>
                        {c.country}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    maxLength={3}
                    value={settlementCurrency}
                    onChange={(e) => setSettlementCurrency(e.target.value.toUpperCase())}
                    className="w-16 px-2.5 py-2 text-xs font-mono text-center uppercase rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  {payoutRail === 'visa_direct_card' ? 'Issuing Bank (Optional)' : 'Bank Name'}
                </label>
                <input
                  type="text"
                  required={payoutRail !== 'visa_direct_card'}
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder={
                    COUNTRY_CURRENCIES.find((c) => c.country === country)?.sampleBank ||
                    'e.g. Standard Bank / FNB / Equity'
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {payoutRail === 'local_eft_visa' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      required
                      value={localAccountNumber}
                      onChange={(e) => setLocalAccountNumber(e.target.value)}
                      placeholder="6–20 digit account number"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Branch / Routing Code
                    </label>
                    <input
                      type="text"
                      value={routingCode}
                      onChange={(e) => setRoutingCode(e.target.value)}
                      placeholder="e.g. 250655"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      SWIFT / BIC (Optional)
                    </label>
                    <input
                      type="text"
                      value={swiftBic}
                      onChange={(e) => setSwiftBic(e.target.value.toUpperCase())}
                      placeholder="e.g. FIRNZAJJ"
                      className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              {payoutRail === 'bank_iban_visa' && (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      International IBAN (ISO 13616 Verified)
                    </label>
                    <input
                      type="text"
                      required
                      value={iban}
                      onChange={(e) => setIban(e.target.value.toUpperCase())}
                      placeholder="e.g. GB29 NWBK 6016 1331 9268 19"
                      className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      SWIFT / BIC Code
                    </label>
                    <input
                      type="text"
                      required
                      value={swiftBic}
                      onChange={(e) => setSwiftBic(e.target.value.toUpperCase())}
                      placeholder="e.g. NWBKGB2L"
                      className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              <div className={payoutRail === 'visa_direct_card' ? 'sm:col-span-2' : 'sm:col-span-3'}>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  {payoutRail === 'visa_direct_card'
                    ? 'Visa Card Number for Visa Direct Payouts (starts with 4)'
                    : 'Linked Visa Debit / Business Card (Optional — enables instant Visa Direct failover)'}
                </label>
                <input
                  type="text"
                  required={payoutRail === 'visa_direct_card'}
                  value={visaCardNumber}
                  onChange={(e) => setVisaCardNumber(e.target.value)}
                  placeholder="4xxx xxxx xxxx xxxx (validated via Luhn, stored masked to last 4)"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Payment Categories */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Accept Payments For
              </p>
              <div className="flex flex-wrap gap-3">
                {CATEGORY_OPTIONS.map((cat) => (
                  <label
                    key={cat.id}
                    className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={acceptedCategories.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="rounded border-slate-300 text-[#0F2D25] focus:ring-[#0F2D25]"
                    />
                    <span>{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Supported by Visa Checkout Acceptance &amp; Visa Direct. Property sales and long-term leases remain off-platform.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-lg bg-[#1434CB] hover:bg-[#1029a3] disabled:opacity-60 text-white text-xs font-bold transition-colors"
              >
                {submitting ? 'Validating with Server...' : 'Verify & Connect Banking Details'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default VisaBankingConnectPanel;
