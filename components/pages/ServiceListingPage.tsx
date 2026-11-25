import React from 'react';
import {
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import RentACarListingForm from '../RentACarListingForm';
import WellnessListingForm from '../WellnessListingForm';
import { PropertyStatus, type Property, type User } from '../../types';
import { useAdminState, type SovereignRoleKey } from '../../contexts/AdminStateContext';

export type ServiceListingMode = 'hub' | 'transport' | 'wellness';

interface ServiceListingPageProps {
  mode: ServiceListingMode;
  initialTransportMode?: 'hire' | 'sale';
  currentUser: User | null;
  onSelectMode: (nextMode: ServiceListingMode) => void;
  onRedirectToHotelRegistration: () => void;
  onRequireAuth: () => void;
  onBack: () => void;
  onListingPublished: (
    publishedProperty: Property,
    targetRoute: 'rent-a-car' | 'find-wellness'
  ) => void;
}

const ServiceListingPage: React.FC<ServiceListingPageProps> = ({
  mode,
  initialTransportMode = 'hire',
  currentUser,
  onSelectMode,
  onRedirectToHotelRegistration,
  onRequireAuth,
  onBack,
  onListingPublished,
}) => {
  const { settings, roleControls, userOverrides } = useAdminState();

  const uKey = (currentUser?.username || '').toLowerCase();
  const eKey = (currentUser?.email || '').toLowerCase();
  const uOverride = currentUser ? userOverrides[uKey] || (eKey ? userOverrides[eKey] : undefined) : undefined;
  const effRole = ((uOverride?.role || currentUser?.role || 'user') as SovereignRoleKey);
  const rolePolicy = roleControls[effRole] || roleControls.user;
  const effectiveKyc =
    uOverride?.kycStatus ||
    currentUser?.kycStatus ||
    (currentUser?.isVerified ? 'Approved' : 'Pending');

  const publishingBlocked =
    Boolean(currentUser) &&
    (uOverride?.status === 'Suspended' ||
      uOverride?.status === 'Restricted' ||
      uOverride?.canPublish === false ||
      !rolePolicy.canPublishListings ||
      ((settings.securityPolicies.requireKycToPublish || rolePolicy.requiresKycApproval) &&
        effectiveKyc !== 'Approved'));

  const finalizePublished = (
    published: Property | undefined,
    targetRoute: 'rent-a-car' | 'find-wellness'
  ) => {
    if (published) {
      const normalized = settings.securityPolicies.autoModerateListings
        ? { ...published, status: PropertyStatus.PENDING }
        : published;
      onListingPublished(normalized, targetRoute);
    }
  };

  const heroTitle =
    mode === 'transport'
      ? 'List a Car for Sale or Hire'
      : mode === 'wellness'
      ? 'List Wellness Retreat & Spa'
      : 'Publish a Service or Hospitality Listing';

  const heroSubtitle =
    mode === 'transport'
      ? 'Publish verified vehicles for outright sale or daily executive hire with drag-and-drop photography synced straight to the Transport marketplace.'
      : mode === 'wellness'
      ? 'Showcase sanctuaries, thermal spas, holistic retreats, and clinical practitioners synced straight to Wellness Retreats.'
      : 'Choose a category below to open its full dedicated publishing workspace or register your hotel.';

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Top Breadcrumb Bar */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => (mode === 'hub' ? onBack() : onSelectMode('hub'))}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 shrink-0" />
              <span>{mode === 'hub' ? 'Back' : 'All Categories'}</span>
            </button>
            <nav className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>AfriEstate</span>
              <span aria-hidden="true">→</span>
              <span>Publish Service</span>
              {mode !== 'hub' && (
                <>
                  <span aria-hidden="true">→</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {mode === 'transport' ? 'Transport · Sell or Hire a Car' : 'Wellness Retreat & Spa'}
                  </span>
                </>
              )}
            </nav>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-amber-300">
            <ShieldCheckIcon className="w-4 h-4" />
            Verified Partner Publishing
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <section className="bg-[#0B1F1A] text-white py-10 sm:py-12 border-b border-emerald-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
            AfriEstate Dedicated Partner Portal
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading text-white">{heroTitle}</h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">{heroSubtitle}</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 sm:p-8">
          {!currentUser ? (
            <div className="p-8 text-center space-y-4">
              <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                Sign In Required to Publish
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Sign in or create an AfriEstate partner account to upload images and publish your listing live.
              </p>
              <button
                type="button"
                onClick={onRequireAuth}
                className="px-6 py-3 rounded-xl bg-[#0B1F1A] hover:bg-emerald-900 dark:bg-amber-400 dark:text-slate-950 text-white text-xs font-bold shadow-md"
              >
                Sign In / Create Account
              </button>
            </div>
          ) : publishingBlocked ? (
            <div className="p-8 text-center space-y-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Publishing Restricted by Platform Administration
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Your current role or KYC status does not allow publishing new services right now. Check your Member Hub status or contact compliance support.
              </p>
            </div>
          ) : mode === 'hub' ? (
            <div className="py-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold font-heading text-gray-900 dark:text-white">
                  What would you like to publish?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Select a category to open the full publishing page
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {settings.featureFlags.transport && (
                  <button
                    type="button"
                    onClick={() => onSelectMode('transport')}
                    className="p-7 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-700 dark:hover:border-amber-300 hover:bg-emerald-50/40 dark:hover:bg-slate-800 transition-all font-semibold text-base text-slate-800 dark:text-slate-200 flex flex-col items-center gap-3 text-center"
                  >
                    <TruckIcon className="w-9 h-9 text-emerald-700 dark:text-amber-300" />
                    <span>Transport · Sell or Hire a Car</span>
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      Syncs to Transport Rentals &amp; Car Sales
                    </span>
                  </button>
                )}
                {settings.featureFlags.wellness && (
                  <button
                    type="button"
                    onClick={() => onSelectMode('wellness')}
                    className="p-7 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-700 dark:hover:border-amber-300 hover:bg-emerald-50/40 dark:hover:bg-slate-800 transition-all font-semibold text-base text-slate-800 dark:text-slate-200 flex flex-col items-center gap-3 text-center"
                  >
                    <SparklesIcon className="w-9 h-9 text-emerald-700 dark:text-amber-300" />
                    <span>Wellness Retreat &amp; Spa</span>
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      Syncs to Wellness Retreats page
                    </span>
                  </button>
                )}
                {(settings.featureFlags.shortStays || settings.featureFlags.longTerm) && (
                  <button
                    type="button"
                    onClick={onRedirectToHotelRegistration}
                    className="p-7 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-700 dark:hover:border-amber-300 hover:bg-emerald-50/40 dark:hover:bg-slate-800 transition-all font-semibold text-base text-slate-800 dark:text-slate-200 flex flex-col items-center gap-3 text-center"
                  >
                    <BuildingStorefrontIcon className="w-9 h-9 text-emerald-700 dark:text-amber-300" />
                    <span>Short Stay</span>
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      Syncs to Stays &amp; Accommodation · List Hotel Page
                    </span>
                  </button>
                )}
              </div>
            </div>
          ) : mode === 'transport' ? (
            <RentACarListingForm
              key={initialTransportMode}
              initialListingMode={initialTransportMode}
              currentUser={currentUser}
              onSuccess={(published) => finalizePublished(published, 'rent-a-car')}
              onBack={() => onSelectMode('hub')}
            />
          ) : (
            <WellnessListingForm
              currentUser={currentUser}
              onSuccess={(published) => finalizePublished(published, 'find-wellness')}
              onBack={() => onSelectMode('hub')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceListingPage;
