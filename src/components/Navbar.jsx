import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useCart from '../store/useCart';
import useTableSharing from '../store/useTableSharing';
import NotificationSettings from './NotificationSettings';
import SessionManager from './SessionManager';
import socketService from '../services/socket';

export default function Navbar() {
  const { cart } = useCart();
  const { currentSession, customerName } = useTableSharing();
  const location = useLocation();
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState({ enabled: false });

  useEffect(() => {
    // Update notification status
    const updateStatus = () => {
      const status = socketService.getNotificationStatus();
      setNotificationStatus(status);
    };

    updateStatus();
    // Update status periodically
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <nav className="w-full max-w-md mx-auto flex items-center justify-between px-4 py-3 bg-card shadow-soft rounded-b-xl z-20">
        <Link to="/menu" className="font-bold text-primary text-lg tracking-wide">🍽️ Georgian Food</Link>
        
        <div className="flex items-center space-x-3">
          {/* Table Session Indicator */}
          {currentSession && (
            <button
              onClick={() => setShowSessionManager(true)}
              className="relative p-2 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all duration-200"
              title={`Table ${currentSession.tableNumber} - ${customerName}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {currentSession.tableNumber?.replace('T', '')}
              </div>
            </button>
          )}

          {/* Notification Bell */}
          <button
            onClick={() => setShowNotificationSettings(true)}
            className={`relative p-2 rounded-full transition-all duration-200 ${
              notificationStatus.enabled 
                ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title={notificationStatus.enabled ? 'Notifications enabled' : 'Enable notifications'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            
            {/* Notification indicator */}
            {notificationStatus.enabled && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </button>

          {/* Cart */}
          <Link to="/cart" className="relative p-2">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
            </svg>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full px-2 py-0.5 font-semibold min-w-[20px] text-center">
                {cart.reduce((a, i) => a + i.qty, 0)}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* Notification Settings Modal */}
      <NotificationSettings 
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />

      {/* Session Manager Modal */}
      <SessionManager 
        isOpen={showSessionManager}
        onClose={() => setShowSessionManager(false)}
      />
    </>
  );
}
