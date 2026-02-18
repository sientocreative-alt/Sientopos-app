import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Home,
    DollarSign,
    Settings,
    Menu as MenuIcon,
    Users,
    Clock,
    QrCode,
    FileText,
    Server,
    PieChart,
    Link as LinkIcon,
    CreditCard,
    Gift,
    HelpCircle,
    ShoppingBag,
    ChevronDown,
    ChevronRight,
    LogOut,
    Monitor,
    LayoutDashboard,
    Calculator,
    UtensilsCrossed,
    Megaphone,
    ChefHat,
    Store,
    MessageSquare,
    BarChart2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ logout }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [openMenus, setOpenMenus] = useState({});

    const toggleMenu = (title) => {
        setOpenMenus(prev => ({ ...prev, [title]: !prev[title] }));
    };

    const isQRMenuMode = location.pathname.includes('/isletme/qr/');

    const standardMenuStructure = [
        {
            title: 'Ana Sidebar',
            items: [
                { title: 'Anasayfa', path: '/isletme', icon: Home },
                { title: 'Ciro', path: '/isletme/subeler', icon: DollarSign },
                {
                    title: 'POS Ayarları',
                    icon: Settings,
                    isDropdown: true,
                    submenu: [
                        { title: 'Menü Yönetimi', path: '/isletme/menu' },
                        { title: 'Kampanyalar', path: '/isletme/kampanyalar' },
                        { title: 'Happy Hour', path: '/isletme/happy-hour' },
                        { title: 'Süreli İndirimler', path: '/isletme/sureli-indirimler' },
                        { title: 'QR Menü', path: '/isletme/qr/menu' },
                        { title: 'Bölümler / Masalar', path: '/isletme/oturma-alanlari' },
                        { title: 'Opsiyonel Ürünler', path: '/isletme/opsiyonel-urunler' },
                        { title: 'Zorunlu Seçim Grupları', path: '/isletme/urun-opsiyonlari' },
                        { title: 'Ödeme Yöntemleri', path: '/isletme/odeme-yontemleri' },
                        { title: 'Tanımlı Cihazlar', path: '/isletme/cihazlar' },
                        { title: 'Terminaller', path: '/isletme/terminaller' },
                        { title: 'Yazıcılar', path: '/isletme/yazicilar' },
                        { title: 'İndirim Türleri', path: '/isletme/indirim-turleri' },
                        { title: 'Ayarlar', path: '/isletme/ayarlar' }
                    ]
                },
                {
                    title: 'Personel Yönetimi',
                    icon: Users,
                    isDropdown: true,
                    submenu: [
                        { title: 'Yönetici & Personel', path: '/isletme/personeller' },
                        { title: 'Hedefler', path: '/isletme/hedefler' },
                        { title: 'Personel Bildirimleri', path: '/isletme/personel-bildirimleri' },
                        { title: 'Mesai Yönetimi', path: '/isletme/mesai-yonetimi' },
                        { title: 'Mola Süreleri', path: '/isletme/mola-sureleri' },
                        { title: 'Personel Takip', path: '/isletme/personel-saat' },
                        { title: 'Personel Rolleri', path: '/isletme/personel-rolleri' },
                        { title: 'Görevler', path: '/isletme/gorevler' },
                        { title: 'Operasyon Denetim Soruları', path: '/isletme/operasyon-anket-sorulari' },
                        { title: 'Operasyon Denetim Anketi', path: '/isletme/operasyon-anketi' }
                    ]
                },
                {
                    title: 'Muhasebe Kayıtları',
                    icon: FileText,
                    isDropdown: true,
                    submenu: [
                        { title: 'Hesaplar', path: '/isletme/hesaplar' },
                        { title: 'Adisyon Listesi', path: '/isletme/adisyonlar' },
                        { title: 'Satılan Ürünler', path: '/isletme/satilan-urunler' },
                        { title: 'Ödemeler', path: '/isletme/odemeler' },
                        { title: 'Ürün KDV Oranları', path: '/isletme/urun-pos-tipleri' },
                        { title: 'Tedarikçiler', path: '/isletme/tedarikciler' },
                        { title: 'Müşteri İşletmeler', path: '/isletme/musteri-isletmeler' },
                        { title: 'Faturalar', path: '/isletme/faturalar' },
                        { title: 'Fatura Kalemleri', path: '/isletme/muhasebe-urunleri' },
                        { title: 'Personel Ödemeleri', path: '/isletme/maas-bilgileri' },
                        { title: 'Kasa Kapanış', path: '/isletme/kasa-kapanisi' }
                    ]
                },
                {
                    title: 'Stok',
                    icon: Server,
                    isDropdown: true,
                    submenu: [
                        { title: 'Depolar', path: '/isletme/depolar' },
                        { title: 'Stok Bildirimi', path: '/isletme/stok-birimleri' },
                        { title: 'Stoklu Ürün Kategorisi', path: '/isletme/stoklu-urun-kategorileri' },
                        { title: 'Stoklu Ürün', path: '/isletme/stoklu-urunler' },
                        { title: 'Stok Girişi', path: '/isletme/stok-girisi' },
                        { title: 'Stok Durumu', path: '/isletme/stok-durumu' }
                    ]
                },
                {
                    title: 'Raporlar',
                    icon: PieChart,
                    isDropdown: true,
                    submenu: [
                        {
                            title: 'Satış Raporları',
                            isDropdown: true,
                            submenu: [
                                { title: 'Günlük Satışlar', path: '/isletme/raporlar/satis/gunluk' },
                                { title: 'Satış Sayıları', path: '/isletme/raporlar/satis/sayilar' },
                                { title: 'Kategorilere Göre Satış Sayılar', path: '/isletme/raporlar/satis/kategori' },
                                { title: 'Kuver Raporları', path: '/isletme/raporlar/satis/kuver' },
                                { title: 'Masa Raporları', path: '/isletme/raporlar/satis/masa' }
                            ]
                        },
                        {
                            title: 'Ürün Raporları',
                            isDropdown: true,
                            submenu: [
                                { title: 'Personel Kategori Satış Sayıları', path: '/isletme/raporlar/urun/personel-kategori' },
                                { title: 'Personel Ürün Satış Sayıları', path: '/isletme/raporlar/urun/personel-urun' }
                            ]
                        },
                        {
                            title: 'Stok Raporlama',
                            isDropdown: true,
                            submenu: [
                                { title: 'Stok Tüketimi', path: '/isletme/raporlar/stok/tuketim' }
                            ]
                        },
                        {
                            title: 'Finans Raporlama',
                            isDropdown: true,
                            submenu: [
                                { title: 'Gelir Grafiği', path: '/isletme/raporlar/finans/gelir' },
                                { title: 'Ödeme Tipi Grafiği', path: '/isletme/raporlar/finans/odeme-tipi' },
                                { title: 'Gider Grafiği', path: '/isletme/raporlar/finans/gider' },
                                { title: 'Kasa Kapanış Giderleri', path: '/isletme/raporlar/finans/kapanis-giderleri' },
                                { title: 'indirim Raporları', path: '/isletme/raporlar/finans/indirim' }
                            ]
                        }
                    ]
                },
                {
                    title: 'Entegrasyonlar',
                    icon: LinkIcon,
                    isDropdown: true,
                    submenu: [
                        { title: 'YemekSepeti', path: '/isletme/entegrasyon/yemeksepeti' },
                        { title: 'Getir', path: '/isletme/entegrasyon/getir' }
                    ]
                }
            ]
        },
        {
            title: 'Diğer',
            items: [
                { title: 'Abonelik', path: '/isletme/siento-faturalari', icon: CreditCard },
                { title: 'Ürün Puanları', path: '/isletme/urun-hediyeleri', icon: Gift },
                { title: 'Personel İndirimleri', path: '/isletme/personel-indirimleri', icon: Users },
                {
                    title: 'Destek',
                    icon: HelpCircle,
                    isDropdown: true,
                    submenu: [
                        { title: 'Destek Talep', path: '/isletme/destek/talep' },
                        { title: 'Taleplerim', path: '/isletme/destek/taleplerim' },
                        { title: 'Sıkça Sorulan Sorular', path: '/isletme/destek/sss' }
                    ]
                },
                { title: 'Satış Ekranına Git', path: '/pos', icon: Monitor, className: 'bg-green-600 hover:bg-green-500 text-white mt-4' }
            ]
        }
    ];

    const qrMenuStructure = [
        {
            title: 'QR Menü Yönetimi',
            items: [
                { title: 'Qr Menü Yönetimi', path: '/isletme/qr/menu', icon: QrCode },
                { title: 'Geri Bildirimler', path: '/isletme/qr/feedback', icon: MessageSquare },
                { title: 'Ayarlar', path: '/isletme/qr/settings', icon: Settings },
                { title: 'Raporlar', path: '/isletme/qr/menu-raporlari/tiklama-raporlari', icon: BarChart2 },
                { title: 'Ana Panele Dön', path: '/isletme', icon: Settings, className: 'mt-8 border-t border-gray-700 pt-4' }
            ]
        }
    ];

    const menuStructure = isQRMenuMode ? qrMenuStructure : standardMenuStructure;

    const handleLogout = () => {
        if (logout) logout();
        navigate('/giris');
    };

    const renderSubmenu = (submenu, parentOpen, depth = 1) => {
        if (!parentOpen) return null;
        return (
            <ul className={`mt-1 ${depth === 1 ? 'ml-9' : 'ml-4'} space-y-1 border-l border-gray-700`}>
                {submenu.map((subItem, idx) => {
                    const isSubOpen = openMenus[subItem.title];
                    const isSubActive = !subItem.isDropdown && location.pathname === subItem.path;

                    if (subItem.isDropdown) {
                        return (
                            <li key={idx}>
                                <button
                                    onClick={(e) => {
                                        toggleMenu(subItem.title);
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors rounded-r-lg
                                        ${isSubOpen ? 'text-orange-500 bg-gray-800/30' : 'text-white hover:bg-white hover:text-black'}
                                    `}
                                >
                                    <span className="truncate">{subItem.title}</span>
                                    {isSubOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </button>
                                {renderSubmenu(subItem.submenu, isSubOpen, depth + 1)}
                            </li>
                        );
                    }

                    return (
                        <li key={idx}>
                            <Link
                                to={subItem.path}
                                className={`block px-4 py-2 text-sm transition-colors rounded-r-lg
                                    ${isSubActive
                                        ? 'text-orange-500 bg-orange-500/10 font-medium'
                                        : 'text-white hover:text-black hover:bg-white'}
                                `}
                            >
                                {subItem.title}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        );
    };

    return (
        <div className="h-screen w-64 bg-gray-900 border-r border-gray-800 text-white flex flex-col fixed left-0 top-0 overflow-hidden print:hidden">
            <div className="p-6 border-b border-gray-800 relative">
                <h1 className="text-2xl font-bold text-orange-500 tracking-tight">SientoPOS</h1>
                {user?.subscription_plan === 'trial' && (
                    <span className="absolute top-2 right-4 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-red-500 tracking-wider">
                        DENEME SÜRÜMÜ
                    </span>
                )}
            </div>

            <nav className={`flex-1 overflow-y-auto px-2 py-4 custom-scrollbar relative ${user?.is_access_restricted ? 'pointer-events-none select-none grayscale opacity-50' : ''}`}>
                {menuStructure.map((section, idx) => (
                    <div key={idx} className="mb-6">
                        {section.title !== 'Ana Sidebar' && section.title !== 'QR Menü Yönetimi' && (
                            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                {section.title}
                            </h3>
                        )}
                        <ul className="space-y-1">
                            {section.items.map((item, itemIdx) => {
                                const Icon = item.icon;
                                const isActive = !item.isDropdown && location.pathname === item.path;
                                const isOpen = openMenus[item.title];

                                if (item.isDropdown) {
                                    return (
                                        <li key={itemIdx}>
                                            <button
                                                onClick={() => toggleMenu(item.title)}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-sm font-medium
                                                    ${isOpen ? 'text-orange-500 bg-gray-800/50' : 'text-white hover:bg-white hover:text-black'}
                                                `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon size={18} />
                                                    <span>{item.title}</span>
                                                </div>
                                                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </button>

                                            {renderSubmenu(item.submenu, isOpen)}
                                        </li>
                                    );
                                }

                                return (
                                    <li key={itemIdx}>
                                        <Link
                                            to={item.path}
                                            className={`flex items-center gap-3 p-3 rounded-lg transition-all text-sm font-medium ${item.className || ''} ${isActive
                                                ? 'bg-orange-600/10 text-orange-500 shadow-sm shadow-orange-900/20'
                                                : item.className ? '' : 'text-white hover:bg-white hover:text-black'
                                                }`}
                                        >
                                            <Icon size={18} />
                                            <span>{item.title}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {user?.is_access_restricted && (
                <div className="absolute inset-x-0 top-[80px] bottom-[80px] z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-red-600/90 text-white px-4 py-3 rounded-xl shadow-2xl text-center transform -rotate-2 border border-red-500 mb-20">
                        <div className="text-xl font-bold mb-1">ERİŞİM KISITLANDI</div>
                        <div className="text-xs font-medium opacity-90">
                            {user?.business_status === 'suspended' ? 'HESAP ASKIYA ALINDI' : 'SÜRE DOLDU'}
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 border-t border-gray-800 bg-gray-900 z-10">
                <div className="flex items-center gap-3 px-2 py-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
                        {user?.email?.substring(0, 2).toUpperCase() || 'AD'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm text-white font-medium truncate">{user?.email}</p>
                        <p className="text-xs text-gray-500">Yönetici</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full p-3 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all text-sm font-medium"
                >
                    <LogOut size={18} />
                    <span>Çıkış Yap</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
