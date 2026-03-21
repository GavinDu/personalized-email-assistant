const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export async function customFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const fullUrl = `${BASE}/pyapi${url}`;
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as Record<string, string>;
    throw new Error(err["detail"] ?? `API Error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
