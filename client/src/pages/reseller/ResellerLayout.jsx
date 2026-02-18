import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Store,
    CreditCard,
    Wallet,
    PieChart,
    Megaphone,
    LifeBuoy,
    User,
    LogOut,
    Bell,
    ChevronRight,
    Building2,
    ShieldCheck,
    Search,
    X,
    ChevronDown
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';

const ResellerLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [selectedNotif, setSelectedNotif] = useState(null);
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        document.title = 'Siento Bayi | Kontrol Paneli';
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            const { data } = await supabase
                .from('resellers')
                .select('main_contact_name, company_name')
                .eq('id', user.id)
                .single();
            if (data) setProfileData(data);
        };
        fetchProfile();

        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (user?.id) {
            fetchNotifications();

            // Listen for new notifications
            const channel = supabase
                .channel(`reseller-notifs-${user.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'profile_notifications',
                    filter: `profile_id=eq.${user.id}`
                }, () => {
                    fetchNotifications();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user?.id]);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('profile_notifications')
                .select(`
                    id, is_read, 
                    system_notifications (
                        id, title, message, created_at
                    )
                `)
                .eq('profile_id', user.id)
                .eq('is_read', false)
                .order('created_at', { foreignTable: 'system_notifications', ascending: false });

            if (error) throw error;
            setNotifications(data || []);
            setUnreadCount(data?.length || 0);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const markAsRead = async (notifId) => {
        try {
            const { error } = await supabase
                .from('profile_notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('id', notifId);

            if (error) throw error;
            fetchNotifications();
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Genel Bakış', path: '/' },
        { icon: Store, label: 'İşletmeler', path: '/isletmeler' },
        { icon: CreditCard, label: 'Abonelikler', path: '/abonelikler' },
        { icon: Wallet, label: 'Komisyonlar', path: '/komisyonlar' },
        { icon: PieChart, label: 'Ödemeler', path: '/odemeler' },
        { icon: Megaphone, label: 'Pazarlama', path: '/marketing' },
        { icon: LifeBuoy, label: 'Destek', path: '/destek' },
        { icon: User, label: 'Profil', path: '/profil' },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50 text-slate-800 overflow-hidden font-sans text-left">
            {/* Sidebar - Professional Dark Theme requested */}
            <aside className="w-72 bg-slate-900 flex flex-col flex-shrink-0 shadow-2xl z-20">
                <div className="p-8 border-b border-white/5 flex items-center gap-4">
                    <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/40 transform -rotate-6 group-hover:rotate-0 transition-transform duration-500">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight leading-none">
                            Siento<span className="text-indigo-500 italic">POS</span>
                        </h1>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1.5 opacity-60">Bayi Portalı</p>
                    </div>
                </div>

                <nav className="flex-1 px-5 pt-10 space-y-2 overflow-y-auto overflow-x-hidden no-scrollbar">
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 px-5 opacity-50 italic">Yönetim Merkeziniz</div>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `
                                    flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative
                                    ${isActive
                                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/30'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                                `}
                            >
                                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400 transition-colors'} />
                                <span className="font-black text-xs tracking-widest uppercase">{item.label}</span>

                                {isActive && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 w-1.5 h-6 bg-white rounded-l-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-8 border-t border-white/5 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl text-slate-500 hover:bg-rose-500 hover:text-white transition-all duration-500 font-black text-xs uppercase tracking-widest group"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Güvenli Çıkış</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Header */}
                <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-12 shadow-sm z-40 sticky top-0">
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                            <LayoutDashboard size={14} />
                        </div>
                        <div className="flex items-center gap-2">
                            Siento POS <span className="opacity-30">/</span> <span className="text-slate-800">Kontrol Paneli</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="relative group hidden sm:flex">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Sistemde Ara..."
                                className="bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 text-xs font-bold text-slate-900 focus:ring-4 focus:ring-indigo-600/5 transition-all w-64 placeholder:text-slate-300 uppercase tracking-widest"
                            />
                        </div>

                        <div className="flex items-center gap-6 pl-8 border-l border-slate-100">
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                                    className="relative w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 bg-slate-50 border border-slate-100 rounded-2xl transition-all shadow-sm hover:shadow-md ring-4 ring-transparent hover:ring-indigo-600/5 active:scale-95"
                                >
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {isNotifOpen && (
                                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Bildirimler</h3>
                                            {unreadCount > 0 && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-lg font-black">{unreadCount} Yeni</span>}
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                                            {notifications.length > 0 ? (
                                                notifications.map((n) => (
                                                    <button
                                                        key={n.id}
                                                        onClick={() => {
                                                            setSelectedNotif(n);
                                                            setIsNotifOpen(false);
                                                        }}
                                                        className={`w-full text-left p-5 hover:bg-slate-50 transition-colors flex gap-4 items-start ${!n.is_read ? 'bg-indigo-50/30' : ''}`}
                                                    >
                                                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.is_read ? 'bg-indigo-600' : 'bg-transparent'}`} />
                                                        <div className="min-w-0 flex-1">
                                                            <p className={`text-[12px] leading-tight mb-1 uppercase tracking-tight ${!n.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-400'}`}>
                                                                {n.system_notifications?.title}
                                                            </p>
                                                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed italic">
                                                                {n.system_notifications?.message}
                                                            </p>
                                                            <p className="text-[8px] text-slate-300 mt-3 font-black uppercase tracking-[0.2em]">
                                                                {new Date(n.system_notifications?.created_at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-10 text-center">
                                                    <Bell size={24} className="mx-auto mb-3 text-slate-200" />
                                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Bildirim bulunmuyor.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-5">
                                <div className="text-right hidden xl:block">
                                    <div className="text-sm font-black text-slate-900 leading-none">Hoşgeldiniz</div>
                                    <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-2 opacity-70 italic font-mono decoration-indigo-200 underline underline-offset-4">Yetkili Bayi Paneli</div>
                                </div>
                                <div className="relative" ref={profileRef}>
                                    <div
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="h-14 w-14 relative group cursor-pointer active:scale-95 transition-all"
                                    >
                                        <div className="w-full h-full bg-indigo-600 rounded-3xl flex items-center justify-center font-black text-white text-xl shadow-2xl border border-white/20 group-hover:bg-indigo-500 transition-colors">
                                            {user?.email?.[0].toUpperCase() || 'B'}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full scale-100 group-hover:scale-110 transition-transform shadow-sm"></div>
                                    </div>

                                    {/* Profile Dropdown */}
                                    {isProfileOpen && (
                                        <div className="absolute right-0 mt-3 w-72 bg-white rounded-[2rem] shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-300 ring-8 ring-indigo-600/5">
                                            <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-200">
                                                        {user?.email?.[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">HESAP YÖNETİMİ</p>
                                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{profileData?.main_contact_name || 'YETKİLİ'}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-indigo-600 uppercase italic flex items-center gap-1.5">
                                                        <div className="w-1 h-1 rounded-full bg-indigo-400" />
                                                        {profileData?.company_name || 'FİRMA ADI'}
                                                    </p>
                                                    <p className="text-[9px] font-medium text-slate-400 flex items-center gap-1.5">
                                                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                        {user?.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="p-2 space-y-1">
                                                {[
                                                    { label: 'Profil', path: '/profil', icon: User },
                                                    { label: 'Ödeme Yöntemi', path: '/odemeler', icon: CreditCard },
                                                    { label: 'Pazarlama', path: '/marketing', icon: Megaphone },
                                                    { label: 'Destek', path: '/destek', icon: LifeBuoy },
                                                ].map((item) => (
                                                    <Link
                                                        key={item.path}
                                                        to={item.path}
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black text-slate-500 uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
                                                    >
                                                        <item.icon size={16} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                                        {item.label}
                                                    </Link>
                                                ))}
                                            </div>
                                            <div className="p-2 border-t border-slate-50 bg-slate-50/50">
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all group"
                                                >
                                                    <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                                                    Güvenli Çıkış
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-12 bg-gray-50/50 custom-scrollbar scroll-smooth">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>

            {/* Notification Detail Modal */}
            {selectedNotif && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => {
                    markAsRead(selectedNotif.id);
                    setSelectedNotif(null);
                }}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-50 p-8 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                    <Bell size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">{selectedNotif.system_notifications?.title}</h3>
                            </div>
                            <button
                                onClick={() => {
                                    markAsRead(selectedNotif.id);
                                    setSelectedNotif(null);
                                }}
                                className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm active:scale-90"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-10">
                            <p className="text-slate-600 leading-relaxed font-medium italic text-sm whitespace-pre-wrap">
                                {selectedNotif.system_notifications?.message}
                            </p>
                        </div>
                        <div className="px-10 py-5 bg-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-black border-t border-slate-100 uppercase tracking-widest">
                            <span className="flex items-center gap-2">
                                <ShieldCheck size={14} className="text-indigo-600" />
                                Sistem Duyurusu
                            </span>
                            <span>{new Date(selectedNotif.system_notifications?.created_at).toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="p-6 bg-white">
                            <button
                                onClick={() => {
                                    markAsRead(selectedNotif.id);
                                    setSelectedNotif(null);
                                }}
                                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-indigo-600 transition-all shadow-xl active:scale-[0.98] uppercase tracking-widest text-[11px]"
                            >
                                Bildirimi Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResellerLayout;
