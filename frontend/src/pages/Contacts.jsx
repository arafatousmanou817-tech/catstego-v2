import { useState, useEffect } from 'react';
import { ArrowLeft, Search, UserPlus, UserMinus, MessageCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';

const Avatar = ({ user, size = 40 }) => {
  const initials = user.username?.slice(0, 2).toUpperCase() || '??';
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
         style={{
           width: size,
           height: size,
           background: user.avatar_color || user.avatarColor || '#FF6B35',
           fontSize: size * 0.35
         }}>
      {initials}
    </div>
  );
};

const Contacts = () => {
  const navigate = useNavigate();
  const { isUserOnline } = useSocket() || {};
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' | 'search'

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => searchUsers(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadContacts = async () => {
    try {
      const { data } = await axios.get('/api/contacts');
      setContacts(data);
    } catch (err) {
      console.error('Erreur chargement contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (q) => {
    setSearching(true);
    try {
      const { data } = await axios.get(`/api/contacts/search?q=${encodeURIComponent(q)}`);
      setSearchResults(data);
    } catch (err) {
      console.error('Erreur recherche:', err);
    } finally {
      setSearching(false);
    }
  };

  const addContact = async (userId) => {
    try {
      await axios.post('/api/contacts/add', { contactId: userId });
      setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, isContact: true } : u));
      loadContacts();
    } catch (err) {
      console.error('Erreur ajout contact:', err);
    }
  };

  const removeContact = async (contactId) => {
    if (!window.confirm('Supprimer ce contact ?')) return;
    try {
      await axios.delete(`/api/contacts/${contactId}`);
      setContacts(prev => prev.filter(c => c.id !== contactId));
    } catch (err) {
      console.error('Erreur suppression contact:', err);
    }
  };

  const openChat = (contact) => {
    navigate('/chat', { state: { selectedContact: contact } });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b"
           style={{ borderColor: 'rgba(255, 107, 53, 0.15)', background: 'rgba(13, 13, 13, 0.8)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/home')}
                  className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-base font-semibold text-white">Contacts</h2>
          <span className="ml-auto text-xs text-white/40">{contacts.length} contact{contacts.length > 1 ? 's' : ''}</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl"
             style={{ background: 'rgba(42, 42, 74, 0.5)' }}>
          {[
            { id: 'contacts', label: 'Mes contacts' },
            { id: 'search', label: 'Rechercher' }
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: activeTab === id ? 'linear-gradient(135deg, #FF6B35, #E94560)' : 'transparent',
                color: activeTab === id ? 'white' : 'rgba(255,255,255,0.5)'
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Onglet Contacts */}
        {activeTab === 'contacts' && (
          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-muted rounded w-24" />
                    <div className="h-2 bg-muted rounded w-16" />
                  </div>
                </div>
              ))
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-3">😿</div>
                <p className="text-sm font-medium text-white/60">Aucun contact pour l'instant</p>
                <p className="text-xs text-white/30 mt-1">Recherchez des utilisateurs pour les ajouter</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-4 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ background: 'rgba(255, 107, 53, 0.2)', color: '#FF6B35', border: '1px solid rgba(255, 107, 53, 0.3)' }}>
                  Rechercher des contacts
                </button>
              </div>
            ) : (
              contacts.map(contact => (
                <div key={contact.id}
                     className="flex items-center gap-3 p-3 rounded-xl transition-all"
                     style={{ background: 'rgba(22, 33, 62, 0.6)', border: '1px solid rgba(255, 107, 53, 0.1)' }}>
                  <div className="relative">
                    <Avatar user={contact} size={42} />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${isUserOnline?.(contact.id) ? 'bg-green-400' : 'bg-gray-600'}`}
                         style={{ borderColor: '#16213E' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{contact.username}</p>
                    <p className="text-xs text-white/40 truncate">{contact.email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openChat(contact)}
                      className="p-2 rounded-lg transition-all hover:bg-primary/20"
                      style={{ color: '#FF6B35' }}>
                      <MessageCircle size={16} />
                    </button>
                    <button
                      onClick={() => removeContact(contact.id)}
                      className="p-2 rounded-lg transition-all hover:bg-red-500/20 text-white/30 hover:text-red-400">
                      <UserMinus size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Onglet Recherche */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nom d'utilisateur ou email..."
                className="input-field pl-10 pr-8"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  <X size={14} />
                </button>
              )}
            </div>

            {searching && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
              </div>
            )}

            {searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
              <div className="text-center py-8">
                <p className="text-sm text-white/40">Aucun utilisateur trouvé</p>
              </div>
            )}

            <div className="space-y-2">
              {searchResults.map(user => (
                <div key={user.id}
                     className="flex items-center gap-3 p-3 rounded-xl"
                     style={{ background: 'rgba(22, 33, 62, 0.6)', border: '1px solid rgba(255, 107, 53, 0.1)' }}>
                  <Avatar user={user} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.username}</p>
                    <p className="text-xs text-white/40 truncate">{user.email}</p>
                  </div>
                  {user.isContact ? (
                    <span className="text-xs px-2 py-1 rounded-full"
                          style={{ background: 'rgba(76, 175, 80, 0.2)', color: '#4CAF50' }}>
                      ✓ Contact
                    </span>
                  ) : (
                    <button
                      onClick={() => addContact(user.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                      style={{ background: 'rgba(255, 107, 53, 0.2)', color: '#FF6B35', border: '1px solid rgba(255, 107, 53, 0.3)' }}>
                      <UserPlus size={12} />
                      Ajouter
                    </button>
                  )}
                </div>
              ))}
            </div>

            {searchQuery.length < 2 && (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🔍</div>
                <p className="text-sm text-white/40">Saisissez au moins 2 caractères</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Navbar />
    </div>
  );
};

export default Contacts;
