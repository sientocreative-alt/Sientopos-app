import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Link, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Loader2,
    Trash2,
    X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const StockProductDetail = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    // Ingredients State
    const [ingredients, setIngredients] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);

    // Dependencies
    const [categories, setCategories] = useState([]); // Categories for filtering
    const [stockProducts, setStockProducts] = useState([]); // All potential ingredients
    const [units, setUnits] = useState([]);

    // Modal Form State
    const [selectedCategory, setSelectedCategory] = useState(''); // Filter state
    const [newIngredient, setNewIngredient] = useState({
        ingredient_id: '',
        amount: '',
        unit_id: ''
    });

    useEffect(() => {
        if (user?.business_id && id) {
            fetchProduct();
            fetchIngredients();
        }
    }, [user?.business_id, id]);

    useEffect(() => {
        if (showAddModal) {
            fetchDependencies();
        }
    }, [showAddModal]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    stock_unit:default_unit_id(name, short_name),
                    stock_category:stock_category_id(name)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setProduct(data);
        } catch (error) {
            console.error('Error fetching product detail:', error);
            toast.error('Ürün detayları yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const fetchIngredients = async () => {
        try {
            const { data, error } = await supabase
                .from('product_recipes')
                .select(`
                    *,
                    ingredient:ingredient_id(name),
                    unit:unit_id(short_name)
                `)
                .eq('product_id', id)
                .is('is_deleted', false);

            if (error) throw error;
            setIngredients(data || []);
        } catch (error) {
            console.error('Error fetching ingredients:', error);
        }
    };

    const fetchDependencies = async () => {
        try {
            // Fetch Categories
            const { data: catData, error: catError } = await supabase
                .from('stock_categories')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('name');

            if (catError) throw catError;
            setCategories(catData || []);

            // Fetch potential ingredients (all active products)
            // We fetch ALL products, then filter by category in UI
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('id, name, stock_category_id, default_unit_id')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .neq('id', id) // Cannot contain itself
                .order('name');

            if (productsError) throw productsError;
            setStockProducts(productsData || []);

            // Fetch Units
            const { data: unitsData, error: unitsError } = await supabase
                .from('stock_units')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('name');

            if (unitsError) throw unitsError;
            setUnits(unitsData || []);

        } catch (error) {
            console.error('Error fetching dependencies:', error);
        }
    };

    const handleAddIngredient = async () => {
        if (!newIngredient.ingredient_id || !newIngredient.amount || !newIngredient.unit_id) {
            toast.error('Lütfen tüm alanları doldurunuz');
            return;
        }

        try {
            const { error } = await supabase
                .from('product_recipes')
                .insert([{
                    business_id: user.business_id,
                    product_id: id,
                    ingredient_id: newIngredient.ingredient_id,
                    amount: newIngredient.amount,
                    unit_id: newIngredient.unit_id
                }]);

            if (error) throw error;

            toast.success('Ham madde eklendi');
            setShowAddModal(false);
            setNewIngredient({ ingredient_id: '', amount: '', unit_id: '' });
            setSelectedCategory(''); // Reset category filter
            fetchIngredients();
        } catch (error) {
            console.error('Error adding ingredient:', error);
            toast.error('Ekleme başarısız: ' + error.message);
        }
    };

    const handleDeleteIngredient = async (recipeId) => {
        if (!window.confirm('Bu ham maddeyi silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('product_recipes')
                .update({ is_deleted: true })
                .eq('id', recipeId);

            if (error) throw error;
            toast.success('Ham madde silindi');
            fetchIngredients();
        } catch (error) {
            console.error('Error deleting ingredient:', error);
            toast.error('Silme başarısız');
        }
    };

    // Filter products based on selected category
    const filteredProducts = selectedCategory
        ? stockProducts.filter(p => p.stock_category_id === selectedCategory)
        : stockProducts;

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-8 text-center">
                <p>Ürün bulunamadı.</p>
                <Link to="/isletme/stoklu-urunler" className="text-blue-600 hover:align-baseline">Geri Dön</Link>
            </div>
        );
    }

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/isletme/stoklu-urunler"
                            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft size={20} className="text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                                {product.name}
                            </h1>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                                <span>Pano</span>
                                <span>•</span>
                                <span>Stok</span>
                                <span>•</span>
                                <span>Stoklu Ürünler</span>
                                <span>•</span>
                                <span className="text-blue-600">{product.name}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            to={`/isletme/stoklu-urunler/duzenle/${product.id}`}
                            className="px-5 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all"
                        >
                            Ürün Düzenle
                        </Link>
                    </div>
                </div>

                {/* 3 Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Column 1: Product Info */}
                    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center gap-6">
                        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">
                            {product.name}
                        </h2>

                        <div className="w-full flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                                </div>
                                <span className="font-bold text-gray-600">Satış Fiyatı</span>
                            </div>
                            <span className="text-xl font-black text-blue-600">{Number(product.price).toFixed(2)} ₺</span>
                        </div>

                        <div className="w-full flex items-center justify-between p-4 bg-red-50/50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                    <Trash2 size={24} />
                                </div>
                                <span className="font-bold text-gray-600">Maliyet</span>
                            </div>
                            <span className="text-xl font-black text-red-600">
                                {Number(product.cost_price || 0).toFixed(2)} ₺
                            </span>
                        </div>
                    </div>

                    {/* Column 2: Ingredients (HAM MADDELER) */}
                    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 relative">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-lg font-black text-gray-800">HAM MADDELER</h2>
                                <p className="text-xs text-gray-400 font-medium mt-1">(Satışta stoktan düşecek ürünler)</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="w-10 h-10 bg-teal-500 hover:bg-teal-600 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-teal-200"
                            >
                                <Plus size={24} />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                                        <th className="pb-3">Ürün</th>
                                        <th className="pb-3 text-right">Miktar</th>
                                        <th className="pb-3 w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {ingredients.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="py-8 text-center text-xs text-gray-300 font-bold uppercase tracking-widest">
                                                Herhangi bir ham madde eklenmemiş
                                            </td>
                                        </tr>
                                    ) : (
                                        ingredients.map(ing => (
                                            <tr key={ing.id} className="group">
                                                <td className="py-4 text-sm font-bold text-gray-700">
                                                    {ing.ingredient?.name}
                                                </td>
                                                <td className="py-4 text-sm font-bold text-gray-600 text-right">
                                                    {Number(ing.amount)} {ing.unit?.short_name}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteIngredient(ing.id)}
                                                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Column 3: Options (OPSİYONLAR) - Placeholder */}
                    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-lg font-black text-gray-800">OPSİYONLAR</h2>
                                <p className="text-xs text-gray-400 font-medium mt-1">Ürün Opsiyonları</p>
                            </div>
                            <button className="w-10 h-10 bg-teal-500 hover:bg-teal-600 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-teal-200">
                                <Plus size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="text-center py-6 text-gray-400 font-medium text-sm">
                                Bu özellik yapım aşamasındadır.
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Add Ingredient Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">Ham Madde Ekle</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">

                            {/* Category Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 block">
                                    Kategori (Filtrele)
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        setNewIngredient({ ...newIngredient, ingredient_id: '' }); // Reset product selection
                                    }}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                                >
                                    <option value="">Tüm Kategoriler</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Ingredient Select */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 block">
                                    * Stoklu Ürün
                                </label>
                                <select
                                    value={newIngredient.ingredient_id}
                                    onChange={(e) => {
                                        const selected = stockProducts.find(p => p.id === e.target.value);
                                        setNewIngredient({
                                            ...newIngredient,
                                            ingredient_id: e.target.value,
                                            unit_id: selected?.default_unit_id || '' // Auto-select default unit
                                        });
                                    }}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                                >
                                    <option value="">
                                        {filteredProducts.length === 0 ? 'Bu kategoride ürün yok' : 'Ürün Seçiniz'}
                                    </option>
                                    {filteredProducts.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Amount */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 block">
                                        * Miktar
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={newIngredient.amount}
                                        onChange={(e) => setNewIngredient({ ...newIngredient, amount: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                                    />
                                </div>

                                {/* Unit */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 block">
                                        * Birim
                                    </label>
                                    <select
                                        value={newIngredient.unit_id}
                                        onChange={(e) => setNewIngredient({ ...newIngredient, unit_id: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                                    >
                                        <option value="">Seçilmedi</option>
                                        {units.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-[24px]">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-6 py-3 bg-red-400 text-white rounded-xl font-bold text-sm hover:bg-red-500 transition-all"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleAddIngredient}
                                className="px-6 py-3 bg-teal-500 text-white rounded-xl font-bold text-sm hover:bg-teal-600 transition-all shadow-lg shadow-teal-200"
                            >
                                Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockProductDetail;
