import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface WellnessListingFormProps {
    currentUser: User;
    onSuccess: () => void;
    onBack: () => void;
}

const WellnessListingForm: React.FC<WellnessListingFormProps> = ({ currentUser, onSuccess, onBack }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        
        const payload = {
            user_id: currentUser.id,
            business_name: formData.get('businessName') as string,
            trading_name: formData.get('tradingName') as string || null,
            registration_number: formData.get('registrationNumber') as string || null,
            wellness_category: formData.get('wellnessCategory') as string,
            
            contact_person: formData.get('contactPerson') as string,
            mobile_number: formData.get('mobileNumber') as string,
            whatsapp_number: formData.get('whatsappNumber') as string,
            email_address: formData.get('emailAddress') as string,
            website: formData.get('website') as string || null,
            
            country: formData.get('country') as string,
            province: formData.get('province') as string || null,
            city: formData.get('city') as string,
            physical_address: formData.get('physicalAddress') as string || null,
            
            description: formData.get('description') as string,
            status: 'pending_review'
        };

        try {
            const { error: insertError } = await supabase.from('wellness_services').insert([payload]);
            if (insertError) throw insertError;
            
            alert('Listing Submitted Successfully for Review!');
            onSuccess();
        } catch (err: any) {
            console.error('Error submitting wellness service:', err);
            setError(err.message || 'An error occurred while submitting your listing.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-12">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">AfriEstate Wellness Services Listing Form</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Connect with clients looking for wellness, beauty, fitness, and holistic health services.</p>
                {error && <p className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</p>}
            </div>

            <section>
                <h3 className="text-lg font-bold border-b border-gray-200 dark:border-slate-700 pb-2 mb-6 text-brand-dark dark:text-gray-200">1. BUSINESS INFORMATION</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Business Name *</label>
                        <input type="text" name="businessName" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Trading Name (if different)</label>
                        <input type="text" name="tradingName" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Business Registration Number</label>
                        <input type="text" name="registrationNumber" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Wellness Category *</label>
                        <select name="wellnessCategory" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none">
                            <option value="">Select Category</option>
                            <option value="spa">Spa & Wellness Center</option>
                            <option value="massage">Massage Therapy</option>
                            <option value="beauty">Beauty Salon</option>
                            <option value="fitness">Fitness Trainer</option>
                            <option value="yoga">Yoga Instructor</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-lg font-bold border-b border-gray-200 dark:border-slate-700 pb-2 mb-6 text-brand-dark dark:text-gray-200">2. CONTACT INFORMATION</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Contact Person *</label>
                        <input type="text" name="contactPerson" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Mobile Number *</label>
                        <input type="tel" name="mobileNumber" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">WhatsApp Number *</label>
                        <input type="tel" name="whatsappNumber" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Email Address *</label>
                        <input type="email" name="emailAddress" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2">Website</label>
                        <input type="url" name="website" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-lg font-bold border-b border-gray-200 dark:border-slate-700 pb-2 mb-6 text-brand-dark dark:text-gray-200">3. LOCATION DETAILS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Country *</label>
                        <input type="text" name="country" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Province / State</label>
                        <input type="text" name="province" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">City *</label>
                        <input type="text" name="city" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Physical Address</label>
                        <input type="text" name="physicalAddress" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-lg font-bold border-b border-gray-200 dark:border-slate-700 pb-2 mb-6 text-brand-dark dark:text-gray-200">4. BUSINESS PROFILE</h3>
                <div>
                    <label className="block text-sm font-semibold mb-2">Business Description * (Describe your business, specialties, experience, and services offered.)</label>
                    <textarea name="description" required rows={5} className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none"></textarea>
                </div>
            </section>

            <section>
                <h3 className="text-lg font-bold border-b border-gray-200 dark:border-slate-700 pb-2 mb-6 text-brand-dark dark:text-gray-200">15. DECLARATION</h3>
                <div className="space-y-4">
                    <label className="flex items-center gap-3">
                        <input type="checkbox" required className="w-5 h-5 rounded border-gray-300 text-brand-primary" />
                        <span className="text-sm">I confirm that all information provided is accurate.</span>
                    </label>
                    <label className="flex items-center gap-3">
                        <input type="checkbox" required className="w-5 h-5 rounded border-gray-300 text-brand-primary" />
                        <span className="text-sm">I agree to AfriEstate Terms & Conditions.</span>
                    </label>
                    <label className="flex items-center gap-3">
                        <input type="checkbox" required className="w-5 h-5 rounded border-gray-300 text-brand-primary" />
                        <span className="text-sm">I agree to AfriEstate Privacy Policy.</span>
                    </label>
                </div>
            </section>

            <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex gap-4 justify-end flex-shrink-0 -mx-6 -mb-6">
                <button type="button" onClick={onBack} className="px-6 py-3 font-semibold text-gray-500 hover:text-gray-700">Back</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-brand-primary text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto disabled:opacity-50 disabled:transform-none">
                    {isSubmitting ? 'Submitting...' : 'Submit For Review'}
                </button>
            </div>
        </form>
    );
};

export default WellnessListingForm;
