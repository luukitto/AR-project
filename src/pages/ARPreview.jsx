import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import foods from '../store/foods';
import useCart from '../store/useCart';
import useTableSharing from '../store/useTableSharing';

// AR Placement Button Component
function ARPlacementButton({ food }) {
  const [isARSupported, setIsARSupported] = React.useState(false);
  const [isPlacing, setIsPlacing] = React.useState(false);
  const modelViewerRef = React.useRef(null);

  React.useEffect(() => {
    // Check if AR is supported
    const checkARSupport = async () => {
      if ('xr' in navigator) {
        try {
          const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
          setIsARSupported(isSupported);
        } catch (error) {
          console.log('WebXR not supported:', error);
          // Fallback to checking for iOS AR Quick Look
          setIsARSupported(/iPad|iPhone|iPod/.test(navigator.userAgent));
        }
      } else {
        // Fallback for iOS Safari
        setIsARSupported(/iPad|iPhone|iPod/.test(navigator.userAgent));
      }
    };
    
    checkARSupport();
  }, []);

  const handleARPlacement = async () => {
    setIsPlacing(true);
    
    try {
      if (modelViewerRef.current) {
        // For iOS devices, this will trigger AR Quick Look
        // For Android devices with WebXR support, this will start AR session
        const modelViewer = modelViewerRef.current;
        
        if (modelViewer.canActivateAR) {
          await modelViewer.activateAR();
        } else {
          // Fallback: Create a temporary model-viewer for AR
          const tempViewer = document.createElement('model-viewer');
          tempViewer.src = food.id === 'khachapuri' ? '/Popcorn.glb' : '/default-food-model.glb';
          tempViewer.iosSrc = food.id === 'khachapuri' ? '/AR-Code-Object-Capture-app-1752752575.usdz' : '/default-food-model.usdz';
          tempViewer.ar = true;
          tempViewer.arModes = 'webxr scene-viewer quick-look';
          tempViewer.style.display = 'none';
          
          document.body.appendChild(tempViewer);
          
          // Wait for model to load then activate AR
          tempViewer.addEventListener('load', async () => {
            try {
              await tempViewer.activateAR();
            } catch (error) {
              console.error('AR activation failed:', error);
              alert('AR not available on this device. Please try on a compatible mobile device.');
            } finally {
              document.body.removeChild(tempViewer);
            }
          });
        }
      }
    } catch (error) {
      console.error('AR placement error:', error);
      alert('AR placement failed. Make sure you\'re using a compatible device and have camera permissions.');
    } finally {
      setIsPlacing(false);
    }
  };

  const handleFallbackPlacement = () => {
    // Show instructions for manual AR placement
    alert(`To place ${food.name} in AR:\n\n1. Point your camera at a flat surface\n2. Tap to place the 3D model\n3. Move around to see it from different angles\n\nNote: This requires a compatible AR device (iPhone 6s+ or Android with ARCore)`);
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
          <>
            📱 {isARSupported ? 'Place on Table (AR)' : 'AR Instructions'}
          </>
        )}
      </button>
      
      {isARSupported && (
        <p className="text-xs text-gray-400 text-center max-w-xs">
          Point your camera at a flat surface and tap to place {food.name} in your space
        </p>
      )}
      
      {/* Hidden model-viewer for AR functionality */}
      <model-viewer
        ref={modelViewerRef}
        src={food.id === 'khachapuri' ? '/Popcorn.glb' : '/default-food-model.glb'}
        ios-src={food.id === 'khachapuri' ? '/AR-Code-Object-Capture-app-1752752575.usdz' : '/default-food-model.usdz'}
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

