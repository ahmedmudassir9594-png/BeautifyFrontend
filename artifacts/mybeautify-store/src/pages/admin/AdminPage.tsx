import { type FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { customFetch } from '@workspace/api-client-react/custom-fetch';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';

type AdminProduct = {
  id: number;
  name: string;
  sku: string;
  price: number;
  discountPrice?: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  brandId: number;
  categoryId: number;
  description: string;
  shortDescription?: string;
  imageUrl?: string;
  active: boolean;
  featured: boolean;
  ingredients?: string[];
  benefits?: string[];
  howToUse?: string;
  skinType?: string;
  shade?: string;
  size?: string;
  expiryDate?: string;
};

type AdminCategory = {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
};

type AdminBrand = {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  active: boolean;
};

type AdminUser = {
  id?: number;
  role?: unknown;
  roles?: unknown;
  authorities?: unknown;
  user?: AdminUser;
};

type PageResult<T> = { items: T[]; totalPages?: number };
type InputValue = string | boolean;
type FormValues = Record<string, InputValue>;
type FieldSpec = {
  key: string;
  label: string;
  type: 'text' | 'url' | 'number' | 'textarea' | 'checkbox' | 'select' | 'list' | 'datetime-local';
  required?: boolean;
  defaultValue?: InputValue;
  min?: number;
  step?: string;
  options?: Array<{ value: string; label: string }>;
};
type Column<T> = { label: string; render: (item: T) => string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseList<T>(value: unknown): PageResult<T> {
  if (Array.isArray(value)) return { items: value as T[] };
  if (!isRecord(value)) throw new Error('The server returned an unexpected list response.');
  if (Array.isArray(value.content)) {
    return { items: value.content as T[], totalPages: typeof value.totalPages === 'number' ? value.totalPages : undefined };
  }
  if (Array.isArray(value.data)) return { items: value.data as T[] };
  if (isRecord(value.data)) return parseList<T>(value.data);
  throw new Error('The server returned an unexpected list response.');
}

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The request failed. Please try again.';
}

function hasAdminRole(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.user && hasAdminRole(value.user)) return true;
  const rawRoles = [value.role, value.roles, value.authorities];
  return rawRoles.some((rawRole) => {
    const roles = Array.isArray(rawRole) ? rawRole : [rawRole];
    return roles.some((role) => {
      const name = typeof role === 'string'
        ? role
        : isRecord(role) && typeof role.authority === 'string'
          ? role.authority
          : '';
      return name === 'ADMIN' || name === 'ROLE_ADMIN';
    });
  });
}

function inputValue(item: unknown, field: FieldSpec): InputValue {
  if (!isRecord(item)) return field.type === 'checkbox' ? false : '';
  const value = item[field.key];
  if (field.type === 'checkbox') return value === true;
  if (field.type === 'list') return Array.isArray(value) ? value.join(', ') : '';
  if (field.type === 'datetime-local' && typeof value === 'string') return value.slice(0, 16);
  return value == null ? '' : String(value);
}

function makePayload(values: FormValues, fields: FieldSpec[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((field) => {
    const value = values[field.key];
    if (field.type === 'checkbox') return [field.key, value === true];
    if (field.type === 'number') {
      if (value === '') return [field.key, null];
      const number = Number(value);
      if (!Number.isFinite(number)) throw new Error(`${field.label} must be a valid number.`);
      return [field.key, number];
    }
    if (field.key.endsWith('Id') && value !== '' && value != null) {
      const number = Number(value);
      if (Number.isFinite(number)) return [field.key, number];
    }
    if (field.type === 'list') {
      return [field.key, typeof value === 'string' ? value : Array.isArray(value) ? value.join(', ') : ''];
    }
    return [field.key, value === '' ? null : value];
  }));
}

