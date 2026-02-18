import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { ChevronLeft, ChevronRight, Home, ChevronDown, Globe, Coffee, Utensils, UtensilsCrossed, X, Megaphone, MessageCircle, Bell, Check, ArrowLeft, BookOpen } from 'lucide-react';
import 'flag-icons/css/flag-icons.min.css';

const LANGUAGES = [
    { code: 'tr', flagCode: 'tr', label: 'Türkçe', field: 'name' },
    { code: 'en', flagCode: 'us', label: 'English', field: 'name_en' },
    { code: 'es', flagCode: 'es', label: 'Español', field: 'name_es' },
    { code: 'fr', flagCode: 'fr', label: 'Français', field: 'name_fr' },
    { code: 'ru', flagCode: 'ru', label: 'Русский', field: 'name_ru' }
];

const QRMenuPublic = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [menu, setMenu] = useState(null);
    const [publishedData, setPublishedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [activeCategory, setActiveCategory] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [currentCampaignIndex, setCurrentCampaignIndex] = useState(0);
    const [happyHours, setHappyHours] = useState([]);
    const [timedDiscounts, setTimedDiscounts] = useState([]);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [feedbackActive, setFeedbackActive] = useState(false);
    const [feedbackForm, setFeedbackForm] = useState({
        full_name: '',
        phone: '',
        email: '',
        subject: 'Diğer',
        message: ''
    });
    const [isWaiterCallModalOpen, setIsWaiterCallModalOpen] = useState(false);
    const [waiterCallEnabled, setWaiterCallEnabled] = useState(false);
    const [businessWaiterCallEnabled, setBusinessWaiterCallEnabled] = useState(false);
    const [tableNumber, setTableNumber] = useState('');
    const [seatingAreas, setSeatingAreas] = useState([]);
    const [allTables, setAllTables] = useState([]);
    const [selectedArea, setSelectedArea] = useState(null);
    const [waiterCallStep, setWaiterCallStep] = useState('area'); // 'area' | 'table'
    const [selectedLanguage, setSelectedLanguage] = useState('tr');
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
    const languageMenuRef = useRef(null);

    // Click outside listener for language menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
                setIsLanguageMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter products based on selected language
    const availableLanguages = useMemo(() => {
        const langs = new Set(['tr']);
        publishedData.forEach(cat => {
            // Check products
            cat.products?.forEach(p => {
                if (p.name_en) langs.add('en');
                if (p.name_es) langs.add('es');
                if (p.name_fr) langs.add('fr');
                if (p.name_ru) langs.add('ru');
            });
            // Check categories (root)
            if (cat.name_en) langs.add('en');
            if (cat.name_es) langs.add('es');
            if (cat.name_fr) langs.add('fr');
            if (cat.name_ru) langs.add('ru');

            cat.subCategories?.forEach(sub => {
                // Check sub products
                sub.products?.forEach(p => {
                    if (p.name_en) langs.add('en');
                    if (p.name_es) langs.add('es');
                    if (p.name_fr) langs.add('fr');
                    if (p.name_ru) langs.add('ru');
                });
                // Check subcategories
                if (sub.name_en) langs.add('en');
                if (sub.name_es) langs.add('es');
                if (sub.name_fr) langs.add('fr');
                if (sub.name_ru) langs.add('ru');
            });
        });
        return Array.from(langs);
    }, [publishedData]);

    const localizedData = useMemo(() => {
        if (!publishedData) return [];
        const langInfo = LANGUAGES.find(l => l.code === selectedLanguage);
        const nameField = langInfo?.field || 'name';
        const descField = nameField.replace('name', 'description');
        const noteField = nameField.replace('name', 'note');

        return publishedData
            .filter(cat => selectedLanguage === 'tr' || (cat[nameField] && cat[nameField].trim() !== ''))
            .map(cat => ({
                ...cat,
                name: cat[nameField] || cat.name,
                description: cat[descField] || cat.description,
                note: cat[noteField] || cat.note,
                products: (cat.products || [])
                    .filter(p => selectedLanguage === 'tr' || (p[nameField] && p[nameField].trim() !== ''))
                    .map(p => ({
                        ...p,
                        name: p[nameField] || p.name,
                        description: p[descField] || p.description,
                        note: p[noteField] || p.note
                    })),
                subCategories: (cat.subCategories || [])
                    .filter(sub => selectedLanguage === 'tr' || (sub[nameField] && sub[nameField].trim() !== ''))
                    .map(sub => ({
                        ...sub,
                        name: sub[nameField] || sub.name,
                        description: sub[descField] || sub.description,
                        note: sub[noteField] || sub.note,
                        products: (sub.products || [])
                            .filter(p => selectedLanguage === 'tr' || (p[nameField] && p[nameField].trim() !== ''))
                            .map(p => ({
                                ...p,
                                name: p[nameField] || p.name,
                                description: p[descField] || p.description,
                                note: p[noteField] || p.note
                            }))
                    }))
                    .filter(sub => sub.products.length > 0)
            }))
            .filter(cat => (cat.products && cat.products.length > 0) || (cat.subCategories && cat.subCategories.length > 0));
    }, [publishedData, selectedLanguage]);

    useEffect(() => {
        const menuEnabled = menu?.allow_waiter_call !== false;
        setWaiterCallEnabled(businessWaiterCallEnabled && menuEnabled);
    }, [menu, businessWaiterCallEnabled]);

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
                .from('qr_menus')
                .select('*, businesses(*)')
                .eq('id', id)
                .single();

            if (data) {
                setMenu(data);
                if (data.published_data) {
                    setPublishedData(data.published_data);
                    // Set first category as active by default
                    if (data.published_data.length > 0) {
                        setActiveCategory(data.published_data[0].id);
                    }
                }

                // Fetch active campaigns
                const { data: campaignsData } = await supabase
                    .from('campaigns')
                    .select('*')
                    .eq('business_id', data.business_id)
                    .eq('is_active', true)
                    .eq('is_deleted', false);

                if (campaignsData) {
                    // Filter by date
                    const now = new Date();
                    const activeCampaigns = campaignsData.filter(c => {
                        const start = new Date(c.start_date);
                        const end = new Date(c.end_date);
                        // Set start to beginning of day and end to end of day to be inclusive
                        start.setHours(0, 0, 0, 0);
                        end.setHours(23, 59, 59, 999);
                        return now >= start && now <= end;
                    });
                    setCampaigns(activeCampaigns);
                }

                // Fetch active happy hours
                const { data: hhData } = await supabase
                    .from('happy_hours')
                    .select('*')
                    .eq('business_id', data.business_id)
                    .eq('is_active', true)
                    .eq('is_deleted', false);

                if (hhData) {
                    console.log('Fetched Happy Hours:', hhData);
                    const now = new Date();
                    const activeHH = hhData.filter(hh => {
                        const start = hh.start_date ? new Date(hh.start_date) : null;
                        const end = hh.end_date ? new Date(hh.end_date) : null;
                        if (start) start.setHours(0, 0, 0, 0);
                        if (end) end.setHours(23, 59, 59, 999);

                        const isDateInRange = (!start || now >= start) && (!end || now <= end);
                        console.log(`HH "${hh.title}" - Date Range: `, { start, end, now, isDateInRange });
                        if (!isDateInRange) return false;

                        // Check daily schedule
                        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                        const today = days[now.getDay()];
                        const config = hh.days_config?.[today];
                        console.log(`HH "${hh.title}" - Today: `, today, 'Config:', config);

                        if (config?.active) {
                            const [startH, startM] = config.start.split(':').map(Number);
                            const [endH, endM] = config.end.split(':').map(Number);
                            const startTotal = startH * 60 + startM;
                            const endTotal = endH * 60 + endM;
                            const nowTotal = now.getHours() * 60 + now.getMinutes();

                            const isTimeInRange = nowTotal >= startTotal && nowTotal <= endTotal;
                            console.log(`HH "${hh.title}" - Time Range: `, { startTotal, endTotal, nowTotal, isTimeInRange });
                            return isTimeInRange;
                        }
                        return false;
                    });
                    console.log('Active Happy Hours:', activeHH);
                    setHappyHours(activeHH);
                }

                // Fetch active timed discounts
                const { data: tdData } = await supabase
                    .from('timed_discounts')
                    .select('*')
                    .eq('business_id', data.business_id)
                    .eq('is_active', true)
                    .eq('is_deleted', false);

                if (tdData) {
                    const now = new Date();
                    const activeTD = tdData.filter(td => {
                        const start = td.start_date ? new Date(td.start_date) : null;
                        const end = td.end_date ? new Date(td.end_date) : null;
                        if (start) start.setHours(0, 0, 0, 0);
                        if (end) end.setHours(23, 59, 59, 999);

                        return (!start || now >= start) && (!end || now <= end);
                    });
                    setTimedDiscounts(activeTD);
                }

                // Fetch pos_settings for feedback_active flag
                const { data: posSettings } = await supabase.from('pos_settings')
                    .select('system_flags')
                    .eq('business_id', data.business_id)
                    .single();
                if (posSettings) {
                    setFeedbackActive(posSettings.system_flags?.feedback_active || false);

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
            setLoading(false);
        };
        fetchData();

        // Subscribe to menu changes
        const menuChannel = supabase
            .channel(`qr_menu_${id} `)
            .on('postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'qr_menus',
                    filter: `id = eq.${id} `
                },
                (payload) => {
                    console.log('Realtime update received:', payload);
                    if (payload.new) {
                        setMenu(payload.new);
                        if (payload.new.published_data) {
                            setPublishedData(payload.new.published_data);
                        }
                    }
                }
            )
            .subscribe();

        // Subscribe to pos_settings changes
        const settingsChannel = supabase
            .channel(`qr_menu_settings${id} `)
            .on('postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'pos_settings',
                    filter: `business_id = eq.${menu?.business_id} `
                },
                (payload) => {
                    if (payload.new && payload.new.system_flags) {
                        setBusinessWaiterCallEnabled(payload.new.system_flags.enable_waiter_call || false);
                        setFeedbackActive(payload.new.system_flags.feedback_active || false);
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

    const toggleExpand = (catId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [catId]: !prev[catId]
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-100 border-t-gray-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Filter publishedData based on active root category
    const activeRootCategory = localizedData.find(cat => cat.id === activeCategory);

    const themes = [
        { id: 'theme1', name: 'Tasarım 1', color: '#2C344E', secondary: '#DED6B6' },
        { id: 'theme2', name: 'Tasarım 2', color: '#10B981', secondary: '#ECFDF5' },
        { id: 'theme3', name: 'Tasarım 3', color: '#F59E0B', secondary: '#FFFBEB' },
        { id: 'theme4', name: 'Tasarım 4', color: '#EF4444', secondary: '#FEF2F2' },
    ];

    const currentTheme = menu?.theme_id ? themes.find(t => t.id === menu.theme_id) || themes[0] : themes[0];

    // Helper to get discounted price for a product
    const getProductPriceInfo = (product) => {
        let discount = null;
        let discountLabel = '';

        // 1. Check Timed Discounts (Higher priority)
        const td = timedDiscounts.find(t =>
            t.target_ids?.includes(product.id) ||
            (t.target_type === 'category' && t.target_ids?.includes(product.category_id))
        );

        if (td) {
            discount = td;
            discountLabel = 'SÜRELİ İNDİRİM';
        } else {
            // 2. Check Happy Hour
            const hh = happyHours.find(h =>
                h.target_ids?.includes(product.id) ||
                (h.target_type === 'category' && h.target_ids?.includes(product.category_id))
            );
            if (hh) {
                discount = hh;
                discountLabel = 'HAPPY HOUR';
            }
        }

        if (discount) {
            let discountedPrice = parseFloat(product.price);
            if (discount.discount_type === 'percentage') {
                discountedPrice = discountedPrice * (1 - (discount.discount_amount / 100));
            } else {
                discountedPrice = discountedPrice - discount.discount_amount;
            }
            return {
                originalPrice: parseFloat(product.price),
                discountedPrice: Math.max(0, discountedPrice),
                hasDiscount: true,
                discountLabel: discountLabel
            };
        }
        return { originalPrice: parseFloat(product.price), hasDiscount: false };
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans text-gray-800 pb-10">
            {/* Top Navigation */}
            <div className="sticky top-0 z-50 bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100/50 shadow-sm">
                <div className="flex-1 flex items-center gap-1">
                    <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    {waiterCallEnabled && (
                        <button
                            onClick={() => setIsWaiterCallModalOpen(true)}
                            className="p-2 text-orange-500 active:scale-90 transition-transform"
                        >
                            <Bell size={22} className="fill-orange-500" />
                        </button>
                    )}
                    {campaigns.length > 0 && (
                        <button
                            onClick={() => {
                                setCurrentCampaignIndex(0);
                                setShowCampaignModal(true);
                            }}
                            className="p-2 text-red-500 animate-pulse relative active:scale-90 transition-transform"
                        >
                            <Megaphone size={22} className="fill-red-500" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full border border-white"></span>
                        </button>
                    )}
                </div>

                <h1
                    className="flex-shrink-0 text-xl font-black tracking-tight flex items-center gap-1 uppercase whitespace-nowrap"
                    style={{ color: currentTheme.color }}
                >
                    {menu?.title_tr || "SientoPOS"}
                </h1>

                <div className="flex-1 flex items-center justify-end gap-2">
                    {/* Custom Language Selector */}
                    <div className="relative" ref={languageMenuRef}>
                        <button
                            onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                            className="flex items-center justify-center bg-white border border-gray-100 rounded-full w-10 h-10 shadow-sm hover:border-gray-200 transition-all active:scale-95"
                        >
                            <span className={`fi fi-${LANGUAGES.find(l => l.code === selectedLanguage)?.flagCode} w-6 h-6`}></span>
                        </button>

                        {isLanguageMenuOpen && (
                            <div className="dropdown-menu absolute right-0 top-full mt-2 w-14 bg-white dark:bg-dropdown-dark rounded-xl shadow-popover border border-slate-100 dark:border-slate-600/30 overflow-hidden flex flex-col items-center py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setSelectedLanguage(lang.code);
                                            setIsLanguageMenuOpen(false);
                                        }}
                                        className={`w-full h-9 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-600/50 transition-colors ${selectedLanguage === lang.code ? 'bg-slate-50 dark:bg-slate-600/50' : ''}`}
                                    >
                                        <span className={`fi fi-${lang.flagCode} w-6 h-6`}></span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={() => navigate(`/qr/home/${id}`)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <Home size={22} />
                    </button>
                </div>
            </div>

            {/* Horizontal Category Switcher */}
            <div className="bg-white py-6 overflow-x-auto no-scrollbar border-b border-gray-50">
                <div className="flex gap-8 px-6 min-w-max items-start">
                    {localizedData.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className="flex flex-col items-center gap-3 group outline-none transition-transform active:scale-90"
                        >
                            <div
                                className={`w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border transition-all duration-300 ${activeCategory === cat.id ? 'border-2 p-1' : 'border-gray-100 shadow-sm opacity-60'}`}
                                style={activeCategory === cat.id ? { borderColor: currentTheme.color } : {}}
                            >
                                {cat.image_url ? (
                                    <div className="w-full h-full rounded-2xl overflow-hidden">
                                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-full h-full bg-gray-50 text-gray-300 flex items-center justify-center">
                                        {cat.name.toLowerCase().includes('yemek') || cat.name.toLowerCase().includes('food') || cat.name.toLowerCase().includes('yiyecek') ? <Utensils size={32} /> : <Coffee size={32} />}
                                    </div>
                                )}
                            </div>
                            <span
                                className={`text-[11px] font-black uppercase tracking-widest transition-colors ${activeCategory === cat.id ? '' : 'text-gray-400'}`}
                                style={activeCategory === cat.id ? { color: currentTheme.color } : {}}
                            >
                                {cat.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area - Only show content of active root category */}
            <div className="flex-1 p-4 space-y-4">
                {activeRootCategory ? (
                    <div className="animate-in fade-in duration-500">
                        {/* Direct Products in Root Category */}
                        {activeRootCategory.products?.length > 0 && (
                            <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100/50 p-2 mb-6">
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mt-3 mb-4 block ml-4">ÖNERİLENLER</span>
                                {activeRootCategory.products.map((product, idx) => (
                                    <div
                                        key={product.id}
                                        onClick={() => setSelectedProduct(product)}
                                        className={`flex items-center justify-between py-3 px-4 ${idx !== (activeRootCategory.products.length - 1) ? 'border-b border-gray-50' : ''} group cursor-pointer active:bg-gray-50 transition-colors`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-100/30 flex-shrink-0">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-200 uppercase">IMG</div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800 text-[13px] uppercase tracking-tight">{product.name}</span>
                                                {(product.description || getProductPriceInfo(product).hasDiscount) && (
                                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                                        {product.description && <p className="text-[10px] text-gray-400 font-medium tracking-tight">{product.description}</p>}
                                                        {getProductPriceInfo(product).hasDiscount && (
                                                            <span className="text-[9px] font-black text-red-600 bg-red-50 w-fit px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                {getProductPriceInfo(product).discountLabel}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            {getProductPriceInfo(product).hasDiscount ? (
                                                <>
                                                    <span className="text-[10px] text-gray-400 line-through tabular-nums decoration-red-400/50">
                                                        {getProductPriceInfo(product).originalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺
                                                    </span>
                                                    <span className="font-bold text-[13px] tabular-nums tracking-tighter" style={{ color: currentTheme.color }}>
                                                        {getProductPriceInfo(product).discountedPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="font-bold text-[13px] tabular-nums tracking-tighter" style={{ color: currentTheme.color }}>
                                                    {parseFloat(product.price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Subcategories with Accordions */}
                        {(activeRootCategory.subCategories || activeRootCategory.sub_categories)?.map(sub => (
                            <div key={sub.id} className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100/50 overflow-hidden mb-4">
                                <div
                                    onClick={() => toggleExpand(sub.id)}
                                    className="p-4 flex items-center justify-between active:bg-gray-50 transition-colors cursor-pointer"
                                    style={expandedCategories[sub.id] ? { backgroundColor: `${currentTheme.color}08` } : {}}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                            {sub.image_url ? (
                                                <img src={sub.image_url} alt={sub.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div
                                                    className="w-full h-full flex items-center justify-center"
                                                    style={{ backgroundColor: `${currentTheme.color}0D`, color: `${currentTheme.color}4D` }}
                                                >
                                                    {sub.name.toLowerCase().includes('yemek') || sub.name.toLowerCase().includes('food') || activeRootCategory.name.toLowerCase().includes('yiyecek') ? <Utensils size={20} /> : <Coffee size={20} />}
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-gray-800 tracking-tight text-[16px]">{sub.name}</h3>
                                    </div>
                                    <div className={`text-gray-300 transition-transform duration-300 ${expandedCategories[sub.id] ? 'rotate-180' : ''}`}>
                                        <ChevronDown size={20} />
                                    </div>
                                </div>

                                {expandedCategories[sub.id] && (
                                    <div className="px-2 pb-2 animate-in slide-in-from-top-4 duration-300 border-t border-gray-50">
                                        {sub.products?.map((product, idx) => (
                                            <div
                                                key={product.id}
                                                onClick={() => setSelectedProduct(product)}
                                                className={`flex items-center justify-between py-3 px-3 ${idx !== (sub.products.length - 1) ? 'border-b border-gray-50' : ''} group cursor-pointer active:bg-gray-50 transition-colors`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-100/30 flex-shrink-0">
                                                        {product.image_url ? (
                                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-200 uppercase">IMG</div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-800 text-[13px] uppercase tracking-tight">{product.name}</span>
                                                        {(product.description || getProductPriceInfo(product).hasDiscount) && (
                                                            <div className="flex flex-col gap-0.5 mt-0.5">
                                                                {product.description && <p className="text-[10px] text-gray-400 font-medium tracking-tight">{product.description}</p>}
                                                                {getProductPriceInfo(product).hasDiscount && (
                                                                    <span className="text-[9px] font-black text-red-600 bg-red-50 w-fit px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                        {getProductPriceInfo(product).discountLabel}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    {getProductPriceInfo(product).hasDiscount ? (
                                                        <>
                                                            <span className="text-[10px] text-gray-400 line-through tabular-nums decoration-red-400/50">
                                                                {getProductPriceInfo(product).originalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺
                                                            </span>
                                                            <span className="font-bold text-[13px] tabular-nums tracking-tighter" style={{ color: currentTheme.color }}>
                                                                {getProductPriceInfo(product).discountedPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="font-bold text-[13px] tabular-nums tracking-tighter" style={{ color: currentTheme.color }}>
                                                            {parseFloat(product.price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200">
                            <Coffee size={40} />
                        </div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest text-center">
                            Henüz ürün atanmamış veya<br />menü boş görünüyor.
                        </p>
                    </div>
                )}
            </div>

            {/* Product Detail Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="absolute inset-0"
                        onClick={() => setSelectedProduct(null)}
                    ></div>
                    <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedProduct(null)}
                            className="absolute top-4 right-4 z-10 w-9 h-9 bg-[#B30000] text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                        >
                            <X size={20} className="stroke-[2.5]" />
                        </button>

                        {/* Image Area */}
                        <div className="w-full aspect-square bg-gray-100 relative">
                            {selectedProduct.image_url ? (
                                <img
                                    src={selectedProduct.image_url}
                                    alt={selectedProduct.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                                    <UtensilsCrossed size={48} />
                                    <span className="text-xs font-bold tracking-widest uppercase">Görsel Yok</span>
                                </div>
                            )}
                            {/* Gradient Overlay for Text Visibility */}
                            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent opacity-0"></div>
                        </div>

                        {/* Content Area */}
                        <div className="p-6 pt-5">
                            <h2
                                className="text-xl font-black uppercase leading-tight tracking-tight mb-3"
                                style={{ color: currentTheme.color }}
                            >
                                {selectedProduct.name}
                            </h2>

                            {selectedProduct.description && (
                                <div className="space-y-4">
                                    <p className="text-[#5A6B89] text-sm leading-relaxed font-medium">
                                        {selectedProduct.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Campaign Detail Modal */}
            {showCampaignModal && campaigns.length > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setShowCampaignModal(false)}></div>
                    <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowCampaignModal(false)}
                            className="absolute top-4 right-4 z-20 w-9 h-9 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                        >
                            <X size={20} className="stroke-[2.5]" />
                        </button>

                        {/* Carousel Content */}
                        <div className="relative">
                            {/* Image Area */}
                            {campaigns[currentCampaignIndex].image_url ? (
                                <div className="w-full aspect-[4/3] bg-gray-100 relative">
                                    <img src={campaigns[currentCampaignIndex].image_url} alt={campaigns[currentCampaignIndex].title} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-full h-32 bg-red-50 flex items-center justify-center text-red-500">
                                    <Megaphone size={48} className="opacity-20" />
                                </div>
                            )}

                            {/* Navigation Arrows (Only if multiple campaigns) */}
                            {campaigns.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentCampaignIndex((prev) => (prev === 0 ? campaigns.length - 1 : prev - 1));
                                        }}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md text-gray-800 hover:bg-white transition-colors"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentCampaignIndex((prev) => (prev === campaigns.length - 1 ? 0 : prev + 1));
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md text-gray-800 hover:bg-white transition-colors"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="p-7">
                            <div className="flex items-center justify-between mb-3">
                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-widest rounded">KAMPANYA</span>
                                {campaigns.length > 1 && (
                                    <span className="text-[10px] font-bold text-gray-400">
                                        {currentCampaignIndex + 1} / {campaigns.length}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-xl font-black text-gray-800 uppercase leading-none tracking-tight mb-3">
                                {campaigns[currentCampaignIndex].title}
                            </h2>
                            <p className="text-[#5A6B89] text-sm leading-relaxed font-medium">
                                {campaigns[currentCampaignIndex].description}
                            </p>

                            {/* Dots/Indicators */}
                            {campaigns.length > 1 && (
                                <div className="flex justify-center gap-1.5 mt-6">
                                    {campaigns.map((_, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setCurrentCampaignIndex(idx)}
                                            className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === currentCampaignIndex ? 'w-6 bg-red-500' : 'w-1.5 bg-gray-200 hover:bg-gray-300'}`}
                                        ></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {isFeedbackModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setIsFeedbackModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setIsFeedbackModalOpen(false)}
                            className="absolute top-4 right-4 z-10 w-9 h-9 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                        >
                            <X size={20} className="stroke-[2.5]" />
                        </button>

                        <div className="p-8">
                            <div className="flex flex-col items-center text-center gap-3 mb-6">
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
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon No</label>
                                    <input
                                        type="tel"
                                        value={feedbackForm.phone}
                                        onChange={(e) => setFeedbackForm({ ...feedbackForm, phone: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                                    <input
                                        type="email"
                                        value={feedbackForm.email}
                                        onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Konu</label>
                                    <select
                                        value={feedbackForm.subject}
                                        onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
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
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
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
    );
};

export default QRMenuPublic;
