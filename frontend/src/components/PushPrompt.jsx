import { useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';

const PushPrompt = ({ onAllow, onDismiss }) => {
  const [loading, setLoading] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    await onAllow();
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 mx-2 mt-2 rounded-2xl"
         style={{
           background: 'rgba(255, 107, 53, 0.1)',
           border: '1px solid rgba(255, 107, 53, 0.3)',
           animation: 'slideDown 0.3s ease-out'
         }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: 'rgba(255, 107, 53, 0.2)' }}>
        <Bell size={16} style={{ color: '#FF6B35' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white">Activer les notifications</p>
        <p className="text-xs text-white/40">Soyez alerté même quand l'app est fermée</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handleAllow}
          disabled={loading}
          className="px-2.5 py-1 rounded-xl text-xs font-semibold transition-all"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #E94560)', color: 'white' }}>
          {loading ? '...' : 'Activer'}
        </button>
        <button
          onClick={onDismiss}
          className="p-1 text-white/30 hover:text-white/60 transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default PushPrompt;
