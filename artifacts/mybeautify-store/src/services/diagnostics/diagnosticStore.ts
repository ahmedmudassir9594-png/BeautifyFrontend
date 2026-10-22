/**
 * Diagnostic Error Store & HTTP Status Code Reference
 * Provides real HTTP error tracking, structured diagnosis, and HTTP reference for MALKAZ Developer Tools.
 */

export interface HttpStatusReferenceItem {
  code: number;
  status: string;
  category: '2xx' | '4xx' | '5xx';
  explanation: string;
  potentialCauses: string[];
  operationalImpact: string;
  recommendedResolution: string[];
  affectedModules: string[];
}

export interface DiagnosticErrorRecord {
  id: string;
  timestamp: string;
  statusCode: number | null; // null for network failures
  statusText: string;
  method: string;
  endpoint: string;
  module: 'Authentication' | 'Catalog & Inventory' | 'Orders & Checkout' | 'Cart & Wishlist' | 'Administration' | 'General System';
  errorMessage: string;
  correlationId: string | null;
  durationMs: number | null;
  isNetworkError: boolean;
  errorSummary: string;
  potentialCauses: string[];
  operationalImpact: string;
  recommendedResolution: string;
  developerInvestigation: string;
  statusCategory: '2xx' | '4xx' | '5xx' | 'Network';
}

