import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    ChevronDown,
    Building2,
    ShieldAlert,
    CreditCard,
    Bell,
    ChevronRight,
    HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = ({ children }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        document.title = 'Siento Admin | Kontrol Paneli';
        console.log('Current Admin User:', user);
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const [openMenus, setOpenMenus] = useState({
        'İşletme Yönetimi': true,
        'İşletme Destek': true,
        'Bayi Yönetimi': true
    });

    const [openSubMenus, setOpenSubMenus] = useState({});

    const toggleMenu = (title) => {
        setOpenMenus(prev => ({ ...prev, [title]: !prev[title] }));
    };

    const toggleSubMenu = (title) => {
        setOpenSubMenus(prev => ({ ...prev, [title]: !prev[title] }));
    };

    const menuItems = [
        { title: 'Dashboard', path: '/', icon: LayoutDashboard },
        {
            title: 'İşletme Yönetimi',
            icon: Building2,
            isDropdown: true,
            submenu: [
                { title: 'İşletmeler', path: '/businesses' },
                { title: 'Yeni İşletme Ekle', path: '/new-business' },
            ]
        },
        {
            title: 'Bayi Yönetimi',
            icon: Users,
            isDropdown: true,
            submenu: [
                { title: 'Bayiler', path: '/resellers' },
                { title: 'Bayi Oluştur', path: '/resellers/new' },
                { title: 'Ödeme Talepleri', path: '/resellers/payouts' },
                {
                    title: 'Destek',
                    isDropdown: true,
                    submenu: [
                        { title: 'Destek Talepleri', path: '/resellers/support' },
                        { title: 'S.S.S', path: '/resellers/faq' },
                    ]
                },
                {
                    title: 'Bildirim',
                    isDropdown: true,
                    submenu: [
                        { title: 'Bildirim Gönder', path: '/resellers/notifications' },
                    ]
                },
                {
                    title: 'Sözleşmeler',
                    isDropdown: true,
                    submenu: [
                        { title: 'Bayi Sözleşmesi', path: '/resellers/contract' },
                    ]
                },
                {
                    title: 'Pazarlama',
                    isDropdown: true,
                    submenu: [
                        { title: 'Materyaller', path: '/resellers/marketing' },
                    ]
                },
            ]
        },
        { title: 'Abonelik Yönetimi', path: '/subscriptions', icon: CreditCard },
        { title: 'Ödeme Ayarları', path: '/payment-settings', icon: Settings },
        {
            title: 'İşletme Destek',
            icon: HelpCircle,
            isDropdown: true,
            submenu: [
                { title: 'Destek Talepleri', path: '/destek/talepler' },
                { title: 'SSS Yönetimi', path: '/destek/sss' },
            ]
        },
        { title: 'Bildirimler', path: '/notifications', icon: Bell },
    ];

    return (
        <div className="flex min-h-screen bg-gray-100 text-left font-sans">
            {/* Dark Sidebar */}
            <aside className="w-64 bg-[#1e293b] text-white flex flex-col fixed inset-y-0 left-0 z-50">
                <div className="h-16 flex items-center px-6 border-b border-gray-700">
                    <span className="text-xl font-bold tracking-tight text-white">Siento<span className="text-blue-500">Admin</span></span>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        if (item.isDropdown) {
                            const isOpen = openMenus[item.title];
                            const isSubActive = item.submenu.some(sub => location.pathname === sub.path);

                            return (
                                <div key={item.title} className="space-y-1">
                                    <button
                                        onClick={() => toggleMenu(item.title)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isOpen || isSubActive ? 'text-white bg-gray-800/50' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={18} className={isSubActive ? 'text-blue-500' : ''} />
                                            {item.title}
                                        </div>
                                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>

                                    {isOpen && (
                                        <div className="ml-4 pl-4 border-l border-gray-700 space-y-1 animate-in slide-in-from-left-2 duration-200">
                                            {item.submenu.map((sub, idx) => {
                                                if (sub.isDropdown) {
                                                    const isSubOpen = openSubMenus[sub.title];
                                                    const isSubActive = sub.submenu.some(s => location.pathname === s.path);

                                                    return (
                                                        <div key={idx} className="space-y-1">
                                                            <button
                                                                onClick={() => toggleSubMenu(sub.title)}
                                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${isSubOpen || isSubActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                                                            >
                                                                {sub.title}
                                                                {isSubOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                            </button>
                                                            {isSubOpen && (
                                                                <div className="ml-2 pl-3 border-l border-gray-600 space-y-1 animate-in slide-in-from-left-2 duration-200">
                                                                    {sub.submenu.map(s => (
                                                                        <Link
                                                                            key={s.path}
                                                                            to={s.path}
                                                                            className={`block px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${location.pathname === s.path
                                                                                ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                                                                                : 'text-gray-500 hover:text-white hover:bg-gray-800'
                                                                                }`}
                                                                        >
                                                                            {s.title}
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <Link
                                                        key={sub.path}
                                                        to={sub.path}
                                                        className={`block px-3 py-2 rounded-lg text-xs font-medium transition-all ${location.pathname === sub.path
                                                            ? 'bg-blue-600 text-white shadow-sm'
                                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                                            }`}
                                                    >
                                                        {sub.title}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <Icon size={18} />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        Çıkış Yap
                    </button>
                    <div className="mt-4 text-xs text-gray-600 text-center">
                        v1.0.0 Super Admin
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="ml-64 flex-1 flex flex-col">
                <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-8 sticky top-0 z-40 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {menuItems.find(i => i.path === location.pathname)?.title || 'Panel'}
                    </h2>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-3 hover:bg-gray-50 py-1.5 px-3 rounded-lg transition-colors"
                        >
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-bold text-gray-700">{user?.email}</div>
                                <div className="text-xs text-gray-500 font-medium">Super Admin</div>
                            </div>
                            <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                                {user?.email?.[0].toUpperCase()}
                            </div>
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
