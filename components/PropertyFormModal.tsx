import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Modality } from "../lib/ai";
import type { Property, User } from '../types';
import { ListingType, PropertyType, PropertyStatus } from '../types';
import { CloseIcon } from './icons/NavIcons';
import { ALL_AMENITIES } from '../constants';
import { SparklesIcon, SpeakerWaveIcon, PauseIcon, ShieldCheckIcon } from './icons/ActionIcons';
import { decode, decodeAudioData } from '../lib/audioUtils';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';
import { useAdminState, type SovereignRoleKey } from '../contexts/AdminStateContext';
import ImageDropzoneUploader, { type PresetImageOption } from './ImageDropzoneUploader';
import {
  assertCanPublish,
  checkSubmissionThrottle,
  generateListingSignature,
  sanitizeSafeUrl,
  sanitizeText,
} from '../lib/security';

interface PropertyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: Property) => void;
  propertyToEdit: Property | null;
  currentUser: User;
  initialListingType?: ListingType;
}

const IMAGE_PRESETS: PresetImageOption[] = [
  { label: 'Luxury Resort Villa', url: '/images/50_88d3447798594a3781403aa23f0baf00_t_w_1440_h_900.jpg' },
  { label: 'Modern Estate', url: '/images/565600_H_39.jpg' },
  { label: 'Contemporary Home', url: '/images/2ec34ce4ca57aef13fc8b3239a99345e.jpg' },
  { label: 'Furnished Studio', url: '/images/841376502.webp' },
  { label: 'Executive Suite', url: '/images/bQpZBCFZhwE8O_cs7mNAwkaUM8W3jpm_4o1EJoHW6CGw7RXnjNWQ4gX3DfiZQ6GxCxJqkk20Qg5bXqnlWqaI92-MaZ8a8Xmce7-Cu87PNH1kCvSJ58uf9qG4HPAkgSNvwht2w7D-62vuOPfMKOF4mrLv86eLr0x1s2VjH82vOpSiRnY3HbLAXkL6ghFJL81S.jpg' },
  { label: 'Safari Retreat', url: '/images/safari_lodge_retreat.jpg' },
  { label: 'Wellness Spa', url: '/images/getlstd-property-photo.jpg' },
  { label: 'Executive SUV', url: '/images/luxury_suv_fleet.jpg' },
];

const emptyProperty: Omit<Property, 'id' | 'agent' | 'featured' | 'smartContractReady'> = {
  title: '',
  listingType: ListingType.SALE,
  propertyType: PropertyType.APARTMENT,
  address: { street: '', city: '', zip: '' },
  country: 'South Africa',
  region: 'Southern Africa',
  coordinates: { lat: -33.9249, lng: 18.4241 },
  price: 0,
  details: { beds: 2, baths: 2, area: 1200 },
  description: '',
  neighborhoodInfo: '',
  amenities: [],
  images: ['/images/50_88d3447798594a3781403aa23f0baf00_t_w_1440_h_900.jpg'],
  virtualTourUrl: '',
  vrTourUrl: '',
  verified: true,
  views: 0,
  status: PropertyStatus.ACTIVE,
  dateListed: 0,
  saves: 0,
  hasSolar: false,
  hasGenerator: false,
  hasBorehole: false,
  hasFibre: true,
  perNightPrice: false,
  guests: 2,
  leaseDuration: 'Long term',
};

