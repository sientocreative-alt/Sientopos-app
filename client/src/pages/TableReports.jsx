import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Eye,
    Armchair,
    RefreshCw
} from 'lucide-react';

const TableReports = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [tablesData, setTablesData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTableName, setFilterTableName] = useState(''); // Separate state for actual filter application if needed, or just use searchTerm immediately

    const fetchTableReports = async () => {
        if (!user?.business_id) return;
        setLoading(true);
        try {
            // 1. Fetch Tables and Seating Areas
            // We assume there might be a relationship, but to be safe and consistent with other parts,
            // let's fetch individual tables and seating areas and map them.
            // Or try the join if relationships are defined. Let's try separate fetches to be safe given previous experience.

            const { data: tables, error: tablesError } = await supabase
                .from('tables')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false);

            if (tablesError) throw tablesError;

            const { data: areas, error: areasError } = await supabase
                .from('seating_areas')
                .select('*')
                .eq('business_id', user.business_id);

            if (areasError) throw areasError;

            const areaMap = (areas || []).reduce((acc, area) => {
                acc[area.id] = area.name;
                return acc;
            }, {});

            // 2. Fetch All Payments (This might be heavy, in real app we might aggregate on DB side or limit range)
            // For now, fetching fields needed for aggregation.
            const { data: payments, error: paymentsError } = await supabase
                .from('payments')
                .select('table_id, amount, created_at')
                .eq('business_id', user.business_id);

            if (paymentsError) throw paymentsError;

            // 3. Aggregate Data
            const today = new Date().toISOString().split('T')[0];

            const paymentStats = (payments || []).reduce((acc, p) => {
                if (!p.table_id) return acc;

                if (!acc[p.table_id]) {
                    acc[p.table_id] = {
                        total: 0,
                        today: 0,
                        lastOrderDate: null
                    };
                }

                const amount = parseFloat(p.amount) || 0;
                const pDate = new Date(p.created_at);
                const pDateStr = pDate.toISOString().split('T')[0];

                acc[p.table_id].total += amount;

                if (pDateStr === today) {
                    acc[p.table_id].today += amount;
                }

                if (!acc[p.table_id].lastOrderDate || pDate > new Date(acc[p.table_id].lastOrderDate)) {
                    acc[p.table_id].lastOrderDate = p.created_at;
                }

                return acc;
            }, {});

            // 4. Merge
            const merged = tables.map(table => {
                const stats = paymentStats[table.id] || { total: 0, today: 0, lastOrderDate: null };
                const areaName = areaMap[table.seating_area_id];
                return {
                    id: table.id,
                    tableName: table.name,
                    areaName: areaName || 'Tanımsız Alan',
                    fullName: areaName ? `${areaName} - ${table.name}` : table.name,
                    lastOrderDate: stats.lastOrderDate, // formatting needed
                    todayTotal: stats.today,
                    grandTotal: stats.total
                };
            });

            // Sort by Grand Total Descending (as requested: "toplamdan 0 a doğru")
            merged.sort((a, b) => b.grandTotal - a.grandTotal);

            setTablesData(merged);

        } catch (err) {
            console.error('Error fetching table reports:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchTableReports();
    }, [user]);

    // Filter logic
    const filteredTables = tablesData.filter(t => {
        if (!searchTerm) return true;
        return t.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('tr-TR', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            <Armchair className="text-[#5D5FEF]" size={28} />
                            Masa Raporları
                            <span className="text-sm font-bold text-gray-400 ml-2">Pano • Raporlar • Masa Raporları</span>
                        </h1>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Filtreler</h3>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Masa Adı"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 transition-all placeholder:text-gray-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            className="bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] px-8 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all active:scale-95 uppercase tracking-wide"
                            onClick={() => { }} // Already filtering in real-time or trigger refetch if server-side
                        >
                            <Search size={18} />
                            Filtrele
                        </button>
                    </div>
                </div>

                {/* Table List */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50">
                        <h3 className="text-[#3B82F6] font-black text-sm uppercase tracking-wide">Masa Listesi</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Bölüm</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Masa</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Son Sipariş Tarihi</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Bugün</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Toplam</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">İşlemler</th>
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
                                ) : filteredTables.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-12 text-center text-gray-400 font-bold text-sm">
                                            Kayıt bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTables.map((table) => (
                                        <tr key={table.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-bold text-gray-500">{table.areaName}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-black text-gray-700">{table.tableName}</span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="text-sm font-bold text-gray-500 font-mono">{formatDate(table.lastOrderDate)}</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-sm font-black text-gray-700">{formatCurrency(table.todayTotal)}</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-sm font-black text-gray-700">{formatCurrency(table.grandTotal)}</span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <button
                                                    onClick={() => navigate(`/isletme/raporlar/satis/masa/${table.id}`)}
                                                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-indigo-50 hover:text-[#5D5FEF] text-gray-500 flex items-center justify-center transition-all active:scale-95"
                                                    title="Detay Görüntüle"
                                                >
                                                    <Eye size={16} />
                                                </button>
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

export default TableReports;
