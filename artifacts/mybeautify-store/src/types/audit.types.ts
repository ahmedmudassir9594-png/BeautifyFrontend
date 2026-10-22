/**
 * Audit Log Types matching Spring Boot AuditLog entity & DTO
 */

export interface AuditLogItem {
  id: number;
  timestamp: string;
  actorId?: number | null;
  actorEmail: string;
  actorRole: string;
  action: string;
  category: string;
  entityName: string;
  entityId?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  status: string;
  details?: string | null;
}

export interface AuditLogQueryParams {
  category?: string;
  action?: string;
  actorEmail?: string;
  entityName?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
