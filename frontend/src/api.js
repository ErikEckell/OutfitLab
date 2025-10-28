import axios from "axios";


const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/", // Django backend
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getHello = async () => {
  try {
    const response = await api.get("hello/");
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return { message: "Error fetching data" };
  }
};

// Get current user info
export const getCurrentUser = async () => {
  try {
    // Helper para obtener access token (soporta ambos formatos)
    const getAccess = () => {
      return localStorage.getItem('accessToken')
        || (JSON.parse(localStorage.getItem('outfitlabUser') || 'null')?.access)
        || null;
    };

    const access = getAccess();
    if (!access) throw new Error('No access token. Please login.');

    const response = await api.get("auth/me/", {
      headers: { Authorization: `Bearer ${access}` }
    });
    
    return response.data;
  } catch (error) {
    console.error("Error fetching current user:", error);
    throw error;
  }
};

// Get user's clothing items
export const getUserClothingItems = async () => {
  try {
    const getAccess = () => {
      return localStorage.getItem('accessToken')
        || (JSON.parse(localStorage.getItem('outfitlabUser') || 'null')?.access)
        || null;
    };

    const access = getAccess();
    if (!access) throw new Error('No access token. Please login.');

    const response = await api.get("clothing-items/me/", {
      headers: { Authorization: `Bearer ${access}` }
    });
    
    return response.data;
  } catch (error) {
    console.error("Error fetching clothing items:", error);
    throw error;
  }
};
