import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    brand: string;
    images: { url: string }[];
  };
}

interface CartSummary {
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
}

interface CartState {
  items: CartItem[];
  summary: CartSummary;
  coupon: any | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  summary: { subtotal: 0, discount: 0, tax: 0, deliveryFee: 0, total: 0, itemCount: 0 },
  coupon: null,
  isLoading: false,
  error: null,
};

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cart');
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addToCart = createAsyncThunk(
  'cart/add',
  async ({ productId, quantity = 1 }: { productId: string; quantity?: number }, { dispatch, rejectWithValue }) => {
    try {
      await api.post('/cart/items', { productId, quantity });
      dispatch(fetchCart());
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add to cart');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/update',
  async ({ itemId, quantity }: { itemId: string; quantity: number }, { dispatch, rejectWithValue }) => {
    try {
      await api.put(`/cart/items/${itemId}`, { quantity });
      dispatch(fetchCart());
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update cart');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/remove',
  async (itemId: string, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      dispatch(fetchCart());
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove item');
    }
  }
);

export const applyCoupon = createAsyncThunk(
  'cart/applyCoupon',
  async (code: string, { dispatch, rejectWithValue }) => {
    try {
      await api.post('/cart/apply-coupon', { code });
      dispatch(fetchCart());
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Invalid coupon');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart(state) {
      state.items = [];
      state.summary = initialState.summary;
      state.coupon = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCart.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      state.isLoading = false;
      state.items = action.payload.items;
      state.summary = action.payload.summary;
      state.coupon = action.payload.coupon;
    });
    builder.addCase(fetchCart.rejected, (state) => { state.isLoading = false; });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
