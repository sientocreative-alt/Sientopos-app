import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    Search,
    RefreshCw,
    Filter,
    Package,
    Eye,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

const StockConsumption = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [consumptionData, setConsumptionData] = useState([]);
    const [totalCost, setTotalCost] = useState(0);
    const [stockCategories, setStockCategories] = useState([]);

    // Filter State
    const [selectedProduct, setSelectedProduct] = useState('');
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const [expandedCategories, setExpandedCategories] = useState({});

    const toggleCategory = (catId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [catId]: !prev[catId]
        }));
    };

    const fetchData = async () => {
        if (!user?.business_id) return;
        setLoading(true);
        try {
            // 1. Fetch Stock Categories for Grouping
            const { data: categories } = await supabase
                .from('stock_categories')
                .select('id, name')
                .eq('business_id', user.business_id)
                .is('is_deleted', false);

            setStockCategories(categories || []);
            // Initialize all expanded
            const initialExpanded = {};
            categories?.forEach(c => initialExpanded[c.id] = true);
            setExpandedCategories(initialExpanded);

            // 2. Fetch All Recipes (Active)
            const { data: recipes } = await supabase
                .from('product_recipes')
                .select('product_id, ingredient_id, amount, unit_id')
                .eq('business_id', user.business_id)
                .is('is_deleted', false);

            // 3. Fetch Sold Items (Order Items)
            const { data: soldItems } = await supabase
                .from('order_items')
                .select('product_id, quantity')
                .gte('created_at', `${dateRange.startDate}T00:00:00`)
                .lte('created_at', `${dateRange.endDate}T23:59:59`)
                .neq('status', 'cancelled')
                .neq('status', 'returned');

            // 4. Fetch Stock Products (Ingredients) info including Cost
            // We need products that act as ingredients (stock products)
            const { data: ingredients } = await supabase
                .from('products')
                .select('id, name, cost_price, stock_category_id, default_unit_id, unit:default_unit_id(short_name)')
                .eq('business_id', user.business_id);

            const ingredientMap = {};
            ingredients?.forEach(i => ingredientMap[i.id] = i);

            // 5. Calculate Consumption
            const consumptionMap = {}; // { ingredientId: { amount: 0, cost: 0, ...info } }

            soldItems?.forEach(item => {
                // Find recipes for this product
                const productRecipes = recipes?.filter(r => r.product_id === item.product_id);

                productRecipes?.forEach(recipe => {
                    const ingredientId = recipe.ingredient_id;
                    const amountConsumed = recipe.amount * item.quantity;
                    const ingredientInfo = ingredientMap[ingredientId];

                    if (ingredientInfo) {
                        if (!consumptionMap[ingredientId]) {
                            consumptionMap[ingredientId] = {
                                ...ingredientInfo,
                                consumedAmount: 0,
                                totalCost: 0
                            };
                        }
                        consumptionMap[ingredientId].consumedAmount += amountConsumed;
                        // Cost calculation: Cost Price * Amount? 
                        // Usually cost_price is per Unit. 
                        // Assuming cost_price in products table is per default_unit.
                        consumptionMap[ingredientId].totalCost += (ingredientInfo.cost_price || 0) * amountConsumed;
                    }
                });
            });

            // 6. Group by Category
            const groupedData = {};
            // Initialize groups
            categories?.forEach(c => groupedData[c.id] = { name: c.name, items: [] });
            // Add 'Uncategorized' if needed, but let's stick to defined categories
            groupedData['uncategorized'] = { name: 'Diğer', items: [] };

            Object.values(consumptionMap).forEach(item => {
                const catId = item.stock_category_id || 'uncategorized';
                if (!groupedData[catId]) groupedData[catId] = { name: 'Diğer', items: [] };
                groupedData[catId].items.push(item);
            });

            // Filter out empty groups
            const result = Object.entries(groupedData)
                .filter(([_, group]) => group.items.length > 0)
                .map(([id, group]) => ({
                    id,
                    name: group.name,
                    items: group.items
                }));

            setConsumptionData(result);

            // Calculate Grand Total Cost
            const total = Object.values(consumptionMap).reduce((sum, item) => sum + item.totalCost, 0);
            setTotalCost(total);

        } catch (err) {
            console.error('Error fetching stock consumption:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const handleFilter = () => {
        fetchData();
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
    };

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/isletme/raporlar')}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#5D5FEF] transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">
                            Stok Tüketimi
                        </h1>
                        <span className="text-sm font-bold text-gray-400">Pano • Raporlar • Stok Tüketimi</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                            Filtreler
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-4">
                            <div className="relative">
                                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Ürün Ara..."
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]"
                                    // Implementation of client-side filtering logic could be added here if needed
                                    // For now just visual per layout, or simple name filter
                                    onChange={(e) => setSelectedProduct(e.target.value)}
                                    value={selectedProduct}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-4 flex gap-2">
                            <div className="flex items-center gap-2 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                                <Calendar className="text-gray-400 min-w-[18px]" size={18} />
                                <input
                                    type="date"
                                    className="bg-transparent text-sm font-bold text-gray-700 outline-none w-full"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                />
                                <span className="text-gray-400 font-bold">-</span>
                                <input
                                    type="date"
                                    className="bg-transparent text-sm font-bold text-gray-700 outline-none w-full"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-4">
                            <button
                                onClick={handleFilter}
                                className="w-full bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-wide"
                            >
                                <Search size={18} />
                                Filtrele
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-red-50 text-red-500 rounded-2xl">
                        {/* Icon representing Cost/Consumption */}
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Toplam Tüketim Maliyeti</p>
                        <h2 className="text-2xl font-black text-gray-800 mt-1">{formatCurrency(totalCost)}</h2>
                    </div>
                </div>

                {/* Consumption List */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-12">
                            <RefreshCw className="text-[#5D5FEF] animate-spin mb-4" size={40} />
                            <span className="text-gray-500 font-bold">Veriler Hesaplanıyor...</span>
                        </div>
                    ) : consumptionData.length === 0 ? (
                        <div className="text-center p-12 bg-white rounded-[24px] border border-gray-100 text-gray-400 font-bold">
                            Kayıt bulunamadı.
                        </div>
                    ) : (
                        consumptionData.map(group => (
                            <div key={group.id} className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                                <button
                                    onClick={() => toggleCategory(group.id)}
                                    className="w-full px-8 py-5 bg-blue-50/30 flex items-center justify-between hover:bg-blue-50/50 transition-colors"
                                >
                                    <h3 className="text-sm font-black text-blue-800 uppercase tracking-wide flex items-center gap-2">
                                        {group.name}
                                        <span className="text-blue-400 bg-white px-2 py-0.5 rounded-lg text-xs">
                                            {formatCurrency(group.items.reduce((s, i) => s + i.totalCost, 0))}
                                        </span>
                                    </h3>
                                    {expandedCategories[group.id] ? <ChevronUp size={20} className="text-blue-400" /> : <ChevronDown size={20} className="text-blue-400" />}
                                </button>

                                {expandedCategories[group.id] && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-gray-50">
                                                    <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Ürün</th>
                                                    <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Tüketim Tutarı</th>
                                                    <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Maliyet</th>
                                                    <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {group.items
                                                    .filter(item => !selectedProduct || item.name.toLowerCase().includes(selectedProduct.toLowerCase()))
                                                    .map(item => (
                                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-8 py-5">
                                                                <span className="text-sm font-black text-gray-700">{item.name}</span>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <span className="text-sm font-bold text-gray-600">
                                                                    {Number(item.consumedAmount).toFixed(2)} {item.unit?.short_name}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <span className="text-sm font-black text-gray-800">{formatCurrency(item.totalCost)}</span>
                                                            </td>
                                                            <td className="px-8 py-5 text-center">
                                                                <button
                                                                    onClick={() => navigate(`/isletme/raporlar/stok/tuketim/${item.id}`)}
                                                                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-400 flex items-center justify-center transition-all mx-auto"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
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

export default StockConsumption;
