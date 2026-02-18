import { useState, useEffect, Fragment } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    Search,
    RefreshCw,
    X,
    LayoutGrid,
    Calendar,
    ChevronDown,
    Filter,
    ShoppingBag,
    FileSpreadsheet,
    Eye,
    Tag,
    User,
    Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';

const SoldProducts = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0] + ' 09:00',
        endDate: new Date().toISOString().split('T')[0] + ' 23:59'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [items, setItems] = useState([]);
    const [tableNames, setTableNames] = useState({});

    // Fetch table names for lookup
    useEffect(() => {
        const fetchTables = async () => {
            if (!user?.business_id) return;
            const { data } = await supabase
                .from('tables')
                .select('id, name')
                .eq('business_id', user.business_id);

            if (data) {
                const nameMap = {};
                data.forEach(t => nameMap[t.id] = t.name);
                setTableNames(nameMap);
            }
        };
        fetchTables();
    }, [user]);

    const fetchSoldProducts = async () => {
        if (!user?.business_id) return;
        setLoading(true);
        try {
            // Convert Turkish-style date strings to ISO for query if necessary
            // For now, let's assume standard date inputs
            const startStr = dateRange.startDate.replace(' ', 'T') + ':00Z';
            const endStr = dateRange.endDate.replace(' ', 'T') + ':00Z';

            let query = supabase
                .from('order_items')
                .select('*')
                .eq('business_id', user.business_id)
                .gte('created_at', startStr)
                .lte('created_at', endStr)
                .is('is_deleted', false)
                .order('created_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;

            if (error) throw error;

            let filteredData = data || [];
            if (searchTerm) {
                filteredData = filteredData.filter(item =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            setItems(filteredData);
        } catch (err) {
            console.error('Error fetching sold products:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSoldProducts();
    }, [user, dateRange, statusFilter]);

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            fetchSoldProducts();
        }
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(aggregatedList.map(item => ({
            'Ürün Adı': item.name,
            'Toplam Adet': item.quantity,
            'Toplam Tutar': item.totalPrice.toFixed(2) + ' ₺'
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Satis_Ozeti');
        const dateStr = dateRange.startDate.split(' ')[0];
        XLSX.writeFile(workbook, `Satis_Ozeti_${dateStr}.xlsx`);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid':
                return <span className="px-2 py-1 bg-green-100 text-green-600 text-[10px] font-black rounded-lg uppercase">Ödendi</span>;
            case 'gift':
                return <span className="px-2 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded-lg uppercase">İkram</span>;
            case 'waste':
                return <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded-lg uppercase">Atık</span>;
            case 'cancelled':
                return <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-black rounded-lg uppercase">İptal</span>;
            default:
                return <span className="px-2 py-1 bg-blue-100 text-blue-600 text-[10px] font-black rounded-lg uppercase">{status}</span>;
        }
    };

    // 1. Distribute discounts across products within sessions before aggregation
    const sessions = items.reduce((acc, item) => {
        const sessionId = item.payment_id || `table_${item.table_id}`;
        if (!acc[sessionId]) acc[sessionId] = { products: [], discounts: [] };
        if (item.metadata?.is_discount) acc[sessionId].discounts.push(item);
        else acc[sessionId].products.push(item);
        return acc;
    }, {});

    const itemsWithDistributedDiscounts = [];
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
                itemsWithDistributedDiscounts.push({
                    ...p,
                    price: (price + modifiersTotal) * factor / (p.quantity || 1),
                    modifiers: []
                });
            });
        } else {
            itemsWithDistributedDiscounts.push(...session.products);
        }
    });

    // 2. Aggregate items by name for display
    const aggregatedItems = itemsWithDistributedDiscounts.reduce((acc, item) => {
        const key = item.name;
        if (!acc[key]) {
            acc[key] = {
                name: item.name,
                quantity: 0,
                totalPrice: 0,
                modifiers: []
            };
        }
        acc[key].quantity += item.quantity || 1;
        const itemPrice = parseFloat(item.price) || 0;
        acc[key].totalPrice += itemPrice * (item.quantity || 1);
        return acc;
    }, {});

    const aggregatedList = Object.values(aggregatedItems).sort((a, b) => b.quantity - a.quantity);

    return (
        <div className="p-4 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[98%] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            <ShoppingBag className="text-[#5D5FEF]" size={28} />
                            Satılan Ürünler
                            <span className="ml-2 px-3 py-1 bg-[#5D5FEF]/10 text-[#5D5FEF] text-sm rounded-full font-black">
                                {aggregatedList.length}
                            </span>
                        </h1>
                        <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            Ürün Bazlı Toplam Satış Raporu
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportToExcel}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg shadow-emerald-100 active:scale-95 uppercase tracking-wider"
                        >
                            <FileSpreadsheet size={18} />
                            Excel'e Aktar
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Ürün Adı..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearch}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]/30 focus:bg-white transition-all"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]/30 focus:bg-white transition-all appearance-none"
                            >
                                <option value="all">Tüm Durumlar</option>
                                <option value="paid">Ödendi</option>
                                <option value="gift">İkram</option>
                                <option value="waste">Atık</option>
                                <option value="cancelled">İptal / Silindi</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>

                        {/* Start Date */}
                        <div className="relative">
                            <input
                                type="date"
                                value={dateRange.startDate.split(' ')[0]}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value + ' 00:00' }))}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]/30 focus:bg-white transition-all"
                            />
                        </div>

                        {/* End Date */}
                        <div className="relative">
                            <input
                                type="date"
                                value={dateRange.endDate.split(' ')[0]}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value + ' 23:59' }))}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]/30 focus:bg-white transition-all"
                            />
                        </div>

                        {/* Search Button */}
                        <button
                            onClick={fetchSoldProducts}
                            className="bg-[#5D5FEF] hover:bg-[#4B4DDF] text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2 py-3"
                        >
                            <RefreshCw className={loading ? 'animate-spin' : ''} size={18} />
                            Yenile
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Ürün Adı</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Toplam Adet</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Toplam Tutar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="3" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <RefreshCw className="text-[#5D5FEF] animate-spin" size={32} />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Veriler Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : aggregatedList.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Search className="text-gray-200" size={48} />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kriterlere uygun ürün bulunamadı</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    aggregatedList.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-gray-800">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="text-sm font-black text-gray-800">{item.quantity} Adet</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-sm font-black text-indigo-600">
                                                    {item.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
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
        </div>
    );
};

export default SoldProducts;
