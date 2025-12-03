// Client-side auth utilities

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
}

export async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      removeToken();
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    removeToken();
    return null;
  }
}

