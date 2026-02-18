import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Plus, Search, MoreHorizontal, Trash2, Check, X, Move, Copy, Edit2 } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';

const CategoryItem = ({ cat, level, categories, navigate, handleReorder, openEditModal, handleDeleteCategory }) => {
    const children = categories.filter(c => c.parent_id === cat.id).sort((a, b) => a.sort_order - b.sort_order);
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            key={cat.id}
            value={cat}
            id={cat.id}
            dragListener={false}
            dragControls={dragControls}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="select-none"
        >
            <div className={`flex justify-between items-center px-4 py-2 hover:bg-gray-50/50 transition group ${level > 0 ? 'ml-8 relative' : ''}`}>
                {/* Visual Connector for children */}
                {level > 0 && (
                    <div className="absolute -left-4 top-0 h-full w-px border-l-2 border-dashed border-gray-300"></div>
                )}

                <div className="flex items-center gap-4">
                    <div
                        className="text-gray-400 cursor-move hover:text-blue-500 transition-colors p-1"
                        onPointerDown={(e) => dragControls.start(e)}
                        style={{ touchAction: 'none' }}
                    >
                        <Move size={14} />
                    </div>
                    <div
                        onClick={() => navigate(`/isletme/kategoriler/${cat.id}`)}
                        className="cursor-pointer hover:text-blue-600 transition"
                    >
                        <h3 className={`font-black text-gray-700 uppercase tracking-widest ${level > 0 ? 'text-[11px]' : 'text-[13px]'}`}>
                            {cat.name}
                            {cat.printer_id && (
                                <span className="text-blue-500 ml-2 border-l border-gray-200 pl-2">
                                    {categories.find(c => c.id === cat.id)?.printer_name || 'YAZICI'}
                                </span>
                            )}
                        </h3>
                    </div>
                </div>
                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Kopyala">
                        <Copy size={18} />
                    </button>
                    <button
                        onClick={() => openEditModal(cat)}
                        className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-600 hover:text-white transition-all shadow-sm border border-orange-200"
                        title="Düzenle"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Sil"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
            {/* Render children within a nested group */}
            {children.length > 0 && (
                <Reorder.Group
                    axis="y"
                    values={children}
                    onReorder={(newOrder) => handleReorder(newOrder, cat.id)}
                    className="space-y-0"
                >
                    {children.map(child => (
                        <CategoryItem
                            key={child.id}
                            cat={child}
                            level={level + 1}
                            categories={categories}
                            navigate={navigate}
                            handleReorder={handleReorder}
                            openEditModal={openEditModal}
                            handleDeleteCategory={handleDeleteCategory}
                        />
                    ))}
                </Reorder.Group>
            )}
        </Reorder.Item>
    );
};

const MenuManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [originalCategories, setOriginalCategories] = useState([]); // Backup for reorder rollback
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showActions, setShowActions] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [archivedCategories, setArchivedCategories] = useState([]);
    const [printers, setPrinters] = useState([]);

    // Modal & Form States
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategoryData, setNewCategoryData] = useState({
        name: '',
        printer_id: '',
        parentCategory: '',
        type: 'Ana Ürünler',
        label_printer_id: ''
    });

    useEffect(() => {
        if (user && user.business_id) {
            fetchData();
        } else if (user) {
            setLoading(false);
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: catData } = await supabase
                .from('categories')
                .select('*')
                .eq('business_id', user.business_id)
                .order('sort_order', { ascending: true });

            const { data: prodData } = await supabase
                .from('products')
                .select('*, categories(name)')
                .eq('business_id', user.business_id)
                .order('id', { ascending: true });

            const { data: printersData } = await supabase
                .from('printers')
                .select('id, name')
                .eq('business_id', user.business_id)
                .is('is_deleted', false);

            setPrinters(printersData || []);

            // Client-side filtering for safety against missing columns in DB
            const activeCategories = catData ? catData.filter(c => c.is_deleted !== true).map(c => ({
                ...c,
                printer_name: printersData?.find(p => p.id === c.printer_id)?.name
            })) : [];
            setCategories(activeCategories);
            setOriginalCategories(activeCategories);
            setProducts(prodData || []);
        } catch (error) {
            console.error('Error fetching menu:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategoryInitial = async (e) => {
        e.preventDefault();

        try {
            let error;
            const payload = {
                name: newCategoryData.name,
                business_id: user.business_id,
                parent_id: newCategoryData.parentCategory || null,
                printer_id: newCategoryData.printer_id || null,
                label_printer_id: newCategoryData.label_printer_id || null
            };

            if (editingCategory) {
                // UPDATE logic
                const { error: updateError } = await supabase
                    .from('categories')
                    .update(payload)
                    .eq('id', editingCategory.id);
                error = updateError;
            } else {
                // INSERT logic
                const { error: insertError } = await supabase
                    .from('categories')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            alert(editingCategory ? "Kategori başarıyla güncellendi!" : "Kategori başarıyla eklendi!");
            fetchData();
            closeModal();

        } catch (error) {
            console.error("Error saving category", error);
            alert("İşlem başarısız: " + error.message);
        }
    };

    const openAddModal = () => {
        setEditingCategory(null);
        setNewCategoryData({ name: '', printer: '', parentCategory: '', type: 'Ana Ürünler', printLabel: '' });
        setShowAddCategoryModal(true);
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setNewCategoryData({
            name: category.name,
            printer_id: category.printer_id || '',
            parentCategory: category.parent_id || '',
            type: 'Ana Ürünler',
            label_printer_id: category.label_printer_id || ''
        });
        setShowAddCategoryModal(true);
    };

    const closeModal = () => {
        setShowAddCategoryModal(false);
        setEditingCategory(null);
        setNewCategoryData({ name: '', printer: '', parentCategory: '', type: 'Ana Ürünler', printLabel: '' });
    };

    const handleExport = () => {
        import('xlsx').then(XLSX => {
            const exportData = products.map(p => ({
                'Kategori': p.categories?.name,
                'Ürün Adı': p.name,
                'Fiyat': p.price,
                'Stok': p.stock_quantity
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, "Menu");
            XLSX.writeFile(wb, "Menu_Listesi.xlsx");
        });
        setShowActions(false);
    };

    const handleBulkPriceEdit = () => {
        navigate('/isletme/toplu-fiyat-duzenle');
        setShowActions(false);
    };

    const handlePosSync = async () => {
        try {
            setLoading(true);
            setShowActions(false);

            // 1. Fetch current categories and products
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

            // 2. Build the hierarchical structure (Same as QRMenuDetail for consistency)
            const menuSnapshot = currentCategories
                .filter(cat => !cat.parent_id)
                .map(rootCat => ({
                    ...rootCat,
                    subCategories: currentCategories
                        .filter(sub => sub.parent_id === rootCat.id)
                        .map(sub => ({
                            ...sub,
                            id: sub.id,
                            name: sub.name,
                            description: sub.description,
                            image_url: sub.image_url,
                            is_active: sub.is_active,
                            products: currentProducts.filter(p => p.category_id === sub.id)
                        })),
                    products: currentProducts.filter(p => p.category_id === rootCat.id)
                }));

            // 3. Update ALL qr_menus associated with this business
            const { error: syncErr } = await supabase
                .from('qr_menus')
                .update({
                    published_data: menuSnapshot,
                    updated_at: new Date().toISOString()
                })
                .eq('business_id', user.business_id);

            if (syncErr) throw syncErr;

            const now = new Date().toLocaleTimeString('tr-TR');
            alert(`Tüm QR Menüler başarıyla senkronize edildi (${now})! Değişiklikler yayına alındı.`);

        } catch (error) {
            console.error("Global sync error:", error);
            alert("Senkronizasyon hatası: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm("Bu kategoriyi arşive göndermek istediğinize emin misiniz?")) {
            try {
                const { error } = await supabase
                    .from('categories')
                    .update({ is_deleted: true, deleted_at: new Date() })
                    .eq('id', id);

                if (error) {
                    // Check if error is due to missing column
                    if (error.message && error.message.includes('column "is_deleted" does not exist')) {
                        alert("HATA: Arşiv sistemi veritabanında aktif değil. Lütfen teknik destek ile iletişime geçin. (Eksik tablo yapısı)");
                        return;
                    }
                    throw error;
                }

                fetchData();
            } catch (error) {
                console.error("Error deleting category:", error);
                alert("Arşivleme işlemi başarısız: " + error.message);
            }
        }
    };

    const fetchArchivedCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('business_id', user.business_id)
                // We use client filter for safety if db doesn't support filter syntax on missing col
                // But for fetching specific 'true' values, we usually need the column.
                // If column missing, this query might fail.
                // Let's try to fetch all and filter client side for robustness? 
                // No, fetching all deleted items separately is inefficient but safer if schema is flux.
                // Let's stick to query, if it fails, we assume no archive support.
                .eq('is_deleted', true)
                .order('deleted_at', { ascending: false });

            if (error) throw error;

            // Filter for last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            setArchivedCategories(data.filter(d => new Date(d.deleted_at) > thirtyDaysAgo));
            setShowArchiveModal(true);
        } catch (error) {
            console.error("Error fetching archive:", error);
            // Don't alert loudly if just empty or col missing, maybe just empty list?
            // But user clicked button.
            if (error.message && error.message.includes('column "is_deleted" does not exist')) {
                alert("Arşiv özelliği henüz veritabanında aktifleştirilmemiş.");
            } else {
                alert("Arşiv yüklenirken hata oluştu: " + error.message);
            }
        }
    };

    const handleRestoreCategory = async (id) => {
        try {
            const { error } = await supabase
                .from('categories')
                .update({ is_deleted: false, deleted_at: null })
                .eq('id', id);

            if (error) throw error;

            // Refresh both lists
            fetchArchivedCategories();
            fetchData();
        } catch (error) {
            console.error("Error restoring category:", error);
            alert("Geri yükleme başarısız: " + error.message);
        }
    };

    const handleReorder = (reorderedItems, parentId = null) => {
        // Optimistic UI update
        const updatedCategories = [...categories];

        // Map new sort_order based on the new positions in reorderedItems
        const updates = reorderedItems.map((item, index) => ({
            id: item.id,
            sort_order: index + 1
        }));

        // Apply to local state
        const finalCategories = updatedCategories.map(cat => {
            const update = updates.find(u => u.id === cat.id);
            return update ? { ...cat, sort_order: update.sort_order } : cat;
        }).sort((a, b) => {
            if (a.parent_id !== b.parent_id) return 0;
            return a.sort_order - b.sort_order;
        });

        setCategories(finalCategories);
    };

    // Use useEffect to debounce the database update for categories
    useEffect(() => {
        if (categories.length === 0 || originalCategories.length === 0) return;

        // Simple check if order changed
        if (JSON.stringify(categories.map(c => ({ id: c.id, s: c.sort_order }))) ===
            JSON.stringify(originalCategories.map(c => ({ id: c.id, s: c.sort_order })))) {
            return;
        }

        const timer = setTimeout(async () => {
            try {
                // Find what changed
                const updates = categories.filter(cat => {
                    const orig = originalCategories.find(o => o.id === cat.id);
                    return orig && orig.sort_order !== cat.sort_order;
                });

                if (updates.length === 0) return;

                // Update Database
                for (const up of updates) {
                    await supabase
                        .from('categories')
                        .update({ sort_order: up.sort_order })
                        .eq('id', up.id);
                }

                setOriginalCategories([...categories]);
                console.log('Category order synced to DB');
            } catch (error) {
                console.error('Error syncing category order:', error);
            }
        }, 1200);

        return () => clearTimeout(timer);
    }, [categories]);


    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800 relative">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">Menü Yönetimi</h1>
                    <div className="text-xs text-gray-400 mt-1 flex gap-1 items-center">
                        <span>Pano</span>
                        <span className="text-[10px]">•</span>
                        <span>POS Ayarları</span>
                        <span className="text-[10px]">•</span>
                        <span>Menü Yönetimi</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={openAddModal}
                        className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-200 transition flex items-center gap-2"
                    >
                        Yeni Ürün Kategorisi
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowActions(!showActions)}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 transition flex items-center gap-2"
                        >
                            İşlemler <ChevronDown size={16} />
                        </button>

                        {showActions && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-100 rounded-lg shadow-xl z-50 overflow-hidden py-1">
                                <button onClick={handleBulkPriceEdit} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-50 last:border-0">
                                    Toplu Fiyat Düzenle
                                </button>
                                <button onClick={handlePosSync} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-50 last:border-0">
                                    Değişiklikleri POS'a Aktar
                                </button>
                                <button onClick={handleExport} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition">
                                    Excele Aktar
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={fetchArchivedCategories}
                        className="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-200 transition flex items-center gap-2"
                    >
                        Arşiv
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <input
                    type="text"
                    placeholder="Ara"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 shadow-sm transition"
                />
                <div className="absolute right-0 top-0 h-full w-12 flex items-center justify-center bg-gray-100 rounded-r-lg border-l border-gray-200 text-gray-500">
                    <Search size={18} />
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {categories.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        <Reorder.Group
                            axis="y"
                            values={categories.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order)} // Sort root categories
                            onReorder={(newOrder) => handleReorder(newOrder, null)}
                            className="divide-y divide-gray-100"
                        >
                            {categories
                                .filter(cat => !cat.parent_id)
                                .map((cat) => (
                                    <CategoryItem
                                        key={cat.id}
                                        cat={cat}
                                        level={0}
                                        categories={categories}
                                        navigate={navigate}
                                        handleReorder={handleReorder}
                                        openEditModal={openEditModal}
                                        handleDeleteCategory={handleDeleteCategory}
                                    />
                                ))}
                        </Reorder.Group>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <span className="mb-2">Henüz kategori bulunmuyor.</span>
                        <span className="text-sm">"Yeni Ürün Kategorisi" butonundan ekleme yapabilirsiniz.</span>
                    </div>
                )}
            </div>

            {/* Add/Edit Category Modal */}
            {showAddCategoryModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">
                                {editingCategory ? 'KATEGORİYİ GÜNCELLE' : 'YENİ KATEGORİ EKLE'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Kategori adı (Türkçe)</label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        value={newCategoryData.name}
                                        onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
                                        className="flex-1 border border-gray-200 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                    />
                                    <div className="bg-gray-100 border border-l-0 border-gray-200 px-3 py-2 rounded-r-lg text-sm text-gray-500 flex items-center">
                                        Tr <ChevronDown size={14} className="ml-1" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Yazıcılar</label>
                                <select
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-blue-500 appearance-none bg-white"
                                    value={newCategoryData.printer_id}
                                    onChange={(e) => setNewCategoryData({ ...newCategoryData, printer_id: e.target.value })}
                                >
                                    <option value="">Seçilmedi</option>
                                    {printers.map(printer => (
                                        <option key={printer.id} value={printer.id}>{printer.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Üst Kategori</label>
                                <select
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-blue-500 appearance-none bg-white"
                                    value={newCategoryData.parentCategory}
                                    onChange={(e) => setNewCategoryData({ ...newCategoryData, parentCategory: e.target.value })}
                                >
                                    <option value="">Üst Kategori Seçiniz</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Kategori Tipi</label>
                                <select
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-blue-500 appearance-none bg-white"
                                    value={newCategoryData.type}
                                    onChange={(e) => setNewCategoryData({ ...newCategoryData, type: e.target.value })}
                                >
                                    <option value="Ana Ürünler">Ana Ürünler</option>
                                    <option value="Yan Ürünler">Yan Ürünler</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Etiket Yazdır</label>
                                <select
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-blue-500 appearance-none bg-white"
                                    value={newCategoryData.label_printer_id}
                                    onChange={(e) => setNewCategoryData({ ...newCategoryData, label_printer_id: e.target.value })}
                                >
                                    <option value="">-</option>
                                    {printers.map(printer => (
                                        <option key={printer.id} value={printer.id}>{printer.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                            <button
                                onClick={closeModal}
                                className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleAddCategoryInitial}
                                className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-teal-500 hover:bg-teal-600 transition"
                            >
                                {editingCategory ? 'Kaydet' : 'Ürün Kategorisi Ekle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Archive Modal */}
            {showArchiveModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Trash2 size={20} className="text-orange-500" />
                                Arşiv (Son 30 Gün)
                            </h2>
                            <button onClick={() => setShowArchiveModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-0 overflow-y-auto flex-1">
                            {archivedCategories.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    Arşivde kategori bulunmuyor.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {archivedCategories.map((cat) => {
                                        const daysLeft = 30 - Math.floor((new Date() - new Date(cat.deleted_at)) / (1000 * 60 * 60 * 24));
                                        return (
                                            <div key={cat.id} className="flex justify-between items-center p-4 hover:bg-gray-50 transition">
                                                <div>
                                                    <h3 className="font-bold text-gray-700">{cat.name}</h3>
                                                    <div className="text-xs text-gray-400">
                                                        Silinme Tarihi: {new Date(cat.deleted_at).toLocaleDateString()}
                                                        <span className="mx-1">•</span>
                                                        <span className={daysLeft < 5 ? 'text-red-500 font-bold' : ''}>
                                                            {daysLeft} gün kaldı
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRestoreCategory(cat.id)}
                                                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition flex items-center gap-2 font-medium text-xs"
                                                    title="Geri Yükle"
                                                >
                                                    <Check size={16} /> Geri Yükle
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-gray-50 text-xs text-gray-400 text-center border-t border-gray-100">
                            30 gün sonunda otomatik olarak kalıcı silinecektir.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuManagement;
