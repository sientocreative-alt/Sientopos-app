import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    Calendar,
    Search,
    Search as SearchIcon,
    RefreshCw,
    Eye,
    X,
    TrendingUp,
    LayoutGrid,
    Clock,
    User,
    ChevronDown,
    Filter,
    FileText
} from 'lucide-react';

const OrderHistory = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [tableDetails, setTableDetails] = useState({});

    // Fetch table names and seating areas for lookup
    useEffect(() => {
        const fetchDetails = async () => {
            if (!user?.business_id) return;

            // 1. Fetch Seating Areas
            const { data: areas } = await supabase
                .from('seating_areas')
                .select('id, name')
                .eq('business_id', user.business_id);

            const areaMap = {};
            if (areas) {
                areas.forEach(a => areaMap[a.id] = a.name);
            }

            // 2. Fetch Tables
            const { data: tables } = await supabase
                .from('tables')
                .select('id, name, seating_area_id')
                .eq('business_id', user.business_id);

            if (tables) {
                const detailsMap = {};
                tables.forEach(t => {
                    const areaName = areaMap[t.seating_area_id] || 'Genel';
                    detailsMap[t.id] = {
                        tableName: t.name,
                        areaName: areaName,
                        fullName: `${areaName} - Masa ${t.name}`
                    };
                });
                setTableDetails(detailsMap);
            }
        };
        fetchDetails();
    }, [user]);

    const fetchOrderHistory = async () => {
        if (!user?.business_id) return;
        setLoading(true);
        try {
            // Fetch all paid order items in date range
            const { data, error } = await supabase
                .from('order_items')
                .select('*')
                .eq('business_id', user.business_id)
                .eq('status', 'paid')
                .gte('created_at', `${dateRange.startDate}T00:00:00Z`)
                .lte('created_at', `${dateRange.endDate}T23:59:59Z`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Grouping logic: Group by table_id and exact paid_at timestamp
            const sessions = [];
            const grouped = {};

            (data || []).forEach(item => {
                const paidAt = item.paid_at || item.created_at;
                const key = `${item.table_id}_${paidAt}`;

                if (!grouped[key]) {
                    const detail = tableDetails[item.table_id] || { tableName: 'Bilinmeyen', areaName: 'Bilinmeyen', fullName: 'Bilinmeyen Masa' };
                    grouped[key] = {
                        id: item.id.substring(0, 8),
                        adisyonNo: '000',
                        tableId: item.table_id,
                        tableName: detail.tableName,
                        areaName: detail.areaName,
                        fullLocation: detail.fullName,
                        customerCount: 0,
                        openingTime: item.created_at,
                        closingTime: paidAt,
                        totalAmount: 0,
                        discount: 0,
                        paidAmount: 0,
                        paymentType: item.payment_type || 'Nakit',
                        paidByName: item.paid_by_name || 'Sistem',
                        items: []
                    };
                }

                const itemTotal = (parseFloat(item.price) + (item.modifiers?.reduce((sum, m) => sum + parseFloat(m.price || 0), 0) || 0)) * item.quantity;

                if (item.metadata?.is_discount) {
                    grouped[key].discount += Math.abs(itemTotal);
                    grouped[key].paidAmount += itemTotal;
                } else {
                    grouped[key].totalAmount += itemTotal;
                    grouped[key].paidAmount += itemTotal;
                    grouped[key].items.push(item);
                }

                // Update opening time to the earliest item in the session
                if (new Date(item.created_at) < new Date(grouped[key].openingTime)) {
                    grouped[key].openingTime = item.created_at;
                }
            });

            const sortedOrders = Object.values(grouped).sort((a, b) => new Date(b.closingTime) - new Date(a.closingTime));

            // Assign sequential numbers based on current list
            const totalCount = sortedOrders.length;
            sortedOrders.forEach((o, i) => {
                o.adisyonNo = (totalCount - i).toString().padStart(3, '0');
            });

            setOrders(sortedOrders);
        } catch (err) {
            console.error('Error fetching order history:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderHistory();
    }, [user, dateRange, tableDetails]);

    const openDetails = (order) => {
        setSelectedOrder(order);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="p-4 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[98%] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            <FileText className="text-[#5D5FEF]" size={28} />
                            Adisyon Geçmişi
                            <span className="ml-2 px-3 py-1 bg-[#5D5FEF]/10 text-[#5D5FEF] text-sm rounded-full font-black">
                                {orders.length}
                            </span>
                        </h1>
                        <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            Geçmiş Siparişler ve Ödeme Detayları
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
                            onClick={fetchOrderHistory}
                            className="flex items-center gap-2 bg-[#5D5FEF] hover:bg-[#4B4DDF] text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg shadow-indigo-100 active:scale-95 uppercase tracking-wider"
                        >
                            <SearchIcon size={18} />
                            Filtrele
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Adisyon Numarası</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Masa</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Müşteri Sayısı</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Oluşturulma Saati</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Kapatılma Saati</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Toplam Tutar</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">İndirim Tutarı</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Ödenen Tutar</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <RefreshCw className="text-[#5D5FEF] animate-spin" size={32} />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Veriler Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Search size={48} className="text-gray-200" />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seçili tarihlerde adisyon bulunamadı</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-6 text-center">
                                                <span className="text-sm font-black text-gray-700">{order.adisyonNo}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#5D5FEF] flex items-center justify-center">
                                                        <LayoutGrid size={14} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-gray-700">{order.fullLocation}</span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.areaName}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center text-sm font-black text-gray-400">{order.customerCount}</td>
                                            <td className="px-8 py-6 text-sm font-bold text-gray-500">
                                                {new Date(order.openingTime).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-8 py-6 text-sm font-bold text-gray-500">
                                                {new Date(order.closingTime).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-8 py-6 text-sm font-black text-gray-800">{order.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                            <td className="px-8 py-6 text-sm font-bold text-gray-400">{order.discount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl">
                                                    {order.paidAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button
                                                    onClick={() => openDetails(order)}
                                                    className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-[#5D5FEF] hover:text-white transition-all shadow-sm active:scale-90"
                                                >
                                                    <Eye size={18} />
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

            {/* Detail Modal */}
            {isDetailModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
                                    HESAP DETAY – Adisyon: {selectedOrder.adisyonNo}
                                </h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Sipariş İçeriği ve Ödeme Bilgisi</p>
                            </div>
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-all border border-transparent hover:border-red-100"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                        <th className="pb-4">AD</th>
                                        <th className="pb-4 text-center">DURUM</th>
                                        <th className="pb-4 text-center">TUTAR</th>
                                        <th className="pb-4 text-center">TARİH</th>
                                        <th className="pb-4 text-center">SAAT</th>
                                        <th className="pb-4 text-right">EKLEYEN PERSONEL</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {selectedOrder.items.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 font-black text-gray-700 text-sm">
                                                {item.quantity}x {item.name}
                                                {item.modifiers?.length > 0 && (
                                                    <div className="text-[10px] text-gray-400 font-bold mt-1">
                                                        + {item.modifiers.map(m => m.name).join(', ')}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 text-center">
                                                {item.status === 'gift' && <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[9px] font-black rounded uppercase">İKRAM</span>}
                                                {item.status === 'waste' && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black rounded uppercase">ATIK</span>}
                                                {item.status === 'paid' && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[9px] font-black rounded uppercase">ÖDENDİ</span>}
                                            </td>
                                            <td className="py-4 text-center font-black text-gray-900 text-sm">
                                                {((parseFloat(item.price) + (item.modifiers?.reduce((sum, m) => sum + parseFloat(m.price || 0), 0) || 0)) * item.quantity).toFixed(2)} ₺
                                            </td>
                                            <td className="py-4 text-center text-sm font-bold text-gray-500">
                                                {new Date(item.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'short' })}
                                            </td>
                                            <td className="py-4 text-center text-sm font-black text-gray-700">
                                                {new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </td>
                                            <td className="py-4 text-right font-black text-gray-700 text-sm">{item.staff_name || 'Sistem'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-8 bg-gray-50/50 border-t border-gray-100 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">ÖDEME TÜRE</div>
                                    <div className="text-sm font-black text-gray-700 flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${selectedOrder.paymentType === 'cash' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                                        {selectedOrder.paymentType === 'cash' ? 'Nakit' : 'Kredi Kartı'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">ÖDEMEYİ ALAN</div>
                                    <div className="text-sm font-black text-gray-700 text-center">
                                        {selectedOrder.paidByName || 'Sistem'}
                                    </div>
                                </div>
                                <div className="text-center space-y-1">
                                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">TUTAR</div>
                                    <div className="text-3xl font-black text-gray-900 tracking-tighter">
                                        {selectedOrder.paidAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    </div>
                                </div>
                                <div className="text-center space-y-1">
                                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">TARİH</div>
                                    <div className="text-sm font-black text-gray-700 text-center">
                                        {new Date(selectedOrder.closingTime).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'short' })}
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">SAAT</div>
                                    <div className="text-sm font-black text-gray-700">
                                        {new Date(selectedOrder.closingTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderHistory;
