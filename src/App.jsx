import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Welcome from './pages/Welcome';
import Menu from './pages/Menu';
import ARPreview from './pages/ARPreview';
import Cart from './pages/Cart';
import Confirmation from './pages/Confirmation';
import OrderHistory from './pages/OrderHistory';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import KitchenPage from './pages/KitchenPage';
import TableAccess from './pages/TableAccess';
import Navbar from './components/Navbar';
import MobileUtils from './utils/mobileUtils';
import './styles/mobile.css';

export default function App() {
  const location = useLocation();
  const showNavbar = location.pathname !== '/' && 
                     location.pathname !== '/confirmation' && 
                     !location.pathname.startsWith('/admin') &&
                     !location.pathname.startsWith('/table/');

  const isAdminRoute = location.pathname.startsWith('/admin');

  // Initialize mobile utilities
  useEffect(() => {
    MobileUtils.init();
  }, []);

  return (
    <div className={`min-h-screen ${isAdminRoute ? 'bg-gray-50' : 'bg-dark'} flex flex-col ${isAdminRoute ? '' : 'items-center'} pt-safe-top pb-safe-bottom pl-safe-left pr-safe-right`}>
      {showNavbar && <Navbar />}
      <div className={`${isAdminRoute ? 'w-full' : 'w-full max-w-md'} flex-1 flex flex-col`}>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/ar/:id" element={<ARPreview />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/table/:qrCode" element={<TableAccess />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/kitchen" element={<KitchenPage />} />
        </Routes>
      </div>
    </div>
  );
}
