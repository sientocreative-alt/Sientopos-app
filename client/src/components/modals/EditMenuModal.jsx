import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../services/supabase';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Upload, Trash2, Smartphone, Check, Bell, ChevronLeft, ChevronRight, Store, BookOpen, Wifi, Instagram, Coffee, Utensils, Cake, Salad, Flame, ChevronDown, ArrowLeft, Home, Search, Edit2, GripVertical, Twitter, Youtube, Facebook, Star, Video, Megaphone, MessageCircle } from 'lucide-react';

const LANGUAGES = [
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

const SortableCategoryRow = ({ category, expanded, onToggleExpand, onEdit, onToggleActive, onSelect, selected }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative'
    };

    return (
        <div ref={setNodeRef} style={style} className="flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center p-3 select-none gap-4">
                {/* Drag Handle */}
                <div {...attributes} {...listeners} className="cursor-grab hover:text-gray-600 text-gray-400 shrink-0">
                    <GripVertical size={20} />
                </div>

                {/* COL 1: Dual Action Icons (Chevron + Edit) */}
                <div className="shrink-0 flex items-center gap-2 relative z-30">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(category);
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${expanded ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-50/50 text-blue-500 hover:bg-blue-100'}`}
                    >
                        <ChevronDown size={20} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(category);
                        }}
                        className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-sm border border-orange-200"
                    >
                        <Edit2 size={18} />
                    </button>
                </div>

                {/* COL 2: Content & Expansion */}
                <div
                    onClick={() => {
                        onSelect(category);
                        onToggleExpand(category);
                    }}
                    className="flex-1 min-w-0 flex items-center gap-4 cursor-pointer group py-1"
                >
                    <div className="w-12 h-12 bg-gray-50 rounded-[10px] flex items-center justify-center overflow-hidden border border-gray-100 group-hover:border-blue-200 transition-colors shrink-0">
                        {category.image_url ? (
                            <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs font-bold text-gray-300">IMG</span>
                        )}
                    </div>

                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-gray-800 uppercase text-sm tracking-wide group-hover:text-blue-600 transition-colors truncate">
                            {category.name}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium truncate">
                            {category.subCategories.length} Alt Kategori • {category.directProducts.length} Ürün
                        </span>
                    </div>
                </div>

                {/* COL 3: Toggle Switch */}
                <div className="shrink-0 pl-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={category.is_active !== false}
                            onChange={(e) => onToggleActive(category, e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                </div>
            </div>

            {/* Sub Categories */}
            {expanded && (
                <div className="bg-gray-50/50 border-t border-gray-100 p-2 pl-16 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    {category.subCategories.length > 0 ? (
                        category.subCategories.map(subCat => (
                            <div key={subCat.id} className="flex flex-col bg-white rounded-lg border border-gray-100/50 hover:border-gray-200 transition-colors overflow-hidden">
                                <div className="flex items-center p-2 gap-3 select-none">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
                                            <ChevronRight size={16} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{subCat.name}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-3 text-center text-xs text-gray-400 italic">Alt kategori bulunmamaktadır.</div>
                    )}
                </div>
            )}
        </div>
    );
};

const EditMenuModal = ({ menu, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'theme'
    const [previewScreen, setPreviewScreen] = useState('welcome'); // 'welcome' | 'menu'
    const [loading, setLoading] = useState(false);

    // Data states for dynamic preview
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [processedMenu, setProcessedMenu] = useState([]);
    const [selectedMainCat, setSelectedMainCat] = useState(null);
    const [expandedSubCats, setExpandedSubCats] = useState({});
    const [expandedListCategories, setExpandedListCategories] = useState({});
    const [editingCategory, setEditingCategory] = useState(null);
    const [qrSettings, setQrSettings] = useState(null);
    const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
    const [isFooterExpanded, setIsFooterExpanded] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [currentCampaignIndex, setCurrentCampaignIndex] = useState(0);
    const [happyHours, setHappyHours] = useState([]);
    const [globalWaiterCallEnabled, setGlobalWaiterCallEnabled] = useState(true);
    const [previewLanguage, setPreviewLanguage] = useState('tr');
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

    const availableLanguages = useMemo(() => {
        const languages = ['tr'];
        products.forEach(p => {
            if (p.name_en || p.description_en) if (!languages.includes('en')) languages.push('en');
            if (p.name_es || p.description_es) if (!languages.includes('es')) languages.push('es');
            if (p.name_fr || p.description_fr) if (!languages.includes('fr')) languages.push('fr');
            if (p.name_ru || p.description_ru) if (!languages.includes('ru')) languages.push('ru');
        });
        categories.forEach(c => {
            if (c.name_en || c.description_en) if (!languages.includes('en')) languages.push('en');
            if (c.name_es || c.description_es) if (!languages.includes('es')) languages.push('es');
            if (c.name_fr || c.description_fr) if (!languages.includes('fr')) languages.push('fr');
            if (c.name_ru || c.description_ru) if (!languages.includes('ru')) languages.push('ru');
        });
        return languages;
    }, [products, categories]);

    const localizedProcessedMenu = useMemo(() => {
        if (previewLanguage === 'tr') return processedMenu;

        return processedMenu
            .filter(cat => cat[`name_${previewLanguage}`] && cat[`name_${previewLanguage}`].trim() !== '')
            .map(cat => ({
                ...cat,
                name: cat[`name_${previewLanguage}`],
                description: cat[`description_${previewLanguage}`],
                note: cat[`note_${previewLanguage}`],
                subCategories: cat.subCategories
                    .filter(sub => sub[`name_${previewLanguage}`] && sub[`name_${previewLanguage}`].trim() !== '')
                    .map(sub => ({
                        ...sub,
                        name: sub[`name_${previewLanguage}`],
                        description: sub[`description_${previewLanguage}`],
                        note: sub[`note_${previewLanguage}`],
                        products: sub.products
                            .filter(p => p[`name_${previewLanguage}`] && p[`name_${previewLanguage}`].trim() !== '')
                            .map(p => ({
                                ...p,
                                name: p[`name_${previewLanguage}`],
                                description: p[`description_${previewLanguage}`],
                                note: p[`note_${previewLanguage}`]
                            }))
                    }))
                    .filter(sub => sub.products.length > 0),
                directProducts: cat.directProducts
                    .filter(p => p[`name_${previewLanguage}`] && p[`name_${previewLanguage}`].trim() !== '')
                    .map(p => ({
                        ...p,
                        name: p[`name_${previewLanguage}`],
                        description: p[`description_${previewLanguage}`],
                        note: p[`note_${previewLanguage}`]
                    }))
            }))
            .filter(cat => cat.directProducts.length > 0 || cat.subCategories.length > 0);
    }, [processedMenu, previewLanguage]);

    const [formData, setFormData] = useState({
        name: menu.name || '',
        title_tr: menu.title_tr || '',
        subtitle_tr: menu.subtitle_tr || '',
        active_date: menu.active_date ? new Date(menu.active_date).toISOString().slice(0, 16) : '',
        logo_url: menu.logo_url || '',
        cover_url: menu.cover_url || '',
        theme_id: menu.theme_id || 'theme1',
        allow_waiter_call: menu.allow_waiter_call !== false
    });

    const themes = [
        { id: 'theme1', name: 'Tasarım 1', image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=300&q=80', color: '#2C344E', secondary: '#DED6B6' },
        { id: 'theme2', name: 'Tasarım 2', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&q=80', color: '#10B981', secondary: '#ECFDF5' },
        { id: 'theme3', name: 'Tasarım 3', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=300&q=80', color: '#F59E0B', secondary: '#FFFBEB' },
        { id: 'theme4', name: 'Tasarım 4', image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=300&q=80', color: '#EF4444', secondary: '#FEF2F2' },
    ];

    const currentTheme = themes.find(t => t.id === formData.theme_id) || themes[0];

    // Fetch data logic
    useEffect(() => {
        if (menu?.business_id) {
            fetchMenuData();
        }
    }, [menu]);

    const fetchMenuData = async () => {
        try {
            // Fetch Categories
            const { data: cats } = await supabase.from('categories')
                .select('*')
                .eq('business_id', menu.business_id)
                .eq('is_deleted', false) // Filter deleted
                .order('sort_order', { ascending: true });

            // Fetch Products
            const { data: prods } = await supabase.from('products')
                .select('*')
                .eq('business_id', menu.business_id)
                .eq('is_deleted', false) // Filter deleted
                .order('sort_order', { ascending: true });

            // Fetch QR Settings
            const { data: settings } = await supabase.from('qr_settings')
                .select('*')
                .eq('business_id', menu.business_id)
                .single();

            // Fetch Global POS Settings for Waiter Call Sync
            const { data: posSettings } = await supabase.from('pos_settings')
                .select('system_flags')
                .eq('business_id', menu.business_id)
                .single();

            if (posSettings) {
                setGlobalWaiterCallEnabled(posSettings.system_flags?.enable_waiter_call !== false);
            }

            if (settings) setQrSettings(settings);
            setCategories(cats || []);
            setProducts(prods || []);

            // Fetch active campaigns
            const { data: campaignsData } = await supabase
                .from('campaigns')
                .select('*')
                .eq('business_id', menu.business_id)
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
                .eq('business_id', menu.business_id)
                .eq('is_active', true)
                .eq('is_deleted', false);

            if (hhData) {
                const now = new Date();
                const activeHH = hhData.filter(hh => {
                    const start = hh.start_date ? new Date(hh.start_date) : null;
                    const end = hh.end_date ? new Date(hh.end_date) : null;
                    if (start) start.setHours(0, 0, 0, 0);
                    if (end) end.setHours(23, 59, 59, 999);

                    const isDateInRange = (!start || now >= start) && (!end || now <= end);
                    if (!isDateInRange) return false;

                    // Check daily schedule
                    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const today = days[now.getDay()];
                    const config = hh.days_config?.[today];

                    if (config?.active) {
                        const [startH, startM] = config.start.split(':').map(Number);
                        const [endH, endM] = config.end.split(':').map(Number);
                        const startTotal = startH * 60 + startM;
                        const endTotal = endH * 60 + endM;
                        const nowTotal = now.getHours() * 60 + now.getMinutes();

                        return nowTotal >= startTotal && nowTotal <= endTotal;
                    }
                    return false;
                });
                setHappyHours(activeHH);
            }
        } catch (err) {
            console.error("Error fetching preview data:", err);
        }
    }


    // Helper to get discounted price for a product
    const getProductPriceInfo = (product) => {
        const hh = happyHours.find(h =>
            h.target_ids?.includes(product.id) ||
            (h.target_type === 'category' && h.target_ids?.includes(product.category_id))
        );
        if (hh) {
            let discountedPrice = parseFloat(product.price);
            if (hh.discount_type === 'percentage') {
                discountedPrice = discountedPrice * (1 - (hh.discount_amount / 100));
            } else {
                discountedPrice = discountedPrice - hh.discount_amount;
            }
            return {
                originalPrice: parseFloat(product.price),
                discountedPrice: Math.max(0, discountedPrice),
                hasDiscount: true,
                discountLabel: 'HAPPY HOUR'
            };
        }
        return { originalPrice: parseFloat(product.price), hasDiscount: false };
    };

    // Process hierarchy
    useEffect(() => {
        if (!categories.length) return;

        // 1. Identify Main Categories (parent_id is null)
        const mainCats = categories.filter(c => !c.parent_id);

        // 2. Map Sub Categories to Main
        const tree = mainCats.map(main => {
            const subs = categories.filter(c => c.parent_id === main.id);

            const subsWithProducts = subs.map(sub => ({
                ...sub,
                products: products.filter(p => p.category_id === sub.id)
            }));

            // Products directly under main category
            const directProducts = products.filter(p => p.category_id === main.id);

            return {
                ...main,
                subCategories: subsWithProducts,
                directProducts
            };
        });

        setProcessedMenu(tree);
        // Select first main cat by default if not selected
        if (tree.length > 0 && !selectedMainCat) {
            setSelectedMainCat(tree[0]);
            // Auto expand first sub category
            if (tree[0].subCategories.length > 0) {
                setExpandedSubCats({ [tree[0].subCategories[0].id]: true });
            }
        }
    }, [categories, products]);


    const handleSave = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('qr_menus')
                .update({
                    name: formData.name,
                    title_tr: formData.title_tr,
                    subtitle_tr: formData.subtitle_tr,
                    active_date: formData.active_date || null,
                    logo_url: formData.logo_url,
                    cover_url: formData.cover_url,
                    theme_id: formData.theme_id,
                    allow_waiter_call: formData.allow_waiter_call
                })
                .eq('id', menu.id);

            if (error) throw error;

            onUpdate();
            alert('Menü başarıyla güncellendi.');
            onClose();
        } catch (error) {
            console.error('Error updating menu:', error);
            alert('Hata: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${type}s/${fileName}`;

        setLoading(true);
        try {
            const { error: uploadError } = await supabase.storage
                .from('details')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('details')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, [type === 'logo' ? 'logo_url' : 'cover_url']: data.publicUrl }));
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Resim yüklenirken hata oluştu. Lütfen tekrar deneyiniz.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSubCategory = (subId) => {
        setExpandedSubCats(prev => ({
            ...prev,
            [subId]: !prev[subId]
        }));
    };

    // Drag and Drop Logic
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setProcessedMenu((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Persist new order to DB
                // We update all affected items with their new index as sort_order
                const updates = newOrder.map((item, index) => ({
                    id: item.id,
                    sort_order: index
                }));

                // Fire and forget update
                updates.forEach(update => {
                    supabase
                        .from('categories')
                        .update({ sort_order: update.sort_order })
                        .eq('id', update.id)
                        .then(({ error }) => {
                            if (error) console.error('Error updating sort order:', error);
                        });
                });

                return newOrder;
            });
        }
    };

    // --- Render Helpers for Phone Preview ---

    const renderWelcomeScreen = () => (
        <div
            className="w-full h-full bg-white flex flex-col font-sans antialiased overflow-hidden relative bg-cover bg-center"
            style={{
                backgroundImage: formData.cover_url ? `url(${formData.cover_url})` : 'none',
                backgroundColor: formData.cover_url ? 'transparent' : '#ffffff'
            }}
        >
            {/* Overlay for better text visibility if cover image exists */}
            {formData.cover_url && <div className="absolute inset-0 bg-black/30 z-0" />}

            {/* Top Navigation - Waiter Call Button Preview */}
            {formData.allow_waiter_call && (
                <div className="absolute top-6 left-6 z-50">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-lg">
                        <Bell size={20} />
                    </div>
                </div>
            )}

            {/* 1. Logo & Text Section - Centered in the top large space */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 pb-20 relative z-10">
                {/* Logo */}
                <div className="w-32 h-32 bg-white/90 backdrop-blur-sm rounded-[2rem] flex items-center justify-center shadow-lg mb-8">
                    {formData.logo_url ? (
                        <img src={formData.logo_url} alt="Logo" className="w-24 h-24 object-contain" />
                    ) : (
                        <Store className="text-gray-300" size={48} />
                    )}
                </div>

                {/* Title & Subtitle - Restored */}
                <div className="text-center space-y-2 max-w-[260px]">
                    <h2 className={`text-2xl font-bold tracking-tight ${formData.cover_url ? 'text-white drop-shadow-md' : 'text-slate-900'}`}>
                        {formData.title_tr || "HOŞGELDİNİZ"}
                    </h2>
                    <p className={`text-sm font-medium leading-relaxed ${formData.cover_url ? 'text-white/90 drop-shadow-sm' : 'text-slate-500'}`}>
                        {formData.subtitle_tr || "Menüyü incelemek için tıklayın"}
                    </p>
                </div>
            </main>

            {/* 2. Bottom Action Section */}
            <div className="w-full relative z-10">
                {/* The Dark Action Card - Made thinner with reduced padding */}
                <div
                    className="w-full relative rounded-t-[2.5rem] px-6 py-6 flex flex-col items-center justify-center shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
                    style={{ backgroundColor: currentTheme.color }}
                >
                    {/* SientoPOS Side Tab - Adjusted position for thinner card */}
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-16 w-7 rounded-r-md flex items-center justify-center shadow-lg cursor-default select-none border-l-0 border-white/10 overflow-hidden"
                        style={{ backgroundColor: currentTheme.secondary }}
                    >
                        <span
                            className="text-[7px] font-black tracking-widest uppercase transform -rotate-90 whitespace-nowrap"
                            style={{ color: currentTheme.color }}
                        >
                            SientoPOS
                        </span>
                    </div>

                    {/* Menüye Git Button - Reduced gap */}
                    <button
                        onClick={() => setPreviewScreen('menu')}
                        className="flex flex-col items-center gap-1 group focus:outline-none transition-transform active:scale-95 py-1"
                    >
                        <BookOpen className="text-white w-8 h-8 stroke-[2] group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-white text-base font-bold tracking-wide">
                            Menüye Git
                        </span>
                    </button>
                </div>

                {/* Footer Grid - Expandable */}
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

                    {/* Icon Grid - Expandable */}
                    <div
                        className={`grid grid-cols-4 gap-2 px-3 transition-all duration-500 overflow-hidden ${isFooterExpanded ? 'py-5 max-h-96' : 'py-3 max-h-20'
                            }`}
                    >
                        {/* Feedback Icon */}
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-sm">
                                <MessageCircle size={18} />
                            </div>
                            <span className="text-[8px] font-medium text-gray-600">Geri Bildirim</span>
                        </div>

                        {/* WiFi Icon */}
                        {qrSettings?.wifi_name && (
                            <button
                                onClick={() => setIsWifiModalOpen(true)}
                                className="flex flex-col items-center gap-0.5"
                            >
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shadow-sm">
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
                                className="flex flex-col items-center gap-0.5"
                            >
                                <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-[#E1306C] shadow-sm">
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
                                className="flex flex-col items-center gap-0.5"
                            >
                                <div className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center text-[#1DA1F2] shadow-sm">
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
                                className="flex flex-col items-center gap-0.5"
                            >
                                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-[#FF0000] shadow-sm">
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
                                className="flex flex-col items-center gap-0.5"
                            >
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-[#1877F2] shadow-sm">
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
                                className="flex flex-col items-center gap-0.5"
                            >
                                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-black shadow-sm">
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
                                className="flex flex-col items-center gap-0.5"
                            >
                                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 shadow-sm">
                                    <Star size={18} fill="currentColor" className="text-orange-500" />
                                </div>
                                <span className="text-[8px] font-medium text-gray-600">Google</span>
                            </a>
                        )}
                    </div>
                </div>

                {/* WiFi Popup Overlay */}
                {isWifiModalOpen && qrSettings && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-[280px] shadow-2xl relative">
                            <button
                                onClick={() => setIsWifiModalOpen(false)}
                                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center gap-4 py-2">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                                    <Wifi size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Wi-Fi Bağlantısı</h3>

                                <div className="w-full space-y-3">
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Ağ Adı</div>
                                        <div className="font-semibold text-gray-800 select-all">{qrSettings.wifi_name}</div>
                                    </div>

                                    {qrSettings.wifi_password && (
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Parola</div>
                                            <div className="font-semibold text-gray-800 select-all">{qrSettings.wifi_password}</div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setIsWifiModalOpen(false)}
                                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors mt-2"
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderMenuScreen = () => (
        <div className="flex flex-col h-full bg-[#FAFAFA] font-sans text-slate-900 overflow-hidden relative">
            {/* Localized Menu View */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-md px-4 py-3 border-b border-gray-100 flex items-center justify-between z-[60]">
                <div className="flex-1 flex items-center gap-2">
                    <button onClick={() => setPreviewScreen('welcome')} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    {formData.allow_waiter_call && (
                        <div className="p-2 text-orange-500">
                            <Bell size={22} className="fill-orange-500" />
                        </div>
                    )}
                    {campaigns.length > 0 && (
                        <div className="p-2 text-red-500 animate-pulse relative">
                            <Megaphone size={22} className="fill-red-500" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full border border-white"></span>
                        </div>
                    )}
                </div>

                <h2 className="flex-shrink-0 text-slate-900 text-sm font-bold tracking-tight whitespace-nowrap">SientoPOS</h2>

                <div className="flex-1 flex items-center justify-end">
                    <div className="relative" ref={languageMenuRef}>
                        <button
                            onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                            className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg pl-2 pr-1.5 py-1.5 text-[10px] font-bold shadow-sm hover:border-gray-200 transition-all active:scale-95"
                        >
                            <span className="text-sm leading-none">
                                {LANGUAGES.find(l => l.code === previewLanguage)?.flag}
                            </span>
                            <span className="text-gray-700">
                                {LANGUAGES.find(l => l.code === previewLanguage)?.label}
                            </span>
                            <ChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${isLanguageMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isLanguageMenuOpen && (
                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                                <div className="py-1">
                                    {LANGUAGES.filter(l => availableLanguages.includes(l.code)).map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setPreviewLanguage(lang.code);
                                                setIsLanguageMenuOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors ${previewLanguage === lang.code ? 'bg-gray-50' : ''}`}
                                        >
                                            <span className="text-base leading-none">{lang.flag}</span>
                                            <span className={`text-[11px] font-bold ${previewLanguage === lang.code ? 'text-gray-900' : 'text-gray-600'}`}>
                                                {lang.label}
                                            </span>
                                            {previewLanguage === lang.code && (
                                                <div className="ml-auto w-1 h-1 rounded-full bg-green-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Categories (Horizontal Scroll) - Circles */}
            <div className="bg-white pb-3 border-b border-gray-50">
                <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar scroll-smooth py-2">
                    {localizedProcessedMenu.map((cat) => {
                        const isActive = selectedMainCat?.id === cat.id;
                        return (
                            <div
                                key={cat.id}
                                onClick={() => setSelectedMainCat(cat)}
                                className="flex flex-col items-center gap-1.5 min-w-[60px] cursor-pointer group"
                            >
                                <div
                                    className={`h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 border-2 overflow-hidden ${isActive ? 'bg-white shadow-md' : 'bg-gray-50 border-transparent group-hover:bg-gray-100'}`}
                                    style={isActive ? { borderColor: currentTheme.color } : {}}
                                >
                                    {cat.image_url ? (
                                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Utensils size={20} className="text-gray-300" />
                                    )}
                                </div>
                                <p
                                    className={`text-[10px] font-medium text-center leading-tight max-w-[64px] truncate ${isActive ? 'font-bold' : 'text-slate-400'}`}
                                    style={isActive ? { color: currentTheme.color } : {}}
                                >
                                    {cat.name}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content Area - Sub Categories & Products */}
            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-3 bg-[#F5F5F7]">
                {selectedMainCat ? (
                    <>
                        {/* Direct Products */}
                        {selectedMainCat.directProducts?.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-2">
                                {selectedMainCat.directProducts.map(product => (
                                    <div key={product.id} className="p-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                                                {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover" /> : <Utensils size={14} className="text-gray-200 m-auto mt-3" />}
                                            </div>
                                            <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">{product.name}</span>
                                        </div>
                                        <span className="text-xs font-bold" style={{ color: currentTheme.color }}>{parseFloat(product.price).toFixed(2)}₺</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Sub Categories List - Accordion Cards */}
                        {selectedMainCat.subCategories.length > 0 ? (
                            selectedMainCat.subCategories.map(subCat => {
                                const isExpanded = expandedSubCats[subCat.id];
                                return (
                                    <div key={subCat.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100/50">
                                        {/* Accordion Header */}
                                        <div
                                            onClick={() => toggleSubCategory(subCat.id)}
                                            className="flex cursor-pointer items-center justify-between p-3 select-none active:bg-gray-50 bg-white border-b border-gray-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-slate-800 text-[13px] font-bold">{subCat.name}</h3>
                                            </div>
                                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                        {/* Products List */}
                                        {isExpanded && (
                                            <div className="divide-y divide-gray-50">
                                                {subCat.products.map(product => (
                                                    <div key={product.id} className="p-3 flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                                                                {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover" /> : <Utensils size={12} className="text-gray-200 m-auto mt-2.5" />}
                                                            </div>
                                                            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">{product.name}</span>
                                                        </div>
                                                        <span className="text-[11px] font-bold" style={{ color: currentTheme.color }}>{parseFloat(product.price).toFixed(2)}₺</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            (!selectedMainCat.directProducts || selectedMainCat.directProducts.length === 0) && (
                                <div className="text-center py-10">
                                    <Coffee size={32} className="mx-auto text-gray-200 mb-2" />
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Henüz ürün yok</p>
                                </div>
                            )
                        )}
                    </>
                ) : (
                    <div className="text-center py-10">
                        <Coffee size={32} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Lütfen kategori seçin</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-hidden font-sans">
            <div className="bg-white rounded-3xl w-full max-w-[1200px] h-[92vh] flex overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Left Side: Mockup Preview - Gray Background */}
                <div className="w-[420px] bg-slate-100 flex flex-col items-center justify-center relative shrink-0 border-r border-gray-200">
                    <h3 className="absolute top-8 left-0 right-0 text-center font-bold text-slate-400 text-sm tracking-wide uppercase">Canlı Önizleme</h3>

                    {/* Phone Mockup Container - Made Taller and Thinner */}
                    <div className="relative w-[300px] h-[610px] bg-gray-900 rounded-[45px] shadow-[0_50px_100px_-20px_rgba(50,50,93,0.25),0_30px_60px_-30px_rgba(0,0,0,0.3)] border-[8px] border-gray-900 ring-1 ring-gray-950/40 select-none">
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[100px] h-[26px] bg-black rounded-b-[18px] z-30 pointer-events-none"></div>

                        {/* Side Buttons */}
                        <div className="absolute top-[80px] -left-[10px] w-[2px] h-[24px] bg-gray-800 rounded-l-md"></div>
                        <div className="absolute top-[120px] -left-[10px] w-[2px] h-[45px] bg-gray-800 rounded-l-md"></div>
                        <div className="absolute top-[100px] -right-[10px] w-[2px] h-[60px] bg-gray-800 rounded-r-md"></div>

                        {/* Screen Content - Adjusted radius to match frame */}
                        <div className="w-full h-full bg-white rounded-[38px] overflow-hidden relative border-[2px] border-black">
                            {previewScreen === 'welcome' ? renderWelcomeScreen() : renderMenuScreen()}

                            {/* Product Detail Modal Overlay */}
                            {selectedProduct && (
                                <div className="absolute inset-0 z-50 flex items-end justify-center pointer-events-none">
                                    <div
                                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300"
                                        onClick={() => setSelectedProduct(null)}
                                    ></div>
                                    <div className="w-full bg-white rounded-t-[32px] p-6 pb-12 relative z-50 pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom duration-300">

                                        {/* Close Button */}
                                        <button
                                            onClick={() => setSelectedProduct(null)}
                                            className="absolute top-4 right-4 w-8 h-8 bg-red-800 rounded-full flex items-center justify-center shadow-md hover:bg-red-700 transition-colors z-50"
                                        >
                                            <X size={16} className="text-white stroke-[3px]" />
                                        </button>

                                        {/* Product Image - Original Aspect Ratio (No Zoom/Crop) */}
                                        <div className="w-full rounded-2xl overflow-hidden mb-5 bg-white relative flex items-center justify-center">
                                            {selectedProduct.image_url ? (
                                                <img
                                                    src={selectedProduct.image_url}
                                                    alt={selectedProduct.name}
                                                    className="w-full h-auto max-h-[40vh] object-contain"
                                                />
                                            ) : (
                                                <div className="w-full h-48 bg-slate-50 flex items-center justify-center text-gray-300">
                                                    <Utensils size={48} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Details - Elegant Typography */}
                                        <div className="flex flex-col gap-2 px-1">
                                            <h3 className="text-slate-900 text-[18px] font-bold uppercase tracking-tight leading-snug">
                                                {selectedProduct.name}
                                            </h3>

                                            {/* Description - Elegant & Readable */}
                                            {selectedProduct.description && (
                                                <div className="text-slate-600 text-[12px] font-medium leading-relaxed uppercase tracking-wide opacity-90">
                                                    {selectedProduct.description}
                                                </div>
                                            )}

                                            {/* Note - If exists */}
                                            {selectedProduct.note && (
                                                <div className="text-slate-500 text-[11px] font-medium leading-relaxed mt-2 italic tracking-wide">
                                                    Not: {selectedProduct.note}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Campaign Detail Modal Overlay (For Preview) */}
                            {showCampaignModal && campaigns.length > 0 && (
                                <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                                    <div className="absolute inset-0" onClick={() => setShowCampaignModal(false)}></div>
                                    <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
                                        <button
                                            onClick={() => setShowCampaignModal(false)}
                                            className="absolute top-4 right-4 z-20 w-9 h-9 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                                        >
                                            <X size={20} className="stroke-[2.5]" />
                                        </button>

                                        {/* Carousel Content */}
                                        <div className="relative">
                                            {campaigns[currentCampaignIndex].image_url ? (
                                                <div className="w-full aspect-[4/3] bg-gray-100 relative">
                                                    <img src={campaigns[currentCampaignIndex].image_url} alt={campaigns[currentCampaignIndex].title} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-full h-32 bg-red-50 flex items-center justify-center text-red-500">
                                                    <Megaphone size={48} className="opacity-20" />
                                                </div>
                                            )}

                                            {/* Navigation Arrows */}
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

                                            {/* Indicators */}
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
                        </div>
                    </div>
                </div>

                {/* Right Side: Settings */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {/* Header */}
                    <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-white">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Menü Düzenle</h2>
                            <p className="text-gray-500 text-sm mt-1">Menü tasarımını ve içeriklerini özelleştirin</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-8 border-b border-gray-100 bg-white gap-8 sticky top-0 z-10">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`py-4 text-sm font-semibold transition-all border-b-2 ${activeTab === 'general' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Genel Ayarlar
                        </button>
                        <button
                            onClick={() => setActiveTab('categories')}
                            className={`py-4 text-sm font-semibold transition-all border-b-2 ${activeTab === 'categories' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Kategoriler
                        </button>
                        <button
                            onClick={() => setActiveTab('theme')}
                            className={`py-4 text-sm font-semibold transition-all border-b-2 ${activeTab === 'theme' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Tema Seçimi
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-8 py-8 bg-white">
                        {activeTab === 'general' ? (
                            <div className="space-y-6 max-w-3xl">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Menü Adı (Panel)</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm"
                                            placeholder="Örn: Ana Menü"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Aktif Tarih</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.active_date}
                                            onChange={(e) => setFormData({ ...formData, active_date: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Başlık (Müşteri Görür)</label>
                                        <input
                                            type="text"
                                            value={formData.title_tr}
                                            onChange={(e) => setFormData({ ...formData, title_tr: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm"
                                            placeholder="Örn: HOŞGELDİNİZ"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Alt Başlık</label>
                                        <input
                                            type="text"
                                            value={formData.subtitle_tr}
                                            onChange={(e) => setFormData({ ...formData, subtitle_tr: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm"
                                            placeholder="Örn: Lezzetli anlar için doğru yerdesiniz..."
                                        />
                                    </div>
                                </div>

                                <div className={`border rounded-[24px] p-6 space-y-4 transition-all ${!globalWaiterCallEnabled ? 'bg-gray-50 border-gray-200' : 'bg-orange-50/50 border-orange-100'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-colors ${!globalWaiterCallEnabled ? 'bg-gray-200 text-gray-400' : 'bg-orange-100 text-orange-600'}`}>
                                                <Coffee size={24} />
                                            </div>
                                            <div>
                                                <h4 className={`text-base font-bold tracking-tight ${!globalWaiterCallEnabled ? 'text-gray-400' : 'text-gray-800'}`}>Garson Çağır</h4>
                                                <p className="text-xs text-gray-500 font-medium">Müşterileriniz QR Menü üzerinden garson çağırabilsin</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <label className={`relative inline-flex items-center ${!globalWaiterCallEnabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={globalWaiterCallEnabled && formData.allow_waiter_call}
                                                    onChange={(e) => setFormData({ ...formData, allow_waiter_call: e.target.checked })}
                                                    disabled={!globalWaiterCallEnabled}
                                                />
                                                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500 shadow-inner"></div>
                                            </label>
                                            {!globalWaiterCallEnabled && (
                                                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm border border-orange-100">
                                                    Sistemden Kapalı
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 pt-2">
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-gray-700">Logo</label>
                                        <div className="relative group">
                                            <div className="w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-100 hover:border-purple-300 transition-all overflow-hidden group-hover:shadow-sm">
                                                {formData.logo_url ? (
                                                    <img src={formData.logo_url} alt="Logo" className="w-[80%] h-[80%] object-contain drop-shadow-sm" />
                                                ) : (
                                                    <div className="text-center">
                                                        <div className="bg-white p-3 rounded-full shadow-sm mb-3 mx-auto">
                                                            <Upload className="text-purple-500" size={20} />
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-500">Logo Yükle</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, 'logo')}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                            {formData.logo_url && (
                                                <button
                                                    onClick={() => setFormData({ ...formData, logo_url: '' })}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-110"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-gray-700">Kapak Görseli (Opsiyonel)</label>
                                        <div className="relative group">
                                            <div className="w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-100 hover:border-purple-300 transition-all overflow-hidden group-hover:shadow-sm">
                                                {formData.cover_url ? (
                                                    <img src={formData.cover_url} alt="Cover" className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <div className="text-center">
                                                        <div className="bg-white p-3 rounded-full shadow-sm mb-3 mx-auto">
                                                            <Upload className="text-purple-500" size={20} />
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-500">Kapak Yükle</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, 'cover')}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                            {formData.cover_url && (
                                                <button
                                                    onClick={() => setFormData({ ...formData, cover_url: '' })}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-110"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'categories' ? (
                            <div className="space-y-6">
                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Kategori veya Ürün Ara"
                                        className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-24 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm shadow-sm"
                                    />
                                    <button className="absolute right-2 top-2 bottom-2 bg-green-500 text-white px-6 rounded-lg font-bold text-sm hover:bg-green-600 transition-colors">
                                        Ara
                                    </button>
                                </div>

                                {/* Categories List */}
                                <div className="space-y-3">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={processedMenu.map(c => c.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {processedMenu.map((mainCat) => (
                                                <SortableCategoryRow
                                                    key={mainCat.id}
                                                    category={mainCat}
                                                    expanded={expandedListCategories[mainCat.id]}
                                                    onToggleExpand={(cat) => {
                                                        setExpandedListCategories(prev => ({
                                                            ...prev,
                                                            [cat.id]: !prev[cat.id]
                                                        }));
                                                    }}
                                                    onEdit={(cat) => setEditingCategory(cat)}
                                                    onToggleActive={async (cat, active) => {
                                                        try {
                                                            const { error } = await supabase
                                                                .from('categories')
                                                                .update({ is_active: active })
                                                                .eq('id', cat.id);

                                                            if (error) throw error;

                                                            setProcessedMenu(prev => prev.map(c =>
                                                                c.id === cat.id ? { ...c, is_active: active } : c
                                                            ));
                                                        } catch (err) {
                                                            alert('Durum güncellenemedi: ' + err.message);
                                                        }
                                                    }}
                                                    onSelect={(cat) => setSelectedMainCat(cat)}
                                                    selected={selectedMainCat?.id === mainCat.id}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            </div >
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                {themes.map((theme) => (
                                    <div
                                        key={theme.id}
                                        onClick={() => setFormData({ ...formData, theme_id: theme.id })}
                                        className={`cursor-pointer group relative rounded-2xl overflow-hidden border-2 transition-all ${formData.theme_id === theme.id ? 'border-purple-600 ring-4 ring-purple-100 shadow-xl scale-[1.02]' : 'border-gray-100 hover:border-purple-200 hover:shadow-lg'}`}
                                    >
                                        <div className="aspect-[3/5] bg-gray-100 relative">
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white/50">
                                                <img src={theme.image} alt={theme.name} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                                <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-90 backdrop-blur-[2px]" style={{ backgroundColor: theme.color }}></div>
                                                <div className="absolute bottom-4 bg-white/90 backdrop-blur-md shadow-sm px-3 py-1.5 rounded-lg text-xs font-bold text-gray-800">
                                                    {theme.name}
                                                </div>
                                            </div>
                                        </div>

                                        {formData.theme_id === theme.id && (
                                            <div className="absolute top-3 right-3 bg-purple-600 text-white p-1.5 rounded-full shadow-lg z-10 animate-in zoom-in">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div >

                    {/* Footer - Fixed at bottom */}
                    < div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 backdrop-blur-sm" >
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:translate-y-0 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div >
                </div >

                {/* Category Edit Modal - PORTAL TO BODY */}
                {
                    editingCategory && createPortal(
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans isolated-modal" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'auto' }}>
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingCategory(null)}></div>
                            <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden z-[10000]">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="text-xl font-black text-gray-800 tracking-tight uppercase">KATEGORİYİ GÜNCELLE</h3>
                                    <button onClick={() => setEditingCategory(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Kategori Adı (Türkçe) <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={editingCategory.name}
                                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Açıklama (Türkçe)</label>
                                        <textarea
                                            rows={3}
                                            value={editingCategory.description || ''}
                                            onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Not (Türkçe)</label>
                                        <input
                                            type="text"
                                            value={editingCategory.note || ''}
                                            onChange={(e) => setEditingCategory({ ...editingCategory, note: e.target.value })}
                                            placeholder="Not"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Kategori Kare Resmi</label>
                                        <div className="relative w-32 h-32 group">
                                            <div className="w-full h-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-colors">
                                                {editingCategory.image_url ? (
                                                    <img src={editingCategory.image_url} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 text-gray-400">
                                                        <Upload size={24} />
                                                        <span className="text-[10px] font-bold">Yükle</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;

                                                        try {
                                                            const filePath = `categories/${Math.random()}.${file.name.split('.').pop()}`;
                                                            const { error } = await supabase.storage.from('details').upload(filePath, file);
                                                            if (error) throw error;

                                                            const { data } = supabase.storage.from('details').getPublicUrl(filePath);
                                                            setEditingCategory({ ...editingCategory, image_url: data.publicUrl });
                                                        } catch (err) {
                                                            alert('Resim yüklenemedi: ' + err.message);
                                                        }
                                                    }}
                                                />
                                            </div>
                                            {editingCategory.image_url && (
                                                <button
                                                    onClick={() => setEditingCategory({ ...editingCategory, image_url: null })}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setEditingCategory({ ...editingCategory, image_url: null })}
                                            className="mt-2 text-red-500 text-xs font-bold flex items-center gap-1 hover:underline"
                                        >
                                            <Trash2 size={12} /> Fotoğrafı Sil
                                        </button>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex p-4 border-t border-gray-100 gap-3">
                                    <button
                                        onClick={() => setEditingCategory(null)}
                                        className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg transition-colors"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const { error } = await supabase
                                                    .from('categories')
                                                    .update({
                                                        name: editingCategory.name,
                                                        description: editingCategory.description,
                                                        note: editingCategory.note,
                                                        image_url: editingCategory.image_url
                                                    })
                                                    .eq('id', editingCategory.id);

                                                if (error) throw error;

                                                // Update local state
                                                const updatedCats = categories.map(c => c.id === editingCategory.id ? editingCategory : c);
                                                setCategories(updatedCats);
                                                setEditingCategory(null);
                                                alert('Kategori güncellendi');
                                            } catch (err) {
                                                alert('Hata: ' + err.message);
                                            }
                                        }}
                                        className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors"
                                    >
                                        Kaydet
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )
                }
            </div >
        </div >
    );
};

export default EditMenuModal;
