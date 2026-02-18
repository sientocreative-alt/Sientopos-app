import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    Search,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Filter,
    BarChart3,
    Info
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
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval, eachHourOfInterval, getDaysInMonth, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';

const RevenueGraph = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [totals, setTotals] = useState({ income: 0, expense: 0 });

    // Filters
    const [graphType, setGraphType] = useState('Aylık'); // Yıllık, Aylık, Günlük, Tarih Aralığı
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [customRange, setCustomRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

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

            // 1. Fetch Income (Payments)
            let incomeQuery = supabase
                .from('payments')
                .select('amount, created_at, payment_method, status')
                .eq('business_id', user.business_id)
                .eq('status', 'success')
                .gte('created_at', start)
                .lte('created_at', end);

            // 2. Fetch Expenses
            // a) Supplier Invoices
            let supplierQuery = supabase
                .from('supplier_transactions')
                .select('debt, date, transaction_type')
                .eq('business_id', user.business_id)
                .eq('transaction_type', 'purchase_invoice')
                .eq('is_deleted', false)
                .gte('date', start.split('T')[0])
                .lte('date', end.split('T')[0]);

            // b) Staff Payments
            let staffQuery = supabase
                .from('staff_transactions')
                .select('amount, transaction_date, transaction_type')
                .eq('business_id', user.business_id)
                .eq('transaction_type', 'Ödeme')
                .eq('is_deleted', false)
                .gte('transaction_date', start.split('T')[0])
                .lte('transaction_date', end.split('T')[0]);

            const [incomeRes, supplierRes, staffRes] = await Promise.all([
                incomeQuery,
                supplierQuery,
                staffQuery
            ]);

            if (incomeRes.error) throw incomeRes.error;
            if (supplierRes.error) throw supplierRes.error;
            if (staffRes.error) throw staffRes.error;

            const incomes = incomeRes.data || [];
            const supplierExpenses = supplierRes.data || [];
            const staffExpenses = staffRes.data || [];

            // Helper to generate empty dataset structure
            const generateEmptyData = () => {
                const data = {};
                if (graphType === 'Yıllık') {
                    for (let i = 0; i < 12; i++) {
                        const date = new Date(parseInt(selectedYear), i, 1);
                        const key = format(date, 'yyyy-MM');
                        const name = format(date, 'MMMM', { locale: tr });
                        data[key] = { name, income: 0, expense: 0, sortKey: i };
                    }
                } else if (graphType === 'Aylık') {
                    const [y, m] = selectedMonth.split('-');
                    const daysInMonth = getDaysInMonth(new Date(y, m - 1));
                    for (let i = 1; i <= daysInMonth; i++) {
                        const key = `${selectedMonth}-${i.toString().padStart(2, '0')}`;
                        data[key] = { name: i.toString(), income: 0, expense: 0, sortKey: i };
                    }
                } else if (graphType === 'Günlük') {
                    for (let i = 0; i < 24; i++) {
                        const key = i.toString().padStart(2, '0');
                        data[key] = { name: `${key}:00`, income: 0, expense: 0, sortKey: i };
                    }
                } else { // Tarih Aralığı
                    const s = new Date(customRange.start);
                    const e = new Date(customRange.end);
                    const days = eachDayOfInterval({ start: s, end: e });
                    days.forEach((day, index) => {
                        const key = format(day, 'yyyy-MM-dd');
                        const name = format(day, 'd MMM', { locale: tr });
                        data[key] = { name, income: 0, expense: 0, sortKey: index };
                    });
                }
                return data;
            }

            const aggregated = generateEmptyData();

            const getAggregationKey = (dateStr) => {
                const date = new Date(dateStr);
                if (graphType === 'Yıllık') return format(date, 'yyyy-MM');
                if (graphType === 'Aylık' || graphType === 'Tarih Aralığı') return format(date, 'yyyy-MM-dd');
                return format(date, 'HH');
            };

            const processItems = (items, type) => {
                items.forEach(item => {
                    const dateVal = item.created_at || item.date || item.transaction_date;
                    const key = getAggregationKey(dateVal);

                    if (aggregated[key]) {
                        const amount = parseFloat(item.amount || item.debt || 0);
                        if (type === 'income') aggregated[key].income += amount;
                        else aggregated[key].expense += amount;
                    }
                });
            };

            processItems(incomes, 'income');
            processItems(supplierExpenses, 'expense');
            processItems(staffExpenses, 'expense');

            const sortedData = Object.values(aggregated).sort((a, b) => a.sortKey - b.sortKey);
            setChartData(sortedData);

            // Calculate Totals
            const totalIncome = incomes.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
            const totalSupplierExp = supplierExpenses.reduce((sum, item) => sum + parseFloat(item.debt || 0), 0);
            const totalStaffExp = staffExpenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

            setTotals({
                income: totalIncome,
                expense: totalSupplierExp + totalStaffExp
            });

        } catch (error) {
            console.error('Error fetching revenue data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, graphType, selectedDate, selectedMonth, selectedYear, customRange]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => (currentYear - 4 + i).toString()).reverse();

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
                            Gelir Grafiği
                        </h1>
                        <span className="text-sm font-bold text-gray-400">Pano • Raporlar • Gelir Grafiği</span>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg h-fit text-blue-600">
                        <Info size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-blue-800 mb-1 uppercase tracking-wide">Hesaplama Mantığı</h4>
                        <p className="text-xs text-blue-600 font-medium leading-relaxed">
                            Bu grafik işletmenizin gerçek verilerine dayalı olarak <strong>algoritmik</strong> bir şekilde oluşturulmuştur.
                            <br />
                            <span className="inline-block mt-1">• <strong>Gelirler:</strong> Tamamlanmış (Başarılı) ve silinmemiş ödemeleri kapsar.</span>
                            <br />
                            <span className="inline-block">• <strong>Giderler:</strong> Tedarikçi faturaları ve personel ödemelerini kapsar.</span>
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                            Filtreler
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                        <div className="md:col-span-3 space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Grafik Türü</label>
                            <select
                                value={graphType}
                                onChange={(e) => setGraphType(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]"
                            >
                                <option value="Yıllık">Yıllık (12 Ay)</option>
                                <option value="Aylık">Aylık (Günler)</option>
                                <option value="Günlük">Günlük (Saatler)</option>
                                <option value="Tarih Aralığı">Tarih Aralığı</option>
                            </select>
                        </div>
                        <div className="md:col-span-6 space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                {graphType === 'Yıllık' ? 'Yıl Seçimi' :
                                    graphType === 'Aylık' ? 'Ay Seçimi' :
                                        graphType === 'Günlük' ? 'Gün Seçimi' : 'Tarih Aralığı Seçimi'}
                            </label>
                            <div className="w-full">
                                {graphType === 'Yıllık' && (
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]"
                                    >
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                )}

                                {graphType === 'Aylık' && (
                                    <input
                                        type="month"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]"
                                    />
                                )}

                                {graphType === 'Günlük' && (
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]"
                                    />
                                )}

                                {graphType === 'Tarih Aralığı' && (
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={customRange.start}
                                            onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]"
                                        />
                                        <input
                                            type="date"
                                            value={customRange.end}
                                            onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="md:col-span-3">
                            <button
                                onClick={fetchData}
                                className="w-full bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-wide"
                            >
                                <RefreshCw size={18} />
                                Yenile
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-600">Gelirler Toplamı:</h3>
                            <span className="text-2xl font-black text-[#5D5FEF]">{formatCurrency(totals.income)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-600">Giderler Toplamı:</h3>
                            <span className="text-2xl font-black text-[#10B981]">{formatCurrency(totals.expense)}</span>
                        </div>
                    </div>

                    <div className="mt-12 h-[450px]">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <RefreshCw className="text-[#5D5FEF] animate-spin" size={32} />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val) => val >= 1000 ? `${val / 1000}k` : val}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F1F5F9' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value) => formatCurrency(value)}
                                    />
                                    <Legend
                                        iconType="circle"
                                        wrapperStyle={{ paddingTop: '20px' }}
                                    />
                                    <Bar
                                        dataKey="income"
                                        name="Gelirler"
                                        fill="#5D5FEF"
                                        radius={[4, 4, 0, 0]}
                                        barSize={graphType === 'Yıllık' ? 40 : (graphType === 'Aylık' ? 20 : 30)}
                                    />
                                    <Bar
                                        dataKey="expense"
                                        name="Giderler"
                                        fill="#10B981"
                                        radius={[4, 4, 0, 0]}
                                        barSize={graphType === 'Yıllık' ? 40 : (graphType === 'Aylık' ? 20 : 30)}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RevenueGraph;
