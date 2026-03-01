import { useNavigate } from 'react-router-dom';
import { Lock, Unlock, MessageCircle, Users, Shield, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const socketCtx = useSocket();
  const onlineCount = socketCtx?.onlineUsers?.length || 0;

  const initials = user?.username?.slice(0, 2).toUpperCase() || '??';

  const features = [
    {
      icon: Lock,
      title: 'Cacher un message',
      description: 'Encodez un secret dans une photo de chat',
      path: '/encode',
      gradient: 'from-orange-500 to-red-500',
      emoji: '🔒'
    },
    {
      icon: Unlock,
      title: 'Révéler un message',
      description: 'Décodez une image CatStego reçue',
      path: '/decode',
      gradient: 'from-purple-500 to-pink-500',
      emoji: '🔓'
    },
    {
      icon: MessageCircle,
      title: 'Chat secret',
      description: 'Partagez vos images encodées en temps réel',
      path: '/chat',
      gradient: 'from-blue-500 to-cyan-500',
      emoji: '💬'
    },
    {
      icon: Users,
      title: 'Contacts',
      description: 'Gérez vos agents secrets',
      path: '/contacts',
      gradient: 'from-green-500 to-teal-500',
      emoji: '👥'
    }
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3" style={{ background: 'rgba(13, 13, 13, 0.8)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold gradient-text">CatStego</h1>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${socketCtx?.connected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xs text-white/40">
                {socketCtx?.connected ? `${onlineCount} en ligne` : 'Hors ligne'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                 style={{ background: user?.avatarColor || '#FF6B35' }}>
              {initials}
            </div>
          </div>
        </div>

        {/* Bienvenue */}
        <div className="mt-3 p-3 rounded-xl"
             style={{ background: 'rgba(255, 107, 53, 0.1)', border: '1px solid rgba(255, 107, 53, 0.2)' }}>
          <p className="text-sm font-medium text-white">
            Bienvenue, <span style={{ color: '#FF6B35' }}>{user?.username}</span> 🐱
          </p>
          <p className="text-xs text-white/50 mt-0.5">
            Cachez vos secrets dans des photos de chats innocentes
          </p>
        </div>
      </div>

      {/* Features grid */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {features.map(({ icon: Icon, title, description, path, emoji }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="glass p-4 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ border: '1px solid rgba(255, 107, 53, 0.15)' }}>
              <div className="text-2xl mb-2">{emoji}</div>
              <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{description}</p>
            </button>
          ))}
        </div>

        {/* Info cards */}
        <div className="p-4 rounded-2xl"
             style={{ background: 'rgba(22, 33, 62, 0.8)', border: '1px solid rgba(255, 107, 53, 0.1)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} style={{ color: '#FF6B35' }} />
            <h3 className="text-sm font-semibold text-white">Comment ça marche ?</h3>
          </div>
          <div className="space-y-2">
            {[
              { n: '1', text: 'Choisissez une photo de chat' },
              { n: '2', text: 'Saisissez votre message secret' },
              { n: '3', text: 'Encodez avec XOR ou AES-256' },
              { n: '4', text: 'Partagez via le chat sécurisé' },
            ].map(({ n, text }) => (
              <div key={n} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                     style={{ background: 'linear-gradient(135deg, #FF6B35, #E94560)' }}>
                  {n}
                </div>
                <p className="text-xs text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Navbar />
    </div>
  );
};

export default Home;
