import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Book, Globe, Instagram, Wifi, Twitter, Youtube, Facebook, Star, Video, X, MessageCircle, ChevronDown, Bell, ArrowLeft } from 'lucide-react';

const QRHome = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [menu, setMenu] = useState(null);
    const [qrSettings, setQrSettings] = useState(null);
    const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isWaiterCallModalOpen, setIsWaiterCallModalOpen] = useState(false);
    const [waiterCallEnabled, setWaiterCallEnabled] = useState(false);
    const [businessWaiterCallEnabled, setBusinessWaiterCallEnabled] = useState(false);
    const [tableNumber, setTableNumber] = useState('');
    const [seatingAreas, setSeatingAreas] = useState([]);
    const [allTables, setAllTables] = useState([]);
    const [selectedArea, setSelectedArea] = useState(null);
    const [waiterCallStep, setWaiterCallStep] = useState('area'); // 'area' | 'table'
    const [feedbackForm, setFeedbackForm] = useState({
        full_name: '',
        phone: '',
        email: '',
        subject: 'Diğer',
        message: ''
    });
    const [isFooterExpanded, setIsFooterExpanded] = useState(false);

    useEffect(() => {
        const menuEnabled = menu?.allow_waiter_call !== false;
        setWaiterCallEnabled(businessWaiterCallEnabled && menuEnabled);
    }, [menu, businessWaiterCallEnabled]);

    useEffect(() => {
        const fetchMenu = async () => {
            const { data, error } = await supabase
                .from('qr_menus')
                .select('*, businesses(*)')
                .eq('id', id)
                .single();

            if (data) {
                setMenu(data);
                if (data.business_id) {
                    // Fetch QR Settings
                    const { data: settings } = await supabase.from('qr_settings')
                        .select('*')
                        .eq('business_id', data.business_id)
                        .single();
                    if (settings) setQrSettings(settings);

                    // Fetch pos_settings
                    const { data: posSettings } = await supabase.from('pos_settings')
                        .select('system_flags')
                        .eq('business_id', data.business_id)
                        .single();

                    if (posSettings) {
                        setQrSettings(prev => ({ ...prev, feedback_active: posSettings.system_flags?.feedback_active }));

                        // Combined check for waiter call: 
                        // It must be enabled business-wide AND (specifically for this menu OR default to true)
                        const businessEnabled = posSettings.system_flags?.enable_waiter_call || false;
                        setBusinessWaiterCallEnabled(businessEnabled);

                        // Fetch Seating Data
                        const { data: areas } = await supabase
                            .from('seating_areas')
                            .select('*')
                            .eq('business_id', data.business_id)
                            .is('is_deleted', false)
                            .order('sort_order', { ascending: true });
                        setSeatingAreas(areas || []);

                        const { data: tables } = await supabase
                            .from('tables')
                            .select('*')
                            .eq('business_id', data.business_id)
                            .is('is_deleted', false);
                        setAllTables(tables || []);
                    }
                }
            }
            setLoading(false);
        };
        fetchMenu();

        // Subscribe to menu changes
        const menuChannel = supabase
            .channel(`qr_home_menu_${id}`)
            .on('postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'qr_menus',
                    filter: `id=eq.${id}`
                },
                (payload) => {
                    if (payload.new) {
                        setMenu(payload.new);
                    }
                }
            )
            .subscribe();

        // Subscribe to pos_settings changes
        const settingsChannel = supabase
            .channel(`qr_home_settings_${id}`)
            .on('postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'pos_settings',
                    filter: `business_id=eq.${menu?.business_id}`
                },
                (payload) => {
                    if (payload.new && payload.new.system_flags) {
                        setBusinessWaiterCallEnabled(payload.new.system_flags.enable_waiter_call || false);
                        setQrSettings(prev => ({ ...prev, feedback_active: payload.new.system_flags.feedback_active }));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(menuChannel);
            supabase.removeChannel(settingsChannel);
        };
    }, [id]);

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        console.log('Feedback form submitted:', feedbackForm);
        console.log('Menu business_id:', menu?.business_id);

        try {
            const payload = {
                business_id: menu.business_id,
                ...feedbackForm
            };
            console.log('Sending payload:', payload);

            const response = await fetch(`http://${window.location.hostname}:5000/isletme/qr/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('Response status:', response.status);
            const responseData = await response.json();
            console.log('Response data:', responseData);

            if (response.ok) {
                alert('Geri bildiriminiz başarıyla gönderildi!');
                setIsFeedbackModalOpen(false);
                setFeedbackForm({ full_name: '', phone: '', email: '', subject: 'Diğer', message: '' });
            } else {
                console.error('Server error:', responseData);
                alert(`Hata: ${responseData.error || 'Bilinmeyen hata'}`);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            alert('Bir hata oluştu. Lütfen tekrar deneyin. Hata: ' + error.message);
        }
    };

    const handleWaiterCall = async (table) => {
        if (!table?.name) {
            alert('Lütfen bir masa seçin.');
            return;
        }

        try {
            const { error } = await supabase
                .from('waiter_calls')
                .insert({
                    business_id: menu.business_id,
                    table_number: table.name,
                    area_name: selectedArea?.name,
                    status: 'pending'
                });

            if (error) throw error;
            alert('Garson çağrınız iletildi.');
            setIsWaiterCallModalOpen(false);
            setWaiterCallStep('area');
            setSelectedArea(null);
        } catch (error) {
            console.error('Error calling waiter:', error);
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        }
    };

    const handleCloseWaiterCallModal = () => {
        setIsWaiterCallModalOpen(false);
        setWaiterCallStep('area');
        setSelectedArea(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    const themes = [
        { id: 'theme1', name: 'Tasarım 1', color: '#2C344E', secondary: '#DED6B6' },
        { id: 'theme2', name: 'Tasarım 2', color: '#10B981', secondary: '#ECFDF5' },
        { id: 'theme3', name: 'Tasarım 3', color: '#F59E0B', secondary: '#FFFBEB' },
        { id: 'theme4', name: 'Tasarım 4', color: '#EF4444', secondary: '#FEF2F2' },
    ];

    const currentTheme = menu?.theme_id ? themes.find(t => t.id === menu.theme_id) || themes[0] : themes[0];

    const coverImage = menu?.cover_url || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560';
    const logoImage = menu?.logo_url || menu?.businesses?.logo_url;
    const title = menu?.title_tr || 'HOŞGELDİNİZ';
    const subtitle = menu?.subtitle_tr || 'Menüyü incelemek için tıklayın';

    return (
        <div className="min-h-screen flex flex-col items-center justify-between relative overflow-hidden font-sans">
            {/* Background Image with Dark Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10000ms] hover:scale-110"
                style={{ backgroundImage: `url('${coverImage}')` }}
            >
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"></div>
            </div>

            {/* Top Navigation - Waiter Call Button */}
            {waiterCallEnabled && (
                <div className="absolute top-6 left-6 z-50">
                    <button
                        onClick={() => setIsWaiterCallModalOpen(true)}
                        className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-lg active:scale-90 transition-all"
                    >
                        <Bell size={24} />
                    </button>
                </div>
            )}

            {/* Logo Card & Welcome Text - Centered vertically */}
            <div className="z-10 flex-1 flex flex-col items-center justify-center gap-8 px-6 w-full animate-in fade-in duration-1000">
                <div className="w-52 h-52 bg-white rounded-[40px] shadow-2xl flex items-center justify-center p-8 overflow-hidden transform hover:scale-105 transition-transform duration-500">
                    {logoImage ? (
                        <img src={logoImage} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <div className="flex flex-col items-center gap-1 text-center">
                            <span className="text-xl font-black text-gray-800 leading-tight tracking-wider uppercase">
                                {menu?.businesses?.name || "SientoPOS"}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-4xl font-black text-white tracking-widest drop-shadow-lg uppercase">{title}</h1>
                    <p className="text-white/90 font-medium tracking-tight drop-shadow-md">{subtitle}</p>
                </div>
            </div>

            {/* Bottom Interaction Area */}
            <div className="z-10 w-full flex flex-col items-center animate-in slide-in-from-bottom-10 duration-700 delay-300">
                {/* Main Action Panel - Full Width as requested */}
                <div
                    className="w-full rounded-t-[40px] py-10 flex flex-col items-center justify-center gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] relative cursor-pointer transition-all transform active:scale-95 group overflow-hidden"
                    style={{ backgroundColor: currentTheme.color }}
                    onClick={() => navigate(`/qr/menu/${id}`)}
                >

                    {/* Sientopos Badge - The vertical beige strip */}
                    <div
                        className="absolute left-0 top-[20%] bottom-[20%] w-1.5 rounded-r-lg shadow-sm"
                        style={{ backgroundColor: currentTheme.secondary }}
                    ></div>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <div
                            className="text-[8px] font-black [writing-mode:vertical-lr] tracking-[0.3em] uppercase rotate-180"
                            style={{ color: currentTheme.secondary, opacity: 0.8 }}
                        >
                            SIENTOPOS
                        </div>
                    </div>

                    <Book size={32} className="text-white transition-transform group-hover:scale-110" strokeWidth={1.5} />
                    <span className="text-xl font-black text-white tracking-tight">Menüye Git</span>
                </div>

                {/* Footer Utility Bar - Expandable Grid */}
                <div className="w-full bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.05)] border-t border-gray-100 relative">
                    {/* Chevron Button - Minimal */}
                    <button
                        onClick={() => setIsFooterExpanded(!isFooterExpanded)}
                        className="absolute -top-5 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all z-20 border border-gray-100"
                    >
                        <ChevronDown
                            size={16}
                            className={`transition-transform duration-300 ${isFooterExpanded ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {/* Icon Grid */}
                    <div
                        className={`grid grid-cols-4 gap-2 px-3 transition-all duration-500 overflow-hidden ${isFooterExpanded ? 'py-5 max-h-96' : 'py-3 max-h-20'
                            }`}
                    >
                        {/* Feedback Icon */}
                        {qrSettings?.feedback_active && (
                            <button
                                onClick={() => setIsFeedbackModalOpen(true)}
                                className="flex flex-col items-center gap-0.5 group"
                            >
                                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors shadow-sm">
                                    <MessageCircle size={18} />
                                </div>
                                <span className="text-[8px] font-medium text-gray-600">Geri Bildirim</span>
                            </button>
                        )}

                        {/* WiFi Icon */}
                        {qrSettings?.wifi_name && (
                            <button
                                onClick={() => setIsWifiModalOpen(true)}
                                className="flex flex-col items-center gap-0.5 group"
                            >
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors shadow-sm">
                                    <Wifi size={18} />
                                </div>
                                <span className="text-[8px] font-medium text-gray-600">Wi-Fi</span>
                            </button>
                        )}

                        {/* Instagram */}
                        {qrSettings?.social_instagram && (
                            <a
                                href={`https://instagram.com/${qrSettings.social_instagram}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex flex-col items-center gap-0.5 group"
                            >
                                <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-[#E1306C] group-hover:bg-pink-100 transition-colors shadow-sm">
                                    <Instagram size={18} />
                                </div>
                                <span className="text-[8px] font-medium text-gray-600">Instagram</span>
                            </a>
                        )}

                        {/* Twitter */}
                        {qrSettings?.social_twitter && (
                            <a
                                href={`https://twitter.com/${qrSettings.social_twitter}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex flex-col items-center gap-0.5 group"
                            >
                                <div className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center text-[#1DA1F2] group-hover:bg-sky-100 transition-colors shadow-sm">
                                    <Twitter size={18} />
                                </div>
                                <span className="text-[8px] font-medium text-gray-600">Twitter</span>
                            </a>
                        )}

                        {/* YouTube */}
                        {qrSettings?.social_youtube && (
                            <a
                                href={`https://youtube.com/@${qrSettings.social_youtube}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex flex-col items-center gap-0.5 group"
                            >
                                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-[#FF0000] group-hover:bg-red-100 transition-colors shadow-sm">
                                    <Youtube size={18} />
                                </div>
                                <span className="text-[8px] font-medium text-gray-600">YouTube</span>
                            </a>
                        )}

                        {/* Facebook */}
                        {qrSettings?.social_facebook && (
                            <a
                                href={`https://facebook.com/${qrSettings.social_facebook}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex flex-col items-center gap-0.5 group"
                            >
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-[#1877F2] group-hover:bg-blue-100 transition-colors shadow-sm">
                                    <Facebook size={18} />
                                </div>
                                <span className="text-[8px] font-medium text-gray-600">Facebook</span>
                            </a>
                        )}

                        {/* TikTok */}
                        {qrSettings?.social_tiktok && (
                            <a
                                href={`https://tiktok.com/@${qrSettings.social_tiktok}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex flex-col items-center gap-0.5 group"
                            >
                                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-black group-hover:bg-gray-100 transition-colors shadow-sm">
                                    <Video size={18} />
                                </div>
                                <span className="text-[8px] font-medium text-gray-600">TikTok</span>
                            </a>
                        )}

                        {/* Google Review */}
                        {qrSettings?.social_google && (
                            <a
                                href={qrSettings.social_google}
                                target="_blank"
                                rel="noreferrer"
                                className="flex flex-col items-center gap-0.5 group"
                            >
                                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 group-hover:bg-orange-100 transition-colors shadow-sm">
                                    <Star size={18} fill="currentColor" className="text-orange-500" />
                                </div>
                                <span className="text-[8px] font-medium text-gray-600">Google</span>
                            </a>
                        )}
                    </div>
                </div>

                {/* WiFi Popup Overlay */}
                {isWifiModalOpen && qrSettings && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl p-8 w-full max-w-[320px] shadow-2xl relative animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setIsWifiModalOpen(false)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex flex-col items-center text-center gap-6 py-2">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 shadow-inner">
                                    <Wifi size={40} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Wi-Fi Bağlantısı</h3>
                                    <p className="text-sm text-gray-500 mt-1">Aşağıdaki bilgileri kullanarak ağa bağlanabilirsiniz.</p>
                                </div>

                                <div className="w-full space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 group cursor-pointer hover:border-blue-200 transition-colors">
                                        <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1.5 flex justify-between">
                                            <span>Ağ Adı</span>
                                        </div>
                                        <div className="font-bold text-lg text-gray-800 select-all font-mono">{qrSettings.wifi_name}</div>
                                    </div>

                                    {qrSettings.wifi_password && (
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 group cursor-pointer hover:border-blue-200 transition-colors">
                                            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1.5 flex justify-between">
                                                <span>Parola</span>
                                            </div>
                                            <div className="font-bold text-lg text-gray-800 select-all font-mono">{qrSettings.wifi_password}</div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setIsWifiModalOpen(false)}
                                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-base hover:bg-gray-800 transition-colors mt-2 shadow-lg hover:shadow-xl active:scale-95 transform"
                                >
                                    Tamam, Kapat
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Modal */}
                {isFeedbackModalOpen && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl p-8 w-full max-w-[400px] shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={() => setIsFeedbackModalOpen(false)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex flex-col gap-6 py-2">
                                <div className="flex flex-col items-center text-center gap-2">
                                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 shadow-inner">
                                        <MessageCircle size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">Geri Bildirim</h3>
                                    <p className="text-sm text-gray-500">Görüşlerinizi bizimle paylaşın</p>
                                </div>

                                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                                        <input
                                            type="text"
                                            required
                                            value={feedbackForm.full_name}
                                            onChange={(e) => setFeedbackForm({ ...feedbackForm, full_name: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon No</label>
                                        <input
                                            type="tel"
                                            value={feedbackForm.phone}
                                            onChange={(e) => setFeedbackForm({ ...feedbackForm, phone: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                                        <input
                                            type="email"
                                            value={feedbackForm.email}
                                            onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Konu</label>
                                        <select
                                            value={feedbackForm.subject}
                                            onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                                        >
                                            <option value="Temizlik">Temizlik</option>
                                            <option value="Fiyat">Fiyat</option>
                                            <option value="Teşekkür">Teşekkür</option>
                                            <option value="Şikayet">Şikayet</option>
                                            <option value="Diğer">Diğer</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mesajınız</label>
                                        <textarea
                                            required
                                            maxLength={1000}
                                            value={feedbackForm.message}
                                            onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-gray-900"
                                            placeholder="Mesajınızı buraya yazın..."
                                        />
                                        <div className="text-xs text-gray-400 mt-1 text-right">{feedbackForm.message.length}/1000</div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-base hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl active:scale-95 transform"
                                    >
                                        Gönder
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Waiter Call Modal */}
                {isWaiterCallModalOpen && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-[32px] p-6 w-full max-w-[340px] shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                            <button
                                onClick={handleCloseWaiterCallModal}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex flex-col items-center text-center gap-4 pt-2 mb-4">
                                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-inner">
                                    <Bell size={32} />
                                </div>
                                <div className="px-4">
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Garson Çağır</h3>
                                    <p className="text-xs text-gray-500 mt-1 font-medium">
                                        {waiterCallStep === 'area' ? 'Lütfen bulunduğunuz bölümü seçin' : 'Lütfen masanızı seçin'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-1 custom-scrollbar">
                                {waiterCallStep === 'area' ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        {seatingAreas.map(area => (
                                            <button
                                                key={area.id}
                                                onClick={() => {
                                                    setSelectedArea(area);
                                                    setWaiterCallStep('table');
                                                }}
                                                className="w-full p-4 bg-gray-50 hover:bg-orange-50 border border-gray-100 hover:border-orange-200 rounded-2xl text-left transition-all group flex items-center justify-between"
                                            >
                                                <span className="font-bold text-gray-700 group-hover:text-orange-700">{area.name}</span>
                                                <ChevronDown size={18} className="-rotate-90 text-gray-400 group-hover:text-orange-400" />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => setWaiterCallStep('area')}
                                            className="flex items-center gap-1 text-xs font-bold text-orange-600 mb-2 hover:underline"
                                        >
                                            <ArrowLeft size={14} /> Geri Dön
                                        </button>
                                        <div className="grid grid-cols-3 gap-2 pb-2">
                                            {allTables
                                                .filter(t => t.seating_area_id === selectedArea?.id)
                                                .sort((a, b) => {
                                                    const aNum = parseInt(a.name.replace(/\D/g, '')) || 0;
                                                    const bNum = parseInt(b.name.replace(/\D/g, '')) || 0;
                                                    return aNum - bNum;
                                                })
                                                .map(table => (
                                                    <button
                                                        key={table.id}
                                                        onClick={() => handleWaiterCall(table)}
                                                        className="aspect-square flex flex-col items-center justify-center p-2 bg-gray-50 hover:bg-orange-600 border border-gray-100 hover:border-orange-500 rounded-2xl transition-all group shadow-sm active:scale-95"
                                                    >
                                                        <span className="text-base font-black text-gray-800 group-hover:text-white">{table.name}</span>
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRHome;
