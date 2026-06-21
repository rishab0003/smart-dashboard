import axios from 'axios';

// In production, REACT_APP_API_URL points to the Render backend URL.
// In development, the proxy in package.json handles it (relative URLs work).
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
});

export default api;
