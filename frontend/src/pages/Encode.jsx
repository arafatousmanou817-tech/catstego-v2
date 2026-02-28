import { useState, useCallback } from 'react';
import { ArrowLeft, Download, Send, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CatGallery from '../components/CatGallery';
import KeyStrength from '../components/KeyStrength';
import Navbar from '../components/Navbar';
import { encodeMessage } from '../utils/steganography';
import { encrypt } from '../utils/crypto';

const Encode = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: choix image, 2: message+clé, 3: résultat
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLocalImage, setIsLocalImage] = useState(false);
  const [message, setMessage] = useState('');
  const [key, setKey] = useState('');
  const [algorithm, setAlgorithm] = useState('xor');
  const [encodedImage, setEncodedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGallery, setShowGallery] = useState(true);

  const MAX_CHARS = 500;

  const handleSelectImage = useCallback((url, isLocal) => {
    setSelectedImage(url);
    setIsLocalImage(isLocal);
    setError('');
  }, []);

  const handleEncode = async () => {
    if (!selectedImage) { setError('Veuillez choisir une image'); return; }
    if (!message.trim()) { setError('Veuillez saisir un message'); return; }
    if (!key) { setError('Veuillez saisir une clé de chiffrement'); return; }

    setLoading(true);
    setError('');

    try {
      const encrypted = encrypt(message.trim(), key, algorithm);
      const result = await encodeMessage(selectedImage, encrypted);
      setEncodedImage(result);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'encodage');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = encodedImage;
    a.download = `catstego-${Date.now()}.png`;
    a.click();
  };

  const handleSendToChat = () => {
    navigate('/chat', { state: { encodedImage, fromEncode: true } });
  };

  const handleReset = () => {
    setStep(1);
    setSelectedImage(null);
    setMessage('');
    setKey('');
    setEncodedImage(null);
    setError('');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b"
           style={{ borderColor: 'rgba(255, 107, 53, 0.15)', background: 'rgba(13, 13, 13, 0.8)' }}>
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/home')}
                className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-base font-semibold text-white">Cacher un message</h2>
          <div className="flex gap-1 mt-0.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-1 rounded-full transition-all"
                   style={{
                     width: i <= step ? '20px' : '8px',
                     background: i <= step ? '#FF6B35' : 'rgba(255,255,255,0.15)'
                   }} />
            ))}
          </div>
        </div>
        <div className="ml-auto text-xs text-white/40">Étape {step}/3</div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* ÉTAPE 1 : Choisir une image */}
        {step === 1 && (
          <div className="animate-fade-in space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Choisissez un chat 🐱</h3>
              <p className="text-xs text-white/40">Cette photo servira de couverture pour votre message</p>
            </div>

            {selectedImage && (
              <div className="relative rounded-xl overflow-hidden border-2 border-primary">
                <img src={selectedImage} alt="Sélectionné" className="w-full h-40 object-cover" />
                <div className="absolute top-2 right-2 bg-black/60 rounded-full px-2 py-0.5 text-xs text-white">
                  ✓ Sélectionné
                </div>
              </div>
            )}

            <div>
              <button
                onClick={() => setShowGallery(!showGallery)}
                className="flex items-center gap-2 text-sm font-medium mb-2"
                style={{ color: '#FF6B35' }}>
                {showGallery ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showGallery ? 'Masquer la galerie' : 'Afficher la galerie'}
              </button>
              {showGallery && <CatGallery onSelect={handleSelectImage} selectedUrl={selectedImage} />}
            </div>

            {selectedImage && (
              <button onClick={() => setStep(2)} className="btn-primary">
                Continuer →
              </button>
            )}
          </div>
        )}

        {/* ÉTAPE 2 : Message + clé */}
        {step === 2 && (
          <div className="animate-fade-in space-y-4">
            <div className="relative rounded-xl overflow-hidden">
              <img src={selectedImage} alt="Choisie" className="w-full h-32 object-cover opacity-70" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock size={32} className="text-white opacity-80" />
              </div>
            </div>

            {/* Message */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-medium text-white">Message secret</label>
                <span className="text-xs text-white/40">{message.length}/{MAX_CHARS}</span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
                placeholder="Votre message secret ici..."
                rows={4}
                className="input-field resize-none"
                style={{ borderRadius: '12px' }}
              />
            </div>

            {/* Algorithme */}
            <div>
              <label className="text-sm font-medium text-white block mb-1.5">Algorithme</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'xor', label: 'XOR', desc: 'Rapide' },
                  { id: 'aes', label: 'AES-256', desc: 'Sécurisé' }
                ].map(({ id, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => setAlgorithm(id)}
                    className="p-3 rounded-xl text-left transition-all"
                    style={{
                      background: algorithm === id ? 'rgba(255, 107, 53, 0.2)' : 'rgba(42, 42, 74, 0.5)',
                      border: `1px solid ${algorithm === id ? '#FF6B35' : 'rgba(255, 107, 53, 0.2)'}`,
                      color: algorithm === id ? '#FF6B35' : 'rgba(255,255,255,0.6)'
                    }}>
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-xs opacity-70">{desc}</div>
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
                onChange={(e) => setKey(e.target.value)}
                placeholder="Mot de passe pour chiffrer"
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

            <button onClick={handleEncode} className="btn-primary" disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Encodage en cours...
                </div>
              ) : '🔒 Encoder le message'}
            </button>
          </div>
        )}

        {/* ÉTAPE 3 : Résultat */}
        {step === 3 && encodedImage && (
          <div className="animate-slide-up space-y-4">
            <div className="text-center py-2">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-base font-semibold text-white">Message caché avec succès !</h3>
              <p className="text-xs text-white/40 mt-1">Personne ne peut deviner ce qui se cache ici...</p>
            </div>

            <div className="relative rounded-2xl overflow-hidden border-2"
                 style={{ borderColor: 'rgba(255, 107, 53, 0.3)' }}>
              <img src={encodedImage} alt="Image encodée" className="w-full" />
              <div className="absolute bottom-0 left-0 right-0 p-2 text-center text-xs"
                   style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                <span style={{ color: '#FF6B35' }}>🔐 Message secret encodé en LSB</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleDownload}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                      style={{ background: 'rgba(255, 107, 53, 0.2)', border: '1px solid rgba(255, 107, 53, 0.4)' }}>
                <Download size={16} />
                Télécharger
              </button>
              <button onClick={handleSendToChat}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, #FF6B35, #E94560)' }}>
                <Send size={16} />
                Envoyer
              </button>
            </div>

            <button onClick={handleReset}
                    className="w-full py-2 text-sm text-white/40 hover:text-white/60 transition-colors">
              Recommencer
            </button>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  );
};

export default Encode;
