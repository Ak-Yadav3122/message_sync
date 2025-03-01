
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  register: (userData: any) => api.post('/auth/register', userData),
  login: (credentials: any) => api.post('/auth/login', credentials),
  deleteAccount: () => api.delete('/users/me'),
};

// User API
export const userAPI = {
  getAllUsers: () => api.get('/users'),
  searchUsers: (query: string) => api.get(`/users/search?query=${query}`),
  deleteAccount: () => api.delete('/users/me'),
};

// Friend Request API
export const friendAPI = {
  sendFriendRequest: (receiverId: number) => api.post('/friend-requests', { receiverId }),
  getFriendRequests: () => api.get('/friend-requests'),
  respondToFriendRequest: (requestId: number, status: 'accepted' | 'rejected') => 
    api.put(`/friend-requests/${requestId}`, { status }),
  getFriends: () => api.get('/friends'),
};

// Message API
export const messageAPI = {
  sendMessage: (receiverId: number, content: string) => 
    api.post('/messages', { receiverId, content }),
  getConversation: (userId: number) => api.get(`/messages/${userId}`),
};

export default api;
