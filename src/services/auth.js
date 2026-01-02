import { apiClient } from "./config";

export const apiRegister = async (payload) => {
  return await apiClient.post(`/users/auth/sign-up`, payload);
};
export const apiLogin = async (payload) => {
  return apiClient.post("/users/auth/sign-in", payload);
};
export const generateToken = async (payload) => {
  return apiClient.post("/users/auth/token", payload);
};

export const apiGetUser = async (userName) => {
  return apiClient.get(`/users/auth/${userName}`);
};

export const apiLogout = async () => {
  return apiClient.post("/users/auth/user-update");
};