function CrudPanel<T extends { id: number }>({
  title,
  endpoint,
  queryKey,
  items,
  fields,
  columns,
}: {
  title: string;
  endpoint: string;
  queryKey: readonly unknown[];
  items: T[];
  fields: FieldSpec[];
  columns: Column<T>[];
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<T | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: async (request: { method: 'POST' | 'PUT' | 'DELETE'; id?: number; payload?: Record<string, unknown> }) => {
      const url = request.id === undefined ? endpoint : `${endpoint}/${request.id}`;
      return customFetch<unknown>(url, {
        method: request.method,
        ...(request.payload ? { body: JSON.stringify(request.payload) } : {}),
      });
    },
    onSuccess: async (_, request) => {
      await queryClient.invalidateQueries({ queryKey });
      setEditing(null);
      setValues({});
      setError('');
      setMessage(request.method === 'DELETE' ? 'Record deleted.' : request.method === 'POST' ? 'Record added.' : 'Changes saved.');
    },
    onError: (mutationError) => {
      setMessage('');
      setError(getMessage(mutationError));
    },
  });

  const beginCreate = () => {
    setEditing(null);
    setValues(Object.fromEntries(fields.map((field) => [field.key, field.defaultValue ?? (field.type === 'checkbox' ? false : '')])));
    setMessage('');
    setError('');
  };
  const beginEdit = (item: T) => {
    setEditing(item);
    setValues(Object.fromEntries(fields.map((field) => [field.key, inputValue(item, field)])));
    setMessage('');
    setError('');
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const payload = makePayload(values, fields);
      mutation.mutate({ method: editing ? 'PUT' : 'POST', id: editing?.id, payload });
    } catch (submitError) {
      setError(getMessage(submitError));
    }
  };
  const remove = (item: T) => {
    if (window.confirm(`Delete this ${title.toLowerCase()} record? This cannot be undone.`)) {
      setMessage('');
      setError('');
      mutation.mutate({ method: 'DELETE', id: item.id });
    }
  };

  return <div className="admin-management">
    <section className="admin-card">
      <div className="admin-card-heading">
        <div><div className="eyebrow">Management</div><h2>{editing ? `Edit ${title}` : `Add ${title}`}</h2></div>
        <button type="button" className="button secondary small" onClick={beginCreate}><Plus size={15} /> Add new</button>
      </div>
      <form className="admin-form" onSubmit={submit}>
        {fields.map((field) => <label className={`form-field ${field.type === 'checkbox' ? 'admin-checkbox-field' : ''}`} key={field.key}>
          {field.type === 'checkbox'
            ? <><input type="checkbox" checked={values[field.key] === true} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.checked }))} />{field.label}</>
            : <><span>{field.label}</span>
              {field.type === 'textarea'
                ? <textarea className="input" rows={3} required={field.required} value={String(values[field.key] ?? '')} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} />
                : field.type === 'select'
                  ? <select className="select" required={field.required} value={String(values[field.key] ?? '')} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}>
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  : <input className="input" type={field.type === 'list' ? 'text' : field.type} min={field.min} step={field.step} required={field.required} value={String(values[field.key] ?? '')} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} />}
            </>}
        </label>)}
        {error && <p className="form-message" role="alert">{error}</p>}
        {message && <p className="admin-success" role="status">{message}</p>}
        <div className="admin-form-actions">
          <button className="button" type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : editing ? 'Save changes' : `Add ${title}`}</button>
          {editing && <button className="button secondary" type="button" onClick={beginCreate}>Cancel edit</button>}
        </div>
      </form>
    </section>
    <section className="admin-card">
      <div className="admin-card-heading"><div><div className="eyebrow">Current records</div><h2>{title} ({items.length})</h2></div></div>
      <div className="admin-table-wrap"><table className="admin-table">
        <thead><tr>{columns.map((column) => <th key={column.label}>{column.label}</th>)}<th>Actions</th></tr></thead>
        <tbody>{items.map((item) => <tr key={item.id}>
          {columns.map((column) => <td key={column.label}>{column.render(item)}</td>)}
          <td className="admin-actions">
            <button type="button" className="icon-button" onClick={() => beginEdit(item)} aria-label={`Edit ${title}`} title="Edit"><Pencil size={15} /></button>
            <button type="button" className="icon-button admin-delete" onClick={() => remove(item)} aria-label={`Delete ${title}`} title="Delete" disabled={mutation.isPending}><Trash2 size={15} /></button>
          </td>
        </tr>)}
        {!items.length && <tr><td colSpan={columns.length + 1} className="admin-empty">No records found.</td></tr>}
        </tbody>
      </table></div>
    </section>
  </div>;
}

