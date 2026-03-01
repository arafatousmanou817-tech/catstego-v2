import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { socket } = useSocket() || {};
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadByUser, setUnreadByUser] = useState({});
  // Page actuellement ouverte dans le chat
  const openChatUserIdRef = useRef(null);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((msg) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast = {
      id,
      senderId: msg.sender_id,
      senderName: msg.sender_username || '?',
      senderColor: msg.sender_color || '#FF6B35',
      content: msg.content,
      type: msg.type,
      createdAt: msg.created_at
    };
    setToasts(prev => [toast, ...prev].slice(0, 5)); // max 5 toasts

    // Auto-remove après 4s
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleReceive = (msg) => {
      // Ne notifier que si ce n'est pas notre propre message
      if (msg.sender_id === user.id) return;

      // Ne montrer toast que si la conv n'est pas déjà ouverte
      if (openChatUserIdRef.current !== msg.sender_id) {
        addToast(msg);
        setUnreadByUser(prev => ({
          ...prev,
          [msg.sender_id]: (prev[msg.sender_id] || 0) + 1
        }));
        setTotalUnread(prev => prev + 1);
      }
    };

    socket.on('receive_message', handleReceive);
    return () => socket.off('receive_message', handleReceive);
  }, [socket, user, addToast]);

  const markAsRead = useCallback((userId) => {
    setUnreadByUser(prev => {
      const count = prev[userId] || 0;
      setTotalUnread(t => Math.max(0, t - count));
      return { ...prev, [userId]: 0 };
    });
  }, []);

  const setOpenChatUserId = useCallback((userId) => {
    openChatUserIdRef.current = userId;
    if (userId) markAsRead(userId);
  }, [markAsRead]);

  return (
    <NotificationContext.Provider value={{
      toasts,
      removeToast,
      totalUnread,
      unreadByUser,
      markAsRead,
      setOpenChatUserId
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
