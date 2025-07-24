import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useCart from '../store/useCart';
import useTableSharing from '../store/useTableSharing';

export default function Cart() {
  const { cart, updateQty, removeFromCart, total, checkout, clearCart } = useCart();
  const { currentSession, customerName } = useTableSharing();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (!currentSession) {
      alert('You need to join a table session first! Go to any menu item and use the Table Sharing feature.');
      return;
    }

    if (!customerName) {
      alert('Please set your name in the table session first.');
      return;
    }

    setIsCheckingOut(true);
    try {
      const order = await checkout(notes.trim() || null);
      alert(`Order placed successfully! Order ID: ${order.orderId}\nTotal: ₾${order.totalAmount}`);
      navigate('/confirmation');
    } catch (error) {
      alert(`Failed to place order: ${error.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="p-5">
      <h2 className="text-2xl font-bold mb-4 font-georgian">Your Cart</h2>
      
      {/* Table session status */}
      {currentSession ? (
        <div className="mb-4 p-3 bg-card rounded-lg">
          <div className="text-sm text-accent font-bold mb-1">
            🍽️ {currentSession.sessionName || `Table ${currentSession.tableNumber}`}
          </div>
          <div className="text-xs text-gray-400">
            Ordering as: <span className="text-white font-bold">{customerName}</span>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg">
          <div className="text-sm text-yellow-400 font-bold mb-1">⚠️ No Table Session</div>
          <div className="text-xs text-yellow-300">
            Join a table session to place orders. Go to any menu item and use "Table Sharing".
          </div>
        </div>
      )}
      
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
          
          {/* Order notes */}
          <div className="mt-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special requests or notes for your order..."
              className="w-full px-3 py-2 bg-muted text-white rounded-lg text-sm placeholder-gray-400 resize-none"
              rows={2}
            />
          </div>
          
          <div className="flex justify-between items-center mt-3 font-bold text-lg">
            <span>Total:</span>
            <span>₾{total().toFixed(2)}</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={clearCart}
              className="px-4 py-3 bg-muted text-white font-bold rounded-xl hover:bg-gray-600 transition-colors"
            >
              Clear Cart
            </button>
            <button
              className="flex-1 bg-accent text-white font-bold rounded-xl py-3 shadow-soft hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCheckout}
              disabled={isCheckingOut || !currentSession}
            >
              {isCheckingOut ? 'Placing Order...' : currentSession ? 'Place Order' : 'Join Table First'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
