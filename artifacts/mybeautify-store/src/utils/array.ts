/**
 * Safely extracts an Array from various API response shapes
 * (Plain Array, Spring Boot Pageable { content: [] }, or wrapped { data: [] / { data: { content: [] } } })
 */
export function toArray<T = unknown>(res: any): T[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  return [];
}