export const HTTP_STATUS_REFERENCE: HttpStatusReferenceItem[] = [
  {
    code: 200,
    status: 'OK',
    category: '2xx',
    explanation: 'The request has succeeded. The client requested information was retrieved or an operation completed normally.',
    potentialCauses: [
      'Normal request lifecycle completion',
      'Successful retrieval of catalog or profile resources',
    ],
    operationalImpact: 'Normal operation. UI updates with fresh server data.',
    recommendedResolution: [
      'No corrective action required.',
    ],
    affectedModules: ['All MALKAZ Storefront & Admin Modules'],
  },
  {
    code: 201,
    status: 'Created',
    category: '2xx',
    explanation: 'The request has succeeded and led to the creation of a new persistent resource on the server.',
    potentialCauses: [
      'Product, category, or brand published by administrator',
      'New customer registration or order placement finalized',
    ],
    operationalImpact: 'New database record established; lists refreshed with newly created ID.',
    recommendedResolution: [
      'No corrective action required. Ensure client captures new resource identifiers.',
    ],
    affectedModules: ['Catalog Management', 'Customer Registration', 'Order Placement'],
  },
  {
    code: 400,
    status: 'Bad Request',
    category: '4xx',
    explanation: 'The server cannot process the request due to malformed request syntax, invalid parameters, or payload constraints.',
    potentialCauses: [
      'Missing required query parameter or invalid format (e.g. non-numeric ID)',
      'Malformed JSON payload in request body',
      'Bean validation constraint violated on entity input',
    ],
    operationalImpact: 'Target operation is halted without modifying database state. The user remains on the current screen.',
    recommendedResolution: [
      'Inspect client request parameters and JSON schema before dispatching.',
      'Review form input validation constraints against Spring Boot DTO rules.',
    ],
    affectedModules: ['Catalog Management', 'Cart & Wishlist', 'Checkout & Payment'],
  },
  {
    code: 401,
    status: 'Unauthorized',
    category: '4xx',
    explanation: 'The request lacks valid authentication credentials. Access token is missing, expired, or failed signature verification.',
    potentialCauses: [
      'JWT access token has expired (default: 30 minutes lifetime)',
      'No Bearer token provided in Authorization request header',
      'JWT signing secret mismatch or session terminated',
    ],
    operationalImpact: 'Protected endpoints (Profile, Orders, Admin console) block access and redirect to login.',
    recommendedResolution: [
      'Use POST /api/auth/refresh-token to exchange refresh token for a new access token.',
      'If refresh fails or token is revoked, redirect user to /sign-in.',
    ],
    affectedModules: ['Authentication Service', 'Admin Dashboard', 'Customer Account'],
  },
  {
    code: 403,
    status: 'Forbidden',
    category: '4xx',
    explanation: 'The server understood the request, but the authenticated user lacks sufficient authority/role permissions.',
    potentialCauses: [
      'Authenticated user has CUSTOMER or STAFF role and attempted to call an ADMIN-only endpoint (e.g. /api/admin/audit-logs or /api/admin/dashboard)',
      'Method security @PreAuthorize restriction failed on the controller method',
    ],
    operationalImpact: 'Action denied by Spring Security accessDeniedHandler. Prevents privilege escalation.',
    recommendedResolution: [
      'Verify user role in database (users table).',
      'Ensure administrators are assigned ROLE_ADMIN authority.',
      'Do not grant customer or staff accounts access to restricted admin resources.',
    ],
    affectedModules: ['Audit Logs System', 'Admin User Management', 'Developer Diagnostics'],
  },
  {
    code: 404,
    status: 'Not Found',
    category: '4xx',
    explanation: 'The server cannot locate the requested endpoint URL or the specified entity ID does not exist in the database.',
    potentialCauses: [
      'Product, category, brand, or order ID not found in database',
      'Incorrect API route or missing endpoint path in controller mapping',
      'Entity was soft-deleted or deactivated by another administrator',
    ],
    operationalImpact: 'Requested resource view fails; frontend displays a clear empty or not-found state.',
    recommendedResolution: [
      'Verify the entity ID exists in the database before querying.',
      'Verify controller route annotations and Spring Boot servlet context-path (/api).',
    ],
    affectedModules: ['Product Details', 'Order Lookup', 'Catalog Management'],
  },
  {
    code: 409,
    status: 'Conflict',
    category: '4xx',
    explanation: 'The request could not be completed due to a conflict with the current state of the target resource.',
    potentialCauses: [
      'Duplicate unique field value, such as registering with an email that is already registered',
      'Product SKU conflict with an existing piece in the catalog',
      'Order cancellation attempted after order has already transitioned to SHIPPED or DELIVERED',
    ],
    operationalImpact: 'Transaction aborted cleanly without partial data corruption.',
    recommendedResolution: [
      'Prompt user to use alternative values (e.g. unique email or distinct SKU).',
      'Verify order status transition rules in OrderService before issuing status mutations.',
    ],
    affectedModules: ['Authentication (Registration)', 'Product SKU Management', 'Order Lifecycle'],
  },
  {
    code: 422,
    status: 'Unprocessable Content',
    category: '4xx',
    explanation: 'The request syntax is well-formed, but semantic instructions or domain validations could not be satisfied.',
    potentialCauses: [
      'Stock quantity insufficient to fulfill order quantity during checkout',
      'Coupon usage limits exceeded or expired promotional code',
      'Business rule violation such as negative discount prices or invalid date ranges',
    ],
    operationalImpact: 'Action rejected by domain logic. Clear validation message displayed to user.',
    recommendedResolution: [
      'Check stock quantity before checkout.',
      'Verify coupon validity dates and minimum purchase thresholds.',
    ],
    affectedModules: ['Checkout Flow', 'Coupon & Promotions', 'Inventory Management'],
  },
  {
    code: 429,
    status: 'Too Many Requests',
    category: '4xx',
    explanation: 'The client has sent too many requests in a given amount of time, exceeding applicable rate limits.',
    potentialCauses: [
      'Rapid automated requests or brute-force login attempts',
      'Un-debounced search queries or un-throttled filter clicks in frontend',
    ],
    operationalImpact: 'Further requests temporarily throttled until rate window resets.',
    recommendedResolution: [
      'Ensure client-side search inputs utilize debouncing (e.g. 300ms).',
      'Implement exponential backoff retry on client for throttled endpoints.',
    ],
    affectedModules: ['Search Bar', 'Authentication Endpoints', 'Public Catalog APIs'],
  },
  {
    code: 500,
    status: 'Internal Server Error',
    category: '5xx',
    explanation: 'The server encountered an unexpected condition that prevented it from fulfilling the request.',
    potentialCauses: [
      'Unhandled NullPointerException or runtime exception in service layer',
      'Database query execution error or syntax error in native SQL',
      'Email SMTP connection timeout when sending order confirmation',
    ],
    operationalImpact: 'Affected transaction rolled back. Client receives generic error envelope without secret leakage.',
    recommendedResolution: [
      'Check Spring Boot backend application console logs for stack trace.',
      'Verify database connectivity, schema migrations, and external service configurations.',
    ],
    affectedModules: ['Order Processing', 'Email Notifications', 'Catalog Services'],
  },
  {
    code: 502,
    status: 'Bad Gateway',
    category: '5xx',
    explanation: 'The proxy or gateway received an invalid response from the upstream Spring Boot application server.',
    potentialCauses: [
      'Spring Boot backend process terminated unexpectedly or crashed on port 8080',
      'Vite dev server proxy unable to reach http://localhost:8080/api',
    ],
    operationalImpact: 'All frontend API calls fail immediately with gateway connection refusal.',
    recommendedResolution: [
      'Verify Spring Boot backend is actively running and listening on port 8080.',
      'Check backend console for fatal startup errors or out-of-memory errors.',
    ],
    affectedModules: ['Vite Proxy', 'Storefront Network Layer'],
  },
  {
    code: 503,
    status: 'Service Unavailable',
    category: '5xx',
    explanation: 'The server is currently unable to handle the request due to temporary overloading or maintenance.',
    potentialCauses: [
      'HikariCP database connection pool exhausted',
      'Backend system undergoing database migration or maintenance restart',
    ],
    operationalImpact: 'Requests rejected immediately until server resources recover.',
    recommendedResolution: [
      'Inspect HikariCP connection pool configuration (maximum-pool-size, connection-timeout).',
      'Check if database has reached maximum allowed concurrent connections.',
    ],
    affectedModules: ['Database Connection Pool', 'High-Traffic API Routes'],
  },
  {
    code: 504,
    status: 'Gateway Timeout',
    category: '5xx',
    explanation: 'The proxy or gateway did not receive a timely response from the upstream application server.',
    potentialCauses: [
      'Slow database query locking tables or lacking necessary indexes',
      'Synchronous payment gateway call or SMTP mail server hanging without socket timeout',
    ],
    operationalImpact: 'Request aborted after proxy timeout (typically 30–60 seconds).',
    recommendedResolution: [
      'Inspect slow query logs and add appropriate database indexes.',
      'Ensure external integrations (payment, email) have configured connect and read timeouts.',
    ],
    affectedModules: ['Checkout & Payment Gateway', 'Order Confirmation Mailer'],
  },
];