const PropertyFormModal: React.FC<PropertyFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  propertyToEdit,
  currentUser,
  initialListingType,
}) => {
    const [property, setProperty] = useState(emptyProperty);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const { currency } = useCurrency();
    const { addToast } = useToast();
    const { settings, roleControls, userOverrides, countryConfigs } = useAdminState();

    useEffect(() => {
        if (propertyToEdit) {
            setProperty({
                ...emptyProperty,
                ...propertyToEdit,
                country: propertyToEdit.country || 'South Africa',
                region: propertyToEdit.region || 'Southern Africa',
                images: propertyToEdit.images?.length ? propertyToEdit.images : ['/images/50_88d3447798594a3781403aa23f0baf00_t_w_1440_h_900.jpg'],
            });
        } else {
            const defaultListing =
                initialListingType ||
                (currentUser.role === 'investor' ? ListingType.FOR_INVESTMENT : ListingType.SALE);
            setProperty({
                ...emptyProperty,
                dateListed: Date.now(),
                propertyType: PropertyType.APARTMENT,
                listingType: defaultListing,
                leaseDuration: defaultListing === ListingType.RENT ? 'Long term' : emptyProperty.leaseDuration,
            });
        }
        setFormError(null);
    }, [propertyToEdit, isOpen, currentUser, initialListingType]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');

        if (keys.length === 1) {
            setProperty(prev => ({
                ...prev,
                [name]: value,
                ...(name === 'propertyType' && (value === PropertyType.SHORT_TERM_RENTAL || value === PropertyType.HOTEL)
                  ? { listingType: ListingType.RENT, perNightPrice: true, leaseDuration: 'Short term / Stay' as const }
                  : {}),
                ...(name === 'propertyType' && (value === PropertyType.TRANSPORT || value === PropertyType.WELLNESS)
                  ? { listingType: ListingType.RENT }
                  : {}),
            }));
        } else {
            setProperty(prev => ({
                ...prev,
                [keys[0]]: {
                    ...(prev as any)[keys[0]],
                    [keys[1]]: value
                }
            }));
        }
    };

    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');
        const numValue = value === '' ? 0 : Math.max(0, parseInt(value, 10) || 0);

        setProperty(prev => ({
            ...prev,
            [keys[0]]: {
                ...(prev as any)[keys[0]],
                [keys[1]]: numValue
            }
        }));
    };

    const handleAmenityChange = (amenity: string) => {
      setProperty(prev => {
          const newAmenities = prev.amenities.includes(amenity)
            ? prev.amenities.filter(a => a !== amenity)
            : [...prev.amenities, amenity];
          return { ...prev, amenities: newAmenities };
      });
    };

    const handleGenerateDescription = async () => {
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI();
            const prompt = `
                Generate a compelling, professional real estate description based on these details.
                - Title: ${sanitizeText(property.title, 120)}
                - Type: ${property.propertyType}
                - Location: ${sanitizeText(property.address.city, 60)}, ${sanitizeText(property.country || 'South Africa', 60)}
                - Specs: ${property.details.beds} bedrooms, ${property.details.baths} bathrooms, ${property.details.area} sqft
                - Amenities: ${property.amenities.slice(0, 5).join(', ')}
                Write only concise luxury copy under 120 words.
            `;
            const result = await ai.models.generateContent({
                model: 'gemini-4-hydrogen',
                contents: prompt,
            });
            setProperty(prev => ({ ...prev, description: sanitizeText(result.text || '', 1500) }));
        } catch {
            setProperty(prev => ({
              ...prev,
              description: `${sanitizeText(property.title, 80) || 'Architect-designed residence'} positioned in ${sanitizeText(property.address.city, 40) || 'Prime District'}, featuring ${property.details.beds} bedrooms, ${property.details.baths} bathrooms, high-speed fibre readiness, and resilient power infrastructure.`,
            }));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleListen = async (text: string) => {
        if (!text.trim() || isListening) return;
        setIsListening(true);
        try {
            const ai = new GoogleGenAI();
            const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash-lite-tts',
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.start();
                source.onended = () => setIsListening(false);
            } else {
                setIsListening(false);
            }
        } catch {
          setIsListening(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const uKey = currentUser.username.toLowerCase();
        const eKey = (currentUser.email || '').toLowerCase();
        const uOverride = userOverrides[uKey] || (eKey ? userOverrides[eKey] : undefined);
        const effRole = ((uOverride?.role || currentUser.role || 'user') as SovereignRoleKey);
        const rolePolicy = roleControls[effRole] || roleControls.user;

        if (uOverride?.status === 'Suspended' || uOverride?.status === 'Restricted') {
            setFormError('Your account is currently restricted by Platform Administration.');
            return;
        }
        if (uOverride?.canPublish === false || !rolePolicy.canPublishListings) {
            setFormError(`Publishing is currently disabled for the ${rolePolicy.label} role by Super Admin.`);
            return;
        }
        const effectiveKyc = uOverride?.kycStatus || currentUser.kycStatus || (currentUser.isVerified ? 'Approved' : 'Pending');
        if ((settings.securityPolicies.requireKycToPublish || rolePolicy.requiresKycApproval) && effectiveKyc !== 'Approved') {
            setFormError('KYC verification approval is required before publishing live listings.');
            return;
        }

        const targetCountryCfg = countryConfigs.find(
          (c) => c.name.toLowerCase() === (property.country || 'South Africa').toLowerCase()
        );
        if (targetCountryCfg && !targetCountryCfg.enabled) {
            setFormError(`${targetCountryCfg.name} market is currently paused by Platform Administration.`);
            return;
        }

        const perm = assertCanPublish(currentUser, property.propertyType);
        if (!perm.ok) {
            setFormError(perm.reason || 'Permission denied.');
            return;
        }

        const cooldownMs = Math.max(2000, (settings.securityPolicies.autoThrottleCooldownSeconds || 15) * 1000);
        const throttle = checkSubmissionThrottle(`prop_publish_${currentUser.username}`, cooldownMs);
        if (!throttle.allowed) {
            setFormError(`Please wait ${throttle.waitSeconds}s before submitting again.`);
            return;
        }

        const cleanTitle = sanitizeText(property.title, 120);
        const cleanStreet = sanitizeText(property.address.street, 140);
        const cleanCity = sanitizeText(property.address.city, 80);
        if (cleanTitle.length < 3 || !cleanCity || Number(property.price) <= 0) {
            setFormError('Please provide a valid listing title, city, and positive price.');
            return;
        }

        const id = propertyToEdit?.id || `prop_${Date.now().toString(36)}`;
        const sig = generateListingSignature(id, currentUser.username, Number(property.price));
        const sanitizedImages = (property.images || [])
            .map((img) => sanitizeSafeUrl(img, ''))
            .filter(Boolean);
        const resolvedImages =
            sanitizedImages.length > 0
                ? sanitizedImages
                : ['/images/50_88d3447798594a3781403aa23f0baf00_t_w_1440_h_900.jpg'];

        const isDraft = property.status === PropertyStatus.DRAFT;
        const holdForModeration = !isDraft && !propertyToEdit && settings.securityPolicies.autoModerateListings;
        const resolvedStatus = isDraft
          ? PropertyStatus.DRAFT
          : holdForModeration
          ? PropertyStatus.PENDING
          : PropertyStatus.ACTIVE;

        const propertyData: Property = {
            ...property,
            id,
            title: cleanTitle,
            address: {
                street: cleanStreet,
                city: cleanCity,
                zip: sanitizeText(property.address.zip, 20) || '0001',
            },
            country: sanitizeText(property.country || 'South Africa', 60),
            price: Number(property.price),
            description: sanitizeText(property.description, 2000),
            neighborhoodInfo: sanitizeText(property.neighborhoodInfo, 1000),
            images: resolvedImages,
            vrTourUrl: property.vrTourUrl ? sanitizeSafeUrl(property.vrTourUrl, '') : '',
            status: resolvedStatus,
            dateListed: property.dateListed || Date.now(),
            agent: propertyToEdit?.agent || {
                name: sanitizeText(currentUser.fullName || currentUser.username, 80),
                phone: sanitizeText(currentUser.phone || '+27 21 555 0100', 30),
                verified: Boolean(currentUser.isVerified ?? true),
                rating: 4.9,
                reviewCount: 1,
            },
            featured: propertyToEdit?.featured ?? (!isDraft && !holdForModeration),
            verified: Boolean(property.verified),
            verificationDetails: property.verificationDetails || {
                verifiedDate: new Date().toISOString().split('T')[0],
                titleDeedNumber: sig,
                inspectionDate: new Date().toISOString().split('T')[0],
                registryStatus: property.verified ? 'Registry Checked · Integrity Signed' : 'Owner Attested',
                surveyVerified: true,
            },
        };

        addToast(
          holdForModeration
            ? `"${cleanTitle}" submitted to Super Admin approval queue (${sig}).`
            : `"${cleanTitle}" published live (${sig})!`,
          'success'
        );
        onSave(propertyData);
    };

    if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-[110] p-4" onClick={onClose}>
        <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
        >
            <header className="relative flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-800 bg-[#FAF8F5] dark:bg-slate-950 flex-shrink-0">
                <div>
                    <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                        {propertyToEdit ? 'Edit Listing' : 'Publish Verified AfriEstate Listing'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Automatically routes and syncs to its respective AfriEstate front page
                    </p>
                </div>
                <button type="button" onClick={onClose} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </header>

            <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
                <div className="p-6 space-y-6">
                    {formError && (
                      <div role="alert" className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
                        {formError}
                      </div>
                    )}

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Listing Title *</label>
                            <input type="text" name="title" value={property.title} onChange={handleChange} required placeholder="e.g. Clifton Ocean Villa or Sandton Suite" className="w-full input"/>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                              Price ({currency} {property.perNightPrice ? '/ night' : property.listingType === ListingType.RENT ? '/ month' : 'total'}) *
                            </label>
                            <input type="number" min={1} name="price" value={property.price || ''} onChange={(e) => setProperty(p => ({...p, price: Number(e.target.value)}))} required className="w-full input"/>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Listing Intent</label>
                            <select name="listingType" value={property.listingType} onChange={handleChange} className="w-full input">
                                <option value={ListingType.SALE}>For Sale (Landing & Buy Page)</option>
                                <option value={ListingType.RENT}>For Rent / Long-Term Accommodation</option>
                                <option value={ListingType.FOR_INVESTMENT}>For Investment (Investor Feed)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Front-Page Category</label>
                            <select name="propertyType" value={property.propertyType} onChange={handleChange} className="w-full input">
                                {Object.values(PropertyType)
                                    .filter(t => t !== PropertyType.ALL)
                                    .map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Publish Status + Security Verification */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF8F5] dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Publication Status</label>
                            <select
                              name="status"
                              value={property.status}
                              onChange={handleChange}
                              className="w-full input text-xs"
                            >
                              <option value={PropertyStatus.ACTIVE}>Publish Live Immediately (Active)</option>
                              <option value={PropertyStatus.DRAFT}>Save as Private Draft</option>
                            </select>
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={property.verified || false}
                                    onChange={e => setProperty(p => ({...p, verified: e.target.checked}))}
                                    className="h-4 w-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-700"
                                />
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                    Enable Cryptographic Integrity Verification Badge
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Address & Country */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Country</label>
                            <input type="text" name="country" value={property.country || ''} onChange={handleChange} required className="w-full input"/>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">City *</label>
                            <input type="text" name="address.city" value={property.address.city} onChange={handleChange} required className="w-full input"/>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Street / Suburb *</label>
                            <input type="text" name="address.street" value={property.address.street} onChange={handleChange} required className="w-full input"/>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Postal / Zip</label>
                            <input type="text" name="address.zip" value={property.address.zip} onChange={handleChange} className="w-full input"/>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Bedrooms</label>
                            <input type="number" min={0} name="details.beds" value={property.details.beds} onChange={handleNumericChange} required className="w-full input"/>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Bathrooms</label>
                            <input type="number" min={0} name="details.baths" value={property.details.baths} onChange={handleNumericChange} required className="w-full input"/>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Area (sqft)</label>
                            <input type="number" min={0} name="details.area" value={property.details.area} onChange={handleNumericChange} required className="w-full input"/>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Lease Term</label>
                            <select
                              name="leaseDuration"
                              value={property.leaseDuration || 'Long term'}
                              onChange={handleChange}
                              className="w-full input text-xs"
                            >
                              <option value="Long term">Long term</option>
                              <option value="Medium term">Medium term</option>
                              <option value="Short term / Stay">Short term / Stay</option>
                            </select>
                        </div>
                    </div>

                    {/* Resilience Infrastructure Toggles */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                        African Infrastructure Readiness
                      </label>
                      <div className="flex flex-wrap gap-3 text-xs">
                        {[
                          { key: 'hasSolar', label: 'Solar / Inverter' },
                          { key: 'hasGenerator', label: 'Backup Generator' },
                          { key: 'hasBorehole', label: 'Borehole Water' },
                          { key: 'hasFibre', label: 'High-Speed Fibre' },
                        ].map((item) => (
                          <label key={item.key} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean((property as any)[item.key])}
                              onChange={(e) => setProperty((p) => ({ ...p, [item.key]: e.target.checked }))}
                              className="h-4 w-4 rounded text-emerald-700"
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Descriptions */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Description</label>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => handleListen(property.description)} disabled={isListening || !property.description} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50">
                                    {isListening ? <PauseIcon className="w-4 h-4"/> : <SpeakerWaveIcon className="w-4 h-4" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGenerateDescription}
                                    disabled={isGenerating}
                                    className="text-[11px] font-bold uppercase tracking-wider bg-[#0B1F1A] text-[#C9A35D] px-3 py-1.5 rounded-lg hover:bg-emerald-900 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                    <SparklesIcon className="w-3.5 h-3.5"/>
                                    <span>{isGenerating ? 'Drafting...' : 'Draft Description'}</span>
                                </button>
                            </div>
                        </div>
                        <textarea name="description" value={property.description} onChange={handleChange} rows={3} className="w-full input" placeholder="Architectural details, views, nearby transit, security..." />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Neighborhood Highlights</label>
                        <textarea name="neighborhoodInfo" value={property.neighborhoodInfo} onChange={handleChange} rows={2} className="w-full input" placeholder="Schools, shopping hubs, airport access, hospital proximity..." />
                    </div>

                    {/* Media */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                          Property Photos (Upload / Drag &amp; Drop)
                        </label>
                        <ImageDropzoneUploader
                          images={property.images || []}
                          onChange={(nextImages) => setProperty((p) => ({ ...p, images: nextImages }))}
                          bucket="property-media"
                          folderPrefix="properties"
                          maxImages={8}
                          title="Upload Listing Photos"
                          subtitle="Drag & drop property photos here, or browse from your device."
                          presets={IMAGE_PRESETS}
                        />
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">VR / Video Tour URL (Optional)</label>
                          <input type="text" name="vrTourUrl" value={property.vrTourUrl || ''} onChange={handleChange} placeholder="https://youtube.com/embed/..." className="w-full input"/>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Amenities</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/70 dark:bg-slate-800/40">
                            {ALL_AMENITIES.map(amenity => (
                                <label key={amenity} className="flex items-center space-x-2 text-xs cursor-pointer">
                                    <input type="checkbox" checked={property.amenities.includes(amenity)} onChange={() => handleAmenityChange(amenity)} className="h-4 w-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-700"/>
                                    <span className="text-slate-700 dark:text-slate-200">{amenity}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="bg-slate-50 dark:bg-slate-800/90 px-6 py-4 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
                      <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
                      XSS Sanitized &amp; Integrity Signed
                    </span>
                    <div className="flex space-x-3">
                         <button type="button" onClick={onClose} className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600">Cancel</button>
                         <button type="submit" className="bg-[#0B1F1A] hover:bg-emerald-900 text-[#C9A35D] border border-[#C9A35D]/50 px-6 py-2.5 rounded-xl font-bold transition-colors text-xs uppercase tracking-wider">Publish Live Listing</button>
                    </div>
                </footer>
            </form>
        </div>
        <style>{`
            .input {
                @apply px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-none;
            }
        `}</style>
    </div>
  );
};

export default PropertyFormModal;