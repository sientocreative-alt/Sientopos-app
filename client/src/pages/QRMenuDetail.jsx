import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, RefreshCw, Search, Edit2, Trash2, X, ChevronDown, Globe, Coffee, Utensils, UtensilsCrossed, Megaphone, Home, ChevronRight, BookOpen, Wifi, Instagram, Twitter, Youtube, Facebook, Star, Video, MessageCircle, Store, Bell } from 'lucide-react';
import 'flag-icons/css/flag-icons.min.css';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const QRMenuDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [menu, setMenu] = useState(null);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [products, setProducts] = useState([]);
    const [happyHours, setHappyHours] = useState([]);
    const [timedDiscounts, setTimedDiscounts] = useState([]);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryEditFormData, setCategoryEditFormData] = useState({
        name: '',
        name_en: '',
        name_es: '',
        name_fr: '',
        name_ru: '',
        description: '',
        description_en: '',
        description_es: '',
        description_fr: '',
        description_ru: '',
        note: '',
        note_en: '',
        note_es: '',
        note_fr: '',
        note_ru: '',
        image_url: ''
    });

    const themes = [
        { id: 'theme1', name: 'Tasarım 1', color: '#2C344E', secondary: '#DED6B6' },
        { id: 'theme2', name: 'Tasarım 2', color: '#10B981', secondary: '#ECFDF5' },
        { id: 'theme3', name: 'Tasarım 3', color: '#F59E0B', secondary: '#FFFBEB' },
        { id: 'theme4', name: 'Tasarım 4', color: '#EF4444', secondary: '#FEF2F2' },
    ];

    // Preview State
    const [previewActiveCategory, setPreviewActiveCategory] = useState(null);
    const [previewSelectedProduct, setPreviewSelectedProduct] = useState(null);
    const [previewScreen, setPreviewScreen] = useState('menu'); // 'welcome' | 'menu'
    const [isPreviewFooterExpanded, setIsPreviewFooterExpanded] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [currentCampaignIndex, setCurrentCampaignIndex] = useState(0);

    useEffect(() => {
        if (user && id) {
            fetchData();
        }
    }, [user, id]);

    const fetchData = async () => {
        setLoading(true);
        const menuReq = supabase
            .from('qr_menus')
            .select('*')
            .eq('id', id)
            .single();

        // Fetch Categories
        const catReq = supabase
            .from('categories')
            .select('*')
            .eq('business_id', user.business_id)
            .eq('is_deleted', false)
            .order('sort_order', { ascending: true });

        // Fetch Products
        const prodReq = supabase
            .from('products')
            .select('*')
            .eq('business_id', user.business_id)
            .eq('is_deleted', false)
            .order('sort_order', { ascending: true });

        const [menuRes, catRes, prodRes] = await Promise.all([menuReq, catReq, prodReq]);

        if (menuRes.data) setMenu(menuRes.data);
        if (catRes.data) {
            setCategories(catRes.data.map(c => ({ ...c, isEnabled: c.is_active !== false })));
        }
        if (prodRes.data) {
            setProducts(prodRes.data.map(p => ({ ...p, isEnabled: p.is_active !== false })));
        }

        // Fetch active happy hours
        const { data: hhData } = await supabase
            .from('happy_hours')
            .select('*')
            .eq('business_id', user.business_id)
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

        // Fetch campaigns
        const { data: campaignsData } = await supabase
            .from('campaigns')
            .select('*')
            .eq('business_id', user.business_id)
            .eq('is_active', true)
            .eq('is_deleted', false);

        if (campaignsData) {
            const now = new Date();
            const activeCampaigns = campaignsData.filter(c => {
                const start = new Date(c.start_date);
                const end = new Date(c.end_date);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                return now >= start && now <= end;
            });
            setCampaigns(activeCampaigns);
        }

        // Fetch active timed discounts
        const { data: tdData } = await supabase
            .from('timed_discounts')
            .select('*')
            .eq('business_id', user.business_id)
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

        // Initialize preview category
        if (catRes.data && catRes.data.length > 0) {
            const rootCats = catRes.data.filter(c => !c.parent_id);
            if (rootCats.length > 0 && !previewActiveCategory) {
                setPreviewActiveCategory(rootCats[0].id);
            }
        }

        setLoading(false);
    };

    const [editingProduct, setEditingProduct] = useState(null);
    const [showEditProductModal, setShowEditProductModal] = useState(false);
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'other'
    const [editFormData, setEditFormData] = useState({
        name: '',
        name_en: '',
        name_es: '',
        name_fr: '',
        name_ru: '',
        description: '',
        description_en: '',
        description_es: '',
        description_fr: '',
        description_ru: '',
        note: '',
        note_en: '',
        note_es: '',
        note_fr: '',
        note_ru: '',
        price: '',
        image_url: '',
        preparation_time: '',
        allergens: '',
        tags: '',
        calories: '',
        kitchen_start_time: '',
        kitchen_end_time: ''
    });

    // Language Settings
    const [previewLanguage, setPreviewLanguage] = useState('tr');

    const LANGUAGES = [
        { code: 'tr', flagCode: 'tr', label: 'Türkçe', field: 'name' },
        { code: 'en', flagCode: 'us', label: 'English', field: 'name_en' },
        { code: 'es', flagCode: 'es', label: 'Español', field: 'name_es' },
        { code: 'fr', flagCode: 'fr', label: 'Français', field: 'name_fr' },
        { code: 'ru', flagCode: 'ru', label: 'Русский', field: 'name_ru' }
    ];

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

    const getAvailableLanguages = () => {
        const available = new Set(['tr']);
        // Check if products is loaded and has items
        if (products && products.length > 0) {
            products.forEach(p => {
                if (p.name_en && p.name_en.trim() !== '') available.add('en');
                if (p.name_es && p.name_es.trim() !== '') available.add('es');
                if (p.name_fr && p.name_fr.trim() !== '') available.add('fr');
                if (p.name_ru && p.name_ru.trim() !== '') available.add('ru');
            });
        }
        // Also check if categories have translations
        if (categories && categories.length > 0) {
            categories.forEach(c => {
                if (c.name_en && c.name_en.trim() !== '') available.add('en');
                if (c.name_es && c.name_es.trim() !== '') available.add('es');
                if (c.name_fr && c.name_fr.trim() !== '') available.add('fr');
                if (c.name_ru && c.name_ru.trim() !== '') available.add('ru');
            });
        }
        return Array.from(available);
    };

    const availableLanguages = getAvailableLanguages();

    const openEditProductModal = (product) => {
        setEditingProduct(product);
        setActiveTab('general');
        setEditFormData({
            name: product.name,
            name_en: product.name_en || '',
            name_es: product.name_es || '',
            name_fr: product.name_fr || '',
            name_ru: product.name_ru || '',
            description: product.description || '',
            description_en: product.description_en || '',
            description_es: product.description_es || '',
            description_fr: product.description_fr || '',
            description_ru: product.description_ru || '',
            note: product.note || '',
            note_en: product.note_en || '',
            note_es: product.note_es || '',
            note_fr: product.note_fr || '',
            note_ru: product.note_ru || '',
            price: product.price,
            image_url: product.image_url || '',
            preparation_time: product.preparation_time || '',
            allergens: product.allergens || '',
            tags: product.tags ? product.tags.join(', ') : '',
            calories: product.calories || '',
            kitchen_start_time: product.kitchen_start_time || '',
            kitchen_end_time: product.kitchen_end_time || ''
        });
        setShowEditProductModal(true);
    };

    const closeEditProductModal = () => {
        setEditingProduct(null);
        setShowEditProductModal(false);
    };

    const handleSaveProduct = async () => {
        try {
            const updates = {
                name: editFormData.name,
                name_en: editFormData.name_en,
                name_es: editFormData.name_es,
                name_fr: editFormData.name_fr,
                name_ru: editFormData.name_ru,
                description: editFormData.description,
                description_en: editFormData.description_en,
                description_es: editFormData.description_es,
                description_fr: editFormData.description_fr,
                description_ru: editFormData.description_ru,
                price: parseFloat(editFormData.price),
                note: editFormData.note,
                note_en: editFormData.note_en,
                note_es: editFormData.note_es,
                note_fr: editFormData.note_fr,
                note_ru: editFormData.note_ru,
                preparation_time: editFormData.preparation_time ? parseInt(editFormData.preparation_time) : null,
                allergens: editFormData.allergens,
                tags: editFormData.tags ? editFormData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                calories: editFormData.calories ? parseInt(editFormData.calories) : null,
                kitchen_start_time: editFormData.kitchen_start_time || null,
                kitchen_end_time: editFormData.kitchen_end_time || null,
            };

            const { error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', editingProduct.id);

            if (error) throw error;

            alert("Ürün başarıyla güncellendi!");
            closeEditProductModal();
            fetchData();
        } catch (error) {
            console.error("Error updating product:", error);
            alert("Güncelleme hatası: " + error.message);
        }
    };

    const handleDeleteProduct = async () => {
        if (window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
            try {
                const { error } = await supabase
                    .from('products')
                    .update({ is_deleted: true })
                    .eq('id', editingProduct.id);

                if (error) throw error;

                closeEditProductModal();
                fetchData();
            } catch (error) {
                console.error("Error deleting product:", error);
                alert("Silme hatası: " + error.message);
            }
        }
    };

    const handleSyncMenu = async () => {
        try {
            setLoading(true);

            // 1. Fetch current categories and products in their latest state
            // Use .eq('is_deleted', false) and be explicit with active status
            const { data: currentCategories, error: catErr } = await supabase
                .from('categories')
                .select('*')
                .eq('business_id', user.business_id)
                .eq('is_deleted', false)
                .neq('is_active', false)
                .order('sort_order', { ascending: true });

            if (catErr) throw catErr;

            const { data: currentProducts, error: prodErr } = await supabase
                .from('products')
                .select('*')
                .eq('business_id', user.business_id)
                .eq('is_deleted', false)
                .neq('is_active', false)
                .order('sort_order', { ascending: true })
                .order('name');

            if (prodErr) throw prodErr;

            // 2. Build the hierarchical structure - Explicitly map subcategories to ensure image_url is present
            const menuSnapshot = currentCategories
                .filter(cat => !cat.parent_id)
                .map(rootCat => {
                    const mappedRoot = {
                        ...rootCat,
                        subCategories: currentCategories
                            .filter(sub => sub.parent_id === rootCat.id)
                            .map(sub => ({
                                ...sub,
                                // Enforce explicit property inclusion just to be safe
                                id: sub.id,
                                name: sub.name,
                                name_en: sub.name_en,
                                name_es: sub.name_es,
                                name_fr: sub.name_fr,
                                name_ru: sub.name_ru,
                                description: sub.description,
                                description_en: sub.description_en,
                                description_es: sub.description_es,
                                description_fr: sub.description_fr,
                                description_ru: sub.description_ru,
                                note: sub.note,
                                note_en: sub.note_en,
                                note_es: sub.note_es,
                                note_fr: sub.note_fr,
                                note_ru: sub.note_ru,
                                image_url: sub.image_url,
                                is_active: sub.is_active,
                                products: currentProducts.filter(p => p.category_id === sub.id)
                            })),
                        products: currentProducts.filter(p => p.category_id === rootCat.id)
                    };
                    return mappedRoot;
                });

            // 3. Save to published_data with an updated timestamp to bypass any caching layers
            const { error: syncErr } = await supabase
                .from('qr_menus')
                .update({
                    published_data: menuSnapshot,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (syncErr) throw syncErr;

            // Refresh local state
            const { data: updatedMenu } = await supabase
                .from('qr_menus')
                .select('*')
                .eq('id', id)
                .single();
            if (updatedMenu) setMenu(updatedMenu);

            const now = new Date().toLocaleTimeString('tr-TR');
            alert(`Menü başarıyla senkronize edildi (${now})! Müşteri ekranı güncellendi.`);
            window.open(`/qr/home/${id}`, '_blank');

        } catch (error) {
            console.error("Sync error:", error);
            alert("Senkronizasyon hatası: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleCategory = async (catId) => {
        const category = categories.find(c => c.id === catId);
        const newStatus = !category.isEnabled;

        // Optimistic update
        setCategories(categories.map(c =>
            c.id === catId ? { ...c, isEnabled: newStatus } : c
        ));

        try {
            const { error } = await supabase
                .from('categories')
                .update({ is_active: newStatus })
                .eq('id', catId);
            if (error) throw error;
        } catch (error) {
            console.error("Error toggling category:", error);
            // Revert on error
            setCategories(categories.map(c =>
                c.id === catId ? { ...c, isEnabled: !newStatus } : c
            ));
        }
    };

    const handleToggleProduct = async (prodId) => {
        const product = products.find(p => p.id === prodId);
        const newStatus = !product.isEnabled;

        // Optimistic update
        setProducts(products.map(p =>
            p.id === prodId ? { ...p, isEnabled: newStatus } : p
        ));

        try {
            const { error } = await supabase
                .from('products')
                .update({ is_active: newStatus })
                .eq('id', prodId);
            if (error) throw error;
        } catch (error) {
            console.error("Error toggling product:", error);
            // Revert on error
            setProducts(products.map(p =>
                p.id === prodId ? { ...p, isEnabled: !newStatus } : p
            ));
        }
    };

    const openEditCategoryModal = (category) => {
        setEditingCategory(category);
        setCategoryEditFormData({
            name: category.name || '',
            name_en: category.name_en || '',
            name_es: category.name_es || '',
            name_fr: category.name_fr || '',
            name_ru: category.name_ru || '',
            description: category.description || '',
            description_en: category.description_en || '',
            description_es: category.description_es || '',
            description_fr: category.description_fr || '',
            description_ru: category.description_ru || '',
            note: category.note || '',
            note_en: category.note_en || '',
            note_es: category.note_es || '',
            note_fr: category.note_fr || '',
            note_ru: category.note_ru || '',
            image_url: category.image_url || ''
        });
    };

    const closeEditCategoryModal = () => {
        setEditingCategory(null);
    };

    const handleSaveCategory = async () => {
        try {
            const { error } = await supabase
                .from('categories')
                .update({
                    name: categoryEditFormData.name,
                    name_en: categoryEditFormData.name_en,
                    name_es: categoryEditFormData.name_es,
                    name_fr: categoryEditFormData.name_fr,
                    name_ru: categoryEditFormData.name_ru,
                    description: categoryEditFormData.description,
                    description_en: categoryEditFormData.description_en,
                    description_es: categoryEditFormData.description_es,
                    description_fr: categoryEditFormData.description_fr,
                    description_ru: categoryEditFormData.description_ru,
                    note: categoryEditFormData.note,
                    note_en: categoryEditFormData.note_en,
                    note_es: categoryEditFormData.note_es,
                    note_fr: categoryEditFormData.note_fr,
                    note_ru: categoryEditFormData.note_ru,
                    image_url: categoryEditFormData.image_url
                })
                .eq('id', editingCategory.id);

            if (error) throw error;

            alert("Kategori başarıyla güncellendi!");
            closeEditCategoryModal();
            fetchData();
        } catch (error) {
            console.error("Error updating category:", error);
            alert("Hata: " + error.message);
        }
    };

    const handleDeleteCategory = async () => {
        if (window.confirm("Bu kategoriyi silmek istediğinize emin misiniz? (Alt kategoriler ve ürünler etkilenebilir)")) {
            try {
                const { error } = await supabase
                    .from('categories')
                    .update({ is_deleted: true })
                    .eq('id', editingCategory.id);

                if (error) throw error;

                closeEditCategoryModal();
                fetchData();
            } catch (error) {
                console.error("Error deleting category:", error);
                alert("Silme hatası: " + error.message);
            }
        }
    };

    const toggleExpand = (catId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [catId]: !prev[catId]
        }));
    };

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
            discountLabel = 'SÜRELİ';
        } else {
            // 2. Check Happy Hour
            const hh = happyHours.find(h =>
                h.target_ids?.includes(product.id) ||
                (h.target_type === 'category' && h.target_ids?.includes(product.category_id))
            );
            if (hh) {
                discount = hh;
                discountLabel = 'HH';
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

    // Recursive render function
    const renderCategoryItem = (category, level = 0) => {
        const children = categories.filter(c => c.parent_id === category.id);
        const categoryProducts = products.filter(p => p.category_id === category.id);
        const isExpanded = expandedCategories[category.id];

        return (
            <div key={category.id} className="mb-4 last:mb-0">
                <div className={`border border-gray-100 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors bg-white ${level > 0 ? 'ml-8' : ''}`}>
                    <div className="flex items-center gap-3">
                        {/* Action Icons Group */}
                        <div className="flex items-center gap-2">
                            {/* Expand/Collapse Button */}
                            <button
                                onClick={() => toggleExpand(category.id)}
                                className={`p-2 transition-colors rounded-lg ${isExpanded ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-500 hover:bg-blue-100'}`}
                            >
                                <ChevronDown
                                    size={18}
                                    className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* Edit Button - THE ORANGE ICON THE USER WANTS */}
                            <button
                                onClick={() => openEditCategoryModal(category)}
                                className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-600 hover:text-white transition-all shadow-sm border border-orange-200"
                                title="Kategoriyi Düzenle"
                            >
                                <Edit2 size={16} />
                            </button>
                        </div>
                        <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            {category.image_url ? (
                                <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <span className="text-xs">IMG</span>
                                </div>
                            )}
                        </div>
                        <span className="font-semibold text-gray-700 text-lg uppercase">{category.name}</span>
                    </div>

                    <div className="relative inline-flex items-center cursor-pointer" onClick={() => handleToggleCategory(category.id)}>
                        <div className={`w-14 h-7 rounded-full transition-colors duration-200 ease-in-out ${category.isEnabled ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                        <div className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out transform ${category.isEnabled ? 'translate-x-7' : 'translate-x-0'}`}></div>
                    </div>
                </div>

                {/* Render Expandable Content */}
                {isExpanded && (
                    <div className="mt-2 space-y-2 border-l-2 border-gray-100 ml-6 pl-2">
                        {/* Subcategories */}
                        {children.map(child => renderCategoryItem(child, level + 1))}

                        {/* Products */}
                        {categoryProducts.map(product => (
                            <div key={product.id} className={`border border-gray-200 rounded-lg p-3 flex items-center justify-between bg-white ${level > 0 ? 'ml-8' : 'ml-8'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-gray-700 font-medium text-sm">{product.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    {getProductPriceInfo(product).hasDiscount ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-gray-400 line-through">
                                                {getProductPriceInfo(product).originalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-red-600 font-bold text-sm">
                                                    {getProductPriceInfo(product).discountedPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                                </span>
                                                <span className="text-[8px] font-black text-white bg-red-600 px-1 rounded">HH</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-900 font-bold text-sm">
                                            {parseFloat(product.price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                        </span>
                                    )}

                                    <div className="relative inline-flex items-center cursor-pointer" onClick={() => handleToggleProduct(product.id)}>
                                        <div className={`w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${product.isEnabled ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                        <div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out transform ${product.isEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </div>

                                    <button
                                        onClick={() => openEditProductModal(product)}
                                        className="text-gray-400 hover:text-blue-500 transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {children.length === 0 && categoryProducts.length === 0 && (
                            <div className="p-4 text-xs text-gray-400 italic bg-gray-50 rounded ml-8">
                                Bu kategoride içerik bulunamadı.
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // --- Preview Rendering Functions ---

    const currentTheme = menu?.theme_id ? themes.find(t => t.id === menu.theme_id) || themes[0] : themes[0];

    // Build the hierarchy for preview - accurately reflecting what is enabled/disabled
    const processedMenu = categories
        .filter(cat => !cat.parent_id && cat.isEnabled)
        // Strict filtering: If not Turkish, root category must have a translation
        .filter(rootCat => previewLanguage === 'tr' || (rootCat[`name_${previewLanguage}`] && rootCat[`name_${previewLanguage}`].trim() !== ''))
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map(rootCat => {
            // Localize root category
            const localizedRoot = {
                ...rootCat,
                name: previewLanguage === 'tr' ? rootCat.name : rootCat[`name_${previewLanguage}`],
                description: previewLanguage === 'tr' ? rootCat.description : rootCat[`description_${previewLanguage}`],
                note: previewLanguage === 'tr' ? rootCat.note : rootCat[`note_${previewLanguage}`]
            };

            // Filter and localize root products
            const rootProducts = products
                .filter(p => p.category_id === rootCat.id && p.isEnabled)
                // Strict filtering: If not Turkish, product must have a translation
                .filter(p => previewLanguage === 'tr' || (p[`name_${previewLanguage}`] && p[`name_${previewLanguage}`].trim() !== ''))
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                .map(p => ({
                    ...p,
                    name: previewLanguage === 'tr' ? p.name : p[`name_${previewLanguage}`],
                    description: previewLanguage === 'tr' ? p.description : p[`description_${previewLanguage}`],
                    note: previewLanguage === 'tr' ? p.note : p[`note_${previewLanguage}`]
                }));

            // Filter and localize subcategories
            const subCategories = categories
                .filter(sub => sub.parent_id === rootCat.id && sub.isEnabled)
                // Strict filtering: If not Turkish, subcategory must have a translation
                .filter(sub => previewLanguage === 'tr' || (sub[`name_${previewLanguage}`] && sub[`name_${previewLanguage}`].trim() !== ''))
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                .map(sub => {
                    const subProducts = products
                        .filter(p => p.category_id === sub.id && p.isEnabled)
                        // Strict filtering: If not Turkish, product must have a translation
                        .filter(p => previewLanguage === 'tr' || (p[`name_${previewLanguage}`] && p[`name_${previewLanguage}`].trim() !== ''))
                        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                        .map(p => ({
                            ...p,
                            name: previewLanguage === 'tr' ? p.name : p[`name_${previewLanguage}`],
                            description: previewLanguage === 'tr' ? p.description : p[`description_${previewLanguage}`],
                            note: previewLanguage === 'tr' ? p.note : p[`note_${previewLanguage}`]
                        }));

                    return {
                        ...sub,
                        name: previewLanguage === 'tr' ? sub.name : sub[`name_${previewLanguage}`],
                        description: previewLanguage === 'tr' ? sub.description : sub[`description_${previewLanguage}`],
                        note: previewLanguage === 'tr' ? sub.note : sub[`note_${previewLanguage}`],
                        products: subProducts
                    };
                })
                // Hide subcategories if they have no products in strict mode
                .filter(sub => sub.products.length > 0);

            return {
                ...localizedRoot,
                subCategories,
                products: rootProducts
            };
        })
        // Hide root categories if they have no content (products or subcategories with products) in strict mode
        .filter(root => root.products.length > 0 || root.subCategories.length > 0);

    const renderPreviewWelcomeScreen = () => (
        <div
            className="w-full h-full bg-white flex flex-col font-sans antialiased overflow-hidden relative bg-cover bg-center"
            style={{
                backgroundImage: menu?.cover_url ? `url(${menu.cover_url})` : 'none',
                backgroundColor: menu?.cover_url ? 'transparent' : '#ffffff'
            }}
        >
            {menu?.cover_url && <div className="absolute inset-0 bg-black/30 z-0" />}
            <main className="flex-1 flex flex-col items-center justify-center p-6 pb-20 relative z-10">
                <div className="w-24 h-24 bg-white/90 backdrop-blur-sm rounded-[1.5rem] flex items-center justify-center shadow-lg mb-6">
                    {menu?.logo_url ? (
                        <img src={menu.logo_url} alt="Logo" className="w-16 h-16 object-contain" />
                    ) : (
                        <Store className="text-gray-300" size={32} />
                    )}
                </div>
                <div className="text-center space-y-2 max-w-[200px]">
                    <h2 className={`text-lg font-bold tracking-tight ${menu?.cover_url ? 'text-white' : 'text-slate-900'}`}>
                        {menu?.title_tr || "HOŞGELDİNİZ"}
                    </h2>
                    <p className={`text-[11px] font-medium leading-relaxed ${menu?.cover_url ? 'text-white/90' : 'text-slate-500'}`}>
                        {menu?.subtitle_tr || "Menüyü incelemek için tıklayın"}
                    </p>
                </div>
            </main>
            <div className="w-full relative z-10">
                {/* Main Action Button */}
                <div
                    className="w-full relative rounded-t-[2rem] px-6 py-3 flex flex-col items-center justify-center shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
                    style={{ backgroundColor: currentTheme.color }}
                >
                    <button
                        onClick={() => setPreviewScreen('menu')}
                        className="flex flex-col items-center gap-0.5 group py-1"
                    >
                        <BookOpen className="text-white w-6 h-6 stroke-[2]" />
                        <span className="text-white text-sm font-bold tracking-wide">Menüye Git</span>
                    </button>
                </div>

                {/* Footer Grid - Expandable */}
                <div className="w-full bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.05)] border-t border-gray-100 relative">
                    {/* Chevron Button - Minimal */}
                    <button
                        onClick={() => setIsPreviewFooterExpanded(!isPreviewFooterExpanded)}
                        className="absolute -top-5 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all z-20 border border-gray-100"
                    >
                        <ChevronDown
                            size={16}
                            className={`transition-transform duration-300 ${isPreviewFooterExpanded ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {/* Icon Grid - Expandable */}
                    <div
                        className={`grid grid-cols-4 gap-2 px-3 transition-all duration-500 overflow-hidden ${isPreviewFooterExpanded ? 'py-5 max-h-96' : 'py-3 max-h-20'
                            }`}
                    >
                        {/* Feedback Icon - Sample */}
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-sm">
                                <MessageCircle size={18} />
                            </div>
                            <span className="text-[8px] font-medium text-gray-600">Geri Bildirim</span>
                        </div>

                        {/* WiFi Icon - Sample */}
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                                <Wifi size={18} />
                            </div>
                            <span className="text-[8px] font-medium text-gray-600">Wi-Fi</span>
                        </div>

                        {/* Instagram - Sample */}
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-[#E1306C] shadow-sm">
                                <Instagram size={18} />
                            </div>
                            <span className="text-[8px] font-medium text-gray-600">Instagram</span>
                        </div>

                        {/* Twitter - Sample */}
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center text-[#1DA1F2] shadow-sm">
                                <Twitter size={18} />
                            </div>
                            <span className="text-[8px] font-medium text-gray-600">Twitter</span>
                        </div>

                        {/* YouTube - Sample */}
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-[#FF0000] shadow-sm">
                                <Youtube size={18} />
                            </div>
                            <span className="text-[8px] font-medium text-gray-600">YouTube</span>
                        </div>

                        {/* Facebook - Sample */}
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-[#1877F2] shadow-sm">
                                <Facebook size={18} />
                            </div>
                            <span className="text-[8px] font-medium text-gray-600">Facebook</span>
                        </div>

                        {/* TikTok - Sample */}
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-black shadow-sm">
                                <Video size={18} />
                            </div>
                            <span className="text-[8px] font-medium text-gray-600">TikTok</span>
                        </div>

                        {/* Google Review - Sample */}
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 shadow-sm">
                                <Star size={18} fill="currentColor" className="text-orange-500" />
                            </div>
                            <span className="text-[8px] font-medium text-gray-600">Google</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPreviewMenuScreen = () => (
        <div className="flex flex-col h-full bg-[#FAFAFA] font-sans">
            {/* Template Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-md px-3 py-3 border-b border-gray-100 flex items-center justify-between z-[60]">
                <div className="flex-1 flex items-center gap-1.5">
                    <button onClick={() => setPreviewScreen('welcome')} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                        <ChevronRight size={16} className="rotate-180" />
                    </button>
                    {menu?.allow_waiter_call !== false && (
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                            <Bell size={16} className="fill-orange-500" />
                        </div>
                    )}
                    {campaigns.length > 0 && (
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 relative">
                            <Megaphone size={16} className="fill-red-500" />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-600 rounded-full border border-white"></span>
                        </div>
                    )}
                </div>

                <h2 className="flex-shrink-0 text-slate-900 text-sm font-bold whitespace-nowrap">SientoPOS</h2>

                <div className="flex-1 flex items-center justify-end">
                    <div className="relative" ref={languageMenuRef}>
                        <button
                            onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                            className="flex items-center justify-center bg-gray-50 border border-gray-100 rounded-lg w-8 h-8 shadow-sm hover:border-gray-200 transition-all active:scale-95"
                        >
                            <span className={`fi fi-${LANGUAGES.find(l => l.code === previewLanguage)?.flagCode} w-5 h-5`}></span>
                        </button>

                        {isLanguageMenuOpen && (
                            <div className="dropdown-menu absolute right-0 top-full mt-1 w-12 bg-white dark:bg-dropdown-dark rounded-lg shadow-popover border border-slate-100 dark:border-slate-600/30 overflow-hidden flex flex-col items-center py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setPreviewLanguage(lang.code);
                                            setIsLanguageMenuOpen(false);
                                        }}
                                        className={`w-full h-8 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-600/50 transition-colors ${previewLanguage === lang.code ? 'bg-slate-50 dark:bg-slate-600/50' : ''}`}
                                    >
                                        <span className={`fi fi-${lang.flagCode} w-5 h-5`}></span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="bg-white pb-3 border-b border-gray-50 overflow-x-auto no-scrollbar">
                <div className="flex gap-3 px-4 py-2">
                    {processedMenu.map((cat) => {
                        const isActive = previewActiveCategory === cat.id;
                        return (
                            <div
                                key={cat.id}
                                onClick={() => setPreviewActiveCategory(cat.id)}
                                className="flex flex-col items-center gap-1 min-w-[60px] cursor-pointer"
                            >
                                <div
                                    className={`h-14 w-14 rounded-2xl flex items-center justify-center border-2 overflow-hidden transition-all ${isActive ? 'bg-white shadow-md' : 'bg-gray-50 border-transparent'}`}
                                    style={isActive ? { borderColor: currentTheme.color } : {}}
                                >
                                    {cat.image_url ? (
                                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Utensils size={20} className="text-gray-300" />
                                    )}
                                </div>
                                <p className={`text-[10px] font-medium text-center truncate w-16 ${isActive ? 'font-bold' : 'text-slate-400'}`} style={isActive ? { color: currentTheme.color } : {}}>
                                    {cat.name}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-3 bg-[#F5F5F7]">
                {processedMenu.find(c => c.id === previewActiveCategory)?.products?.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-2">
                        {processedMenu.find(c => c.id === previewActiveCategory).products.map(product => (
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

                {processedMenu.find(c => c.id === previewActiveCategory)?.subCategories.map(subCat => (
                    <div key={subCat.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100/50">
                        <div className="p-3 flex items-center justify-between border-b border-gray-50">
                            <h3 className="text-slate-800 text-[13px] font-bold">{subCat.name}</h3>
                            <ChevronDown size={14} className="text-slate-400" />
                        </div>
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
                    </div>
                ))}

                {(!processedMenu.find(c => c.id === previewActiveCategory)?.products?.length && !processedMenu.find(c => c.id === previewActiveCategory)?.subCategories?.length) && (
                    <div className="text-center py-10">
                        <Coffee size={32} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Henüz ürün yok</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderMockup = () => (
        <div className="w-[300px] h-[600px] bg-gray-900 rounded-[45px] shadow-2xl border-[8px] border-gray-900 ring-4 ring-gray-900/10 overflow-hidden relative mx-auto">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[80px] h-[20px] bg-black rounded-b-[15px] z-30 pointer-events-none"></div>
            <div className="w-full h-full bg-white rounded-[35px] overflow-hidden relative">
                {previewScreen === 'welcome' ? renderPreviewWelcomeScreen() : renderPreviewMenuScreen()}
            </div>
        </div>
    );

    if (loading) return <div className="p-6">Yükleniyor...</div>;
    if (!menu) return <div className="p-6">Menü bulunamadı.</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">{menu.name}</h1>
                    <div className="text-xs text-blue-500 mt-1 space-x-1">
                        <span>Pano</span>
                        <span>-</span>
                        <span>Qr Menü</span>
                        <span>-</span>
                        <span className="text-gray-500">{menu.name}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate('/isletme/qr/menu')} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                        <ArrowLeft size={16} /> Listeye Dön
                    </button>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                        <Plus size={16} /> Ürün Ekle
                    </button>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                        <Plus size={16} /> Kategori Ekle
                    </button>
                    <button
                        onClick={handleSyncMenu}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Ürünleri Senkronize Et
                    </button>
                    <button
                        onClick={() => window.open(`/qr/home/${id}`, '_blank')}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                    >
                        <BookOpen size={16} /> Menüyü Göster
                    </button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 mb-6 text-center shadow-sm">
                <p className="text-purple-700 text-sm mb-4">
                    Menülerinizde yaptığınız değişikliklerin aktif olması için değişiklikleri aktar butonuna basmanız gerekmektedir.
                    QR Menünün son halini yayına almak istiyorsanız lütfen aşağıdaki butona basınız.
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={handleSyncMenu}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Değişiklikleri Aktar
                    </button>
                    <button
                        onClick={() => window.open(`/qr/home/${id}`, '_blank')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        <BookOpen size={16} /> Menüyü Göster
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[500px] w-full lg:w-auto">
                    {/* Search */}
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Kategori veya Ürün Ara"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
                            Ara
                        </button>
                    </div>

                    {/* List */}
                    <div className="space-y-4">
                        {categories
                            .filter(c => !c.parent_id) // Only render roots initially
                            .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map(category => renderCategoryItem(category))}

                        {categories.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                Henüz kategori bulunamadı. "Ürünleri Senkronize Et" butonunu kullanabilir veya yeni kategori ekleyebilirsiniz.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Mockup Preview - Sticky */}
                <div className="w-full lg:w-[350px] sticky top-6 hidden lg:block">
                    <div className="flex flex-col items-center gap-4 py-2">
                        <div className="w-full flex justify-between items-center mb-2 px-6">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Canlı Önizleme</h3>
                            <button
                                onClick={() => setPreviewScreen(previewScreen === 'welcome' ? 'menu' : 'welcome')}
                                className="text-[9px] bg-purple-50 text-purple-600 px-3 py-1.5 rounded-md font-bold uppercase transition-all hover:bg-purple-100 active:scale-95 shadow-sm border border-purple-100"
                            >
                                Ekran Değiştir
                            </button>
                        </div>
                        {renderMockup()}
                        <div className="mt-4 px-6 py-4 bg-orange-50/50 border border-orange-100 rounded-xl max-w-[300px]">
                            <p className="text-[10px] text-orange-700 text-center font-medium leading-relaxed">
                                <span className="font-bold">💡 İPUCU:</span> Sol tarafta yaptığınız tüm değişiklikler (aktif/pasif, isim, fiyat vb.) bu ekranda <span className="underline italic">ANLIK</span> olarak güncellenir.
                            </p>
                        </div>
                        <button
                            onClick={handleSyncMenu}
                            className="w-[280px] bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            ŞİMDİ YAYINLA
                        </button>
                    </div>
                </div>
            </div>

            {/* Product Edit Modal */}
            {showEditProductModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">Düzenle</h2>
                            <button onClick={closeEditProductModal} className="text-gray-400 hover:text-gray-600 transition">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 px-4">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Genel Ayarlar
                            </button>
                            <button
                                onClick={() => setActiveTab('other')}
                                className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'other' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Diğer
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {activeTab === 'general' ? (
                                <>
                                    {/* 🟢 ÜRÜN ADI */}
                                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                                        <h4 className="flex items-center gap-2 text-xs font-black text-green-600 uppercase tracking-widest">
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></div>
                                            ÜRÜN ADI
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Ürün Adı (Türkçe) <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={editFormData.name}
                                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Product Name (English)</label>
                                                <input
                                                    type="text"
                                                    value={editFormData.name_en}
                                                    onChange={(e) => setEditFormData({ ...editFormData, name_en: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Nombre del Producto (Español)</label>
                                                <input
                                                    type="text"
                                                    value={editFormData.name_es}
                                                    onChange={(e) => setEditFormData({ ...editFormData, name_es: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Nom du Produit (Français)</label>
                                                <input
                                                    type="text"
                                                    value={editFormData.name_fr}
                                                    onChange={(e) => setEditFormData({ ...editFormData, name_fr: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Название продукта (Русский)</label>
                                                <input
                                                    type="text"
                                                    value={editFormData.name_ru}
                                                    onChange={(e) => setEditFormData({ ...editFormData, name_ru: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 🟢 ÜRÜN AÇIKLAMASI */}
                                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                                        <h4 className="flex items-center gap-2 text-xs font-black text-green-600 uppercase tracking-widest">
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></div>
                                            ÜRÜN AÇIKLAMASI
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Açıklama (Türkçe)</label>
                                                <textarea
                                                    rows="2"
                                                    value={editFormData.description}
                                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all resize-none"
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Description (English)</label>
                                                <textarea
                                                    rows="2"
                                                    value={editFormData.description_en}
                                                    onChange={(e) => setEditFormData({ ...editFormData, description_en: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all resize-none"
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Descripción (Español)</label>
                                                <textarea
                                                    rows="2"
                                                    value={editFormData.description_es}
                                                    onChange={(e) => setEditFormData({ ...editFormData, description_es: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all resize-none"
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Description (Français)</label>
                                                <textarea
                                                    rows="2"
                                                    value={editFormData.description_fr}
                                                    onChange={(e) => setEditFormData({ ...editFormData, description_fr: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all resize-none"
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Описание (Русский)</label>
                                                <textarea
                                                    rows="2"
                                                    value={editFormData.description_ru}
                                                    onChange={(e) => setEditFormData({ ...editFormData, description_ru: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all resize-none"
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 🟢 NOT ALANI */}
                                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                                        <h4 className="flex items-center gap-2 text-xs font-black text-green-600 uppercase tracking-widest">
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></div>
                                            NOT ALANI
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Not (Türkçe)</label>
                                                <textarea
                                                    rows="2"
                                                    value={editFormData.note}
                                                    onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })}
                                                    placeholder="Not ekle..."
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all resize-none"
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Note (English)</label>
                                                <textarea
                                                    rows="2"
                                                    value={editFormData.note_en}
                                                    onChange={(e) => setEditFormData({ ...editFormData, note_en: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all resize-none"
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Nota (Español)</label>
                                                <textarea
                                                    rows="2"
                                                    value={editFormData.note_es}
                                                    onChange={(e) => setEditFormData({ ...editFormData, note_es: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all resize-none"
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Remarque (Français)</label>
                                                <textarea
                                                    rows="2"
                                                    value={editFormData.note_fr}
                                                    onChange={(e) => setEditFormData({ ...editFormData, note_fr: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all resize-none"
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Примечание (Русский)</label>
                                                <textarea
                                                    rows="2"
                                                    value={editFormData.note_ru}
                                                    onChange={(e) => setEditFormData({ ...editFormData, note_ru: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all resize-none"
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Ürün Resmi</label>
                                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 transition">
                                            {editFormData.image_url ? (
                                                <img src={editFormData.image_url} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <div className="text-gray-400">
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Other Tab Content */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Hazırlanma Süresi (Dakika)</label>
                                            <input
                                                type="number"
                                                value={editFormData.preparation_time}
                                                onChange={(e) => setEditFormData({ ...editFormData, preparation_time: e.target.value })}
                                                placeholder="Örn: 20"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Kalori (kcal)</label>
                                            <input
                                                type="number"
                                                value={editFormData.calories}
                                                onChange={(e) => setEditFormData({ ...editFormData, calories: e.target.value })}
                                                placeholder="Örn: 350"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Alerjenler</label>
                                        <input
                                            type="text"
                                            value={editFormData.allergens}
                                            onChange={(e) => setEditFormData({ ...editFormData, allergens: e.target.value })}
                                            placeholder="Örn: Gluten, Süt"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Etiketler (Virgül ile ayırın)</label>
                                        <input
                                            type="text"
                                            value={editFormData.tags}
                                            onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                                            placeholder="Örn: Vejetaryen, Acılı, Yeni"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Mutfak Başlangıç Saati</label>
                                            <input
                                                type="time"
                                                value={editFormData.kitchen_start_time}
                                                onChange={(e) => setEditFormData({ ...editFormData, kitchen_start_time: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Mutfak Bitiş Saati</label>
                                            <input
                                                type="time"
                                                value={editFormData.kitchen_end_time}
                                                onChange={(e) => setEditFormData({ ...editFormData, kitchen_end_time: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="pt-4 border-t border-gray-100 mt-4">
                                <button
                                    onClick={handleDeleteProduct}
                                    className="text-red-500 hover:text-red-600 text-sm font-semibold flex items-center gap-2 transition"
                                >
                                    <Trash2 size={16} /> Bu Ürünü Sil
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                            <button
                                onClick={closeEditProductModal}
                                className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-pink-500 hover:bg-pink-600 transition shadow-sm hover:shadow"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSaveProduct}
                                className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-green-500 hover:bg-green-600 transition shadow-sm hover:shadow"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Category Edit Modal */}
            {editingCategory && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEditCategoryModal}></div>
                    <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-xl font-black text-gray-800 tracking-tight uppercase">KATEGORİYİ GÜNCELLE</h3>
                            <button onClick={closeEditCategoryModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* 🟢 KATEGORİ ADI */}
                            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                                <h4 className="flex items-center gap-2 text-xs font-black text-orange-600 uppercase tracking-widest">
                                    <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></div>
                                    KATEGORİ ADI
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">İsim (Türkçe) <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={categoryEditFormData.name}
                                            onChange={(e) => setCategoryEditFormData({ ...categoryEditFormData, name: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Name (English)</label>
                                        <input
                                            type="text"
                                            value={categoryEditFormData.name_en}
                                            onChange={(e) => setCategoryEditFormData({ ...categoryEditFormData, name_en: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Nombre (Español)</label>
                                        <input
                                            type="text"
                                            value={categoryEditFormData.name_es}
                                            onChange={(e) => setCategoryEditFormData({ ...categoryEditFormData, name_es: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Nom (Français)</label>
                                        <input
                                            type="text"
                                            value={categoryEditFormData.name_fr}
                                            onChange={(e) => setCategoryEditFormData({ ...categoryEditFormData, name_fr: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Название (Русский)</label>
                                        <input
                                            type="text"
                                            value={categoryEditFormData.name_ru}
                                            onChange={(e) => setCategoryEditFormData({ ...categoryEditFormData, name_ru: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 🟢 KATEGORİ AÇIKLAMASI */}
                            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                                <h4 className="flex items-center gap-2 text-xs font-black text-orange-600 uppercase tracking-widest">
                                    <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></div>
                                    KATEGORİ AÇIKLAMASI
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Açıklama (Türkçe)</label>
                                        <textarea
                                            rows="2"
                                            value={categoryEditFormData.description}
                                            onChange={(e) => setCategoryEditFormData({ ...categoryEditFormData, description: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Description (English)</label>
                                        <textarea
                                            rows="2"
                                            value={categoryEditFormData.description_en}
                                            onChange={(e) => setCategoryEditFormData({ ...categoryEditFormData, description_en: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Descripción (Español)</label>
                                        <textarea
                                            rows="2"
                                            value={categoryEditFormData.description_es}
                                            onChange={(e) => setCategoryEditFormData({ ...categoryEditFormData, description_es: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Description (Français)</label>
                                        <textarea
                                            rows="2"
                                            value={categoryEditFormData.description_fr}
                                            onChange={(e) => setCategoryEditFormData({ ...categoryEditFormData, description_fr: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Описание (Русский)</label>
                                        <textarea
                                            rows="2"
                                            value={categoryEditFormData.description_ru}
                                            onChange={(e) => setCategoryEditFormData({ ...categoryEditFormData, description_ru: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* 🟢 NOT ALANI */}
                            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                                <h4 className="flex items-center gap-2 text-xs font-black text-orange-600 uppercase tracking-widest">
                                    <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></div>
                                    NOT ALANI
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Not (Türkçe)</label>
                                        <textarea
                                            rows="2"
                                            value={categoryEditFormData.note}
                                            onChange={(e) => setCategoryEditFormData({ ...categoryEditFormData, note: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Note (English)</label>
                                        <textarea
                                            rows="2"
                                            value={categoryEditFormData.note_en}
                                            onChange={(e) => setCategoryEditFormData({ ...categoryEditFormData, note_en: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Nota (Español)</label>
                                        <textarea
                                            rows="2"
                                            value={categoryEditFormData.note_es}
                                            onChange={(e) => setCategoryEditFormData({ ...categoryEditFormData, note_es: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Remarque (Français)</label>
                                        <textarea
                                            rows="2"
                                            value={categoryEditFormData.note_fr}
                                            onChange={(e) => setCategoryEditFormData({ ...categoryEditFormData, note_fr: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Примечание (Русский)</label>
                                        <textarea
                                            rows="2"
                                            value={categoryEditFormData.note_ru}
                                            onChange={(e) => setCategoryEditFormData({ ...categoryEditFormData, note_ru: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Kategori Resmi</label>
                                <div
                                    className="relative w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-orange-400 transition-colors"
                                    onClick={() => document.getElementById('category-image-upload').click()}
                                >
                                    {categoryEditFormData.image_url ? (
                                        <img src={categoryEditFormData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 text-gray-400">
                                            <Plus size={24} />
                                            <span className="text-[10px] font-bold uppercase">Yükle</span>
                                        </div>
                                    )}
                                    <input
                                        id="category-image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            try {
                                                const filePath = `categories/${Math.random()}.${file.name.split('.').pop()}`;
                                                const { error } = await supabase.storage.from('details').upload(filePath, file);
                                                if (error) throw error;
                                                const { data } = supabase.storage.from('details').getPublicUrl(filePath);
                                                setCategoryEditFormData({ ...categoryEditFormData, image_url: data.publicUrl });
                                            } catch (err) {
                                                alert('Hata: ' + err.message);
                                            }
                                        }}
                                    />
                                </div>
                                {categoryEditFormData.image_url && (
                                    <button
                                        onClick={() => setCategoryEditFormData({ ...categoryEditFormData, image_url: '' })}
                                        className="mt-2 text-red-500 text-xs font-bold flex items-center gap-1 hover:underline"
                                    >
                                        <Trash2 size={12} /> Fotoğrafı Sil
                                    </button>
                                )}
                            </div>

                            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                <button
                                    onClick={handleDeleteCategory}
                                    className="text-red-500 hover:text-red-600 text-[10px] font-bold uppercase flex items-center gap-1 transition-colors"
                                >
                                    <Trash2 size={14} /> Kategoriyi Sil
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                            <button
                                onClick={closeEditCategoryModal}
                                className="px-6 py-2 rounded-lg text-sm font-black uppercase text-white bg-rose-500 hover:bg-rose-600 transition shadow-sm"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSaveCategory}
                                className="px-6 py-2 rounded-lg text-sm font-black uppercase text-white bg-emerald-500 hover:bg-emerald-600 transition shadow-sm"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRMenuDetail;
