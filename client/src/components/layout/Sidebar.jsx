import { createElement, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Compass, Upload, MessageCircle, Users, Trophy, Bot, BookOpen, Pencil, LogOut, Bell, History, Check, Shield, Store, ArrowRight, X } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { Sidebar as AceternitySidebar, SidebarBody, SidebarLink, useSidebar } from '../ui/sidebar';
import toast from 'react-hot-toast';
import ArtoryLogo from '../ArtoryLogo';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

const navItems = [
  { to: '/feed', icon: Home, label: 'Art Feed' },
  { to: '/explore', icon: Compass, label: 'Gallery' },
  { to: '/community', icon: Users, label: 'Community' },
  { to: '/competitions', icon: Trophy, label: 'Competition' },
  { to: '/ai-mentor', icon: Bot, label: 'AI Mentor' },
  { to: '/comics', icon: BookOpen, label: 'Comics' },
  { to: '/art-history', icon: History, label: 'History' },
  { to: '/marketplace', icon: Store, label: 'Marketplace' },
  { to: '/chat', icon: MessageCircle, label: 'Messages' },
  { to: '/drawing', icon: Pencil, label: 'Canvas-01' },
];

function DataInjectionButton() {
  const { open, animate } = useSidebar();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/upload')}
      className={`w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-accent text-white font-black rounded-2xl transition-all duration-500 hover:shadow-[0_15px_30px_rgba(124,58,237,0.4)] hover:scale-[1.02] active:scale-95 overflow-hidden group shadow-2xl relative border border-white/10 ${animate && !open ? 'px-0 py-3.5' : 'px-5 py-3.5'}`}
    >
      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
      <Upload size={18} className="shrink-0 relative z-10 group-hover:-translate-y-1 transition-transform" />
      <span
        className={`whitespace-pre text-[10px] font-black uppercase tracking-[0.3em] relative z-10 ${animate && !open ? 'hidden opacity-0' : 'inline-block opacity-100'}`}
      >
        Post
      </span>
    </button>
  );
}

