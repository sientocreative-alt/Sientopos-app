import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    Search,
    Filter,
    Loader2,
    ChevronDown,
    ChevronUp,
    Download,
    Archive,
    Edit2,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const StockStatus = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({});
    const [currentWarehouse, setCurrentWarehouse] = useState('Ana Depo');
    const [warehouses, setWarehouses] = useState([]);

    useEffect(() => {
        if (user?.business_id) {
            fetchData();
        }
    }, [user?.business_id]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Categories
            const { data: catData } = await supabase
                .from('stock_categories')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('name');

            // 2. Fetch Products (Stock items)
            const { data: prodData } = await supabase
                .from('products')
                .select(`
                    *,
                    unit:default_unit_id(name, short_name)
                `)
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .not('stock_category_id', 'is', null);

            // 3. Fetch Stock Entries (To calculate Total In and Value)
            const { data: entriesData } = await supabase
                .from('stock_entries')
                .select('product_id, amount, buy_price')
                .eq('business_id', user.business_id)
                .is('is_deleted', false);

            // 4. Fetch Recipes and Order Items for usage
            const { data: recipesData } = await supabase
                .from('product_recipes')
                .select('product_id, ingredient_id, amount')
                .eq('business_id', user.business_id)
                .is('is_deleted', false);

            const { data: orderItemsData } = await supabase
                .from('order_items')
                .select('product_id, quantity, status')
                .eq('business_id', user.business_id)
                .in('status', ['sent', 'paid', 'gift'])
                .is('is_deleted', false);

            // Calculate Usage
            const productUsage = {}; // { ingredientId: amount }

            (orderItemsData || []).forEach(item => {
                const recipes = (recipesData || []).filter(r => r.product_id === item.product_id);
                recipes.forEach(recipe => {
                    const usageAmount = Number(item.quantity) * Number(recipe.amount);
                    productUsage[recipe.ingredient_id] = (productUsage[recipe.ingredient_id] || 0) + usageAmount;
                });
            });

            const stockCalculated = prodData.map(product => {
                const productEntries = (entriesData || []).filter(e => e.product_id === product.id);

                const totalIn = productEntries.reduce((sum, e) => sum + Number(e.amount), 0);

                // Calculate average buy price (WAC)
                const totalEntryCost = productEntries.reduce((sum, e) => sum + (Number(e.amount) * Number(e.buy_price || 0)), 0);
                const avgBuyPrice = totalIn > 0 ? totalEntryCost / totalIn : (Number(product.cost_price) || 0);

                const usage = productUsage[product.id] || 0;
                const remaining = totalIn - usage;
                const totalValue = remaining * avgBuyPrice;

                return {
                    ...product,
                    remaining,
                    totalValue: totalValue > 0 ? totalValue : 0
                };
            });

            // Group by category
            const categoriesWithProducts = (catData || []).map(cat => ({
                ...cat,
                products: stockCalculated.filter(p => p.stock_category_id === cat.id),
                categoryTotal: stockCalculated
                    .filter(p => p.stock_category_id === cat.id)
                    .reduce((sum, p) => sum + p.totalValue, 0)
            }));

            setCategories(categoriesWithProducts);

            // Default expand
            const expanded = {};
            categoriesWithProducts.forEach(c => expanded[c.id] = false);
            setExpandedCategories(expanded);

            // Fetch Warehouses
            const { data: whData } = await supabase
                .from('warehouses')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false);
            setWarehouses(whData || []);

        } catch (error) {
            console.error('Error fetching stock status:', error);
            toast.error('Veriler yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (id) => {
        setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredCategories = categories.map(cat => ({
        ...cat,
        filteredProducts: cat.products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(cat => cat.filteredProducts.length > 0 || cat.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            Stok Durumu
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span>Pano</span>
                            <span>•</span>
                            <span>Stok</span>
                            <span>•</span>
                            <span className="text-blue-600">Stok Durumu</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-4 py-2 bg-gray-50 text-gray-500 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
                            Kritik Seviyenin Altındakiler
                        </button>
                        <button className="px-4 py-2 bg-gray-50 text-gray-500 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
                            Stokları Sıfırla
                        </button>
                        <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-all">
                            Düzenleme Modu
                        </button>
                        <button className="px-4 py-2 bg-gray-50 text-gray-500 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
                            Excel'e Aktar
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6 group cursor-pointer">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                            Filtreler
                        </h3>
                        <ChevronUp size={18} className="text-gray-400" />
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-64">
                            <select
                                value={currentWarehouse}
                                onChange={(e) => setCurrentWarehouse(e.target.value)}
                                className="w-full h-[48px] px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            >
                                <option>Ana Depo</option>
                                {warehouses.map(wh => (
                                    <option key={wh.id} value={wh.name}>{wh.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Hızlı Arama..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-[48px] pl-12 pr-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                            />
                        </div>
                        <button className="h-[48px] flex items-center justify-center gap-2 px-8 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all">
                            <Search size={18} />
                            Filtrele
                        </button>
                        <button className="h-[48px] flex items-center justify-center gap-2 px-8 border border-orange-200 text-orange-500 rounded-xl font-bold text-sm hover:bg-orange-50 transition-all">
                            <Archive size={18} />
                            Arşiv
                        </button>
                    </div>
                </div>

                {/* Categories */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3 py-20">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Yükleniyor...</span>
                        </div>
                    ) : filteredCategories.map(cat => (
                        <div key={cat.id} className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                            <div
                                onClick={() => toggleCategory(cat.id)}
                                className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                            >
                                <h3 className="font-bold text-gray-800 text-lg">{cat.name}</h3>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Toplam: {cat.categoryTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                    {expandedCategories[cat.id] ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </div>
                            </div>

                            {expandedCategories[cat.id] && (
                                <div className="border-t border-gray-50">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/30">
                                                <th className="px-10 py-4 text-[11px] font-black text-blue-500 uppercase tracking-tight">Ürün</th>
                                                <th className="px-10 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight text-center">Kalan</th>
                                                <th className="px-10 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight text-right">Kalan Miktarın Tutarı</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {cat.filteredProducts.map(p => (
                                                <tr key={p.id} className="group hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-10 py-4">
                                                        <div className="font-bold text-gray-700 text-sm">{p.name}</div>
                                                    </td>
                                                    <td className="px-10 py-4 text-center">
                                                        <span className={`text-sm font-bold ${p.remaining <= (p.critical_stock_level || 0) ? 'text-red-500' : 'text-gray-600'}`}>
                                                            {p.remaining.toFixed(2)} {p.unit?.short_name}
                                                        </span>
                                                    </td>
                                                    <td className="px-10 py-4 text-right">
                                                        <span className="text-sm font-bold text-gray-600">
                                                            {p.totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StockStatus;
