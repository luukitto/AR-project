import React, { useState, useEffect } from 'react';
import socketService from '../services/socket';

export default function NotificationSettings({ isOpen, onClose }) {
  const [notificationStatus, setNotificationStatus] = useState({
    supported: false,
    permission: 'default',
    enabled: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load current notification status
    updateNotificationStatus();
  }, [isOpen]);

  const updateNotificationStatus = () => {
    const status = socketService.getNotificationStatus();
    setNotificationStatus(status);
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    setError('');

    try {
      const status = await socketService.enableNotifications();
      setNotificationStatus(status);
      
      if (status.enabled) {
        // Show success message
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = () => {
    const status = socketService.disableNotifications();
    setNotificationStatus(status);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">🔔 Notifications</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!notificationStatus.supported ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Not Supported</h3>
            <p className="text-gray-600 text-sm">
              Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Safari.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Stay Updated</h3>
              <p className="text-gray-600 text-sm mb-4">
                Get real-time notifications when your order status changes, new customers join your table, or someone shares their cart.
              </p>

              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🍽️</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Order Updates</p>
                    <p className="text-gray-600 text-xs">Know when your food is ready</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">👥</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Table Activity</p>
                    <p className="text-gray-600 text-xs">See when friends join your table</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg">
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🛒</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Cart Sharing</p>
                    <p className="text-gray-600 text-xs">Get notified of shared items</p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {notificationStatus.permission === 'denied' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="font-medium text-yellow-800 text-sm">Notifications Blocked</p>
                      <p className="text-yellow-700 text-xs mt-1">
                        Please enable notifications in your browser settings and refresh the page.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {notificationStatus.enabled ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Notifications Enabled!</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    You'll receive updates about your orders and table activity.
                  </p>
                  <button
                    onClick={handleDisableNotifications}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Disable Notifications
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEnableNotifications}
                  disabled={loading || notificationStatus.permission === 'denied'}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                    loading || notificationStatus.permission === 'denied'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 shadow-lg'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Enabling...</span>
                    </div>
                  ) : (
                    '🔔 Enable Notifications'
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
