import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    ShoppingBag,
    Search,
    RefreshCw,
    FileSpreadsheet,
    Calendar,
    Filter,
    Users,
    ChevronDown,
    Package,
    Monitor,
    TrendingUp,
    Percent,
    Trash2,
    Gift
} from 'lucide-react';
import * as XLSX from 'xlsx';

const SalesCounts = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('pos'); // 'pos' or 'package'
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [staffFilter, setStaffFilter] = useState('all');
    const [rawItems, setRawItems] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [tables, setTables] = useState([]);

    // Fetch initial data: Staff and Tables
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user?.business_id) return;

            // Fetch Staff
            const { data: staffData } = await supabase
                .from('staff')
                .select('id, first_name, last_name')
                .eq('business_id', user.business_id)
                .eq('is_archived', false);

            setStaffList(staffData || []);

            // Fetch Tables to distinguish POS/Package
            const { data: tableData } = await supabase
                .from('tables')
                .select('id, name')
                .eq('business_id', user.business_id);
            if (tableData) setTables(tableData);
        };
        fetchInitialData();
    }, [user]);

    const fetchData = async () => {
        if (!user?.business_id) return;
        setLoading(true);
        try {
            const startStr = `${dateRange.startDate}T00:00:00Z`;
            const endStr = `${dateRange.endDate}T23:59:59Z`;

            let query = supabase
                .from('order_items')
                .select(`
                    *,
                    products (
                        vat_rate,
                        package_price
                    )
                `)
                .eq('business_id', user.business_id)
                .gte('created_at', startStr)
                .lte('created_at', endStr)
                .is('is_deleted', false);

            if (staffFilter !== 'all') {
                query = query.eq('staff_name', staffFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setRawItems(data || []);
        } catch (err) {
            console.error('Error fetching sales counts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, dateRange, staffFilter]);

    // Transformation Logic
    const processedData = useMemo(() => {
        // Find "Paket" or "Takeaway" table IDs
        const packageTableIds = tables
            .filter(t => t.name.toLowerCase().includes('paket') || t.name.toLowerCase().includes('takeaway'))
            .map(t => t.id);

        const filtered = rawItems.filter(item => {
            const isPackage = packageTableIds.includes(item.table_id);
            if (activeTab === 'package') return isPackage;
            return !isPackage;
        });

        // 1. Distribute discounts across products within the same session (payment_id or table_id)
        const sessions = filtered.reduce((acc, item) => {
            // Group by payment_id if available, otherwise table_id
            // Note: Grouping by table_id is an approximation for unpaid items
            const sessionId = item.payment_id || `table_${item.table_id}`;
            if (!acc[sessionId]) acc[sessionId] = { products: [], discounts: [] };

            if (item.metadata?.is_discount) {
                acc[sessionId].discounts.push(item);
            } else {
                acc[sessionId].products.push(item);
            }
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
                // Ratio of net price over gross price
                const discountFactor = (totalProductsGross + totalDiscount) / totalProductsGross;
                session.products.forEach(p => {
                    const price = parseFloat(p.price) || 0;
                    const modifiersTotal = p.modifiers?.reduce((mSum, m) => mSum + (parseFloat(m.price) || 0), 0) || 0;
                    // Distribute factor proportionally
                    const unitPriceGross = price + modifiersTotal;
                    const unitPriceDiscounted = unitPriceGross * discountFactor;

                    itemsWithDistributedDiscounts.push({
                        ...p,
                        price: unitPriceDiscounted,
                        modifiers: [] // Already accounted for in price
                    });
                });
            } else {
                itemsWithDistributedDiscounts.push(...session.products);
            }
        });

        // Group by product name
        const groups = itemsWithDistributedDiscounts.reduce((acc, item) => {
            const key = item.name;
            if (!acc[key]) {
                acc[key] = {
                    name: item.name,
                    count: 0,
                    vatRate: item.products?.vat_rate || 18,
                    totalPrice: 0,
                    netPrice: 0,
                    giftCount: 0,
                    wasteCount: 0
                };
            }

            const baseQuantity = item.quantity || 1;

            if (item.status === 'gift') {
                acc[key].giftCount += baseQuantity;
            } else if (item.status === 'waste') {
                acc[key].wasteCount += baseQuantity;
            } else if (item.status === 'paid' || item.status === 'sent') {
                acc[key].count += baseQuantity;
                const price = parseFloat(item.price) || 0;
                const modifiersTotal = item.modifiers?.reduce((sum, m) => sum + (parseFloat(m.price) || 0), 0) || 0;
                const itemTotal = (price + modifiersTotal) * baseQuantity;

                acc[key].totalPrice += itemTotal;
                // Net = Total / (1 + VAT/100)
                acc[key].netPrice += itemTotal / (1 + (acc[key].vatRate / 100));
            }

            return acc;
        }, {});

        let list = Object.values(groups);
        if (searchTerm) {
            list = list.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return list.sort((a, b) => b.count - a.count);
    }, [rawItems, activeTab, tables, searchTerm]);

    const summary = useMemo(() => {
        // Collect total discounts separately for the header cards
        const totalDiscounts = rawItems
            .filter(item => {
                const packageTableIds = tables
                    .filter(t => t.name.toLowerCase().includes('paket') || t.name.toLowerCase().includes('takeaway'))
                    .map(t => t.id);
                const isPackage = packageTableIds.includes(item.table_id);
                if (activeTab === 'package') return isPackage;
                return !isPackage;
            })
            .filter(i => i.metadata?.is_discount)
            .reduce((sum, i) => sum + Math.abs(parseFloat(i.price) || 0), 0);

        return processedData.reduce((acc, curr) => {
            acc.total += curr.totalPrice;
            acc.net += curr.netPrice;
            acc.gift += curr.giftCount;
            acc.waste += curr.wasteCount;
            return acc;
        }, { total: 0, net: 0, gift: 0, waste: 0, totalDiscounts });
    }, [processedData, rawItems, activeTab, tables]);

    const exportToExcel = () => {
        const data = processedData.map(item => ({
            'Ürün Adı': item.name,
            'Adet': item.count,
            'KDV Oranı': `%${item.vatRate}`,
            'Toplam Tutar': item.totalPrice.toFixed(2) + ' ₺',
            'Net Tutar': item.netPrice.toFixed(2) + ' ₺',
            'İkram': item.giftCount,
            'Atık': item.wasteCount
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, activeTab === 'pos' ? 'POS Satışları' : 'Paket Satışları');
        XLSX.writeFile(wb, `Satis_Sayilari_${activeTab}_${dateRange.startDate}.xlsx`);
    };

    return (
        <div className="p-4 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[98%] mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            <TrendingUp className="text-[#5D5FEF]" size={28} />
                            Satış Sayıları Raporu
                        </h1>
                        <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            Ürün Bazlı Adet ve KDV Detaylı Analiz
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

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                                <TrendingUp size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Toplam Ürün Tutarı</span>
                        </div>
                        <div className="text-2xl font-black text-gray-800 tabular-nums">
                            {summary.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-sm">₺</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                                <Percent size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">KDV Hariç Toplam</span>
                        </div>
                        <div className="text-2xl font-black text-gray-800 tabular-nums">
                            {summary.net.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-sm">₺</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                                <Trash2 size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Atık Miktarı</span>
                        </div>
                        <div className="text-2xl font-black text-gray-800 tabular-nums">
                            {summary.waste} <span className="text-sm">ADET</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                                <TrendingUp size={20} /> {/* Using TrendingUp as Gift icon was used before */}
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">İkram Miktarı</span>
                        </div>
                        <div className="text-2xl font-black text-gray-800 tabular-nums">
                            {summary.gift} <span className="text-sm">ADET</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                                <Percent size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Toplam İndirim</span>
                        </div>
                        <div className="text-2xl font-black text-red-500 tabular-nums">
                            {summary.totalDiscounts.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-sm">₺</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center gap-6 border-b border-gray-50 pb-4">
                        <button
                            onClick={() => setActiveTab('pos')}
                            className={`flex items-center gap-2 pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'pos' ? 'border-[#5D5FEF] text-[#5D5FEF]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <Monitor size={18} />
                            Pos Satış Adetleri
                        </button>
                        <button
                            onClick={() => setActiveTab('package')}
                            className={`flex items-center gap-2 pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'package' ? 'border-[#5D5FEF] text-[#5D5FEF]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <Package size={18} />
                            Paket Satış Adetleri
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                value={staffFilter}
                                onChange={(e) => setStaffFilter(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]/30 focus:bg-white transition-all appearance-none"
                            >
                                <option value="all">Tüm Personeller</option>
                                {staffList.map(s => {
                                    const fullName = `${s.first_name}${s.last_name ? ' ' + s.last_name : ''}`;
                                    return (
                                        <option key={s.id} value={fullName}>{fullName}</option>
                                    );
                                })}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>

                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Ürün Ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]/30 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]/30 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]/30 focus:bg-white transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Ürün</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Adet</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">KDV Oranı</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Toplam Tutar</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">KDV Hariç Tutar</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center text-amber-500">İkram</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center text-red-500">Atık</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <RefreshCw className="text-[#5D5FEF] animate-spin" size={32} />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Veriler Hazırlanıyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : processedData.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Search className="text-gray-200" size={48} />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kayıt Bulunamadı</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    processedData.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-black text-gray-800">{item.name}</span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="text-sm font-black text-gray-800">{item.count}</span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="text-[10px] font-black text-gray-400 px-2 py-1 bg-gray-100 rounded-lg">%{item.vatRate}</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-sm font-black text-indigo-600">{item.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-sm font-black text-gray-700">{item.netPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`text-sm font-black ${item.giftCount > 0 ? 'text-amber-500' : 'text-gray-300'}`}>{item.giftCount}</span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`text-sm font-black ${item.wasteCount > 0 ? 'text-red-500' : 'text-gray-300'}`}>{item.wasteCount}</span>
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

export default SalesCounts;
