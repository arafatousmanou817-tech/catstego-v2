import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!form.username || !form.email || !form.password || !form.confirm) {
      return 'Veuillez remplir tous les champs';
    }
    if (form.username.length < 3) return 'Nom d\'utilisateur trop court (min. 3 caractères)';
    if (form.password.length < 6) return 'Mot de passe trop court (min. 6 caractères)';
    if (form.password !== form.confirm) return 'Les mots de passe ne correspondent pas';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return 'Email invalide';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password
      });
      login(data.token, data.user);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto"
         style={{ background: 'linear-gradient(180deg, #0f0f1a 0%, #1A1A2E 100%)' }}>
      
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="mb-6 text-center">
          <div className="text-5xl mb-3">🐾</div>
          <h2 className="text-2xl font-bold gradient-text">Créer un compte</h2>
          <p className="text-sm text-white/40 mt-1">Rejoignez la communauté CatStego</p>
        </div>

        <div className="w-full max-w-xs space-y-4">
          {error && (
            <div className="p-3 rounded-xl text-sm text-center"
                 style={{ background: 'rgba(233, 69, 96, 0.15)', color: '#E94560', border: '1px solid rgba(233, 69, 96, 0.3)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                name="username"
                type="text"
                placeholder="Nom d'utilisateur"
                value={form.username}
                onChange={handleChange}
                className="input-field pl-10"
                autoComplete="username"
              />
            </div>

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

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mot de passe (min. 6 caractères)"
                value={form.password}
                onChange={handleChange}
                className="input-field pl-10 pr-10"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                name="confirm"
                type="password"
                placeholder="Confirmer le mot de passe"
                value={form.confirm}
                onChange={handleChange}
                className="input-field pl-10"
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn-primary mt-2" disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Création...
                </div>
              ) : 'Créer mon compte 🐱'}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-white/40">
              Déjà un compte ?{' '}
              <Link to="/login" className="font-semibold hover:text-white transition-colors"
                    style={{ color: '#FF6B35' }}>
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
