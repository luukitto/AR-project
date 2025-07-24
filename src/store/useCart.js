import { create } from 'zustand';
import apiService from '../services/api';
import useTableSharing from './useTableSharing';

const useCart = create((set, get) => ({
  cart: [],
  addToCart: (item) => {
    set(state => {
      const exists = state.cart.find(i => i.id === item.id);
      if (exists) {
        return { cart: state.cart.map(i => i.id === item.id ? {...i, qty: i.qty+1} : i) };
      }
      return { cart: [...state.cart, { ...item, qty: 1 }] };
    });
  },
  updateQty: (id, qty) => {
    set(state => ({
      cart: state.cart.map(i => i.id === id ? { ...i, qty: Math.max(1, qty) } : i)
    }));
  },
  removeFromCart: (id) => {
    set(state => ({ cart: state.cart.filter(i => i.id !== id) }));
  },
  total: () => {
    return get().cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  },
  
  // Checkout with table sharing integration
  checkout: async (notes = null) => {
    const { cart } = get();
    if (cart.length === 0) {
      throw new Error('Cart is empty');
    }

    // Get table sharing state
    const tableSharing = useTableSharing.getState();
    const { currentSession, customerName, placeOrder } = tableSharing;

    if (!currentSession || !customerName) {
      throw new Error('Must be in a table session to place order');
    }

    try {
      // Convert cart items to order format
      const orderItems = cart.map(item => ({
        menuItemId: item.id,
        quantity: item.qty,
        specialRequests: null
      }));

      // Place order through table sharing
      const order = await placeOrder(orderItems, notes);
      
      // Clear cart after successful order
      set({ cart: [] });
      
      return order;
    } catch (error) {
      console.error('Checkout failed:', error);
      throw error;
    }
  },
  
  // Clear cart
  clearCart: () => {
    set({ cart: [] });
  },
}));

export default useCart;
