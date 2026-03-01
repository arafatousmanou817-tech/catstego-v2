import { useState, useEffect } from 'react';
import { RefreshCw, Upload } from 'lucide-react';

const CatGallery = ({ onSelect, selectedUrl }) => {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const generateCatUrls = (count = 9) => {
    return Array.from({ length: count }, (_, i) => 
      `https://cataas.com/cat?width=300&height=300&t=${Date.now()}-${i}-${Math.random()}`
    );
  };

  const loadCats = async (append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    const newUrls = generateCatUrls(9);
    
    if (append) {
      setCats(prev => [...prev, ...newUrls]);
      setLoadingMore(false);
    } else {
      setCats(newUrls);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCats();
  }, []);

  // Convertir l'URL cataas en base64 immédiatement pour éviter qu'un chat différent
  // soit rechargé lors de l'encodage (cataas retourne un chat aléatoire à chaque requête)
  const handleCatSelect = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = (ev) => onSelect(ev.target.result, false);
      reader.readAsDataURL(blob);
    } catch {
      // fallback : passer l'URL directement
      onSelect(url, false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => onSelect(ev.target.result, true);
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Upload local */}
      <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed cursor-pointer transition-all hover:border-primary"
             style={{ borderColor: 'rgba(255, 107, 53, 0.3)', background: 'rgba(255, 107, 53, 0.05)' }}>
        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        <Upload size={18} style={{ color: '#FF6B35' }} />
        <div>
          <p className="text-sm font-medium text-white">Importer depuis ma galerie</p>
          <p className="text-xs text-white/40">PNG, JPG, WEBP acceptés</p>
        </div>
      </label>

      {/* Grille de chats */}
      <div className="grid grid-cols-3 gap-2">
        {cats.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className={`cat-card aspect-square ${selectedUrl === url ? 'selected' : ''}`}
            onClick={() => handleCatSelect(url)}>
            <img
              src={url}
              alt={`Chat ${i + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.src = `https://cataas.com/cat?t=${Date.now()}-retry-${i}`;
              }}
            />
          </div>
        ))}
      </div>

      {/* Boutons */}
      <div className="flex gap-2">
        <button
          onClick={() => loadCats(false)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'rgba(255, 107, 53, 0.1)', color: '#FF6B35', border: '1px solid rgba(255, 107, 53, 0.2)' }}>
          <RefreshCw size={14} />
          Nouveaux chats
        </button>
        <button
          onClick={() => loadCats(true)}
          disabled={loadingMore}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'rgba(255, 107, 53, 0.1)', color: '#FF6B35', border: '1px solid rgba(255, 107, 53, 0.2)' }}>
          {loadingMore ? '...' : '+ Voir plus'}
        </button>
      </div>
    </div>
  );
};

export default CatGallery;
