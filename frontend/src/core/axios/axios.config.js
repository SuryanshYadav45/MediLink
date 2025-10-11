import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

//Axios Instance Setup
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// API Connector Function
export const apiConnector = async (
  method,
  url,
  bodyData = null,
  config = {}
) => {
  try {
    const requestConfig = {
      method,
      url,
      ...config, // Optional additional settings (headers, params, etc.)
    };

    // Only attach body data for methods that support a request body
    if (bodyData && !["GET", "DELETE"].includes(method.toUpperCase())) {
      requestConfig.data = bodyData;
    }
    const response = await axiosInstance(requestConfig);

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Something went wrong",
    };
  }
};
