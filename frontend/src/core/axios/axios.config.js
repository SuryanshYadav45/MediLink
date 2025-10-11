import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


// ==================== Axios Instance Setup ====================
// Create a reusable axios instance that will be used across the entire app.
// This includes the base URL, request timeout, headers, and cookie handling.

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,       // Base API URL defined in environment variables
  timeout: 30000,              // 30 seconds timeout for all requests
  headers: {
    "Content-Type": "application/json", // Default header for JSON requests
  },
  withCredentials: true,       // Allow sending cookies along with requests
});




// ==================== API Connector Function ====================
// This function standardizes API calls for all HTTP methods (GET, POST, PUT, DELETE, et

export const apiConnector = async (
  method,
  url,
  bodyData = null,
  config = {}
) => {
  try {
    // Build the axios configuration dynamically
    const requestConfig = {
      method,     // HTTP method (GET, POST, PUT, DELETE)
      url,        // Endpoint URL
      ...config,  // Optional additional settings (headers, params, etc.)
    };

    // Only attach body data for methods that support a request body
    if (bodyData && !["GET", "DELETE"].includes(method.toUpperCase())) {
      requestConfig.data = bodyData;
    }

    // Execute the request using the axios instance
    const response = await axiosInstance(requestConfig);

    // On success, return data in a consistent format
    return { success: true, data: response.data };
  } catch (error) {
    // On failure, capture and normalize the error message
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Something went wrong",
    };
  }
};
