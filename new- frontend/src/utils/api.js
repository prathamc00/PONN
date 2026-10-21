const envUrl = (import.meta.env.VITE_API_URL || '').trim();
const API_BASE = import.meta.env.DEV
  ? (envUrl && !envUrl.includes('crismatech') ? envUrl : 'http://localhost:5000/api')
  : (envUrl || '/api');

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
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

export function setStoredUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser will set multipart boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const fetchOptions = {
    cache: 'no-store',
    ...options,
    headers,
  };

  const res = await fetch(`${API_BASE}${path}`, fetchOptions);

  if (
    res.status === 401 &&
    !path.includes('/login') &&
    !path.includes('/register') &&
    !path.includes('/forgot-password') &&
    !path.includes('/verify') &&
    !path.includes('/otp') &&
    !path.includes('/chat')
  ) {
    clearAuth();
    const base = (import.meta.env.BASE_URL || '').replace(/\/$/, '');
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

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function resolveUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.replace(/^\/+/, '');
  const apiUrl = API_BASE.replace(/\/+$/, '');
  const baseNoApi = apiUrl.replace(/\/api$/, '');
  if (baseNoApi.startsWith('http')) {
    return `${baseNoApi}/${cleanPath}`;
  }
  return `${window.location.origin}/${cleanPath}`;
}
