import React, { useState } from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { publishCarRental } from '../lib/data';
import type { Property, User } from '../types';
import { useToast } from '../contexts/ToastContext';
import ImageDropzoneUploader, { type PresetImageOption } from './ImageDropzoneUploader';
import {
  assertCanPublish,
  checkSubmissionThrottle,
  isValidEmail,
  isValidPhone,
  sanitizeSafeUrl,
  sanitizeText,
} from '../lib/security';

interface RentACarListingFormProps {
  currentUser: User;
  onSuccess: (publishedProperty?: Property) => void;
  onBack: () => void;
}

const FLEET_IMAGES: PresetImageOption[] = [
  { label: 'Luxury SUV Fleet', url: '/images/luxury_suv_fleet.jpg' },
  { label: 'Executive Sedan', url: '/images/executive_sedan_fleet.jpg' },
  { label: 'Premier Touring SUV', url: '/images/2a47542b078d54560485a1e72a5373aa9c3a4a48-800x535.avif' },
];

const RentACarListingForm: React.FC<RentACarListingFormProps> = ({ currentUser, onSuccess, onBack }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([FLEET_IMAGES[0].url]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const perm = assertCanPublish(currentUser, 'Transport Rental');
    if (!perm.ok) {
      setError(perm.reason || 'Permission denied.');
      return;
    }

    const throttle = checkSubmissionThrottle(`car_submit_${currentUser.username}`, 2500);
    if (!throttle.allowed) {
      setError(`Please wait ${throttle.waitSeconds}s before submitting another vehicle.`);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const mobileNumber = sanitizeText(String(formData.get('mobileNumber') || ''), 30);
    const whatsappNumber = sanitizeText(String(formData.get('whatsappNumber') || ''), 30);
    const emailAddress = sanitizeText(String(formData.get('emailAddress') || ''), 120);
    const dailyRate = parseFloat(String(formData.get('dailyRate') || '0'));
    const vehicleYear = parseInt(String(formData.get('vehicleYear') || '2025'), 10);

    if (!isValidPhone(mobileNumber) || !isValidPhone(whatsappNumber)) {
      setError('Please enter valid international mobile and WhatsApp numbers.');
      return;
    }
    if (!isValidEmail(emailAddress)) {
      setError('Please enter a valid business email address.');
      return;
    }
    if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
      setError('Daily rate must be greater than zero.');
      return;
    }
    if (vehicleYear < 1998 || vehicleYear > 2027) {
      setError('Vehicle year must be between 1998 and 2027.');
      return;
    }

    setIsSubmitting(true);
    try {
      const gallery = uploadedImages.length > 0 ? uploadedImages : [FLEET_IMAGES[0].url];
      const published = await publishCarRental(
        {
          business_name: sanitizeText(String(formData.get('businessName')), 100),
          trading_name: sanitizeText(String(formData.get('tradingName')), 100) || null,
          registration_number: sanitizeText(String(formData.get('registrationNumber')), 60) || null,
          vat_number: sanitizeText(String(formData.get('vatNumber')), 60) || null,
          business_type: sanitizeText(String(formData.get('businessType')), 80),
          contact_person: sanitizeText(String(formData.get('contactPerson')), 80),
          mobile_number: mobileNumber,
          whatsapp_number: whatsappNumber,
          email_address: emailAddress,
          website: formData.get('website') ? sanitizeSafeUrl(String(formData.get('website')), '') : null,
          country: sanitizeText(String(formData.get('country')), 60),
          province: sanitizeText(String(formData.get('province')), 60),
          city: sanitizeText(String(formData.get('city')), 60),
          pickup_address: sanitizeText(String(formData.get('pickupAddress')), 140),
          vehicle_title: sanitizeText(String(formData.get('vehicleTitle')), 120),
          vehicle_category: sanitizeText(String(formData.get('vehicleCategory')), 40),
          vehicle_make_model: sanitizeText(String(formData.get('vehicleMakeModel')), 80),
          vehicle_year: vehicleYear,
          transmission: sanitizeText(String(formData.get('transmission')), 20),
          daily_rate: dailyRate,
          currency: sanitizeText(String(formData.get('currency')), 10) || 'ZAR',
          description: sanitizeText(String(formData.get('description')), 1500),
          image_url: gallery[0],
          images: gallery,
        },
        currentUser
      );

      addToast(`Vehicle "${published.title}" published live to Transport Rentals!`, 'success');
      onSuccess(published);
    } catch (err: any) {
      setError(err.message || 'An error occurred while publishing your vehicle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold font-heading text-gray-900 dark:text-white">
          AfriEstate – Rent-A-Car Listing Form
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Published vehicles are verified and immediately synced to the Transport Rentals front page
        </p>
        {error && (
          <p role="alert" className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {error}
          </p>
        )}
      </div>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 dark:border-slate-700 pb-2 mb-5 text-slate-900 dark:text-gray-200">
          1. Business Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Business Name *</label>
            <input type="text" name="businessName" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Trading Name</label>
            <input type="text" name="tradingName" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Registration Number</label>
            <input type="text" name="registrationNumber" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">VAT Number (Optional)</label>
            <input type="text" name="vatNumber" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold mb-2">Business Type *</label>
            <div className="flex flex-wrap gap-3 text-xs">
              {['Car Rental Company', 'Individual Vehicle Owner', 'Fleet Operator', 'Chauffeur Service Provider', 'Corporate Mobility Provider'].map((type) => (
                <label key={type} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 cursor-pointer">
                  <input type="radio" name="businessType" value={type} required /> {type}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 dark:border-slate-700 pb-2 mb-5 text-slate-900 dark:text-gray-200">
          2. Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Contact Person *</label>
            <input type="text" name="contactPerson" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Mobile Number *</label>
            <input type="tel" name="mobileNumber" required placeholder="+27 82 555 0199" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">WhatsApp Number *</label>
            <input type="tel" name="whatsappNumber" required placeholder="+27 82 555 0199" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Email Address *</label>
            <input type="email" name="emailAddress" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold mb-1.5">Website (HTTPS optional)</label>
            <input type="url" name="website" placeholder="https://..." className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 dark:border-slate-700 pb-2 mb-5 text-slate-900 dark:text-gray-200">
          3. Location Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Country *</label>
            <input type="text" name="country" required defaultValue="South Africa" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Province / State *</label>
            <input type="text" name="province" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">City *</label>
            <input type="text" name="city" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Pickup Address *</label>
            <input type="text" name="pickupAddress" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 dark:border-slate-700 pb-2 mb-5 text-slate-900 dark:text-gray-200">
          4. Vehicle Information &amp; Visuals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold mb-1.5">Vehicle Title * (e.g., 2025 Range Rover Autobiography)</label>
            <input type="text" name="vehicleTitle" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Vehicle Category *</label>
            <select name="vehicleCategory" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700">
              <option value="">Select Category</option>
              <option value="economy">Executive Sedan</option>
              <option value="luxury">Luxury</option>
              <option value="suv">SUV</option>
              <option value="pickup">Pickup 4x4</option>
              <option value="van">Chauffeur Van</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Vehicle Make &amp; Model *</label>
            <input type="text" name="vehicleMakeModel" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Year *</label>
            <input type="number" min={1998} max={2027} defaultValue={2025} name="vehicleYear" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2">Transmission *</label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="radio" name="transmission" value="auto" defaultChecked required /> Automatic</label>
              <label className="flex items-center gap-2"><input type="radio" name="transmission" value="manual" required /> Manual</label>
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-semibold">Vehicle Photos (Upload / Drag &amp; Drop)</label>
            <ImageDropzoneUploader
              images={uploadedImages}
              onChange={setUploadedImages}
              bucket="service-images"
              folderPrefix="transport"
              maxImages={8}
              title="Upload Vehicle &amp; Fleet Photos"
              subtitle="Drag & drop exterior, interior, or chauffeur photos here, or click to select files from your device."
              presets={FLEET_IMAGES}
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 dark:border-slate-700 pb-2 mb-5 text-slate-900 dark:text-gray-200">
          5. Rental Pricing &amp; Description
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Daily Rate *</label>
            <input type="number" min={50} name="dailyRate" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Currency</label>
            <select name="currency" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700">
              <option>ZAR</option>
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </select>
          </div>
        </div>
        <textarea name="description" required minLength={15} rows={3} placeholder="Tell customers about the vehicle, mileage terms, chauffeur option, fuel policy, and comfort..." className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 dark:border-slate-700 pb-2 mb-4 text-slate-900 dark:text-gray-200">
          6. Security &amp; Compliance Declaration
        </h3>
        <div className="space-y-3 text-xs sm:text-sm">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" required className="w-4 h-4 rounded border-gray-300 text-emerald-700" />
            <span>I confirm all fleet details, roadworthy status, and insurance coverage are accurate.</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" required className="w-4 h-4 rounded border-gray-300 text-emerald-700" />
            <span>I have legal authority to rent out this vehicle under AfriEstate Terms &amp; Privacy Policy.</span>
          </label>
        </div>
      </section>

      <div className="p-5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex flex-wrap gap-3 items-center justify-between">
        <span className="text-[11px] text-slate-500 inline-flex items-center gap-1.5">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
          Protected by AfriEstate Verification Hash
        </span>
        <div className="flex gap-3">
          <button type="button" onClick={onBack} className="px-5 py-2.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:text-gray-900">
            Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-[#0B1F1A] hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Vehicle Listing'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default RentACarListingForm;
