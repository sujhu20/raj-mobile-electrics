import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    brand: string;
    stock: number;
    avgRating: number;
    images: { url: string }[];
    category: { name: string; slug: string };
  };
}

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
}

const initialState: WishlistState = { items: [], isLoading: false };

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async () => {
  const { data } = await api.get('/wishlist');
  return data.data;
});

export const toggleWishlist = createAsyncThunk(
  'wishlist/toggle',
  async (productId: string, { getState, dispatch }) => {
    const state = getState() as any;
    const exists = state.wishlist.items.find((i: WishlistItem) => i.productId === productId);
    if (exists) {
      await api.delete(`/wishlist/${productId}`);
    } else {
      await api.post(`/wishlist/${productId}`);
    }
    dispatch(fetchWishlist());
    return !exists;
  }
);

export const moveToCart = createAsyncThunk(
  'wishlist/moveToCart',
  async (productId: string, { dispatch }) => {
    await api.post(`/wishlist/${productId}/move-to-cart`);
    dispatch(fetchWishlist());
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchWishlist.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchWishlist.fulfilled, (state, action) => {
      state.isLoading = false;
      state.items = Array.isArray(action.payload) ? action.payload : [];
    });
    builder.addCase(fetchWishlist.rejected, (state) => { state.isLoading = false; });
  },
});

export default wishlistSlice.reducer;
