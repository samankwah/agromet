import { apiClient } from "./config";

export const apiRegister = async (payload) => {
  return await apiClient.post(`/api/v1/auth/register`, payload);
};
export const apiLogin = async (payload) => {
  const formData = new URLSearchParams();
  formData.append("username", payload.email);
  formData.append("password", payload.password);
  return apiClient.post("/api/v1/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};
export const generateToken = async (payload) => {
  return apiLogin(payload);
};

export const apiGetUser = async (userName) => {
  return apiClient.get(`/api/v1/auth/me`);
};

export const apiLogout = async () => {
  return Promise.resolve({ data: { success: true } });
};