type Listener = () => void;
const listeners = new Set<Listener>();

const STORAGE_KEY = 'malkaz_diagnostic_errors_v1';

function inferModule(endpoint: string): DiagnosticErrorRecord['module'] {
  const ep = endpoint.toLowerCase();
  if (ep.includes('/auth') || ep.includes('/login') || ep.includes('/register')) return 'Authentication';
  if (ep.includes('/product') || ep.includes('/categor') || ep.includes('/brand') || ep.includes('/inventory')) return 'Catalog & Inventory';
  if (ep.includes('/order') || ep.includes('/checkout') || ep.includes('/payment')) return 'Orders & Checkout';
  if (ep.includes('/cart') || ep.includes('/wishlist')) return 'Cart & Wishlist';
  if (ep.includes('/admin')) return 'Administration';
  return 'General System';
}

function generateInterpretation(status: number | null, isNetwork: boolean, endpoint: string, message: string) {
  if (isNetwork || status === null) {
    return {
      errorSummary: 'Network connectivity failure — unable to establish connection with backend server.',
      potentialCauses: [
        'Spring Boot backend service is not running on port 8080',
        'Vite dev server proxy misconfiguration or target mismatch',
        'Local firewall or network socket connection refused',
      ],
      operationalImpact: 'All communication with the server is blocked. Storefront and admin actions cannot complete.',
      recommendedResolution: 'Check if the Spring Boot application is running on port 8080. Test GET /api/healthz directly.',
      developerInvestigation: 'Inspect terminal logs of Spring Boot and Vite dev server. Verify PORT=8080 and API_PROXY_TARGET.',
    };
  }

  const match = HTTP_STATUS_REFERENCE.find((item) => item.code === status);
  if (match) {
    return {
      errorSummary: `HTTP ${match.code} ${match.status} encountered on ${endpoint}: ${message || match.explanation}`,
      potentialCauses: match.potentialCauses,
      operationalImpact: match.operationalImpact,
      recommendedResolution: match.recommendedResolution.join(' '),
      developerInvestigation: `Check Spring Boot controller mapping for ${endpoint}, verify payload parameters, and inspect server application logs.`,
    };
  }

  return {
    errorSummary: `HTTP ${status} response received on ${endpoint}: ${message}`,
    potentialCauses: ['Unexpected server response', 'Endpoint-specific condition'],
    operationalImpact: 'Operation terminated with non-success status code.',
    recommendedResolution: 'Inspect the backend response payload and verify server state.',
    developerInvestigation: 'Search Spring Boot logs around the recorded timestamp.',
  };
}

