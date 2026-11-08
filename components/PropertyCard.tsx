
import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Property } from '../types';
import { BedIcon, BathIcon, AreaIcon } from './icons/PropertyIcons';
import { LocationPinIcon } from './icons/NavIcons';
import { HeartIcon, HeartIconSolid, CalculatorIcon, CalendarIcon, CheckBadgeIcon, StarIcon, SparklesIcon, Square2StackIcon, PencilIcon, TrashIcon, CubeTransparentIcon, EyeIcon, ShareIcon, LinkIcon, CheckIcon, VrHeadsetIcon } from './icons/ActionIcons';
import { FacebookIcon, TwitterIcon, WhatsAppIcon } from './icons/SocialIcons';
import { ListingType, PropertyType } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

interface ShareMenuProps {
  propertyTitle: string;
  propertyUrl: string;
}

const ShareMenu: React.FC<ShareMenuProps> = ({ propertyTitle, propertyUrl }) => {
  const [copied, setCopied] = useState(false);

  const shareText = `Check out this amazing property I found on AfriEstate: ${propertyTitle}`;
  
  const socialLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}&quote=${encodeURIComponent(shareText)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(propertyUrl)}&text=${encodeURIComponent(shareText)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${propertyUrl}`)}`
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(propertyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleSocialClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-48 glass-panel rounded-lg shadow-xl border border-slate-200/80 dark:border-slate-700 py-2 z-20 animate-fade-in-up-sm">
        <button onClick={(e) => handleSocialClick(e, socialLinks.facebook)} className="share-button">
            <FacebookIcon className="w-5 h-5 text-blue-600" /><span>Facebook</span>
        </button>
        <button onClick={(e) => handleSocialClick(e, socialLinks.twitter)} className="share-button">
            <TwitterIcon className="w-5 h-5 text-sky-400" /><span>Twitter</span>
        </button>
        <button onClick={(e) => handleSocialClick(e, socialLinks.whatsapp)} className="share-button">
            <WhatsAppIcon className="w-5 h-5 text-green-500" /><span>WhatsApp</span>
        </button>
        <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
        <button onClick={handleCopy} className="share-button">
            {copied ? <><CheckIcon className="w-5 h-5 text-green-500"/><span>Copied!</span></> : <><LinkIcon className="w-5 h-5 text-slate-500" /><span>Copy Link</span></>}
        </button>
        <style>{`
            .share-button {
                @apply w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3;
            }
             @keyframes fadeInUpSm {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up-sm {
                animation: fadeInUpSm 0.2s ease-out forwards;
            }
        `}</style>
    </div>
  );
};

interface PropertyCardProps {
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
}


