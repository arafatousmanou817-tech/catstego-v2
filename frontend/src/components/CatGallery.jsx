import { useState, useEffect } from 'react';
import { RefreshCw, Upload } from 'lucide-react';

const fetchAsBase64 = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve(ev.target.result);
    reader.readAsDataURL(blob);
  });
};

const CatGallery = ({ onSelect, selectedUrl }) => {
  const [cats, setCats] = useState([]); // [{base64, loading}]
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadCats = async (append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    // Créer 9 placeholders "en chargement"
    const placeholders = Array.from({ length: 9 }, () => ({ base64: null, loading: true }));

    if (append) {
      setCats(prev => [...prev, ...placeholders]);
    } else {
      setCats(placeholders);
      setLoading(false);
    }

    // Charger chaque image en parallèle et mettre à jour au fur et à mesure
    const urls = Array.from({ length: 9 }, (_, i) =>
      `https://cataas.com/cat?width=300&height=300&t=${Date.now()}-${i}-${Math.random()}`
    );

    urls.forEach(async (url, i) => {
      try {
        const base64 = await fetchAsBase64(url);
        setCats(prev => {
          const updated = [...prev];
          const idx = append ? prev.length - 9 + i : i;
          updated[idx] = { base64, loading: false };
          return updated;
        });
      } catch {
        setCats(prev => {
          const updated = [...prev];
          const idx = append ? prev.length - 9 + i : i;
          updated[idx] = { base64: null, loading: false, error: true };
          return updated;
        });
      }
    });

    if (append) setLoadingMore(false);
  };

  useEffect(() => { loadCats(); }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => onSelect(ev.target.result, true);
    reader.readAsDataURL(file);
  };

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
        {cats.map((cat, i) => (
          <div
            key={i}
            className={`cat-card aspect-square ${selectedUrl === cat.base64 ? 'selected' : ''} ${!cat.base64 ? 'animate-pulse bg-white/5' : ''}`}
            onClick={() => cat.base64 && onSelect(cat.base64, false)}>
            {cat.loading && (
              <div className="w-full h-full rounded-xl bg-white/5 animate-pulse" />
            )}
            {cat.error && (
              <div className="w-full h-full rounded-xl bg-white/5 flex items-center justify-center text-xl">😿</div>
            )}
            {cat.base64 && (
              <img
                src={cat.base64}
                alt={`Chat ${i + 1}`}
                className="w-full h-full object-cover"
              />
            )}
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