let recordsCache: DiagnosticErrorRecord[] | null = null;

function loadStoredRecords(): DiagnosticErrorRecord[] {
  if (recordsCache !== null) return recordsCache;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    recordsCache = raw ? JSON.parse(raw) : [];
  } catch {
    recordsCache = [];
  }
  return recordsCache!;
}

function saveRecords(records: DiagnosticErrorRecord[]) {
  recordsCache = records;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 50)));
  } catch {
    // Ignore storage quota
  }
  listeners.forEach((fn) => fn());
}

export function recordApiDiagnosticError(input: {
  status: number | null;
  statusText?: string;
  method: string;
  endpoint: string;
  errorMessage: string;
  correlationId?: string | null;
  durationMs?: number | null;
  isNetworkError?: boolean;
}): DiagnosticErrorRecord {
  const isNetwork = input.isNetworkError ?? (input.status === null);
  const status = isNetwork ? null : input.status;
  const statusText = input.statusText || (isNetwork ? 'Network Failure' : `HTTP ${status}`);
  const moduleName = inferModule(input.endpoint);
  const interp = generateInterpretation(status, isNetwork, input.endpoint, input.errorMessage);

  const category: DiagnosticErrorRecord['statusCategory'] =
    isNetwork ? 'Network' :
    status && status >= 500 ? '5xx' :
    status && status >= 400 ? '4xx' : '2xx';

  const newRecord: DiagnosticErrorRecord = {
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    statusCode: status,
    statusText,
    method: input.method.toUpperCase(),
    endpoint: input.endpoint,
    module: moduleName,
    errorMessage: input.errorMessage,
    correlationId: input.correlationId || null,
    durationMs: input.durationMs != null ? Math.round(input.durationMs) : null,
    isNetworkError: isNetwork,
    errorSummary: interp.errorSummary,
    potentialCauses: interp.potentialCauses,
    operationalImpact: interp.operationalImpact,
    recommendedResolution: interp.recommendedResolution,
    developerInvestigation: interp.developerInvestigation,
    statusCategory: category,
  };

  const existing = loadStoredRecords();
  saveRecords([newRecord, ...existing]);
  return newRecord;
}

export function getDiagnosticErrors(): DiagnosticErrorRecord[] {
  return [...loadStoredRecords()];
}

export function clearDiagnosticErrors(): void {
  saveRecords([]);
}

export function subscribeToDiagnostics(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
