import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: process.env.REACT_BASE_URL,
  headers: { "Content-Type": "application/json" },
  // also send cookies if backend uses them
  withCredentials: true,
 }
)

// Request interceptor (add token)
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if(token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
},
(err) => Promise.reject(err)
)


// apiConnector 
export const apiConnector = async (
  method,
  url,
  bodyData = null,
  params = null,
  headers = {}
) => {
  try {
    const response = await axiosInstance({
      method,
      url,
      data: bodyData,
      params,
      headers
    })

    //  console.log(`[API] ${method.toUpperCase()} ${url}`, {
    //   params,
    //   bodyData,
    //   response: response.data,
    // });
    return response.data;
  } catch (error) {
    console.log("apiConnector error",error.message);
     // Retry example (retry once if server error)
    // if (error.response?.status >= 500) {
    //   console.warn("[API] Retrying request...");
    //   return api({
    //     method,
    //     url,
    //     data: bodyData,
    //     params,
    //     headers,
    //   }).then((res) => res.data);
    // }

    // throw error;
  }
};