function AdminConsole() {
  const [section, setSection] = useState<'products' | 'categories' | 'brands'>('products');
  const [page, setPage] = useState(0);
  const productsQuery = useQuery({
    queryKey: ['admin-products', page],
    queryFn: async () => parseList<AdminProduct>(await customFetch<unknown>(`/api/products?page=${page}&size=50&sort=createdAt,desc`)),
    enabled: section === 'products',
  });
  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => parseList<AdminCategory>(await customFetch<unknown>('/api/categories')),
    enabled: section === 'products' || section === 'categories',
  });
  const brandsQuery = useQuery({
    queryKey: ['admin-brands'],
    queryFn: async () => parseList<AdminBrand>(await customFetch<unknown>('/api/brands')),
    enabled: section === 'products' || section === 'brands',
  });
  const productFields = useMemo<FieldSpec[]>(() => [
    { key: 'name', label: 'Product name', type: 'text', required: true },
    { key: 'sku', label: 'SKU', type: 'text', required: true },
    { key: 'price', label: 'Price', type: 'number', required: true, min: 0, step: '0.01' },
    { key: 'discountPrice', label: 'Discount price', type: 'number', min: 0, step: '0.01' },
    { key: 'stockQuantity', label: 'Stock quantity', type: 'number', required: true, min: 0, step: '1' },
    { key: 'lowStockThreshold', label: 'Low stock threshold', type: 'number', required: true, min: 0, step: '1' },
    { key: 'brandId', label: 'Brand', type: 'select', required: true, options: (brandsQuery.data?.items ?? []).map((brand) => ({ value: String(brand.id), label: brand.name })) },
    { key: 'categoryId', label: 'Category', type: 'select', required: true, options: (categoriesQuery.data?.items ?? []).map((category) => ({ value: String(category.id), label: category.name })) },
    { key: 'shortDescription', label: 'Short description', type: 'textarea' },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'imageUrl', label: 'Image URL', type: 'url' },
    { key: 'ingredients', label: 'Ingredients (comma-separated)', type: 'list' },
    { key: 'benefits', label: 'Benefits (comma-separated)', type: 'list' },
    { key: 'howToUse', label: 'How to use', type: 'textarea' },
    { key: 'skinType', label: 'Skin type', type: 'text' },
    { key: 'shade', label: 'Shade', type: 'text' },
    { key: 'size', label: 'Size', type: 'text' },
    { key: 'expiryDate', label: 'Expiry date', type: 'datetime-local' },
    { key: 'featured', label: 'Featured', type: 'checkbox' },
    { key: 'active', label: 'Active', type: 'checkbox', defaultValue: true },
  ], [brandsQuery.data?.items, categoriesQuery.data?.items]);

  return <main className="page admin-page">
    <div className="catalog-head">
      <div><div className="eyebrow">Authorized access</div><h1>Admin<br />dashboard.</h1></div>
      <p className="section-copy">Manage products, categories, and brands in your store.</p>
    </div>
    <nav className="admin-tabs" aria-label="Admin management sections">
      {(['products', 'categories', 'brands'] as const).map((item) => <button key={item} type="button" className={`admin-tab ${section === item ? 'active' : ''}`} onClick={() => { setSection(item); setPage(0); }}>
        {item[0].toUpperCase() + item.slice(1)}
      </button>)}
    </nav>
    {section === 'products' && (productsQuery.isLoading || categoriesQuery.isLoading || brandsQuery.isLoading)
      ? <div className="skeleton line" />
      : section === 'products' && (productsQuery.isError || categoriesQuery.isError || brandsQuery.isError)
        ? <div className="error-state" role="alert"><h3>We could not load the admin data.</h3><p>{getMessage(productsQuery.error ?? categoriesQuery.error ?? brandsQuery.error)}</p><button className="button secondary" onClick={() => { void productsQuery.refetch(); void categoriesQuery.refetch(); void brandsQuery.refetch(); }}>Try again</button></div>
        : section === 'products' && productsQuery.data && categoriesQuery.data && brandsQuery.data
          ? <>
            <CrudPanel title="Product" endpoint="/api/admin/products" queryKey={['admin-products']} items={productsQuery.data.items} fields={productFields} columns={[
              { label: 'Name', render: (item) => item.name },
              { label: 'SKU', render: (item) => item.sku },
              { label: 'Price', render: (item) => `$${Number(item.discountPrice ?? item.price).toFixed(2)}` },
              { label: 'Stock', render: (item) => String(item.stockQuantity) },
              { label: 'Status', render: (item) => item.active ? 'Active' : 'Inactive' },
            ]} />
            {productsQuery.data.totalPages !== undefined && productsQuery.data.totalPages > 1 && <div className="admin-pagination">
              <button className="button secondary small" disabled={page <= 0} onClick={() => setPage((current) => current - 1)}>Previous</button>
              <span>Page {page + 1} of {productsQuery.data.totalPages}</span>
              <button className="button secondary small" disabled={page + 1 >= productsQuery.data.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
            </div>}
          </>
          : section === 'categories' && categoriesQuery.isLoading
            ? <div className="skeleton line" />
            : section === 'categories' && categoriesQuery.isError
              ? <div className="error-state" role="alert"><h3>Categories could not be loaded.</h3><p>{getMessage(categoriesQuery.error)}</p><button className="button secondary" onClick={() => { void categoriesQuery.refetch(); }}>Try again</button></div>
              : section === 'categories' && categoriesQuery.data
                ? <CrudPanel title="Category" endpoint="/api/admin/categories" queryKey={['admin-categories']} items={categoriesQuery.data.items} fields={[
                  { key: 'name', label: 'Category name', type: 'text', required: true },
                  { key: 'description', label: 'Description', type: 'textarea' },
                  { key: 'imageUrl', label: 'Image URL', type: 'url' },
                  { key: 'active', label: 'Active', type: 'checkbox', defaultValue: true },
                ]} columns={[
                  { label: 'Name', render: (item) => item.name },
                  { label: 'Description', render: (item) => item.description ?? '—' },
                  { label: 'Status', render: (item) => item.active ? 'Active' : 'Inactive' },
                ]} />
                : section === 'brands' && brandsQuery.isLoading
                  ? <div className="skeleton line" />
                  : section === 'brands' && brandsQuery.isError
                    ? <div className="error-state" role="alert"><h3>Brands could not be loaded.</h3><p>{getMessage(brandsQuery.error)}</p><button className="button secondary" onClick={() => { void brandsQuery.refetch(); }}>Try again</button></div>
                    : section === 'brands' && brandsQuery.data
                      ? <CrudPanel title="Brand" endpoint="/api/admin/brands" queryKey={['admin-brands']} items={brandsQuery.data.items} fields={[
                        { key: 'name', label: 'Brand name', type: 'text', required: true },
                        { key: 'description', label: 'Description', type: 'textarea' },
                        { key: 'logoUrl', label: 'Logo URL', type: 'url' },
                        { key: 'active', label: 'Active', type: 'checkbox', defaultValue: true },
                      ]} columns={[
                        { label: 'Name', render: (item) => item.name },
                        { label: 'Description', render: (item) => item.description ?? '—' },
                        { label: 'Status', render: (item) => item.active ? 'Active' : 'Inactive' },
                      ]} />
                      : null}
    <p className="admin-back"><Link href="/account">Back to account</Link></p>
  </main>;
}

export default function AdminPage() {
  const session = useQuery({
    queryKey: ['admin-session'],
    queryFn: () => customFetch<AdminUser>('/api/auth/me'),
    retry: false,
  });

  if (session.isLoading) {
    return <main className="page admin-page"><div className="skeleton line" /></main>;
  }
  if (session.isError) {
    return <main className="page admin-page"><div className="error-state" role="alert"><h3>Sign in required.</h3><p>{getMessage(session.error)}</p><Link href="/sign-in" className="button">Sign in</Link></div></main>;
  }
  if (!hasAdminRole(session.data)) {
    return <main className="page admin-page"><div className="error-state" role="alert"><h3>Admin access required.</h3><p>This account is not authorized to manage the store.</p><Link href="/account" className="button secondary">Back to account</Link></div></main>;
  }

  return <ErrorBoundary resetKey="admin"><AdminConsole /></ErrorBoundary>;
}
