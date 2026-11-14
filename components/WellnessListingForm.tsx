import React, { useState } from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { publishWellnessService } from '../lib/data';
import type { Property, User } from '../types';
import { useToast } from '../contexts/ToastContext';
import {
  assertCanPublish,
  checkSubmissionThrottle,
  isValidEmail,
  isValidPhone,
  sanitizeSafeUrl,
  sanitizeText,
} from '../lib/security';

interface WellnessListingFormProps {
  currentUser: User;
  onSuccess: (publishedProperty?: Property) => void;
  onBack: () => void;
}

const WELLNESS_IMAGES = [
  { label: 'Thermal Spa Retreat', url: '/images/spa_wellness_1779978823248.png' },
  { label: 'Safari Lodge Sanctuary', url: '/images/safari_lodge_retreat.jpg' },
  { label: 'Garden Pool Villa', url: '/images/house_pool_1779978750296.png' },
];

const WellnessListingForm: React.FC<WellnessListingFormProps> = ({ currentUser, onSuccess, onBack }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(WELLNESS_IMAGES[0].url);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const perm = assertCanPublish(currentUser, 'Wellness Retreat');
    if (!perm.ok) {
      setError(perm.reason || 'Permission denied.');
      return;
    }

    const throttle = checkSubmissionThrottle(`wellness_submit_${currentUser.username}`, 2500);
    if (!throttle.allowed) {
      setError(`Please wait ${throttle.waitSeconds}s before submitting again.`);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const mobileNumber = sanitizeText(String(formData.get('mobileNumber') || ''), 30);
    const whatsappNumber = sanitizeText(String(formData.get('whatsappNumber') || ''), 30);
    const emailAddress = sanitizeText(String(formData.get('emailAddress') || ''), 120);
    const sessionPrice = parseFloat(String(formData.get('sessionPrice') || '650'));

    if (!isValidPhone(mobileNumber) || !isValidPhone(whatsappNumber)) {
      setError('Please enter valid international mobile and WhatsApp phone numbers.');
      return;
    }
    if (!isValidEmail(emailAddress)) {
      setError('Please enter a valid contact email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const customImage = String(formData.get('imageUrl') || '').trim();
      const published = await publishWellnessService(
        {
          business_name: sanitizeText(String(formData.get('businessName')), 100),
          trading_name: sanitizeText(String(formData.get('tradingName')), 100) || null,
          registration_number: sanitizeText(String(formData.get('registrationNumber')), 60) || null,
          wellness_category: sanitizeText(String(formData.get('wellnessCategory')), 50),
          contact_person: sanitizeText(String(formData.get('contactPerson')), 80),
          mobile_number: mobileNumber,
          whatsapp_number: whatsappNumber,
          email_address: emailAddress,
          website: formData.get('website') ? sanitizeSafeUrl(String(formData.get('website')), '') : null,
          country: sanitizeText(String(formData.get('country')), 60),
          province: sanitizeText(String(formData.get('province')), 60) || null,
          city: sanitizeText(String(formData.get('city')), 60),
          physical_address: sanitizeText(String(formData.get('physicalAddress')), 140) || null,
          description: sanitizeText(String(formData.get('description')), 1500),
          session_price: Number.isFinite(sessionPrice) && sessionPrice > 0 ? sessionPrice : 650,
          image_url: sanitizeSafeUrl(customImage, selectedImage),
        },
        currentUser
      );

      addToast(`"${published.title}" is now live in the Wellness & Retreats Directory!`, 'success');
      onSuccess(published);
    } catch (err: any) {
      setError(err.message || 'An error occurred while publishing your sanctuary.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold font-heading text-gray-900 dark:text-white">
          AfriEstate Wellness &amp; Retreat Listing Form
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Published sanctuaries sync directly to the Wellness Retreats front page with verification protection
        </p>
        {error && (
          <p role="alert" className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {error}
          </p>
        )}
      </div>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 dark:border-slate-700 pb-2 mb-5 text-slate-900 dark:text-gray-200">
          1. Business &amp; Modality Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Business / Retreat Name *</label>
            <input type="text" name="businessName" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Trading Name (if different)</label>
            <input type="text" name="tradingName" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Business / Practice Registration Number</label>
            <input type="text" name="registrationNumber" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Wellness Category *</label>
            <select name="wellnessCategory" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700">
              <option value="">Select Category</option>
              <option value="spa">Spa &amp; Thermal Wellness Retreat</option>
              <option value="massage">Holistic Healing &amp; Massage</option>
              <option value="beauty">Botanical Spa &amp; Skin Atelier</option>
              <option value="fitness">Physical Performance &amp; Coaching</option>
              <option value="yoga">Mindfulness, Yoga &amp; Breathwork</option>
              <option value="other">Clinical Longevity &amp; Recovery</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Starting Session / Retreat Rate (ZAR)</label>
            <input type="number" min={100} defaultValue={650} name="sessionPrice" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
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
            <input type="tel" name="mobileNumber" required placeholder="+27 21 555 0144" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">WhatsApp Number *</label>
            <input type="tel" name="whatsappNumber" required placeholder="+27 21 555 0144" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
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
          3. Location &amp; Sanctuary Photography
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Country *</label>
            <input type="text" name="country" required defaultValue="South Africa" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Province / State</label>
            <input type="text" name="province" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">City *</label>
            <input type="text" name="city" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Physical Address</label>
            <input type="text" name="physicalAddress" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-semibold">Sanctuary Photo URL (Optional)</label>
          <input type="text" name="imageUrl" placeholder={selectedImage} className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
          <div className="flex flex-wrap gap-2">
            {WELLNESS_IMAGES.map((img) => (
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
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 dark:border-slate-700 pb-2 mb-4 text-slate-900 dark:text-gray-200">
          4. Business Profile &amp; Treatments *
        </h3>
        <textarea name="description" required minLength={15} rows={4} placeholder="Describe practitioners, clinical credentials, treatments, thermal suites, and packages..." className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
      </section>

      <section>
        <div className="space-y-2.5 text-xs sm:text-sm">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" required className="w-4 h-4 rounded border-gray-300 text-emerald-700" />
            <span>I confirm all credentials and sanctuary information are accurate and agree to AfriEstate Terms &amp; Privacy Policy.</span>
          </label>
        </div>
      </section>

      <div className="p-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex flex-wrap gap-3 items-center justify-between -mx-6 -mb-6">
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
            {isSubmitting ? 'Publishing...' : 'Publish Wellness Listing'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default WellnessListingForm;
