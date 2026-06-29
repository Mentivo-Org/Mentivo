import axios from "axios";

const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:8080/api/admin";

const api = axios.create({
  baseURL: ADMIN_API_URL,
  withCredentials: true,
});

export default api;
