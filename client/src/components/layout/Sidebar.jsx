import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Compass, Upload, MessageCircle, Users, Trophy, Bot, BookOpen, Pencil, LogOut, Bell, History, Check, Shield, Sun, Moon } from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const navItems = [
  { to: '/feed', icon: Home, label: 'Feed' },
  { to: '/explore', icon: Compass, label: 'Explore' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/community', icon: Users, label: 'Community' },
  { to: '/competitions', icon: Trophy, label: 'Competitions' },
  { to: '/art-history', icon: History, label: 'Art History' },
  { to: '/ai-mentor', icon: Bot, label: 'AI Mentor' },
  { to: '/comics', icon: BookOpen, label: 'Comics' },
  { to: '/drawing', icon: Pencil, label: 'Draw' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/social/notifications').then(res => setNotifications(res.data)).catch(() => {});
    }
  }, [user]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const markAsRead = async () => {
    try {
      await api.put('/social/notifications/read');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const sidebarItems = user?.role === 'admin'
    ? [...navItems, { to: '/admin', icon: Shield, label: 'Admin Panel' }]
    : navItems;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-card border-r border-dark-border flex flex-col z-40">
      <div className="p-5 border-b border-dark-border flex justify-between items-center relative">
        <div>
          <h1 className="text-2xl font-bold gradient-text cursor-pointer" onClick={() => navigate('/feed')}>
            🎨 Artory
          </h1>
          <p className="text-xs text-gray-500 mt-1">AI-Powered Art Platform</p>
        </div>
        
        <div className="relative">
          <button 
            className="text-gray-400 hover:text-white transition-colors relative"
            onClick={() => { setShowNotifs(!showNotifs); if(unreadCount > 0) markAsRead(); }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-dark-card"></span>
            )}
          </button>
          
          {showNotifs && (
            <div className="absolute top-full left-0 mt-4 w-80 bg-[#1a1b1e] border border-dark-border rounded-xl shadow-2xl p-4 max-h-96 overflow-y-auto animate-fade-in z-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white">Notifications</h3>
                <button onClick={markAsRead} className="text-xs text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
                  <Check size={14} /> Mark all read
                </button>
              </div>
              
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No notifications yet.</p>
                ) : (
                  notifications.map(n => (
                    <div key={n._id} className={`flex gap-3 items-start p-2 rounded-lg transition-colors cursor-pointer ${n.isRead ? 'opacity-70 hover:bg-[#2a2b2f]' : 'bg-[#2a2b2f]'}`} onClick={() => { if(n.link) navigate(n.link); setShowNotifs(false); }}>
                      <div className="w-8 h-8 avatar bg-primary/30 flex-shrink-0 flex items-center justify-center text-primary font-bold">
                        {n.sender?.profileImage ? <img src={n.sender.profileImage.startsWith('http') ? n.sender.profileImage : `http://localhost:5000${n.sender.profileImage}`} className="w-full h-full object-cover rounded-full" alt="" /> : n.sender?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm text-white">{n.message}</p>
                        <span className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {sidebarItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={20} />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-dark-border space-y-2">
        <button onClick={toggleTheme} className="sidebar-link w-full">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <div
          className="sidebar-link"
          onClick={() => navigate('/profile')}
        >
          {user?.profileImage ? (
            <img src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000${user.profileImage}`} className="w-8 h-8 avatar object-cover" alt="" />
          ) : (
            <div className="w-8 h-8 avatar bg-primary/30 flex items-center justify-center text-sm font-bold text-primary">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.username || 'Artist'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
