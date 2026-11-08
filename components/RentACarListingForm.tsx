import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface RentACarListingFormProps {
    currentUser: User;
    onSuccess: () => void;
    onBack: () => void;
}

const RentACarListingForm: React.FC<RentACarListingFormProps> = ({ currentUser, onSuccess, onBack }) => {
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
            vat_number: formData.get('vatNumber') as string || null,
            business_type: formData.get('businessType') as string,
            
            contact_person: formData.get('contactPerson') as string,
            mobile_number: formData.get('mobileNumber') as string,
            whatsapp_number: formData.get('whatsappNumber') as string,
            email_address: formData.get('emailAddress') as string,
            website: formData.get('website') as string || null,
            
            country: formData.get('country') as string,
            province: formData.get('province') as string,
            city: formData.get('city') as string,
            pickup_address: formData.get('pickupAddress') as string,
            
            vehicle_title: formData.get('vehicleTitle') as string,
            vehicle_category: formData.get('vehicleCategory') as string,
            vehicle_make_model: formData.get('vehicleMakeModel') as string,
            vehicle_year: parseInt(formData.get('vehicleYear') as string, 10),
            transmission: formData.get('transmission') as string,
            
            daily_rate: parseFloat(formData.get('dailyRate') as string),
            currency: formData.get('currency') as string,
            
            description: formData.get('description') as string,
            status: 'pending_review'
        };

        try {
            const { error: insertError } = await supabase.from('car_rentals').insert([payload]);
            if (insertError) throw insertError;
            
            alert('Listing Submitted Successfully for Review!');
            onSuccess();
        } catch (err: any) {
            console.error('Error submitting car rental:', err);
            setError(err.message || 'An error occurred while submitting your listing.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-12">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">AfriEstate – Rent-A-Car Listing Form</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Professional Vehicle Rental Listing</p>
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
                        <label className="block text-sm font-semibold mb-2">Trading Name</label>
                        <input type="text" name="tradingName" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Registration Number</label>
                        <input type="text" name="registrationNumber" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">VAT Number (Optional)</label>
                        <input type="text" name="vatNumber" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2">Business Type *</label>
                        <div className="flex flex-wrap gap-4">
                            {['Car Rental Company', 'Individual Vehicle Owner', 'Fleet Operator', 'Chauffeur Service Provider', 'Corporate Mobility Provider'].map(type => (
                                <label key={type} className="flex items-center gap-2">
                                    <input type="radio" name="businessType" value={type} required /> {type}
                                </label>
                            ))}
                        </div>
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
                        <label className="block text-sm font-semibold mb-2">Province / State *</label>
                        <input type="text" name="province" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">City *</label>
                        <input type="text" name="city" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Pickup Address *</label>
                        <input type="text" name="pickupAddress" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-lg font-bold border-b border-gray-200 dark:border-slate-700 pb-2 mb-6 text-brand-dark dark:text-gray-200">4. VEHICLE INFORMATION</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2">Vehicle Title * (e.g., 2024 Toyota Corolla Auto for Rent)</label>
                        <input type="text" name="vehicleTitle" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Vehicle Category *</label>
                        <select name="vehicleCategory" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none">
                            <option value="">Select Category</option>
                            <option value="economy">Economy</option>
                            <option value="luxury">Luxury</option>
                            <option value="suv">SUV</option>
                            <option value="pickup">Pickup</option>
                            <option value="van">Van</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Vehicle Make & Model *</label>
                        <input type="text" name="vehicleMakeModel" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Year *</label>
                        <input type="number" name="vehicleYear" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Transmission *</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2"><input type="radio" name="transmission" value="auto" required /> Automatic</label>
                            <label className="flex items-center gap-2"><input type="radio" name="transmission" value="manual" required /> Manual</label>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-lg font-bold border-b border-gray-200 dark:border-slate-700 pb-2 mb-6 text-brand-dark dark:text-gray-200">5. RENTAL PRICING</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Daily Rate *</label>
                        <input type="number" name="dailyRate" required className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Currency</label>
                        <select name="currency" className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none">
                            <option>ZAR</option>
                            <option>USD</option>
                            <option>EUR</option>
                            <option>GBP</option>
                        </select>
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-lg font-bold border-b border-gray-200 dark:border-slate-700 pb-2 mb-6 text-brand-dark dark:text-gray-200">11. VEHICLE DESCRIPTION</h3>
                <div>
                    <textarea name="description" required rows={4} placeholder="Tell customers about the vehicle, condition, comfort, fuel efficiency, etc." className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 outline-none"></textarea>
                </div>
            </section>

            <section>
                <h3 className="text-lg font-bold border-b border-gray-200 dark:border-slate-700 pb-2 mb-6 text-brand-dark dark:text-gray-200">17. TERMS & CONDITIONS</h3>
                <div className="space-y-4">
                    <label className="flex items-center gap-3">
                        <input type="checkbox" required className="w-5 h-5 rounded border-gray-300 text-brand-primary" />
                        <span className="text-sm">I confirm that all information provided is accurate.</span>
                    </label>
                    <label className="flex items-center gap-3">
                        <input type="checkbox" required className="w-5 h-5 rounded border-gray-300 text-brand-primary" />
                        <span className="text-sm">I have legal authority to rent out this vehicle.</span>
                    </label>
                    <label className="flex items-center gap-3">
                        <input type="checkbox" required className="w-5 h-5 rounded border-gray-300 text-brand-primary" />
                        <span className="text-sm">I agree to AfriEstate Marketplace Terms & Conditions.</span>
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

export default RentACarListingForm;