// Full Table Sharing Component
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
    restoreSession
  } = useTableSharing();

  const { cart } = useCart();
  const [showJoinForm, setShowJoinForm] = React.useState(false);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [joinCode, setJoinCode] = React.useState('');
  const [hostName, setHostName] = React.useState('');
  const [tableNumber, setTableNumber] = React.useState('T01');
  const [sessionName, setSessionName] = React.useState('');

  // Restore session on component mount
  React.useEffect(() => {
    restoreSession();
  }, []);

  // Share cart when it changes
  React.useEffect(() => {
    if (currentSession && customerName && cart.length > 0) {
      shareCart(cart);
    }
  }, [cart, currentSession, customerName]);

  const handleCreateSession = async () => {
    if (!hostName.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      await createSession(tableNumber, hostName.trim(), sessionName.trim() || null);
      setShowCreateForm(false);
    } catch (error) {
      alert(`Failed to create session: ${error.message}`);
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
    } catch (error) {
      alert(`Failed to join session: ${error.message}`);
    }
  };

  const handleLeaveSession = () => {
    if (confirm('Are you sure you want to leave this table session?')) {
      leaveSession();
    }
  };

  const handleEndSession = async () => {
    if (confirm('Are you sure you want to end this session for everyone?')) {
      try {
        await endSession();
      } catch (error) {
        alert(`Failed to end session: ${error.message}`);
      }
    }
  };

  // If in a session, show session info
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
          {isHost && (
            <div className="text-xs text-primary mt-1">👑 You are the host</div>
          )}
        </div>

        {/* Customers in session */}
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

        {/* Session orders summary */}
        {sessionOrders.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Recent orders ({sessionOrders.length}):</div>
            <div className="max-h-20 overflow-y-auto">
              {sessionOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="text-xs text-white mb-1">
                  <span className="font-bold">{order.customer_name}</span>: ₾{order.total_amount}
                  <span className={`ml-2 px-1 rounded text-xs ${
                    order.status === 'pending' ? 'bg-yellow-600' :
                    order.status === 'confirmed' ? 'bg-blue-600' :
                    order.status === 'ready' ? 'bg-green-600' : 'bg-gray-600'
                  }`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
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
            <button onClick={clearError} className="ml-2 underline">Dismiss</button>
          </div>
        )}
      </div>
    );
  }

  // If not in a session, show join/create options
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

      {/* Create Session Form */}
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

      {/* Join Session Form */}
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
          <button onClick={clearError} className="ml-2 underline">Dismiss</button>
        </div>
      )}
    </div>
  );
}

// MVP Feedback section
function FeedbackSection({ foodId }) {
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  function submit() {
    // Store feedback in localStorage (MVP)
    const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '{}');
    feedbacks[foodId] = { rating, comment };
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
    setSubmitted(true);
  }
  if (submitted) return <div className="mt-4 text-green-400">Thank you for your feedback!</div>;
  return (
    <div className="mt-4 w-full flex flex-col items-center">
      <div className="flex gap-1 mb-1">
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => setRating(n)} className={n <= rating ? 'text-yellow-400' : 'text-gray-500'}>★</button>
        ))}
      </div>
      <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." className="w-48 px-2 py-1 rounded bg-muted text-white text-xs mb-1" />
      <button onClick={submit} className="px-3 py-1 bg-primary text-dark rounded text-xs">Submit</button>
    </div>
  );
}

export default function ARPreview() {
  const { id } = useParams();
  const food = foods.find(f => f.id === id);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  if (!food) return <div className="p-8 text-center">Food not found</div>;
  return (
    <div className="flex flex-col min-h-screen bg-dark">
      <div className="flex items-center justify-between px-4 py-3 bg-card shadow-soft">
        <button onClick={() => navigate(-1)} className="text-primary font-bold">← Back</button>
        <span className="font-bold text-lg font-georgian">{food.name}</span>
        <span></span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-72 h-72 bg-muted rounded-2xl flex items-center justify-center shadow-soft relative">
          {/* AR Model Preview */}
          {food.id === 'khachapuri' ? (
            <model-viewer
              src="/Popcorn.glb"
              ios-src="/AR-Code-Object-Capture-app-1752752575.usdz"
              ar
              ar-modes="webxr scene-viewer quick-look"
              camera-controls
              auto-rotate
              alt="Khachapuri AR Preview"
              style={{ width: '100%', height: '100%', background: 'transparent', borderRadius: '1rem' }}
            >
            </model-viewer>
          ) : (
            <img src={food.image} alt={food.name} className="w-48 h-48 object-contain drop-shadow-2xl" style={{filter:'brightness(1.1)'}} />
          )}
          <span className="absolute bottom-2 right-3 text-xs text-white bg-dark/60 px-2 py-1 rounded-md">AR Preview</span>
        </div>

        {/* 1. AR Table Placement */}
        <ARPlacementButton food={food} />

        {/* 2. Group Ordering: Share/Join Table Code */}
        <GroupOrderSection food={food} />

        {/* 3. Pairing Suggestions */}
        {food.pairings && food.pairings.length > 0 && (
          <div className="mt-4 w-full">
            <div className="font-bold text-accent mb-2">Recommended Pairings:</div>
            <div className="flex flex-wrap gap-2">
              {food.pairings.map(pid => {
                const pair = foods.find(f => f.id === pid);
                return pair ? (
                  <button
                    key={pid}
                    onClick={() => navigate(`/ar/${pid}`)}
                    className="bg-muted text-white px-3 py-1 rounded-full shadow-soft hover:bg-primary transition-colors font-georgian"
                  >
                    {pair.name}
                  </button>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* 4. Live Feedback & Instant Ratings */}
        <FeedbackSection foodId={food.id} />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <button
          className="w-full bg-primary text-dark font-bold rounded-xl py-3 shadow-soft hover:bg-accent transition-colors"
          onClick={() => { addToCart(food); navigate('/cart'); }}
        >
          Add to Cart • ₾{food.price.toFixed(2)}
        </button>
      </div>
    </div>
  );
}
