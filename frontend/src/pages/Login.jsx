import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Cat } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', form);
      login(data.token, data.user);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto" 
         style={{ background: 'linear-gradient(180deg, #0f0f1a 0%, #1A1A2E 100%)' }}>
      
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="mb-8 text-center animate-slide-up">
          <div className="text-7xl mb-4 animate-cat-bounce">🐱</div>
          <h1 className="text-3xl font-bold gradient-text mb-1">CatStego</h1>
          <p className="text-sm text-white/40">Vos secrets, cachés dans des chats</p>
        </div>

        <div className="w-full max-w-xs space-y-4 animate-fade-in">
          {error && (
            <div className="p-3 rounded-xl text-sm text-center"
                 style={{ background: 'rgba(233, 69, 96, 0.15)', color: '#E94560', border: '1px solid rgba(233, 69, 96, 0.3)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="input-field pl-10"
                autoComplete="email"
              />
            </div>

            {/* Mot de passe */}
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mot de passe"
                value={form.password}
                onChange={handleChange}
                className="input-field pl-10 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion...
                </div>
              ) : 'Se connecter 🐱'}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-white/40">
              Pas encore de compte ?{' '}
              <Link to="/register" className="font-semibold hover:text-white transition-colors"
                    style={{ color: '#FF6B35' }}>
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-4 text-center">
        <p className="text-xs text-white/20">🔒 Chiffrement AES-256 • 100% local</p>
      </div>
    </div>
  );
};

export default Login;
