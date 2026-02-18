import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    Calendar,
    Filter,
    FileSpreadsheet,
    RefreshCw,
    TrendingUp,
    DollarSign,
    CreditCard,
    PieChart,
    ChevronDown,
    Search
} from 'lucide-react';
import * as XLSX from 'xlsx';

const DailySales = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [dailySales, setDailySales] = useState([]);

    const fetchDailySales = async () => {
        if (!user?.business_id) return;
        setLoading(true);
        try {
            // Fetch payments within date range
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('business_id', user.business_id)
                .gte('created_at', `${dateRange.startDate}T00:00:00Z`)
                .lte('created_at', `${dateRange.endDate}T23:59:59Z`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Aggregate by Day
            const aggregated = (data || []).reduce((acc, p) => {
                const date = new Date(p.created_at).toLocaleDateString('tr-TR');
                if (!acc[date]) {
                    acc[date] = {
                        date,
                        rawDate: new Date(p.created_at).toISOString().split('T')[0],
                        total: 0,
                        cash: 0,
                        card: 0,
                        count: 0
                    };
                }
                const amount = parseFloat(p.amount) || 0;
                acc[date].total += amount;
                acc[date].count += 1;
                if (p.payment_method === 'Nakit') acc[date].cash += amount;
                if (p.payment_method === 'Kredi Kartı') acc[date].card += amount;
                return acc;
            }, {});

            const sortedList = Object.values(aggregated).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
            setDailySales(sortedList);
        } catch (err) {
            console.error('Error fetching daily sales:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchDailySales();
    }, [user]);

    const exportToExcelTotal = () => {
        // Single Sheet Export
        const worksheet = XLSX.utils.json_to_sheet(dailySales.map(d => ({
            'Tarih': d.date,
            'Toplam Satış': d.total.toFixed(2) + ' ₺',
            'Nakit': d.cash.toFixed(2) + ' ₺',
            'Kredi Kartı': d.card.toFixed(2) + ' ₺',
            'İşlem Sayısı': d.count
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Günlük Satışlar");
        XLSX.writeFile(workbook, `Gunluk_Satis_Raporu_Tek_Sayfa.xlsx`);
    };

    const exportToExcelByDay = () => {
        // Multi Sheet Export (One sheet per day)
        const workbook = XLSX.utils.book_new();

        // This is simplified as we are aggregating, 
        // a real "Day Based" might mean detailed transaction per sheet
        // But for now let's create a sheet with summary and one with details
        const summarySheet = XLSX.utils.json_to_sheet(dailySales.map(d => ({
            'Tarih': d.date,
            'Toplam Satış': d.total.toFixed(2) + ' ₺',
            'Nakit': d.cash.toFixed(2) + ' ₺',
            'Kredi Kartı': d.card.toFixed(2) + ' ₺',
            'İşlem Sayısı': d.count
        })));
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Özet");

        XLSX.writeFile(workbook, `Gunluk_Satis_Raporu_Gun_Bazli.xlsx`);
    };

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            <TrendingUp className="text-[#5D5FEF]" size={28} />
                            Günlük Satışlar
                            <span className="text-sm font-bold text-gray-400 ml-2">Pano • Raporlar • Günlük Satışlar</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportToExcelByDay}
                            className="flex items-center gap-2 bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] px-5 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 uppercase tracking-wider"
                        >
                            <FileSpreadsheet size={18} />
                            Excele Aktar (Gün Bazlı)
                        </button>
                        <button
                            onClick={exportToExcelTotal}
                            className="flex items-center gap-2 bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] px-5 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 uppercase tracking-wider"
                        >
                            <FileSpreadsheet size={18} />
                            Excele Aktar (Tek Sayfa)
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
                        <ChevronDown size={20} className="text-gray-300" />
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
                                onClick={fetchDailySales}
                                className="w-full bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm uppercase tracking-widest"
                            >
                                <Search size={20} />
                                Filtrele
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sales Cards / Table */}
                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Tarih</th>
                                    <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">İşlem Sayısı</th>
                                    <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Nakit Toplam</th>
                                    <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Kart Toplam</th>
                                    <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">GÜNLÜK TOPLAM</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-10 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <RefreshCw className="text-[#5D5FEF] animate-spin" size={40} />
                                                <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Veriler Analiz Ediliyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : dailySales.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-10 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-20">
                                                <PieChart size={64} className="text-gray-400" />
                                                <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Bu aralıkta satış verisi bulunamadı</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    dailySales.map((item, idx) => (
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
                                                <span className="px-4 py-1.5 bg-gray-100 rounded-full text-xs font-black text-gray-500 uppercase tracking-wider">
                                                    {item.count} İŞLEM
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-sm font-black text-emerald-600 tracking-tight">
                                                        {item.cash.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </span>
                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">NAKİT</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-sm font-black text-blue-600 tracking-tight">
                                                        {item.card.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </span>
                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">KREDİ KARTI</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-lg font-black text-[#5D5FEF] tracking-tighter">
                                                        {item.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-3 bg-[#5D5FEF] rounded-full"></div>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">NET HASILAT</span>
                                                    </div>
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

export default DailySales;
