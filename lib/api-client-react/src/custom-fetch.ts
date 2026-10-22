export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type ErrorType<T = unknown> = ApiError<T>;

export type BodyType<T> = T;

export type AuthTokenGetter = () => Promise<string | null> | string | null;

const NO_BODY_STATUS = new Set([204, 205, 304]);
const DEFAULT_JSON_ACCEPT = "application/json, application/problem+json";

// ---------------------------------------------------------------------------
// Module-level configuration
// ---------------------------------------------------------------------------

let _baseUrl: string | null = null;
let _authTokenGetter: AuthTokenGetter | null = null;

/**
 * Set a base URL that is prepended to every relative request URL
 * (i.e. paths that start with `/`).
 *
 * Useful for Expo bundles that need to call a remote API server.
 * Pass `null` to clear the base URL.
 */
export function setBaseUrl(url: string | null): void {
  _baseUrl = url ? url.replace(/\/+$/, "") : null;
}

/**
 * Register a getter that supplies a bearer auth token.  Before every fetch
 * the getter is invoked; when it returns a non-null string, an
 * `Authorization: Bearer <token>` header is attached to the request.
 *
 * Useful for Expo bundles making token-gated API calls.
 * Pass `null` to clear the getter.
 *
 * NOTE: This function should never be used in web applications where session
 * token cookies are automatically associated with API calls by the browser.
 */
export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  _authTokenGetter = getter;
}

function isRequest(input: RequestInfo | URL): input is Request {
  return typeof Request !== "undefined" && input instanceof Request;
}

function resolveMethod(input: RequestInfo | URL, explicitMethod?: string): string {
  if (explicitMethod) return explicitMethod.toUpperCase();
  if (isRequest(input)) return input.method.toUpperCase();
  return "GET";
}

// Use loose check for URL — some runtimes (e.g. React Native) polyfill URL
// differently, so `instanceof URL` can fail.
function isUrl(input: RequestInfo | URL): input is URL {
  return typeof URL !== "undefined" && input instanceof URL;
}

function applyBaseUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (!_baseUrl) return input;
  const url = resolveUrl(input);
  // Only prepend to relative paths (starting with /)
  if (!url.startsWith("/")) return input;

  const base = _baseUrl.replace(/\/+$/, "");
  let path = url;
  if (base.endsWith("/api") && (path === "/api" || path.startsWith("/api/"))) {
    path = path.slice(4) || "/";
  }

  const absolute = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  if (typeof input === "string") return absolute;
  if (isUrl(input)) return new URL(absolute);
  return new Request(absolute, input as Request);
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (isUrl(input)) return input.toString();
  return input.url;
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>): Headers {
  const headers = new Headers();

  for (const source of sources) {
    if (!source) continue;
    new Headers(source).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
}

function getMediaType(headers: Headers): string | null {
  const value = headers.get("content-type");
  return value ? value.split(";", 1)[0].trim().toLowerCase() : null;
}

function isJsonMediaType(mediaType: string | null): boolean {
  return mediaType === "application/json" || Boolean(mediaType?.endsWith("+json"));
}

function isTextMediaType(mediaType: string | null): boolean {
  return Boolean(
    mediaType &&
      (mediaType.startsWith("text/") ||
        mediaType === "application/xml" ||
        mediaType === "text/xml" ||
        mediaType.endsWith("+xml") ||
        mediaType === "application/x-www-form-urlencoded"),
  );
}

// Use strict equality: in browsers, `response.body` is `null` when the
// response genuinely has no content.  In React Native, `response.body` is
// always `undefined` because the ReadableStream API is not implemented —
// even when the response carries a full payload readable via `.text()` or
// `.json()`.  Loose equality (`== null`) matches both `null` and `undefined`,
// which causes every React Native response to be treated as empty.
function hasNoBody(response: Response, method: string): boolean {
  if (method === "HEAD") return true;
  if (NO_BODY_STATUS.has(response.status)) return true;
  if (response.headers.get("content-length") === "0") return true;
  if (response.body === null) return true;
  return false;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function getStringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const candidate = (value as Record<string, unknown>)[key];
  if (typeof candidate !== "string") return undefined;

  const trimmed = candidate.trim();
  return trimmed === "" ? undefined : trimmed;
}

function truncate(text: string, maxLength = 300): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function buildErrorMessage(response: Response, data: unknown): string {
  const prefix = `HTTP ${response.status} ${response.statusText}`;

  if (typeof data === "string") {
    const text = data.trim();
    return text ? `${prefix}: ${truncate(text)}` : prefix;
  }

  const title = getStringField(data, "title");
  const detail = getStringField(data, "detail");
  const message =
    getStringField(data, "message") ??
    getStringField(data, "error_description") ??
    getStringField(data, "error");

  if (message) return message;
  if (title && detail) return `${title} — ${detail}`;
  if (detail) return detail;
  if (title) return title;

  return prefix;
}

export class ApiError<T = unknown> extends Error {
  readonly name = "ApiError";
  readonly status: number;
  readonly statusText: string;
  readonly data: T | null;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;

  constructor(
    response: Response,
    data: T | null,
    requestInfo: { method: string; url: string },
  ) {
    super(buildErrorMessage(response, data));
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.data = data;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
  }
}

export class ResponseParseError extends Error {
  readonly name = "ResponseParseError";
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;
  readonly rawBody: string;
  readonly cause: unknown;

  constructor(
    response: Response,
    rawBody: string,
    cause: unknown,
    requestInfo: { method: string; url: string },
  ) {
    super(
      `Failed to parse response from ${requestInfo.method} ${response.url || requestInfo.url} ` +
        `(${response.status} ${response.statusText}) as JSON`,
    );
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
    this.rawBody = rawBody;
    this.cause = cause;
  }
}

async function parseJsonBody(
  response: Response,
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  const raw = await response.text();
  const normalized = stripBom(raw);

  if (normalized.trim() === "") {
    return null;
  }

  try {
    return JSON.parse(normalized);
  } catch (cause) {
    throw new ResponseParseError(response, raw, cause, requestInfo);
  }
}

async function parseErrorBody(response: Response, method: string): Promise<unknown> {
  if (hasNoBody(response, method)) {
    return null;
  }

  const mediaType = getMediaType(response.headers);

  // Fall back to text when blob() is unavailable (e.g. some React Native builds).
  if (mediaType && !isJsonMediaType(mediaType) && !isTextMediaType(mediaType)) {
    return typeof response.blob === "function" ? response.blob() : response.text();
  }

  const raw = await response.text();
  const normalized = stripBom(raw);
  const trimmed = normalized.trim();

  if (trimmed === "") {
    return null;
  }

  if (isJsonMediaType(mediaType) || looksLikeJson(normalized)) {
    try {
      return JSON.parse(normalized);
    } catch {
      return raw;
    }
  }

  return raw;
}

function inferResponseType(response: Response): "json" | "text" | "blob" {
  const mediaType = getMediaType(response.headers);

  if (isJsonMediaType(mediaType)) return "json";
  if (isTextMediaType(mediaType) || mediaType == null) return "text";
  return "blob";
}

async function parseSuccessBody(
  response: Response,
  responseType: "json" | "text" | "blob" | "auto",
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  if (hasNoBody(response, requestInfo.method)) {
    return null;
  }

  const effectiveType =
    responseType === "auto" ? inferResponseType(response) : responseType;

  switch (effectiveType) {
    case "json":
      return parseJsonBody(response, requestInfo);

    case "text": {
      const text = await response.text();
      return text === "" ? null : text;
    }

    case "blob":
      if (typeof response.blob !== "function") {
        throw new TypeError(
          "Blob responses are not supported in this runtime. " +
            "Use responseType \"json\" or \"text\" instead.",
        );
      }
      return response.blob();
  }
}

function normalizeProduct(p: any): any {
  if (!p || typeof p !== "object") return p;
  const originalPrice = Number(p.price ?? 0);
  const discountPrice = p.discountPrice != null ? Number(p.discountPrice) : null;
  const sellingPrice = p.sellingPrice != null ? Number(p.sellingPrice) : null;
  const effectivePrice = sellingPrice ?? (discountPrice && discountPrice < originalPrice ? discountPrice : originalPrice);
  const compareAt = discountPrice && discountPrice < originalPrice ? originalPrice : (p.compareAtPrice != null ? Number(p.compareAtPrice) : null);

  return {
    ...p,
    id: String(p.id ?? p.slug ?? ""),
    _numericId: typeof p.id === "number" ? p.id : Number(p.id),
    name: p.name || "Untitled product",
    brand: p.brandName || p.brand || "MyBeautify",
    brandName: p.brandName || p.brand || "MyBeautify",
    category: p.categoryName || p.category || "Skincare",
    categoryName: p.categoryName || p.category || "Skincare",
    description: p.description || p.shortDescription || "",
    shortDescription: p.shortDescription || "",
    price: effectivePrice,
    compareAtPrice: compareAt,
    rating: typeof p.averageRating === "number" && p.averageRating > 0 ? p.averageRating : (p.rating || 4.8),
    reviews: typeof p.reviews === "number" ? p.reviews : 28,
    image: p.imageUrl || p.image || "",
    imageUrl: p.imageUrl || p.image || "",
    badge: p.badge || (p.featured ? "Featured" : null),
    stock: p.stockQuantity ?? p.stock ?? 15,
    stockQuantity: p.stockQuantity ?? p.stock ?? 15,
    ingredients: Array.isArray(p.ingredients)
      ? p.ingredients
      : typeof p.ingredients === "string"
        ? p.ingredients.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],
    benefits: Array.isArray(p.benefits)
      ? p.benefits
      : typeof p.benefits === "string"
        ? p.benefits.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],
    sizes: Array.isArray(p.sizes)
      ? p.sizes
      : typeof p.size === "string" && p.size
        ? [p.size]
        : ["Standard"],
  };
}

