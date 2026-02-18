import { useState, useRef, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { User, QrCode, Layout, Printer, FileText, BarChart2, LogOut, ChevronDown } from 'lucide-react';
import { supabase } from '../services/supabase';
import Sidebar from '../components/Sidebar';
import RealtimeOrders from '../components/RealtimeOrders';
import { useAuth } from '../context/AuthContext';
import Overview from '../pages/Overview';
import MenuManagement from '../pages/MenuManagement';
import Subeler from '../pages/Subeler';

const DashboardLayout = ({ children }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        document.title = 'Siento POS | İşletme Paneli';
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
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
                .channel(`notifs-${user.id}`)
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
            setUnreadCount(data?.filter(n => !n.is_read).length || 0);
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

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [selectedNotif, setSelectedNotif] = useState(null);
    const notifRef = useRef(null);

    const profileLinks = [
        { label: 'Profil', path: '/isletme/ayarlar', icon: User },
        { label: 'QR Menü', path: '/isletme/qr/menu', icon: QrCode },
        { label: 'Masalar', path: '/isletme/oturma-alanlari', icon: Layout },
        { label: 'Yazıcılar', path: '/isletme/yazicilar', icon: Printer },
        { label: 'Faturalar', path: '/isletme/faturalar', icon: FileText },
        { label: 'Stok Durumu', path: '/isletme/stok-durumu', icon: BarChart2 },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50 text-left">
            <Sidebar logout={logout} />

            <div className="flex-1 ml-64 flex flex-col">
                <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-6 sticky top-0 z-20">
                    <div className="flex items-center gap-4 text-gray-400 text-sm">
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm px-1 leading-none">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {isNotifOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-gray-700">Bildirimler</h3>
                                        {unreadCount > 0 && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">{unreadCount} Yeni</span>}
                                    </div>
                                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                                        {notifications.length > 0 ? (
                                            notifications.map((n) => (
                                                <button
                                                    key={n.id}
                                                    onClick={() => {
                                                        setSelectedNotif(n);
                                                        setIsNotifOpen(false);
                                                    }}
                                                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex gap-3 items-start ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                                                >
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-blue-600' : 'bg-transparent'}`} />
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`text-[13px] leading-tight mb-1 ${!n.is_read ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                                                            {n.system_notifications?.title}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 line-clamp-2 leading-normal">
                                                            {n.system_notifications?.message}
                                                        </p>
                                                        <p className="text-[10px] text-gray-300 mt-2 font-medium uppercase tracking-wider">
                                                            {new Date(n.system_notifications?.created_at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-10 text-center">
                                                <p className="text-gray-400 text-sm font-medium">Bildirim bulunmuyor.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => !user?.is_access_restricted && setIsProfileOpen(!isProfileOpen)}
                                className={`flex items-center gap-3 p-1.5 rounded-xl transition-all ${user?.is_access_restricted ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-gray-50'}`}
                            >
                                <div className="text-right hidden md:block">
                                    <div className="text-[13px] font-bold text-gray-700 leading-tight">
                                        {user?.full_name || user?.email?.split('@')[0]}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                        {user?.restaurant_role || 'Yönetici'}
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center overflow-hidden shadow-sm border border-emerald-200/50 relative">
                                    {user?.logo_url ? (
                                        <img src={user.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-emerald-600 font-bold text-lg">
                                            {user?.email?.[0].toUpperCase() || 'S'}
                                        </span>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                        <ChevronDown size={10} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-50 mb-1">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Hesap</p>
                                        <p className="text-sm font-bold text-gray-700 truncate">{user?.email}</p>
                                    </div>

                                    <div className="py-1">
                                        {profileLinks.map((link, idx) => {
                                            const Icon = link.icon;
                                            return (
                                                <Link
                                                    key={idx}
                                                    to={link.path}
                                                    onClick={() => setIsProfileOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium group"
                                                >
                                                    <Icon size={16} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                                                    {link.label}
                                                </Link>
                                            );
                                        })}
                                    </div>

                                    <div className="border-t border-gray-50 mt-1 pt-1">
                                        <button
                                            onClick={() => {
                                                setIsProfileOpen(false);
                                                logout();
                                                navigate('/giris');
                                            }}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors font-bold"
                                        >
                                            <LogOut size={16} />
                                            Çıkış Yap
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>

            {/* Notification Detail Popup */}
            {selectedNotif && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => {
                    markAsRead(selectedNotif.id);
                    setSelectedNotif(null);
                }}>
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="bg-gray-50 p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800">{selectedNotif.system_notifications?.title}</h3>
                            <button
                                onClick={() => {
                                    markAsRead(selectedNotif.id);
                                    setSelectedNotif(null);
                                }}
                                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="p-8">
                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                                {selectedNotif.system_notifications?.message}
                            </p>
                        </div>
                        <div className="px-8 py-4 bg-gray-50 flex items-center justify-between text-xs text-gray-400 font-bold border-t border-gray-100">
                            <span>Sistem Mesajı</span>
                            <span>{new Date(selectedNotif.system_notifications?.created_at).toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="p-4 bg-white">
                            <button
                                onClick={() => {
                                    markAsRead(selectedNotif.id);
                                    setSelectedNotif(null);
                                }}
                                className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-2xl hover:bg-gray-800 transition-all shadow-lg active:scale-[0.98]"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardLayout;
