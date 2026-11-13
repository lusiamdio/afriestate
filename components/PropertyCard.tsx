import React, { useState, useRef, useEffect } from 'react';
import type { Property } from '../types';
import { ListingType } from '../types';
import { BedIcon, BathIcon, AreaIcon } from './icons/PropertyIcons';
import { 
  HeartIcon, 
  CheckBadgeIcon, 
  StarIcon, 
  Square2StackIcon, 
  PencilIcon, 
  TrashIcon, 
  ShareIcon, 
  LinkIcon, 
  CheckIcon,
  EnvelopeIcon 
} from './icons/ActionIcons';
import { 
  SolarIcon, 
  GeneratorIcon, 
  BoreholeIcon, 
  FibreIcon, 
  GatedSecurityIcon,
  YieldTrendingIcon 
} from './icons/AfricanInfrastructureIcons';
import { FacebookIcon, TwitterIcon, WhatsAppIcon } from './icons/SocialIcons';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';
import { ChevronLeftIcon, ChevronRightIcon, ShieldCheckIcon } from '@heroicons/react/20/solid';

interface ShareMenuProps {
  propertyTitle: string;
  propertyUrl: string;
}

const ShareMenu: React.FC<ShareMenuProps> = ({ propertyTitle, propertyUrl }) => {
  const [copied, setCopied] = useState(false);
  const shareText = `Check out this property on AfriEstate: ${propertyTitle}`;
  
  const socialLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}&quote=${encodeURIComponent(shareText)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(propertyUrl)}&text=${encodeURIComponent(shareText)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${propertyUrl}`)}`,
    email: `mailto:?subject=${encodeURIComponent(propertyTitle)}&body=${encodeURIComponent(`${shareText}\n\n${propertyUrl}`)}`
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(propertyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleSocialClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (url.startsWith('mailto:')) {
      window.location.href = url;
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl py-2 z-30 animate-fade-in">
      <button onClick={(e) => handleSocialClick(e, socialLinks.whatsapp)} className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3">
        <WhatsAppIcon className="w-4 h-4 text-emerald-500" /><span>WhatsApp</span>
      </button>
      <button onClick={(e) => handleSocialClick(e, socialLinks.email)} className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3">
        <EnvelopeIcon className="w-4 h-4 text-amber-500" /><span>Email</span>
      </button>
      <button onClick={(e) => handleSocialClick(e, socialLinks.facebook)} className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3">
        <FacebookIcon className="w-4 h-4 text-blue-600" /><span>Facebook</span>
      </button>
      <button onClick={(e) => handleSocialClick(e, socialLinks.twitter)} className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3">
        <TwitterIcon className="w-4 h-4 text-slate-700 dark:text-slate-300" /><span>X (Twitter)</span>
      </button>
      <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
      <button onClick={handleCopy} className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3">
        {copied ? <><CheckIcon className="w-4 h-4 text-green-500"/><span>Copied!</span></> : <><LinkIcon className="w-4 h-4 text-slate-400" /><span>Copy Link</span></>}
      </button>
    </div>
  );
};

export interface PropertyCardProps {
  property: Property;
  isSaved: boolean;
  isCompared: boolean;
  isOwner: boolean;
  onSaveToggle: (propertyId: string) => void;
  onOpenCalculator: (property: Property) => void;
  onOpenTourModal: (property: Property) => void;
  onFindSimilar: (property: Property) => void;
  onOpenDetailModal: (property: Property) => void;
  onOpenVRTour: (url: string) => void;
  onToggleCompare: (property: Property) => void;
  onEdit: (property: Property) => void;
  onDelete: (propertyId: string) => void;
  onOpenVerificationModal?: (property: Property) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isSaved,
  isCompared,
  isOwner,
  onSaveToggle,
  onOpenCalculator,
  onOpenTourModal,
  onFindSimilar,
  onOpenDetailModal,
  onToggleCompare,
  onEdit,
  onDelete,
  onOpenVerificationModal,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const { formatCurrency, currency } = useCurrency();
  const { addToast } = useToast();

  const isInvestment = property.listingType === ListingType.FOR_INVESTMENT || property.targetReturn !== undefined;
  const isRent = property.listingType === ListingType.RENT;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  const handleVerificationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenVerificationModal) {
      onOpenVerificationModal(property);
    } else {
      onOpenDetailModal(property);
    }
  };

  const displayImage = property.images && property.images.length > 0
    ? property.images[currentImageIndex]
    : '/images/house_suburbs_1779978598551.png';

  // Format pricing with local vs converted preferred currency
  const formattedPrice = formatCurrency(property.price);
  const priceSubtext = property.perNightPrice 
    ? '/ night' 
    : isRent 
      ? '/ month' 
      : property.purchasePrice 
        ? 'asking price' 
        : '';

  return (
    <article 
      onClick={() => onOpenDetailModal(property)}
      className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col"
    >
      {/* Media Viewport */}
      <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={displayImage}
          alt={property.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Scrim Overlay for crisp contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges Strip */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-auto">
          {/* Trust Badge */}
          {property.verified ? (
            <button
              type="button"
              onClick={handleVerificationClick}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/85 backdrop-blur-md text-emerald-300 text-xs font-semibold hover:bg-emerald-900 transition-colors"
              title="Click to view verification details"
            >
              <CheckBadgeIcon className="w-4 h-4 text-emerald-400" />
              <span>Verified</span>
            </button>
          ) : (
            <span className="text-[11px] text-white/90 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">
              Unverified
            </span>
          )}

          {/* Quick Actions (Save & Compare & Share) */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onToggleCompare(property)}
              className={`p-1.5 rounded-lg backdrop-blur-md transition-colors ${
                isCompared
                  ? 'bg-amber-600 text-white'
                  : 'bg-black/40 text-white hover:bg-black/60'
              }`}
              title={isCompared ? 'Remove from Compare' : 'Add to Compare'}
            >
              <Square2StackIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onSaveToggle(property.id)}
              className={`p-1.5 rounded-lg backdrop-blur-md transition-colors ${
                isSaved
                  ? 'bg-rose-600 text-white'
                  : 'bg-black/40 text-white hover:bg-black/60'
              }`}
              title={isSaved ? 'Saved to Favorites' : 'Save Property'}
            >
              <HeartIcon className="w-4 h-4 text-current" />
            </button>

            <div className="relative" ref={shareRef}>
              <button
                type="button"
                onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                className="p-1.5 rounded-lg bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-colors"
                title="Share Property"
              >
                <ShareIcon className="w-4 h-4" />
              </button>
              {isShareMenuOpen && (
                <ShareMenu propertyTitle={property.title} propertyUrl={window.location.href} />
              )}
            </div>
          </div>
        </div>

        {/* Carousel Prev/Next Buttons */}
        {property.images && property.images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Bottom Image Subtitle: Location & Country */}
        <div className="absolute bottom-2.5 left-3 right-3 text-white text-xs z-10 pointer-events-none flex items-center justify-between">
          <span className="font-medium text-white/90 drop-shadow-sm truncate">
            {property.address.city}, {property.country || 'Africa'}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-white/90 tabular-nums">
            <StarIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{property.agent.rating.toFixed(1)} ({property.agent.reviewCount})</span>
          </span>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        {/* Title & Neighbourhood */}
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {property.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
            {property.address.street}
          </p>

          {/* If Investment Card: Render Financial Metrics Matrix (Section 9) */}
          {isInvestment ? (
            <div className="mt-3 grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 text-xs">
              <div>
                <span className="text-[10px] text-amber-800 dark:text-amber-400 uppercase tracking-wider block font-semibold">
                  Target Return
                </span>
                <span className="font-bold text-amber-900 dark:text-amber-200 tabular-nums">
                  {property.targetReturn || property.marketROI || 12.0}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-amber-800 dark:text-amber-400 uppercase tracking-wider block font-semibold">
                  Rental Yield
                </span>
                <span className="font-bold text-amber-900 dark:text-amber-200 tabular-nums">
                  {property.rentalYield || 10.5}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-amber-800 dark:text-amber-400 uppercase tracking-wider block font-semibold">
                  Occupancy
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                  {property.occupancyRate || 92}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-amber-800 dark:text-amber-400 uppercase tracking-wider block font-semibold">
                  Min Investment
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                  {property.minInvestment ? formatCurrency(property.minInvestment) : '$10,000+'}
                </span>
              </div>
            </div>
          ) : (
            /* Residential Specs (Bed · Bath · Area) */
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <BedIcon className="w-4 h-4 text-slate-400" />
                <span className="tabular-nums">{property.details.beds}</span> Beds
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="flex items-center gap-1">
                <BathIcon className="w-4 h-4 text-slate-400" />
                <span className="tabular-nums">{property.details.baths}</span> Baths
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="flex items-center gap-1">
                <AreaIcon className="w-4 h-4 text-slate-400" />
                <span className="tabular-nums">{Math.round(property.details.area * 0.0929)}</span> m²
              </span>
            </div>
          )}

          {/* African Infrastructure Highlights Strip */}
          <div className="mt-3 pt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            {property.hasSolar && (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                <SolarIcon className="w-3.5 h-3.5 text-emerald-600" />
                Solar
              </span>
            )}
            {property.hasGenerator && (
              <span className="inline-flex items-center gap-1">
                <GeneratorIcon className="w-3.5 h-3.5 text-amber-600" />
                Generator
              </span>
            )}
            {property.hasBorehole && (
              <span className="inline-flex items-center gap-1">
                <BoreholeIcon className="w-3.5 h-3.5 text-sky-600" />
                Borehole
              </span>
            )}
            {property.hasFibre && (
              <span className="inline-flex items-center gap-1">
                <FibreIcon className="w-3.5 h-3.5 text-indigo-500" />
                Fibre
              </span>
            )}
            {property.securityFeatures && property.securityFeatures.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <GatedSecurityIcon className="w-3.5 h-3.5 text-slate-500" />
                Secured
              </span>
            )}
          </div>
        </div>

        {/* Pricing and Primary CTA */}
        <div className="mt-4 pt-3 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {formattedPrice}
              </span>
              {priceSubtext && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {priceSubtext}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isRent ? 'Verified landlord' : isInvestment ? 'Institutional yield' : 'Freehold deed verified'}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetailModal(property);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition shadow-sm"
          >
            {isInvestment ? 'View Investment' : 'View Property'}
          </button>
        </div>
      </div>
    </article>
  );
};

export default PropertyCard;