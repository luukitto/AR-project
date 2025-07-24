import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';
import KitchenDisplay from '../components/admin/KitchenDisplay';

export default function KitchenPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAdminStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header Bar */}
      <div className="bg-gray-800 px-6 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-orange-400">👨‍🍳 Kitchen Display System</h1>
          <div className="text-sm text-gray-400">
            Logged in as: <span className="text-white font-medium">{user.full_name}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            title="Refresh Orders"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Kitchen Display */}
      <div className="h-[calc(100vh-64px)]">
        <KitchenDisplay />
      </div>
    </div>
  );
}
