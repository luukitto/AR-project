import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import foods from '../store/foods';
import useCart from '../store/useCart';
import useTableSharing from '../store/useTableSharing';
import MobileUtils from '../utils/mobileUtils';

export default function Menu() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('food');
  const { addToCart, cart } = useCart();
  const { currentSession, sessionOrders } = useTableSharing();
  const [showAddedFeedback, setShowAddedFeedback] = useState(null);
  const categoryContainerRef = useRef(null);

  const categories = [
    { key: 'food', label: 'Foods' },
    { key: 'drink', label: 'Drinks' },
    { key: 'dessert', label: 'Desserts' }
  ];

  const filtered = foods.filter(f => f.category === category);

  // Add mobile features on component mount
  useEffect(() => {
    if (categoryContainerRef.current && MobileUtils.isTouchDevice()) {
      // Add swipe gesture for category navigation
      MobileUtils.addSwipeGesture(categoryContainerRef.current, (direction) => {
        const currentIndex = categories.findIndex(cat => cat.key === category);
        if (direction === 'left' && currentIndex < categories.length - 1) {
          setCategory(categories[currentIndex + 1].key);
        } else if (direction === 'right' && currentIndex > 0) {
          setCategory(categories[currentIndex - 1].key);
        }
      });
    }
  }, [category, categories]);

  const handleAddToCart = (item) => {
    // Add haptic feedback for mobile
    MobileUtils.hapticFeedback('light');
    addToCart(item);
    setShowAddedFeedback(item.id);
    setTimeout(() => setShowAddedFeedback(null), 2000);
  };

  const handleCategoryChange = (newCategory) => {
    MobileUtils.hapticFeedback('selection');
    setCategory(newCategory);
  };

  const getItemQuantityInCart = (itemId) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.qty : 0;
  };

  return (
    <div className="py-4 px-4 pb-safe-bottom">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-georgian">Menu</h2>
        {currentSession && (
          <button
            onClick={() => navigate('/orders')}
            className="bg-blue-500 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors min-h-touch flex items-center"
          >
            Order History
          </button>
        )}
      </div>
      <div ref={categoryContainerRef} className="flex gap-3 mb-6 overflow-x-auto scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.key}
            className={`px-6 py-3 rounded-full font-bold transition-colors min-h-touch flex items-center justify-center whitespace-nowrap flex-shrink-0 ${category === cat.key ? 'bg-primary text-dark shadow-soft' : 'bg-muted text-white hover:bg-gray-600'}`}
            onClick={() => handleCategoryChange(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-6">
        {filtered.length === 0 ? (
          <div className="text-center opacity-60 py-8">No items in this category yet.</div>
        ) : filtered.map(food => (
          <div key={food.id} className="bg-card rounded-2xl shadow-soft p-5 flex flex-col gap-3">
            <img src={food.image} alt={food.name} className="rounded-xl w-full h-48 object-cover mb-2" loading="lazy" />
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg font-georgian">{food.name}</div>
                <div className="text-sm opacity-80 font-georgian">{food.desc}</div>
              </div>
              <div className="font-bold text-primary text-lg">₾{food.price.toFixed(2)}</div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                className="flex-1 bg-accent text-white font-bold rounded-lg px-4 py-3 text-sm hover:bg-primary transition-colors min-h-touch flex items-center justify-center"
                onClick={() => navigate(`/ar/${food.id}`)}
              >
                View in AR
              </button>
              <button
                className={`flex-1 font-bold rounded-lg px-4 py-3 text-sm transition-colors min-h-touch flex items-center justify-center ${
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
