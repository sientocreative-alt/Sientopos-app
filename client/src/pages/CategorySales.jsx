import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    PieChart,
    Search,
    RefreshCw,
    FileSpreadsheet,
    Calendar,
    Filter,
    X,
    Archive,
    ChevronDown,
    LayoutGrid,
    TrendingUp,
    ShoppingBag
} from 'lucide-react';
import * as XLSX from 'xlsx';

const CategorySales = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [showArchived, setShowArchived] = useState(false);
    const [categories, setCategories] = useState([]);
    const [orderItems, setOrderItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const fetchData = async () => {
        if (!user?.business_id) return;
        setLoading(true);
        try {
            // 1. Fetch Categories
            const { data: catData, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('business_id', user.business_id);

            if (catError) throw catError;
            setCategories(catData || []);

            // 2. Fetch Order Items for the date range
            const startStr = `${dateRange.startDate}T00:00:00Z`;
            const endStr = `${dateRange.endDate}T23:59:59Z`;

            const { data: itemData, error: itemError } = await supabase
                .from('order_items')
                .select(`
                    *,
                    products (
                        category_id,
                        vat_rate,
                        is_deleted
                    )
                `)
                .eq('business_id', user.business_id)
                .gte('created_at', startStr)
                .lte('created_at', endStr)
                .is('is_deleted', false)
                .in('status', ['paid', 'sent', 'gift', 'waste']);

            if (itemError) throw itemError;
            setOrderItems(itemData || []);

        } catch (err) {
            console.error('Error fetching category sales:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, dateRange]);

    const processedOrderItems = useMemo(() => {
        // Distribute discounts across products within sessions
        const sessions = orderItems.reduce((acc, item) => {
            const sessionId = item.payment_id || `table_${item.table_id}`;
            if (!acc[sessionId]) acc[sessionId] = { products: [], discounts: [] };
            if (item.metadata?.is_discount) acc[sessionId].discounts.push(item);
            else acc[sessionId].products.push(item);
            return acc;
        }, {});

        const result = [];
        Object.values(sessions).forEach(session => {
            const totalDiscount = session.discounts.reduce((sum, d) => sum + (parseFloat(d.price) || 0), 0);
            const totalProductsGross = session.products.reduce((sum, p) => {
                const price = parseFloat(p.price) || 0;
                const modifiersTotal = p.modifiers?.reduce((mSum, m) => mSum + (parseFloat(m.price) || 0), 0) || 0;
                return sum + (price + modifiersTotal) * (p.quantity || 1);
            }, 0);

            if (totalDiscount !== 0 && totalProductsGross > 0) {
                const factor = (totalProductsGross + totalDiscount) / totalProductsGross;
                session.products.forEach(p => {
                    const price = parseFloat(p.price) || 0;
                    const modifiersTotal = p.modifiers?.reduce((mSum, m) => mSum + (parseFloat(m.price) || 0), 0) || 0;
                    result.push({
                        ...p,
                        price: (price + modifiersTotal) * factor / (p.quantity || 1),
                        modifiers: []
                    });
                });
            } else {
                result.push(...session.products);
            }
        });
        return result;
    }, [orderItems]);

    const processedData = useMemo(() => {
        // Group order items by category_id
        const itemCounts = processedOrderItems.reduce((acc, item) => {
            const catId = item.products?.category_id;
            if (catId) {
                acc[catId] = (acc[catId] || 0) + (item.quantity || 1);
            }
            return acc;
        }, {});

        // Map categories with their counts
        return categories
            .filter(cat => showArchived ? true : !cat.is_deleted)
            .map(cat => ({
                id: cat.id,
                name: cat.name,
                count: itemCounts[cat.id] || 0,
                is_deleted: cat.is_deleted
            }))
            .sort((a, b) => b.count - a.count);
    }, [categories, processedOrderItems, showArchived]);

    const categoryDetails = useMemo(() => {
        if (!selectedCategory) return null;

        const category = categories.find(c => c.id === selectedCategory);
        if (!category) return null;

        const filteredItems = processedOrderItems.filter(item => item.products?.category_id === selectedCategory);

        const productGroups = filteredItems.reduce((acc, item) => {
            const key = item.name;
            if (!acc[key]) {
                acc[key] = {
                    name: item.name,
                    count: 0,
                    vatRate: item.products?.vat_rate || 10,
                    totalPrice: 0,
                    netPrice: 0,
                    giftCount: 0,
                    wasteCount: 0,
                    is_deleted: item.products?.is_deleted || false
                };
            }

            const qty = item.quantity || 1;
            if (item.status === 'gift') {
                acc[key].giftCount += qty;
            } else if (item.status === 'waste') {
                acc[key].wasteCount += qty;
            } else {
                acc[key].count += qty;
                const price = parseFloat(item.price) || 0;
                // Modifiers are already included in the distributed price
                const modifiersTotal = item.modifiers?.reduce((sum, m) => sum + (parseFloat(m.price) || 0), 0) || 0;
                const itemTotal = (price + modifiersTotal) * qty;
                acc[key].totalPrice += itemTotal;
                acc[key].netPrice += itemTotal / (1 + (acc[key].vatRate / 100));
            }
            return acc;
        }, {});

        return {
            categoryName: category.name,
            products: Object.values(productGroups).sort((a, b) => b.count - a.count)
        };
    }, [selectedCategory, processedOrderItems, categories]);

    const clearFilters = () => {
        const today = new Date().toISOString().split('T')[0];
        setDateRange({ startDate: today, endDate: today });
        setShowArchived(false);
    };

    const exportToExcel = () => {
        const data = processedData.map(item => ({
            'Kategori': item.name,
            'Satış Adedi': item.count,
            'Durum': item.is_deleted ? 'Arşivlenmiş' : 'Aktif'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Kategori Satışları');
        XLSX.writeFile(wb, `Kategori_Satis_Raporu_${dateRange.startDate}.xlsx`);
    };

    const exportCategoryProductsToExcel = () => {
        if (!categoryDetails) return;
        const data = categoryDetails.products.map(item => ({
            'Ürün': item.name,
            'Adet': item.count,
            'KDV Oranı': `%${item.vatRate}`,
            'Fiyat': item.totalPrice.toFixed(2) + ' ₺',
            'KDV Hariç Fiyat': item.netPrice.toFixed(2) + ' ₺',
            'İkram Adedi': item.giftCount,
            'Atık Adedi': item.wasteCount
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `${categoryDetails.categoryName} Detay`);
        XLSX.writeFile(wb, `${categoryDetails.categoryName}_Detayli_Satis.xlsx`);
    };

    const formatDateRange = (str) => {
        if (!str) return '';
        const [y, m, d] = str.split('-');
        return `${d}.${m}.${y}`;
    };

    return (
        <div className="p-4 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[98%] mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            <PieChart className="text-[#5D5FEF]" size={28} />
                            Kategorilere Göre Satış Sayıları
                        </h1>
                        <nav className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span>Pano</span>
                            <span>•</span>
                            <span>Raporlar</span>
                            <span>•</span>
                            <span className="text-[#5D5FEF]">Kategorilere Göre Satış Sayıları</span>
                        </nav>
                    </div>

                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg shadow-emerald-100 active:scale-95 uppercase tracking-wider"
                    >
                        <FileSpreadsheet size={18} />
                        Excel'e Aktar
                    </button>
                </div>

                {/* Best Selling Category Card */}
                {processedData[0]?.count > 0 && (
                    <div className="bg-gradient-to-r from-[#5D5FEF] to-[#8C8DFF] p-4 rounded-2xl text-white shadow-lg shadow-indigo-100/50 flex items-center justify-between group overflow-hidden relative">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">En Çok Satan Kategori</div>
                                <div className="text-lg font-black uppercase tracking-tight leading-none mt-1">
                                    {processedData[0].name}
                                </div>
                            </div>
                        </div>
                        <div className="text-right relative z-10 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                            <div className="text-[9px] font-black opacity-60 uppercase tracking-widest mb-0.5">Toplam Satış</div>
                            <div className="text-xl font-black leading-none">{processedData[0].count.toLocaleString('tr-TR')}</div>
                        </div>
                        {/* Decorative background icon */}
                        <PieChart size={120} className="absolute -right-8 -bottom-8 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
                    </div>
                )}

                {/* Filters Card */}
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">
                            <Filter size={16} />
                            Filtreler
                        </h2>
                        <ChevronDown size={20} className="text-gray-300" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="md:col-span-2 grid grid-cols-2 gap-4">
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] font-bold text-gray-700 outline-none focus:border-[#5D5FEF]/30 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] font-bold text-gray-700 outline-none focus:border-[#5D5FEF]/30 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-3 flex flex-wrap lg:flex-nowrap gap-3">
                            <button
                                onClick={fetchData}
                                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-[#E1EFFF] text-[#5D5FEF] px-4 py-3 rounded-2xl font-black text-xs transition-all hover:bg-[#D0E5FF] uppercase tracking-wider"
                            >
                                <Search size={18} />
                                Filtrele
                            </button>
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-black text-xs transition-all uppercase tracking-wider ${showArchived ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-500 hover:bg-amber-100'}`}
                            >
                                <Archive size={18} />
                                {showArchived ? 'Arşivlenenleri Gizle' : 'Arşivlenmişleri Göster'}
                            </button>
                            <button
                                onClick={clearFilters}
                                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-red-50 text-red-500 px-4 py-3 rounded-2xl font-black text-xs transition-all hover:bg-red-100 uppercase tracking-wider"
                            >
                                <X size={18} />
                                Filtreyi Temizle
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Kategori</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">
                                        {formatDateRange(dateRange.startDate)} - {formatDateRange(dateRange.endDate)}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="2" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <RefreshCw className="text-[#5D5FEF] animate-spin" size={32} />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Veriler Analiz Ediliyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : processedData.length === 0 ? (
                                    <tr>
                                        <td colSpan="2" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <LayoutGrid className="text-gray-100" size={48} />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bu tarihlerde satış kaydı bulunamadı</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    processedData.map((item, idx) => (
                                        <tr
                                            key={item.id}
                                            onClick={() => setSelectedCategory(item.id)}
                                            className="hover:bg-indigo-50/30 cursor-pointer transition-all border-b border-gray-50 last:border-0 group"
                                        >
                                            <td className="px-8 py-5">
                                                <span className={`text-sm font-bold tracking-tight uppercase ${item.is_deleted ? 'text-gray-400 line-through' : 'text-[#5D5FEF]'}`}>
                                                    {item.name}
                                                    {item.is_deleted && <span className="ml-2 text-[9px] no-line-through bg-gray-100 px-1.5 py-0.5 rounded italic">(Arşivlendi)</span>}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-sm font-black text-gray-700 font-mono tracking-tighter">
                                                    {item.count.toLocaleString('tr-TR')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>



            </div>

            {/* Category Detail Modal */}
            {selectedCategory && categoryDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 text-left">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                                    <ShoppingBag className="text-[#5D5FEF]" size={28} />
                                    {categoryDetails.categoryName} - Satış Miktarları
                                </h2>
                                <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">
                                    {formatDateRange(dateRange.startDate)} - {formatDateRange(dateRange.endDate)} Tarihleri Arası Ürün Detayları
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={exportCategoryProductsToExcel}
                                    className="flex items-center gap-2 bg-indigo-50 text-[#5D5FEF] hover:bg-indigo-100 px-5 py-2.5 rounded-xl font-black text-xs transition-all uppercase tracking-wider"
                                >
                                    <FileSpreadsheet size={18} />
                                    Excele Aktar
                                </button>
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 rounded-xl transition-all shadow-sm active:scale-95"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8">
                            <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Ürün</th>
                                            <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Adet</th>
                                            <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">KDV Oranı</th>
                                            <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Fiyat</th>
                                            <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right text-gray-500">KDV Hariç Fiyat</th>
                                            <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center text-amber-500">İkram Adedi</th>
                                            <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center text-red-500">Atık Adedi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {categoryDetails.products.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-all group">
                                                <td className="px-6 py-4">
                                                    <span className={`text-sm font-bold ${item.is_deleted ? 'text-gray-400 line-through' : 'text-[#5D5FEF]'}`}>
                                                        {item.name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm font-black text-gray-800">{item.count}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">%{item.vatRate}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-black text-gray-800 font-mono tracking-tighter">
                                                        {item.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-bold text-gray-500 font-mono tracking-tighter">
                                                        {item.netPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-sm font-black ${item.giftCount > 0 ? 'text-amber-500' : 'text-gray-300'}`}>
                                                        {item.giftCount.toFixed(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-sm font-black ${item.wasteCount > 0 ? 'text-red-500' : 'text-gray-300'}`}>
                                                        {item.wasteCount.toFixed(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="bg-white border border-gray-200 text-gray-600 px-8 py-3 rounded-2xl font-black text-xs transition-all hover:bg-gray-50 active:scale-95 uppercase tracking-wider shadow-sm"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategorySales;
