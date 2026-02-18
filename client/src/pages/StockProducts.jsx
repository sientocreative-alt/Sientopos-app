import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
    Search,
    Plus,
    Loader2,
    Trash2,
    Edit,
    ChevronDown,
    ChevronUp,
    Download,
    Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const StockProducts = () => {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({});

    // Fetch categories and their products
    useEffect(() => {
        if (user?.business_id) {
            fetchData();
        }
    }, [user?.business_id]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch categories
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('stock_categories')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('name');

            if (categoriesError) throw categoriesError;

            // Fetch products with stock info
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select(`
                    *,
                    stock_unit:default_unit_id(name, short_name),
                    stock_category:stock_category_id(name)
                `)
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .not('stock_category_id', 'is', null);

            if (productsError) throw productsError;

            // Group products by category
            const categoriesWithProducts = categoriesData.map(cat => ({
                ...cat,
                products: productsData.filter(p => p.stock_category_id === cat.id)
            }));

            // Identify products without category or with deleted category but still having valid ID (shouldn't happen with FK constraint but good to handle)
            // or just stick to categories list. 
            // The requirement implies showing categories.

            setCategories(categoriesWithProducts);

            // By default expand all if search term exists, otherwise collapse
            const initialExpanded = {};
            categoriesData.forEach(c => initialExpanded[c.id] = false);
            setExpandedCategories(initialExpanded);

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Veriler yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const filteredCategories = categories.map(cat => {
        const filteredProducts = cat.products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return {
            ...cat,
            products: filteredProducts,
            // Keep category visible if it matches search OR has matching products
            isVisible: cat.name.toLowerCase().includes(searchTerm.toLowerCase()) || filteredProducts.length > 0
        };
    }).filter(cat => cat.isVisible);

    // Auto expand on search
    useEffect(() => {
        if (searchTerm) {
            const allExpanded = {};
            filteredCategories.forEach(c => allExpanded[c.id] = true);
            setExpandedCategories(allExpanded);
        }
    }, [searchTerm]);


    const handleDelete = async (id) => {
        if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('products')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error) throw error;
            toast.success('Ürün silindi');
            fetchData();
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Silme işlemi başarısız');
        }
    };

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            Stoklu Ürünler
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span>Pano</span>
                            <span>•</span>
                            <span>Stok</span>
                            <span>•</span>
                            <span className="text-blue-600">Stoklu Ürünler</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            to="/isletme/stoklu-urunler/arsiv" // Future work
                            className="px-5 py-3 bg-orange-50 text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-100 transition-all"
                        >
                            Arşiv
                        </Link>
                        <button className="px-5 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all flex items-center gap-2">
                            <Download size={18} />
                            İndir
                        </button>
                        <Link
                            to="/isletme/stoklu-urunler/yeni"
                            className="px-5 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Yeni Stoklu Ürün
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between pointer-cursor mb-4">
                        <h3 className="font-bold text-gray-800">Filtreler</h3>
                        <ChevronUp className="text-gray-400" size={20} />
                    </div>
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Hızlı Arama..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                            />
                        </div>
                        <button className="px-8 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all flex items-center gap-2">
                            <Search size={18} />
                            Filtrele
                        </button>
                    </div>
                </div>

                {/* Categories & Products List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3 py-20">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Yükleniyor...</span>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[24px] shadow-sm border border-gray-100">
                            <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                                Kayı bulunamadı
                            </span>
                        </div>
                    ) : (
                        filteredCategories.map(category => (
                            <div key={category.id} className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                                {/* Category Header */}
                                <div
                                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => toggleCategory(category.id)}
                                >
                                    <h3 className="font-bold text-gray-800 text-lg">{category.name}</h3>
                                    {expandedCategories[category.id] ? (
                                        <ChevronUp className="text-gray-400" size={20} />
                                    ) : (
                                        <ChevronDown className="text-gray-400" size={20} />
                                    )}
                                </div>

                                {/* Products Table */}
                                {expandedCategories[category.id] && (
                                    <div className="border-t border-gray-100">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                                        <th className="px-6 py-4 text-[11px] font-black text-blue-500 uppercase tracking-tight border-r border-gray-100 w-1/5">Ürün</th>
                                                        <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-100">Ölçü Tipi</th>
                                                        <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-100">Kategori</th>
                                                        <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-100">Maliyet</th>
                                                        <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-100">Maliyet Değişimi</th>
                                                        <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-100">Varsayılan Birim</th>
                                                        <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-100">Katalog Fiyatı</th>
                                                        <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight text-center">İşlemler</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {category.products.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="8" className="px-6 py-8 text-center text-xs text-gray-400 font-medium uppercase tracking-widest">
                                                                Bu kategoride ürün bulunmuyor
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        category.products.map(product => (
                                                            <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                                                <td className="px-6 py-4 text-sm font-bold text-gray-700 border-r border-gray-50">
                                                                    {product.name}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-50">
                                                                    {/* Mocking Unit Type for now as it's on stock_units but we joined generic info. Logic: Unit Type comes from unit.type */}
                                                                    {/* Ideally we fetched stock_unit { type } */}
                                                                    Hacim
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-50">
                                                                    {category.name} ({product.stock_unit?.name})
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-50">
                                                                    {product.cost_price ? `${Number(product.cost_price).toFixed(2)} ₺` : '-'}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-50">
                                                                    -
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-50">
                                                                    {product.stock_unit?.short_name || '-'}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-50">
                                                                    {Number(product.price).toFixed(2)} ₺
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <Link
                                                                            to={`/isletme/stoklu-urunler/detay/${product.id}`}
                                                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                                        >
                                                                            <Eye size={16} />
                                                                        </Link>
                                                                        <Link
                                                                            to={`/isletme/stoklu-urunler/duzenle/${product.id}`}
                                                                            className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                        >
                                                                            <Edit size={16} />
                                                                        </Link>
                                                                        <button
                                                                            onClick={() => handleDelete(product.id)}
                                                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockProducts;
