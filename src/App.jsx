import { Routes, Route, useLocation } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Menu from './pages/Menu';
import ARPreview from './pages/ARPreview';
import Cart from './pages/Cart';
import Confirmation from './pages/Confirmation';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import TableAccess from './pages/TableAccess';
import Navbar from './components/Navbar';

export default function App() {
  const location = useLocation();
  const showNavbar = location.pathname !== '/' && 
                     location.pathname !== '/confirmation' && 
                     !location.pathname.startsWith('/admin') &&
                     !location.pathname.startsWith('/table/');

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className={`min-h-screen ${isAdminRoute ? 'bg-gray-50' : 'bg-dark'} flex flex-col ${isAdminRoute ? '' : 'items-center'}`}>
      {showNavbar && <Navbar />}
      <div className={`${isAdminRoute ? 'w-full' : 'w-full max-w-md'} flex-1 flex flex-col`}>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/ar/:id" element={<ARPreview />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/table/:qrCode" element={<TableAccess />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>
    </div>
  );
}
