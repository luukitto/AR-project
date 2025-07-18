import { useNavigate } from 'react-router-dom';
import useCart from '../store/useCart';

export default function Cart() {
  const { cart, updateQty, removeFromCart, total } = useCart();
  const navigate = useNavigate();
  return (
    <div className="p-5">
      <h2 className="text-2xl font-bold mb-4 font-georgian">Your Cart</h2>
      {cart.length === 0 ? (
        <div className="text-center opacity-70">Your cart is empty.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-4 bg-card rounded-xl p-3 shadow-soft">
              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
              <div className="flex-1">
                <div className="font-bold font-georgian">{item.name}</div>
                <div className="text-sm">₾{item.price.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="bg-muted text-white px-2 rounded" onClick={() => updateQty(item.id, item.qty-1)}>-</button>
                <span>{item.qty}</span>
                <button className="bg-muted text-white px-2 rounded" onClick={() => updateQty(item.id, item.qty+1)}>+</button>
              </div>
              <button className="ml-2 text-accent" onClick={() => removeFromCart(item.id)}>✕</button>
            </div>
          ))}
          <div className="flex justify-between items-center mt-3 font-bold text-lg">
            <span>Total:</span>
            <span>₾{total().toFixed(2)}</span>
          </div>
          <button
            className="w-full bg-accent text-white font-bold rounded-xl py-3 shadow-soft hover:bg-primary transition-colors"
            onClick={() => navigate('/confirmation')}
          >
            Call the waiter
          </button>
        </div>
      )}
    </div>
  );
}
