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
  const [step, setStep] = useState('loading'); // loading, welcome, name-entry, joining, success
  const [nameInputFocused, setNameInputFocused] = useState(false);
  const [sessionType, setSessionType] = useState(null); // 'new' or 'existing'

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
      
      // Check if there's an active session
      const sessionResponse = await fetch(`http://localhost:3001/api/tables/${data.id}/active-session`);
      if (sessionResponse.ok) {
        setSessionType('existing');
      } else {
        setSessionType('new');
      }
      
      setStep('welcome');
    } catch (err) {
      setError(err.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    setStep('name-entry');
    // Auto-focus name input after a brief delay
    setTimeout(() => {
      const nameInput = document.getElementById('customerName');
      if (nameInput) nameInput.focus();
    }, 100);
  };

  const handleJoinTable = async (e) => {
    e.preventDefault();
    
    if (!customerName.trim()) {
      setError('Please enter your name to continue');
      return;
    }

    if (customerName.trim().length < 2) {
      setError('Please enter at least 2 characters');
      return;
    }

    setStep('joining');
    setError('');

    try {
      if (sessionType === 'existing') {
        // Join existing session
        const response = await fetch(`http://localhost:3001/api/tables/${tableInfo.id}/active-session`);
        const sessionData = await response.json();
        await joinSession(sessionData.sessionId, customerName.trim());
      } else {
        // Create new session
        await createSession(tableInfo.table_number, customerName.trim(), `Table ${tableInfo.table_number} Session`);
      }

      setStep('success');
      
      // Redirect to menu after showing success
      setTimeout(() => {
        navigate('/menu');
      }, 1500);

    } catch (err) {
      setError(err.message || 'Failed to join table');
      setStep('name-entry');
    }
  };

  // Loading State
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-white/20">
          <div className="relative mb-6">
            <div className="w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Connecting to Table</h2>
          <p className="text-gray-300 text-sm">Please wait a moment...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-red-500/30">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Oops! Something went wrong</h2>
          <p className="text-gray-300 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl px-6 py-3 hover:from-amber-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Welcome State
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-white/20">
          <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome to {tableInfo?.restaurant_name || 'Restaurant'}!
          </h1>
          
          <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                <span className="text-amber-400 font-bold text-sm">{tableInfo?.table_number}</span>
              </div>
              <div className="text-left">
                <p className="text-white font-semibold text-sm">Table {tableInfo?.table_number}</p>
                <p className="text-gray-400 text-xs">Seats up to {tableInfo?.capacity} people</p>
              </div>
            </div>
            
            {sessionType === 'existing' && (
              <div className="flex items-center justify-center space-x-2 mt-3 pt-3 border-t border-white/10">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-green-400 text-xs font-medium">Others are already dining at this table</p>
              </div>
            )}
          </div>
          
          <p className="text-gray-300 text-sm mb-6">
            {sessionType === 'existing' 
              ? 'Join your friends and start exploring our delicious menu together!' 
              : 'Get ready to explore our delicious Georgian cuisine with AR previews!'}
          </p>
          
          <button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl px-6 py-4 hover:from-amber-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Continue to Menu
          </button>
        </div>
      </div>
    );
  }

  // Name Entry State
  if (step === 'name-entry') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-white/20">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">What's your name?</h2>
            <p className="text-gray-300 text-sm">
              {sessionType === 'existing' 
                ? 'Let your friends know you\'ve joined the table' 
                : 'We\'ll use this to personalize your experience'}
            </p>
          </div>

          <form onSubmit={handleJoinTable} className="space-y-4">
            <div className="relative">
              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setError(''); // Clear error on input
                }}
                onFocus={() => setNameInputFocused(true)}
                onBlur={() => setNameInputFocused(false)}
                placeholder="Enter your name"
                className={`w-full bg-white/5 border-2 rounded-xl px-4 py-4 text-white placeholder-gray-400 transition-all duration-200 focus:outline-none ${
                  nameInputFocused || customerName 
                    ? 'border-amber-500 bg-white/10' 
                    : 'border-white/20 hover:border-white/30'
                } ${error ? 'border-red-400' : ''}`}
                maxLength={30}
                autoComplete="given-name"
              />
              {customerName && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-400 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!customerName.trim()}
              className={`w-full font-semibold rounded-xl px-6 py-4 transition-all duration-200 transform ${
                customerName.trim()
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 hover:scale-105 shadow-lg'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {sessionType === 'existing' ? 'Join Table' : 'Start Dining'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-center text-xs text-gray-400">
              Table {tableInfo?.table_number} • {tableInfo?.restaurant_name}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Joining State
  if (step === 'joining') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-white/20">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {sessionType === 'existing' ? `Welcome ${customerName}!` : `Setting up your table...`}
          </h2>
          <p className="text-gray-300 text-sm">
            {sessionType === 'existing' 
              ? 'Joining your friends at the table' 
              : 'Preparing your dining experience'}
          </p>
        </div>
      </div>
    );
  }

  // Success State
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-green-500/30">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
          <p className="text-gray-300 mb-4">Welcome to Table {tableInfo?.table_number}, {customerName}!</p>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <p className="text-green-400 text-sm font-medium">Opening menu...</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
