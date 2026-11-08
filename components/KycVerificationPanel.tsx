import React, { useEffect, useState } from 'react';
import { ShieldCheckIcon, CameraIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import type { KycVerification, User } from '../types';
import { createKycVerification, getKycProviderImplementationNotes, getKycVerificationForUser } from '../lib/kyc';

interface KycVerificationPanelProps {
  user: User;
  onStatusChange?: (verification: KycVerification) => void;
}

const statusStyles: Record<string, string> = {
  Approved: 'bg-green-100 text-green-800 border-green-200',
  'Pending Review': 'bg-amber-100 text-amber-800 border-amber-200',
  'Needs Manual Review': 'bg-orange-100 text-orange-800 border-orange-200',
  Rejected: 'bg-red-100 text-red-800 border-red-200',
  'Not Started': 'bg-slate-100 text-slate-700 border-slate-200',
};

const KycVerificationPanel: React.FC<KycVerificationPanelProps> = ({ user, onStatusChange }) => {
  const [verification, setVerification] = useState<KycVerification | null>(null);
  const [documentType, setDocumentType] = useState('Passport');
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    getKycVerificationForUser(user.username).then(result => {
      if (isMounted) setVerification(result);
    });
    return () => { isMounted = false; };
  }, [user.username]);

  const handleSubmit = async () => {
    setError('');
    if (!idDocument || !selfie) {
      setError('Upload an identity document and a live selfie before submitting biometric KYC.');
      return;
    }
    if (!user.id) {
      setError('Your account session must include a Supabase user id before KYC can be submitted.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createKycVerification(
        { id: user.id, username: user.username, role: user.role },
        documentType,
      );
      setVerification(result);
      onStatusChange?.(result);
    } catch (err: any) {
      setError(err.message || 'Unable to submit KYC verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStatus = verification?.status || user.kycStatus || 'Not Started';

  return (
    <div className="glass-panel rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-brand-primary" /> Biometric KYC Security
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Face recognition checks are designed for a backend Windows service using FaceOnLive's open-source SDK.
          </p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusStyles[currentStatus] || statusStyles['Not Started']}`}>
          {currentStatus}
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid md:grid-cols-3 gap-4">
          <label className="block">
            <span className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Document type</span>
            <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="w-full input-base">
              <option>Passport</option>
              <option>National ID</option>
              <option>Driver License</option>
              <option>Business Registration</option>
            </select>
          </label>
          <label className="block cursor-pointer">
            <span className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Identity document</span>
            <span className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center gap-2 text-sm font-semibold text-brand-primary hover:border-brand-primary">
              <ArrowUpTrayIcon className="w-5 h-5" /> {idDocument ? idDocument.name : 'Upload file'}
            </span>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={event => setIdDocument(event.target.files?.[0] || null)} />
          </label>
          <label className="block cursor-pointer">
            <span className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Live selfie</span>
            <span className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center gap-2 text-sm font-semibold text-brand-primary hover:border-brand-primary">
              <CameraIcon className="w-5 h-5" /> {selfie ? selfie.name : 'Capture/upload'}
            </span>
            <input type="file" accept="image/*" capture="user" className="sr-only" onChange={event => setSelfie(event.target.files?.[0] || null)} />
          </label>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Provider integration guardrails</p>
          <ul className="text-sm text-slate-500 dark:text-slate-400 list-disc pl-5 space-y-1">
            {getKycProviderImplementationNotes().map(note => <li key={note}>{note}</li>)}
          </ul>
        </div>

        {verification && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Provider: {verification.provider} · Reference: {verification.providerReference || 'Pending backend match'} · Updated {new Date(verification.updatedAt).toLocaleString()}
          </div>
        )}
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary w-auto disabled:opacity-60">
          {isSubmitting ? 'Submitting KYC...' : 'Submit biometric KYC'}
        </button>
      </div>
    </div>
  );
};

export default KycVerificationPanel;
