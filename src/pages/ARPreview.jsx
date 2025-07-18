import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import foods from '../store/foods';
import useCart from '../store/useCart';

// MVP Group Order section (simulated)
function GroupOrderSection({ food }) {
  const [tableCode, setTableCode] = React.useState(() => sessionStorage.getItem('tableCode') || '');
  const [joinInput, setJoinInput] = React.useState('');
  const [joined, setJoined] = React.useState(!!tableCode);
  function generateCode() {
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    sessionStorage.setItem('tableCode', code);
    setTableCode(code);
    setJoined(true);
  }
  function joinTable() {
    if (joinInput) {
      sessionStorage.setItem('tableCode', joinInput.toUpperCase());
      setTableCode(joinInput.toUpperCase());
      setJoined(true);
    }
  }
  return (
    <div className="my-2 w-full flex flex-col items-center">
      {joined ? (
        <div className="text-sm text-accent mb-1">Table Code: <span className="font-bold">{tableCode}</span></div>
      ) : (
        <>
          <button onClick={generateCode} className="mb-1 px-3 py-1 bg-accent text-white rounded-full text-xs">Share Table Code</button>
          <div className="flex items-center gap-1">
            <input value={joinInput} onChange={e => setJoinInput(e.target.value)} placeholder="Enter code" className="px-2 py-1 rounded text-xs bg-muted text-white" />
            <button onClick={joinTable} className="px-2 py-1 bg-primary text-dark rounded text-xs">Join</button>
          </div>
        </>
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

        {/* 1. Simulated AR Table Placement */}
        <button
          className="mt-4 mb-2 px-4 py-2 bg-primary text-dark rounded-lg font-bold shadow-soft hover:bg-accent transition-colors"
          onClick={() => alert('Pretend you can place this dish on your table using AR! (Full AR anchors coming soon)')}
        >
          Place on Table (AR)
        </button>

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
