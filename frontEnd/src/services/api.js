import axios from 'axios';

const API = axios.create({
  baseURL:
    'https://6a81b0ff38b7112e12a5e170-api-capstone.myanatomy.ai/api'
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;