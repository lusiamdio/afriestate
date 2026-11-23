import React, { useState } from 'react';
import {
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  CreditCardIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { fetchJsonStrict } from '../../lib/http';

export type AllowedSettlementCategory = 'flight' | 'short-stay' | 'car-hire';

export interface SettlementReceipt {
  ok: true;
  status: 'Settled';
  bookingCategory: AllowedSettlementCategory;
  itemId: string;
  itemTitle: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  transactionRef: string;
  settlementId: string;
  authorizationCode: string;
  settledAt: string;
  protectionGuarantee: string;
}

export interface SettlementLineItem {
  label: string;
  amountText: string;
}

interface PaymentSettlementPanelProps {
  bookingCategory: AllowedSettlementCategory;
  itemId: string;
  itemTitle: string;
  itemSubtitle?: string;
  amountZar: number;
  displayTotal: string;
  currencyCode?: string;
  lineItems?: SettlementLineItem[];
  customerName: string;
  customerEmail: string;
  metadata?: Record<string, unknown>;
  submitLabel?: string;
  onSettled: (receipt: SettlementReceipt) => void | Promise<void>;
}

const RAIL_OPTIONS = [
  { id: 'Card', label: 'Card (Visa / Mastercard)', tag: 'Instant' },
  { id: 'Ozow Instant EFT', label: 'Ozow Instant EFT', tag: 'SA Banks' },
  { id: 'M-Pesa / Mobile Money', label: 'M-Pesa / Mobile Money', tag: 'Mobile' },
  { id: 'Payflex (Pay in 4)', label: 'Payflex (4x Interest-Free)', tag: 'Split' },
];

export const PaymentSettlementPanel: React.FC<PaymentSettlementPanelProps> = ({
  bookingCategory,
  itemId,
  itemTitle,
  itemSubtitle,
  amountZar,
  displayTotal,
  currencyCode = 'ZAR',
  lineItems = [],
  customerName,
  customerEmail,
  metadata = {},
  submitLabel,
  onSettled,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<string>('Card');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState<string>('');
  const [bankSelected, setBankSelected] = useState<string>('FNB / RMB');
  const [isSettling, setIsSettling] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SettlementReceipt | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSettling) return;
    setErrorMsg(null);

    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMsg('Please enter your full name before settling payment.');
      return;
    }
    if (!customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      setErrorMsg('Please enter a valid email address for receipt delivery.');
      return;
    }

    if (paymentMethod === 'Card') {
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length < 12 || !cardExpiry.trim() || cardCvv.replace(/\D/g, '').length < 3) {
        setErrorMsg('Please enter valid card number (12+ digits), expiry (MM/YY), and CVV.');
        return;
      }
    }

    if (paymentMethod.includes('Mobile Money') && mobileMoneyPhone.replace(/\D/g, '').length < 8) {
      setErrorMsg('Please enter a valid Mobile Money MSISDN phone number.');
      return;
    }

    setIsSettling(true);
    try {
      const settledReceipt = await fetchJsonStrict<SettlementReceipt>('/api/payments/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeoutMs: 25000,
        body: JSON.stringify({
          bookingCategory,
          itemId,
          itemTitle,
          amount: amountZar,
          currency: currencyCode,
          paymentMethod,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim().toLowerCase(),
          paymentDetails: {
            cardNumber: paymentMethod === 'Card' ? cardNumber.replace(/\D/g, '').slice(-4).padStart(16, '4') : undefined,
            cardExpiry: paymentMethod === 'Card' ? cardExpiry.trim() : undefined,
            cardCvv: paymentMethod === 'Card' ? cardCvv.trim() : undefined,
            mobileMoneyPhone: paymentMethod.includes('Mobile Money') ? mobileMoneyPhone.trim() : undefined,
            bankSelected: paymentMethod === 'Ozow Instant EFT' ? bankSelected : undefined,
          },
          metadata,
        }),
      });

      setReceipt(settledReceipt);
      await onSettled(settledReceipt);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to authorize real-time payment settlement. Please retry.');
    } finally {
      setIsSettling(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!receipt) return;
    const lines = [
      'AFRIESTATE REAL-TIME PAYMENT SETTLEMENT RECEIPT',
      '================================================',
      `Status: ${receipt.status}`,
      `Category: ${receipt.bookingCategory.toUpperCase()}`,
      `Booking Item: ${receipt.itemTitle}`,
      itemSubtitle ? `Details: ${itemSubtitle}` : '',
      `Customer: ${receipt.customerName} (${receipt.customerEmail})`,
      `Transaction Ref: ${receipt.transactionRef}`,
      `Settlement ID: ${receipt.settlementId}`,
      `Authorization Code: ${receipt.authorizationCode}`,
      `Payment Rail: ${receipt.paymentMethod}`,
      `Amount Settled: ${displayTotal} (${receipt.currency})`,
      `Settled At: ${new Date(receipt.settledAt).toUTCString()}`,
      `Protection: ${receipt.protectionGuarantee}`,
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AfriEstate-Receipt-${receipt.transactionRef}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (receipt) {
    return (
      <div className="rounded-2xl bg-[#123B2A] text-white p-5 sm:p-6 space-y-4 border border-[#C99A3D]/40 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#C99A3D]">
                Real-Time Settlement Confirmed
              </p>
              <h4 className="font-heading text-lg font-bold text-white leading-tight">
                {receipt.itemTitle}
              </h4>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 font-mono text-xs font-bold">
            {receipt.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-black/25 p-3.5 text-xs">
          <div>
            <p className="text-slate-300 text-[10px] uppercase">Settlement Ref</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono font-bold text-white">{receipt.transactionRef}</span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(receipt.transactionRef);
                  } catch {
                    // ignore clipboard restrictions
                  }
                  setCopiedRef(true);
                  window.setTimeout(() => setCopiedRef(false), 1800);
                }}
                aria-label="Copy transaction reference"
                className="text-slate-300 hover:text-[#C99A3D]"
              >
                {copiedRef ? (
                  <ClipboardDocumentCheckIcon className="w-4 h-4 text-emerald-300" />
                ) : (
                  <ClipboardDocumentIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-300 text-[10px] uppercase">Total Settled</p>
            <p className="font-mono font-bold text-[#C99A3D] text-sm mt-0.5">{displayTotal}</p>
          </div>
          <div>
            <p className="text-slate-300 text-[10px] uppercase">Authorization</p>
            <p className="font-mono text-white mt-0.5">{receipt.authorizationCode}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-300 text-[10px] uppercase">Rail</p>
            <p className="text-white font-semibold mt-0.5">{receipt.paymentMethod}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-slate-200">
            Receipt dispatched to <strong>{receipt.customerEmail}</strong>
          </span>
          <button
            type="button"
            onClick={handleDownloadReceipt}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C99A3D] text-[#151515] text-xs font-bold hover:brightness-105"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            <span>Download Receipt</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSettleSubmit} className="space-y-4">
      {lineItems.length > 0 && (
        <div className="rounded-xl bg-[#F8F7F3] dark:bg-slate-800/80 border border-[#E4E1D9] dark:border-slate-700 p-4 space-y-2 text-xs">
          {lineItems.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-[#6B6B6B] dark:text-slate-300">{row.label}</span>
              <span className="font-mono font-semibold text-[#151515] dark:text-white">{row.amountText}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-[#E4E1D9] dark:border-slate-700 flex items-center justify-between text-sm font-bold">
            <span className="text-[#151515] dark:text-white">Real-Time Total Due</span>
            <span className="font-mono text-[#123B2A] dark:text-[#C99A3D]">{displayTotal}</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-300" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-bold text-[#151515] dark:text-white flex items-center gap-1.5">
          <CreditCardIcon className="w-4 h-4 text-[#008F45] dark:text-[#C99A3D]" />
          <span>Select Real-Time Settlement Rail</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RAIL_OPTIONS.map((opt) => {
            const active = paymentMethod === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setPaymentMethod(opt.id);
                  setErrorMsg(null);
                }}
                className={`p-2.5 rounded-xl border text-left text-xs transition-colors flex items-center justify-between gap-2 ${
                  active
                    ? 'border-[#008F45] bg-[#E8F7EF]/60 dark:bg-emerald-950/40 font-bold text-[#151515] dark:text-white'
                    : 'border-[#E4E1D9] dark:border-slate-700 text-[#6B6B6B] dark:text-slate-300 hover:border-slate-400'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-[10px] font-mono font-semibold border border-slate-200 dark:border-slate-700 shrink-0">
                  {opt.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {paymentMethod === 'Card' && (
        <div className="space-y-2.5 p-3.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800/70 border border-[#E4E1D9] dark:border-slate-700">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Card Number
            </label>
            <input
              type="text"
              required
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="4532 8910 2345 1234"
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-700 text-xs font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                required
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                placeholder="MM/YY"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-700 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                CVV / CVC
              </label>
              <input
                type="password"
                required
                maxLength={4}
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value)}
                placeholder="•••"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-700 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {paymentMethod.includes('Mobile Money') && (
        <div className="p-3.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800/70 border border-[#E4E1D9] dark:border-slate-700">
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Mobile Money Wallet Number (M-Pesa / MTN / Airtel)
          </label>
          <input
            type="tel"
            required
            value={mobileMoneyPhone}
            onChange={(e) => setMobileMoneyPhone(e.target.value)}
            placeholder="+254 712 345 678"
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-700 text-xs font-mono"
          />
        </div>
      )}

      {paymentMethod === 'Ozow Instant EFT' && (
        <div className="p-3.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800/70 border border-[#E4E1D9] dark:border-slate-700 space-y-2">
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            Select Clearing Bank for Instant Settlement
          </label>
          <select
            value={bankSelected}
            onChange={(e) => setBankSelected(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-700 text-xs font-semibold"
          >
            <option>FNB / RMB</option>
            <option>Standard Bank</option>
            <option>ABSA Bank</option>
            <option>Nedbank</option>
            <option>Capitec Bank</option>
            <option>Investec</option>
          </select>
        </div>
      )}

      {paymentMethod === 'Payflex (Pay in 4)' && (
        <div className="p-3.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800/70 border border-[#E4E1D9] dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
          Split <strong>{displayTotal}</strong> into 4 interest-free fortnightly instalments. Instant approval on authorization.
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px] text-[#6B6B6B] dark:text-slate-400">
        <ShieldCheckIcon className="w-4 h-4 text-[#008F45] dark:text-[#C99A3D] shrink-0" />
        <span>256-bit encrypted real-time settlement · Immediate digital voucher issuance</span>
      </div>

      <button
        type="submit"
        disabled={isSettling}
        className="w-full py-3.5 rounded-xl bg-[#008F45] hover:bg-[#006B35] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-60"
      >
        <LockClosedIcon className="w-4 h-4" />
        <span>
          {isSettling
            ? 'Authorizing Real-Time Settlement...'
            : submitLabel || `Settle & Confirm · ${displayTotal}`}
        </span>
      </button>
    </form>
  );
};

export default PaymentSettlementPanel;
