/**
 * Customer Addresses Service
 */

import { request } from '@/services/api/client';
import type { AddressResponse } from '@/types/cart.types';

export async function fetchAddresses(): Promise<AddressResponse[]> {
  return request<AddressResponse[]>('/addresses');
}

export async function addAddress(
  address: Omit<AddressResponse, 'id'>
): Promise<AddressResponse> {
  return request<AddressResponse>('/addresses', {
    method: 'POST',
    body: JSON.stringify(address),
  });
}

export async function deleteAddress(id: number): Promise<void> {
  return request<void>(`/addresses/${id}`, {
    method: 'DELETE',
  });
}

export async function updateAddress(
  id: number,
  address: Partial<Omit<AddressResponse, 'id'>>
): Promise<AddressResponse> {
  return request<AddressResponse>(`/addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(address),
  });
}

