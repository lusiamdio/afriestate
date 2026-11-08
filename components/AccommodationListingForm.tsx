import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface Props { currentUser: User; onSuccess: () => void; onBack: () => void; }

const AccommodationListingForm: React.FC<Props> = ({ currentUser, onSuccess, onBack }) => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser.id) return setError('Please sign in again before submitting a listing.');
    setIsSubmitting(true); setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      owner_id: currentUser.id, business_name: String(form.get('businessName') || '').trim(),
      accommodation_type: String(form.get('type')), country: String(form.get('country') || '').trim(), city: String(form.get('city') || '').trim(),
      address: String(form.get('address') || '').trim() || null, nightly_rate: Number(form.get('nightlyRate')),
      currency: String(form.get('currency')), max_guests: Number(form.get('maxGuests')), description: String(form.get('description') || '').trim(),
      images: String(form.get('imageUrl') || '').trim() ? [String(form.get('imageUrl')).trim()] : [], status: 'pending_review',
    };
    const { error: insertError } = await supabase.from('accommodation_services').insert(payload);
    setIsSubmitting(false);
    if (insertError) return setError(insertError.message);
    onSuccess();
  };
  return <form onSubmit={submit} className="space-y-5">
    <div><h3 className="text-2xl font-bold text-gray-900 dark:text-white">Accommodation listing</h3><p className="text-sm text-gray-500">Your stay is submitted for verification before it can be shown publicly.</p></div>
    {error && <p role="alert" className="rounded-lg bg-red-100 p-3 text-red-700">{error}</p>}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <input required name="businessName" placeholder="Accommodation name" className="input" />
      <select required name="type" className="input"><option value="">Accommodation type</option><option value="hotel">Hotel</option><option value="resort">Resort</option><option value="guest_house">Guest house</option><option value="apartment">Serviced apartment</option><option value="villa">Villa</option><option value="lodge">Lodge</option></select>
      <input required name="country" placeholder="Country" className="input" /><input required name="city" placeholder="City" className="input" />
      <input name="address" placeholder="Address (optional)" className="input" /><input required min="1" type="number" name="maxGuests" placeholder="Maximum guests" className="input" />
      <input required min="0" step="0.01" type="number" name="nightlyRate" placeholder="Nightly rate" className="input" /><select name="currency" className="input"><option>ZAR</option><option>USD</option><option>EUR</option><option>GBP</option></select>
    </div>
    <input name="imageUrl" type="url" placeholder="Primary image URL (optional)" className="input w-full" />
    <textarea required minLength={20} name="description" rows={5} placeholder="Describe the stay, amenities, and guest experience (at least 20 characters)" className="input w-full" />
    <div className="flex justify-end gap-3"><button type="button" onClick={onBack} className="px-5 py-2 font-semibold">Back</button><button disabled={isSubmitting} className="rounded-lg bg-brand-primary px-5 py-2 font-bold text-white disabled:opacity-50">{isSubmitting ? 'Submitting…' : 'Submit for review'}</button></div>
    <style>{`.input { @apply rounded-lg border border-gray-300 bg-white p-3 text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white; }`}</style>
  </form>;
};
export default AccommodationListingForm;
