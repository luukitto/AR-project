import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import useCart from '../store/useCart';
import useTableSharing from '../store/useTableSharing';
import MobileUtils from '../utils/mobileUtils';
import Api from '../services/api';

export default function Menu() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('food');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart, cart } = useCart();
  const { currentSession, sessionOrders } = useTableSharing();
  const [showAddedFeedback, setShowAddedFeedback] = useState(null);
  const categoryContainerRef = useRef(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await Api.getCategories();
        setCategories(cats.map((c) => ({ key: c.name, label: c.display_name })));
      } catch (err) {
        console.error(err);
        setCategories([
          { key: 'food', label: 'Foods' },
          { key: 'drink', label: 'Drinks' },
          { key: 'dessert', label: 'Desserts' },
        ]);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await Api.getMenuItems(category);
        setItems(data);
      } catch (err) {
        setError(err.message || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, [category]);

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
        {loading && <div className="text-center opacity-60 py-8">Loading menu...</div>}
        {error && <div className="text-center text-red-500 py-4">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="text-center opacity-60 py-8">No items in this category yet.</div>
        )}
        {!loading && !error && items.map(food => (
          <div key={food.id} className="bg-card rounded-2xl shadow-soft p-5 flex flex-col gap-3">
            <img src={food.image_url || food.image} alt={food.name} className="rounded-xl w-full h-48 object-cover mb-2" loading="lazy" />
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg font-georgian">{food.name}</div>
                <div className="text-sm opacity-80 font-georgian">{food.description || food.desc}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {food.is_spicy ? <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Spicy</span> : null}
                  {food.is_vegan ? <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Vegan</span> : null}
                  {food.allergens && food.allergens.length > 0 && !food.allergens.includes('none') ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                      Allergens: {food.allergens.join(', ')}
                    </span>
                  ) : null}
                </div>
                {food.modifiers && food.modifiers.length > 0 && (
                  <div className="mt-2 text-xs opacity-80">
                    Extras: {food.modifiers.map((m) => `${m.name} (+₾${m.price.toFixed(2)})`).join(' • ')}
                  </div>
                )}
              </div>
              <div className="font-bold text-primary text-lg">₾{Number(food.price).toFixed(2)}</div>
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
                onClick={() => handleAddToCart({
                  id: food.id,
                  name: food.name,
                  desc: food.description || food.desc,
                  price: food.price,
                  image: food.image_url || food.image,
                  modifiers: food.modifiers || [],
                  is_spicy: food.is_spicy,
                  is_vegan: food.is_vegan,
                  allergens: food.allergens || [],
                })}
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
