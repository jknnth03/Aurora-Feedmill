import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  isLoggingOut: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = {
        ...user,
        access_permissions: user.role?.permissions || [],
        role_name: user.role?.name || null,
      };
      state.token = token;
      state.isAuthenticated = true;
      state.isLoggingOut = false;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
          access_permissions:
            action.payload.role?.access_permissions ||
            state.user.access_permissions,
        };
      }
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoggingOut = false;
    },
    setLoggingOut: (state, action) => {
      state.isLoggingOut = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, updateUser, setLoggingOut } =
  authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoggingOut = (state) => state.auth.isLoggingOut;
export const selectUserPermissions = (state) =>
  state.auth?.user?.access_permissions || [];
export const selectHasPermission = (permission) => (state) =>
  (state.auth?.user?.access_permissions || []).includes(permission);
