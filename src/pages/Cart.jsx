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
    <div className="p-4 pb-safe-bottom">
      <h2 className="text-2xl font-bold mb-6 font-georgian">Your Cart</h2>
      
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
        <div className="flex flex-col gap-5">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-4 bg-card rounded-xl p-4 shadow-soft">
              <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover" loading="lazy" />
              <div className="flex-1">
                <div className="font-bold font-georgian text-lg">{item.name}</div>
                <div className="text-sm text-gray-300">₾{item.price.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-3">
                <button className="bg-muted text-white px-3 py-2 rounded-lg min-h-touch min-w-[40px] flex items-center justify-center hover:bg-gray-600 transition-colors" onClick={() => updateQty(item.id, item.qty-1)}>-</button>
                <span className="font-bold text-lg min-w-[24px] text-center">{item.qty}</span>
                <button className="bg-muted text-white px-3 py-2 rounded-lg min-h-touch min-w-[40px] flex items-center justify-center hover:bg-gray-600 transition-colors" onClick={() => updateQty(item.id, item.qty+1)}>+</button>
              </div>
              <button className="ml-2 text-accent p-2 min-h-touch min-w-touch flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors" onClick={() => removeFromCart(item.id)}>✕</button>
            </div>
          ))}
          
          {/* Order notes */}
          <div className="mt-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special requests or notes for your order..."
              className="w-full px-4 py-3 bg-muted text-white rounded-lg text-base placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>
          
          <div className="flex justify-between items-center mt-6 font-bold text-xl bg-card p-4 rounded-lg">
            <span>Total:</span>
            <span className="text-primary">₾{total().toFixed(2)}</span>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={clearCart}
              className="px-6 py-4 bg-muted text-white font-bold rounded-xl hover:bg-gray-600 transition-colors min-h-touch flex items-center justify-center"
            >
              Clear Cart
            </button>
            <button
              className="flex-1 bg-accent text-white font-bold rounded-xl py-4 shadow-soft hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-touch flex items-center justify-center"
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