function IdentityMember() {
  const { open, animate } = useSidebar();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const profileImg = user?.profileImage 
    ? (user.profileImage.startsWith('http') ? user.profileImage : `${API_BASE}${user.profileImage}`)
    : null;
  
  const xp = user?.xp || 0;
  const level = Math.floor(xp / 100) + 1;
  const xpProgress = (xp % 100);

  return (
    <div 
      className="flex items-center gap-4 p-3 rounded-2xl bg-surface/30 border border-white/5 hover:border-primary/40 cursor-pointer transition-all duration-500 group shadow-xl"
      onClick={() => navigate('/profile')}
    >
      <div className="relative shrink-0">
        {profileImg ? (
          <img src={profileImg} className="w-11 h-11 rounded-xl object-cover ring-2 ring-primary/20 group-hover:ring-primary/60 transition-all duration-500 shadow-2xl" alt="" />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-black text-white shadow-2xl group-hover:rotate-6 transition-transform">
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-[3px] border-dark rounded-full shadow-lg" />
      </div>
      
      <div
        className={`min-w-0 flex-1 space-y-1.5 ${animate && !open ? 'hidden opacity-0' : 'block opacity-100'}`}
      >
        <div className="flex justify-between items-center">
           <p className="text-xs font-black text-white truncate tracking-tight group-hover:text-primary transition-colors">{user?.username || 'Artist'}</p>
           <span className="text-[8px] font-black text-primary bg-primary/10 px-1.5 rounded-md border border-primary/20">Lvl {level}</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
             <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">{user?.role === 'admin' ? 'Architect' : 'Artist Member'}</p>
             <span className="text-[8px] text-gray-600 font-black">{xpProgress}%</span>
          </div>
          <div className="h-1 bg-dark/60 rounded-full overflow-hidden border border-white/5 shadow-inner">
            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full shadow-[0_0_8px_rgba(124,58,237,0.5)]" style={{ width: `${xpProgress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ open, setOpen }) {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifPanelRef = useRef(null);

  useEffect(() => {
    if (user) {
      api.get('/social/notifications').then(res => setNotifications(res.data)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;
    const handleNotification = (notification) => {
      if ((notification.recipient?._id || notification.recipient)?.toString() === user._id) {
        setNotifications(prev => [{ ...notification, sender: notification.sender || user }, ...prev]);
        toast.success(notification.message, { icon: '🔔', className: 'bg-dark text-white border border-primary/20 font-bold text-xs' });
      }
    };
    socket.on('new_notification', handleNotification);
    return () => socket.off('new_notification', handleNotification);
  }, [socket, user]);

  useEffect(() => {
    if (!showNotifs) return;
    const handler = (e) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const markAsRead = async () => {
    try {
      await api.put('/social/notifications/read');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch {
      // Notification read state is non-critical UI state.
    }
  };

  const toggleNotifs = () => {
    setShowNotifs(prev => !prev);
    if (unreadCount > 0) markAsRead();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const sidebarItems = user?.role === 'admin'
    ? [...navItems, { to: '/admin', icon: Shield, label: 'Admin Panel' }]
    : navItems;

  return (
    <>
      <AceternitySidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-6 bg-[#0c0d0f] h-full z-40 relative border-r border-white/5 shadow-2xl">
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden hide-scrollbar">
            {/* Art Brand Section */}
            <div className="flex items-center gap-4 mb-8 px-2 py-4 group cursor-pointer" onClick={() => navigate('/')}>
              <ArtoryLogo size={48} showText={open} />
            </div>

            {/* Navigation Grid */}
            <div className="flex flex-col gap-1.5">
              {sidebarItems.map(({ to, icon: Icon, label }) => (
                <SidebarLink
                  key={to}
                  link={{
                    to,
                    label,
                    icon: createElement(Icon, { size: 20, className: 'shrink-0 transition-transform duration-500 group-hover:scale-110' })
                  }}
                  className="px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white hover:bg-surface/50 transition-all duration-500 group"
                />
              ))}
            </div>

            {/* Art Post Button */}
            <div className="mt-10 px-2">
              <DataInjectionButton />
            </div>
          </div>

          {/* Identity & Output */}
          <div className="flex flex-col gap-4 pt-6 border-t border-white/5">
            <button
              onClick={toggleNotifs}
              className="relative px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white hover:bg-surface/50 transition-all duration-500 flex items-center gap-3"
            >
              <Bell size={20} className="text-primary shrink-0" />
              <span
                className={`whitespace-pre ${open ? 'inline-block opacity-100' : 'hidden opacity-0'}`}
              >
                Alerts
              </span>
              {unreadCount > 0 && (
                <span className="absolute right-3 top-2 min-w-5 h-5 px-1 rounded-full bg-primary text-white text-[9px] leading-5 text-center shadow-lg shadow-primary/30">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <IdentityMember />
            <SidebarLink
              onClick={handleLogout}
              link={{
                label: 'Leave',
                icon: <LogOut size={20} className="text-red-500 shrink-0 group-hover:rotate-12 transition-transform" />
              }}
              className="px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-red-500 hover:bg-red-500/10 hover:shadow-xl transition-all duration-500"
            />
          </div>
        </SidebarBody>
      </AceternitySidebar>

      {/* Art Alerts Panel */}
      {showNotifs && (
        <div
          ref={notifPanelRef}
          className="fixed top-8 left-28 z-[9999] w-96 bg-[#0c0d0f] border-2 border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden animate-slide-right flex flex-col"
          style={{ maxHeight: '75vh' }}
        >
          <div className="absolute inset-0 bg-primary/5 opacity-40 pointer-events-none" />
          
          {/* Panel Header */}
          <div className="flex justify-between items-center px-8 py-6 border-b border-white/5 bg-surface/30 backdrop-blur-3xl relative z-10">
            <div>
               <h3 className="font-black text-white text-lg tracking-tighter">Art <span className="text-primary italic">Alerts</span></h3>
               <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1">Inbound system signals</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={markAsRead} className="text-[9px] font-black text-gray-500 hover:text-primary transition-all flex items-center gap-2 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <Check size={12} /> Mark All Read
              </button>
              <button onClick={() => setShowNotifs(false)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-red-500/20 transition-all">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1 hide-scrollbar p-6 space-y-4 relative z-10">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 opacity-30">
                <div className="w-20 h-20 bg-surface/40 rounded-[2rem] border border-dashed border-white/20 flex items-center justify-center">
                   <Bell size={32} className="text-gray-600" />
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Field Sychronized</p>
                   <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">No active signals detected</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`flex gap-5 items-center px-6 py-5 rounded-[1.75rem] transition-all duration-500 cursor-pointer group/notif relative overflow-hidden border ${!n.isRead ? 'bg-primary/5 border-primary/20 shadow-[0_10px_20px_rgba(124,58,237,0.1)]' : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'}`}
                    onClick={() => { if (n.link) navigate(n.link); setShowNotifs(false); }}
                  >
                    {!n.isRead && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full shadow-[0_0_10px_rgba(124,58,237,1)]" />}
                    
                    <div className="w-12 h-12 rounded-2xl bg-surface/60 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-2xl group-hover/notif:scale-105 duration-500">
                      {n.sender?.profileImage
                        ? <img src={n.sender.profileImage.startsWith('http') ? n.sender.profileImage : `${API_BASE}${n.sender.profileImage}`} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-lg">{n.sender?.username?.[0]?.toUpperCase() || 'V'}</div>}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-xs font-medium text-gray-200 leading-relaxed group-hover/notif:text-white transition-colors">{n.message}</p>
                      <div className="flex items-center justify-between">
                         <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         <ArrowRight size={12} className="text-primary opacity-0 group-hover/notif:opacity-100 group-hover/notif:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-white/5 bg-surface/30 relative z-10">
             <button className="w-full py-4 rounded-xl bg-primary/10 text-primary font-black text-[9px] uppercase tracking-[0.4em] hover:bg-primary hover:text-white transition-all duration-500 shadow-2xl">
                Terminal History Settings
             </button>
          </div>
        </div>
      )}
    </>
  );
}
