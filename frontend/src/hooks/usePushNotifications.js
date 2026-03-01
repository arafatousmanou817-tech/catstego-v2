import { useEffect, useState } from 'react';
import axios from 'axios';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
};

const usePushNotifications = (isAuthenticated) => {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscribed, setSubscribed] = useState(false);

  // Enregistrer le Service Worker
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('✅ Service Worker enregistré');

      // Écouter les messages du SW (clic sur notification)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NOTIFICATION_CLICK') {
          window.location.href = event.data.url || '/chat';
        }
      });
    }).catch(err => console.error('SW error:', err));
  }, []);

  // S'abonner quand l'utilisateur est connecté
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission !== 'granted') return;

    subscribeToPush();
  }, [isAuthenticated]);

  const requestPermissionAndSubscribe = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        await subscribeToPush();
      }
      return result;
    } catch (err) {
      console.error('Erreur permission:', err);
      return 'denied';
    }
  };

  const subscribeToPush = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;

      // Récupérer la clé publique VAPID
      const { data } = await axios.get('/api/push/vapid-public-key');
      const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

      // Vérifier si déjà abonné
      const existing = await reg.pushManager.getSubscription();
      const sub = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // Envoyer la subscription au backend
      await axios.post('/api/push/subscribe', {
        endpoint: sub.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
          auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        }
      });

      setSubscribed(true);
      console.log('✅ Push notifications activées');
    } catch (err) {
      console.error('Erreur subscription push:', err);
    }
  };

  return { permission, subscribed, requestPermissionAndSubscribe };
};

export default usePushNotifications;
