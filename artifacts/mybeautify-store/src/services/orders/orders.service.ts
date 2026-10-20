/**
 * Customer Orders Service
 */

import { request } from '@/services/api/client';
import type { OrderResponse, CreateOrderPayload } from '@/types/cart.types';
import type { PageResponse } from '@/types/api.types';

export type { CreateOrderPayload };

export async function fetchOrders(): Promise<PageResponse<OrderResponse>> {
  const res = await request<any>('/orders');
  if (Array.isArray(res)) {
    return {
      content: res,
      page: 0,
      size: res.length,
      totalElements: res.length,
      totalPages: 1,
      first: true,
      last: true,
    };
  }
  if (res && Array.isArray(res.content)) {
    return res as PageResponse<OrderResponse>;
  }
  return {
    content: [],
    page: 0,
    size: 0,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  };
}

export async function cancelOrder(orderId: number): Promise<OrderResponse> {
  return request<OrderResponse>(`/orders/${orderId}/cancel`, {
    method: 'POST',
  });
}

export async function fetchOrderById(id: number): Promise<OrderResponse> {
  return request<OrderResponse>(`/orders/${id}`);
}

export async function fetchOrderByNumber(orderNumber: string): Promise<OrderResponse> {
  return request<OrderResponse>(`/orders/number/${orderNumber}`);
}

export async function createOrder(payload: CreateOrderPayload): Promise<OrderResponse> {
  return request<OrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

