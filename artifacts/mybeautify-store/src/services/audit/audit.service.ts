/**
 * Audit Log API Service for Admin Dashboard
 */

import { request } from '@/services/api/client';
import type { AuditLogItem, AuditLogQueryParams, PageResponse } from '@/types/audit.types';

export async function fetchAuditLogs(params: AuditLogQueryParams = {}): Promise<PageResponse<AuditLogItem>> {
  const query = new URLSearchParams();

  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.category && params.category !== 'ALL') query.set('category', params.category);
  if (params.action && params.action !== 'ALL') query.set('action', params.action);
  if (params.actorEmail) query.set('actorEmail', params.actorEmail);
  if (params.entityName && params.entityName !== 'ALL') query.set('entityName', params.entityName);
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const qs = query.toString();
  const endpoint = `/admin/audit-logs${qs ? `?${qs}` : ''}`;
  return request<PageResponse<AuditLogItem>>(endpoint);
}
