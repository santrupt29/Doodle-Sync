import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import api from '../api/gameApi';
import Logo from '../components/Logo';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useGame();

  const [activeTab, setActiveTab] = useState('login');
  const [form, setForm] = useState({
    username: '', email: '', password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // redirect if already logged in
  if (isAuthenticated) {
    navigate('/lobby', { replace: true });
    return null;
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'register') {
        const res = await api.post('/user/auth/register', {
          username: form.username,
          email: form.email,
          password: form.password,
        });
        login(res.data.token, res.data.userId, res.data.username);
      } else {
        const res = await api.post('/user/auth/login', {
          username: form.username,
          password: form.password,
        });
        login(res.data.token, res.data.userId, res.data.username);
      }
      navigate('/lobby');
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data
        || 'Something went wrong';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };


return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <Logo size="xl" />
          <p className="text-white/90 mt-4 text-xl font-extrabold tracking-wide">
            Draw, guess, and have fun with friends!
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-card)] rounded-xl border-2 border-[var(--color-card-border)] overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
          {/* Tabs */}
          <div className="flex border-b-2 border-black">
            {['login', 'register'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setError(''); }}
                className={`
                  flex-1 py-4 text-lg font-extrabold capitalize transition-all
                  ${activeTab === tab
                    ? 'bg-white text-black'
                    : 'bg-[var(--color-card)] text-black/60 hover:bg-white/40'}
                `}
              >
                {tab === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-10 py-8">
            <div className="flex-1 space-y-6 mb-8">
              <div>
                <label className="block text-base font-extrabold text-black mb-2">
                  Username
                </label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                  className="w-full px-5 py-3 bg-white border-2 border-black rounded-lg text-base font-semibold text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  placeholder="Enter username"
                />
              </div>

              {activeTab === 'register' && (
                <div className="animate-fade-in">
                  <label className="block text-base font-extrabold text-black mb-2">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-3 bg-white border-2 border-black rounded-lg text-base font-semibold text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    placeholder="you@example.com"
                  />
                </div>
              )}

              <div>
                <label className="block text-base font-extrabold text-black mb-2">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-5 py-3 bg-white border-2 border-black rounded-lg text-base font-semibold text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-100 border-2 border-red-400 text-red-700 text-sm rounded-lg animate-fade-in font-bold text-center">
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-auto bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-50 text-white text-xl font-extrabold rounded-lg transition-all shadow-lg border-2 border-black"
            >
              {loading
                ? 'Please wait...'
                : activeTab === 'register'
                  ? 'Create Account'
                  : 'Sign In'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}