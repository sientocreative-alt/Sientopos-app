import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { ChevronLeft, Plus, Search, Filter, Trash2, Move, Copy, MoreHorizontal, ShoppingBag, X, ChevronDown } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';

const ProductItem = ({ product, printers, navigate, handleEditClick, handleDeleteClick, categoryId }) => {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            key={product.id}
            value={product}
            id={product.id}
            dragListener={false}
            dragControls={dragControls}
            className="bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group select-none"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    {/* Drag Handle */}
                    <div
                        className="text-gray-400 cursor-move hover:text-blue-500 transition-colors p-2"
                        onPointerDown={(e) => dragControls.start(e)}
                        style={{ touchAction: 'none' }}
                    >
                        <Move size={18} />
                    </div>

                    <div
                        className="flex items-center gap-4 cursor-pointer flex-1"
                        onClick={() => navigate(`/isletme/kategoriler/${categoryId}/urunler/${product.id}`)}
                    >
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <ShoppingBag size={20} className="text-gray-200" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-black text-gray-800 text-[13px] uppercase tracking-widest group-hover:text-blue-600 transition-colors">
                                {product.name}
                                <span className="text-gray-300 font-bold ml-2 pl-2 border-l border-gray-100">
                                    {printers.find(p => p.id === product.printer_id)?.name || 'Yazıcı Seçilmedi'}
                                </span>
                            </h3>
                            <div className="flex items-center gap-4 mt-0.5">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${product.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {product.is_active ? 'Aktif' : 'Pasif'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-tight">KDV: %{product.vat_rate || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Price & Actions */}
                <div className="flex items-center gap-6">
                    <div className="font-black text-gray-900 text-[14px]">
                        {parseFloat(product.price).toFixed(2).replace('.', ',')} ₺
                    </div>

                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-gray-50 p-1 rounded-lg">
                        <button
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-md transition"
                            title="Kopyala"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Copy size={18} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleEditClick(product); }}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-100 rounded-md transition"
                            title="Düzenle"
                        >
                            <ChevronDown size={18} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(product.id); }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-md transition"
                            title="Sil"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </Reorder.Item>
    );
};

const CategoryDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [originalProducts, setOriginalProducts] = useState([]); // Backup for reorder rollback
    const [printers, setPrinters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [vatRates, setVatRates] = useState([]);
    const [newProductData, setNewProductData] = useState({
        name: '',
        price: '',
        stock: '',
        description: '',
        stockTracking: false,
        productType: 'Adetli Satış',
        packagePrice: '',
        printer: '',
        vatRate: '',
        labelPrinter: ''
    });

    const fetchPrinters = async () => {
        try {
            const { data, error } = await supabase
                .from('printers')
                .select('id, name')
                .eq('business_id', user.business_id)
                .is('is_deleted', false);
            if (error) throw error;
            setPrinters(data || []);
        } catch (error) {
            console.error("Error fetching printers:", error);
        }
    };

    const fetchVatRates = async () => {
        try {
            const { data, error } = await supabase
                .from('pos_product_types')
                .select('id, name, tax_rate')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('sort_order', { ascending: true });
            if (error) throw error;
            setVatRates(data || []);
        } catch (error) {
            console.error("Error fetching VAT rates:", error);
        }
    };

    // Initial fetch
    useEffect(() => {
        if (user && id) {
            fetchCategoryDetails();
            fetchPrinters();
            fetchVatRates();
        }
    }, [user, id]);

    const fetchCategoryDetails = async () => {
        setLoading(true);
        try {
            // Fetch category info
            const { data: catData, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('id', id)
                .single();

            if (catError) throw catError;
            setCategory(catData);

            // Fetch products in this category
            const { data: prodData, error: prodError } = await supabase
                .from('products')
                .select('*')
                .eq('category_id', id)
                .is('is_deleted', false)
                .eq('business_id', user.business_id)
                .order('sort_order', { ascending: true });

            if (prodError) throw prodError;
            setProducts(prodData || []);
            setOriginalProducts(prodData || []);

        } catch (error) {
            console.error("Error fetching category details:", error);
            // Optionally redirect back if category not found
        } finally {
            setLoading(false);
        }
    };

    const [imageFile, setImageFile] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);

    // Helper to reset form
    const resetForm = () => {
        setNewProductData({
            name: '', price: '', stock: '', description: '',
            stockTracking: false, productType: 'Adetli Satış',
            packagePrice: '', printer: '', vatRate: '', labelPrinter: ''
        });
        setImageFile(null);
        setEditingProduct(null);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
        }
    };

    const handleEditClick = (product) => {
        setEditingProduct(product);

        // Find matching VAT group ID for the numeric rate
        const matchingVat = vatRates.find(v => parseFloat(v.tax_rate) === parseFloat(product.vat_rate));

        setNewProductData({
            name: product.name,
            price: product.price,
            stock: product.stock_quantity || '',
            description: product.description || '',
            stockTracking: product.stock_tracking || false,
            productType: product.product_type || 'Adetli Satış',
            packagePrice: product.package_price || '',
            printer: product.printer_id || '',
            vatRate: matchingVat ? matchingVat.id : '', // Store ID instead of rate
            labelPrinter: product.label_printer_id || ''
        });
        setShowAddProductModal(true);
    };

    const handleDeleteClick = async (productId) => {
        if (!window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;

        try {
            const { error } = await supabase
                .from('products')
                .update({ is_deleted: true })
                .eq('id', productId);

            if (error) throw error;
            fetchCategoryDetails();
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Silme işlemi başarısız: " + error.message);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            let imageUrl = editingProduct ? editingProduct.image_url : null;

            // 1. Upload Image if exists (overwrites if new image selected)
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(filePath, imageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            // 2. Resolve numeric VAT rate from the selected Group ID
            const selectedVatGroup = vatRates.find(v => v.id === newProductData.vatRate);
            const finalVatRate = selectedVatGroup ? parseFloat(selectedVatGroup.tax_rate) : 18;

            const payload = {
                business_id: user.business_id,
                category_id: id,
                name: newProductData.name,
                price: parseFloat(newProductData.price),
                stock_quantity: newProductData.stockTracking ? (parseInt(newProductData.stock) || 0) : null,
                description: newProductData.description,
                product_type: newProductData.productType,
                package_price: parseFloat(newProductData.packagePrice) || 0,
                vat_rate: finalVatRate,
                stock_tracking: newProductData.stockTracking,
                image_url: imageUrl,
                printer_id: newProductData.printer || null,
                label_printer_id: newProductData.labelPrinter || null,
            };

            if (editingProduct) {
                // UPDATE
                const { error } = await supabase
                    .from('products')
                    .update(payload)
                    .eq('id', editingProduct.id);

                if (error) throw error;
                alert("Ürün güncellendi!");
            } else {
                // INSERT
                // Calculate next sort_order
                const maxSortOrder = products.length > 0
                    ? Math.max(...products.map(p => p.sort_order || 0))
                    : 0;

                payload.sort_order = maxSortOrder + 1;

                const { error } = await supabase
                    .from('products')
                    .insert([payload]);

                if (error) throw error;
                alert("Ürün başarıyla eklendi!");
            }

            setShowAddProductModal(false);
            resetForm();
            fetchCategoryDetails(); // Refresh list

        } catch (error) {
            console.error("Error saving product:", error);
            alert("İşlem hatası: " + error.message);
        }
    };

    const handleReorder = (newOrder) => {
        // Only update local state for smooth UI interaction
        setProducts(newOrder);
    };

    // Use useEffect to debounce the database update
    useEffect(() => {
        // Don't sync if search is active (dragging should be limited/avoided during search)
        if (searchTerm) return;

        // Don't sync if products hasn't actually changed in content/order compared to DB
        // Simple JSON stringify check for order change
        if (JSON.stringify(products.map(p => p.id)) === JSON.stringify(originalProducts.map(p => p.id))) {
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const updates = products.map((product, index) => ({
                    id: product.id,
                    sort_order: index + 1
                }));

                // Update database in background
                for (const up of updates) {
                    await supabase
                        .from('products')
                        .update({ sort_order: up.sort_order })
                        .eq('id', up.id);
                }

                // Update original backup to current state after successful sync
                setOriginalProducts([...products]);
                console.log('Product order synced to DB');
            } catch (error) {
                console.error('Error syncing order to DB:', error);
                // Optionally alert or rollback
            }
        }, 1000); // Wait 1 second after last reorder before saving

        return () => clearTimeout(timer);
    }, [products]);

    if (!category) return <div className="p-6">Kategori bulunamadı.</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800 relative">
            {/* Header / Breadcrumb / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/isletme/kategoriler')}
                        className="p-2 hover:bg-gray-200 rounded-lg transition text-gray-500"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 tracking-tight uppercase">
                            {category.name}
                        </h1>
                        <div className="text-[10px] text-gray-400 mt-1">
                            Menü Yönetimi / {category.name}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="bg-purple-100 text-purple-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-200 transition">
                        Değişiklikleri POS'a Aktar
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowAddProductModal(true); }}
                        className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-200 transition flex items-center gap-2"
                    >
                        <Plus size={16} /> Yeni Ürün
                    </button>
                    <button className="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-200 transition">
                        Arşiv
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Ürün Ara"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 shadow-sm transition"
                    />
                    <div className="absolute left-3 top-0 h-full flex items-center text-gray-400">
                        <Search size={18} />
                    </div>
                </div>
                {/* <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition flex items-center gap-2">
                    <Filter size={18} /> Filtrele
                </button> */}
            </div>

            {/* Product List */}
            <div className="space-y-2">
                {products.length > 0 ? (
                    <Reorder.Group
                        axis="y"
                        values={products}
                        onReorder={handleReorder}
                        className="space-y-2"
                    >
                        {products
                            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((product) => (
                                <ProductItem
                                    key={product.id}
                                    product={product}
                                    printers={printers}
                                    navigate={navigate}
                                    handleEditClick={handleEditClick}
                                    handleDeleteClick={handleDeleteClick}
                                    categoryId={id}
                                />
                            ))}
                    </Reorder.Group>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
                        <ShoppingBag size={48} className="mb-4 text-gray-200" />
                        <span className="mb-2 text-lg font-medium text-gray-500">Bu kategoride ürün yok.</span>
                        <span className="text-sm">"Yeni Ürün" butonundan ekleme yapabilirsiniz.</span>
                    </div>
                )}
            </div>

            {/* Add Product Modal */}
            {showAddProductModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">{editingProduct ? 'Ürün Düzenle' : 'Ürün Ekle'}</h2>
                            <button onClick={() => { setShowAddProductModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 transition">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddProduct} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Ürün adı (Türkçe)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                value={newProductData.name}
                                                onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                                                className="w-full pl-4 pr-16 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-700"
                                            />
                                            <div className="absolute right-0 top-0 h-full bg-gray-100 border-l border-gray-300 rounded-r-lg px-3 flex items-center text-gray-500 text-sm font-medium">
                                                Tr <ChevronDown size={14} className="ml-1" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Paket Servis Fiyatı</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={newProductData.packagePrice}
                                            onChange={(e) => setNewProductData({ ...newProductData, packagePrice: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-700"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Etiket Yazdır</label>
                                        <select
                                            value={newProductData.labelPrinter}
                                            onChange={(e) => setNewProductData({ ...newProductData, labelPrinter: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-700 bg-white"
                                        >
                                            <option value="">-</option>
                                            {printers.map(printer => (
                                                <option key={printer.id} value={printer.id}>{printer.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Ürün Fotoğrafı</label>
                                        <div className="flex items-center gap-3">
                                            <label className="cursor-pointer px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition">
                                                Dosya Seç
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                />
                                            </label>
                                            <span className="text-gray-500 text-sm truncate max-w-[200px]">
                                                {imageFile ? imageFile.name : "Dosya seçilmedi"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Middle Column */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Ürün Tipi</label>
                                        <select
                                            value={newProductData.productType}
                                            onChange={(e) => setNewProductData({ ...newProductData, productType: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-700 bg-white"
                                        >
                                            <option>Adetli Satış</option>
                                            <option>Kilogram Satış</option>
                                            <option>Porsiyon</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Yazıcılar</label>
                                        <select
                                            value={newProductData.printer}
                                            onChange={(e) => setNewProductData({ ...newProductData, printer: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-700 bg-white"
                                        >
                                            <option value="">Seçilmedi</option>
                                            {printers.map(printer => (
                                                <option key={printer.id} value={printer.id}>{printer.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2"><span className="text-red-500">*</span> Kategori</label>
                                        <select
                                            disabled
                                            value={category.id}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-700 bg-white disabled:bg-gray-100"
                                        >
                                            <option value={category.id}>-- {category.name}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2"><span className="text-red-500">*</span> Satış Fiyatı</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={newProductData.price}
                                            onChange={(e) => setNewProductData({ ...newProductData, price: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-700"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Ağırlıklı satışta KG fiyatını giriniz</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Ürün KDV Oranı</label>
                                        <select
                                            value={newProductData.vatRate}
                                            onChange={(e) => setNewProductData({ ...newProductData, vatRate: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-700 bg-white"
                                        >
                                            <option value="">Ürün KDV Grubu Seçiniz</option>
                                            {vatRates.map(vat => (
                                                <option key={vat.id} value={vat.id}>{vat.name} (%{vat.tax_rate})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Stock Toggle */}
                            <div className="flex items-center gap-4 mb-8">
                                <span className="text-gray-700 font-medium">Tekil Stok takibi aktif</span>
                                <button
                                    type="button"
                                    onClick={() => setNewProductData(prev => ({ ...prev, stockTracking: !prev.stockTracking }))}
                                    className={`w-14 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out ${newProductData.stockTracking ? 'bg-green-500' : 'bg-gray-200'}`}
                                >
                                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${newProductData.stockTracking ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                </button>

                                {newProductData.stockTracking && (
                                    <div className="animate-in fade-in slide-in-from-left duration-200 ml-4">
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="Stok Adedi"
                                            value={newProductData.stock}
                                            onChange={(e) => setNewProductData({ ...newProductData, stock: e.target.value })}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-700 w-32"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddProductModal(false); resetForm(); }}
                                    className="px-6 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition shadow-lg shadow-red-500/20"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-[#14b8a6] text-white rounded-lg font-medium hover:bg-[#0d9488] transition shadow-lg shadow-[#14b8a6]/20"
                                >
                                    {editingProduct ? 'Güncelle' : 'Ürün Ekle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryDetail;
