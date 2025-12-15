import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useCart from '../store/useCart';
import useTableSharing from '../store/useTableSharing';
import Api from '../services/api';
import MobileUtils from '../utils/mobileUtils';

// AR Placement Button Component
function ARPlacementButton({ food, modelSrc, iosSrc }) {
  const [isARSupported, setIsARSupported] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const modelViewerRef = useRef(null);

  useEffect(() => {
    const checkARSupport = async () => {
      if ('xr' in navigator) {
        try {
          const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
          setIsARSupported(isSupported);
        } catch (error) {
          setIsARSupported(/iPad|iPhone|iPod/.test(navigator.userAgent));
        }
      } else {
        setIsARSupported(/iPad|iPhone|iPod/.test(navigator.userAgent));
      }
    };
    checkARSupport();
  }, []);

  const handleARPlacement = async () => {
    setIsPlacing(true);
    try {
      if (modelViewerRef.current) {
        const modelViewer = modelViewerRef.current;
        if (modelViewer.canActivateAR) {
          await modelViewer.activateAR();
        } else {
          const tempViewer = document.createElement('model-viewer');
          tempViewer.src = modelSrc;
          tempViewer.iosSrc = iosSrc;
          tempViewer.ar = true;
          tempViewer.arModes = 'webxr scene-viewer quick-look';
          tempViewer.style.display = 'none';
          document.body.appendChild(tempViewer);
          tempViewer.addEventListener('load', async () => {
            try {
              await tempViewer.activateAR();
            } catch (error) {
              alert('AR not available on this device. Please try on a compatible mobile device.');
            } finally {
              document.body.removeChild(tempViewer);
            }
          });
        }
      }
    } catch (error) {
      console.error('AR placement error:', error);
      alert("AR placement failed. Make sure you're on a compatible device with camera permission.");
    } finally {
      setIsPlacing(false);
    }
  };

  const handleFallbackPlacement = () => {
    alert(
      `To place ${food.name} in AR:\n\n1. Point your camera at a flat surface\n2. Tap to place the 3D model\n3. Move around to see it from different angles\n\nNote: Requires a compatible AR device (iPhone 6s+ or Android with ARCore).`
    );
  };

  return (
    <div className="mt-4 mb-2 flex flex-col items-center gap-2">
      <button
        className="px-4 py-2 bg-primary text-dark rounded-lg font-bold shadow-soft hover:bg-accent transition-colors flex items-center gap-2"
        onClick={isARSupported ? handleARPlacement : handleFallbackPlacement}
        disabled={isPlacing}
      >
        {isPlacing ? (
          <>
            <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin"></div>
            Starting AR...
          </>
        ) : (
          <>📱 {isARSupported ? 'Place on Table (AR)' : 'AR Instructions'}</>
        )}
      </button>

      {isARSupported && (
        <p className="text-xs text-gray-400 text-center max-w-xs">
          Point your camera at a flat surface and tap to place {food.name} in your space
        </p>
      )}

      <model-viewer
        ref={modelViewerRef}
        src={modelSrc}
        ios-src={iosSrc}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="auto"
        camera-controls
        style={{ display: 'none' }}
        alt={`${food.name} AR Model`}
      ></model-viewer>
    </div>
  );
}

