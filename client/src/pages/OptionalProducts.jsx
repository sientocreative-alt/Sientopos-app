import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Archive, Trash2, Edit2, ChevronDown, ChevronRight, Save, X } from 'lucide-react';

const OptionalProducts = () => {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState({});

    // Modals
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);

    // Forms
    const [categoryForm, setCategoryForm] = useState({ name: '', order: '0' });
    const [productForm, setProductForm] = useState({
        name: '',
        category_id: '',
        price: '0',
        stock_quantity: '0',
        unit: 'Adet',
        stock_product_id: null
    });

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: cats, error: catErr } = await supabase
                .from('optional_product_categories')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_active', true) // assuming active ones only for now
                .order('order', { ascending: true });

            if (catErr) throw catErr;

            const { data: prods, error: prodErr } = await supabase
                .from('optional_products')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_active', true);

            if (prodErr) throw prodErr;

            setCategories(cats || []);
            setProducts(prods || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async () => {
        try {
            const { error } = await supabase.from('optional_product_categories').insert([{
                business_id: user.business_id,
                name: categoryForm.name,
                order: parseInt(categoryForm.order) || 0
            }]);

            if (error) throw error;
            setShowCategoryModal(false);
            setCategoryForm({ name: '', order: '0' });
            fetchData();
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    };

    const handleCreateProduct = async () => {
        try {
            const { error } = await supabase.from('optional_products').insert([{
                business_id: user.business_id,
                name: productForm.name,
                category_id: productForm.category_id,
                price: parseFloat(productForm.price) || 0,
                stock_quantity: parseInt(productForm.stock_quantity) || 0,
                unit: productForm.unit
            }]);

            if (error) throw error;
            setShowProductModal(false);
            setProductForm({ name: '', category_id: '', price: '0', stock_quantity: '0', unit: 'Adet', stock_product_id: null });
            fetchData();
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    };

    const toggleCategory = (catId) => {
        setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    return (
        <div className="p-6 min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-bold text-gray-800 text-lg mr-2">Opsiyonel Ürünler</span>
                    <span>Pano</span>
                    <span>•</span>
                    <span>POS Ayarları</span>
                    <span>•</span>
                    <span>Opsiyonel Ürünler</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="bg-blue-100 text-blue-600 hover:bg-blue-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                        Yeni Opsiyonel Ürün Kategorisi
                    </button>
                    <button
                        onClick={() => setShowProductModal(true)}
                        className="bg-blue-100 text-blue-600 hover:bg-blue-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                        Yeni Opsiyonel Ürün
                    </button>
                    <button className="bg-orange-100 text-orange-600 hover:bg-orange-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                        Arşiv
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-gray-100 min-h-[500px] p-6 shadow-sm">
                {categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <p>Henüz kategori veya ürün eklenmemiş.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {categories.map(cat => (
                            <div key={cat.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div
                                    className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => toggleCategory(cat.id)}
                                >
                                    <div className="flex items-center gap-2 font-bold text-gray-700">
                                        {expandedCategories[cat.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        {cat.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Sıra: {cat.order}
                                    </div>
                                </div>

                                {expandedCategories[cat.id] && (
                                    <div className="p-4 bg-white space-y-2">
                                        {products.filter(p => p.category_id === cat.id).length === 0 && (
                                            <p className="text-gray-400 text-sm italic">Bu kategoride ürün yok.</p>
                                        )}
                                        {products.filter(p => p.category_id === cat.id).map(prod => (
                                            <div key={prod.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                                                <div className="font-medium text-gray-800">{prod.name}</div>
                                                <div className="flex gap-4 text-sm text-gray-600">
                                                    <span>{prod.stock_quantity} {prod.unit}</span>
                                                    <span className="font-bold text-gray-900">{parseFloat(prod.price).toFixed(2)}₺</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1050] p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Opsiyonel Ürün Kategorisi Ekle</h2>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori Adı (Türkçe)</label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                        value={categoryForm.name}
                                        onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    />
                                    <span className="bg-gray-100 border border-l-0 border-gray-200 px-3 py-2 rounded-r-lg text-gray-500 text-sm">Tr</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Sıra</label>
                                <input
                                    type="number"
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                    value={categoryForm.order}
                                    onChange={e => setCategoryForm({ ...categoryForm, order: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button
                                onClick={() => setShowCategoryModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleCreateCategory}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors"
                            >
                                Opsiyonel Ürün Kategorisi Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Modal */}
            {showProductModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1050] p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Opsiyonel Ürün Ekle</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Malzeme (Türkçe)</label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                        value={productForm.name}
                                        onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                    />
                                    <span className="bg-gray-100 border border-l-0 border-gray-200 px-3 py-2 rounded-r-lg text-gray-500 text-sm">Tr</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stoklu Ürün</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                    // future: bind to actual stock items
                                    >
                                        <option>Seçilmedi</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                        value={productForm.category_id}
                                        onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}
                                    >
                                        <option value="">Seçilmedi</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ek Fiyat</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                        value={productForm.price}
                                        onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stok Miktarı</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                        value={productForm.stock_quantity}
                                        onChange={e => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Birim</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                        value={productForm.unit}
                                        onChange={e => setProductForm({ ...productForm, unit: e.target.value })}
                                    >
                                        <option value="Adet">Adet</option>
                                        <option value="Kg">Kg</option>
                                        <option value="Lt">Lt</option>
                                        <option value="Porsiyon">Porsiyon</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button
                                onClick={() => setShowProductModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleCreateProduct}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors"
                            >
                                Opsiyonel Ürün Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OptionalProducts;
