import { useNavigate } from 'react-router-dom';
import foods from '../store/foods';
import useCart from '../store/useCart';
import useTableSharing from '../store/useTableSharing';
import { useState } from 'react';

export default function Menu() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('food');
  const { addToCart, cart } = useCart();
  const { currentSession, sessionOrders } = useTableSharing();
  const [showAddedFeedback, setShowAddedFeedback] = useState(null);

  const categories = [
    { key: 'food', label: 'Foods' },
    { key: 'drink', label: 'Drinks' },
    { key: 'dessert', label: 'Desserts' }
  ];

  const filtered = foods.filter(f => f.category === category);

  const handleAddToCart = (item) => {
    addToCart(item);
    setShowAddedFeedback(item.id);
    setTimeout(() => setShowAddedFeedback(null), 2000);
  };

  const getItemQuantityInCart = (itemId) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.qty : 0;
  };

  return (
    <div className="py-6 px-3">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold font-georgian">Menu</h2>
        {currentSession && (
          <button
            onClick={() => navigate('/orders')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            Order History
          </button>
        )}
      </div>
      <div className="flex gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat.key}
            className={`px-4 py-2 rounded-full font-bold transition-colors ${category === cat.key ? 'bg-primary text-dark shadow-soft' : 'bg-muted text-white'}`}
            onClick={() => setCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-5">
        {filtered.length === 0 ? (
          <div className="text-center opacity-60">No items in this category yet.</div>
        ) : filtered.map(food => (
          <div key={food.id} className="bg-card rounded-2xl shadow-soft p-4 flex flex-col gap-2">
            <img src={food.image} alt={food.name} className="rounded-xl w-full h-40 object-cover mb-2" />
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg font-georgian">{food.name}</div>
                <div className="text-sm opacity-80 font-georgian">{food.desc}</div>
              </div>
              <div className="font-bold text-primary text-lg">₾{food.price.toFixed(2)}</div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                className="flex-1 bg-accent text-white font-bold rounded-lg px-4 py-2 text-sm hover:bg-primary transition-colors"
                onClick={() => navigate(`/ar/${food.id}`)}
              >
                View in AR
              </button>
              <button
                className={`flex-1 font-bold rounded-lg px-4 py-2 text-sm transition-colors ${
                  showAddedFeedback === food.id 
                    ? 'bg-green-500 text-white' 
                    : 'bg-primary text-dark hover:bg-accent hover:text-white'
                }`}
                onClick={() => handleAddToCart(food)}
              >
                {showAddedFeedback === food.id ? '✓ Added!' : 
                 getItemQuantityInCart(food.id) > 0 ? `Add More (${getItemQuantityInCart(food.id)})` : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
