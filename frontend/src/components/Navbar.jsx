import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Lock, Unlock, MessageCircle, Users, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { totalUnread } = useNotifications() || {};

  const tabs = [
    { path: '/home', icon: Home, label: 'Accueil' },
    { path: '/encode', icon: Lock, label: 'Cacher' },
    { path: '/decode', icon: Unlock, label: 'Révéler' },
    { path: '/chat', icon: MessageCircle, label: 'Chat', badge: totalUnread },
    { path: '/contacts', icon: Users, label: 'Contacts' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex items-center justify-around px-2 py-2 border-t"
         style={{ 
           background: 'rgba(13, 13, 13, 0.95)', 
           borderColor: 'rgba(255, 107, 53, 0.15)',
           backdropFilter: 'blur(10px)'
         }}>
      {tabs.map(({ path, icon: Icon, label, badge }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all relative"
            style={{ color: active ? '#FF6B35' : 'rgba(255,255,255,0.4)' }}>
            
            <div className="relative">
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              {badge > 0 && (
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                     style={{ background: '#E94560', fontSize: '10px' }}>
                  {badge > 9 ? '9+' : badge}
                </div>
              )}
            </div>
            <span className="text-xs font-medium" style={{ fontSize: '10px' }}>{label}</span>
            {active && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                   style={{ background: '#FF6B35' }} />
            )}
          </button>
        );
      })}

      <button
        onClick={handleLogout}
        className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all"
        style={{ color: 'rgba(255,255,255,0.4)' }}>
        <LogOut size={20} strokeWidth={1.5} />
        <span className="text-xs font-medium" style={{ fontSize: '10px' }}>Quitter</span>
      </button>
    </div>
  );
};

export default Navbar;
