import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const PhoneFrame = ({ children }) => {
  const { user } = useAuth();
  const socketCtx = useSocket();
  const connected = socketCtx?.connected;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4"
         style={{ background: 'radial-gradient(ellipse at center, #1A1A2E 0%, #0D0D0D 70%)' }}>
      
      {/* Effets de fond */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5"
             style={{ background: 'radial-gradient(circle, #FF6B35, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5"
             style={{ background: 'radial-gradient(circle, #E94560, transparent)' }} />
      </div>

      <div className="relative w-full flex flex-col items-center">
        {/* Logo desktop */}
        <div className="hidden lg:flex items-center gap-3 mb-6">
          <span className="text-4xl animate-cat-bounce">🐱</span>
          <div>
            <h1 className="text-2xl font-bold gradient-text">CatStego V2</h1>
            <p className="text-xs text-white/40">Messages secrets cachés dans des chats</p>
          </div>
          {user && (
            <div className="ml-8 flex items-center gap-2 text-sm text-white/50">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span>{connected ? 'En ligne' : 'Hors ligne'}</span>
            </div>
          )}
        </div>

        {/* Phone Frame */}
        <div className="phone-frame w-full max-w-sm"
             style={{ height: 'min(812px, calc(100vh - 2rem))' }}>
          
          {/* Notch */}
          <div className="phone-notch">
            <div className="flex items-center justify-center h-full gap-2">
              <div className="w-16 h-1.5 bg-gray-700 rounded-full" />
              <div className="w-3 h-3 bg-gray-700 rounded-full" />
            </div>
          </div>

          {/* Contenu */}
          <div className="h-full overflow-hidden" style={{ height: 'calc(100% - 28px)' }}>
            {children}
          </div>
        </div>

        {/* Indicateurs latéraux desktop */}
        <div className="hidden lg:flex gap-8 mt-6 text-xs text-white/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/60" />
            <span>Chiffrement LSB + AES-256</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent/60" />
            <span>100% local, aucun cloud</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneFrame;
