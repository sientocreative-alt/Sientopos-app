import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    Search,
    RefreshCw,
    Package,
    X,
    TrendingUp
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const StockConsumptionDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState(null);
    const [chartData, setChartData] = useState([]);

    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    // Default to a wider range for detail view maybe? Or inherit? 
    // Let's stick to user pattern -> Today default, but typically charts show history.
    // Let's set default to last 7 days for the chart to make sense visually initially.
    useEffect(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        setDateRange({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        });
    }, []);

    const fetchData = async () => {
        if (!user?.business_id || !id) return;
        setLoading(true);
        try {
            // 1. Fetch Product Info
            const { data: prodData } = await supabase
                .from('products')
                .select('id, name, default_unit_id, unit:default_unit_id(short_name)')
                .eq('id', id)
                .single();
            setProduct(prodData);

            // 2. Fetch Consumption for Date Range
            // Need recipes where ingredient_id = id
            const { data: recipes } = await supabase
                .from('product_recipes')
                .select('product_id, amount')
                .eq('ingredient_id', id)
                .eq('business_id', user.business_id)
                .is('is_deleted', false);

            if (!recipes || recipes.length === 0) {
                setChartData([]);
                setLoading(false);
                return;
            }

            const productIds = recipes.map(r => r.product_id);
            const recipeMap = {}; // productId -> amount
            recipes.forEach(r => recipeMap[r.product_id] = r.amount);

            // Fetch Sales
            const { data: sales } = await supabase
                .from('order_items')
                .select('product_id, quantity, created_at')
                .in('product_id', productIds)
                .gte('created_at', `${dateRange.startDate}T00:00:00`)
                .lte('created_at', `${dateRange.endDate}T23:59:59`)
                .neq('status', 'cancelled')
                .neq('status', 'returned');

            // Process Data by Day
            const dailyStats = {};

            // Initialize all days in range
            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                const displayDate = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                dailyStats[dateStr] = { date: displayDate, amount: 0 };
            }

            sales?.forEach(sale => {
                const dateKey = sale.created_at.split('T')[0];
                if (dailyStats[dateKey]) {
                    const consumption = (recipeMap[sale.product_id] || 0) * sale.quantity;
                    dailyStats[dateKey].amount += consumption;
                }
            });

            setChartData(Object.values(dailyStats));

        } catch (err) {
            console.error('Error fetching detail:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && id) fetchData();
    }, [user, id, dateRange.startDate, dateRange.endDate]); // Fetch on date change

    const handleFilter = () => {
        fetchData();
    };

    const handleClearFilters = () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        setDateRange({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        });
    };

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/isletme/raporlar/stok/tuketim')}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#5D5FEF] transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">
                            Stok Tüketimi
                        </h1>
                        <span className="text-sm font-bold text-gray-400">Pano • Raporlar • Stok Tüketimi</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4 cursor-pointer">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                            Filtreler
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-6 flex gap-2">
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
                        <div className="md:col-span-3">
                            {/* Placeholder for granularity filter if needed (Daily/Monthly) */}
                            <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none appearance-none">
                                <option>Günlük</option>
                            </select>
                        </div>
                        <div className="md:col-span-3 flex gap-2">
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

                {/* Chart Section */}
                <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
                    <div className="mb-8">
                        <h2 className="text-lg font-black text-gray-800 flex items-center gap-3">
                            <Package className="text-gray-400" size={20} />
                            {product ? `${product.name} Tüketimi` : 'Yükleniyor...'}
                        </h2>
                        {chartData.every(d => d.amount === 0) && !loading && (
                            <p className="text-sm font-bold text-red-400 mt-2">Bu tarih aralığında tüketim yok</p>
                        )}
                    </div>

                    <div className="h-[400px] w-full">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <RefreshCw className="text-[#5D5FEF] animate-spin" size={32} />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                        label={{
                                            value: `Kullanım Miktarı (${product?.unit?.short_name || ''})`,
                                            angle: -90,
                                            position: 'insideLeft',
                                            style: { fill: '#64748B', fontWeight: 700, fontSize: 12 }
                                        }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F1F5F9' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar
                                        dataKey="amount"
                                        name="Miktar"
                                        fill="#5D5FEF"
                                        radius={[8, 8, 0, 0]}
                                        barSize={40}
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

export default StockConsumptionDetail;
