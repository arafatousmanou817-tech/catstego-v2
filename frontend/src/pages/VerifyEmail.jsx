import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Mail, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { addToast } = useNotifications() || {};
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Le code doit contenir 6 chiffres');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/auth/verify-email', { email, code });
      login(data.token, data.user);
      setSuccess(true);
      setTimeout(() => navigate('/home'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await axios.post('/api/auth/resend-verification', { email });
      addToast?.({ content: 'Nouveau code envoyé !', type: 'success' });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] p-4 text-center">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
              <CheckCircle size={48} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Email vérifié !</h2>
          <p className="text-white/60">Redirection vers l'accueil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Vérification</h1>
          <p className="text-white/50 text-sm">
            Entrez le code envoyé à <span className="text-primary font-medium">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/30">
                <Mail size={20} />
              </div>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="input-field pl-11 text-center text-2xl tracking-[0.5em] font-mono"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center">
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="btn-primary w-full group"
          >
            {loading ? (
              <Loader2 className="animate-spin mx-auto" size={20} />
            ) : (
              <div className="flex items-center justify-center gap-2">
                Vérifier mon compte
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-white/30">
          Vous n'avez pas reçu le code ? <button onClick={handleResend} className="text-primary hover:underline">Renvoyer</button>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
