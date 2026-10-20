/**
 * Coupons and Discounts Service
 */

import { request } from '@/services/api/client';
import type { CouponResponse } from '@/types/cart.types';

export async function applyCoupon(
  code: string,
  orderAmount: number
): Promise<CouponResponse> {
  return request<CouponResponse>('/coupons/apply', {
    method: 'POST',
    body: JSON.stringify({ code: code.trim().toUpperCase(), orderAmount }),
  });
}
