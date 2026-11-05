import axios from 'axios';
import { API_URL, getApiUrl } from '../utils/apiConfig';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const currentBase = getApiUrl();
  if (currentBase) {
    config.baseURL = currentBase;
  }
  return config;
});

export const checkHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

export const getSystemStatus = async () => {
  const res = await api.get('/status');
  return res.data;
};

export const getPreview = async () => {
  const res = await api.get('/preview');
  return res.data;
};

export const uploadDataset = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const trainSARIMA = async (target = 'Rainfall') => {
  const res = await api.post('/train/sarima', { target });
  return res.data;
};

export const trainLSTM = async (params = {}) => {
  const res = await api.post('/train/lstm', {
    epochs: params.epochs || 100,
    sequenceLength: params.sequenceLength || 30,
    target: params.target || 'Crop_Yield',
    weatherCols: params.weatherCols || ['Rainfall', 'Max_Temp', 'Min_Temp', 'Humidity'],
  });
  return res.data;
};

export const trainHybrid = async (params = {}) => {
  const res = await api.post('/train/hybrid', {
    target: params.target || 'Crop_Yield',
    weatherCols: params.weatherCols || ['Rainfall', 'Max_Temp', 'Min_Temp', 'Humidity'],
  });
  return res.data;
};

export const predict = async (modelType = 'hybrid', steps = 30) => {
  const res = await api.post('/predict', { modelType, steps });
  return res.data;
};

export const getLatestTraining = async () => {
  const res = await api.get('/training/latest');
  return res.data;
};

export const resetSystem = async () => {
  const res = await api.post('/reset');
  return res.data;
};

export const login = async (email, password, role) => {
  const res = await api.post('/auth/login', { email, password, role });
  return res.data;
};

export const signup = async (userData) => {
  const res = await api.post('/auth/signup', userData);
  return res.data;
};

export const requestPasswordOtp = async (params, role) => {
  const payload = typeof params === 'object' 
    ? { action: 'send_otp', ...params } 
    : { action: 'send_otp', phone: params, role };
  const res = await api.post('/auth/forgot-password', payload);
  return res.data;
};

export const verifyPasswordOtp = async (identifier, otp) => {
  const isEmail = String(identifier || '').includes('@');
  const payload = isEmail
    ? { action: 'verify_otp', email: identifier, otp }
    : { action: 'verify_otp', phone: identifier, otp };
  const res = await api.post('/auth/forgot-password', payload);
  return res.data;
};

export const resetPasswordWithOtp = async (params) => {
  const rawId = String(params.phone || params.email || '').trim();
  const isEmail = rawId.includes('@');
  const payload = {
    action: 'reset_password',
    otp: params.otp,
    resetToken: params.resetToken,
    newPassword: params.newPassword,
    confirmPassword: params.confirmPassword,
    ...(isEmail ? { email: rawId } : { phone: rawId })
  };
  const res = await api.post('/auth/forgot-password', payload);
  return res.data;
};

export const getDemoAccounts = async () => {
  const res = await api.get('/auth/demo-accounts');
  return res.data;
};

export default api;
