import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Upload from './pages/Upload';
import Explore from './pages/Explore';
import Chat from './pages/Chat';
import Community from './pages/Community';
import CommunityView from './pages/CommunityView';
import Competitions from './pages/Competitions';
import AIMentor from './pages/AIMentor';
import Comics from './pages/Comics';
import Drawing from './pages/Drawing';
import ArtHistory from './pages/ArtHistory';
import AdminPanel from './pages/AdminPanel';
import MarketplaceFeed from './pages/MarketplaceFeed';
import CreateRequest from './pages/CreateRequest';
import RequestDetails from './pages/RequestDetails';
import ApplicationsPage from './pages/ApplicationsPage';
import MarketplaceChat from './pages/MarketplaceChat';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-dark"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/feed" /> : children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-dark"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" />;
  return user.role === 'admin' ? children : <Navigate to="/feed" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/feed" element={<Feed />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/:id" element={<CommunityView />} />
        <Route path="/competitions" element={<Competitions />} />
        <Route path="/ai-mentor" element={<AIMentor />} />
        <Route path="/comics" element={<Comics />} />
        <Route path="/drawing" element={<Drawing />} />
        <Route path="/art-history" element={<ArtHistory />} />
        <Route path="/marketplace" element={<MarketplaceFeed />} />
        <Route path="/marketplace/create" element={<CreateRequest />} />
        <Route path="/marketplace/requests/:id" element={<RequestDetails />} />
        <Route path="/marketplace/applications" element={<ApplicationsPage />} />
        <Route path="/marketplace/chat/:id" element={<MarketplaceChat />} />
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{ style: { background: '#111327', color: '#E2E8F0', border: '1px solid #1E2040' } }} />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
