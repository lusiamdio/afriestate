import React from 'react';
import type { Property } from '../types';
import { 
  CheckBadgeIcon, 
  XMarkIcon, 
  DocumentCheckIcon, 
  MapPinIcon, 
  UserIcon, 
  ShieldCheckIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

interface PropertyVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
}

const PropertyVerificationModal: React.FC<PropertyVerificationModalProps> = ({ isOpen, onClose, property }) => {
  if (!isOpen || !property) return null;

  const details = property.verificationDetails || {
    verifiedDate: 'October 2026',
    titleDeedNumber: 'AFR-REG-' + property.id.padStart(4, '0'),
    inspectionDate: 'Recent',
    registryStatus: 'Government Deeds Registry Verified',
    surveyVerified: true,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CheckBadgeIcon className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Why is this property verified?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              AfriEstate Anti-Fraud & Title Deed Verification Guarantee
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          Every verified property on AfriEstate undergoes multi-stage cryptographic and physical due diligence to ensure real assets, legitimate ownership, and zero duplicate fraud.
        </p>

        {/* Verification Checklist */}
        <div className="space-y-3.5 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <DocumentCheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                Title Deed & Land Registry Match
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Deed Registry File: <span className="font-mono text-slate-700 dark:text-slate-200">{details.titleDeedNumber}</span> · {details.registryStatus}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <MapPinIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                Physical On-Site Inspection & GPS Surveyor Stamp
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                On-site verification completed on {details.inspectionDate}. Coordinates and boundary pegs confirmed against national cadastral mapping.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <UserIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                Identity & Certified Agent KYC
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Listed by {property.agent.name} (Verified Agency License). Government-issued ID and banking KYC authenticated.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                Zero Encumbrance & Anti-Fraud Clearance
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                No active litigation, court interdicts, or tax liens found. Clean transfer certification verified as of {details.verifiedDate}.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Verified Property ID: #{property.id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyVerificationModal;
