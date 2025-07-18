import { Routes, Route, useLocation } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Menu from './pages/Menu';
import ARPreview from './pages/ARPreview';
import Cart from './pages/Cart';
import Confirmation from './pages/Confirmation';
import Navbar from './components/Navbar';

export default function App() {
  const location = useLocation();
  const showNavbar = location.pathname !== '/' && location.pathname !== '/confirmation';

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center">
      {showNavbar && <Navbar />}
      <div className="w-full max-w-md flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/ar/:id" element={<ARPreview />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/confirmation" element={<Confirmation />} />
        </Routes>
      </div>
    </div>
  );
}
