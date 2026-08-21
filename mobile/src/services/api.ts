import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.0.185:3333';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 1200,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@ContrataAI:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
