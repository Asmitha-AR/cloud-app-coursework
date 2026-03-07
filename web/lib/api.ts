import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const AUTH_URL = 'http://127.0.0.1:5100/api';
const SALARY_URL = 'http://127.0.0.1:5001/api';
const VOTE_URL = '/api/vote';
const STATS_URL = 'http://127.0.0.1:5019/api';
const SEARCH_URL = '/api/search';

let accessToken: string | null = null;

// Function to set token from AuthContext
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

// Function to get current token
export const getAccessToken = () => accessToken;

// Shared request interceptor logic
const addAuthToken = (config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
};

// Shared response interceptor logic with retry
const handleAuthError = async (error: unknown) => {
  const axiosError = error as AxiosError;
  const originalRequest = axiosError.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

  if (!originalRequest) {
    return Promise.reject(error);
  }

  // Don't retry for login, signup, or refresh endpoints to avoid infinite loops
  const isAuthRequest = originalRequest.url?.includes('/auth/login') ||
    originalRequest.url?.includes('/auth/signup') ||
    originalRequest.url?.includes('/auth/refresh');

  if (axiosError.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
    originalRequest._retry = true;

    try {
      // Try to refresh the token
      const response = await authApi.post('/auth/refresh');
      const { token } = response.data;

      setAccessToken(token);

      // Retry the original request with new token
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return axios(originalRequest);
    } catch (refreshError) {
      // Refresh failed, redirect to login
      if (typeof window !== 'undefined') {
        setAccessToken(null);
        window.location.href = '/auth/login';
      }
      return Promise.reject(refreshError);
    }
  }

  return Promise.reject(axiosError);
};

// Auth Service API
export const authApi = axios.create({
  baseURL: AUTH_URL,
  withCredentials: true, // Important for httpOnly cookies
});
authApi.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
authApi.interceptors.response.use((response) => response, handleAuthError);

// Salary Service API
export const salaryApi = axios.create({
  baseURL: SALARY_URL,
  withCredentials: true,
});
salaryApi.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
salaryApi.interceptors.response.use((response) => response, handleAuthError);

// Vote Service API
export const voteApi = axios.create({
  baseURL: VOTE_URL,
  withCredentials: false,
});
voteApi.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
voteApi.interceptors.response.use((response) => response, handleAuthError);

// Stats Service API - no login required
export const statsApi = axios.create({
  baseURL: STATS_URL,
  withCredentials: false,
});

// Search Service API - conditional auth (logged-in users see all, anonymous see approved only)
export const searchApi = axios.create({
  baseURL: SEARCH_URL,
  withCredentials: false,
});
searchApi.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
searchApi.interceptors.response.use((response) => response, handleAuthError);

export default salaryApi;
