// Client-side auth utility (use in frontend components)
export const getAuthData = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const authData = localStorage.getItem('authData');
    return authData ? JSON.parse(authData) : null;
  } catch (error) {
    console.error('Error getting auth data:', error);
    return null;
  }
};

export const getToken = () => {
  const authData = getAuthData();
  return authData?.token || null;
};

export const getUserRole = () => {
  const authData = getAuthData();
  return authData?.role || null;
};

export const getUserEmail = () => {
  const authData = getAuthData();
  return authData?.email || null;
};

export const getUserId = () => {
  const authData = getAuthData();
  return authData?.userId || null;
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const logout = () => {
  localStorage.removeItem('authData');
  window.location.href = '/auth/login';
};


export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const authData = localStorage.getItem('authData');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed.token || parsed.accessToken || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};


export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const isAdmin = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const authData = localStorage.getItem('authData');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed.role === 'admin' || parsed.user?.role === 'admin';
    }
    return false;
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
};