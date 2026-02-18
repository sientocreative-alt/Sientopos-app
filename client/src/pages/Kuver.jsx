import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    Calendar,
    Filter,
    FileSpreadsheet,
    RefreshCw,
    TrendingUp,
    Users,
    ChevronDown,
    Search,
    DollarSign
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import * as XLSX from 'xlsx';

const Kuver = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState({
        totalGuests: 0,
        totalRevenue: 0,
        averageGuests: 0
    });

    const fetchReportData = async () => {
        if (!user?.business_id) return;
        setLoading(true);
        try {
            const startStr = `${dateRange.startDate}T00:00:00Z`;
            const endStr = `${dateRange.endDate}T23:59:59Z`;

            // Fetch all order items in range
            const { data, error } = await supabase
                .from('order_items')
                .select('*')
                .eq('business_id', user.business_id)
                .gte('created_at', startStr)
                .lte('created_at', endStr)
                .is('is_deleted', false);

            if (error) throw error;

            // Filter for Kuver items
            // We look for "kuver" or "cover" in the name, case-insensitive
            const kuverItems = (data || []).filter(item => {
                const name = item.name.toLowerCase();
                return name.includes('kuver') || name.includes('cover');
            });

            // Aggregate by Date
            const aggregated = kuverItems.reduce((acc, item) => {
                const date = new Date(item.created_at).toISOString().split('T')[0];
                const trDate = new Date(item.created_at).toLocaleDateString('tr-TR');

                if (!acc[date]) {
                    acc[date] = {
                        date: trDate,
                        rawDate: date,
                        guestCount: 0,
                        revenue: 0
                    };
                }

                const qty = item.quantity || 0;
                const price = parseFloat(item.price) || 0;
                const totalModPrice = item.modifiers?.reduce((sum, m) => sum + (parseFloat(m.price) || 0), 0) || 0;
                const totalItemPrice = (price + totalModPrice) * qty;

                acc[date].guestCount += qty;
                acc[date].revenue += totalItemPrice;

                return acc;
            }, {});

            // Fill in missing dates for better charts? 
            // For now, let's just show days with data or maybe all days in range if key matches?
            // Let's stick to days with data for simplicity first, or sort properly.

            const sortedList = Object.values(aggregated).sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

            // Calculate Summary
            const totalGuests = sortedList.reduce((sum, item) => sum + item.guestCount, 0);
            const totalRevenue = sortedList.reduce((sum, item) => sum + item.revenue, 0);
            const dayCount = sortedList.length || 1;

            setReportData(sortedList);
            setSummary({
                totalGuests,
                totalRevenue,
                averageGuests: Math.round(totalGuests / dayCount)
            });

        } catch (err) {
            console.error('Error fetching kuver report:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchReportData();
    }, [user]);

    const exportToExcel = () => {
        const data = reportData.map(item => ({
            'Tarih': item.date,
            'Misafir Sayısı': item.guestCount,
            'Kuver Geliri': item.revenue.toFixed(2) + ' ₺'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Kuver Raporu");
        XLSX.writeFile(wb, `Kuver_Raporu_${dateRange.startDate}_${dateRange.endDate}.xlsx`);
    };

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            <Users className="text-[#5D5FEF]" size={28} />
                            Kuver ve Misafir Raporu
                            <span className="text-sm font-bold text-gray-400 ml-2">Pano • Raporlar • Kuver</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportToExcel}
                            className="flex items-center gap-2 bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] px-5 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 uppercase tracking-wider"
                        >
                            <FileSpreadsheet size={18} />
                            Excel'e Aktar
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 uppercase tracking-widest text-[12px]">
                            <Filter size={18} className="text-[#5D5FEF]" />
                            Filtreler
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                        <div className="md:col-span-8 flex flex-col gap-4">
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#5D5FEF] transition-colors" size={20} />
                                <div className="flex items-center gap-2 w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl">
                                    <input
                                        type="date"
                                        value={dateRange.startDate}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="bg-transparent text-sm font-black text-gray-700 outline-none w-full"
                                    />
                                    <span className="text-gray-300 font-bold">-</span>
                                    <input
                                        type="date"
                                        value={dateRange.endDate}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="bg-transparent text-sm font-black text-gray-700 outline-none w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-4">
                            <button
                                onClick={fetchReportData}
                                className="w-full bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm uppercase tracking-widest"
                            >
                                <Search size={20} />
                                Filtrele
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                                <Users size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Toplam Misafir</span>
                        </div>
                        <div className="text-3xl font-black text-gray-800 tabular-nums">
                            {summary.totalGuests.toLocaleString('tr-TR')} <span className="text-sm text-gray-400">Kişi</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                                <DollarSign size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Toplam Kuver Geliri</span>
                        </div>
                        <div className="text-3xl font-black text-gray-800 tabular-nums">
                            {summary.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-sm text-gray-400">₺</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                                <TrendingUp size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Günlük Ort. Misafir</span>
                        </div>
                        <div className="text-3xl font-black text-gray-800 tabular-nums">
                            {summary.averageGuests.toLocaleString('tr-TR')} <span className="text-sm text-gray-400">Kişi/Gün</span>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Guest Count Chart */}
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                            <Users size={20} className="text-[#5D5FEF]" />
                            Misafir Yoğunluğu
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                                    />
                                    <Bar
                                        dataKey="guestCount"
                                        name="Misafir Sayısı"
                                        fill="#5D5FEF"
                                        radius={[6, 6, 0, 0]}
                                        barSize={30}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Revenue Chart */}
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                            <DollarSign size={20} className="text-emerald-500" />
                            Kuver Gelir Analizi
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={reportData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                        tickFormatter={(value) => `${value}₺`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                                        formatter={(value) => [`${value} ₺`, 'Gelir']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Kuver Geliri"
                                        stroke="#10b981"
                                        strokeWidth={4}
                                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Tarih</th>
                                    <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Misafir Sayısı</th>
                                    <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Kuver Geliri</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="3" className="px-10 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <RefreshCw className="text-[#5D5FEF] animate-spin" size={40} />
                                                <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Veriler Analiz Ediliyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : reportData.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-10 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-20">
                                                <Users size={64} className="text-gray-400" />
                                                <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Bu aralıkta kuver verisi bulunamadı</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    reportData.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/30 transition-all group">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#5D5FEF] font-black shadow-sm group-hover:scale-110 transition-transform">
                                                        <Calendar size={20} />
                                                    </div>
                                                    <span className="text-base font-black text-gray-800 tracking-tight">{item.date}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-sm font-black text-gray-800 tracking-tight">
                                                        {item.guestCount}
                                                    </span>
                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">KİŞİ</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-lg font-black text-[#5D5FEF] tracking-tighter">
                                                        {item.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </span>
                                                </div>
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

export default Kuver;
