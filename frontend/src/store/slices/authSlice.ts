import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import api from '../../config/api';
import { STORAGE_KEYS } from '../../config/constants';
import { ENDPOINTS } from '../../config/api-endpoints';
import type { User } from '../../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(ENDPOINTS.AUTH.LOGIN, credentials);
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.data.accessToken);
      return data.data.user as User;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { firstName: string; lastName: string; email: string; password: string; phone?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(ENDPOINTS.AUTH.REGISTER, userData);
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.data.accessToken);
      return data.data.user as User;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (credential: string, { rejectWithValue }) => {
    try {
      const { data } = await api.post(ENDPOINTS.AUTH.GOOGLE, { credential });
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.data.accessToken);
      return data.data.user as User;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Google login failed');
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(ENDPOINTS.USERS.ME);
      return data.data as User;
    } catch (err: any) {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post(ENDPOINTS.AUTH.LOGOUT);
  } catch {
    // Continue even if backend call fails
  }
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
      state.isLoading = false; state.user = action.payload; state.isAuthenticated = true;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false; state.error = action.payload as string;
    });

    // Register
    builder.addCase(register.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(register.fulfilled, (state, action: PayloadAction<User>) => {
      state.isLoading = false; state.user = action.payload; state.isAuthenticated = true;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false; state.error = action.payload as string;
    });

    // Google Login
    builder.addCase(googleLogin.fulfilled, (state, action: PayloadAction<User>) => {
      state.isLoading = false; state.user = action.payload; state.isAuthenticated = true;
    });

    // Fetch Profile
    builder.addCase(fetchProfile.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchProfile.fulfilled, (state, action: PayloadAction<User>) => {
      state.isLoading = false; state.user = action.payload; state.isAuthenticated = true;
    });
    builder.addCase(fetchProfile.rejected, (state) => {
      state.isLoading = false; state.user = null; state.isAuthenticated = false;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null; state.isAuthenticated = false; state.error = null;
    });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
