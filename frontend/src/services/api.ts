import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login/', credentials),
  register: (userData: any) => api.post('/auth/register/', userData),
};

export const tenderAPI = {
  getAllTenders: () => api.get('/tenders/'),
  createTender: (tenderData: any) => api.post('/tenders/', tenderData),
  updateTender: (id: string, tenderData: any) => api.put(`/tenders/${id}/`, tenderData),
  deleteTender: (id: string) => api.delete(`/tenders/${id}/`),
};

export const bidAPI = {
  submitBid: (bidData: any) => api.post('/bids/', bidData),
  selectWinner: (bidId: string) => api.post(`/bids/${bidId}/select_winner/`),
};

export default api; 