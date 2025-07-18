import { create } from 'zustand';

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
}));

export default useCart;
