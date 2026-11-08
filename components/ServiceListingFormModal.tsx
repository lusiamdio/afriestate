import React, { useState } from 'react';
import { CloseIcon } from './icons/NavIcons';
import RentACarListingForm from './RentACarListingForm';
import WellnessListingForm from './WellnessListingForm';
import type { User } from '../types';

interface ServiceListingFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
}

const ServiceListingFormModal: React.FC<ServiceListingFormModalProps> = ({ isOpen, onClose, currentUser }) => {
    const [serviceType, setServiceType] = useState<'none' | 'car' | 'wellness'>('none');

    if (!isOpen) return null;

    const handleClose = () => {
        setServiceType('none');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 overflow-y-auto" onClick={handleClose}>
            <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full relative max-h-[90vh] overflow-hidden flex flex-col my-8 transform transition-all ${serviceType === 'none' ? 'max-w-xl' : 'max-w-4xl'}`} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <header className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl md:text-2xl font-heading font-bold text-gray-900 dark:text-white">List a Service</h2>
                    </div>
                    <button onClick={handleClose} className="p-2 bg-white dark:bg-slate-700 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors shadow-sm">
                        <CloseIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </header>

                {/* Form Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                    {serviceType === 'none' ? (
                        <div className="text-center py-12 px-4">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">What type of service do you want to list?</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button 
                                    onClick={() => setServiceType('car')}
                                    className="p-8 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-brand-primary dark:hover:border-brand-primary hover:bg-brand-light dark:hover:bg-brand-primary/10 transition-all font-semibold text-lg text-slate-800 dark:text-slate-200"
                                >
                                    🚗 Rent a Car Listing
                                </button>
                                <button 
                                    onClick={() => setServiceType('wellness')}
                                    className="p-8 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-brand-primary dark:hover:border-brand-primary hover:bg-brand-light dark:hover:bg-brand-primary/10 transition-all font-semibold text-lg text-slate-800 dark:text-slate-200"
                                >
                                    🌿 Wellness Service Listing
                                </button>
                            </div>
                        </div>
                    ) : serviceType === 'car' ? (
                        <RentACarListingForm 
                            currentUser={currentUser} 
                            onSuccess={() => { setServiceType('none'); onClose(); }} 
                            onBack={() => setServiceType('none')} 
                        />
                    ) : (
                        <WellnessListingForm 
                            currentUser={currentUser} 
                            onSuccess={() => { setServiceType('none'); onClose(); }} 
                            onBack={() => setServiceType('none')} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiceListingFormModal;
