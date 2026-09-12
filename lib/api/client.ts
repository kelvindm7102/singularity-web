
export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Derive the API base URL from the current page's hostname so the app works
 * on any IP or domain without reconfiguration.
 *   - localhost:3000        → http://localhost:8080
 *   - 192.168.1.5:3000     → http://192.168.1.5:8080
 *   - singularity.loc:3000  → http://singularity.loc:8080
 *
 * Called on every request so it always reflects the actual browser URL even
 * after hydration. An explicit NEXT_PUBLIC_SINGULARITY_API_URL env var
 * still takes priority.
 */
export function resolveApiBase(): string {
  // 1. In browser, use the current origin so requests go through Next.js rewrites proxy
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // 2. Only use NEXT_PUBLIC if we're not in the browser (e.g. server-side builds)
  if (process.env.NEXT_PUBLIC_SINGULARITY_API_URL) {
    return process.env.NEXT_PUBLIC_SINGULARITY_API_URL;
  }
  // 3. Ultimate fallback for server-side
  return 'http://localhost:8080';
}

/**
 * Convenience re-export for code that imports API_BASE_URL statically.
 * This calls resolveApiBase() at import-evaluation time, which is fine for
 * pure client modules (window is available). For the runtime per-request
 * path, fetchApi() calls resolveApiBase() directly.
 */

export function getCoverUrl(songId: string | undefined, hasCover: boolean | undefined): string {
  if (!songId || !hasCover) return '/default-cover.jpg';
  return `${resolveApiBase()}/api/assets/cover/${songId}`;
}

export async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Always resolve per-request so the correct hostname is used regardless of
  // when the module was first evaluated (avoids SSR→client mismatch).
  const url = `${resolveApiBase()}${path}`;

  const headers = new Headers(options.headers || {});

  // Only set Content-Type to application/json if it's not a FormData
  if (!(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    const errorText = await response.text();
    try {
      errorData = errorText ? JSON.parse(errorText) : {};
    } catch {
      errorData = { error: errorText };
    }

    throw new ApiError(
      response.status,
      errorData?.error || errorData?.message || response.statusText || 'An API error occurred',
      errorData
    );
  }

  // Handle empty responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
