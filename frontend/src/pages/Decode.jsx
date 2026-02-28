import { useState } from 'react';
import { ArrowLeft, Upload, Eye, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KeyStrength from '../components/KeyStrength';
import Navbar from '../components/Navbar';
import { decodeMessage } from '../utils/steganography';
import { decrypt } from '../utils/crypto';

const Decode = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [key, setKey] = useState('');
  const [algorithm, setAlgorithm] = useState('xor');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target.result);
      setImageFile(file);
      setResult('');
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target.result);
      setResult('');
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleDecode = async () => {
    if (!image) { setError('Veuillez charger une image'); return; }
    if (!key) { setError('Veuillez saisir la clé de déchiffrement'); return; }

    setLoading(true);
    setError('');
    setResult('');

    try {
      const extracted = await decodeMessage(image);
      const decrypted = decrypt(extracted, key, algorithm);
      setResult(decrypted);
    } catch (err) {
      setError(err.message || 'Impossible de décoder ce message');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b"
           style={{ borderColor: 'rgba(255, 107, 53, 0.15)', background: 'rgba(13, 13, 13, 0.8)' }}>
        <button onClick={() => navigate('/home')}
                className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-base font-semibold text-white">Révéler un message</h2>
          <p className="text-xs text-white/40">Décodez une image CatStego</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Zone de dépôt */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="relative"
          style={{ minHeight: '160px' }}>
          
          {image ? (
            <div className="relative rounded-2xl overflow-hidden border-2"
                 style={{ borderColor: 'rgba(255, 107, 53, 0.4)' }}>
              <img src={image} alt="À décoder" className="w-full max-h-48 object-cover" />
              <label className="absolute top-2 right-2 cursor-pointer bg-black/60 rounded-full px-2 py-1 text-xs text-white hover:bg-black/80 transition-all">
                <input type="file" accept="image/png" onChange={handleFileUpload} className="hidden" />
                Changer
              </label>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-40 rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:border-primary"
                   style={{ borderColor: 'rgba(255, 107, 53, 0.3)', background: 'rgba(255, 107, 53, 0.03)' }}>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <Upload size={32} className="mb-3 text-white/30" />
              <p className="text-sm font-medium text-white/60">Déposer une image ici</p>
              <p className="text-xs text-white/30 mt-1">ou cliquer pour choisir</p>
              <p className="text-xs text-white/20 mt-1">(PNG recommandé)</p>
            </label>
          )}
        </div>

        {/* Algorithme */}
        <div>
          <label className="text-sm font-medium text-white block mb-1.5">Algorithme utilisé</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'xor', label: 'XOR' },
              { id: 'aes', label: 'AES-256' }
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setAlgorithm(id)}
                className="p-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: algorithm === id ? 'rgba(255, 107, 53, 0.2)' : 'rgba(42, 42, 74, 0.5)',
                  border: `1px solid ${algorithm === id ? '#FF6B35' : 'rgba(255, 107, 53, 0.2)'}`,
                  color: algorithm === id ? '#FF6B35' : 'rgba(255,255,255,0.6)'
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Clé */}
        <div>
          <label className="text-sm font-medium text-white block mb-1.5">Clé secrète</label>
          <input
            type="text"
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(''); }}
            placeholder="Saisissez la clé de déchiffrement"
            className="input-field"
          />
          <div className="mt-2">
            <KeyStrength keyValue={key} />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl text-sm text-center"
               style={{ background: 'rgba(233, 69, 96, 0.15)', color: '#E94560', border: '1px solid rgba(233, 69, 96, 0.3)' }}>
            {error}
          </div>
        )}

        <button onClick={handleDecode} className="btn-primary" disabled={loading || !image}>
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Décodage...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Eye size={16} />
              Révéler le message caché
            </div>
          )}
        </button>

        {/* Résultat */}
        {result && (
          <div className="animate-slide-up p-4 rounded-2xl"
               style={{ background: 'rgba(255, 107, 53, 0.1)', border: '1px solid rgba(255, 107, 53, 0.3)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="text-lg">🔓</div>
                <span className="text-sm font-semibold" style={{ color: '#FF6B35' }}>Message révélé</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ 
                  background: copied ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 107, 53, 0.2)',
                  color: copied ? '#4CAF50' : '#FF6B35'
                }}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
            <div className="p-3 rounded-xl text-sm text-white leading-relaxed"
                 style={{ background: 'rgba(0, 0, 0, 0.3)', fontFamily: 'monospace' }}>
              {result}
            </div>
            <p className="text-xs text-white/30 mt-2 text-center">
              Algorithme : {algorithm.toUpperCase()} • {result.length} caractères
            </p>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  );
};

export default Decode;