function normalizeCategory(c: any): any {
  if (!c || typeof c !== "object") return c;
  return {
    ...c,
    id: String(c.id ?? ""),
    _numericId: typeof c.id === "number" ? c.id : Number(c.id),
    name: c.name,
    description: c.description || "",
    image: c.imageUrl || c.image || "",
    imageUrl: c.imageUrl || c.image || "",
    productCount: c.productCount ?? 12,
  };
}

function normalizeBrand(b: any): any {
  if (!b || typeof b !== "object") return b;
  return {
    ...b,
    id: String(b.id ?? ""),
    _numericId: typeof b.id === "number" ? b.id : Number(b.id),
    name: b.name,
    description: b.description || "",
    logo: b.logoUrl || b.logo || "",
    logoUrl: b.logoUrl || b.logo || "",
    productCount: b.productCount ?? 8,
  };
}

function extractPathname(url: string): string {
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const u = new URL(url);
      return u.pathname;
    }
  } catch {}
  return url.split("?")[0] || url;
}

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  options: CustomFetchOptions = {},
): Promise<T> {
  input = applyBaseUrl(input);
  const { responseType = "auto", headers: headersInit, ...init } = options;

  let method = resolveMethod(input, init.method);
  let requestUrl = resolveUrl(input);
  let requestBody = init.body;
  let path = extractPathname(requestUrl);

  // 1. Adapter: Translate URL and request body for Spring Boot endpoints
  if (path.startsWith("/api/admin/products")) {
    path = path.replace("/api/admin/products", "/api/products");
    requestUrl = requestUrl.replace("/api/admin/products", "/api/products");
  }

  if (path === "/api/wishlist" && method === "POST" && typeof requestBody === "string") {
    try {
      const parsed = JSON.parse(requestBody);
      if (parsed.productId) {
        path = `/api/wishlist/${encodeURIComponent(parsed.productId)}`;
        requestUrl = requestUrl.replace(/\/api\/wishlist(\?.*)?$/, `${path}$1`);
        if (!requestUrl.includes(path)) {
          requestUrl = resolveUrl(applyBaseUrl(path));
        }
        requestBody = undefined;
      }
    } catch {}
  }

  if (path === "/api/cart" && method === "DELETE") {
    path = "/api/cart/clear";
    requestUrl = requestUrl.replace(/\/api\/cart(\?.*)?$/, `${path}$1`);
    if (!requestUrl.includes(path)) {
      requestUrl = resolveUrl(applyBaseUrl(path));
    }
  }

  if (/^\/api\/cart\/items\/[^/?#]+$/.test(path) && method === "PATCH" && typeof requestBody === "string") {
    try {
      const parsed = JSON.parse(requestBody);
      if (parsed.quantity !== undefined) {
        method = "PUT";
        const sep = requestUrl.includes("?") ? "&" : "?";
        requestUrl = `${requestUrl}${sep}quantity=${encodeURIComponent(parsed.quantity)}`;
        requestBody = undefined;
      }
    } catch {}
  }

  if (path === "/api/cart/items" && method === "POST" && typeof requestBody === "string") {
    try {
      const parsed = JSON.parse(requestBody);
      if (parsed.productId) {
        const numId = Number(parsed.productId);
        if (!Number.isNaN(numId)) {
          parsed.productId = numId;
        }
        parsed.quantity = Number(parsed.quantity || 1);
        requestBody = JSON.stringify(parsed);
      }
    } catch {}
  }

  if ((path === "/api/auth/register" || path.endsWith("/auth/register")) && method === "POST" && typeof requestBody === "string") {
    try {
      const parsed = JSON.parse(requestBody);
      if (parsed.name && !parsed.fullName) {
        parsed.fullName = parsed.name;
      }
      if (parsed.fullName && (!parsed.firstName || !parsed.lastName)) {
        const parts = parsed.fullName.trim().split(/\s+/);
        parsed.firstName = parsed.firstName || parts[0] || "User";
        parsed.lastName = parsed.lastName || (parts.length > 1 ? parts.slice(1).join(" ") : parts[0] || "User");
      }
      requestBody = JSON.stringify(parsed);
    } catch {}
  }

  if (path === "/api/coupons/validate" && method === "POST" && typeof requestBody === "string") {
    path = "/api/coupons/apply";
    requestUrl = requestUrl.replace("/api/coupons/validate", "/api/coupons/apply");
    try {
      const parsed = JSON.parse(requestBody);
      if (!parsed.orderAmount) {
        parsed.orderAmount = 50.0;
      }
      requestBody = JSON.stringify(parsed);
    } catch {}
  }

  if (requestBody != null && (method === "GET" || method === "HEAD")) {
    throw new TypeError(`customFetch: ${method} requests cannot have a body.`);
  }

  const headers = mergeHeaders(isRequest(input) ? input.headers : undefined, headersInit);

  if (
    typeof requestBody === "string" &&
    !headers.has("content-type") &&
    looksLikeJson(requestBody)
  ) {
    headers.set("content-type", "application/json");
  }

  if (responseType === "json" && !headers.has("accept")) {
    headers.set("accept", DEFAULT_JSON_ACCEPT);
  }

  // Attach bearer token when an auth getter is configured and no
  // Authorization header has been explicitly provided.
  if (!headers.has("authorization")) {
    let token: string | null = null;
    if (_authTokenGetter) {
      token = await _authTokenGetter();
    }
    if (!token && typeof window !== "undefined") {
      try {
        token = sessionStorage.getItem("mybeautify-token") || localStorage.getItem("mybeautify-token");
      } catch {}
    }
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  const requestInfo = { method, url: requestUrl };

  let response: Response;
  try {
    response = await fetch(requestUrl, { ...init, method, headers, body: requestBody });
  } catch (netErr: any) {
    if (typeof window !== "undefined" && typeof (window as any).__malkaz_record_diagnostic === "function") {
      try {
        (window as any).__malkaz_record_diagnostic({
          status: null,
          statusText: "Network Failure",
          method,
          endpoint: requestUrl,
          errorMessage: netErr?.message || "Network request failed",
          isNetworkError: true,
        });
      } catch {}
    }
    throw netErr;
  }

  if (!response.ok) {
    const errorData = await parseErrorBody(response, method);
    if (typeof window !== "undefined" && typeof (window as any).__malkaz_record_diagnostic === "function") {
      try {
        (window as any).__malkaz_record_diagnostic({
          status: response.status,
          statusText: response.statusText,
          method,
          endpoint: requestUrl,
          errorMessage: buildErrorMessage(response, errorData),
          isNetworkError: false,
        });
      } catch {}
    }
    throw new ApiError(response, errorData, requestInfo);
  }

  const parsedBody = await parseSuccessBody(response, responseType, requestInfo);

  // 2. Adapter: Unpack and normalize Spring Boot { success: boolean, message?: string, data?: any }
  let data: any = parsedBody;
  if (parsedBody && typeof parsedBody === "object" && "data" in parsedBody && "success" in parsedBody) {
    data = (parsedBody as { data: any }).data;
  }

  if (path.startsWith("/api/products")) {
    if (data && typeof data === "object" && Array.isArray(data.content)) {
      const normalizedList = data.content.map(normalizeProduct);
      const arr: any = [...normalizedList];
      arr.content = normalizedList;
      arr.items = normalizedList;
      arr.totalPages = data.totalPages;
      arr.totalElements = data.totalElements;
      return arr as T;
    }
    if (Array.isArray(data)) {
      const normalizedList = data.map(normalizeProduct);
      const arr: any = [...normalizedList];
      arr.content = normalizedList;
      arr.items = normalizedList;
      return arr as T;
    }
    if (data && typeof data === "object" && "id" in data) {
      return normalizeProduct(data) as T;
    }
  }

  if (path.startsWith("/api/categories")) {
    if (Array.isArray(data)) {
      const list = data.map(normalizeCategory);
      const arr: any = [...list];
      arr.items = list;
      return arr as T;
    }
    if (data && typeof data === "object" && Array.isArray(data.content)) {
      const list = data.content.map(normalizeCategory);
      const arr: any = [...list];
      arr.content = list;
      arr.items = list;
      return arr as T;
    }
  }

  if (path.startsWith("/api/brands")) {
    if (Array.isArray(data)) {
      const list = data.map(normalizeBrand);
      const arr: any = [...list];
      arr.items = list;
      return arr as T;
    }
    if (data && typeof data === "object" && Array.isArray(data.content)) {
      const list = data.content.map(normalizeBrand);
      const arr: any = [...list];
      arr.content = list;
      arr.items = list;
      return arr as T;
    }
  }

  if (path.startsWith("/api/wishlist")) {
    if (Array.isArray(data)) {
      return data.map(normalizeProduct) as T;
    }
  }

  if (path.startsWith("/api/cart")) {
    if (data && typeof data === "object") {
      const rawItems = Array.isArray(data.items) ? data.items : [];
      const items = rawItems.map((ci: any) => ({
        id: String(ci.id),
        productId: String(ci.productId),
        quantity: ci.quantity,
        lineTotal: Number(ci.subtotal ?? (ci.price * ci.quantity)),
        product: normalizeProduct({
          id: ci.productId,
          name: ci.productName,
          price: ci.price,
          imageUrl: ci.imageUrl,
          stockQuantity: ci.availableStock,
        }),
      }));
      const subtotal = Number(data.subtotal ?? items.reduce((s: number, i: any) => s + i.lineTotal, 0));
      const shipping = subtotal >= 60 || subtotal === 0 ? 0 : 6;
      const tax = Number((subtotal * 0.08).toFixed(2));
      const total = Number((subtotal + shipping + tax).toFixed(2));
      return {
        id: String(data.id ?? "1"),
        items,
        subtotal,
        shipping,
        tax,
        couponDiscount: 0,
        total,
      } as T;
    }
  }

  if (path.includes("/auth/login") || path.includes("/auth/register")) {
    if (data && typeof data === "object" && data.accessToken) {
      const user = data.user || {};
      const fullName = user.fullName || user.name || ((user.firstName || "") + " " + (user.lastName || "")).trim() || "User";
      return {
        token: data.accessToken,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: {
          id: String(user.id ?? ""),
          name: fullName,
          fullName: fullName,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      } as T;
    }
  }

  if (path.includes("/auth/me")) {
    if (data && typeof data === "object") {
      const role = data.role;
      const fullName = data.fullName || data.name || ((data.firstName || "") + " " + (data.lastName || "")).trim() || "User";
      return {
        id: data.id,
        name: fullName,
        fullName: fullName,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: role,
        roles: role ? [role] : [],
        authorities: role ? [{ authority: `ROLE_${role}` }, { authority: role }] : [],
        user: {
          id: data.id,
          name: fullName,
          fullName: fullName,
          email: data.email,
          role: role,
          roles: role ? [role] : [],
        },
      } as T;
    }
  }

  if (path.startsWith("/api/coupons")) {
    if (data && typeof data === "object") {
      return {
        valid: Boolean(data.active ?? true),
        code: data.code,
        discount: Number(data.discountValue ?? 15),
        message: (parsedBody as any)?.message || "Coupon applied.",
      } as T;
    }
  }

  return (data !== undefined ? data : parsedBody) as T;
}
