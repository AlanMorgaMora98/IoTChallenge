import axios from "axios";

const API_URL = import.meta.env.VITE_DEVICES_API_URL;

export const devicesAPI = axios.create({
  baseURL: API_URL,
});
