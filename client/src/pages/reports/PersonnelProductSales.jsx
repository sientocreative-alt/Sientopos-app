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
    User,
    X,
    Package
} from 'lucide-react';

const PersonnelProductSales = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [reportData, setReportData] = useState([]);

    // Filters
    const [selectedProduct, setSelectedProduct] = useState(''); // '' = All
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0], // Default to today
        endDate: new Date().toISOString().split('T')[0]
    });

    const fetchProducts = async () => {
        try {
            const { data } = await supabase
                .from('products')
                .select('id, name')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('name');
            setProducts(data || []);
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    };

    const fetchReportData = async () => {
        if (!user?.business_id) return;
        setLoading(true);
        try {
            // 1. Build Query for Order Items
            let query = supabase
                .from('order_items')
                .select('*')
                .gte('created_at', `${dateRange.startDate}T00:00:00`)
                .lte('created_at', `${dateRange.endDate}T23:59:59`)
                .neq('status', 'cancelled')
                .neq('status', 'waste')
                .neq('status', 'returned');

            if (selectedProduct) {
                query = query.eq('product_id', selectedProduct);
            }

            const { data: items, error } = await query;
            if (error) throw error;

            // 2. Process Data
            const staffStats = {}; // { staffName: { count: 0, total: 0 } }

            items?.forEach(item => {
                // Identify Staff
                // If staff_name is empty, fallback to 'Bilinmeyen Personel'
                const staffName = item.staff_name || 'Bilinmeyen Personel';

                if (!staffStats[staffName]) {
                    staffStats[staffName] = { name: staffName, count: 0, total: 0 };
                }

                // Calculate amounts (item price + modifiers)
                const modsTotal = item.modifiers?.reduce((sum, m) => sum + (parseFloat(m.price) || 0), 0) || 0;
                const lineTotal = (parseFloat(item.price) + modsTotal) * item.quantity;

                staffStats[staffName].count += item.quantity;
                staffStats[staffName].total += lineTotal;
            });

            // Convert to array and sort by Total Sales (Revenue) desc
            const result = Object.values(staffStats).sort((a, b) => b.total - a.total);
            setReportData(result);

        } catch (err) {
            console.error('Error fetching personnel product report:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchProducts();
            fetchReportData(); // Initial fetch
        }
    }, [user]);

    const handleFilter = () => {
        fetchReportData();
    };

    const handleClearFilters = () => {
        setSelectedProduct('');
        setDateRange({
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
        });
        // Note: Logic here relies on user clicking 'Filter' again or next useEffect update if we added dependencies.
        // For consistent UX with valid "Filtrele" button, user clicks it.
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
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#5D5FEF] transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">
                            Personel Ürün Satış Sayıları
                        </h1>
                        <span className="text-sm font-bold text-gray-400">Pano • Raporlar • Personel Ürün Satış Sayıları</span>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4 cursor-pointer">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                            Filtreler
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        {/* Product Select */}
                        <div className="md:col-span-4">
                            <div className="relative">
                                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <select
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF] appearance-none"
                                    value={selectedProduct}
                                    onChange={(e) => setSelectedProduct(e.target.value)}
                                >
                                    <option value="">Tüm Ürünler</option>
                                    {products.map(prod => (
                                        <option key={prod.id} value={prod.id}>{prod.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        {/* Date Range */}
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

                        {/* Actions */}
                        <div className="md:col-span-4 flex gap-2">
                            <button
                                onClick={handleFilter}
                                className="flex-1 bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-wide"
                            >
                                <Search size={18} />
                                Filtrele
                            </button>
                            <button
                                onClick={handleClearFilters}
                                className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-wide"
                            >
                                <X size={18} />
                                Filtreyi Temizle
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Table */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest w-1/3">Personel</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center w-1/3">Seçili Ürün Satış Adedi</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right w-1/3">Toplam Satış</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="3" className="px-8 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <RefreshCw className="text-[#5D5FEF] animate-spin" size={32} />
                                                <span className="text-[11px] font-bold text-gray-400">Veriler Hesaplanıyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : reportData.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-8 py-12 text-center text-gray-400 font-bold text-sm">
                                            Kayıt bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    reportData.map((row, index) => (
                                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs">
                                                        <User size={14} />
                                                    </div>
                                                    <span className="text-sm font-black text-gray-700">{row.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-black">
                                                    {row.count} Adet
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-sm font-black text-gray-800">{formatCurrency(row.total)}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {/* Footer Totals */}
                            {reportData.length > 0 && (
                                <tfoot className="bg-gray-50/80 border-t border-gray-200">
                                    <tr>
                                        <td className="px-8 py-5 text-sm font-black text-gray-600 uppercase">GENEL TOPLAM</td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-200 text-gray-700 text-xs font-black">
                                                {reportData.reduce((sum, r) => sum + r.count, 0)} Adet
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right text-base font-black text-gray-900">
                                            {formatCurrency(reportData.reduce((sum, r) => sum + r.total, 0))}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PersonnelProductSales;
