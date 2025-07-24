import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useTableSharing from '../store/useTableSharing';

export default function TableAccess() {
  const { qrCode } = useParams();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tableInfo, setTableInfo] = useState(null);
  const [step, setStep] = useState('loading'); // loading, name-entry, joining, success

  const { joinSession, createSession, currentSession } = useTableSharing();

  useEffect(() => {
    // Check if user is already in a session
    if (currentSession) {
      navigate('/menu');
      return;
    }

    // Fetch table information from QR code
    fetchTableInfo();
  }, [qrCode, currentSession, navigate]);

  const fetchTableInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/tables/qr/${qrCode}`);
      
      if (!response.ok) {
        throw new Error('Invalid QR code or table not found');
      }

      const data = await response.json();
      setTableInfo(data);
      setStep('name-entry');
    } catch (err) {
      setError(err.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTable = async (e) => {
    e.preventDefault();
    
    if (!customerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setStep('joining');
    setError('');

    try {
      // Check if there's an active session for this table
      const response = await fetch(`http://localhost:3001/api/tables/${tableInfo.id}/active-session`);
      
      if (response.ok) {
        // Active session exists, join it
        const sessionData = await response.json();
        await joinSession(sessionData.sessionId, customerName.trim());
      } else {
        // No active session, create a new one
        await createSession(tableInfo.table_number, customerName.trim(), `Table ${tableInfo.table_number} Session`);
      }

      setStep('success');
      
      // Redirect to menu after a brief success message
      setTimeout(() => {
        navigate('/menu');
      }, 2000);

    } catch (err) {
      setError(err.message || 'Failed to join table');
      setStep('name-entry');
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-soft p-8 max-w-md w-full text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Loading Table...</h2>
          <p className="text-gray-300">Please wait while we connect you to your table</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-soft p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Table Not Found</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-dark font-bold rounded-xl px-6 py-3 hover:bg-accent transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (step === 'joining') {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-soft p-8 max-w-md w-full text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Joining Table...</h2>
          <p className="text-gray-300">Setting up your dining experience</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-soft p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Welcome to Table {tableInfo?.table_number}!</h2>
          <p className="text-gray-300 mb-4">You're all set, {customerName}!</p>
          <p className="text-sm text-gray-400">Redirecting to menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-soft p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🪑</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome to Table {tableInfo?.table_number}
          </h1>
          <p className="text-gray-300">
            Capacity: {tableInfo?.capacity} people
          </p>
        </div>

        <form onSubmit={handleJoinTable} className="space-y-6">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-3 bg-muted border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-400"
              placeholder="Enter your name"
              required
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">
              This helps us identify your orders and share them with your table
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary text-dark font-bold rounded-xl py-3 shadow-soft hover:bg-accent transition-colors"
          >
            Join Table & Start Ordering
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            By joining this table, you'll be able to share orders with other diners and track your food in real-time
          </p>
        </div>
      </div>
    </div>
  );
}
