import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import PhoneFrame from './components/PhoneFrame';
import ToastContainer from './components/ToastContainer';
import PushPrompt from './components/PushPrompt';
import usePushNotifications from './hooks/usePushNotifications';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Encode from './pages/Encode';
import Decode from './pages/Decode';
import Chat from './pages/Chat';
import Contacts from './pages/Contacts';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center"
           style={{ background: '#1A1A2E' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="text-5xl animate-cat-bounce">🐱</div>
          <div className="w-6 h-6 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const { permission, requestPermissionAndSubscribe } = usePushNotifications(isAuthenticated);
  const [promptDismissed, setPromptDismissed] = useState(false);

  const showPrompt = isAuthenticated
    && permission === 'default'
    && !promptDismissed
    && 'serviceWorker' in navigator
    && 'PushManager' in window;

  return (
    <PhoneFrame>
      {showPrompt && (
        <PushPrompt
          onAllow={requestPermissionAndSubscribe}
          onDismiss={() => setPromptDismissed(true)}
        />
      )}
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/home" replace />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/home" replace />} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/encode" element={<ProtectedRoute><Encode /></ProtectedRoute>} />
        <Route path="/decode" element={<ProtectedRoute><Decode /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} />
      </Routes>
    </PhoneFrame>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <AppRoutes />
            <ToastContainer />
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