const PropertyCard: React.FC<PropertyCardProps> = (props) => {
    const { property, isSaved, isCompared, isOwner, onSaveToggle, onOpenCalculator, onOpenTourModal, onFindSimilar, onOpenDetailModal, onOpenVRTour, onToggleCompare, onEdit, onDelete } = props;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
    const shareRef = useRef<HTMLDivElement>(null);
    const { formatCurrency } = useCurrency();
    const { addToast } = useToast();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
                setIsShareMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const priceSuffix = useMemo(() => {
        if (property.propertyType === PropertyType.TRANSPORT) return '/day';
        if (property.perNightPrice) return '/night';
        if (property.listingType === ListingType.RENT) return '/mo';
        return '';
    }, [property.listingType, property.perNightPrice, property.propertyType]);

    const formattedPrice = `${formatCurrency(property.price)}${priceSuffix}`;

    const handleActionClick = (e: React.MouseEvent, action: (p: Property) => void) => {
        e.stopPropagation();
        e.preventDefault();
        action(property);
    };
    
    const handleIdActionClick = (e: React.MouseEvent, action: (id: string) => void) => {
        e.stopPropagation();
        e.preventDefault();
        action(property.id);
    };

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex(prev => (prev === 0 ? property.images.length - 1 : prev - 1));
    };

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex(prev => (prev === property.images.length - 1 ? 0 : prev + 1));
    };

    const handleVrTourClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if(property.vrTourUrl) {
            onOpenVRTour(property.vrTourUrl);
        }
    };
    
    const showStandardActions = property.propertyType !== PropertyType.TRANSPORT && property.propertyType !== PropertyType.WELLNESS;

  return (
    <div className="glass-card rounded-xl overflow-hidden group flex flex-col">
      <div className="relative overflow-hidden group/image">
        <button onClick={() => onOpenDetailModal(property)} className="absolute inset-0 z-0"></button>
        <img src={(property.images && property.images.length > 0) ? property.images[currentImageIndex] : 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80'} alt={property.title} className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
        
        {property.images && property.images.length > 1 && (
            <>
                <button onClick={handlePrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white text-brand-dark p-1.5 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity z-10 hover:bg-slate-100 shadow-sm border border-slate-200">
                    <ChevronLeftIcon className="w-4 h-4 text-brand-dark" />
                </button>
                <button onClick={handleNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-brand-dark p-1.5 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity z-10 hover:bg-slate-100 shadow-sm border border-slate-200">
                    <ChevronRightIcon className="w-4 h-4 text-brand-dark" />
                </button>
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {property.images.map((_, index) => (
                        <div key={index} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-white w-3' : 'bg-white/50'}`} />
                    ))}
                </div>
            </>
        )}

        <div className="absolute top-3 right-3 flex flex-col space-y-2" ref={shareRef}>
            <button
                onClick={(e) => {
                    handleIdActionClick(e, onSaveToggle);
                    if (!isSaved) addToast('Property Saved Successfully!', 'success');
                }}
                className="bg-white p-2 border border-slate-200 rounded-full text-slate-700 hover:text-black hover:bg-slate-50 transition-all duration-300 z-10 shadow-sm"
                aria-label={isSaved ? "Unsave property" : "Save property"}
            >
                {isSaved ? (
                    <HeartIconSolid className="w-5 h-5 text-brand-accent animate-heartbeat" />
                ) : (
                    <HeartIcon className="w-5 h-5" />
                )}
            </button>
            <button
                onClick={(e) => handleActionClick(e, onToggleCompare)}
                className={`bg-white p-2 border border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 transition-all duration-300 z-10 shadow-sm ${isCompared ? 'text-brand-dark font-bold' : ''}`}
                aria-label={isCompared ? "Remove from comparison" : "Add to comparison"}
            >
                <Square2StackIcon className="w-5 h-5" />
            </button>
            {property.vrTourUrl && (
                <button
                    onClick={handleVrTourClick}
                    className="bg-white text-brand-dark p-2 rounded-full shadow-sm border border-slate-200 hover:scale-105 hover:bg-slate-50 transition-all duration-300 z-10"
                    aria-label="Open VR Tour"
                >
                    <VrHeadsetIcon className="w-5 h-5" />
                </button>
            )}
             <div className="relative">
                <button
                    onClick={(e) => {e.stopPropagation(); setIsShareMenuOpen(prev => !prev);}}
                    className="bg-white p-2 border border-slate-200 rounded-full text-slate-700 hover:text-black hover:bg-slate-50 transition-all duration-300 z-10 shadow-sm"
                    aria-label="Share property"
                >
                    <ShareIcon className="w-5 h-5" />
                </button>
                {isShareMenuOpen && (
                    <ShareMenu propertyTitle={property.title} propertyUrl={`${window.location.href.split('?')[0]}?propertyId=${property.id}`} />
                )}
            </div>
        </div>

        {isOwner && (
            <div className="absolute bottom-3 left-3 flex space-x-2 z-10">
                <button onClick={(e) => handleActionClick(e, onEdit)} className="bg-white text-brand-dark border border-slate-200 p-2 rounded-full shadow-sm hover:bg-slate-50 transition-all">
                    <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={(e) => handleIdActionClick(e, onDelete)} className="bg-white text-red-600 border border-slate-200 p-2 rounded-full shadow-sm hover:bg-red-50 transition-all">
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        )}

        <div className="absolute top-3 left-3 flex flex-col items-start gap-y-1.5">
            <div className="flex items-center gap-x-1.5">
                <div className={`glass-badge px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
                    {property.listingType}
                </div>
                {property.verified && (
                    <div className="glass-badge px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        <CheckBadgeIcon className="w-3 h-3 text-emerald-600" />
                        <span>Verified</span>
                    </div>
                )}
            </div>
            {property.smartContractReady && (
                <div className="glass-badge px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    <CubeTransparentIcon className="w-3 h-3 text-brand-primary" />
                    <span>Smart Ready</span>
                </div>
            )}
        </div>
      </div>
      <div onClick={() => onOpenDetailModal(property)} className="p-4 flex-grow flex flex-col text-left cursor-pointer">
        <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">{property.propertyType}</span>
            <p className="text-xl font-bold text-brand-dark dark:text-white">{formattedPrice}</p>
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 truncate group-hover:text-brand-primary transition-colors">{property.title}</h3>
        <div className="flex items-center text-slate-500 dark:text-slate-400 mb-4 text-xs">
          <LocationPinIcon className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
          <span className="truncate">{property.address.street}, {property.address.city}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-slate-600 dark:text-slate-300 glass-card p-3 rounded-lg mb-4 text-xs">
            <div className="flex flex-col items-center border-r border-slate-200 dark:border-slate-600">
                <BedIcon className="w-4 h-4 text-brand-primary mb-1"/>
                <span className="font-semibold">{property.details.beds} Beds</span>
            </div>
            <div className="flex flex-col items-center border-r border-slate-200 dark:border-slate-600">
                <BathIcon className="w-4 h-4 text-brand-primary mb-1"/>
                <span className="font-semibold">{property.details.baths} Baths</span>
            </div>
            <div className="flex flex-col items-center">
                <AreaIcon className="w-4 h-4 text-brand-primary mb-1"/>
                <span className="font-semibold">{property.details.area.toLocaleString()} sqft</span>
            </div>
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full glass-card flex items-center justify-center text-brand-primary font-bold text-[10px] uppercase">
                    {property.agent.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-white truncate max-w-[80px]">{property.agent.name}</span>
                </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
                <EyeIcon className="w-3.5 h-3.5"/>
                <span className="text-[10px] font-bold">{property.views}</span>
            </div>
        </div>

        {showStandardActions && (
            <div className="mt-4 flex items-center gap-2">
                <button 
                    onClick={(e) => handleActionClick(e, onOpenTourModal)}
                    className="flex-1 glass-button text-xs font-bold py-2.5 rounded-lg transition-all"
                >
                    Book Tour
                </button>
                <button 
                    onClick={(e) => handleActionClick(e, onFindSimilar)}
                    className="p-2.5 glass-button rounded-lg transition-all"
                    title="Find Similar"
                >
                    <SparklesIcon className="w-4 h-4" />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;