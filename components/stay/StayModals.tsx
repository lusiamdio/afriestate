import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  SparklesIcon,
  PlusIcon,
  HeartIcon,
  ClipboardDocumentCheckIcon,
  ClipboardIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  BuildingOffice2Icon,
  CheckBadgeIcon,
  CurrencyDollarIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import {
  ALL_64_AMENITIES,
  UBUNTU_MENU_HIGHLIGHTS,
  type RoomCatalogItem,
  type RatePlanOption,
  type StayPropertyProfile,
  type StayTermMode,
} from '../../data/stayDetailData';
import { GoogleGenAI } from '../../lib/ai';
import { createStayBooking } from '../../lib/data';
import { generateSecureBookingRef, isValidEmail, sanitizeText } from '../../lib/security';
import { useToast } from '../../contexts/ToastContext';
import { usePlatformState } from '../../contexts/PlatformStateContext';
import PaymentSettlementPanel, { type SettlementReceipt } from '../payments/PaymentSettlementPanel';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyName: string;
}

export const StayVerificationModal: React.FC<VerificationModalProps> = ({ isOpen, onClose, propertyName }) => {
  if (!isOpen) return null;
  const checks = [
    'Property identity verified',
    'Ownership/operator verified',
    'Business documentation verified',
    'Location verified',
    'Payment information verified',
    'Property information reviewed',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#123B2A] text-[#C99A3D] flex items-center justify-center shrink-0">
              <CheckBadgeIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#C99A3D]">Trust &amp; Authenticity</p>
              <h3 className="font-heading text-2xl font-semibold text-[#151515] dark:text-white">
                AfriEstate Verified
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close verification details"
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[#6B6B6B] dark:text-slate-300 leading-relaxed">
          Every aspect of <strong className="text-[#151515] dark:text-white">{propertyName}</strong> has passed AfriEstate’s multi-stage hospitality and registry inspection.
        </p>

        <div className="divide-y divide-[#E4E1D9] dark:divide-slate-800 border-y border-[#E4E1D9] dark:border-slate-800">
          {checks.map((item) => (
            <div key={item} className="py-3 flex items-center justify-between text-sm">
              <span className="font-medium text-[#151515] dark:text-slate-100">{item}</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#123B2A] dark:text-emerald-400">
                <CheckIcon className="w-4 h-4" />
                <span>Verified</span>
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-[#6B6B6B] dark:text-slate-400">
          <span>Last verified</span>
          <span className="font-mono font-semibold text-[#151515] dark:text-white">November 2026</span>
        </div>
      </div>
    </div>
  );
};

interface FullscreenGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  images: StayPropertyProfile['heroImages'];
  initialIndex: number;
}

export const FullscreenGalleryModal: React.FC<FullscreenGalleryProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [index, setIndex] = useState<number>(initialIndex);

  if (!isOpen) return null;

  const categories = ['All', ...Array.from(new Set(images.map((img) => img.category)))];
  const filtered = activeCategory === 'All' ? images : images.filter((i) => i.category === activeCategory);
  const safeIdx = index < filtered.length ? index : 0;
  const current = filtered[safeIdx] || images[0];

  return (
    <div className="fixed inset-0 z-50 bg-[#0D1E17] text-white flex flex-col">
      <div className="px-4 sm:px-8 py-4 border-b border-white/10 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back</span>
        </button>

        <span className="font-mono tabular-nums text-xs sm:text-sm font-semibold text-[#C99A3D]">
          {safeIdx + 1} / {87} Photos · Showing {filtered.length} Featured
        </span>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close gallery"
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative px-4 sm:px-14 py-6 overflow-hidden">
        <button
          type="button"
          onClick={() => setIndex((prev) => (prev - 1 + filtered.length) % filtered.length)}
          aria-label="Previous image"
          className="absolute left-3 sm:left-6 p-3 rounded-full bg-black/50 hover:bg-black/80 border border-white/15 z-10"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        <div className="max-w-5xl w-full h-full flex flex-col items-center justify-center gap-4">
          <img
            src={current.url}
            alt={current.caption}
            referrerPolicy="no-referrer"
            className="max-h-[60vh] w-full object-cover rounded-2xl border border-white/15"
          />
          <div className="text-center space-y-1">
            <h4 className="font-heading text-xl sm:text-2xl font-semibold text-white">{current.caption}</h4>
            <p className="text-xs sm:text-sm text-slate-300">{current.specs}</p>
            <p className="text-[11px] font-mono text-[#C99A3D]">
              AI Image Analysis: {current.aiTags.join(' · ')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIndex((prev) => (prev + 1) % filtered.length)}
          aria-label="Next image"
          className="absolute right-3 sm:right-6 p-3 rounded-full bg-black/50 hover:bg-black/80 border border-white/15 z-10"
        >
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 sm:px-8 py-4 border-t border-white/10 overflow-x-auto">
        <div className="flex items-center justify-center gap-2 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveCategory(cat);
                setIndex(0);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeCategory === cat
                  ? 'bg-[#C99A3D] text-[#151515]'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AllAmenitiesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  if (!isOpen) return null;

  const list = ALL_64_AMENITIES.filter((a) => a.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E4E1D9] dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-heading text-xl font-semibold text-[#151515] dark:text-white">
              All 64 Property Amenities
            </h3>
            <p className="text-xs text-[#6B6B6B] dark:text-slate-400">Inspected facilities for short &amp; extended stays</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter amenities (e.g. Wi-Fi, kitchen, wheelchair, solar)..."
            className="w-full px-4 py-2.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 border border-[#E4E1D9] dark:border-slate-700 text-sm"
          />
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {list.map((item) => (
            <div key={item} className="flex items-center gap-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800">
              <CheckIcon className="w-4 h-4 text-[#123B2A] dark:text-[#C99A3D] shrink-0" />
              <span className="text-[#151515] dark:text-slate-200">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CancellationPolicyModal: React.FC<{
  room: RoomCatalogItem | null;
  onClose: () => void;
}> = ({ room, onClose }) => {
  if (!room) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 sm:p-7 space-y-4 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C99A3D]">Transparent Policy</p>
            <h3 className="font-heading text-2xl font-semibold text-[#151515] dark:text-white mt-0.5">
              Cancellation Policy · {room.name}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-xl bg-[#F8F7F3] dark:bg-slate-800 p-4 space-y-2 text-sm">
          <p className="font-semibold text-[#123B2A] dark:text-emerald-300">{room.cancellationSummary}</p>
          <p className="text-[#6B6B6B] dark:text-slate-300">
            Modify or cancel free of charge until 18:00 local time on <strong>{room.cancellationCutoff}</strong>.
          </p>
          <p className="text-[#6B6B6B] dark:text-slate-300 pt-2 border-t border-[#E4E1D9] dark:border-slate-700">
            <strong>After this date:</strong> {room.afterCutoffRule}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-[#123B2A] text-white text-sm font-semibold hover:bg-[#0d2b1f]"
        >
          Close Policy
        </button>
      </div>
    </div>
  );
};

export const UbuntuMenuModal: React.FC<{ isOpen: boolean; onClose: () => void; onReserveTable: () => void }> = ({
  isOpen,
  onClose,
  onReserveTable,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C99A3D]">African · International · Seafood</p>
            <h3 className="font-heading text-2xl font-semibold text-[#151515] dark:text-white mt-0.5">
              Ubuntu Restaurant Signature Menu
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="divide-y divide-[#E4E1D9] dark:divide-slate-800">
          {UBUNTU_MENU_HIGHLIGHTS.map((dish) => (
            <div key={dish.name} className="py-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C99A3D]">{dish.course}</p>
                <p className="text-sm font-semibold text-[#151515] dark:text-white">{dish.name}</p>
                <p className="text-xs text-[#6B6B6B] dark:text-slate-400">{dish.notes}</p>
              </div>
              <span className="font-mono font-bold text-sm text-[#123B2A] dark:text-emerald-300 shrink-0">
                R{dish.priceZar}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              onReserveTable();
              onClose();
            }}
            className="flex-1 py-3 rounded-xl bg-[#123B2A] text-white text-sm font-semibold hover:bg-[#0e2e21]"
          >
            Reserve a Table
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-[#E4E1D9] dark:border-slate-700 text-sm font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const SaveCollectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  propertyName: string;
  collections: string[];
  selectedCollections: string[];
  onToggleCollection: (name: string) => void;
  onCreateCollection: (name: string) => void;
}> = ({
  isOpen,
  onClose,
  propertyName,
  collections,
  selectedCollections,
  onToggleCollection,
  onCreateCollection,
}) => {
  const [newCollection, setNewCollection] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C99A3D]">Shortlist</p>
            <h3 className="font-heading text-2xl font-semibold text-[#151515] dark:text-white mt-0.5">
              Save to Collection
            </h3>
            <p className="text-xs text-[#6B6B6B] dark:text-slate-400 mt-0.5">{propertyName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {collections.map((col) => {
            const active = selectedCollections.includes(col);
            return (
              <button
                key={col}
                type="button"
                onClick={() => onToggleCollection(col)}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-sm font-medium transition-colors ${
                  active
                    ? 'border-[#123B2A] bg-[#F8F7F3] dark:bg-emerald-950/30 text-[#151515] dark:text-white'
                    : 'border-[#E4E1D9] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{col}</span>
                {active ? (
                  <HeartSolidIcon className="w-5 h-5 text-[#123B2A] dark:text-[#C99A3D]" />
                ) : (
                  <HeartIcon className="w-5 h-5 text-slate-400" />
                )}
              </button>
            );
          })}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newCollection.trim()) return;
            onCreateCollection(newCollection.trim());
            setNewCollection('');
          }}
          className="flex gap-2 pt-2 border-t border-[#E4E1D9] dark:border-slate-800"
        >
          <input
            type="text"
            value={newCollection}
            onChange={(e) => setNewCollection(e.target.value)}
            placeholder="Create new collection..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 border border-[#E4E1D9] dark:border-slate-700 text-sm"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-[#123B2A] text-white text-xs font-semibold"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export const SharePropertyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  propertyName: string;
  locationLabel: string;
}> = ({ isOpen, onClose, propertyName, locationLabel }) => {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://afriestate.africa/stays/african-grand';

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    addToast('Property link copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C99A3D]">Share Property</p>
            <h3 className="font-heading text-2xl font-semibold text-[#151515] dark:text-white mt-0.5">
              {propertyName}
            </h3>
            <p className="text-xs text-[#6B6B6B] dark:text-slate-400">{locationLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Crisp Vector QR Code Block */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 border border-[#E4E1D9] dark:border-slate-700">
          <svg viewBox="0 0 64 64" className="w-20 h-20 shrink-0 bg-white p-1.5 rounded-lg border border-slate-200" aria-label="Property QR Code">
            <rect x="4" y="4" width="18" height="18" fill="#123B2A" />
            <rect x="8" y="8" width="10" height="10" fill="#FFFFFF" />
            <rect x="11" y="11" width="4" height="4" fill="#123B2A" />
            <rect x="42" y="4" width="18" height="18" fill="#123B2A" />
            <rect x="46" y="8" width="10" height="10" fill="#FFFFFF" />
            <rect x="49" y="11" width="4" height="4" fill="#123B2A" />
            <rect x="4" y="42" width="18" height="18" fill="#123B2A" />
            <rect x="8" y="46" width="10" height="10" fill="#FFFFFF" />
            <rect x="11" y="49" width="4" height="4" fill="#123B2A" />
            <path d="M26 6h6v6h-6zm8 8h6v6h-6zM26 26h12v12H26zm16 14h6v6h-6zm8 8h10v10H50zm-18 6h8v6h-8zm12-26h10v8H44z" fill="#151515" />
          </svg>
          <div className="text-xs space-y-1">
            <p className="font-bold text-[#151515] dark:text-white">Scan QR for Instant Mobile Pass</p>
            <p className="text-[#6B6B6B] dark:text-slate-300">Share verified rates, floorplans &amp; check-in intelligence with colleagues or family.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
          {['WhatsApp', 'Facebook', 'LinkedIn', 'X', 'Email'].map((channel) => (
            <button
              key={channel}
              type="button"
              onClick={() => addToast(`Opened ${channel} share composer for ${propertyName}.`, 'success')}
              className="py-2.5 px-3 rounded-xl border border-[#E4E1D9] dark:border-slate-700 hover:bg-[#F8F7F3] dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
            >
              {channel === 'Email' ? (
                <EnvelopeIcon className="w-3.5 h-3.5 text-[#123B2A] dark:text-[#C99A3D]" />
              ) : (
                <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-[#123B2A] dark:text-[#C99A3D]" />
              )}
              <span>{channel}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={handleCopy}
            className="py-2.5 px-3 rounded-xl bg-[#123B2A] text-white flex items-center justify-center gap-1.5"
          >
            {copied ? <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" /> : <ClipboardIcon className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const ManagementCompanyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 sm:p-7 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#123B2A] text-[#C99A3D] flex items-center justify-center">
              <BuildingOffice2Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#C99A3D]">Verified Management Company</p>
              <h3 className="font-heading text-2xl font-semibold text-[#151515] dark:text-white">
                AfriLuxury Hospitality
              </h3>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[#6B6B6B] dark:text-slate-300 leading-relaxed">
          Operating 18 flagship hotels and extended-stay residences across South Africa, Rwanda, Kenya, and Tanzania with institutional-grade housekeeping, solar engineering, and 24/7 bilingual guest support.
        </p>

        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Properties Managed', value: '18' },
            { label: 'Management Rating', value: '9.2' },
            { label: 'Guest Satisfaction', value: '94%' },
          ].map((m) => (
            <div key={m.label} className="rounded-xl bg-[#F8F7F3] dark:bg-slate-800 p-3.5">
              <p className="font-mono text-xl font-bold text-[#123B2A] dark:text-[#C99A3D]">{m.value}</p>
              <p className="text-[11px] text-[#6B6B6B] dark:text-slate-400 mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-[#123B2A] text-white text-sm font-semibold"
        >
          Close Operator Profile
        </button>
      </div>
    </div>
  );
};

export const InvestmentOpportunityModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  property: StayPropertyProfile;
}> = ({ isOpen, onClose, property }) => {
  const { addToast } = useToast();
  const [investorEmail, setInvestorEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !property.investmentData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C99A3D]">AfriEstate Investor Desk</p>
            <h3 className="font-heading text-2xl font-semibold text-[#151515] dark:text-white mt-0.5">
              {property.name} · Investment Dossier
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {[
            { label: 'Estimated Value', val: property.investmentData.estimatedValue },
            { label: 'Annual Revenue', val: property.investmentData.annualRevenue },
            { label: 'Gross Yield', val: property.investmentData.grossYield },
            { label: 'Occupancy', val: property.investmentData.averageOccupancy },
            { label: 'Market Growth', val: property.investmentData.marketGrowth },
            { label: 'Risk Profile', val: property.investmentData.risk },
          ].map((stat) => (
            <div key={stat.label} className="p-3.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800">
              <p className="text-[11px] text-[#6B6B6B] dark:text-slate-400">{stat.label}</p>
              <p className="font-mono font-bold text-[#123B2A] dark:text-[#C99A3D] mt-0.5">{stat.val}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#6B6B6B] dark:text-slate-400 leading-relaxed">
          Disclaimer: Historical occupancy, estimated gross yield, and revenue projections are informational market indicators and do not constitute regulated financial advice. Request the audited memorandum for full due diligence.
        </p>

        {submitted ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-sm font-semibold">
            Investor memorandum and pro-forma model dispatched to {investorEmail}.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!investorEmail.trim()) return;
              setSubmitted(true);
              addToast('Investment prospectus request submitted.', 'success');
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <input
              type="email"
              required
              value={investorEmail}
              onChange={(e) => setInvestorEmail(e.target.value)}
              placeholder="Enter institutional or private email..."
              className="flex-1 px-4 py-3 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 border border-[#E4E1D9] dark:border-slate-700 text-sm"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-[#123B2A] hover:bg-[#0d2a1e] text-white text-sm font-semibold whitespace-nowrap"
            >
              Request Prospectus
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const AITravelConciergeDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  property: StayPropertyProfile;
  onSelectRomanticRoom: () => void;
  onExploreRestaurants: () => void;
}> = ({ isOpen, onClose, property, onSelectRomanticRoom, onExploreRestaurants }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; text: string }[]>([
    {
      role: 'assistant',
      text: `Yes — I have full context on ${property.name} (${property.locationLabel}). Ask me about rooms, long-term monthly leases, airport transfers, family facilities, or weekend dining.`,
    },
  ]);

  if (!isOpen) return null;

  const askConcierge = async (promptText?: string) => {
    const q = (promptText ?? input).trim();
    if (!q || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI();
      const res = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `You are AfriEstate AI Travel Concierge answering about ${property.name} in ${property.locationLabel}. Nightly rate from R${property.nightlyFromZar}, monthly long-term rate from R${property.monthlyFromZar}. Question: "${q}". Reply concisely in 2-3 helpful sentences.`,
      });
      if (res.text && res.text.trim().length > 10) {
        setMessages((prev) => [...prev, { role: 'assistant', text: res.text.trim() }]);
        return;
      }
      throw new Error('empty');
    } catch {
      const lower = q.toLowerCase();
      let reply = `At ${property.name}, guests especially value the 9.7 location score, 300 Mbps fibre workspace, Ubuntu Restaurant, and flexible short- or 30+ day corporate rates starting from R${property.nightlyFromZar.toLocaleString()}/night.`;
      if (lower.includes('romantic') || lower.includes('couple')) {
        reply = `Yes. ${property.name} offers private Ocean View Suites with sunset balconies, Sanctuary Mineral Spa couples treatments, and Ubuntu Terrace dining 150m from the promenade.`;
      } else if (lower.includes('long') || lower.includes('month') || lower.includes('work')) {
        reply = `For extended stays (30+ nights), our Executive Residence One-Bedroom includes a full kitchen, washer/dryer, dual-ISP fibre, and discounted monthly corporate rates from R${property.monthlyFromZar.toLocaleString()}/month.`;
      }
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 h-full flex flex-col border-l border-[#E4E1D9] dark:border-slate-800 shadow-2xl">
        <div className="px-6 py-4 bg-[#123B2A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SparklesIcon className="w-5 h-5 text-[#C99A3D]" />
            <div>
              <h3 className="text-sm font-bold">AfriEstate AI Concierge</h3>
              <p className="text-[11px] text-slate-300">{property.name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-5 overflow-y-auto bg-[#F8F7F3] dark:bg-slate-950 space-y-3">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`px-4 py-3 rounded-xl max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#123B2A] text-white'
                    : 'bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 text-[#151515] dark:text-slate-100'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && <p className="text-xs text-[#6B6B6B]">Consulting property intelligence...</p>}

          <div className="pt-2 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Quick Concierge Actions</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => askConcierge('Is this hotel good for a romantic weekend?')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-700 text-xs font-medium hover:border-[#123B2A]"
              >
                Romantic weekend?
              </button>
              <button
                type="button"
                onClick={() => askConcierge('Tell me about long-term 30+ day corporate rates')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-700 text-xs font-medium hover:border-[#123B2A]"
              >
                Long-term monthly stay
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectRomanticRoom();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#123B2A] text-white text-xs font-semibold"
              >
                Find romantic room
              </button>
              <button
                type="button"
                onClick={() => {
                  onExploreRestaurants();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-[#C99A3D] text-xs font-semibold text-[#151515] dark:text-[#C99A3D]"
              >
                Explore nearby restaurants
              </button>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            askConcierge();
          }}
          className="p-4 border-t border-[#E4E1D9] dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about rooms, location, transport, cancellation..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 border border-[#E4E1D9] dark:border-slate-700 text-xs sm:text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            aria-label="Send message"
            className="px-3.5 py-2.5 rounded-xl bg-[#123B2A] text-white hover:bg-[#0e2d20] disabled:opacity-50"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export const TransparentBookingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  property: StayPropertyProfile;
  room: RoomCatalogItem | null;
  ratePlan: RatePlanOption | null;
  termMode: StayTermMode;
  nights: number;
  months: number;
  checkIn: string;
  checkOut: string;
  guestsLabel: string;
}> = ({
  isOpen,
  onClose,
  property,
  room,
  ratePlan,
  termMode,
  nights,
  months,
  checkIn,
  checkOut,
  guestsLabel,
}) => {
  const { addToast } = useToast();
  const { currentUser, addPlatformBooking } = usePlatformState();
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [leaseNote, setLeaseNote] = useState('');
  const [payOption, setPayOption] = useState<'now' | 'property'>('now');
  const [confirmed, setConfirmed] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [settledReceipt, setSettledReceipt] = useState<SettlementReceipt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      setGuestName((prev) => prev || currentUser.fullName || currentUser.username || '');
      setGuestEmail((prev) => prev || currentUser.email || '');
    }
    if (!isOpen) {
      setConfirmed(false);
      setBookingRef('');
      setSettledReceipt(null);
      setIsSubmitting(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !room || !ratePlan) return null;

  const isLongTermLease = termMode === 'long-term';
  const baseSubtotal = isLongTermLease ? ratePlan.monthlyZar * months : ratePlan.nightlyZar * nights;
  const taxes = isLongTermLease ? 0 : Math.round(baseSubtotal * 0.15);
  const serviceFee = isLongTermLease ? 0 : 250;
  const grandTotal = baseSubtotal + taxes + serviceFee;
  const payToday = isLongTermLease
    ? 0
    : payOption === 'now'
      ? grandTotal
      : serviceFee + Math.round(taxes * 0.5);
  const payAtProperty = isLongTermLease ? grandTotal : grandTotal - payToday;

  const handleShortStaySettled = async (receipt: SettlementReceipt) => {
    const cleanedName = sanitizeText(guestName, 120);
    const cleanedEmail = guestEmail.trim().toLowerCase();
    await createStayBooking({
      propertyId: property.id,
      propertyName: property.name,
      roomId: room.id,
      roomName: room.name,
      ratePlanName: ratePlan.name,
      termMode: 'short-term',
      checkIn,
      checkOut,
      guestsLabel,
      nights,
      months,
      guestName: cleanedName,
      guestEmail: cleanedEmail,
      payOption,
      baseSubtotal,
      taxes,
      serviceFee,
      grandTotal,
      payToday,
      payAtProperty,
      bookingRef: receipt.transactionRef,
    });
    addPlatformBooking({
      category: 'short-stay',
      reference: receipt.transactionRef,
      title: `${property.name} · ${room.name}`,
      subtitle: `${ratePlan.name} · ${nights} night(s) (${guestsLabel})`,
      city: property.city || property.locationLabel || 'Cape Town',
      startDate: checkIn,
      endDate: checkOut,
      amountZar: payToday,
      status: 'Confirmed',
      customerName: cleanedName,
      customerEmail: cleanedEmail,
      targetPage: 'book-a-stay',
    });
    setSettledReceipt(receipt);
    setBookingRef(receipt.transactionRef);
    setConfirmed(true);
    addToast(`Short-stay payment settled & confirmed (${receipt.transactionRef})!`, 'success');
  };

  const handleConfirmLeaseInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedName = sanitizeText(guestName, 120);
    const cleanedEmail = guestEmail.trim().toLowerCase();
    if (!cleanedName || cleanedName.length < 2) {
      addToast('Please enter a valid full applicant name.', 'error');
      return;
    }
    if (!isValidEmail(cleanedEmail)) {
      addToast('Please enter a valid applicant email address.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const ref = generateSecureBookingRef('AFR-LEASE');
      await createStayBooking({
        propertyId: property.id,
        propertyName: property.name,
        roomId: room.id,
        roomName: room.name,
        ratePlanName: `${ratePlan.name} (Off-Platform Lease)`,
        termMode: 'long-term',
        checkIn,
        checkOut,
        guestsLabel,
        nights,
        months,
        guestName: cleanedName,
        guestEmail: cleanedEmail,
        payOption: 'property',
        baseSubtotal,
        taxes: 0,
        serviceFee: 0,
        grandTotal,
        payToday: 0,
        payAtProperty: grandTotal,
        bookingRef: ref,
      });
      addPlatformBooking({
        category: 'lease-inquiry',
        reference: ref,
        title: `${property.name} · ${months}-Month Lease Inquiry`,
        subtitle: `${room.name} · Direct Landlord Execution`,
        city: property.city || property.locationLabel || 'Cape Town',
        startDate: checkIn,
        endDate: checkOut,
        amountZar: 0,
        status: 'Pending',
        customerName: cleanedName,
        customerEmail: cleanedEmail,
        targetPage: 'long-term-stays',
      });
      setBookingRef(ref);
      setConfirmed(true);
      addToast(`Long-term tenancy inquiry submitted (${ref}). No online payment taken.`, 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E1D9] dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C99A3D]">
              {isLongTermLease ? 'Long-Term Tenancy Application' : 'Real-Time Short-Stay Settlement'}
            </p>
            <h3 className="font-heading text-2xl font-semibold text-[#151515] dark:text-white mt-0.5">
              {confirmed
                ? isLongTermLease
                  ? 'Tenancy Inquiry Submitted'
                  : 'Short-Stay Settled & Confirmed'
                : `${room.name} · ${ratePlan.name}`}
            </h3>
            <p className="text-xs text-[#6B6B6B] dark:text-slate-400">
              {property.name} · {checkIn} to {checkOut} · {guestsLabel}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Section 19: Transparent Pricing Breakdown */}
        <div className="rounded-xl bg-[#F8F7F3] dark:bg-slate-800 border border-[#E4E1D9] dark:border-slate-700 p-5 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6B6B6B] dark:text-slate-300">
              {isLongTermLease ? `${months} month(s) residential lease` : `${nights} nights accommodation`}
            </span>
            <span className="font-mono font-semibold text-[#151515] dark:text-white">
              R{baseSubtotal.toLocaleString()}
            </span>
          </div>
          {!isLongTermLease && (
            <>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B] dark:text-slate-300">Taxes (15% VAT)</span>
                <span className="font-mono font-semibold text-[#151515] dark:text-white">R{taxes.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B] dark:text-slate-300">AfriEstate Protection &amp; Service fee</span>
                <span className="font-mono font-semibold text-[#151515] dark:text-white">R{serviceFee.toLocaleString()}</span>
              </div>
            </>
          )}
          <div className="pt-3 border-t border-[#E4E1D9] dark:border-slate-700 flex justify-between text-base font-bold">
            <span>{isLongTermLease ? 'Estimated Lease Value' : 'Total Stay Cost'}</span>
            <span className="font-mono text-[#123B2A] dark:text-[#C99A3D]">R{grandTotal.toLocaleString()}</span>
          </div>
          <div className="pt-2 text-xs grid grid-cols-2 gap-3 text-[#6B6B6B] dark:text-slate-300">
            <div>
              <p>Settled on AfriEstate today</p>
              <p className="font-mono font-bold text-[#151515] dark:text-white">
                {isLongTermLease ? 'R0 (Direct Landlord)' : `R${payToday.toLocaleString()}`}
              </p>
            </div>
            <div className="text-right">
              <p>{isLongTermLease ? 'Lease execution' : 'Balance at property'}</p>
              <p className="font-mono font-bold text-[#151515] dark:text-white">
                {isLongTermLease ? 'Off-Platform Lease' : `R${payAtProperty.toLocaleString()}`}
              </p>
            </div>
          </div>
        </div>

        {isLongTermLease ? (
          confirmed ? (
            <div className="p-5 rounded-xl bg-[#123B2A] text-white space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#C99A3D]">Verified Tenancy Reference</p>
              <p className="font-mono text-lg font-bold">{bookingRef}</p>
              <p className="text-xs text-slate-200">
                Application forwarded to the verified landlord/agent at {property.name}. Lease signing and rent deposits occur strictly off-platform.
              </p>
            </div>
          ) : (
            <form onSubmit={handleConfirmLeaseInquiry} className="space-y-4">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <strong>Long-Term Rental Policy:</strong> Monthly residential leases, properties for sale, and investment properties are never settled financially on AfriEstate. Submit your verified tenancy application below to arrange viewing &amp; direct landlord lease signing.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Applicant full name"
                  className="px-3.5 py-2.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 border border-[#E4E1D9] dark:border-slate-700 text-sm"
                />
                <input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="Applicant email address"
                  className="px-3.5 py-2.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 border border-[#E4E1D9] dark:border-slate-700 text-sm"
                />
              </div>

              <textarea
                rows={2}
                value={leaseNote}
                onChange={(e) => setLeaseNote(e.target.value)}
                placeholder="Preferred move-in date, occupation, or corporate relocation note (optional)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 border border-[#E4E1D9] dark:border-slate-700 text-sm"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#123B2A] hover:bg-[#0d2a1e] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <ShieldCheckIcon className="w-4 h-4 text-[#C99A3D]" />
                <span>{isSubmitting ? 'Submitting Application...' : 'Submit Verified Lease Application (R0 Due Online)'}</span>
              </button>
            </form>
          )
        ) : (
          <div className="space-y-4">
            {!confirmed && (
              <>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPayOption('now')}
                    className={`p-3 rounded-xl border text-left ${
                      payOption === 'now'
                        ? 'border-[#123B2A] bg-[#F8F7F3] dark:bg-emerald-950/30'
                        : 'border-[#E4E1D9] dark:border-slate-700'
                    }`}
                  >
                    <span className="block font-bold">Pay full stay today</span>
                    <span className="text-[#6B6B6B] dark:text-slate-400">R{grandTotal.toLocaleString()} · Zero check-in balance</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayOption('property')}
                    className={`p-3 rounded-xl border text-left ${
                      payOption === 'property'
                        ? 'border-[#123B2A] bg-[#F8F7F3] dark:bg-emerald-950/30'
                        : 'border-[#E4E1D9] dark:border-slate-700'
                    }`}
                  >
                    <span className="block font-bold">Deposit &amp; fee today</span>
                    <span className="text-[#6B6B6B] dark:text-slate-400">Settle R{(serviceFee + Math.round(taxes * 0.5)).toLocaleString()} now</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Full guest name"
                    className="px-3.5 py-2.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 border border-[#E4E1D9] dark:border-slate-700 text-sm"
                  />
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Guest email for voucher"
                    className="px-3.5 py-2.5 rounded-xl bg-[#F8F7F3] dark:bg-slate-800 border border-[#E4E1D9] dark:border-slate-700 text-sm"
                  />
                </div>
              </>
            )}

            <PaymentSettlementPanel
              bookingCategory="short-stay"
              itemId={property.id}
              itemTitle={`${property.name} — ${room.name}`}
              itemSubtitle={`${ratePlan.name} · ${checkIn} to ${checkOut} (${nights} nights)`}
              amountZar={payToday}
              displayTotal={`R${payToday.toLocaleString()}`}
              currencyCode="ZAR"
              lineItems={[
                { label: `${nights} nights · ${room.name}`, amountText: `R${baseSubtotal.toLocaleString()}` },
                { label: 'Taxes (15% VAT) & Protection Fee', amountText: `R${(taxes + serviceFee).toLocaleString()}` },
                ...(payAtProperty > 0 ? [{ label: 'Remaining balance at check-in', amountText: `R${payAtProperty.toLocaleString()}` }] : []),
              ]}
              customerName={guestName}
              customerEmail={guestEmail}
              metadata={{
                roomId: room.id,
                ratePlan: ratePlan.name,
                checkIn,
                checkOut,
                nights,
                payOption,
              }}
              submitLabel={`Settle Short Stay · R${payToday.toLocaleString()}`}
              onSettled={handleShortStaySettled}
            />

            {settledReceipt && (
              <p className="text-[11px] text-center text-[#6B6B6B] dark:text-slate-400">
                Settlement ID {settledReceipt.settlementId} · Protected under AfriEstate Short-Stay Guarantee.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
