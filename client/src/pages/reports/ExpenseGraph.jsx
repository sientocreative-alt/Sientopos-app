import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    Search,
    RefreshCw,
    TrendingDown,
    Filter,
    BarChart3,
    Info,
    Check,
    X,
    Wallet,
    FileText,
    Users
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, getDaysInMonth } from 'date-fns';
import { tr } from 'date-fns/locale';

const ExpenseGraph = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [totals, setTotals] = useState({
        total: 0,
        cash: 0,
        invoice: 0,
        personnel: 0
    });

    // Filters
    const [graphType, setGraphType] = useState('Aylık'); // Yıllık, Aylık, Günlük, Tarih Aralığı
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [customRange, setCustomRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const [showFilters, setShowFilters] = useState(true);

    const getQueryRange = () => {
        let start, end;
        if (graphType === 'Yıllık') {
            start = `${selectedYear}-01-01T00:00:00`;
            end = `${selectedYear}-12-31T23:59:59`;
        } else if (graphType === 'Aylık') {
            const [year, month] = selectedMonth.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            start = `${format(startDate, 'yyyy-MM-dd')}T00:00:00`;
            end = `${format(endDate, 'yyyy-MM-dd')}T23:59:59`;
        } else if (graphType === 'Günlük') {
            start = `${selectedDate}T00:00:00`;
            end = `${selectedDate}T23:59:59`;
        } else { // Tarih Aralığı
            start = `${customRange.start}T00:00:00`;
            end = `${customRange.end}T23:59:59`;
        }
        return { start, end };
    };

    const fetchData = async () => {
        if (!user?.business_id) return;
        setLoading(true);
        try {
            const { start, end } = getQueryRange();

            // 1. Fetch Personnel Expenses (Staff Transactions)
            const staffQuery = supabase
                .from('staff_transactions')
                .select('amount, transaction_date')
                .eq('business_id', user.business_id)
                .eq('transaction_type', 'Ödeme')
                .is('is_deleted', false)
                .gte('transaction_date', start.split('T')[0])
                .lte('transaction_date', end.split('T')[0]);

            // 2. Fetch Supplier Invoices (Fatura Giderleri)
            const supplierQuery = supabase
                .from('supplier_transactions')
                .select('debt, date')
                .eq('business_id', user.business_id)
                .eq('transaction_type', 'purchase_invoice')
                .is('is_deleted', false)
                .gte('date', start.split('T')[0])
                .lte('date', end.split('T')[0]);

            // 3. Fetch Cashbox Expenses (Other Expense Invoices)
            const cashboxQuery = supabase
                .from('invoices')
                .select('total_amount, issue_date, record_type')
                .eq('business_id', user.business_id)
                .eq('invoice_type', 'Gider Faturası')
                .not('record_type', 'eq', 'Satın Alma')
                .not('record_type', 'eq', 'Personel Gideri')
                .gte('issue_date', start.split('T')[0])
                .lte('issue_date', end.split('T')[0]);

            const [staffRes, supplierRes, cashboxRes] = await Promise.all([
                staffQuery,
                supplierQuery,
                cashboxQuery
            ]);

            const staffData = staffRes.data || [];
            const supplierData = supplierRes.data || [];
            const cashboxData = cashboxRes.data || [];

            // Helper to generate empty dataset structure
            const generateEmptyData = () => {
                const data = {};
                if (graphType === 'Yıllık') {
                    for (let i = 0; i < 12; i++) {
                        const date = new Date(parseInt(selectedYear), i, 1);
                        const key = format(date, 'yyyy-MM');
                        const name = format(date, 'MMMM', { locale: tr });
                        data[key] = { name, kasa: 0, fatura: 0, personel: 0, toplam: 0, sortKey: i };
                    }
                } else if (graphType === 'Aylık') {
                    const [y, m] = selectedMonth.split('-');
                    const daysInMonth = getDaysInMonth(new Date(y, m - 1));
                    for (let i = 1; i <= daysInMonth; i++) {
                        const key = `${selectedMonth}-${i.toString().padStart(2, '0')}`;
                        data[key] = { name: i.toString(), kasa: 0, fatura: 0, personel: 0, toplam: 0, sortKey: i };
                    }
                } else if (graphType === 'Günlük') {
                    for (let i = 0; i < 24; i++) {
                        const key = i.toString().padStart(2, '0');
                        data[key] = { name: `${key}:00`, kasa: 0, fatura: 0, personel: 0, toplam: 0, sortKey: i };
                    }
                } else { // Tarih Aralığı
                    const s = new Date(customRange.start);
                    const e = new Date(customRange.end);
                    const days = eachDayOfInterval({ start: s, end: e });
                    days.forEach((day, index) => {
                        const key = format(day, 'yyyy-MM-dd');
                        const name = format(day, 'd MMM', { locale: tr });
                        data[key] = { name, kasa: 0, fatura: 0, personel: 0, toplam: 0, sortKey: index };
                    });
                }
                return data;
            };

            const aggregated = generateEmptyData();

            const getAggregationKey = (dateStr) => {
                const date = new Date(dateStr);
                if (graphType === 'Yıllık') return format(date, 'yyyy-MM');
                if (graphType === 'Aylık' || graphType === 'Tarih Aralığı') return format(date, 'yyyy-MM-dd');
                return format(date, 'HH');
            };

            // Personel Giderleri
            staffData.forEach(item => {
                const key = getAggregationKey(item.transaction_date);
                if (aggregated[key]) {
                    const amt = parseFloat(item.amount || 0);
                    aggregated[key].personel += amt;
                    aggregated[key].toplam += amt;
                }
            });

            // Fatura Giderleri
            supplierData.forEach(item => {
                const key = getAggregationKey(item.date);
                if (aggregated[key]) {
                    const amt = parseFloat(item.debt || 0);
                    aggregated[key].fatura += amt;
                    aggregated[key].toplam += amt;
                }
            });

            // Kasa Giderleri
            cashboxData.forEach(item => {
                const key = getAggregationKey(item.issue_date);
                if (aggregated[key]) {
                    const amt = parseFloat(item.total_amount || 0);
                    aggregated[key].kasa += amt;
                    aggregated[key].toplam += amt;
                }
            });

            const sortedData = Object.values(aggregated).sort((a, b) => a.sortKey - b.sortKey);
            setChartData(sortedData);

            // Calculate Totals
            const totalPersonnel = staffData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
            const totalInvoice = supplierData.reduce((sum, item) => sum + parseFloat(item.debt || 0), 0);
            const totalCash = cashboxData.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);

            setTotals({
                total: totalPersonnel + totalInvoice + totalCash,
                personnel: totalPersonnel,
                invoice: totalInvoice,
                cash: totalCash
            });

        } catch (error) {
            console.error('Error fetching expense data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, graphType, selectedDate, selectedMonth, selectedYear, customRange]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' ₺';
    };

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Gider Grafiği</h1>
                            <p className="text-[11px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">
                                Pano • Raporlar • Gider Grafiği
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchData}
                            className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 transition-all shadow-sm active:scale-95"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden transition-all">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="w-full px-8 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Filter size={18} className="text-[#5D5FEF]" />
                            <span className="text-sm font-black text-gray-700 uppercase tracking-wider">Filtreler</span>
                        </div>
                        <div className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}>
                            <X size={18} className="text-gray-300" />
                        </div>
                    </button>

                    {showFilters && (
                        <div className="px-8 pb-8 pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Grafik Türü</label>
                                <select
                                    value={graphType}
                                    onChange={(e) => setGraphType(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Yıllık">Yıllık</option>
                                    <option value="Aylık">Aylık</option>
                                    <option value="Günlük">Günlük</option>
                                    <option value="Tarih Aralığı">Tarih Aralığı</option>
                                </select>
                            </div>

                            {graphType === 'Yıllık' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Yıl Seçimi</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 transition-all appearance-none cursor-pointer"
                                    >
                                        {[2024, 2025, 2026].map(y => <option key={y} value={y.toString()}>{y}</option>)}
                                    </select>
                                </div>
                            )}

                            {graphType === 'Aylık' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ay Seçimi</label>
                                    <input
                                        type="month"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 transition-all cursor-pointer"
                                    />
                                </div>
                            )}

                            {graphType === 'Günlük' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gün Seçimi</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 transition-all cursor-pointer"
                                    />
                                </div>
                            )}

                            {graphType === 'Tarih Aralığı' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Başlangıç</label>
                                        <input
                                            type="date"
                                            value={customRange.start}
                                            onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 transition-all cursor-pointer"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bitiş</label>
                                        <input
                                            type="date"
                                            value={customRange.end}
                                            onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 transition-all cursor-pointer"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Kasa Giderleri"
                        amount={totals.cash}
                        color="text-blue-600"
                        bgColor="bg-blue-50"
                        icon={<Wallet size={20} />}
                    />
                    <StatCard
                        title="Fatura Giderleri"
                        amount={totals.invoice}
                        color="text-[#14b8a6]"
                        bgColor="bg-teal-50"
                        icon={<FileText size={20} />}
                    />
                    <StatCard
                        title="Personel Giderleri"
                        amount={totals.personnel}
                        color="text-purple-600"
                        bgColor="bg-purple-50"
                        icon={<Users size={20} />}
                    />
                    <StatCard
                        title="Toplam Giderler"
                        amount={totals.total}
                        color="text-orange-600"
                        bgColor="bg-orange-50"
                        icon={<BarChart3 size={20} />}
                    />
                </div>

                {/* Chart Container */}
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 relative min-h-[500px]">
                    {loading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-[32px]">
                            <RefreshCw className="text-[#5D5FEF] animate-spin" size={40} />
                        </div>
                    )}

                    <div className="h-[450px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F8FAFC' }}
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        padding: '12px'
                                    }}
                                    formatter={(value) => [formatCurrency(value), '']}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => (
                                        <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">
                                            {value === 'kasa' ? 'Kasa Giderleri' : value === 'fatura' ? 'Fatura Giderleri' : value === 'personel' ? 'Personel Giderleri' : 'Toplam Giderler'}
                                        </span>
                                    )}
                                />
                                <Bar dataKey="kasa" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="fatura" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="personel" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="toplam" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

const StatCard = ({ title, amount, color, bgColor, icon }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all group">
        <div className={`w-12 h-12 ${bgColor} ${color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{title}</p>
            <p className={`text-xl font-black ${color} tracking-tight`}>
                {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(amount)} ₺
            </p>
        </div>
    </div>
);

export default ExpenseGraph;