// Table sharing section (kept largely as before)
function GroupOrderSection({ food }) {
  const {
    currentSession,
    isHost,
    customerName,
    customers,
    sessionOrders,
    isLoading,
    error,
    createSession,
    joinSession,
    leaveSession,
    endSession,
    setCustomerName,
    shareCart,
    clearError,
    restoreSession,
  } = useTableSharing();

  const { cart } = useCart();
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [hostName, setHostName] = useState('');
  const [tableNumber, setTableNumber] = useState('T01');
  const [sessionName, setSessionName] = useState('');

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (currentSession && customerName && cart.length > 0) {
      shareCart(cart);
    }
  }, [cart, currentSession, customerName, shareCart]);

  const handleCreateSession = async () => {
    if (!hostName.trim()) {
      alert('Please enter your name');
      return;
    }
    try {
      await createSession(tableNumber, hostName.trim(), sessionName.trim() || null);
      setShowCreateForm(false);
    } catch (err) {
      alert(`Failed to create session: ${err.message}`);
    }
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim()) {
      alert('Please enter a session code');
      return;
    }
    if (!customerName.trim()) {
      alert('Please enter your name');
      return;
    }
    try {
      await joinSession(joinCode.trim(), customerName.trim());
      setShowJoinForm(false);
    } catch (err) {
      alert(`Failed to join session: ${err.message}`);
    }
  };

  const handleLeaveSession = () => {
    if (confirm('Leave this table session?')) leaveSession();
  };

  const handleEndSession = async () => {
    if (!confirm('End this session for everyone?')) return;
    try {
      await endSession();
    } catch (err) {
      alert(`Failed to end session: ${err.message}`);
    }
  };

  if (currentSession) {
    return (
      <div className="my-4 w-full max-w-sm mx-auto bg-card rounded-xl p-4 shadow-soft">
        <div className="text-center mb-3">
          <div className="text-sm text-accent font-bold mb-1">
            🍽️ {currentSession.sessionName || `Table ${currentSession.tableNumber}`}
          </div>
          <div className="text-xs text-gray-400">
            Session: {currentSession.sessionId?.slice(-6).toUpperCase()}
          </div>
          {isHost && <div className="text-xs text-primary mt-1">👑 You are the host</div>}
        </div>

        {customers.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">At this table ({customers.length}):</div>
            <div className="flex flex-wrap gap-1">
              {customers.map((customer, index) => (
                <span
                  key={index}
                  className={`text-xs px-2 py-1 rounded-full ${
                    customer.is_host
                      ? 'bg-primary text-dark'
                      : customer.customer_name === customerName
                      ? 'bg-accent text-white'
                      : 'bg-muted text-white'
                  }`}
                >
                  {customer.customer_name} {customer.is_host && '👑'}
                </span>
              ))}
            </div>
          </div>
        )}

        {sessionOrders.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Recent orders ({sessionOrders.length}):</div>
            <div className="max-h-20 overflow-y-auto">
              {sessionOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="text-xs text-white mb-1">
                  <span className="font-bold">{order.customer_name}</span>: ₾{order.total_amount}
                  <span
                    className={`ml-2 px-1 rounded text-xs ${
                      order.status === 'pending'
                        ? 'bg-yellow-600'
                        : order.status === 'confirmed'
                        ? 'bg-blue-600'
                        : order.status === 'ready'
                        ? 'bg-green-600'
                        : 'bg-gray-600'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleLeaveSession}
            className="flex-1 px-3 py-2 bg-muted text-white rounded-lg text-xs hover:bg-gray-600 transition-colors"
          >
            Leave Table
          </button>
          {isHost && (
            <button
              onClick={handleEndSession}
              className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
            >
              End Session
            </button>
          )}
        </div>

        {error && (
          <div className="mt-2 text-xs text-red-400 text-center">
            {error}
            <button onClick={clearError} className="ml-2 underline">
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="my-4 w-full max-w-sm mx-auto">
      <div className="text-center mb-3">
        <div className="text-sm font-bold text-accent mb-1">🍽️ Table Sharing</div>
        <div className="text-xs text-gray-400">Order together with friends!</div>
      </div>

      {!showJoinForm && !showCreateForm && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex-1 px-3 py-2 bg-primary text-dark rounded-lg text-xs font-bold hover:bg-accent transition-colors"
          >
            Host Table
          </button>
          <button
            onClick={() => setShowJoinForm(true)}
            className="flex-1 px-3 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:bg-primary hover:text-dark transition-colors"
          >
            Join Table
          </button>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-card rounded-lg p-3 space-y-2">
          <div className="text-xs font-bold text-white mb-2">Host a New Table</div>
          <input
            type="text"
            placeholder="Your name"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            className="w-full px-2 py-1 rounded text-xs bg-muted text-white placeholder-gray-400"
          />
          <select
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="w-full px-2 py-1 rounded text-xs bg-muted text-white"
          >
            <option value="T01">Table 1</option>
            <option value="T02">Table 2</option>
            <option value="T03">Table 3</option>
            <option value="T04">Table 4</option>
            <option value="T05">Table 5</option>
          </select>
          <input
            type="text"
            placeholder="Session name (optional)"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className="w-full px-2 py-1 rounded text-xs bg-muted text-white placeholder-gray-400"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateSession}
              disabled={isLoading}
              className="flex-1 px-3 py-1 bg-primary text-dark rounded text-xs font-bold hover:bg-accent transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Session'}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1 bg-muted text-white rounded text-xs hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showJoinForm && (
        <div className="bg-card rounded-lg p-3 space-y-2">
          <div className="text-xs font-bold text-white mb-2">Join a Table</div>
          <input
            type="text"
            placeholder="Your name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-2 py-1 rounded text-xs bg-muted text-white placeholder-gray-400"
          />
          <input
            type="text"
            placeholder="Session code (e.g., ABC123)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="w-full px-2 py-1 rounded text-xs bg-muted text-white placeholder-gray-400"
          />
          <div className="flex gap-2">
            <button
              onClick={handleJoinSession}
              disabled={isLoading}
              className="flex-1 px-3 py-1 bg-accent text-white rounded text-xs font-bold hover:bg-primary hover:text-dark transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Joining...' : 'Join Session'}
            </button>
            <button
              onClick={() => setShowJoinForm(false)}
              className="px-3 py-1 bg-muted text-white rounded text-xs hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 text-xs text-red-400 text-center">
          {error}
          <button onClick={clearError} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

export default function ARPreview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToCart, cart } = useCart();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const item = await Api.getMenuItem(id);
        setFood(item);
      } catch (err) {
        setError(err.message || 'Failed to load item');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const modelSrc = useMemo(() => {
    if (!food) return '/default-food-model.glb';
    return food.id === 'khachapuri' ? '/Popcorn.glb' : '/default-food-model.glb';
  }, [food]);

  const iosSrc = useMemo(() => {
    if (!food) return '/default-food-model.usdz';
    return food.id === 'khachapuri'
      ? '/AR-Code-Object-Capture-app-1752752575.usdz'
      : '/default-food-model.usdz';
  }, [food]);

  const handleAdd = () => {
    if (!food) return;
    MobileUtils.hapticFeedback('light');
    addToCart({
      id: food.id,
      name: food.name,
      desc: food.description,
      price: Number(food.price),
      image: food.image_url,
      modifiers: food.modifiers || [],
      is_spicy: food.is_spicy,
      is_vegan: food.is_vegan,
      allergens: food.allergens || [],
    });
  };

  const qtyInCart = food ? cart.find((item) => item.id === food.id)?.qty || 0 : 0;

  const handleAddToCart = () => {
    handleAdd();
    setShowAddedFeedback(true);
    setTimeout(() => setShowAddedFeedback(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-xl"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Item not found</h2>
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        <button
          onClick={() => navigate('/menu')}
          className="bg-primary text-dark px-4 py-2 rounded-lg font-bold"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="p-4">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-300 hover:text-white flex items-center gap-2 mb-4"
        >
          ← Back
        </button>

        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="bg-black/20 rounded-2xl overflow-hidden border border-white/5">
                <img
                  src={food.image_url}
                  alt={food.name}
                  className="w-full h-64 object-cover"
                  loading="lazy"
                />
              </div>

              <div className="mt-4 space-y-3">
                <ARPlacementButton food={food} modelSrc={modelSrc} iosSrc={iosSrc} />
                <div className="text-xs text-gray-400 text-center">
                  Tip: find a flat surface, move your phone side to side, then tap to place.
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold font-georgian mb-1">{food.name}</h1>
                  <p className="text-gray-300 text-sm max-w-xl">{food.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-primary text-3xl font-bold">₾{Number(food.price).toFixed(2)}</div>
                  {qtyInCart > 0 && <div className="text-xs text-green-400 mt-1">In cart: {qtyInCart}</div>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {food.is_spicy ? (
                  <span className="px-3 py-1 text-xs rounded-full bg-red-100/20 text-red-200 border border-red-500/30">
                    Spicy
                  </span>
                ) : null}
                {food.is_vegan ? (
                  <span className="px-3 py-1 text-xs rounded-full bg-green-100/20 text-green-200 border border-green-500/30">
                    Vegan
                  </span>
                ) : null}
                {food.allergens && food.allergens.length > 0 && !food.allergens.includes('none') && (
                  <span className="px-3 py-1 text-xs rounded-full bg-amber-100/20 text-amber-200 border border-amber-500/30">
                    Allergens: {food.allergens.join(', ')}
                  </span>
                )}
              </div>

              {food.modifiers && food.modifiers.length > 0 && (
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="text-xs text-gray-300 mb-2">Extras</div>
                  <div className="flex flex-wrap gap-2">
                    {food.modifiers.map((m, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1 rounded-full bg-white/10 text-white border border-white/10"
                      >
                        {m.name} (+₾{Number(m.price).toFixed(2)})
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-2">
                    (Extras shown here; cart price doesn’t yet auto-add them in this build.)
                  </div>
                </div>
              )}

              {food.pairings && food.pairings.length > 0 && (
                <div>
                  <div className="text-sm font-bold mb-2">Recommended pairings</div>
                  <div className="flex gap-2 flex-wrap">
                    {food.pairings.map((pairing) => (
                      <span
                        key={pairing}
                        className="px-3 py-1 bg-primary/15 text-primary rounded-full text-xs font-bold border border-primary/30"
                      >
                        {pairing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 items-stretch mt-auto">
                <button
                  onClick={() => navigate('/menu')}
                  className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
                >
                  Continue Browsing
                </button>
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold transition-colors ${
                    showAddedFeedback
                      ? 'bg-green-500 text-white'
                      : 'bg-primary text-dark hover:bg-accent hover:text-white'
                  }`}
                >
                  {showAddedFeedback
                    ? '✓ Added!'
                    : qtyInCart > 0
                    ? `Add More (${qtyInCart})`
                    : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <GroupOrderSection food={food} />
      </div>
    </div>
  );
}
