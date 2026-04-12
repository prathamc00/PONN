const API_BASE = (import.meta as any).env.VITE_API_URL || '/api';

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function setStoredUser(user: any) {
  localStorage.setItem('user', JSON.stringify(user));
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser will set multipart boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  // Prevent caching for API requests
  const fetchOptions = {
    cache: 'no-store' as RequestCache,
    ...options,
    headers
  };

  const res = await fetch(`${API_BASE}${path}`, fetchOptions);

  if (res.status === 401 && !path.includes('/login') && !path.includes('/register') && !path.includes('/forgot-password')) {
    clearAuth();
    const base = (import.meta as any).env.BASE_URL?.replace(/\/$/, '') || '';
    window.location.href = `${base}/login`;
    throw new Error('Session expired. Please login again.');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: `Request failed: ${res.status}` }));
    throw new Error(data.message || `Request failed: ${res.status}`);
  }

  // Handle blob responses (e.g. CSV export)
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/csv') || contentType.includes('application/octet-stream')) {
    return res.blob();
  }

  return res.json();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
