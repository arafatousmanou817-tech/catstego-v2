import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const PhoneFrame = ({ children }) => {
  const socketCtx = useSocket();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center"
         style={{ background: 'radial-gradient(ellipse at center, #1A1A2E 0%, #0D0D0D 70%)' }}>
      
      {/* Effets de fond */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5"
             style={{ background: 'radial-gradient(circle, #FF6B35, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5"
             style={{ background: 'radial-gradient(circle, #E94560, transparent)' }} />
      </div>

      <div className="relative w-full flex flex-col items-center">
        {/* Phone Frame - Hidden on mobile */}
        <div className="phone-frame w-full max-w-sm hidden md:flex flex-col"
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
            {/* Only render children if not on mobile */}
            <div className="hidden md:block h-full">
              {children}
            </div>
          </div>
        </div>

        {/* Contenu direct sur mobile */}
        <div className="md:hidden w-full h-full" style={{ height: 'min(812px, calc(100vh - 0.5rem))' }}>
          {/* Only render children on mobile */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default PhoneFrame;
