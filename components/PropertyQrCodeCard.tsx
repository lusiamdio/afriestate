import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCodeIcon,
  ArrowDownTrayIcon,
  LinkIcon,
  CheckIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { WhatsAppIcon } from './icons/SocialIcons';

export function buildPropertyShareUrl(propertyId: string): string {
  if (typeof window === 'undefined') {
    return `?property=${encodeURIComponent(propertyId)}`;
  }
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('property', propertyId);
  return url.toString();
}

interface PropertyQrCodeCardProps {
  propertyId: string;
  propertyTitle: string;
  propertyLocation?: string;
  variant?: 'sidebar' | 'modal';
}

const PropertyQrCodeCard: React.FC<PropertyQrCodeCardProps> = ({
  propertyId,
  propertyTitle,
  propertyLocation,
  variant = 'sidebar',
}) => {
  const shareUrl = useMemo(() => buildPropertyShareUrl(propertyId), [propertyId]);
  const shareSummary = `Check out this property on AfriEstate: ${propertyTitle}${propertyLocation ? ` (${propertyLocation})` : ''}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareSummary} ${shareUrl}`)}`;
  const emailShareUrl = `mailto:?subject=${encodeURIComponent(propertyTitle)}&body=${encodeURIComponent(`${shareSummary}\n\n${shareUrl}`)}`;
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [generationError, setGenerationError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    setIsGenerating(true);
    setGenerationError('');

    QRCode.toDataURL(shareUrl, {
      width: variant === 'modal' ? 280 : 220,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0B1F1A',
        light: '#FFFFFF',
      },
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrDataUrl(dataUrl);
          setIsGenerating(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGenerationError('Could not generate QR code for this listing.');
          setIsGenerating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [shareUrl, variant]);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard restrictions
    }
  };

  const qrSizeClass = variant === 'modal' ? 'w-56 h-56 sm:w-64 sm:h-64' : 'w-40 h-40';

  return (
    <div
      className={
        variant === 'modal'
          ? 'bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-5'
          : 'bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4'
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-amber-300">
            <DevicePhoneMobileIcon className="w-3.5 h-3.5" />
            <span>Save to Mobile</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">
            {variant === 'modal' ? propertyTitle : 'Scan QR to Open on Phone'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {propertyLocation
              ? `Point your camera to bookmark this ${propertyLocation} listing.`
              : 'Scan with your phone camera to open and save this property link.'}
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-amber-300 flex items-center justify-center shrink-0">
          <QrCodeIcon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-slate-950 rounded-xl p-4 border border-slate-200/70 dark:border-slate-800">
        {isGenerating ? (
          <div className={`${qrSizeClass} rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse`} />
        ) : generationError ? (
          <p className="text-xs text-rose-600 dark:text-rose-400 text-center py-6">{generationError}</p>
        ) : (
          <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
            <img
              src={qrDataUrl}
              alt={`QR code for ${propertyTitle}`}
              className={`${qrSizeClass} object-contain block`}
            />
          </div>
        )}
        <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-2.5 truncate max-w-full">
          ?property={propertyId}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors"
        >
          {copied ? (
            <>
              <CheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4 text-slate-500 dark:text-slate-300" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        {qrDataUrl ? (
          <a
            href={qrDataUrl}
            download={`AfriEstate-${propertyId}-QR.png`}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#0B1F1A] hover:bg-emerald-950 text-xs font-semibold text-white transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-amber-300" />
            <span>Save QR PNG</span>
          </a>
        ) : (
          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-400 cursor-not-allowed">
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Save QR PNG</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <a
          href={whatsappShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 text-xs font-semibold text-emerald-800 dark:text-emerald-300 transition-colors"
        >
          <WhatsAppIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>WhatsApp</span>
        </a>
        <a
          href={emailShareUrl}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 text-xs font-semibold text-amber-900 dark:text-amber-300 transition-colors"
        >
          <EnvelopeIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Email</span>
        </a>
      </div>
    </div>
  );
};

export default PropertyQrCodeCard;
