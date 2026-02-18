import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    Calendar,
    Download,
    Filter,
    ChevronDown,
    DollarSign,
    CreditCard,
    Gift,
    Trash2,
    Search,
    RefreshCw,
    FileSpreadsheet,
    ArrowUpRight,
    TrendingUp
} from 'lucide-react';
import * as XLSX from 'xlsx';

const Accounts = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState({
        total: 0,
        cash: 0,
        credit: 0,
        gift: 0,
        waste: 0
    });

    const fetchReportData = async () => {
        if (!user?.business_id) return;
        setLoading(true);
        try {
            // Fetch directly from order_items instead of RPC to ensure we get all data (status, gift/waste etc)
            const { data, error } = await supabase
                .from('order_items')
                .select('created_at, paid_at, price, quantity, modifiers, payment_type, status')
                .eq('business_id', user.business_id)
                .in('status', ['paid', 'gift', 'waste'])
                .is('is_deleted', false)
                .gte('created_at', `${dateRange.startDate}T00:00:00Z`)
                .lte('created_at', `${dateRange.endDate}T23:59:59Z`);

            if (error) throw error;

            // Aggregate by day
            const dailyMap = {};
            let total = 0, cash = 0, credit = 0, gift = 0, waste = 0;

            (data || []).forEach(item => {
                const dateToUse = item.paid_at || item.created_at;
                const dateObj = new Date(dateToUse);
                const day = dateObj.toLocaleDateString('tr-TR');

                if (!dailyMap[day]) {
                    dailyMap[day] = {
                        day,
                        total: 0,
                        cash: 0,
                        credit: 0,
                        gift: 0,
                        waste: 0,
                        vat: 0
                    };
                }

                const itemTotal = (parseFloat(item.price) + (item.modifiers?.reduce((sum, m) => sum + parseFloat(m.price || 0), 0) || 0)) * item.quantity;

                if (item.status === 'gift') {
                    dailyMap[day].gift += itemTotal;
                    gift += itemTotal;
                } else if (item.status === 'waste') {
                    dailyMap[day].waste += itemTotal;
                    waste += itemTotal;
                } else if (item.status === 'paid') {
                    dailyMap[day].total += itemTotal;
                    total += itemTotal;

                    if (item.payment_type === 'cash') {
                        dailyMap[day].cash += itemTotal;
                        cash += itemTotal;
                    } else {
                        // Default to credit if not cash or explicitly credit_card
                        dailyMap[day].credit += itemTotal;
                        credit += itemTotal;
                    }
                }
            });

            const sortedReport = Object.values(dailyMap).sort((a, b) => {
                const dateA = new Date(a.day.split('.').reverse().join('-'));
                const dateB = new Date(b.day.split('.').reverse().join('-'));
                return dateB - dateA;
            });

            setReportData(sortedReport);
            setSummary({ total, cash, credit, gift, waste });
        } catch (err) {
            console.error('Error fetching report data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, [user, dateRange]);

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(reportData.map(row => ({
            'Gün': row.day,
            'Toplam (₺)': row.total.toFixed(2),
            'Nakit (₺)': row.cash.toFixed(2),
            'Kredi Kartı (₺)': row.credit.toFixed(2),
            'İkram (₺)': row.gift.toFixed(2),
            'Atık (₺)': row.waste.toFixed(2)
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Hesaplar');
        XLSX.writeFile(workbook, `Hesap_Raporu_${dateRange.startDate}_${dateRange.endDate}.xlsx`);
    };

    return (
        <div className="p-4 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[98%] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            <TrendingUp className="text-[#5D5FEF]" size={28} />
                            Hesaplar & Finans
                        </h1>
                        <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            İşletme Finansal Özet ve Raporlama
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                            <Calendar size={18} className="text-gray-400" />
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                className="bg-transparent text-sm font-black text-gray-600 outline-none"
                            />
                            <span className="text-gray-300 mx-1">-</span>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                className="bg-transparent text-sm font-black text-gray-600 outline-none"
                            />
                        </div>
                        <button
                            onClick={exportToExcel}
                            className="flex items-center gap-2 bg-[#5D5FEF] hover:bg-[#4B4DDF] text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg shadow-indigo-100 active:scale-95 uppercase tracking-wider"
                        >
                            <FileSpreadsheet size={18} />
                            Excel'e Aktar
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <SummaryCard
                        title="TOPLAM HASILAT"
                        value={summary.total}
                        icon={<TrendingUp className="text-indigo-600" size={20} />}
                        color="bg-indigo-50"
                        accentColor="bg-indigo-500"
                    />
                    <SummaryCard
                        title="NAKİT ÖDEMELER"
                        value={summary.cash}
                        icon={<DollarSign className="text-emerald-600" size={20} />}
                        color="bg-emerald-50"
                        accentColor="bg-emerald-500"
                    />
                    <SummaryCard
                        title="KREDİ KARTI"
                        value={summary.credit}
                        icon={<CreditCard className="text-blue-600" size={20} />}
                        color="bg-blue-50"
                        accentColor="bg-blue-500"
                    />
                    <SummaryCard
                        title="İKRAM TUTARI"
                        value={summary.gift}
                        icon={<Gift className="text-purple-600" size={20} />}
                        color="bg-purple-50"
                        accentColor="bg-purple-500"
                    />
                    <SummaryCard
                        title="ATIK TUTARI"
                        value={summary.waste}
                        icon={<Trash2 className="text-red-600" size={20} />}
                        color="bg-red-50"
                        accentColor="bg-red-500"
                    />
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Gün</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Toplam</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Nakit</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Kredi Kartı</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">KDV</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">İkram</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-red-400">Atık</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <RefreshCw className="text-[#5D5FEF] animate-spin" size={32} />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Veriler Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : reportData.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Search className="text-gray-200" size={48} />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seçili tarihlerde veri bulunamadı</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {reportData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                                            <Calendar size={14} />
                                                        </div>
                                                        <span className="text-sm font-black text-gray-700">{row.day}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-sm font-black text-gray-900 bg-gray-100 px-3 py-1.5 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                        {row.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-sm font-bold text-emerald-600">{row.cash.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-sm font-bold text-blue-600">{row.credit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-sm font-bold text-gray-400">{(row.total * (10 / 110)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-sm font-bold text-purple-600">{row.gift.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                                </td>
                                                <td className="px-8 py-5 text-red-500">
                                                    <span className="text-sm font-bold">{row.waste.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Total Row */}
                                        <tr className="bg-gray-50/80 font-black border-t-2 border-gray-100">
                                            <td className="px-8 py-6 text-gray-500 uppercase tracking-widest text-[11px]">GENEL TOPLAM</td>
                                            <td className="px-8 py-6 text-gray-900 text-sm">{summary.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                            <td className="px-8 py-6 text-emerald-600 text-sm">{summary.cash.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                            <td className="px-8 py-6 text-blue-600 text-sm">{summary.credit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                            <td className="px-8 py-6 text-gray-500 text-sm">{(summary.total * (10 / 110)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                            <td className="px-8 py-6 text-purple-600 text-sm">{summary.gift.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                            <td className="px-8 py-6 text-red-600 text-sm">{summary.waste.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div >
    );
};

const SummaryCard = ({ title, value, icon, color, accentColor }) => (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
        <div className={`absolute top-0 right-0 w-24 h-24 ${color} rounded-bl-[80px] -mr-6 -mt-6 transition-transform group-hover:scale-110 opacity-50`}></div>
        <div className="relative">
            <div className={`w-10 h-10 ${color} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-12`}>
                {icon}
            </div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</div>
            <div className="text-xl font-black text-gray-800 tabular-nums">
                {value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </div>
        </div>
        <div className={`absolute bottom-0 left-0 h-1 transition-all duration-500 ${accentColor} w-0 group-hover:w-full`}></div>
    </div>
);

export default Accounts;
