import { supabase } from '../supabase';

export type KycStatus = 'not_started' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'expired';
export type KycRiskLevel = 'low' | 'medium' | 'high';

export interface KycVerification {
  id?: string;
  user_id: string;
  workflow_type: 'kyc' | 'kyb';
  status: KycStatus;
  risk_level: KycRiskLevel;
  assurance_level: number;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  evidence?: Record<string, unknown>;
  checks?: Record<string, unknown>;
  rejection_reason?: string | null;
  expires_at?: string | null;
}

export const getCurrentKycVerification = async (): Promise<KycVerification | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('kyc_verifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('workflow_type', 'kyc')
    .maybeSingle();

  if (error) throw error;
  return data as KycVerification | null;
};

export const submitKycVerification = async (evidence: Record<string, unknown>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in before starting KYC verification.');

  const checks = {
    documentCapture: Boolean(evidence.documentType && evidence.documentLast4),
    livenessAttestation: Boolean(evidence.selfieAttestation),
    consentCaptured: evidence.consent === true,
  };

  const { data, error } = await supabase
    .from('kyc_verifications')
    .upsert({
      user_id: user.id,
      workflow_type: 'kyc',
      status: 'pending',
      risk_level: 'low',
      assurance_level: 0,
      submitted_at: new Date().toISOString(),
      evidence,
      checks,
      rejection_reason: null,
    }, { onConflict: 'user_id,workflow_type' })
    .select('*')
    .single();

  if (error) throw error;
  return data as KycVerification;
};

export const hasApprovedKyc = async (requiredLevel = 1) => {
  const { data, error } = await supabase.rpc('has_approved_kyc', { required_level: requiredLevel });
  if (error) throw error;
  return Boolean(data);
};
