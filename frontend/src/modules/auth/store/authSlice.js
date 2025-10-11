import { createSlice } from "@reduxjs/toolkit";

const token = localStorage.getItem("token");
const userInfoString = localStorage.getItem("userInfo");

let userInfo = null;
try {
  userInfo = userInfoString ? JSON.parse(userInfoString) : null;
} catch (error) {
  console.error("Failed to parse userInfo from localStorage:", error);
  localStorage.removeItem("userInfo");
}


const initialState = {
  authLoading: false,
  userInfo: userInfo || null,
  userToken: token || null,
  isAuthenticated: !!token,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // 🔹 Login success updates Redux + localStorage
    loginSuccess: (state, action) => {
      state.userInfo = action.payload.user;
      state.userToken = action.payload.token;
      state.isAuthenticated = true;
      state.authLoading = false;

      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("userInfo", JSON.stringify(action.payload.user));
    },

    // 🔹 Set loading state
    setAuthLoading: (state, action) => {
      state.authLoading = action.payload;
    },

    // 🔹 Logout clears Redux + localStorage
    logout: (state) => {
      state.userInfo = null;
      state.userToken = null;
      state.isAuthenticated = false;
      state.authLoading = false;

      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
    },

     updateUserInfo: (state, action) => {
      state.userInfo = { ...state.userInfo, ...action.payload };
      localStorage.setItem("userInfo", JSON.stringify(state.userInfo));
    },
  },
});

export const { loginSuccess, setAuthLoading, logout ,updateUserInfo} = authSlice.actions;
export default authSlice.reducer;
