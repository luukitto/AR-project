import { Link, useLocation } from 'react-router-dom';
import useCart from '../store/useCart';

export default function Navbar() {
  const { cart } = useCart();
  const location = useLocation();
  return (
    <nav className="w-full max-w-md mx-auto flex items-center justify-between px-4 py-3 bg-card shadow-soft rounded-b-xl z-20">
      <Link to="/menu" className="font-bold text-primary text-lg tracking-wide">🍽️ Georgian Food</Link>
      <Link to="/cart" className="relative">
        <span className="material-icons text-2xl align-middle">shopping_cart</span>
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-accent text-xs rounded-full px-2 py-0.5 font-semibold">{cart.reduce((a, i) => a + i.qty, 0)}</span>
        )}
      </Link>
    </nav>
  );
}
