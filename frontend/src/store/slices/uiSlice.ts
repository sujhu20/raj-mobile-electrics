import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
interface UiState {
  sidebarOpen: boolean;
  cartDrawerOpen: boolean;
  searchOpen: boolean;
  mobileMenuOpen: boolean;
}

const initialState: UiState = {
  sidebarOpen: true,
  cartDrawerOpen: false,
  searchOpen: false,
  mobileMenuOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen(state, action: PayloadAction<boolean>) { state.sidebarOpen = action.payload; },
    toggleCartDrawer(state) { state.cartDrawerOpen = !state.cartDrawerOpen; },
    setCartDrawerOpen(state, action: PayloadAction<boolean>) { state.cartDrawerOpen = action.payload; },
    toggleSearch(state) { state.searchOpen = !state.searchOpen; },
    setSearchOpen(state, action: PayloadAction<boolean>) { state.searchOpen = action.payload; },
    toggleMobileMenu(state) { state.mobileMenuOpen = !state.mobileMenuOpen; },
    setMobileMenuOpen(state, action: PayloadAction<boolean>) { state.mobileMenuOpen = action.payload; },
  },
});

export const {
  toggleSidebar, setSidebarOpen,
  toggleCartDrawer, setCartDrawerOpen,
  toggleSearch, setSearchOpen,
  toggleMobileMenu, setMobileMenuOpen,
} = uiSlice.actions;

export default uiSlice.reducer;
