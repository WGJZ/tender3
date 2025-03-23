const API_BASE_URL = 'http://localhost:8000/api';

export const handleApiError = (error: any) => {
  if (error.response?.status === 401) {
    // Handle unauthorized access
    localStorage.removeItem('token');
    window.location.href = '/login';
    return 'Session expired. Please login again.';
  }
  return error.message || 'An unexpected error occurred';
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const createTender = async (tenderData: any) => {
  return apiRequest('/tenders/', {
    method: 'POST',
    body: JSON.stringify(tenderData),
  });
};

export const fetchTenders = async () => {
  return apiRequest('/tenders/');
};

export const login = async (credentials: { username: string; password: string }) => {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Login failed');
  }

  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data;
};

export interface UserRole {
  id: number;
  username: string;
  role: 'CITY' | 'COMPANY' | 'CITIZEN';
}

export const registerCompany = async (userData: {
  username: string;
  password: string;
  company_name: string;
  contact_email: string;
}) => {
  return apiRequest('/auth/register/', {
    method: 'POST',
    body: JSON.stringify({ ...userData, role: 'COMPANY' }),
  });
};

export const getCurrentUser = async (): Promise<UserRole> => {
  return apiRequest('/auth/me/');
};

export const deleteTender = async (tenderId: string) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/tenders/${tenderId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete tender');
    }

    return true;
  } catch (error) {
    console.error('Delete tender error:', error);
    throw error;
  }
};

export const getTenderDetails = async (tenderId: string) => {
  return apiRequest(`/tenders/${tenderId}/`);
};

export const checkUserRole = async (): Promise<string> => {
  try {
    const user = await getCurrentUser();
    return user.role;
  } catch (error) {
    console.error('Error checking user role:', error);
    return '';
  }
}; 