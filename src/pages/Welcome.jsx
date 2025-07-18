import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark text-white px-6">
      <div className="flex flex-col items-center gap-6 w-full max-w-xs">
        <img src="/logo-ar-menu.svg" alt="App Logo" className="w-24 h-24 rounded-full shadow-soft bg-card" />
        <h1 className="text-3xl font-bold font-georgian">Georgian Food House</h1>
        <p className="text-md opacity-80 text-center font-georgian">Discover, preview, and order authentic Georgian food with AR!</p>
        <button
          className="mt-6 bg-primary text-dark font-bold rounded-xl px-8 py-3 shadow-soft hover:bg-accent transition-colors"
          onClick={() => navigate('/menu')}
        >
          Start AR Experience
        </button>
      </div>
    </div>
  );
}
