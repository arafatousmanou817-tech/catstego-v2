import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Image, Eye, X, Lock, Unlock, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import CatGallery from '../components/CatGallery';
import KeyStrength from '../components/KeyStrength';
import { encodeMessage, decodeMessage } from '../utils/steganography';
import { encrypt, decrypt } from '../utils/crypto';

const Avatar = ({ user, size = 34, online }) => {
  const initials = (user?.username || '??').slice(0, 2).toUpperCase();
  return (
    <div className="relative flex-shrink-0">
      <div className="rounded-full flex items-center justify-center text-white font-bold"
           style={{ width: size, height: size, background: user?.avatar_color || user?.avatarColor || '#FF6B35', fontSize: size * 0.35 }}>
        {initials}
      </div>
      {online !== undefined && (
        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${online ? 'bg-green-400' : 'bg-gray-600'}`}
             style={{ borderColor: '#0f0f1a' }} />
      )}
    </div>
  );
};

const DecodeModal = ({ image, onClose }) => {
  const [key, setKey] = useState('');
  const [algorithm, setAlgorithm] = useState('xor');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDecode = async () => {
    if (!key) { setError('Clé requise'); return; }
    setLoading(true);
    setError('');
    try {
      const extracted = await decodeMessage(image);
      const decrypted = decrypt(extracted, key, algorithm);
      setResult(decrypted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-t-3xl p-5 space-y-4"
           style={{ background: '#1A1A2E', border: '1px solid rgba(255, 107, 53, 0.3)' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Unlock size={16} style={{ color: '#FF6B35' }} />
            Décoder l'image
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <img src={image} alt="À décoder" className="w-full h-32 object-cover rounded-xl" />

        <div className="grid grid-cols-2 gap-2">
          {['xor', 'aes'].map(alg => (
            <button key={alg} onClick={() => setAlgorithm(alg)}
                    className="py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: algorithm === alg ? 'rgba(255, 107, 53, 0.2)' : 'rgba(42, 42, 74, 0.5)',
                      border: `1px solid ${algorithm === alg ? '#FF6B35' : 'rgba(255, 107, 53, 0.15)'}`,
                      color: algorithm === alg ? '#FF6B35' : 'rgba(255,255,255,0.5)'
                    }}>
              {alg.toUpperCase()}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={key}
          onChange={(e) => { setKey(e.target.value); setError(''); }}
          placeholder="Clé de déchiffrement"
          className="input-field"
          autoFocus
        />
        <KeyStrength keyValue={key} />

        {error && <p className="text-xs text-center py-2 rounded-xl"
                      style={{ background: 'rgba(233, 69, 96, 0.15)', color: '#E94560' }}>{error}</p>}

        {result ? (
          <div className="p-3 rounded-xl"
               style={{ background: 'rgba(255, 107, 53, 0.1)', border: '1px solid rgba(255, 107, 53, 0.3)' }}>
            <p className="text-xs text-white/50 mb-1">Message révélé :</p>
            <p className="text-sm text-white">{result}</p>
            <button onClick={() => { navigator.clipboard.writeText(result); }}
                    className="text-xs mt-2 px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(255, 107, 53, 0.2)', color: '#FF6B35' }}>
              Copier
            </button>
          </div>
        ) : (
          <button onClick={handleDecode} className="btn-primary" disabled={loading}>
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Décodage...
              </div>
            ) : '🔓 Révéler le message'}
          </button>
        )}
      </div>
    </div>
  );
};

const EncodeModal = ({ onClose, onSend, contact }) => {
  const [step, setStep] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [message, setMessage] = useState('');
  const [key, setKey] = useState('');
  const [algorithm, setAlgorithm] = useState('xor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEncode = async () => {
    if (!selectedImage || !message || !key) { setError('Tous les champs sont requis'); return; }
    setLoading(true);
    try {
      const encrypted = encrypt(message, key, algorithm);
      const encoded = await encodeMessage(selectedImage, encrypted);
      onSend(encoded);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-t-3xl p-5 space-y-4 overflow-y-auto"
           style={{ background: '#1A1A2E', border: '1px solid rgba(255, 107, 53, 0.3)', maxHeight: '90vh' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Lock size={16} style={{ color: '#FF6B35' }} />
            Envoyer une image CatStego à {contact?.username}
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-white/60">Choisissez un chat</p>
            {selectedImage && (
              <img src={selectedImage} alt="Sélectionné" className="w-full h-28 object-cover rounded-xl border-2 border-primary" />
            )}
            <CatGallery onSelect={(url) => setSelectedImage(url)} selectedUrl={selectedImage} />
            {selectedImage && (
              <button onClick={() => setStep(2)} className="btn-primary">Suivant →</button>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {selectedImage && (
              <img src={selectedImage} alt="Choisi" className="w-full h-20 object-cover rounded-xl opacity-60" />
            )}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message secret..."
              rows={3}
              className="input-field resize-none"
            />
            <div className="grid grid-cols-2 gap-2">
              {['xor', 'aes'].map(alg => (
                <button key={alg} onClick={() => setAlgorithm(alg)}
                        className="py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: algorithm === alg ? 'rgba(255, 107, 53, 0.2)' : 'rgba(42, 42, 74, 0.5)',
                          border: `1px solid ${algorithm === alg ? '#FF6B35' : 'rgba(255, 107, 53, 0.15)'}`,
                          color: algorithm === alg ? '#FF6B35' : 'rgba(255,255,255,0.5)'
                        }}>
                  {alg.toUpperCase()}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Clé secrète"
              className="input-field"
            />
            <KeyStrength keyValue={key} />
            {error && <p className="text-xs text-center py-2 rounded-xl"
                          style={{ background: 'rgba(233, 69, 96, 0.15)', color: '#E94560' }}>{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep(1)}
                      className="flex-1 py-2 rounded-xl text-sm font-medium text-white/50 transition-all"
                      style={{ background: 'rgba(42, 42, 74, 0.5)' }}>
                ← Retour
              </button>
              <button onClick={handleEncode} disabled={loading}
                      className="flex-1 btn-primary" style={{ borderRadius: '12px' }}>
                {loading ? '...' : '🔒 Envoyer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket() || {};

  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [showDecodeModal, setShowDecodeModal] = useState(null);
  const [showEncodeModal, setShowEncodeModal] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Charger depuis navigate state
  useEffect(() => {
    if (location.state?.selectedContact) {
      setSelectedContact(location.state.selectedContact);
    }
    if (location.state?.encodedImage && location.state?.fromEncode) {
      // Sera traité après la sélection du contact
    }
  }, [location.state]);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id);
    }
  }, [selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('receive_message', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.sender_id !== selectedContact?.id) {
        setUnreadCounts(prev => ({ ...prev, [msg.sender_id]: (prev[msg.sender_id] || 0) + 1 }));
      }
    });

    socket.on('message_sent', (msg) => {
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== msg.tempId && m.tempId !== msg.tempId);
        if (withoutTemp.some(m => m.id === msg.id)) return withoutTemp;
        return [...withoutTemp, msg];
      });
    });

    socket.on('user_typing', ({ userId }) => {
      if (userId === selectedContact?.id) setPartnerTyping(true);
    });

    socket.on('user_stop_typing', ({ userId }) => {
      if (userId === selectedContact?.id) setPartnerTyping(false);
    });

    return () => {
      socket.off('receive_message');
      socket.off('message_sent');
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, [socket, selectedContact]);

  const loadContacts = async () => {
    try {
      const { data } = await axios.get('/api/contacts');
      setContacts(data);
    } catch (err) {
      console.error('Erreur contacts:', err);
    }
  };

  const loadMessages = async (contactId) => {
    setLoadingMessages(true);
    try {
      const { data } = await axios.get(`/api/messages/${contactId}`);
      setMessages(data);
      setUnreadCounts(prev => ({ ...prev, [contactId]: 0 }));
      if (socket) socket.emit('mark_read', { senderId: contactId });
    } catch (err) {
      console.error('Erreur messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = (content, type = 'text') => {
    if (!selectedContact || !socket) return;
    const tempId = `temp-${Date.now()}`;

    const tempMsg = {
      id: tempId,
      tempId,
      sender_id: user.id,
      receiver_id: selectedContact.id,
      content,
      type,
      created_at: new Date().toISOString(),
      sender_username: user.username,
      sender_color: user.avatarColor,
      pending: true
    };

    setMessages(prev => [...prev, tempMsg]);

    socket.emit('send_message', {
      receiverId: selectedContact.id,
      content,
      type,
      tempId
    });
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim(), 'text');
    setInputText('');
    handleStopTyping();
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!isTyping && socket && selectedContact) {
      setIsTyping(true);
      socket.emit('typing', { receiverId: selectedContact.id });
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(handleStopTyping, 1500);
  };

  const handleStopTyping = () => {
    if (isTyping && socket && selectedContact) {
      setIsTyping(false);
      socket.emit('stop_typing', { receiverId: selectedContact.id });
    }
    clearTimeout(typingTimerRef.current);
  };

  const handleSendEncodedImage = (encodedImageBase64) => {
    sendMessage(encodedImageBase64, 'catstego_image');
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Aujourd\'hui';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  // Vue liste des conversations
  if (!selectedContact) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b"
             style={{ borderColor: 'rgba(255, 107, 53, 0.15)', background: 'rgba(13, 13, 13, 0.8)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/home')}
                    className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-base font-semibold text-white">Messages</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm font-medium text-white/60">Aucune conversation</p>
              <p className="text-xs text-white/30 mt-1">Ajoutez des contacts pour discuter</p>
              <button
                onClick={() => navigate('/contacts')}
                className="mt-4 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(255, 107, 53, 0.2)', color: '#FF6B35', border: '1px solid rgba(255, 107, 53, 0.3)' }}>
                Gérer les contacts
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.01]"
                  style={{ background: 'rgba(22, 33, 62, 0.7)', border: '1px solid rgba(255, 107, 53, 0.1)' }}>
                  <Avatar user={contact} size={42} online={isUserOnline?.(contact.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white truncate">{contact.username}</p>
                      {unreadCounts[contact.id] > 0 && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ml-2 flex-shrink-0"
                             style={{ background: '#E94560' }}>
                          {unreadCounts[contact.id]}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-white/40">
                      {isUserOnline?.(contact.id) ? '🟢 En ligne' : 'Hors ligne'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <Navbar unreadCount={Object.values(unreadCounts).reduce((a, b) => a + b, 0)} />
      </div>
    );
  }

  // Vue conversation
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header conversation */}
      <div className="flex items-center gap-3 px-4 py-3 border-b"
           style={{ borderColor: 'rgba(255, 107, 53, 0.15)', background: 'rgba(13, 13, 13, 0.9)' }}>
        <button
          onClick={() => setSelectedContact(null)}
          className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5">
          <ArrowLeft size={20} />
        </button>
        <Avatar user={selectedContact} size={36} online={isUserOnline?.(selectedContact.id)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{selectedContact.username}</p>
          <p className="text-xs" style={{ color: isUserOnline?.(selectedContact.id) ? '#4CAF50' : 'rgba(255,255,255,0.4)' }}>
            {partnerTyping ? (
              <span className="flex items-center gap-1">
                <span>En train d'écrire</span>
                <span className="typing-dot">.</span>
                <span className="typing-dot">.</span>
                <span className="typing-dot">.</span>
              </span>
            ) : isUserOnline?.(selectedContact.id) ? 'En ligne' : 'Hors ligne'}
          </p>
        </div>
        <button
          onClick={() => setShowEncodeModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
          style={{ background: 'rgba(255, 107, 53, 0.15)', color: '#FF6B35', border: '1px solid rgba(255, 107, 53, 0.3)' }}>
          <Lock size={12} />
          CatStego
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loadingMessages ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-3xl mb-2">🐱</div>
            <p className="text-sm text-white/40">Commencez la conversation</p>
            <p className="text-xs text-white/20 mt-1">Envoyez un texte ou une image secrète</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isMine = msg.sender_id === user.id;
              const isImage = msg.type === 'catstego_image';
              const showDate = idx === 0 || formatDate(messages[idx - 1].created_at) !== formatDate(msg.created_at);

              return (
                <div key={msg.id || msg.tempId}>
                  {showDate && (
                    <div className="text-center my-3">
                      <span className="text-xs px-3 py-1 rounded-full"
                            style={{ background: 'rgba(42, 42, 74, 0.8)', color: 'rgba(255,255,255,0.4)' }}>
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {!isMine && <Avatar user={selectedContact} size={24} />}
                    <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {isImage ? (
                        <div className="relative rounded-2xl overflow-hidden"
                             style={{
                               border: `2px solid ${isMine ? 'rgba(255, 107, 53, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                               opacity: msg.pending ? 0.7 : 1
                             }}>
                          <img src={msg.content} alt="CatStego" className="max-w-[180px] rounded-xl" />
                          <div className="absolute bottom-0 left-0 right-0 p-1.5 flex items-center justify-between"
                               style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                            <span className="text-xs text-white/70">🔒 CatStego</span>
                            {!isMine && (
                              <button
                                onClick={() => setShowDecodeModal(msg.content)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ background: 'rgba(255, 107, 53, 0.3)', color: '#FF6B35' }}>
                                <Eye size={10} />
                                Décoder
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className={`px-3 py-2 text-sm leading-relaxed ${isMine ? 'msg-sent' : 'msg-received'}`}
                             style={{ opacity: msg.pending ? 0.7 : 1 }}>
                          {msg.content}
                        </div>
                      )}
                      <div className={`flex items-center gap-1 text-xs text-white/30 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <span>{formatTime(msg.created_at)}</span>
                        {isMine && <span>{msg.pending ? '⏳' : '✓'}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t"
           style={{ borderColor: 'rgba(255, 107, 53, 0.15)', background: 'rgba(13, 13, 13, 0.9)' }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEncodeModal(true)}
            className="p-2.5 rounded-xl flex-shrink-0 transition-all"
            style={{ background: 'rgba(255, 107, 53, 0.15)', color: '#FF6B35' }}>
            <Lock size={18} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
            placeholder="Message..."
            className="flex-1 input-field py-2.5"
            style={{ borderRadius: '20px' }}
          />
          <button
            onClick={handleSendText}
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl flex-shrink-0 transition-all"
            style={{
              background: inputText.trim() ? 'linear-gradient(135deg, #FF6B35, #E94560)' : 'rgba(42, 42, 74, 0.5)',
              color: inputText.trim() ? 'white' : 'rgba(255,255,255,0.3)'
            }}>
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Modals */}
      {showDecodeModal && (
        <DecodeModal
          image={showDecodeModal}
          onClose={() => setShowDecodeModal(null)}
        />
      )}

      {showEncodeModal && (
        <EncodeModal
          contact={selectedContact}
          onClose={() => setShowEncodeModal(false)}
          onSend={handleSendEncodedImage}
        />
      )}
    </div>
  );
};

export default Chat;
