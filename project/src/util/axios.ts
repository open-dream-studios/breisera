import axios from "axios";
import Cookies from "js-cookie";
import { BACKEND_URL } from "./config";

export const makeRequest = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true, 
});

makeRequest.interceptors.request.use(
  (config) => {
    const token = Cookies.get("accessToken"); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);