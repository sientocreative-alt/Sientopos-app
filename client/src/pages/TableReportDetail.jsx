import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Calendar,
    ArrowLeft,
    Search,
    Eye,
    RefreshCw,
    Wallet,
    CreditCard
} from 'lucide-react';
import * as XLSX from 'xlsx';

const TableReportDetail = () => {
    const { id: tableId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [tableName, setTableName] = useState('');
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({ today: 0, total: 0 });

    // Date filter state
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    const fetchTableDetail = async () => {
        if (!user?.business_id || !tableId) return;
        setLoading(true);
        try {
            // 1. Fetch Table Name
            const { data: table, error: tableError } = await supabase
                .from('tables')
                .select('*, seating_areas(name)')
                .eq('id', tableId)
                .single();

            if (table) {
                const areaName = table.seating_areas?.name || '';
                setTableName(`${areaName} - ${table.name}`);
            }

            // 2. Build Query for Payments
            let query = supabase
                .from('payments')
                .select('*')
                .eq('business_id', user.business_id)
                .eq('table_id', tableId)
                .order('created_at', { ascending: false });

            if (dateRange.startDate) {
                query = query.gte('created_at', `${dateRange.startDate}T00:00:00Z`);
            }
            if (dateRange.endDate) {
                query = query.lte('created_at', `${dateRange.endDate}T23:59:59Z`);
            }

            const { data: paymentData, error: paymentError } = await query;
            if (paymentError) throw paymentError;

            // 3. Calculate Stats
            const today = new Date().toISOString().split('T')[0];
            let todayTotal = 0;
            let total = 0;

            const list = (paymentData || []).map(p => {
                const amt = parseFloat(p.amount) || 0;
                const pDate = new Date(p.created_at).toISOString().split('T')[0];

                total += amt;
                if (pDate === today) todayTotal += amt;

                return {
                    ...p,
                    amount: amt,
                    dateStr: pDate
                };
            });

            setPayments(list);
            setStats({ today: todayTotal, total });

        } catch (err) {
            console.error('Error fetching table detail:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && tableId) fetchTableDetail();
    }, [user, tableId]); // Add dateRange dependency if we want auto-refetch on date change

    const handleFilter = () => {
        fetchTableDetail();
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
    };

    const formatDateTime = (isoString) => {
        if (!isoString) return { date: '-', time: '-' };
        const d = new Date(isoString);
        return {
            date: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
            time: d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
    };

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/isletme/raporlar/satis/masa')}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#5D5FEF] transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                            Masa Geçmişi
                        </h1>
                        <span className="text-sm font-bold text-gray-400">Pano • Raporlar • Masa Raporları • {tableName}</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Filtreler</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-8 flex gap-4">
                            <div className="flex items-center gap-2 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                                <Calendar className="text-gray-400" size={18} />
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
                        <div className="md:col-span-4">
                            <button
                                onClick={handleFilter}
                                className="w-full bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-wide"
                            >
                                <Search size={18} />
                                Filtrele
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Bugün Yapılan Ödeme</h3>
                            <div className="text-3xl font-black text-gray-800 tracking-tight tabular-nums">
                                {formatCurrency(stats.today)}
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Toplam Ödeme</h3>
                            <div className="text-3xl font-black text-gray-800 tracking-tight tabular-nums">
                                {formatCurrency(stats.total)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">{tableName}</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Kapanış Saati</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Ödeme Yöntemi</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Kapanış Tutarı</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Kasayı Kapayan</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <RefreshCw className="text-[#5D5FEF] animate-spin" size={32} />
                                                <span className="text-[11px] font-bold text-gray-400">Veriler Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : payments.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-12 text-center text-gray-400 font-bold text-sm">
                                            Kayıt bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((p) => {
                                        const { date, time } = formatDateTime(p.created_at);
                                        return (
                                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-black text-gray-700">{date}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className="text-sm font-bold text-gray-500 font-mono">{time}</span>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${p.payment_method === 'Nakit'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        : 'bg-blue-50 text-blue-600 border-blue-100'
                                                        }`}>
                                                        {p.payment_method === 'Nakit' ? <Wallet size={12} /> : <CreditCard size={12} />}
                                                        {p.payment_method}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="text-sm font-black text-gray-700">{formatCurrency(p.amount)}</span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="text-sm font-bold text-gray-600">{p.staff_name || '-'}</span>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <button
                                                        onClick={() => navigate(`/isletme/raporlar/satis/hesap/${p.id}`)}
                                                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-indigo-50 hover:text-[#5D5FEF] text-gray-500 flex items-center justify-center transition-all active:scale-95"
                                                        title="Detay Görüntüle"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TableReportDetail;
