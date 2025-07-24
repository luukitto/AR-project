import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTableSharing from '../store/useTableSharing';

export default function SessionManager({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { 
    currentSession, 
    customerName, 
    isHost, 
    customers, 
    leaveSession, 
    endSession 
  } = useTableSharing();

  const handleLeaveSession = async () => {
    if (!confirm('Are you sure you want to leave this table session?')) {
      return;
    }

    setLoading(true);
    try {
      leaveSession();
      navigate('/');
      onClose();
    } catch (error) {
      console.error('Error leaving session:', error);
      alert('Failed to leave session: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to end this table session for everyone?\n\nThis will disconnect all customers from the table.')) {
      return;
    }

    setLoading(true);
    try {
      await endSession();
      navigate('/');
      onClose();
    } catch (error) {
      console.error('Error ending session:', error);
      alert('Failed to end session: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !currentSession) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">🍽️ Table Session</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Session Info */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{currentSession.tableNumber}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Table {currentSession.tableNumber}</h3>
                <p className="text-sm text-gray-600">{currentSession.sessionName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isHost ? 'bg-amber-500' : 'bg-green-500'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                You are {isHost ? 'hosting' : 'joined as'}: {customerName}
              </span>
            </div>
          </div>

          {/* Customers List */}
          {customers && customers.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                People at this table ({customers.length})
              </h4>
              <div className="space-y-2">
                {customers.map((customer, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      customer.is_host ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'
                    }`}>
                      {customer.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700">
                      {customer.customer_name}
                      {customer.is_host && <span className="text-amber-600 ml-1">(Host)</span>}
                      {customer.customer_name === customerName && <span className="text-blue-600 ml-1">(You)</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Leave Session */}
          <button
            onClick={handleLeaveSession}
            disabled={loading}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Leaving...</span>
              </div>
            ) : (
              '🚪 Leave Table'
            )}
          </button>

          {/* End Session (Host Only) */}
          {isHost && (
            <button
              onClick={handleEndSession}
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Ending...</span>
                </div>
              ) : (
                '🛑 End Session for Everyone'
              )}
            </button>
          )}

          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              {isHost 
                ? 'As the host, you can end the session for everyone or just leave.'
                : 'You can leave this table session at any time.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
