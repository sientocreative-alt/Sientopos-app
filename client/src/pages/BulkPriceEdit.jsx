import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { ChevronLeft, Search, Check, Save, AlertCircle, ChevronDown } from 'lucide-react';

const BulkPriceEdit = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showActions, setShowActions] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [vatRates, setVatRates] = useState([]);

    // Keep track of local changes before saving
    // keys will be product IDs, values will be { price: number, vatRate: number }
    const [edits, setEdits] = useState({});

    useEffect(() => {
        if (user && user.business_id) {
            fetchData();
            fetchVatRates();
        }
    }, [user]);

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

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all categories
            const { data: catData, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('business_id', user.business_id)
                .order('id', { ascending: true });

            if (catError) throw catError;

            // Fetch all products
            const { data: prodData, error: prodError } = await supabase
                .from('products')
                .select('*')
                .eq('business_id', user.business_id)
                .order('id', { ascending: true });

            if (prodError) throw prodError;

            setCategories(catData || []);
            setProducts(prodData || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Veri yüklenirken hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handlePriceChange = (productId, newPrice) => {
        setEdits(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                price: newPrice
            }
        }));
    };

    const handleVatChange = (productId, newVat) => {
        setEdits(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                vat: newVat
            }
        }));
    };

    const handleSaveProduct = async (product) => {
        const changes = edits[product.id];
        if (!changes) return; // No changes to save

        try {
            const payload = {};
            if (changes.price !== undefined) payload.price = parseFloat(changes.price);
            if (changes.vat !== undefined) {
                // changes.vat is the UUID of the VAT group
                const selectedVat = vatRates.find(v => v.id === changes.vat);
                if (selectedVat) {
                    payload.vat_rate = parseFloat(selectedVat.tax_rate);
                }
            }

            const { error } = await supabase
                .from('products')
                .update(payload)
                .eq('id', product.id);

            if (error) throw error;

            // Update local state to reflect saved data
            setProducts(prev => prev.map(p =>
                p.id === product.id ? { ...p, ...payload } : p
            ));

            // Clear edits for this product
            setEdits(prev => {
                const newEdits = { ...prev };
                delete newEdits[product.id];
                return newEdits;
            });

            alert("Ürün güncellendi!");

        } catch (error) {
            console.error("Error updating product:", error);
            alert("Güncelleme başarısız: " + error.message);
        }
    };

    const handleBulkCategoryVatUpdate = async (categoryId, vatGroupId) => {
        const selectedVat = vatRates.find(v => v.id === vatGroupId);
        if (!selectedVat) return;

        if (!window.confirm(`Bu kategorideki tüm ürünlerin KDV oranını ${selectedVat.name} (%${selectedVat.tax_rate}) olarak güncellemek istiyor musunuz?`)) return;

        try {
            const { error } = await supabase
                .from('products')
                .update({ vat_rate: parseFloat(selectedVat.tax_rate) })
                .eq('category_id', categoryId)
                .eq('business_id', user.business_id);

            if (error) throw error;

            alert("Kategori KDV oranları güncellendi!");
            fetchData(); // Refresh all data

        } catch (error) {
            console.error("Error bulk updating VAT:", error);
            alert("İşlem başarısız: " + error.message);
        }
    };

    // Group products by category
    // This assumes specific structure. We want a flat list style visually but grouped data.
    // Let's create a list of { category, products: [] }
    const groupedData = categories.map(cat => ({
        category: cat,
        products: products.filter(p => p.category_id === cat.id)
    })).filter(group => group.products.length > 0 || searchTerm === ''); // Show all or filter empty? Let's show all for now if no search

    // Filter logic
    const filteredGroups = groupedData.filter(group => {
        // Category Filter
        if (selectedCategory && group.category.id != selectedCategory) return false;

        // Search Filter (checks category name OR product name)
        const searchLower = searchTerm.toLowerCase();
        const matchesCategory = group.category.name.toLowerCase().includes(searchLower);
        const hasMatchingProducts = group.products.some(p => p.name.toLowerCase().includes(searchLower));

        return matchesCategory || hasMatchingProducts;
    }).map(group => ({
        category: group.category,
        products: group.products.filter(p =>
            searchTerm === '' ||
            group.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(group => group.products.length > 0);


    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/isletme/kategoriler')}
                        className="p-2 hover:bg-gray-200 rounded-lg transition text-gray-500"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                            Toplu Fiyat Düzenleme
                        </h1>
                        <div className="text-xs text-gray-400 mt-1">
                            Menü Yönetimi / Toplu Fiyat Düzenleme
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-200 transition">
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
                                <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-50 last:border-0">
                                    Değişiklikleri POS'a Aktar
                                </button>
                                <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition">
                                    Excele Aktar
                                </button>
                            </div>
                        )}
                    </div>

                    <button className="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-200 transition">
                        Arşiv
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Ürün veya Kategori Ara"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 shadow-sm transition"
                    />
                    <div className="absolute left-3 top-0 h-full flex items-center text-gray-400">
                        <Search size={18} />
                    </div>
                </div>

                <div className="w-64">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 shadow-sm transition appearance-none"
                        style={{ backgroundImage: 'none' }}
                    >
                        <option value="">Tüm Kategoriler</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-white border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider items-center">
                    <div className="col-span-4 pl-4">Kategori / Ürün</div>
                    <div className="col-span-2 text-right">Mevcut Fiyat</div>
                    <div className="col-span-2 text-center">KDV Oranı</div>
                    <div className="col-span-3">Yeni Satış Fiyatı</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="divide-y divide-gray-100">
                    {filteredGroups.map(group => (
                        <div key={group.category.id} className="bg-white">
                            {/* Category Header Row */}
                            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50/50 items-center">
                                <div className="col-span-6 pl-4 font-bold text-gray-800 text-sm">
                                    {group.category.name}
                                </div>
                                <div className="col-span-6 flex items-center justify-end gap-2">
                                    <select
                                        className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-500"
                                        onChange={(e) => {
                                            if (e.target.value) handleBulkCategoryVatUpdate(group.category.id, e.target.value);
                                            e.target.value = ""; // Reset
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>KDV Seç</option>
                                        {vatRates.map(v => (
                                            <option key={v.id} value={v.id}>{v.name} (%{v.tax_rate})</option>
                                        ))}
                                    </select>
                                    <button className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded transition">
                                        Tüm Kategorinin KDV'sini Güncelle
                                    </button>
                                </div>
                            </div>

                            {/* Products List */}
                            {group.products.map(product => {
                                const pendingPrice = edits[product.id]?.price;
                                const pendingVat = edits[product.id]?.vat;
                                const hasChanges = pendingPrice !== undefined || pendingVat !== undefined;

                                return (
                                    <div key={product.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition border-t border-gray-100 last:border-0 border-dashed">
                                        <div className="col-span-4 pl-8 text-sm font-medium text-gray-700">
                                            {product.name}
                                        </div>
                                        <div className="col-span-2 text-right text-sm font-bold text-gray-900">
                                            {parseFloat(product.price).toFixed(2)} ₺
                                        </div>
                                        <div className="col-span-2 flex justify-center">
                                            <select
                                                className="border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-500 w-24 text-center"
                                                value={pendingVat !== undefined ? pendingVat : (vatRates.find(v => parseFloat(v.tax_rate) === parseFloat(product.vat_rate))?.id || '')}
                                                onChange={(e) => handleVatChange(product.id, e.target.value)}
                                            >
                                                <option value="">-</option>
                                                {vatRates.map(v => {
                                                    // For display, we might still want to match the numeric rate if no ID is stored
                                                    // But we'll use ID as the effective value in the select
                                                    return <option key={v.id} value={v.id}>{v.name} (%{v.tax_rate})</option>;
                                                })}
                                            </select>
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="Yeni Fiyat"
                                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
                                                value={pendingPrice !== undefined ? pendingPrice : ''}
                                                onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-1 text-right">
                                            {hasChanges && (
                                                <button
                                                    onClick={() => handleSaveProduct(product)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition"
                                                    title="Kaydet"
                                                >
                                                    <Save size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {filteredGroups.length === 0 && (
                        <div className="p-8 text-center text-gray-400">
                            Aradığınız kriterlere uygun ürün bulunamadı.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkPriceEdit;
