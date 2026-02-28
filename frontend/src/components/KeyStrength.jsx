import { getKeyStrength, getStrengthLabel } from '../utils/crypto';

const KeyStrength = ({ keyValue }) => {
  if (!keyValue) return null;
  
  const score = getKeyStrength(keyValue);
  const { label, color } = getStrengthLabel(score);

  const isEasterEgg = keyValue.toLowerCase() === 'meow';

  return (
    <div className="space-y-1.5">
      {/* Barres de force */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="strength-bar flex-1"
            style={{
              background: i < score ? color : 'rgba(255,255,255,0.1)',
              height: '4px',
              borderRadius: '2px',
              transition: 'background 0.3s'
            }}
          />
        ))}
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color }}>
          {isEasterEgg ? '🐱 Mot de passe meow !' : label}
        </span>
        {keyValue.length > 0 && (
          <span className="text-xs text-white/30">{keyValue.length} caractères</span>
        )}
      </div>
      
      {isEasterEgg && (
        <div className="text-xs text-center py-2 rounded-lg"
             style={{ background: 'rgba(255, 107, 53, 0.15)', color: '#FF6B35' }}>
          🎉 Easter egg activé ! Les chats approuvent votre clé
        </div>
      )}
    </div>
  );
};

export default KeyStrength;
