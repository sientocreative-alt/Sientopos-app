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
    Info,
    Check,
    X
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

const PaymentTypeGraph = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [totals, setTotals] = useState({ totalReceived: 0, totalTax: 0 });

    // Filters
    const [graphType, setGraphType] = useState('Yıllık'); // Yıllık, Aylık, Günlük, Tarih Aralığı
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [customRange, setCustomRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Multi-select Data
    const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState([]);
    const [availableIntegrations, setAvailableIntegrations] = useState([]);
    const [selectedIntegrations, setSelectedIntegrations] = useState([]);

    // Load initial lookup data
    useEffect(() => {
        if (user?.business_id) {
            fetchLookups();
        }
    }, [user?.business_id]);

    const fetchLookups = async () => {
        try {
            // Payment Methods
            const { data: methods } = await supabase
                .from('payment_methods')
                .select('name')
                .eq('business_id', user.business_id)
                .eq('is_deleted', false);

            const methodNames = methods?.map(m => m.name) || [];
            // Add default static ones if missing or just rely on DB
            const allMethods = Array.from(new Set([...methodNames, 'Nakit', 'Kredi Kartı']));
            setAvailablePaymentMethods(allMethods);
            setSelectedPaymentMethods(allMethods); // Default select all

            // Integrations (Customer Businesses)
            const { data: integrations } = await supabase
                .from('customer_businesses')
                .select('id, name')
                .eq('business_id', user.business_id)
                .eq('is_deleted', false);

            setAvailableIntegrations(integrations || []);
            // Default select all? Or none? usually user wants to see everything.
            // But integrations filtering might be specific. Let's start empty (show all).
        } catch (error) {
            console.error('Error fetching lookups:', error);
        }
    };

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

            // 1. Fetch Payments
            let paymentQuery = supabase
                .from('payments')
                .select('amount, created_at, payment_method, status, order_id')
                .eq('business_id', user.business_id)
                .gte('created_at', start)
                .lte('created_at', end);

            // Filter by selected payment methods
            if (selectedPaymentMethods.length > 0) {
                paymentQuery = paymentQuery.in('payment_method', selectedPaymentMethods);
            }

            const { data: payments, error: paymentError } = await paymentQuery;
            if (paymentError) throw paymentError;

            // 2. Fetch Integrations (Orders linked to Customer Businesses)
            // We need to filter payments based on whether their order belongs to a selected integration
            // This requires fetching orders for these payments
            const orderIds = payments.map(p => p.order_id).filter(Boolean);

            let orders = [];
            if (orderIds.length > 0) {
                const { data: orderData } = await supabase
                    .from('orders')
                    .select('id, customer_business_id')
                    .in('id', orderIds);
                orders = orderData || [];
            }

            // Map Order -> CustomerBusiness
            const orderIntegrationMap = {};
            orders.forEach(o => {
                orderIntegrationMap[o.id] = o.customer_business_id;
            });

            // Filter payments by Integration if any selected
            let filteredPayments = payments;
            if (selectedIntegrations.length > 0) {
                const selectedIntIds = selectedIntegrations.map(i => i.id);
                filteredPayments = payments.filter(p => {
                    const businessId = orderIntegrationMap[p.order_id];
                    return businessId && selectedIntIds.includes(businessId);
                });
            }

            // 3. Calculate Tax (KDV)
            // We need to fetch order items for the filtered payments to get product tax rates
            // This is an estimation: proportional to payment amount? 
            // Or just fetch all items for these orders and sum exact tax?
            // Assuming 1 payment = 1 order usually.
            // Let's fetch order items for these orders.
            let totalTaxCalculated = 0;
            if (filteredPayments.length > 0) {
                const relevantOrderIds = [...new Set(filteredPayments.map(p => p.order_id).filter(Boolean))];

                // Fetch items with product tax rate
                if (relevantOrderIds.length > 0) {
                    const { data: items } = await supabase
                        .from('order_items')
                        .select('order_id, quantity, price, product_id, products(vat_rate)')
                        .in('order_id', relevantOrderIds);

                    // Calculate Tax per Order
                    const orderTaxMap = {};
                    items?.forEach(item => {
                        const rate = item.products?.vat_rate || 0; // Default 18?
                        const amount = item.price * item.quantity;
                        // Tax included in price? Usually yes in POS.
                        // Tax = Price - (Price / (1 + rate/100))
                        const tax = amount - (amount / (1 + rate / 100));

                        if (!orderTaxMap[item.order_id]) orderTaxMap[item.order_id] = 0;
                        orderTaxMap[item.order_id] += tax;
                    });

                    // Sum up tax for our payments
                    filteredPayments.forEach(p => {
                        if (p.order_id && orderTaxMap[p.order_id]) {
                            totalTaxCalculated += orderTaxMap[p.order_id];
                        }
                    });
                }
            }

            // 4. Aggregate Data for Chart
            const generateEmptyData = () => {
                const data = {};
                // ... same range generation logic as RevenueGraph ...
                if (graphType === 'Yıllık') {
                    for (let i = 0; i < 12; i++) {
                        const date = new Date(parseInt(selectedYear), i, 1);
                        const key = format(date, 'yyyy-MM');
                        const name = format(date, 'MMMM', { locale: tr });
                        data[key] = { name, sortKey: i, total: 0 };
                        // Init payment methods
                        availablePaymentMethods.forEach(m => data[key][m] = 0);
                    }
                } else if (graphType === 'Aylık') {
                    const [y, m] = selectedMonth.split('-');
                    const daysInMonth = getDaysInMonth(new Date(y, m - 1));
                    for (let i = 1; i <= daysInMonth; i++) {
                        const key = `${selectedMonth}-${i.toString().padStart(2, '0')}`;
                        data[key] = { name: i.toString(), sortKey: i, total: 0 };
                        availablePaymentMethods.forEach(m => data[key][m] = 0);
                    }
                } else if (graphType === 'Günlük') {
                    for (let i = 0; i < 24; i++) {
                        const key = i.toString().padStart(2, '0');
                        data[key] = { name: `${key}:00`, sortKey: i, total: 0 };
                        availablePaymentMethods.forEach(m => data[key][m] = 0);
                    }
                } else { // Custom
                    // ...
                    const s = new Date(customRange.start);
                    const e = new Date(customRange.end);
                    const days = eachDayOfInterval({ start: s, end: e });
                    days.forEach((day, index) => {
                        const key = format(day, 'yyyy-MM-dd');
                        const name = format(day, 'd MMM', { locale: tr });
                        data[key] = { name, sortKey: index, total: 0 };
                        availablePaymentMethods.forEach(m => data[key][m] = 0);
                    });
                }
                return data;
            };

            const aggregated = generateEmptyData();

            const getAggregationKey = (dateStr) => {
                const date = new Date(dateStr);
                if (dateStr.length === 5) return dateStr; // HH for Daily if simplified, but date string is full ISO
                if (graphType === 'Yıllık') return format(date, 'yyyy-MM');
                if (graphType === 'Aylık' || graphType === 'Tarih Aralığı') return format(date, 'yyyy-MM-dd');
                return format(date, 'HH');
            };

            filteredPayments.forEach(p => {
                const key = getAggregationKey(p.created_at);
                if (aggregated[key]) {
                    const amount = parseFloat(p.amount || 0);
                    const method = p.payment_method || 'Diğer';

                    aggregated[key].total += amount;
                    if (aggregated[key][method] !== undefined) {
                        aggregated[key][method] += amount;
                    } else {
                        // Handle unexpected method names if any
                        aggregated[key][method] = (aggregated[key][method] || 0) + amount;
                    }
                }
            });

            const sortedData = Object.values(aggregated).sort((a, b) => a.sortKey - b.sortKey);
            setChartData(sortedData);

            // Totals
            const totalReceived = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

            setTotals({
                totalReceived,
                totalTax: totalTaxCalculated
            });

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && availablePaymentMethods.length > 0) {
            fetchData();
        }
    }, [user, graphType, selectedDate, selectedMonth, selectedYear, customRange, selectedPaymentMethods, selectedIntegrations, availablePaymentMethods]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
    };

    // Toggle Helpers
    const togglePaymentMethod = (method) => {
        if (selectedPaymentMethods.includes(method)) {
            setSelectedPaymentMethods(prev => prev.filter(m => m !== method));
        } else {
            setSelectedPaymentMethods(prev => [...prev, method]);
        }
    };

    const toggleIntegration = (integration) => {
        const exists = selectedIntegrations.find(i => i.id === integration.id);
        if (exists) {
            setSelectedIntegrations(prev => prev.filter(i => i.id !== integration.id));
        } else {
            setSelectedIntegrations(prev => [...prev, integration]);
        }
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => (currentYear - 4 + i).toString()).reverse();

    // Random/Hash color for bars
    const getColor = (str) => {
        const colors = ['#5D5FEF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#5D5FEF] transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">Ödeme Tipi Grafiği</h1>
                        <span className="text-sm font-bold text-gray-400">Pano • Raporlar • Ödeme Tipi Grafiği</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">Filtreler</h3>
                        <button onClick={fetchData} className="bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide flex items-center gap-2 transition-all">
                            <RefreshCw size={16} /> Filtrele
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Row 1: Type & Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Grafik Türü</label>
                                <select value={graphType} onChange={(e) => setGraphType(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]">
                                    <option value="Yıllık">Yıllık</option>
                                    <option value="Aylık">Aylık</option>
                                    <option value="Günlük">Günlük</option>
                                    <option value="Tarih Aralığı">Tarih Aralığı</option>
                                </select>
                            </div>

                            <div className="space-y-2 lg:col-span-3">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Tarih Aralığı</label>
                                <div className="w-full">
                                    {graphType === 'Yıllık' && (
                                        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]">
                                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    )}
                                    {graphType === 'Aylık' && (
                                        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]" />
                                    )}
                                    {graphType === 'Günlük' && (
                                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]" />
                                    )}
                                    {graphType === 'Tarih Aralığı' && (
                                        <div className="flex gap-2">
                                            <input type="date" value={customRange.start} onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]" />
                                            <input type="date" value={customRange.end} onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-[#5D5FEF]" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Payment Methods */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Ödeme Yöntemleri</label>
                            <div className="flex flex-wrap gap-2">
                                {availablePaymentMethods.map(method => (
                                    <button
                                        key={method}
                                        onClick={() => togglePaymentMethod(method)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${selectedPaymentMethods.includes(method) ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        {selectedPaymentMethods.includes(method) ? <Check size={12} /> : <X size={12} />}
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Row 3: Integrations */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Entegrasyonlar</label>
                            {availableIntegrations.length === 0 ? (
                                <div className="text-sm text-gray-400 italic">Entegrasyon bulunamadı (Müşteri İşletmeler)</div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {availableIntegrations.map(int => (
                                        <button
                                            key={int.id}
                                            onClick={() => toggleIntegration(int)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${selectedIntegrations.find(i => i.id === int.id) ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            {selectedIntegrations.find(i => i.id === int.id) ? <Check size={12} /> : <X size={12} />}
                                            {int.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#14b8a6] p-8 rounded-[24px] shadow-lg shadow-teal-100 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-white/20 transition-all"></div>
                        <h3 className="text-white/80 font-bold text-lg mb-2">Toplam Tutar</h3>
                        <div className="text-4xl font-black text-white tracking-tight">{formatCurrency(totals.totalReceived)}</div>
                    </div>

                    <div className="bg-[#3b82f6] p-8 rounded-[24px] shadow-lg shadow-blue-100 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-white/20 transition-all"></div>
                        <h3 className="text-white/80 font-bold text-lg mb-2">KDV Tutarı {selectedIntegrations.length > 0 && '(Tahmini)'}</h3>
                        <div className="text-4xl font-black text-white tracking-tight">{formatCurrency(totals.totalTax)}</div>
                    </div>
                </div>

                {/* Chart */}
                <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 h-[500px]">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <RefreshCw className="text-[#5D5FEF] animate-spin" size={32} />
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={(val) => val >= 1000 ? `${val / 1000}k` : val} />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                {selectedPaymentMethods.map((method, index) => (
                                    <Bar
                                        key={method}
                                        dataKey={method}
                                        name={method}
                                        stackId="a"
                                        fill={getColor(method)}
                                        radius={[index === selectedPaymentMethods.length - 1 ? 4 : 0, index === selectedPaymentMethods.length - 1 ? 4 : 0, 0, 0]}
                                        barSize={graphType === 'Yıllık' ? 40 : (graphType === 'Aylık' ? 20 : 30)}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

            </div>
        </div>
    );
};

export default PaymentTypeGraph;
