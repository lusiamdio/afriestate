import React, { useState } from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { publishAccommodationService } from '../lib/data';
import type { Property, User } from '../types';
import { useToast } from '../contexts/ToastContext';
import {
  assertCanPublish,
  checkSubmissionThrottle,
  sanitizeSafeUrl,
  sanitizeText,
} from '../lib/security';

interface Props {
  currentUser: User;
  onSuccess: (publishedProperty?: Property) => void;
  onBack: () => void;
}

const STAY_IMAGES = [
  { label: 'Coastal Mansion', url: '/images/2ec34ce4ca57aef13fc8b3239a99345e.jpg' },
  { label: 'Loft Interior', url: '/images/841376502.webp' },
  { label: 'Apartment Block', url: '/images/280162474.jpg' },
];

const AccommodationListingForm: React.FC<Props> = ({ currentUser, onSuccess, onBack }) => {
  const { addToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(STAY_IMAGES[0].url);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const perm = assertCanPublish(currentUser, 'Short-term Stay');
    if (!perm.ok) {
      setError(perm.reason || 'Please sign in before publishing.');
      return;
    }

    const throttle = checkSubmissionThrottle(`stay_submit_${currentUser.username}`, 2500);
    if (!throttle.allowed) {
      setError(`Please wait ${throttle.waitSeconds}s before submitting again.`);
      return;
    }

    const form = new FormData(event.currentTarget);
    const nightlyRate = Number(form.get('nightlyRate'));
    const maxGuests = Number(form.get('maxGuests'));

    if (!Number.isFinite(nightlyRate) || nightlyRate <= 0 || !Number.isFinite(maxGuests) || maxGuests < 1) {
      setError('Nightly rate and maximum guests must be positive numbers.');
      return;
    }

    setIsSubmitting(true);
    try {
      const published = await publishAccommodationService(
        {
          business_name: sanitizeText(String(form.get('businessName')), 120),
          accommodation_type: sanitizeText(String(form.get('type')), 40),
          country: sanitizeText(String(form.get('country')), 60),
          city: sanitizeText(String(form.get('city')), 60),
          address: sanitizeText(String(form.get('address')), 140) || null,
          nightly_rate: nightlyRate,
          currency: sanitizeText(String(form.get('currency')), 10) || 'ZAR',
          max_guests: maxGuests,
          description: sanitizeText(String(form.get('description')), 1500),
          image_url: sanitizeSafeUrl(String(form.get('imageUrl') || ''), selectedImage),
        },
        currentUser
      );

      addToast(`"${published.title}" published live to Stays & Accommodation!`, 'success');
      onSuccess(published);
    } catch (err: any) {
      setError(err.message || 'Could not publish stay.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold font-heading text-gray-900 dark:text-white">
          Accommodation &amp; Stay Listing
        </h3>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Published stays appear immediately on the Short-Term Stays &amp; Long-Term Accommodation front pages.
        </p>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <input required name="businessName" placeholder="Accommodation or Residence Name" className="input" />
        <select required name="type" className="input">
          <option value="">Accommodation type</option>
          <option value="hotel">Hotel</option>
          <option value="resort">Resort</option>
          <option value="guest_house">Guest house</option>
          <option value="apartment">Serviced apartment (Short &amp; Long-Term)</option>
          <option value="villa">Villa</option>
          <option value="lodge">Lodge</option>
        </select>
        <input required name="country" defaultValue="South Africa" placeholder="Country" className="input" />
        <input required name="city" placeholder="City" className="input" />
        <input name="address" placeholder="Street / District (optional)" className="input" />
        <input required min="1" type="number" name="maxGuests" placeholder="Maximum guests" className="input" />
        <input required min="10" step="0.01" type="number" name="nightlyRate" placeholder="Nightly rate" className="input" />
        <select name="currency" className="input">
          <option>ZAR</option>
          <option>USD</option>
          <option>EUR</option>
          <option>GBP</option>
        </select>
      </div>
      <div className="space-y-2">
        <input name="imageUrl" type="text" placeholder={selectedImage} className="input w-full" />
        <div className="flex flex-wrap gap-2">
          {STAY_IMAGES.map((img) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setSelectedImage(img.url)}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold border ${
                selectedImage === img.url
                  ? 'bg-[#0B1F1A] text-white border-[#0B1F1A]'
                  : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
              }`}
            >
              {img.label}
            </button>
          ))}
        </div>
      </div>
      <textarea
        required
        minLength={20}
        name="description"
        rows={4}
        placeholder="Describe the stay, amenities, Wi-Fi/solar resilience, and guest experience (at least 20 characters)"
        className="input w-full"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <span className="text-[11px] text-slate-500 inline-flex items-center gap-1.5">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
          Protected by AfriEstate Verification Hash
        </span>
        <div className="flex gap-3">
          <button type="button" onClick={onBack} className="px-5 py-2.5 text-xs font-semibold">
            Back
          </button>
          <button
            disabled={isSubmitting}
            className="rounded-xl bg-[#0B1F1A] hover:bg-emerald-900 px-6 py-2.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Publishing…' : 'Publish Live Stay'}
          </button>
        </div>
      </div>
      <style>{`.input { @apply rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-700; }`}</style>
    </form>
  );
};

export default AccommodationListingForm;
