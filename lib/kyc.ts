import { supabase } from './supabase';
import { logger } from './logger';
import type { KycVerification, KycVerificationStatus, User } from '../types';

const FACEONLIVE_REPOSITORY_URL = 'https://github.com/FaceOnLive/Face-Recognition-SDK-Windows.git';
const FACE_MATCH_THRESHOLD = Number(import.meta.env.VITE_KYC_FACE_MATCH_THRESHOLD || 0.82);

type KycProviderResponse = {
  matchScore?: number;
  livenessScore?: number;
  providerReference?: string;
  raw?: unknown;
};

const mapKycRow = (row: any): KycVerification => ({
  id: row.id,
  userId: row.user_id,
  username: row.username,
  role: row.role,
  status: row.status,
  provider: row.provider,
  repositoryUrl: row.repository_url,
  faceMatchScore: row.face_match_score ?? undefined,
  livenessScore: row.liveness_score ?? undefined,
  providerReference: row.provider_reference ?? undefined,
  documentType: row.document_type ?? undefined,
  rejectionReason: row.rejection_reason ?? undefined,
  createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
});

const calculateStatus = (result?: KycProviderResponse): KycVerificationStatus => {
  if (!result) return 'Pending Review';
  const faceScore = result.matchScore ?? 0;
  const livenessScore = result.livenessScore ?? 0;
  return faceScore >= FACE_MATCH_THRESHOLD && livenessScore >= FACE_MATCH_THRESHOLD ? 'Approved' : 'Needs Manual Review';
};

export const createKycVerification = async (
  user: Pick<User, 'id' | 'username' | 'role'>,
  documentType: string,
  providerResult?: KycProviderResponse,
): Promise<KycVerification> => {
  const status = calculateStatus(providerResult);
  const payload = {
    user_id: user.id,
    username: user.username,
    role: user.role,
    status,
    provider: 'FaceOnLive Face Recognition SDK for Windows',
    repository_url: FACEONLIVE_REPOSITORY_URL,
    face_match_score: providerResult?.matchScore ?? null,
    liveness_score: providerResult?.livenessScore ?? null,
    provider_reference: providerResult?.providerReference ?? null,
    document_type: documentType,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('kyc_verifications')
    .upsert(payload, { onConflict: 'username' })
    .select('*')
    .single();

  if (error) {
    logger.error('Unable to create KYC verification record.', error);
    throw error;
  }

  return mapKycRow(data);
};

export const getKycVerificationForUser = async (username: string): Promise<KycVerification | null> => {
  const { data, error } = await supabase
    .from('kyc_verifications')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    logger.warn('Unable to load KYC verification status.', error);
    return null;
  }

  return data ? mapKycRow(data) : null;
};

export const isKycApproved = (verification?: KycVerification | null): boolean => verification?.status === 'Approved';

export const getKycProviderImplementationNotes = (): string[] => [
  'Run the Windows SDK inside a controlled backend verification service, not in the browser.',
  'Send only short-lived signed document/selfie URLs or encrypted object references to the service.',
  'Persist provider scores and references in kyc_verifications; never store raw biometric templates in frontend state.',
  'Require Approved KYC before investor deal requests and other high-risk financial workflows.',
];
