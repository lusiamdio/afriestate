import React, { useState } from 'react';
import { BuildingStorefrontIcon, TruckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { CloseIcon } from './icons/NavIcons';
import RentACarListingForm from './RentACarListingForm';
import WellnessListingForm from './WellnessListingForm';
import AccommodationListingForm from './AccommodationListingForm';
import { PropertyStatus, type Property, type User } from '../types';
import { useAdminState, type SovereignRoleKey } from '../contexts/AdminStateContext';

interface ServiceListingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onOpenWebPage?: (target: 'list-transport' | 'list-wellness' | 'hotel-registration') => void;
  onListingPublished?: (publishedProperty: Property, targetRoute?: 'rent-a-car' | 'find-wellness' | 'book-a-stay') => void;
}

const ServiceListingFormModal: React.FC<ServiceListingFormModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenWebPage,
  onListingPublished,
}) => {
  const [serviceType, setServiceType] = useState<'none' | 'car' | 'wellness' | 'stay'>('none');
  const { settings, roleControls, userOverrides } = useAdminState();

  if (!isOpen) return null;

  const uKey = currentUser.username.toLowerCase();
  const eKey = (currentUser.email || '').toLowerCase();
  const uOverride = userOverrides[uKey] || (eKey ? userOverrides[eKey] : undefined);
  const effRole = ((uOverride?.role || currentUser.role || 'user') as SovereignRoleKey);
  const rolePolicy = roleControls[effRole] || roleControls.user;
  const effectiveKyc = uOverride?.kycStatus || currentUser.kycStatus || (currentUser.isVerified ? 'Approved' : 'Pending');
  const publishingBlocked =
    uOverride?.status === 'Suspended' ||
    uOverride?.status === 'Restricted' ||
    uOverride?.canPublish === false ||
    !rolePolicy.canPublishListings ||
    ((settings.securityPolicies.requireKycToPublish || rolePolicy.requiresKycApproval) && effectiveKyc !== 'Approved');

  const finalizePublished = (
    published: Property | undefined,
    targetRoute: 'rent-a-car' | 'find-wellness' | 'book-a-stay'
  ) => {
    setServiceType('none');
    onClose();
    if (published && onListingPublished) {
      const normalized = settings.securityPolicies.autoModerateListings
        ? { ...published, status: PropertyStatus.PENDING }
        : published;
      onListingPublished(normalized, targetRoute);
    }
  };

  const handleClose = () => {
    setServiceType('none');
    onClose();
  };

  const handleSelectTarget = (target: 'list-transport' | 'list-wellness' | 'hotel-registration', fallback: 'car' | 'wellness') => {
    if (onOpenWebPage) {
      setServiceType('none');
      onClose();
      onOpenWebPage(target);
      return;
    }
    if (target !== 'hotel-registration') {
      setServiceType(fallback);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto" onClick={handleClose}>
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full relative max-h-[90vh] overflow-hidden flex flex-col my-8 transform transition-all ${
          serviceType === 'none' ? 'max-w-2xl' : 'max-w-4xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-[#FAF8F5] dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl md:text-2xl font-heading font-bold text-gray-900 dark:text-white">
              Publish a Service or Stay
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All published listings are verified, integrity-signed, and immediately live on AfriEstate
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 bg-white dark:bg-slate-700 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors shadow-sm"
          >
            <CloseIcon className="w-5 h-5 text-gray-500" />
          </button>
        </header>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
          {publishingBlocked ? (
            <div className="p-8 text-center space-y-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Publishing Restricted by Platform Administration
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Your current role or KYC status does not allow publishing new services right now. Check your Member Hub status or contact compliance support.
              </p>
            </div>
          ) : serviceType === 'none' ? (
            <div className="text-center py-8 px-2">
              <h3 className="text-2xl font-bold font-heading text-gray-900 dark:text-white mb-6">
                What would you like to publish?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {settings.featureFlags.transport && (
                  <button
                    type="button"
                    onClick={() => handleSelectTarget('list-transport', 'car')}
                    className="p-6 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-700 dark:hover:border-amber-300 hover:bg-emerald-50/40 dark:hover:bg-slate-800 transition-all font-semibold text-base text-slate-800 dark:text-slate-200 flex flex-col items-center gap-3 text-center"
                  >
                    <TruckIcon className="w-8 h-8 text-emerald-700 dark:text-amber-300" />
                    <span>Transport · Sell or Hire a Car</span>
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      Syncs to Transport Rentals &amp; Car Sales
                    </span>
                  </button>
                )}
                {settings.featureFlags.wellness && (
                  <button
                    type="button"
                    onClick={() => handleSelectTarget('list-wellness', 'wellness')}
                    className="p-6 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-700 dark:hover:border-amber-300 hover:bg-emerald-50/40 dark:hover:bg-slate-800 transition-all font-semibold text-base text-slate-800 dark:text-slate-200 flex flex-col items-center gap-3 text-center"
                  >
                    <SparklesIcon className="w-8 h-8 text-emerald-700 dark:text-amber-300" />
                    <span>Wellness Retreat &amp; Spa</span>
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      Syncs to Wellness Retreats page
                    </span>
                  </button>
                )}
                {(settings.featureFlags.shortStays || settings.featureFlags.longTerm) && (
                  <button
                    type="button"
                    onClick={() => handleSelectTarget('hotel-registration', 'car')}
                    className="p-6 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-700 dark:hover:border-amber-300 hover:bg-emerald-50/40 dark:hover:bg-slate-800 transition-all font-semibold text-base text-slate-800 dark:text-slate-200 flex flex-col items-center gap-3 text-center"
                  >
                    <BuildingStorefrontIcon className="w-8 h-8 text-emerald-700 dark:text-amber-300" />
                    <span>Short Stay</span>
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      Syncs to Stays &amp; Accommodation · List Hotel Page
                    </span>
                  </button>
                )}
              </div>
            </div>
          ) : serviceType === 'car' ? (
            <RentACarListingForm
              currentUser={currentUser}
              onSuccess={(published) => finalizePublished(published, 'rent-a-car')}
              onBack={() => setServiceType('none')}
            />
          ) : serviceType === 'wellness' ? (
            <WellnessListingForm
              currentUser={currentUser}
              onSuccess={(published) => finalizePublished(published, 'find-wellness')}
              onBack={() => setServiceType('none')}
            />
          ) : (
            <AccommodationListingForm
              currentUser={currentUser}
              onSuccess={(published) => finalizePublished(published, 'book-a-stay')}
              onBack={() => setServiceType('none')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceListingFormModal;
