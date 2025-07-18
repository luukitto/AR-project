import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function randomOrderId() {
  return Math.floor(100000 + Math.random() * 900000);
}

export default function Confirmation() {
  const [orderId] = useState(randomOrderId());
  const [eta] = useState(() => Math.floor(20 + Math.random() * 20));
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/'), 9000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark text-white px-6">
      <div className="bg-card rounded-2xl shadow-soft p-8 flex flex-col items-center gap-4">
        <span className="text-5xl">🧑‍🍳</span>
        <h2 className="text-2xl font-bold font-georgian">A waiter is on the way!</h2>
        <div className="text-lg text-center">Thank you for your order. A waiter has been notified and will be with you shortly to assist you. If you need anything else, please let us know!</div>
        <button className="mt-4 text-accent underline" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    </div>
  );
}
