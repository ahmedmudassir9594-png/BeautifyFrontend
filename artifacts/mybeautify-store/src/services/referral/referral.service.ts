import { request } from '@/services/api/client';

export interface ReferralItem {
  id: number;
  friendName: string;
  friendEmailMasked: string;
  status: 'REGISTERED' | 'COMPLETED';
  registeredAt: string;
  completedAt?: string | null;
}

export interface ReferralSummary {
  referralCode: string;
  referralLink: string;
  discountDescription: string;
  discountPercent: number;
  minimumOrderAmount: number;
  totalReferrals: number;
  successfulReferrals: number;
  totalRewards: number;
  recentReferrals: ReferralItem[];
}

export interface ReferralValidation {
  valid: boolean;
  referralCode: string;
  referrerName: string;
  discountDescription: string;
  discountPercent: number;
  message: string;
}

export async function fetchMyReferralSummary(): Promise<ReferralSummary> {
  return request<ReferralSummary>('/referrals/me');
}

export async function validateReferralCode(code: string): Promise<ReferralValidation> {
  return request<ReferralValidation>(`/referrals/validate?code=${encodeURIComponent(code.trim())}`);
}
