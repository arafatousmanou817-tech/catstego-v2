import { useNavigate } from 'react-router-dom';
import { X, MessageCircle, Lock } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const Toast = ({ toast, onClose }) => {
  const navigate = useNavigate();
  const isImage = toast.type === 'catstego_image';
  const initials = toast.senderName.slice(0, 2).toUpperCase();

  const handleClick = () => {
    onClose(toast.id);
    navigate('/chat', { state: { selectedContact: {
      id: toast.senderId,
      username: toast.senderName,
      avatar_color: toast.senderColor
    }}});
  };

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl shadow-2xl cursor-pointer"
      style={{
        background: 'rgba(22, 33, 62, 0.97)',
        border: '1px solid rgba(255, 107, 53, 0.3)',
        backdropFilter: 'blur(12px)',
        animation: 'slideDown 0.3s ease-out',
        minWidth: '260px',
        maxWidth: '320px'
      }}
      onClick={handleClick}
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 relative"
           style={{ background: toast.senderColor }}>
        {initials}
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2"
             style={{ borderColor: '#16213E' }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-semibold text-white truncate">{toast.senderName}</span>
          <span className="text-xs text-white/30 flex-shrink-0">maintenant</span>
        </div>
        <p className="text-xs text-white/60 truncate flex items-center gap-1">
          {isImage ? (
            <><Lock size={10} style={{ color: '#FF6B35', flexShrink: 0 }} /> Image CatStego</>
          ) : (
            <><MessageCircle size={10} className="flex-shrink-0 text-white/30" /> {toast.content}</>
          )}
        </p>
      </div>

      {/* Close */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(toast.id); }}
        className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0 p-0.5">
        <X size={14} />
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const { toasts, removeToast } = useNotifications() || {};
  if (!toasts?.length) return null;

  return (
    <div
      className="fixed top-4 left-1/2 z-[9999] flex flex-col gap-2"
      style={{ transform: 'translateX(-50%)', pointerEvents: 'none' }}
    >
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
      {toasts.map(toast => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <Toast toast={toast} onClose={removeToast} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
